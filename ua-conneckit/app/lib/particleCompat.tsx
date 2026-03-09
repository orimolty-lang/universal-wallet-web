"use client";

import React from "react";
import { useAuthCore, useConnect, useEthereum } from "@particle-network/authkit";

export const useAccount = () => {
  const { address } = useEthereum();
  const { connected } = useConnect();
  return {
    address: address || undefined,
    isConnected: !!connected && !!address,
  };
};

export const useDisconnect = () => {
  const { disconnect } = useConnect();
  return { disconnect };
};

export const useParticleAuth = () => {
  const { openAccountAndSecurity, openSetMasterPassword } = useAuthCore();
  return { openAccountAndSecurity, openSetMasterPassword };
};

export const useWallets = () => {
  const { provider, address, signMessage, signTypedData } = useEthereum();

  const walletClient = React.useMemo(() => {
    if (!provider) return null;

    return {
      account: address ? { address: address as `0x${string}` } : undefined,
      request: async ({ method, params }: { method: string; params?: unknown[] }) => {
        if (method === "personal_sign") {
          // Accept both shapes: [message, address] and [address, message]
          const p0 = params?.[0] as string | undefined;
          const p1 = params?.[1] as string | undefined;
          const message = (p0?.startsWith("0x") ? p0 : p1) || p0 || "";
          return signMessage(message);
        }

        if (method === "eth_signTypedData_v4") {
          // Expected: [address, typedDataJson]
          const typedDataRaw = params?.[1] as string;
          const typedData = typeof typedDataRaw === "string" ? JSON.parse(typedDataRaw) : typedDataRaw;
          return signTypedData({
            data: typedData,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            version: "V4" as any,
          });
        }

        return provider.request({ method, params: params || [] });
      },
      signMessage: async ({ message }: { message: string | { raw: `0x${string}` } }) => {
        if (typeof message === "string") return signMessage(message);
        return signMessage(message.raw);
      },
    };
  }, [provider, address, signMessage, signTypedData]);

  const primaryWallet = React.useMemo(() => {
    if (!walletClient) return null;
    return {
      getWalletClient: () => walletClient,
    };
  }, [walletClient]);

  return [primaryWallet] as const;
};

export const ConnectButton = ({ label = "Connect" }: { label?: string }) => {
  const { connect, connected, connectionStatus } = useConnect();
  const { address } = useEthereum();

  const onClick = async () => {
    if (connected) return;
    await connect();
  };

  return (
    <button
      onClick={onClick}
      className="px-4 py-2 rounded-xl bg-accent-dynamic text-black font-semibold"
      disabled={connectionStatus === "connecting" || connectionStatus === "loading"}
    >
      {connected && address
        ? `${address.slice(0, 6)}...${address.slice(-4)}`
        : (connectionStatus === "connecting" ? "Connecting..." : label)}
    </button>
  );
};
