"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Loader2, TrendingUp } from "lucide-react";
import BottomSheet from "../../components/BottomSheet";
import type { UniversalAccount } from "@particle-network/universal-account-sdk";
import { CHAIN_ID, SUPPORTED_TOKEN_TYPE } from "@particle-network/universal-account-sdk";
import type { IAssetsResponse } from "@particle-network/universal-account-sdk";
import { useWallets, useAccount } from "@particle-network/connectkit";
import {
  fetchEarnVaults,
  buildMorphoDepositTx,
  type EarnVaultWithApy,
} from "../lib/earnService";

type WalletClientLike = {
  account?: { address?: `0x${string}` };
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  signMessage?: (args: { message: string | { raw: `0x${string}` } }) => Promise<unknown>;
};

const signUniversalRootHash = async (
  walletClient: WalletClientLike,
  rootHash: `0x${string}`,
  signerAddress?: `0x${string}`,
  blindSigningEnabled?: boolean
): Promise<string> => {
  const signer = signerAddress || walletClient.account?.address;
  if (!signer) throw new Error("Signer address unavailable");

  if (blindSigningEnabled && walletClient.signMessage) {
    try {
      const sig = await walletClient.signMessage({ message: { raw: rootHash } });
      if (typeof sig === "string" && sig.startsWith("0x")) return sig;
    } catch {
      // fallback
    }
  }

  const sig = await walletClient.request({
    method: "personal_sign",
    params: [rootHash, signer],
  });
  if (typeof sig !== "string") throw new Error("Invalid signature");
  return sig;
};

const CHAIN_ID_MAP: Record<number, number> = {
  1: CHAIN_ID.ETHEREUM_MAINNET,
  8453: CHAIN_ID.BASE_MAINNET,
  42161: CHAIN_ID.ARBITRUM_MAINNET_ONE,
  10: CHAIN_ID.OPTIMISM_MAINNET,
  137: CHAIN_ID.POLYGON_MAINNET,
  56: CHAIN_ID.BSC_MAINNET,
  43114: CHAIN_ID.AVALANCHE_MAINNET,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ASSET_TO_TOKEN_TYPE: Record<string, any> = {
  USDC: SUPPORTED_TOKEN_TYPE.USDC,
  USDT: SUPPORTED_TOKEN_TYPE.USDT,
  ETH: SUPPORTED_TOKEN_TYPE.ETH,
};

interface EarnModalProps {
  isOpen: boolean;
  onClose: () => void;
  assets: IAssetsResponse | null;
  universalAccount: UniversalAccount | null;
  blindSigningEnabled: boolean;
  onSuccess?: () => void;
}

export default function EarnModal({
  isOpen,
  onClose,
  assets,
  universalAccount,
  blindSigningEnabled,
  onSuccess,
}: EarnModalProps) {
  const [primaryWallet] = useWallets();
  const { address } = useAccount();
  const [vaults, setVaults] = useState<EarnVaultWithApy[]>([]);
  const [isLoadingVaults, setIsLoadingVaults] = useState(false);
  const [selectedVault, setSelectedVault] = useState<EarnVaultWithApy | null>(null);
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txResult, setTxResult] = useState<{ txId: string } | null>(null);
  const [chainFilter, setChainFilter] = useState<number | "all">("all");

  const fetchVaults = useCallback(async () => {
    setIsLoadingVaults(true);
    try {
      const list = await fetchEarnVaults();
      setVaults(list);
    } catch (err) {
      console.error("[Earn] Fetch vaults failed:", err);
      setVaults([]);
    } finally {
      setIsLoadingVaults(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) fetchVaults();
  }, [isOpen, fetchVaults]);

  const filteredVaults =
    chainFilter === "all"
      ? vaults
      : vaults.filter((v) => v.chainId === chainFilter);

  const userUsdcBalance = (() => {
    if (!assets?.assets) return 0;
    const list = assets.assets as Array<{ symbol?: string; amount?: number | string }>;
    const usdc = list.find((a) => (a.symbol || "").toUpperCase() === "USDC");
    if (!usdc) return 0;
    return typeof usdc.amount === "string"
      ? parseFloat(usdc.amount || "0")
      : (usdc.amount || 0);
  })();

  const amountNum = parseFloat(amount || "0");
  const canDeposit =
    selectedVault &&
    amountNum > 0 &&
    amountNum <= userUsdcBalance &&
    universalAccount &&
    primaryWallet &&
    address;

  const handleDeposit = async () => {
    if (!canDeposit || !selectedVault || !universalAccount) return;
    setError(null);
    setIsLoading(true);
    try {
      const receiver = address as string;
      const { approve, deposit } = buildMorphoDepositTx(
        selectedVault,
        amount,
        receiver
      );

      const uaChainId = CHAIN_ID_MAP[selectedVault.chainId] ?? selectedVault.uaChainId;
      const tokenType = ASSET_TO_TOKEN_TYPE[selectedVault.assetSymbol] ?? SUPPORTED_TOKEN_TYPE.USDC;

      const tx = await universalAccount.createUniversalTransaction({
        chainId: uaChainId,
        expectTokens: [{ type: tokenType, amount }],
        transactions: [
          { to: selectedVault.assetAddress as `0x${string}`, data: approve },
          { to: selectedVault.address as `0x${string}`, data: deposit },
        ],
      });

      const walletClient = primaryWallet.getWalletClient();
      if (!walletClient) throw new Error("Wallet not connected");

      const signature = await signUniversalRootHash(
        walletClient as unknown as WalletClientLike,
        (tx as { rootHash: string }).rootHash as `0x${string}`,
        walletClient.account?.address as `0x${string}` | undefined,
        blindSigningEnabled
      );

      const result = await universalAccount.sendTransaction(tx, signature);
      setTxResult({ txId: result.transactionId });
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Deposit failed");
    } finally {
      setIsLoading(false);
    }
  };

  const resetFlow = () => {
    setSelectedVault(null);
    setAmount("");
    setTxResult(null);
    setError(null);
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <div className="px-5 pb-8" style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white text-xl font-bold flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-accent-dynamic" />
            Earn
          </h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <p className="text-gray-400 text-sm mb-4">
          Deposit USDC into yield vaults. Earn interest on supported chains.
        </p>

        {txResult ? (
          <div className="space-y-4">
            <div className="bg-green-900/30 border border-green-500/50 rounded-xl p-4 text-center">
              <p className="text-green-400 font-medium">Deposit sent!</p>
              <a
                href={`https://universalx.app/activity/details?id=${txResult.txId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-dynamic text-sm underline mt-2 block"
              >
                View transaction
              </a>
            </div>
            <button
              onClick={resetFlow}
              className="w-full bg-zinc-700 text-white py-3 rounded-full"
            >
              Deposit more
            </button>
          </div>
        ) : selectedVault ? (
          <div className="space-y-4">
            <button
              onClick={resetFlow}
              className="text-sm text-accent-dynamic hover:brightness-110"
            >
              ← Back to vaults
            </button>

            <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-medium">{selectedVault.name}</span>
                <span className="text-gray-400 text-xs">{selectedVault.chainName}</span>
              </div>
              {selectedVault.apy > 0 && (
                <p className="text-green-400 text-sm">APY: {selectedVault.apy.toFixed(2)}%</p>
              )}
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-2 text-red-300 text-xs">
                {error}
              </div>
            )}

            <div className="bg-zinc-900 rounded-xl p-3 border border-zinc-800">
              <label className="text-gray-400 text-sm mb-2 block">Amount (USDC)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-zinc-950 rounded-xl px-3 py-2 text-white outline-none border border-zinc-800"
              />
              <div className="flex justify-between mt-1">
                <span className="text-gray-500 text-xs">Balance: {userUsdcBalance.toFixed(2)} USDC</span>
                <button
                  type="button"
                  onClick={() => setAmount(userUsdcBalance.toString())}
                  className="text-accent-dynamic text-xs"
                >
                  Max
                </button>
              </div>
            </div>

            <button
              onClick={handleDeposit}
              disabled={!canDeposit || isLoading}
              className="w-full bg-accent-dynamic text-white font-bold py-4 rounded-full hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Depositing..." : "Deposit"}
            </button>
          </div>
        ) : (
          <>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mb-3">
              <button
                onClick={() => setChainFilter("all")}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm ${
                  chainFilter === "all"
                    ? "bg-accent-dynamic text-white"
                    : "bg-zinc-800 text-gray-400"
                }`}
              >
                All
              </button>
              {[1, 8453, 42161, 10, 137, 43114, 56].map((cid) => {
                const name =
                  cid === 1 ? "Ethereum" : cid === 8453 ? "Base" : cid === 42161 ? "Arbitrum" : cid === 10 ? "Optimism" : cid === 137 ? "Polygon" : cid === 43114 ? "Avalanche" : "BNB";
                const hasVaults = vaults.some((v) => v.chainId === cid);
                if (!hasVaults) return null;
                return (
                  <button
                    key={cid}
                    onClick={() => setChainFilter(cid)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm ${
                      chainFilter === cid
                        ? "bg-accent-dynamic text-white"
                        : "bg-zinc-800 text-gray-400"
                    }`}
                  >
                    {name}
                  </button>
                );
              })}
            </div>

            {isLoadingVaults ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-accent-dynamic" />
              </div>
            ) : filteredVaults.length === 0 ? (
              <p className="text-center text-gray-400 py-8">No vaults on this chain</p>
            ) : (
              <div className="space-y-2">
                {filteredVaults.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVault(v)}
                    className="w-full p-4 bg-zinc-900 hover:bg-zinc-800 rounded-xl text-left border border-zinc-800 hover:border-accent-dynamic/40 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-white font-medium">{v.name}</div>
                        <div className="text-gray-400 text-xs mt-0.5">{v.chainName}</div>
                      </div>
                      <div className="text-right">
                        {v.apy > 0 && (
                          <div className="text-green-400 text-sm font-medium">{v.apy.toFixed(2)}% APY</div>
                        )}
                        <div className="text-gray-500 text-xs">{v.assetSymbol}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </BottomSheet>
  );
}
