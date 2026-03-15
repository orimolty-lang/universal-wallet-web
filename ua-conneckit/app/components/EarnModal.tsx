"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { X, Loader2, TrendingUp, ChevronDown } from "lucide-react";
import BottomSheet from "../../components/BottomSheet";
import type { UniversalAccount } from "@particle-network/universal-account-sdk";
import { CHAIN_ID, SUPPORTED_TOKEN_TYPE } from "@particle-network/universal-account-sdk";
import type { IAssetsResponse } from "@particle-network/universal-account-sdk";
import { useWallets, useAccount } from "@particle-network/connectkit";
import {
  fetchEarnMarkets,
  fetchUserPositions,
  buildMorphoDepositTx,
  buildMorphoRedeemTx,
  buildAaveSupplyTx,
  formatTvl,
  type EarnMarket,
  type EarnPosition,
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

// UA supports USDC, USDT, ETH only (no WETH, wstETH, WBTC, BTC)
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
  const [positions, setPositions] = useState<EarnPosition[]>([]);
  const [isLoadingPositions, setIsLoadingPositions] = useState(false);
  const [withdrawingPosition, setWithdrawingPosition] = useState<EarnPosition | null>(null);

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

  const loadPositions = useCallback(async () => {
    if (!smartAccountAddress) {
      setPositions([]);
      return;
    }
    setIsLoadingPositions(true);
    try {
      const pos = await fetchUserPositions(smartAccountAddress);
      setPositions(pos);
    } catch (err) {
      console.error("[Earn] Fetch positions failed:", err);
      setPositions([]);
    } finally {
      setIsLoadingPositions(false);
    }
  }, [smartAccountAddress]);

  useEffect(() => {
    if (isOpen) loadPositions();
  }, [isOpen, loadPositions]);

  // UA Balance: unified balance (token/chain agnostic). createUniversalTransaction sources USDC from this.
  const uaBalanceUsd = (() => {
    const src = assets ?? primaryAssets;
    const total = (src as { totalAmountInUSD?: number })?.totalAmountInUSD;
    return typeof total === "number" ? total : 0;
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
    amountNum <= uaBalanceUsd &&
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
      loadPositions();
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

  const handleWithdraw = async (pos: EarnPosition) => {
    if (!universalAccount || !primaryWallet || !receiver) return;
    setError(null);
    setWithdrawingPosition(pos);
    try {
      const uaChainId = CHAIN_ID_MAP[pos.market.chainId] ?? pos.market.uaChainId;
      const { redeem } = buildMorphoRedeemTx(pos.market, pos.sharesRaw, receiver);
      const tx = await universalAccount.createUniversalTransaction({
        chainId: uaChainId,
        expectTokens: [],
        transactions: [{ to: pos.market.address as `0x${string}`, data: redeem }],
      });
      const walletClient = primaryWallet.getWalletClient();
      if (!walletClient) throw new Error("Wallet not connected");
      const signature = await signUniversalRootHash(
        walletClient as unknown as WalletClientLike,
        (tx as { rootHash: string }).rootHash as `0x${string}`,
        walletClient.account?.address as `0x${string}` | undefined,
        blindSigningEnabled
      );
      await universalAccount.sendTransaction(tx, signature);
      setPositions((prev) => prev.filter((p) => p.market.id !== pos.market.id));
      loadPositions();
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Withdraw failed");
    } finally {
      setWithdrawingPosition(null);
    }
  };

  const chainIds = Array.from(new Set(markets.map((m) => m.chainId))).sort((a, b) => a - b);
  const chainMeta: Record<number, { name: string; logo: string }> = {
    1: { name: "Ethereum", logo: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png" },
    8453: { name: "Base", logo: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/info/logo.png" },
    42161: { name: "Arbitrum", logo: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/info/logo.png" },
    10: { name: "Optimism", logo: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/optimism/info/logo.png" },
    137: { name: "Polygon", logo: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png" },
    43114: { name: "Avalanche", logo: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/avalanchec/info/logo.png" },
    56: { name: "BNB", logo: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/info/logo.png" },
  };
  const protocolMeta: Record<string, { name: string; logo: string }> = {
    morpho: { name: "Morpho", logo: "https://morpho.org/favicon.ico" },
    aave: { name: "Aave", logo: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9/logo.png" },
  };
  const ASSET_LOGOS: Record<string, string> = {
    USDC: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png",
    USDT: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png",
    ETH: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png",
    WETH: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png",
    WBTC: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599/logo.png",
    BTC: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/bitcoin/info/logo.png",
    wstETH: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0/logo.png",
    WSTETH: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0/logo.png",
    stETH: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84/logo.png",
    STETH: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84/logo.png",
    DAI: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x6B175474E89094C44Da98b954EescdeCB5BE3830/logo.png",
    EURC: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x1aBaEA1f7C830bD89Acc67eC4af516284b1bC33c/logo.png",
  };
  const getAssetLogo = (symbol: string) => {
    const s = symbol?.trim() || "";
    return ASSET_LOGOS[s] ?? ASSET_LOGOS[s.toUpperCase()] ?? ASSET_LOGOS.USDC;
  };
  const getChainLogo = (chainId: number) => chainMeta[chainId]?.logo ?? chainMeta[1]?.logo;
  const [chainDropdownOpen, setChainDropdownOpen] = useState(false);
  const [protocolDropdownOpen, setProtocolDropdownOpen] = useState(false);
  const chainDropdownRef = useRef<HTMLDivElement>(null);
  const protocolDropdownRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!chainDropdownRef.current?.contains(e.target as Node)) setChainDropdownOpen(false);
      if (!protocolDropdownRef.current?.contains(e.target as Node)) setProtocolDropdownOpen(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <div className="px-5 pb-8 min-h-[400px]" style={{ paddingTop: "env(safe-area-inset-top)" }}>
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
          Deposit USDC into yield vaults. UA sources from your unified balance across chains.
        </p>

        <div className="bg-zinc-900 rounded-xl px-4 py-3 border border-zinc-800 mb-4">
          <div className="text-gray-400 text-xs mb-0.5">UA Balance</div>
          <div className="text-white font-semibold text-lg">${uaBalanceUsd.toFixed(2)}</div>
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
                <div className="flex items-center gap-1.5 text-gray-400 text-xs capitalize">
                  <img src={getChainLogo(selectedMarket.chainId)} alt="" className="w-4 h-4 rounded-full" title={selectedMarket.chainName} />
                  <img src={protocolMeta[selectedMarket.protocol]?.logo} alt="" className="w-4 h-4 rounded" title={protocolMeta[selectedMarket.protocol]?.name} />
                </div>
              </div>
              {(selectedMarket.description ?? "").trim().length > 0 && (
                <p className="text-gray-400 text-xs mt-2 leading-relaxed">{selectedMarket.description}</p>
              )}
              <div className="grid grid-cols-2 gap-2 mt-2">
                {selectedMarket.apy > 0 && (
                  <div>
                    <div className="text-gray-500 text-xs">APY</div>
                    <div className="text-green-400 font-medium">{selectedMarket.apy.toFixed(2)}%</div>
                  </div>
                )}
                {(selectedMarket.totalAssetsUsd ?? selectedMarket.tvl) > 0 && (
                  <div>
                    <div className="text-gray-500 text-xs">Total deposits</div>
                    <div className="text-gray-300 text-sm">{formatTvl(selectedMarket.totalAssetsUsd ?? selectedMarket.tvl)}</div>
                  </div>
                )}
                {(selectedMarket.liquidityUsd ?? 0) > 0 && (
                  <div>
                    <div className="text-gray-500 text-xs">Liquidity</div>
                    <div className="text-gray-300 text-sm">{formatTvl(selectedMarket.liquidityUsd!)}</div>
                  </div>
                )}
                {selectedMarket.sharePrice != null && selectedMarket.sharePrice > 0 && (
                  <div>
                    <div className="text-gray-500 text-xs">Share price</div>
                    <div className="text-gray-300 text-sm">${selectedMarket.sharePrice.toFixed(4)}</div>
                  </div>
                )}
                {selectedMarket.curatorAddress && (
                  <div className="col-span-2">
                    <div className="text-gray-500 text-xs">Curator</div>
                    <div className="text-gray-400 text-xs font-mono truncate" title={selectedMarket.curatorAddress}>
                      {selectedMarket.curatorAddress.slice(0, 6)}…{selectedMarket.curatorAddress.slice(-4)}
                    </div>
                  </div>
                )}
                <div>
                  <div className="text-gray-500 text-xs">Asset</div>
                  <div className="flex items-center gap-1.5 text-gray-300 text-sm">
                    <img src={getAssetLogo(selectedMarket.assetSymbol)} alt="" className="w-4 h-4 rounded-full" />
                    {selectedMarket.assetSymbol}
                  </div>
                </div>
              </div>
            </div>

            {(() => {
              const existingPos = positions.find((p) => p.market.id === selectedMarket.id);
              return existingPos ? (
                <div className="bg-zinc-900 rounded-xl p-3 border border-zinc-800 flex items-center justify-between">
                  <div>
                    <div className="text-gray-400 text-xs uppercase tracking-wide mb-0.5">Your position</div>
                    <div className="flex items-center gap-1.5 text-white font-medium">
                      <img src={getAssetLogo(selectedMarket.assetSymbol)} alt="" className="w-4 h-4 rounded-full" />
                      ~{existingPos.assetsApprox.toFixed(2)} {selectedMarket.assetSymbol}
                    </div>
                  </div>
                  <button
                    onClick={() => handleWithdraw(existingPos)}
                    disabled={!!withdrawingPosition}
                    className="px-3 py-1.5 rounded-lg bg-zinc-700 text-white text-xs font-medium hover:bg-zinc-600 disabled:opacity-50"
                  >
                    {withdrawingPosition?.market.id === existingPos.market.id ? "..." : "Withdraw"}
                  </button>
                </div>
              ) : null;
            })()}

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
                <span className="text-gray-500 text-xs">UA Balance: ${uaBalanceUsd.toFixed(2)}</span>
                <button
                  type="button"
                  onClick={() => setAmount(uaBalanceUsd.toString())}
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
            {(positions.length > 0 || isLoadingPositions) && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-xs uppercase tracking-wide">Active Positions</span>
                  <button
                    onClick={loadPositions}
                    disabled={isLoadingPositions}
                    className="text-accent-dynamic text-xs disabled:opacity-50"
                  >
                    {isLoadingPositions ? "..." : "Refresh"}
                  </button>
                </div>
                <div className="space-y-2">
                  {isLoadingPositions && positions.length === 0 && (
                    <div className="text-gray-500 text-sm py-2">Loading...</div>
                  )}
                  {positions.map((pos) => (
                    <div key={pos.market.id} className="bg-zinc-900 rounded-xl p-3 border border-zinc-800 flex items-center justify-between">
                      <div>
                        <div className="text-white font-medium text-sm">{pos.market.name}</div>
                        <div className="flex items-center gap-1.5 text-gray-500 text-xs mt-0.5">
                          <img src={getChainLogo(pos.market.chainId)} alt="" className="w-3.5 h-3.5 rounded-full" title={pos.market.chainName} />
                          <img src={getAssetLogo(pos.market.assetSymbol)} alt="" className="w-3.5 h-3.5 rounded-full" />
                          <span>~{pos.assetsApprox.toFixed(2)} {pos.market.assetSymbol}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleWithdraw(pos)}
                        disabled={!!withdrawingPosition}
                        className="px-3 py-1.5 rounded-lg bg-zinc-700 text-white text-xs font-medium hover:bg-zinc-600 disabled:opacity-50"
                      >
                        {withdrawingPosition?.market.id === pos.market.id ? "..." : "Withdraw"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-2 mb-3">
              <div className="relative flex-1" ref={chainDropdownRef}>
                <button
                  onClick={() => setChainDropdownOpen((o) => !o)}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-left"
                >
                  {chainFilter === "all" ? (
                    <span className="text-gray-300 text-sm">All chains</span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <img src={chainMeta[chainFilter]?.logo} alt="" className="w-5 h-5 rounded-full" />
                      <span className="text-white text-sm">{chainMeta[chainFilter]?.name || `Chain ${chainFilter}`}</span>
                    </div>
                  )}
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${chainDropdownOpen ? "rotate-180" : ""}`} />
                </button>
                {chainDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 py-1 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto">
                    <button
                      onClick={() => { setChainFilter("all"); setChainDropdownOpen(false); }}
                      className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-zinc-800 flex items-center gap-2"
                    >
                      All chains
                    </button>
                    {chainIds.map((cid) => (
                      <button
                        key={cid}
                        onClick={() => { setChainFilter(cid); setChainDropdownOpen(false); }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-zinc-800 flex items-center gap-2"
                      >
                        <img src={chainMeta[cid]?.logo} alt="" className="w-5 h-5 rounded-full" />
                        <span className="text-white">{chainMeta[cid]?.name || `Chain ${cid}`}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="relative flex-1" ref={protocolDropdownRef}>
                <button
                  onClick={() => setProtocolDropdownOpen((o) => !o)}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-left"
                >
                  {protocolFilter === "all" ? (
                    <span className="text-gray-300 text-sm">All protocols</span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <img src={protocolMeta[protocolFilter]?.logo} alt="" className="w-5 h-5 rounded" />
                      <span className="text-white text-sm">{protocolMeta[protocolFilter]?.name}</span>
                    </div>
                  )}
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${protocolDropdownOpen ? "rotate-180" : ""}`} />
                </button>
                {protocolDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 py-1 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl z-20">
                    <button
                      onClick={() => { setProtocolFilter("all"); setProtocolDropdownOpen(false); }}
                      className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-zinc-800"
                    >
                      All protocols
                    </button>
                    <button
                      onClick={() => { setProtocolFilter("morpho"); setProtocolDropdownOpen(false); }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-zinc-800 flex items-center gap-2"
                    >
                      <img src={protocolMeta.morpho.logo} alt="" className="w-5 h-5 rounded" />
                      <span className="text-white">Morpho</span>
                    </button>
                    <button
                      onClick={() => { setProtocolFilter("aave"); setProtocolDropdownOpen(false); }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-zinc-800 flex items-center gap-2"
                    >
                      <img src={protocolMeta.aave.logo} alt="" className="w-5 h-5 rounded" />
                      <span className="text-white">Aave</span>
                    </button>
                  </div>
                )}
              </div>
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
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-1">
                          <img src={getChainLogo(m.chainId)} alt="" className="w-6 h-6 rounded-full border-2 border-zinc-900" />
                          <img src={getAssetLogo(m.assetSymbol)} alt="" className="w-6 h-6 rounded-full border-2 border-zinc-900" />
                        </div>
                        <div>
                        <div className="text-white font-medium">{m.name}</div>
                        <div className="flex items-center gap-1 text-gray-400 text-xs mt-0.5">
                          <img src={protocolMeta[m.protocol]?.logo} alt="" className="w-3.5 h-3.5 rounded" title={protocolMeta[m.protocol]?.name} />
                        </div>
                        {m.tvl > 0 && (
                          <div className="text-gray-500 text-xs mt-1">TVL {formatTvl(m.tvl)}</div>
                        )}
                        </div>
                      </div>
                      <div className="text-right">
                        {m.apy > 0 ? (
                          <div className="text-green-400 text-sm font-medium">{m.apy.toFixed(2)}% APY</div>
                        ) : (
                          <div className="text-gray-500 text-sm">—</div>
                        )}
                        <div className="flex items-center justify-end gap-1 text-gray-500 text-xs mt-0.5">
                          <img src={getAssetLogo(m.assetSymbol)} alt="" className="w-3.5 h-3.5 rounded-full" />
                          {m.assetSymbol}
                        </div>
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
