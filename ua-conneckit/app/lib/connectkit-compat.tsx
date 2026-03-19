"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo } from "react";
import { BrowserProvider, getBytes } from "ethers";
import {
  PrivyProvider,
  useLogin,
  usePrivy,
  useCreateWallet,
  useSign7702Authorization,
  useSignMessage,
  useWallets as usePrivyWallets,
} from "@privy-io/react-auth";
import { arbitrum, avalanche, base, bsc, mainnet, optimism, polygon } from "viem/chains";

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
});

function PrivyAuthInner({ children }: React.PropsWithChildren) {
  const { ready, authenticated, logout, exportWallet } = usePrivy();
  const { login } = useLogin();
  const { createWallet } = useCreateWallet();
  const { wallets } = usePrivyWallets();
  const { signAuthorization } = useSign7702Authorization();
  const { signMessage: signMessagePrivy } = useSignMessage();

  const embeddedWallet = useMemo(
    () => wallets?.find((w) => w.walletClientType === "privy") || wallets?.[0],
    [wallets]
  );
  const address = embeddedWallet?.address as `0x${string}` | undefined;

  // Ensure embedded wallet exists (like Particle example)
  useEffect(() => {
    if (!ready || !authenticated) return;
    const hasEmbedded = embeddedWallet != null;
    if (!hasEmbedded) {
      createWallet().catch((err) => console.warn("[Privy] createWallet:", err));
    }
  }, [ready, authenticated, embeddedWallet, createWallet]);

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
    }),
    [ready, authenticated, address, doLogin, doLogout, getWalletClient, sign7702Authorization, signMessage, exportWallet]
  );

  return <CompatContext.Provider value={value}>{children}</CompatContext.Provider>;
}

export function MagicAuthProvider({ children }: React.PropsWithChildren) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID || "cmmvrmj1503730cjx4s1nu78t";
  const clientId = process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID || "client-WY6WwYjqhoUurxz6sQNKp3pBWkrdLC85MyF5LePfSyn5f";

  return (
    <PrivyProvider
      appId={appId}
      clientId={clientId || undefined}
      config={{
        appearance: { theme: "dark" },
        loginMethods: ["email", "google", "apple", "passkey"],
        embeddedWallets: {
          ethereum: {
            createOnLogin: "all-users",
          },
          showWalletUIs: true,
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
