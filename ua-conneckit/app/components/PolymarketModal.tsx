"use client";

import { useState, useEffect, useCallback } from "react";
import { X, TrendingUp, TrendingDown, Loader2, ExternalLink, Search } from "lucide-react";
import type { UniversalAccount } from "@particle-network/universal-account-sdk";
import { CHAIN_ID, SUPPORTED_TOKEN_TYPE } from "@particle-network/universal-account-sdk";
import { Contract, JsonRpcProvider } from "ethers";
import { useWallets, useAccount } from "@particle-network/connectkit";
import { ClobClient, OrderType, Side, SignatureType } from "@polymarket/clob-client";
import { BuilderConfig } from "@polymarket/builder-signing-sdk";
import { RelayClient, RelayerTxType } from "@polymarket/builder-relayer-client";
import { AssetType } from "@polymarket/clob-client/dist/types";
import type { WalletClient } from "viem";
import { encodeFunctionData, maxUint256 } from "viem";

const BUILDER_SIGN_URL = "https://polymarket-builder-worker-ori.orimolty.workers.dev/builder/sign";
const RELAYER_URL = "https://relayer-v2.polymarket.com/";

// Custom viem-like WalletClient wrapper for Polymarket relayer
// Must have chain, transport, account properties that SDK expects
/* eslint-disable @typescript-eslint/no-explicit-any */
class PolygonSignerWrapper {
  private walletClient: any;
  private userAddress: string;
  
  // viem WalletClient expected properties
  public chain: { id: number; name: string; network: string; rpcUrls: { default: { http: string[] } } };
  public transport: { type: string; url: string };
  public account: { address: string; type: string };

  constructor(walletClient: any, address: string) {
    this.walletClient = walletClient;
    this.userAddress = address;
    
    // SDK expects viem WalletClient shape with chain property
    this.chain = {
      id: 137,
      name: 'Polygon',
      network: 'polygon',
      rpcUrls: { default: { http: ['https://polygon-rpc.com'] } }
    };
    this.transport = { type: 'http', url: 'https://polygon-rpc.com' };
    this.account = { address: address, type: 'local' };
  }

  // Expose address as property (some SDK paths check this)
  get address(): string {
    return this.userAddress;
  }

  async getAddress(): Promise<string> {
    return this.userAddress;
  }
  
  getChainId(): number {
    return 137;
  }

  async signMessage({ message }: { message: string | { raw: any } }): Promise<string> {
    if (typeof message === 'object' && 'raw' in message) {
      return this.walletClient.signMessage({
        account: this.userAddress as `0x${string}`,
        message: { raw: message.raw },
      });
    }
    return this.walletClient.signMessage({
      account: this.userAddress as `0x${string}`,
      message: message as string,
    });
  }

  async signTypedData({ domain, types, primaryType, message }: any): Promise<string> {
    // Override domain chainId to Polygon
    const polygonDomain = { ...domain, chainId: 137 };
    return this.walletClient.signTypedData({
      account: this.userAddress as `0x${string}`,
      domain: polygonDomain,
      types,
      primaryType: primaryType || Object.keys(types).find((k: string) => k !== 'EIP712Domain') || 'Message',
      message,
    });
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// Polymarket API endpoints
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const POLYMARKET_API = "https://clob.polymarket.com"; // For CLOB trading (future)
const GAMMA_API = "https://gamma-api.polymarket.com";
const POLY_PROXY = process.env.NEXT_PUBLIC_POLYMARKET_PROXY_URL || "https://polymarket-proxy-ori.orimolty.workers.dev";

// Contract addresses on Polygon
const USDC_E_ADDRESS = "0x2791bca1f2de4661ed88a30c99a7a9449aa84174";
const CTF_ADDRESS = "0x4D97DCd97eC945f40cF65F87097ACe5EA0476045";
// Unused for now but may need later for CTF operations:
// const NEG_RISK_ADAPTER = "0xd91E80cF2E7be2e162c6513ceD06f1dD0dA35296";
// const NEG_RISK_EXCHANGE = "0xC5d563A36AE78145C45a50134d48A1215220f80a";
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
  accepting_orders?: boolean;
  tokens?: Array<{ token_id: string; outcome: string; price: number }>;
}

interface PolymarketModalProps {
  isOpen: boolean;
  onClose: () => void;
  universalAccount: UniversalAccount | null;
  smartAccountAddress?: string;
  onSuccess?: () => void;
}

export default function PolymarketModal({
  isOpen,
  onClose,
  universalAccount,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  smartAccountAddress, // UA smart account (kept for reference)
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
  const [showDebug, setShowDebug] = useState(false);
  const [debugInfo, setDebugInfo] = useState<{ 
    endpoint?: string; 
    rawCount?: number; 
    openCount?: number; 
    finalCount?: number; 
    error?: string;
    polyError?: string;
    proxyStatus?: string;
    signerType?: string;
    walletAddress?: string;
  }>({});
  const [clobClient, setClobClient] = useState<ClobClient | null>(null);
  const [relayClient, setRelayClient] = useState<RelayClient | null>(null);
  const [proxyWalletAddress, setProxyWalletAddress] = useState<string | null>(null);
  const [availableBalance, setAvailableBalance] = useState<string>("0");
  const [positionBalances, setPositionBalances] = useState<Record<string, string>>({});

  const normalizeMarket = (m: unknown): Market | null => {
    const raw = m as Record<string, unknown>;

    // Parse outcomes first (needed to build tokens)
    let outcomes: string[] = [];
    const rawOutcomes = raw.outcomes;
    if (Array.isArray(rawOutcomes)) outcomes = rawOutcomes as string[];
    else if (typeof rawOutcomes === 'string') {
      try { outcomes = JSON.parse(rawOutcomes) as string[]; } catch { outcomes = []; }
    }

    // Parse outcome prices
    let outcomePrices: string[] = [];
    const rawOutcomePrices = raw.outcomePrices;
    if (Array.isArray(rawOutcomePrices)) outcomePrices = rawOutcomePrices.map(String);
    else if (typeof rawOutcomePrices === 'string') {
      try { outcomePrices = (JSON.parse(rawOutcomePrices) as Array<string | number>).map(String); } catch { outcomePrices = []; }
    }

    // Parse clobTokenIds (API returns JSON string like "[\"123...\", \"456...\"]")
    let clobTokenIds: string[] = [];
    const rawClobTokenIds = raw.clobTokenIds;
    if (Array.isArray(rawClobTokenIds)) clobTokenIds = rawClobTokenIds.map(String);
    else if (typeof rawClobTokenIds === 'string') {
      try { clobTokenIds = JSON.parse(rawClobTokenIds) as string[]; } catch { clobTokenIds = []; }
    }

    // Build tokens array from clobTokenIds + outcomes + prices
    let tokens: Array<{ token_id: string; outcome: string; price: number }> = [];
    
    // First try existing tokens array
    const rawTokens = Array.isArray(raw.tokens) ? raw.tokens : [];
    if (rawTokens.length) {
      tokens = rawTokens.map((t: unknown) => {
        const tok = t as Record<string, unknown>;
        return {
          token_id: String(tok.token_id || tok.tokenId || tok.id || ''),
          outcome: String(tok.outcome || tok.name || ''),
          price: Number(tok.price ?? 0),
        };
      }).filter(t => !!t.token_id);
    }
    
    // If no tokens but we have clobTokenIds, build from those
    if (!tokens.length && clobTokenIds.length) {
      tokens = clobTokenIds.map((tokenId, i) => ({
        token_id: tokenId,
        outcome: outcomes[i] || `Outcome ${i + 1}`,
        price: parseFloat(outcomePrices[i] || '0'),
      }));
    }

    // Update outcomes from tokens if empty
    if (!outcomes.length && tokens.length) outcomes = tokens.map(t => t.outcome);
    if (!outcomePrices.length && tokens.length) outcomePrices = tokens.map(t => String(t.price ?? 0));

    const endDate = String(raw.endDate || raw.end_date_iso || '');

    return {
      id: String(raw.id || raw.conditionId || raw.condition_id || ''),
      question: String(raw.question || ''),
      description: typeof raw.description === 'string' ? raw.description : undefined,
      outcomes,
      outcomePrices,
      volume: String(raw.volume || raw.volumeNum || '0'),
      liquidity: String(raw.liquidity || '0'),
      endDate,
      active: raw.active !== false,
      closed: raw.closed === true,
      conditionId: String(raw.conditionId || raw.condition_id || ''),
      slug: String(raw.slug || raw.market_slug || ''),
      image: typeof raw.image === 'string' ? raw.image : (typeof raw.icon === 'string' ? raw.icon : undefined),
      accepting_orders: raw.accepting_orders === true,
      tokens,
    };
  };

  // Fetch trending/popular markets
  const fetchMarkets = useCallback(async () => {
    setIsLoadingMarkets(true);
    setError(null);
    try {
      // Primary endpoint (prefer dedicated proxy to avoid WebView/CORS failures)
      const primaryEndpoint = POLY_PROXY
        ? `${POLY_PROXY.replace(/\/$/, "")}/markets?active=true&closed=false&limit=100`
        : `${GAMMA_API}/markets?active=true&closed=false&limit=100`;
      const response = await fetch(primaryEndpoint);
      const data = await response.json();
      let list: Market[] = Array.isArray(data) ? data : Array.isArray((data as { data?: Market[] })?.data) ? (data as { data: Market[] }).data : [];
      let usedEndpoint = primaryEndpoint;

      // Fallback endpoint (events -> markets)
      if (!list.length) {
        const fallbackEndpoint = POLY_PROXY
          ? `${POLY_PROXY.replace(/\/$/, "")}/events?active=true&closed=false&limit=100`
          : `${GAMMA_API}/events?active=true&closed=false&limit=100`;
        const fallbackRes = await fetch(fallbackEndpoint);
        const fallbackData = await fallbackRes.json();
        const events = Array.isArray(fallbackData) ? fallbackData : Array.isArray((fallbackData as { data?: unknown[] })?.data) ? (fallbackData as { data: unknown[] }).data : [];
        list = events.flatMap((e: unknown) => {
          const eventObj = e as { markets?: Market[] };
          return Array.isArray(eventObj?.markets) ? eventObj.markets : [];
        });
        usedEndpoint = fallbackEndpoint;
      }

      // Normalize shape
      const normalized = list.map(normalizeMarket).filter((m): m is Market => !!m);

      // Prefer currently tradable markets (accepting orders, active, not closed, not expired)
      const now = Date.now();
      const tradable = normalized.filter((m) => {
        const endTs = m.endDate ? Date.parse(m.endDate) : Number.NaN;
        const notExpired = Number.isNaN(endTs) ? true : endTs > now;
        return m.active && !m.closed && m.accepting_orders === true && notExpired;
      });

      // Fallbacks
      const openMarkets = normalized.filter((m) => m.active && !m.closed);
      const finalMarkets = tradable.length > 0 ? tradable : openMarkets;

      setDebugInfo({
        endpoint: usedEndpoint,
        rawCount: normalized.length,
        openCount: openMarkets.length,
        finalCount: finalMarkets.length,
      });

      console.log("[Polymarket] Loaded markets:", finalMarkets.length, "(tradable:", tradable.length, ")");
      setAllMarkets(finalMarkets);
      setMarkets(finalMarkets);
    } catch (err) {
      console.error("[Polymarket] Failed to fetch markets:", err);
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError("Failed to load markets");
      setDebugInfo({ error: msg });
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


  const resetPolymarketState = () => {
    setClobClient(null);
    setRelayClient(null);
    setProxyWalletAddress(null);
    setDebugInfo(prev => ({ ...prev, proxyStatus: "reset", polyError: undefined, signerType: undefined }));
  };

  const getClobClient = async () => {
    console.log("[Polymarket] getClobClient called, clobClient:", clobClient ? "exists" : "null");
    setDebugInfo(prev => ({ ...prev, proxyStatus: "getClobClient called..." }));
    
    if (!primaryWallet || !address) {
      setDebugInfo(prev => ({ ...prev, polyError: "Wallet not connected", walletAddress: address || "none" }));
      throw new Error("Wallet not connected");
    }
    if (clobClient) {
      setDebugInfo(prev => ({ ...prev, proxyStatus: "Using cached clobClient" }));
      return clobClient;
    }

    setDebugInfo(prev => ({ ...prev, proxyStatus: "Initializing EOA mode...", walletAddress: address }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let walletClient: any;
    try {
      walletClient = primaryWallet.getWalletClient();
      setDebugInfo(prev => ({ ...prev, signerType: walletClient ? "walletClient" : "none" }));
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);
      setDebugInfo(prev => ({ ...prev, polyError: `getWalletClient failed: ${errMsg}` }));
      throw e;
    }
    
    // Builder config with remote signing (secrets stay server-side)
    let builderConfig;
    try {
      builderConfig = new BuilderConfig({
        remoteBuilderConfig: {
          url: BUILDER_SIGN_URL,
        },
      });
      setDebugInfo(prev => ({ ...prev, proxyStatus: "BuilderConfig OK" }));
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);
      setDebugInfo(prev => ({ ...prev, polyError: `BuilderConfig failed: ${errMsg}` }));
      throw e;
    }

    // Use EOA mode - simpler, no proxy wallet needed
    // User's wallet signs directly, gasless relay handled separately if needed
    setDebugInfo(prev => ({ ...prev, proxyStatus: "Creating ClobClient (EOA)..." }));
    
    try {
      const client = new ClobClient(
        POLYMARKET_API,
        137,
        walletClient as unknown as WalletClient,
        undefined,
        SignatureType.EOA,
        undefined,
        undefined,
        true,
        builderConfig,
      );

      setDebugInfo(prev => ({ ...prev, proxyStatus: "Deriving API key..." }));
      const creds = await client.createOrDeriveApiKey();
      
      setDebugInfo(prev => ({ ...prev, proxyStatus: "Creating authed client..." }));
      const authedClient = new ClobClient(
        POLYMARKET_API,
        137,
        walletClient as unknown as WalletClient,
        creds,
        SignatureType.EOA,
        undefined,
        undefined,
        true,
        builderConfig,
      );
      
      setClobClient(authedClient);
      setDebugInfo(prev => ({ ...prev, proxyStatus: "ClobClient ready (EOA mode)" }));
      return authedClient;
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);
      setDebugInfo(prev => ({ ...prev, polyError: `ClobClient init failed: ${errMsg}` }));
      throw e;
    }
  };

  // Initialize relay client for gasless transactions
  const getRelayClient = async () => {
    if (!primaryWallet || !address) throw new Error("Wallet not connected");
    if (relayClient) return relayClient;

    const walletClient = primaryWallet.getWalletClient();
    const builderConfig = new BuilderConfig({
      remoteBuilderConfig: {
        url: BUILDER_SIGN_URL,
      },
    });

    // Use custom signer wrapper to handle chain mismatch
    const polygonSigner = new PolygonSignerWrapper(walletClient, address);
    const client = new RelayClient(
      RELAYER_URL,
      137,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      polygonSigner as any,
      builderConfig,
      RelayerTxType.PROXY, // Auto-deploys on first transaction
    );

    // Deploy proxy wallet to get address (idempotent)
    if (!proxyWalletAddress) {
      try {
        const deployResponse = await client.deploy();
        const result = await deployResponse.wait();
        if (result?.proxyAddress) {
          setProxyWalletAddress(result.proxyAddress);
        }
      } catch (e) {
        console.warn("[Polymarket] Proxy deploy failed:", e);
      }
    }
    
    setRelayClient(client);
    return client;
  };

  // Approve USDC.e for Polymarket via gasless relayer
  const approveViaRelayer = async () => {
    const relay = await getRelayClient();
    
    const approveTxs = [
      {
        to: USDC_E_ADDRESS,
        data: encodeFunctionData({
          abi: [{
            name: "approve",
            type: "function",
            inputs: [
              { name: "spender", type: "address" },
              { name: "amount", type: "uint256" },
            ],
            outputs: [{ type: "bool" }],
          }],
          functionName: "approve",
          args: [CTF_ADDRESS, maxUint256],
        }),
        value: "0",
      },
      {
        to: USDC_E_ADDRESS,
        data: encodeFunctionData({
          abi: [{
            name: "approve",
            type: "function",
            inputs: [
              { name: "spender", type: "address" },
              { name: "amount", type: "uint256" },
            ],
            outputs: [{ type: "bool" }],
          }],
          functionName: "approve",
          args: [CTF_EXCHANGE, maxUint256],
        }),
        value: "0",
      },
    ];

    const response = await relay.execute(approveTxs, "Approve USDC.e for Polymarket");
    await response.wait();
    return true;
  };

  const formatUnits6 = (v: string | number) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return "0";
    return (n / 1_000_000).toFixed(4);
  };

  const refreshPortfolio = useCallback(async (market?: Market | null) => {
    try {
      const client = await getClobClient();
      const collateral = await client.getBalanceAllowance({ asset_type: AssetType.COLLATERAL });
      setAvailableBalance(collateral?.balance || "0");

      const m = market || selectedMarket;
      if (m?.tokens?.length) {
        const balances: Record<string, string> = {};
        for (const t of m.tokens) {
          const b = await client.getBalanceAllowance({ asset_type: AssetType.CONDITIONAL, token_id: t.token_id });
          balances[t.token_id] = b?.balance || "0";
        }
        setPositionBalances(balances);
      } else {
        setPositionBalances({});
      }
    } catch (e) {
      console.error("[Polymarket] portfolio refresh failed", e);
    }
  }, [selectedMarket]);

  useEffect(() => {
    if (isOpen && address) {
      checkApprovals();
      refreshPortfolio();
    }
  }, [isOpen, address, checkApprovals, refreshPortfolio]);

  useEffect(() => {
    if (isOpen && selectedMarket) {
      refreshPortfolio(selectedMarket);
    }
  }, [isOpen, selectedMarket, refreshPortfolio]);

  // Approve USDC.e for Polymarket contracts (gasless via relayer)
  const handleApprove = async () => {
    if (!primaryWallet || !address) return;
    
    setIsApproving(true);
    setError(null);
    setStatus("Approving USDC.e for Polymarket (gasless)...");

    try {
      await approveViaRelayer();
      setStatus("Approvals complete!");
      setNeedsApproval(false);
      refreshPortfolio();
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

      // Ensure USDC liquidity on Polygon first
      setStatus("Preparing USDC on Polygon...");
      const transaction = await universalAccount.createConvertTransaction({
        expectToken: { type: SUPPORTED_TOKEN_TYPE.USDC, amount: amount },
        chainId: CHAIN_ID.POLYGON_MAINNET,
      });

      setStatus("Waiting for signature...");
      const signature = await walletClient?.signMessage({
        account: address as `0x${string}`,
        message: { raw: transaction.rootHash as `0x${string}` },
      });

      setStatus("Sending funding transaction...");
      const result = await universalAccount.sendTransaction(transaction, signature);
      console.log("[Polymarket] Funding tx:", result.transactionId);

      // Post CLOB market order
      const selectedToken = selectedMarket.tokens?.[selectedOutcome];
      if (!selectedToken?.token_id) {
        throw new Error("Selected market has no tradable token id");
      }

      setStatus("Authenticating with Polymarket CLOB...");
      const client = await getClobClient();

      setStatus("Posting market order...");
      const orderResponse = await client.createAndPostMarketOrder(
        {
          tokenID: selectedToken.token_id,
          side: Side.BUY,
          amount: Number(amount),
        },
        undefined,
        OrderType.FOK,
      );
      console.log("[Polymarket] Order response:", orderResponse);

      setStatus("Order submitted successfully!");
      onSuccess?.();
      await refreshPortfolio(selectedMarket);

    } catch (err) {
      console.error("[Polymarket] Buy failed:", err);
      setError(err instanceof Error ? err.message : "Transaction failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSell = async (tokenId: string, maxAmountRaw: string) => {
    try {
      const client = await getClobClient();
      const shares = Number(maxAmountRaw) / 1_000_000;
      if (!shares || shares <= 0) throw new Error("No position to sell");
      setIsLoading(true);
      setStatus("Posting sell order...");
      const resp = await client.createAndPostMarketOrder(
        {
          tokenID: tokenId,
          side: Side.SELL,
          amount: shares,
        },
        undefined,
        OrderType.FOK,
      );
      console.log("[Polymarket] Sell response:", resp);
      setStatus("Sell order submitted");
      await refreshPortfolio(selectedMarket);
      onSuccess?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sell failed");
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

              <div className="flex items-center justify-between">
                <button
                  onClick={() => setShowDebug(!showDebug)}
                  className="text-xs text-gray-400 hover:text-gray-200"
                >
                  {showDebug ? 'Hide debug' : 'Show debug'}
                </button>
              </div>

              {showDebug && (
                <div className="bg-[#1a1a2e] border border-gray-700 rounded-lg p-3 text-xs text-gray-300 space-y-1">
                  <div className="font-bold text-purple-400 mb-1">Markets Debug:</div>
                  <div>endpoint: {debugInfo.endpoint || 'n/a'}</div>
                  <div>rawCount: {debugInfo.rawCount ?? 0}</div>
                  <div>openCount: {debugInfo.openCount ?? 0}</div>
                  <div>finalCount: {debugInfo.finalCount ?? 0}</div>
                  {debugInfo.error && <div className="text-red-400">error: {debugInfo.error}</div>}
                  
                  <div className="font-bold text-blue-400 mt-2 mb-1">Polymarket Debug:</div>
                  <div>walletAddress: {debugInfo.walletAddress || address || 'n/a'}</div>
                  <div>signerType: {debugInfo.signerType || 'n/a'}</div>
                  <div>proxyStatus: {debugInfo.proxyStatus || 'not started'}</div>
                  <div>proxyWallet: {proxyWalletAddress || 'none'}</div>
                  <div>clobClient: {clobClient ? 'initialized' : 'null'}</div>
                  <div>relayClient: {relayClient ? 'initialized' : 'null'}</div>
                  {debugInfo.polyError && <div className="text-red-400">polyError: {debugInfo.polyError}</div>}
                  <button
                    onClick={resetPolymarketState}
                    className="mt-2 px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-white text-xs"
                  >
                    Reset Polymarket State
                  </button>
                </div>
              )}

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

                {/* Proxy Wallet Deposit Address */}
                {proxyWalletAddress && (
                  <div className="mb-4 bg-[#1a1a2e] rounded-lg p-3 border border-blue-600">
                    <div className="text-xs text-blue-400 mb-1">📥 Deposit Address (Polygon USDC.e)</div>
                    <div className="flex items-center gap-2">
                      <code className="text-xs text-white bg-[#0a0a1a] px-2 py-1 rounded flex-1 overflow-hidden text-ellipsis">
                        {proxyWalletAddress}
                      </code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(proxyWalletAddress);
                          setStatus("Address copied!");
                          setTimeout(() => setStatus(null), 2000);
                        }}
                        className="text-xs bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-white"
                      >
                        Copy
                      </button>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Send USDC.e on Polygon to this address to fund trading
                    </div>
                  </div>
                )}

                {/* Portfolio */}
                <div className="mb-4 bg-[#1a1a2e] rounded-lg p-3 border border-gray-700">
                  <div className="text-xs text-gray-400">Available to trade (USDC)</div>
                  <div className="text-white font-semibold">{formatUnits6(availableBalance)}</div>
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

              {/* Active positions */}
              {selectedMarket.tokens?.length ? (
                <div className="bg-[#1a1a2e] rounded-lg p-3 border border-gray-700">
                  <div className="text-sm text-gray-300 mb-2">Active positions</div>
                  <div className="space-y-2">
                    {selectedMarket.tokens.map((t) => {
                      const raw = positionBalances[t.token_id] || "0";
                      const qty = Number(raw) / 1_000_000;
                      return (
                        <div key={t.token_id} className="flex items-center justify-between bg-[#2a2a4a] rounded px-3 py-2">
                          <div>
                            <div className="text-white text-sm">{t.outcome}</div>
                            <div className="text-xs text-gray-400">{qty.toFixed(4)} shares</div>
                          </div>
                          <button
                            onClick={() => handleSell(t.token_id, raw)}
                            disabled={isLoading || qty <= 0}
                            className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-300 disabled:opacity-40"
                          >
                            Sell
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}

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
                This flow prepares USDC on Polygon and submits a live CLOB market order.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
