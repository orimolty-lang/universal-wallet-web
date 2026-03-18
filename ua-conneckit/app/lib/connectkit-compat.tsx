"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Magic as MagicBase } from "magic-sdk";
import { EVMExtension } from "@magic-ext/evm";
import { WebAuthnExtension } from "@magic-ext/webauthn";
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
  const [magic, setMagic] = useState<MagicBase<[EVMExtension, WebAuthnExtension]> | null>(null);
  const [address, setAddress] = useState<`0x${string}` | undefined>(undefined);

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_MAGIC_API_KEY || "pk_live_AB1F8BDA7B5395CC";

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
        new WebAuthnExtension(),
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

  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [loginMode, setLoginMode] = useState<"email" | "passkey" | "ui">("email");
  const [emailInput, setEmailInput] = useState("");
  const [usernameInput, setUsernameInput] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginBusy, setLoginBusy] = useState(false);

  const refreshAddress = useCallback(async () => {
    if (!magic) return;
    const info = await magic.user.getInfo();
    const publicAddress = info?.wallets?.ethereum?.publicAddress;
    if (publicAddress) setAddress(publicAddress as `0x${string}`);
  }, [magic]);

  const login = useCallback(async () => {
    if (!magic) {
      window.alert("Magic is not configured. Set NEXT_PUBLIC_MAGIC_API_KEY and rebuild.");
      return;
    }
    setLoginError(null);
    setLoginMode("email");
    setLoginModalOpen(true);
  }, [magic]);

  const submitLogin = useCallback(async () => {
    if (!magic) return;
    setLoginBusy(true);
    setLoginError(null);

    try {
      if (loginMode === "email") {
        if (!emailInput.trim()) throw new Error("Email is required");
        await magic.auth.loginWithEmailOTP({ email: emailInput.trim() });
      } else if (loginMode === "passkey") {
        if (!usernameInput.trim()) throw new Error("Username is required for passkey login");
        const webauthn = magic.webauthn as unknown as {
          login: (args: { username: string }) => Promise<unknown>;
          registerNewUser: (args: { username: string }) => Promise<unknown>;
        };
        try {
          await webauthn.login({ username: usernameInput.trim() });
        } catch {
          await webauthn.registerNewUser({ username: usernameInput.trim() });
        }
      } else {
        const walletWithUi = magic.wallet as unknown as { connectWithUI?: () => Promise<unknown> };
        if (walletWithUi?.connectWithUI) {
          await walletWithUi.connectWithUI();
        } else {
          throw new Error("Hosted auth UI not available");
        }
      }

      await refreshAddress();
      setLoginModalOpen(false);
      setEmailInput("");
      setUsernameInput("");
    } catch (e) {
      setLoginError(e instanceof Error ? e.message : "Login failed");
    } finally {
      setLoginBusy(false);
    }
  }, [magic, loginMode, emailInput, usernameInput, refreshAddress]);

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

  return (
    <CompatContext.Provider value={value}>
      {children}

      {loginModalOpen && (
        <div className="fixed inset-0 z-[120] bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#151515] border border-zinc-800 p-4 space-y-3">
            <div className="text-white font-bold text-lg">Login</div>

            <div className="grid grid-cols-3 gap-2">
              {(["email", "passkey", "ui"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setLoginMode(m)}
                  className={`py-2 rounded-lg text-sm ${loginMode === m ? "bg-accent-dynamic text-black font-semibold" : "bg-zinc-800 text-gray-300"}`}
                >
                  {m === "ui" ? "social" : m}
                </button>
              ))}
            </div>

            {loginMode === "email" && (
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white outline-none"
              />
            )}

            {loginMode === "passkey" && (
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="passkey username"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white outline-none"
              />
            )}

            {loginError && <div className="text-red-400 text-xs">{loginError}</div>}

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setLoginModalOpen(false)}
                className="flex-1 py-2 rounded-lg bg-zinc-800 text-gray-300"
                disabled={loginBusy}
              >
                Cancel
              </button>
              <button
                onClick={submitLogin}
                className="flex-1 py-2 rounded-lg bg-accent-dynamic text-black font-semibold disabled:opacity-60"
                disabled={loginBusy}
              >
                {loginBusy ? "Working..." : "Continue"}
              </button>
            </div>
          </div>
        </div>
      )}
    </CompatContext.Provider>
  );
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
  const magicConfigured = !!(process.env.NEXT_PUBLIC_MAGIC_API_KEY || "pk_live_AB1F8BDA7B5395CC");
  return (
    <button
      onClick={isConnected ? logout : login}
      className="w-full bg-accent-dynamic text-black font-bold py-4 rounded-full hover:opacity-90 transition-opacity"
      title={magicConfigured ? "Magic auth ready" : "Magic key missing"}
    >
      {isConnected && address
        ? `${address.slice(0, 6)}...${address.slice(-4)}`
        : magicConfigured
          ? label
          : "Magic key missing"}
    </button>
  );
}
