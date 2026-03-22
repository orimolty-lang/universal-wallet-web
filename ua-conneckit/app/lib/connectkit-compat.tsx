"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef } from "react";
import { BrowserProvider, getBytes } from "ethers";
import {
  PrivyProvider,
  getEmbeddedConnectedWallet,
  useLogin,
  usePrivy,
  useActiveWallet,
  useSign7702Authorization,
  useSignMessage,
  useWallets as usePrivyWallets,
} from "@privy-io/react-auth";
import type { ConnectedWallet } from "@privy-io/react-auth";
import { getAddress, isAddress } from "viem";
import { arbitrum, avalanche, base, bsc, mainnet, optimism, polygon } from "viem/chains";

/** Per-Privy-user preferred embedded EVM address (stable selection when multiple exist). */
const PREFERRED_EMBEDDED_KEY_PREFIX = "omni_privy_preferred_embedded_v1";

function preferredEmbeddedStorageKey(userId: string) {
  return `${PREFERRED_EMBEDDED_KEY_PREFIX}_${userId}`;
}

function readPreferredEmbedded(userId: string): string | null {
  try {
    if (typeof window === "undefined") return null;
    const v = window.localStorage.getItem(preferredEmbeddedStorageKey(userId))?.trim().toLowerCase();
    return v || null;
  } catch {
    return null;
  }
}

function writePreferredEmbedded(userId: string, addr: string) {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(preferredEmbeddedStorageKey(userId), getAddress(addr));
  } catch {
    // private mode / blocked
  }
}

/** Optional build-time default when user has multiple embedded wallets (e.g. recovery). */
const EMBEDDED_ADDR_PIN = process.env.NEXT_PUBLIC_PRIVY_PIN_EMBEDDED_ADDRESS?.trim();

type WalletClientLike = {
  account?: { address?: `0x${string}` };
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  signMessage: (args: { account?: `0x${string}`; message: string | { raw: `0x${string}` } }) => Promise<string>;
  signTypedData: (args: {
    domain: Record<string, unknown>;
    types: Record<string, Array<{ name: string; type: string }>>;
    primaryType: string;
    message: Record<string, unknown>;
  }) => Promise<string>;
};

type Sign7702Fn = (params: {
  contractAddress: `0x${string}`;
  chainId: number;
  nonce: number;
}, options: { address: string }) => Promise<{ r: string; s: string; v?: bigint; yParity: number }>;

type SignMessageFn = (
  params: { message: string },
  options: { uiOptions?: { title?: string }; address: string }
) => Promise<{ signature: string }>;

type ExportWalletFn = (options?: { address?: string }) => Promise<void>;

type CompatContextType = {
  isConnected: boolean;
  address?: `0x${string}`;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  getWalletClient: () => WalletClientLike;
  sign7702Authorization: Sign7702Fn | null;
  signMessage: SignMessageFn | null;
  exportWallet: ExportWalletFn | null;
  /** All Privy embedded Ethereum addresses for this session (for Settings picker). */
  privyEmbeddedAddresses: string[];
  /** Pin which embedded wallet Omni uses (persists per Privy user on this device). */
  setPreferredPrivyEmbeddedAddress: (address: string) => void;
};

const CompatContext = createContext<CompatContextType>({
  isConnected: false,
  address: undefined,
  login: async () => {},
  logout: async () => {},
  getWalletClient: () => {
    throw new Error("Wallet not connected");
  },
  sign7702Authorization: null,
  signMessage: null,
  exportWallet: null,
  privyEmbeddedAddresses: [],
  setPreferredPrivyEmbeddedAddress: () => {},
});

function isPrivyEmbeddedEthereum(w: ConnectedWallet): boolean {
  if (w.walletClientType !== "privy") return false;
  return typeof (w as { getEthereumProvider?: () => Promise<unknown> }).getEthereumProvider === "function";
}

function pickPrivyEmbeddedEthereumWallet(
  wallets: ConnectedWallet[] | undefined,
  userId: string | undefined,
): ConnectedWallet | null {
  const list = (wallets || []).filter(isPrivyEmbeddedEthereum);
  if (list.length === 0) {
    return getEmbeddedConnectedWallet(wallets || []) || wallets?.[0] || null;
  }
  if (list.length === 1) return list[0];

  const uid = userId;
  if (uid) {
    if (EMBEDDED_ADDR_PIN && isAddress(EMBEDDED_ADDR_PIN)) {
      const pin = getAddress(EMBEDDED_ADDR_PIN).toLowerCase();
      const byPin = list.find((w) => getAddress(w.address).toLowerCase() === pin);
      if (byPin) {
        writePreferredEmbedded(uid, byPin.address);
        return byPin;
      }
    }
    const stored = readPreferredEmbedded(uid);
    if (stored) {
      const hit = list.find((w) => getAddress(w.address).toLowerCase() === stored);
      if (hit) return hit;
    }
  }

  const sorted = [...list].sort((a, b) =>
    getAddress(a.address).toLowerCase().localeCompare(getAddress(b.address).toLowerCase()),
  );
  return sorted[0] ?? null;
}

function PrivyAuthInner({ children }: React.PropsWithChildren) {
  const { ready, authenticated, logout, exportWallet, user } = usePrivy();
  const { login } = useLogin();
  const { wallets, ready: walletsReady } = usePrivyWallets();
  const { setActiveWallet, wallet: activePrivyWallet } = useActiveWallet();
  const { signAuthorization } = useSign7702Authorization();
  const { signMessage: signMessagePrivy } = useSignMessage();
  const syncedPairRef = useRef<string>("");

  const privyEmbeddedAddresses = useMemo(
    () => (wallets || []).filter(isPrivyEmbeddedEthereum).map((w) => getAddress(w.address)),
    [wallets],
  );

  const embeddedWallet = useMemo(
    () => pickPrivyEmbeddedEthereumWallet(wallets, user?.id),
    [wallets, user?.id],
  );
  const address = embeddedWallet?.address as `0x${string}` | undefined;

  const setPreferredPrivyEmbeddedAddress = useCallback(
    (addr: string) => {
      if (!user?.id || !isAddress(addr)) return;
      const norm = getAddress(addr);
      const hit = (wallets || []).find(
        (w) => isPrivyEmbeddedEthereum(w) && getAddress(w.address) === norm,
      );
      if (!hit) return;
      writePreferredEmbedded(user.id, hit.address);
      syncedPairRef.current = "";
      setActiveWallet(hit);
    },
    [wallets, user?.id, setActiveWallet],
  );

  // Keep Privy "active" wallet aligned with our pick (critical when multiple embedded wallets exist).
  useEffect(() => {
    if (!ready || !authenticated || !walletsReady || !embeddedWallet) return;
    const t = getAddress(embeddedWallet.address);
    const a =
      activePrivyWallet && "address" in activePrivyWallet
        ? getAddress((activePrivyWallet as { address: string }).address)
        : null;
    const pair = `${t}:${a ?? ""}`;
    if (pair === syncedPairRef.current && a === t) return;
    if (a === t) {
      syncedPairRef.current = pair;
      return;
    }
    try {
      setActiveWallet(embeddedWallet);
      syncedPairRef.current = `${t}:${t}`;
    } catch (e) {
      console.warn("[Privy] setActiveWallet failed:", e);
    }
  }, [ready, authenticated, walletsReady, embeddedWallet, activePrivyWallet, setActiveWallet]);

  // Single embedded wallet: always persist so UA stays stable across sessions.
  useEffect(() => {
    if (!authenticated || !user?.id || !embeddedWallet) return;
    const n = privyEmbeddedAddresses.length;
    if (n === 1) {
      writePreferredEmbedded(user.id, embeddedWallet.address);
    }
  }, [authenticated, user?.id, embeddedWallet, privyEmbeddedAddresses.length]);

  useEffect(() => {
    if (!authenticated || !user?.id || privyEmbeddedAddresses.length <= 1) return;
    const stored = readPreferredEmbedded(user.id);
    if (stored) return;
    console.warn(
      "[Omni] Multiple Privy embedded wallets detected. Open Settings → Wallet to choose the funded address, or set NEXT_PUBLIC_PRIVY_PIN_EMBEDDED_ADDRESS for one-time deploy recovery.",
    );
  }, [authenticated, user?.id, privyEmbeddedAddresses.length]);

  const doLogin = useCallback(async () => {
    await login();
  }, [login]);

  const doLogout = useCallback(async () => {
    await logout();
  }, [logout]);

  const getWalletClient = useCallback((): WalletClientLike => {
    if (!embeddedWallet || !address) throw new Error("Wallet not connected");

    const request = async ({ method, params }: { method: string; params?: unknown[] }) => {
      if (method === "magic_wallet_sign_7702_authorization") {
        const p = (params?.[0] || {}) as {
          contractAddress?: string;
          address?: string;
          chainId?: number;
          nonce?: number;
        };
        const contractAddress = (p.contractAddress || p.address) as `0x${string}` | undefined;
        if (!contractAddress || !p.chainId) throw new Error("Invalid 7702 authorization params");
        return signAuthorization(
          {
            contractAddress,
            chainId: Number(p.chainId),
            nonce: p.nonce,
          },
          { address }
        );
      }

      if (method === "wallet_switchEthereumChain") {
        const provider = await embeddedWallet.getEthereumProvider();
        return provider.request({ method, params });
      }

      if (method === "eth_send7702Transaction") {
        const provider = await embeddedWallet.getEthereumProvider();
        return provider.request({ method, params });
      }

      const provider = await embeddedWallet.getEthereumProvider();
      return provider.request({ method, params });
    };

    return {
      account: { address },
      request,
      signMessage: async ({ account, message }) => {
        const raw = typeof message === "string" ? message : message.raw;
        const provider = await embeddedWallet.getEthereumProvider();
        const browserProvider = new BrowserProvider(provider);
        const signer = await browserProvider.getSigner(account || address);
        return signer.signMessage(getBytes(raw));
      },
      signTypedData: async ({ domain, types, message }) => {
        const provider = await embeddedWallet.getEthereumProvider();
        const browserProvider = new BrowserProvider(provider);
        const signer = await browserProvider.getSigner(address);
        return signer.signTypedData(domain, types, message);
      },
    };
  }, [embeddedWallet, address, signAuthorization]);

  const sign7702Authorization = useCallback<Sign7702Fn>(
    (params, options) =>
      signAuthorization(
        { contractAddress: params.contractAddress, chainId: params.chainId, nonce: params.nonce },
        { address: options.address }
      ),
    [signAuthorization]
  );

  const signMessage = useCallback<SignMessageFn>(
    (params, options) =>
      signMessagePrivy(
        { message: params.message },
        { uiOptions: options.uiOptions ?? { title: "Sign transaction" }, address: options.address }
      ),
    [signMessagePrivy]
  );

  const value = useMemo(
    () => ({
      isConnected: !!(ready && authenticated && address),
      address,
      login: doLogin,
      logout: doLogout,
      getWalletClient,
      sign7702Authorization: address ? sign7702Authorization : null,
      signMessage: address ? signMessage : null,
      exportWallet: address ? (exportWallet as ExportWalletFn) : null,
      privyEmbeddedAddresses,
      setPreferredPrivyEmbeddedAddress,
    }),
    [
      ready,
      authenticated,
      address,
      doLogin,
      doLogout,
      getWalletClient,
      sign7702Authorization,
      signMessage,
      exportWallet,
      privyEmbeddedAddresses,
      setPreferredPrivyEmbeddedAddress,
    ]
  );

  return <CompatContext.Provider value={value}>{children}</CompatContext.Provider>;
}

export function MagicAuthProvider({ children }: React.PropsWithChildren) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID || "cmmvrmj1503730cjx4s1nu78t";
  const clientId = process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID || "client-WY6WwYjqhoUurxz6sQNKp3pBWkrdLC85MyF5LePfSyn5f";

  const hostedLoginLogoUrl = process.env.NEXT_PUBLIC_PRIVY_LOGIN_LOGO_URL?.trim();
  const loginHeader = process.env.NEXT_PUBLIC_PRIVY_LOGIN_HEADER?.trim() || "Omni";
  const loginMessageEnv = process.env.NEXT_PUBLIC_PRIVY_LOGIN_MESSAGE?.trim();
  const accentHex = process.env.NEXT_PUBLIC_PRIVY_ACCENT_COLOR?.trim();

  return (
    <PrivyProvider
      appId={appId}
      clientId={clientId || undefined}
      config={{
        appearance: {
          theme: "dark",
          /**
           * Omit `logo` unless this env is set so Privy uses the hosted logo from the dashboard
           * (Configuration → UI). Passing a default URL here overrides that and showed the wrong asset.
           */
          ...(hostedLoginLogoUrl ? { logo: hostedLoginLogoUrl } : {}),
          landingHeader: loginHeader,
          ...(loginMessageEnv ? { loginMessage: loginMessageEnv.slice(0, 100) } : {}),
          /** Replaces the default “Protected by Privy” footer graphic (SDK renders nothing else in its place). */
          // @ts-expect-error `footerLogo` is merged in the SDK (ModalHeader BlobbyFooter) but missing from published typings.
          footerLogo: <span style={{ display: "block", height: 0, overflow: "hidden" }} aria-hidden />,
          ...(accentHex && /^#[0-9A-Fa-f]{6}$/.test(accentHex) ? { accentColor: accentHex as `#${string}` } : {}),
        },
        loginMethods: ["email", "google", "apple", "passkey"],
        embeddedWallets: {
          ethereum: {
            // Only create when the user has no wallet yet — avoids extra embedded wallets on every login.
            createOnLogin: "users-without-wallets",
          },
          showWalletUIs: false,
        },
        defaultChain: base,
        supportedChains: [base, optimism, arbitrum, polygon, bsc, mainnet, avalanche],
      }}
    >
      <PrivyAuthInner>{children}</PrivyAuthInner>
    </PrivyProvider>
  );
}

export function useAccount() {
  const { isConnected, address } = useContext(CompatContext);
  return { isConnected, address };
}

export function useSign7702AuthorizationCompat() {
  const { sign7702Authorization } = useContext(CompatContext);
  return sign7702Authorization;
}

export function useSignMessageCompat() {
  const { signMessage } = useContext(CompatContext);
  return signMessage;
}

export function useExportWalletCompat() {
  const { exportWallet } = useContext(CompatContext);
  return exportWallet;
}

type CompatWallet = { getWalletClient: () => WalletClientLike };

export function useWallets(): CompatWallet[] {
  const { isConnected, getWalletClient } = useContext(CompatContext);
  if (!isConnected) return [];
  return [{ getWalletClient }];
}

export function useDisconnect() {
  const { logout } = useContext(CompatContext);
  return { disconnect: logout };
}

export function usePrivyEmbeddedWalletPrefs() {
  const { privyEmbeddedAddresses, setPreferredPrivyEmbeddedAddress } = useContext(CompatContext);
  return { privyEmbeddedAddresses, setPreferredPrivyEmbeddedAddress };
}

export function useParticleAuth() {
  return {
    openAccountAndSecurity: () => {},
    openSetMasterPassword: () => {},
  };
}

export function ConnectButton({ label = "Connect" }: { label?: string }) {
  const { isConnected, address, login, logout } = useContext(CompatContext);
  return (
    <button
      onClick={isConnected ? logout : login}
      className="w-full bg-accent-dynamic text-black font-bold py-4 rounded-full hover:opacity-90 transition-opacity"
      title={isConnected ? "Connected" : "Connect with Privy"}
    >
      {isConnected && address ? `${address.slice(0, 6)}...${address.slice(-4)}` : label}
    </button>
  );
}
