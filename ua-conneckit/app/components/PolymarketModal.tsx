"use client";

import { useState, useEffect, useCallback } from "react";
import { X, TrendingUp, TrendingDown, Loader2, ExternalLink, Search } from "lucide-react";
import type { UniversalAccount } from "@particle-network/universal-account-sdk";
import { CHAIN_ID, SUPPORTED_TOKEN_TYPE } from "@particle-network/universal-account-sdk";
import { Interface, Contract, JsonRpcProvider } from "ethers";
import { useWallets, useAccount } from "@particle-network/connectkit";

// Polymarket API endpoints
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const POLYMARKET_API = "https://clob.polymarket.com"; // For CLOB trading (future)
const GAMMA_API = "https://gamma-api.polymarket.com";

// Contract addresses on Polygon
const USDC_E_ADDRESS = "0x2791bca1f2de4661ed88a30c99a7a9449aa84174";
const CTF_ADDRESS = "0x4D97DCd97eC945f40cF65F87097ACe5EA0476045";
const NEG_RISK_ADAPTER = "0xd91E80cF2E7be2e162c6513ceD06f1dD0dA35296";
const NEG_RISK_EXCHANGE = "0xC5d563A36AE78145C45a50134d48A1215220f80a";
const CTF_EXCHANGE = "0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E";

interface Market {
  id: string;
  question: string;
  description?: string;
  outcomes: string[];
  outcomePrices: string[];
  volume: string;
  liquidity: string;
  endDate: string;
  active: boolean;
  closed: boolean;
  conditionId: string;
  slug: string;
  image?: string;
  tokens?: Array<{ token_id: string; outcome: string; price: number }>;
}

interface PolymarketModalProps {
  isOpen: boolean;
  onClose: () => void;
  universalAccount: UniversalAccount | null;
  onSuccess?: () => void;
}

export default function PolymarketModal({
  isOpen,
  onClose,
  universalAccount,
  onSuccess,
}: PolymarketModalProps) {
  const [primaryWallet] = useWallets();
  const { address } = useAccount();
  const [markets, setMarkets] = useState<Market[]>([]);
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [allMarkets, setAllMarkets] = useState<Market[]>([]);
  const [selectedOutcome, setSelectedOutcome] = useState<number>(0);
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMarkets, setIsLoadingMarkets] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [needsApproval, setNeedsApproval] = useState(true);
  const [isApproving, setIsApproving] = useState(false);

  // Fetch trending/popular markets
  const fetchMarkets = useCallback(async () => {
    setIsLoadingMarkets(true);
    setError(null);
    try {
      // Primary endpoint
      const response = await fetch(`${GAMMA_API}/markets?limit=100`);
      const data = await response.json();
      let list: Market[] = Array.isArray(data) ? data : Array.isArray((data as { data?: Market[] })?.data) ? (data as { data: Market[] }).data : [];

      // Fallback endpoint (events -> markets)
      if (!list.length) {
        const fallbackRes = await fetch(`${GAMMA_API}/events?limit=50`);
        const fallbackData = await fallbackRes.json();
        const events = Array.isArray(fallbackData) ? fallbackData : Array.isArray((fallbackData as { data?: unknown[] })?.data) ? (fallbackData as { data: unknown[] }).data : [];
        list = events.flatMap((e: unknown) => {
          const eventObj = e as { markets?: Market[] };
          return Array.isArray(eventObj?.markets) ? eventObj.markets : [];
        });
      }

      // Final clean filter (prefer open markets)
      const openMarkets = list.filter((m) => !!m?.id && !!m?.question && m?.active !== false && m?.closed !== true);
      // If none, gracefully fall back to active list so UI is never empty
      const finalMarkets = openMarkets.length > 0
        ? openMarkets
        : list.filter((m) => !!m?.id && !!m?.question && m?.active !== false);

      console.log("[Polymarket] Loaded markets:", finalMarkets.length, "(open:", openMarkets.length, ")");
      setAllMarkets(finalMarkets);
      setMarkets(finalMarkets);
    } catch (err) {
      console.error("[Polymarket] Failed to fetch markets:", err);
      setError("Failed to load markets");
      setAllMarkets([]);
      setMarkets([]);
    } finally {
      setIsLoadingMarkets(false);
    }
  }, []);

  // Search markets (client-side filter for reliability)
  const searchMarkets = useCallback((query: string) => {
    const q = query.trim().toLowerCase();
    if (!q) {
      setMarkets(allMarkets);
      return;
    }
    const filtered = allMarkets.filter((m) =>
      (m.question || "").toLowerCase().includes(q) ||
      (m.slug || "").toLowerCase().includes(q)
    );
    setMarkets(filtered);
  }, [allMarkets]);

  useEffect(() => {
    if (isOpen) {
      fetchMarkets();
    }
  }, [isOpen, fetchMarkets]);

  // Check if approvals are needed
  const checkApprovals = useCallback(async () => {
    if (!address || !universalAccount) return;
    
    try {
      const provider = new JsonRpcProvider("https://polygon-rpc.com");
      const ERC20_ABI = ["function allowance(address owner, address spender) view returns (uint256)"];
      const usdce = new Contract(USDC_E_ADDRESS, ERC20_ABI, provider);
      
      // Check allowance for CTF Exchange
      const allowance = await usdce.allowance(address, CTF_EXCHANGE);
      setNeedsApproval(BigInt(allowance) < BigInt("1000000000000")); // Less than 1M USDC.e approved
    } catch (err) {
      console.error("[Polymarket] Allowance check failed:", err);
    }
  }, [address, universalAccount]);

  useEffect(() => {
    if (isOpen && address) {
      checkApprovals();
    }
  }, [isOpen, address, checkApprovals]);

  // Approve USDC.e for Polymarket contracts
  const handleApprove = async () => {
    if (!universalAccount || !primaryWallet || !address) return;
    const walletClient = primaryWallet.getWalletClient();
    
    setIsApproving(true);
    setError(null);
    setStatus("Approving USDC.e for Polymarket...");

    try {
      const ERC20_ABI = new Interface([
        "function approve(address spender, uint256 amount) returns (bool)",
      ]);
      const CTF_ABI = new Interface([
        "function setApprovalForAll(address operator, bool approved) external",
      ]);

      const maxApproval = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");

      // Create approval transactions
      const transaction = await universalAccount.createUniversalTransaction({
        chainId: CHAIN_ID.POLYGON_MAINNET,
        expectTokens: [], // No token bridging needed for approvals
        transactions: [
          // Approve USDC.e for all Polymarket contracts
          {
            to: USDC_E_ADDRESS,
            data: ERC20_ABI.encodeFunctionData("approve", [NEG_RISK_ADAPTER, maxApproval]),
          },
          {
            to: USDC_E_ADDRESS,
            data: ERC20_ABI.encodeFunctionData("approve", [NEG_RISK_EXCHANGE, maxApproval]),
          },
          {
            to: USDC_E_ADDRESS,
            data: ERC20_ABI.encodeFunctionData("approve", [CTF_EXCHANGE, maxApproval]),
          },
          // Approve CTF tokens for exchanges
          {
            to: CTF_ADDRESS,
            data: CTF_ABI.encodeFunctionData("setApprovalForAll", [NEG_RISK_ADAPTER, true]),
          },
          {
            to: CTF_ADDRESS,
            data: CTF_ABI.encodeFunctionData("setApprovalForAll", [NEG_RISK_EXCHANGE, true]),
          },
          {
            to: CTF_ADDRESS,
            data: CTF_ABI.encodeFunctionData("setApprovalForAll", [CTF_EXCHANGE, true]),
          },
        ],
      });

      setStatus("Waiting for signature...");
      
      // Sign the root hash
      const signature = await walletClient?.signMessage({
        account: address as `0x${string}`,
        message: { raw: transaction.rootHash as `0x` },
      });

      setStatus("Sending approval transaction...");
      
      const result = await universalAccount.sendTransaction(transaction, signature);
      console.log("[Polymarket] Approval tx:", result.transactionId);

      setStatus("Approvals complete!");
      setNeedsApproval(false);
    } catch (err) {
      console.error("[Polymarket] Approval failed:", err);
      setError(err instanceof Error ? err.message : "Approval failed");
    } finally {
      setIsApproving(false);
      setStatus(null);
    }
  };

  // Buy shares in a market
  const handleBuy = async () => {
    if (!universalAccount || !primaryWallet || !address || !selectedMarket || !amount) return;
    const walletClient = primaryWallet.getWalletClient();
    
    setIsLoading(true);
    setError(null);
    setStatus("Creating buy transaction...");

    try {
      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        throw new Error("Invalid amount");
      }

      // For now, we'll use UA's convert to get USDC on Polygon
      // Then the user can interact with Polymarket directly
      // Full CLOB integration requires EIP-712 signing which we'll add next
      
      setStatus("Preparing USDC on Polygon...");
      
      // Convert to USDC.e on Polygon
      const transaction = await universalAccount.createConvertTransaction({
        expectToken: { 
          type: SUPPORTED_TOKEN_TYPE.USDC, 
          amount: amount,
        },
        chainId: CHAIN_ID.POLYGON_MAINNET,
      });

      setStatus("Waiting for signature...");
      
      const signature = await walletClient?.signMessage({
        account: address as `0x${string}`,
        message: { raw: transaction.rootHash as `0x` },
      });

      setStatus("Sending transaction...");
      
      const result = await universalAccount.sendTransaction(transaction, signature);
      console.log("[Polymarket] Convert tx:", result.transactionId);

      setStatus(`Success! USDC ready on Polygon. You can now trade on Polymarket.`);
      onSuccess?.();

      // Open Polymarket in new tab
      setTimeout(() => {
        window.open(`https://polymarket.com/event/${selectedMarket.slug}`, "_blank");
      }, 2000);

    } catch (err) {
      console.error("[Polymarket] Buy failed:", err);
      setError(err instanceof Error ? err.message : "Transaction failed");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1a1a2e] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔮</span>
            <h2 className="text-lg font-bold text-white">Prediction Markets</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!selectedMarket ? (
            <>
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search markets..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    searchMarkets(e.target.value);
                  }}
                  className="w-full pl-10 pr-4 py-2 bg-[#2a2a4a] border border-gray-600 rounded-lg text-white placeholder-gray-400"
                />
              </div>

              {/* Markets list */}
              {isLoadingMarkets ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
                </div>
              ) : (
                <div className="space-y-2">
                  {markets.map((market) => (
                    <button
                      key={market.id}
                      onClick={() => setSelectedMarket(market)}
                      className="w-full p-4 bg-[#2a2a4a] hover:bg-[#3a3a5a] rounded-lg text-left transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        {market.image && (
                          <img src={market.image} alt="" className="w-10 h-10 rounded-lg object-cover" />
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-medium text-sm line-clamp-2">{market.question}</h3>
                          <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                            <span>${parseFloat(market.volume || "0").toLocaleString()} vol</span>
                            {market.outcomePrices?.[0] && (
                              <>
                                <span>•</span>
                                <span className="text-green-400">{(parseFloat(market.outcomePrices[0]) * 100).toFixed(0)}% Yes</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                  {markets.length === 0 && (
                    <p className="text-center text-gray-400 py-8">No markets found</p>
                  )}
                </div>
              )}

              {/* Polymarket link */}
              <a
                href="https://polymarket.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 text-sm text-purple-400 hover:text-purple-300"
              >
                Browse all on Polymarket <ExternalLink className="w-3 h-3" />
              </a>
            </>
          ) : (
            <>
              {/* Back button */}
              <button
                onClick={() => setSelectedMarket(null)}
                className="text-sm text-purple-400 hover:text-purple-300"
              >
                ← Back to markets
              </button>

              {/* Selected market */}
              <div className="bg-[#2a2a4a] rounded-lg p-4">
                <h3 className="text-white font-medium mb-2">{selectedMarket.question}</h3>
                {selectedMarket.description && (
                  <p className="text-sm text-gray-400 mb-4">{selectedMarket.description}</p>
                )}

                {/* Outcome buttons */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {selectedMarket.outcomes?.map((outcome, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedOutcome(i)}
                      className={`p-3 rounded-lg border-2 transition-colors ${
                        selectedOutcome === i
                          ? "border-purple-500 bg-purple-500/20"
                          : "border-gray-600 hover:border-gray-500"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-white font-medium">{outcome}</span>
                        {i === 0 ? (
                          <TrendingUp className="w-4 h-4 text-green-400" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-400" />
                        )}
                      </div>
                      <div className={`text-lg font-bold ${i === 0 ? "text-green-400" : "text-red-400"}`}>
                        {selectedMarket.outcomePrices?.[i]
                          ? `${(parseFloat(selectedMarket.outcomePrices[i]) * 100).toFixed(0)}¢`
                          : "—"}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Amount input */}
                <div className="mb-4">
                  <label className="block text-sm text-gray-400 mb-1">Amount (USDC)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="10.00"
                    className="w-full px-4 py-2 bg-[#1a1a2e] border border-gray-600 rounded-lg text-white"
                  />
                </div>

                {/* Potential winnings */}
                {amount && selectedMarket.outcomePrices?.[selectedOutcome] && (
                  <div className="bg-[#1a1a2e] rounded-lg p-3 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Potential return</span>
                      <span className="text-green-400 font-medium">
                        ${(parseFloat(amount) / parseFloat(selectedMarket.outcomePrices[selectedOutcome])).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-gray-400">Profit</span>
                      <span className="text-green-400 font-medium">
                        +${((parseFloat(amount) / parseFloat(selectedMarket.outcomePrices[selectedOutcome])) - parseFloat(amount)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Status/Error */}
              {status && (
                <div className="text-sm text-purple-400 text-center">{status}</div>
              )}
              {error && (
                <div className="text-sm text-red-400 text-center">{error}</div>
              )}

              {/* Action buttons */}
              {needsApproval ? (
                <button
                  onClick={handleApprove}
                  disabled={isApproving}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-purple-800 text-white font-bold rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isApproving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Approving...
                    </>
                  ) : (
                    "Approve Polymarket"
                  )}
                </button>
              ) : (
                <button
                  onClick={handleBuy}
                  disabled={isLoading || !amount}
                  className="w-full py-3 bg-gradient-to-r from-green-600 to-green-800 text-white font-bold rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    `Buy ${selectedMarket.outcomes?.[selectedOutcome] || "Shares"}`
                  )}
                </button>
              )}

              <p className="text-xs text-gray-500 text-center">
                This will prepare USDC on Polygon for trading. Full CLOB integration coming soon.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
