"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Magic as MagicBase } from "magic-sdk";
import { EVMExtension } from "@magic-ext/evm";
import { BrowserProvider, type Eip1193Provider } from "ethers";

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

type CompatContextType = {
  isConnected: boolean;
  address?: `0x${string}`;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  getWalletClient: () => WalletClientLike;
};

const CompatContext = createContext<CompatContextType>({
  isConnected: false,
  address: undefined,
  login: async () => {},
  logout: async () => {},
  getWalletClient: () => {
    throw new Error("Wallet not connected");
  },
});

export function MagicAuthProvider({ children }: React.PropsWithChildren) {
  const [magic, setMagic] = useState<MagicBase<[EVMExtension]> | null>(null);
  const [address, setAddress] = useState<`0x${string}` | undefined>(undefined);

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_MAGIC_API_KEY;
    if (!key) return;

    const m = new MagicBase(key, {
      extensions: [
        new EVMExtension([
          { chainId: 8453, rpcUrl: "https://mainnet.base.org", default: true },
          { chainId: 42161, rpcUrl: "https://arb1.arbitrum.io/rpc" },
          { chainId: 1, rpcUrl: "https://rpc.ankr.com/eth" },
          { chainId: 56, rpcUrl: "https://bsc-dataseed.binance.org" },
          { chainId: 137, rpcUrl: "https://polygon-rpc.com" },
          { chainId: 10, rpcUrl: "https://mainnet.optimism.io" },
          { chainId: 43114, rpcUrl: "https://api.avax.network/ext/bc/C/rpc" },
        ]),
      ],
    });
    setMagic(m);

    (async () => {
      try {
        const loggedIn = await m.user.isLoggedIn();
        if (!loggedIn) return;
        const info = await m.user.getInfo();
        const publicAddress = info?.wallets?.ethereum?.publicAddress;
        if (publicAddress) setAddress(publicAddress as `0x${string}`);
      } catch {
        // no-op
      }
    })();
  }, []);

  const login = useCallback(async () => {
    if (!magic) {
      window.alert("Magic is not configured. Set NEXT_PUBLIC_MAGIC_API_KEY and rebuild.");
      return;
    }

    try {
      // Prefer Magic's hosted auth UI so button click always opens a visible flow.
      const walletWithUi = magic.wallet as unknown as { connectWithUI?: () => Promise<unknown> };
      if (walletWithUi?.connectWithUI) {
        await walletWithUi.connectWithUI();
      } else {
        const email = window.prompt("Enter email for Magic login");
        if (!email) return;
        await magic.auth.loginWithEmailOTP({ email });
      }
    } catch {
      return;
    }

    const info = await magic.user.getInfo();
    const publicAddress = info?.wallets?.ethereum?.publicAddress;
    if (publicAddress) setAddress(publicAddress as `0x${string}`);
  }, [magic]);

  const logout = useCallback(async () => {
    if (!magic) return;
    await magic.user.logout();
    setAddress(undefined);
  }, [magic]);

  const getWalletClient = useCallback((): WalletClientLike => {
    if (!magic || !address) throw new Error("Wallet not connected");
    const magicProvider = (magic as unknown as { rpcProvider: Eip1193Provider }).rpcProvider;

    const request = async ({ method, params }: { method: string; params?: unknown[] }) => {
      const provider = new BrowserProvider(magicProvider);
      return provider.send(method, params || []);
    };

    return {
      account: { address },
      request,
      signMessage: async ({ account, message }) => {
        const raw = typeof message === "string" ? message : message.raw;
        const signerAddress = account || address;
        const sig = await request({ method: "personal_sign", params: [raw, signerAddress] });
        if (typeof sig !== "string") throw new Error("Invalid signature response");
        return sig;
      },
      signTypedData: async ({ domain, types, message }) => {
        const provider = new BrowserProvider(magicProvider);
        const signer = await provider.getSigner();
        return signer.signTypedData(domain, types, message);
      },
    };
  }, [magic, address]);

  const value = useMemo(
    () => ({ isConnected: !!address, address, login, logout, getWalletClient }),
    [address, login, logout, getWalletClient]
  );

  return <CompatContext.Provider value={value}>{children}</CompatContext.Provider>;
}

export function useAccount() {
  const { isConnected, address } = useContext(CompatContext);
  return { isConnected, address };
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
    >
      {isConnected && address ? `${address.slice(0, 6)}...${address.slice(-4)}` : label}
    </button>
  );
}
