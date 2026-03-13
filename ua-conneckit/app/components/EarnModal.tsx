"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Loader2, TrendingUp } from "lucide-react";
import BottomSheet from "../../components/BottomSheet";
import type { UniversalAccount } from "@particle-network/universal-account-sdk";
import { CHAIN_ID, SUPPORTED_TOKEN_TYPE } from "@particle-network/universal-account-sdk";
import type { IAssetsResponse } from "@particle-network/universal-account-sdk";
import { useWallets, useAccount } from "@particle-network/connectkit";
import {
  fetchEarnMarkets,
  buildMorphoDepositTx,
  buildAaveSupplyTx,
  formatTvl,
  type EarnMarket,
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
  primaryAssets?: IAssetsResponse | null;
  universalAccount: UniversalAccount | null;
  smartAccountAddress?: string;
  blindSigningEnabled: boolean;
  onSuccess?: () => void;
}

export default function EarnModal({
  isOpen,
  onClose,
  assets,
  primaryAssets,
  universalAccount,
  smartAccountAddress,
  blindSigningEnabled,
  onSuccess,
}: EarnModalProps) {
  const [primaryWallet] = useWallets();
  const { address } = useAccount();
  const [markets, setMarkets] = useState<EarnMarket[]>([]);
  const [isLoadingMarkets, setIsLoadingMarkets] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState<EarnMarket | null>(null);
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txResult, setTxResult] = useState<{ txId: string } | null>(null);
  const [chainFilter, setChainFilter] = useState<number | "all">("all");
  const [protocolFilter, setProtocolFilter] = useState<"all" | "morpho" | "aave">("all");

  const fetchMarkets = useCallback(async () => {
    setIsLoadingMarkets(true);
    try {
      const list = await fetchEarnMarkets();
      setMarkets(list);
    } catch (err) {
      console.error("[Earn] Fetch markets failed:", err);
      setMarkets([]);
    } finally {
      setIsLoadingMarkets(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) fetchMarkets();
  }, [isOpen, fetchMarkets]);

  // Total portfolio: use assets (combined) to match main page; fallback to primaryAssets
  const totalPortfolioUsd = (() => {
    const src = assets ?? primaryAssets;
    const total = (src as { totalAmountInUSD?: number })?.totalAmountInUSD;
    return typeof total === "number" ? total : 0;
  })();

  // USDC for deposit: try primaryAssets first (UA), then assets (combined)
  const userUsdcBalance = (() => {
    const sources = [primaryAssets, assets].filter(Boolean);
    for (const src of sources) {
      if (!src?.assets) continue;
      const list = src.assets as Array<{
        tokenType?: string;
        symbol?: string;
        amount?: number | string;
        balance?: number | string;
        amountInUSD?: number;
        chainAggregation?: Array<{ amount?: number | string; token?: { chainId?: number } }>;
      }>;
      const usdc = list.find(
        (a) =>
          (a.tokenType || "").toLowerCase() === "usdc" ||
          (a.symbol || "").toUpperCase() === "USDC"
      );
      if (!usdc) continue;
      let amt = typeof usdc.amount === "string" ? parseFloat(usdc.amount || "0") : (usdc.amount ?? 0);
      if (typeof usdc.balance === "number") amt = usdc.balance;
      else if (typeof usdc.balance === "string") amt = parseFloat(usdc.balance || "0");
      if (amt <= 0 && usdc.chainAggregation?.length) {
        amt = usdc.chainAggregation.reduce((sum, c) => {
          const v = typeof c.amount === "string" ? parseFloat(c.amount || "0") : (c.amount || 0);
          return sum + v;
        }, 0);
      }
      if (amt > 0) return amt;
    }
    return 0;
  })();

  const filteredMarkets = markets.filter((m) => {
    if (chainFilter !== "all" && m.chainId !== chainFilter) return false;
    if (protocolFilter !== "all" && m.protocol !== protocolFilter) return false;
    return true;
  });

  const amountNum = parseFloat(amount || "0");
  const receiver = smartAccountAddress || (address as string);
  const canDeposit =
    selectedMarket &&
    amountNum > 0 &&
    amountNum <= userUsdcBalance &&
    universalAccount &&
    primaryWallet &&
    address &&
    receiver;

  const handleDeposit = async () => {
    if (!canDeposit || !selectedMarket || !universalAccount || !receiver) return;
    setError(null);
    setIsLoading(true);
    try {
      const uaChainId = CHAIN_ID_MAP[selectedMarket.chainId] ?? selectedMarket.uaChainId;
      const tokenType = ASSET_TO_TOKEN_TYPE[selectedMarket.assetSymbol] ?? SUPPORTED_TOKEN_TYPE.USDC;

      let approve: `0x${string}`;
      let action: `0x${string}`;
      let actionTo: string;

      if (selectedMarket.protocol === "morpho") {
        const built = buildMorphoDepositTx(selectedMarket, amount, receiver);
        approve = built.approve;
        action = built.deposit;
        actionTo = selectedMarket.address;
      } else {
        const built = buildAaveSupplyTx(selectedMarket, amount, receiver);
        approve = built.approve;
        action = built.supply;
        actionTo = selectedMarket.address;
      }

      const tx = await universalAccount.createUniversalTransaction({
        chainId: uaChainId,
        expectTokens: [{ type: tokenType, amount }],
        transactions: [
          { to: selectedMarket.assetAddress as `0x${string}`, data: approve },
          { to: actionTo as `0x${string}`, data: action },
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
    setSelectedMarket(null);
    setAmount("");
    setTxResult(null);
    setError(null);
  };

  const chainIds = Array.from(new Set(markets.map((m) => m.chainId))).sort((a, b) => a - b);
  const chainNames: Record<number, string> = {
    1: "Ethereum", 8453: "Base", 42161: "Arbitrum", 10: "Optimism",
    137: "Polygon", 43114: "Avalanche", 56: "BNB",
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

        <p className="text-gray-400 text-sm mb-3">
          Deposit USDC into yield vaults. Earn interest on supported chains.
        </p>

        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-zinc-900 rounded-xl px-3 py-2 border border-zinc-800">
            <div className="text-gray-400 text-xs mb-0.5">Total portfolio</div>
            <div className="text-white font-semibold">${totalPortfolioUsd.toFixed(2)}</div>
          </div>
          <div className="bg-zinc-900 rounded-xl px-3 py-2 border border-zinc-800">
            <div className="text-gray-400 text-xs mb-0.5">USDC (for deposit)</div>
            <div className="text-white font-semibold">{userUsdcBalance.toFixed(2)}</div>
          </div>
        </div>

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
        ) : selectedMarket ? (
          <div className="space-y-4">
            <button
              onClick={resetFlow}
              className="text-sm text-accent-dynamic hover:brightness-110"
            >
              ← Back to markets
            </button>

            <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-medium">{selectedMarket.name}</span>
                <span className="text-gray-400 text-xs capitalize">{selectedMarket.chainName} · {selectedMarket.protocol}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {selectedMarket.apy > 0 && (
                  <div>
                    <div className="text-gray-500 text-xs">APY</div>
                    <div className="text-green-400 font-medium">{selectedMarket.apy.toFixed(2)}%</div>
                  </div>
                )}
                {selectedMarket.tvl > 0 && (
                  <div>
                    <div className="text-gray-500 text-xs">TVL</div>
                    <div className="text-gray-300 text-sm">{formatTvl(selectedMarket.tvl)}</div>
                  </div>
                )}
                <div>
                  <div className="text-gray-500 text-xs">Asset</div>
                  <div className="text-gray-300 text-sm">{selectedMarket.assetSymbol}</div>
                </div>
              </div>
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
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mb-2">
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
              {chainIds.map((cid) => (
                <button
                  key={cid}
                  onClick={() => setChainFilter(cid)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm ${
                    chainFilter === cid
                      ? "bg-accent-dynamic text-white"
                      : "bg-zinc-800 text-gray-400"
                  }`}
                >
                  {chainNames[cid] || `Chain ${cid}`}
                </button>
              ))}
            </div>
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setProtocolFilter("all")}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm ${
                  protocolFilter === "all"
                    ? "bg-accent-dynamic text-white"
                    : "bg-zinc-800 text-gray-400"
                }`}
              >
                All protocols
              </button>
              <button
                onClick={() => setProtocolFilter("morpho")}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm ${
                  protocolFilter === "morpho"
                    ? "bg-accent-dynamic text-white"
                    : "bg-zinc-800 text-gray-400"
                }`}
              >
                Morpho
              </button>
              <button
                onClick={() => setProtocolFilter("aave")}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm ${
                  protocolFilter === "aave"
                    ? "bg-accent-dynamic text-white"
                    : "bg-zinc-800 text-gray-400"
                }`}
              >
                Aave
              </button>
            </div>

            {isLoadingMarkets ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-accent-dynamic" />
              </div>
            ) : filteredMarkets.length === 0 ? (
              <p className="text-center text-gray-400 py-8">No markets on this chain</p>
            ) : (
              <div className="space-y-2">
                {filteredMarkets.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMarket(m)}
                    className="w-full p-4 bg-zinc-900 hover:bg-zinc-800 rounded-xl text-left border border-zinc-800 hover:border-accent-dynamic/40 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-white font-medium">{m.name}</div>
                        <div className="text-gray-400 text-xs mt-0.5 capitalize">{m.chainName} · {m.protocol}</div>
                        {m.tvl > 0 && (
                          <div className="text-gray-500 text-xs mt-1">TVL {formatTvl(m.tvl)}</div>
                        )}
                      </div>
                      <div className="text-right">
                        {m.apy > 0 ? (
                          <div className="text-green-400 text-sm font-medium">{m.apy.toFixed(2)}% APY</div>
                        ) : (
                          <div className="text-gray-500 text-sm">—</div>
                        )}
                        <div className="text-gray-500 text-xs mt-0.5">{m.assetSymbol}</div>
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
