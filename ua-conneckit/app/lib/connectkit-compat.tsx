"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { BrowserProvider, getBytes } from "ethers";
import {
  PrivyProvider,
  getEmbeddedConnectedWallet,
  useLogin,
  usePrivy,
  useActiveWallet,
  useCreateWallet,
  useSign7702Authorization,
  useSignMessage,
  useWallets as usePrivyWallets,
} from "@privy-io/react-auth";
import type { ConnectedWallet } from "@privy-io/react-auth";
import { getAddress, isAddress } from "viem";
import { arbitrum, avalanche, base, bsc, mainnet, optimism, polygon } from "viem/chains";
import {
  defaultWalletSlotProfile,
  getProfileForAddress,
  readProfilesMap,
  readWalletOrder,
  setProfileForAddress,
  writeWalletOrder,
  type WalletSlotProfile,
} from "./walletSlotStorage";

export type { WalletSlotProfile } from "./walletSlotStorage";

/** Max embedded Ethereum wallets per Privy user (Omni cap). */
export const MAX_PRIVY_EMBEDDED_WALLETS = 5;

export type EmbeddedWalletRow = {
  address: string;
  profile: WalletSlotProfile;
  isActive: boolean;
};

function applyWalletOrder(rows: EmbeddedWalletRow[], userId: string | undefined): EmbeddedWalletRow[] {
  if (!userId || rows.length <= 1) return rows;
  const pref = readWalletOrder(userId);
  if (pref.length === 0) return rows;
  const m = new Map(rows.map((r) => [r.address.toLowerCase(), r]));
  const out: EmbeddedWalletRow[] = [];
  for (const lo of pref) {
    const hit = m.get(lo);
    if (hit) {
      out.push(hit);
      m.delete(lo);
    }
  }
  const rest = Array.from(m.values()).sort((a, b) =>
    a.address.toLowerCase().localeCompare(b.address.toLowerCase()),
  );
  return [...out, ...rest];
}

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
  /** Profile for the active embedded wallet (per-address). */
  walletProfile: WalletSlotProfile;
  setWalletProfile: (p: WalletSlotProfile) => void;
  embeddedWalletRows: EmbeddedWalletRow[];
  createAdditionalWallet: () => Promise<void>;
  canCreateWallet: boolean;
  isCreatingWallet: boolean;
  /** Persist user-defined order (drag) for wallet switcher list. */
  reorderEmbeddedWallets: (orderedAddressesLower: string[]) => void;
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
  walletProfile: defaultWalletSlotProfile(),
  setWalletProfile: () => {},
  embeddedWalletRows: [],
  createAdditionalWallet: async () => {},
  canCreateWallet: false,
  isCreatingWallet: false,
  reorderEmbeddedWallets: () => {},
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
  const walletsRef = useRef(wallets);
  walletsRef.current = wallets;
  const userRef = useRef(user);
  userRef.current = user;
  const [profileRev, setProfileRev] = useState(0);
  /** Bumps when preferred embedded address changes so pick() re-reads localStorage (wallets[] may be referentially stable). */
  const [walletPickEpoch, setWalletPickEpoch] = useState(0);
  const [walletOrderEpoch, setWalletOrderEpoch] = useState(0);
  const [isCreatingWallet, setIsCreatingWallet] = useState(false);

  const { createWallet } = useCreateWallet({
    onSuccess: ({ wallet }) => {
      const raw = (wallet as { address?: string })?.address;
      if (!raw || !userRef.current?.id) {
        setIsCreatingWallet(false);
        return;
      }
      const addr = getAddress(raw);
      setProfileForAddress(userRef.current.id, addr, defaultWalletSlotProfile());
      writePreferredEmbedded(userRef.current.id, addr);
      const ord = readWalletOrder(userRef.current.id);
      const lo = addr.toLowerCase();
      if (!ord.includes(lo)) writeWalletOrder(userRef.current.id, [...ord, lo]);
      const activate = () => {
        const hit = walletsRef.current?.find(
          (w) => isPrivyEmbeddedEthereum(w) && getAddress(w.address) === addr,
        );
        if (hit) {
          syncedPairRef.current = "";
          setActiveWallet(hit);
        }
        setProfileRev((r) => r + 1);
        setWalletPickEpoch((e) => e + 1);
        setWalletOrderEpoch((e) => e + 1);
        setIsCreatingWallet(false);
      };
      window.setTimeout(activate, 500);
    },
    onError: () => setIsCreatingWallet(false),
  });

  const privyEmbeddedAddresses = useMemo(
    () => (wallets || []).filter(isPrivyEmbeddedEthereum).map((w) => getAddress(w.address)),
    [wallets],
  );

  const embeddedWallet = useMemo(
    () => pickPrivyEmbeddedEthereumWallet(wallets, user?.id),
    [wallets, user?.id, walletPickEpoch],
  );
  const address = embeddedWallet?.address as `0x${string}` | undefined;

  const walletProfile = useMemo(() => {
    void profileRev; // bump when per-address profile saved
    return getProfileForAddress(user?.id, address);
  }, [user?.id, address, profileRev]);

  const setWalletProfile = useCallback(
    (p: WalletSlotProfile) => {
      if (!user?.id || !address) return;
      setProfileForAddress(user.id, address, p);
      setProfileRev((r) => r + 1);
    },
    [user?.id, address],
  );

  const embeddedWalletRows = useMemo((): EmbeddedWalletRow[] => {
    void profileRev;
    void walletOrderEpoch;
    if (!user?.id) return [];
    const sorted = [...(wallets || []).filter(isPrivyEmbeddedEthereum)].sort((a, b) =>
      getAddress(a.address).toLowerCase().localeCompare(getAddress(b.address).toLowerCase()),
    );
    const act = address?.toLowerCase();
    const rows = sorted.map((w) => {
      const addr = getAddress(w.address);
      return {
        address: addr,
        profile: getProfileForAddress(user.id, addr),
        isActive: act === addr.toLowerCase(),
      };
    });
    return applyWalletOrder(rows, user.id);
  }, [wallets, user?.id, address, profileRev, walletOrderEpoch]);

  const canCreateWallet =
    !!(authenticated && user?.id && privyEmbeddedAddresses.length < MAX_PRIVY_EMBEDDED_WALLETS);

  const createAdditionalWallet = useCallback(async () => {
    if (!canCreateWallet) return;
    setIsCreatingWallet(true);
    try {
      await createWallet({ createAdditional: true } as { createAdditional: boolean });
    } catch (e) {
      console.warn("[Privy] createWallet:", e);
    } finally {
      setIsCreatingWallet(false);
    }
  }, [canCreateWallet, createWallet]);

  const reorderEmbeddedWallets = useCallback(
    (orderedAddressesLower: string[]) => {
      if (!user?.id) return;
      const norm = orderedAddressesLower.map((a) => a.trim().toLowerCase()).filter(Boolean);
      writeWalletOrder(user.id, norm);
      setWalletOrderEpoch((e) => e + 1);
    },
    [user?.id],
  );

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
      setWalletPickEpoch((e) => e + 1);
      setProfileRev((r) => r + 1);
      setActiveWallet(hit);
    },
    [wallets, user?.id, setActiveWallet],
  );

  // One-time: migrate legacy single `walletProfile` into per-address map.
  useEffect(() => {
    if (!authenticated || !user?.id || !address) return;
    try {
      const legacy = localStorage.getItem("walletProfile");
      if (!legacy) return;
      const map = readProfilesMap(user.id);
      if (Object.keys(map).length > 0) {
        localStorage.removeItem("walletProfile");
        return;
      }
      const p = JSON.parse(legacy) as Partial<WalletSlotProfile>;
      setProfileForAddress(user.id, address, {
        ...defaultWalletSlotProfile(),
        ...p,
      });
      localStorage.removeItem("walletProfile");
      setProfileRev((r) => r + 1);
    } catch {
      localStorage.removeItem("walletProfile");
    }
  }, [authenticated, user?.id, address]);

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
      "[Omni] Multiple embedded wallets: open Settings → Wallet, or long-press your avatar on Home to pick the funded address.",
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
      walletProfile,
      setWalletProfile,
      embeddedWalletRows,
      createAdditionalWallet,
      canCreateWallet,
      isCreatingWallet,
      reorderEmbeddedWallets,
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
      walletProfile,
      setWalletProfile,
      embeddedWalletRows,
      createAdditionalWallet,
      canCreateWallet,
      isCreatingWallet,
      reorderEmbeddedWallets,
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

export function useWalletAppearance() {
  const ctx = useContext(CompatContext);
  return {
    profile: ctx.walletProfile,
    setProfile: ctx.setWalletProfile,
    embeddedWalletRows: ctx.embeddedWalletRows,
    switchWallet: ctx.setPreferredPrivyEmbeddedAddress,
    createAdditionalWallet: ctx.createAdditionalWallet,
    canCreateWallet: ctx.canCreateWallet,
    isCreatingWallet: ctx.isCreatingWallet,
    reorderEmbeddedWallets: ctx.reorderEmbeddedWallets,
  };
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
