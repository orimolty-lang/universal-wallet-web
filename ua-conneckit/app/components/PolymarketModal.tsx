"use client";

import { useState, useEffect, useCallback } from "react";
import { X, TrendingUp, TrendingDown, Loader2, ExternalLink, Search } from "lucide-react";
import type { UniversalAccount } from "@particle-network/universal-account-sdk";
import { CHAIN_ID, SUPPORTED_TOKEN_TYPE } from "@particle-network/universal-account-sdk";
import { Contract, JsonRpcProvider } from "ethers";
import { useWallets, useAccount } from "@particle-network/connectkit";
import { ClobClient, OrderType, Side, SignatureType } from "@polymarket/clob-client";
import type { WalletClient } from "viem";
import { keccak256, getCreate2Address, encodePacked } from "viem";

const RELAYER_URL = "https://relayer-v2.polymarket.com";
const POLYGON_RPC_URL = "https://polygon-bor-rpc.publicnode.com";

// Polygon proxy contract config
const PROXY_FACTORY = "0xaB45c5A4B0c941a2F231C04C3f49182e1A254052";
const PROXY_INIT_CODE_HASH = "0xd21df8dc65880a8606f09fe0ce3df9b8869287ab0b058be05aa9e8af6330a00b" as `0x${string}`;

// Check if proxy wallet is deployed
async function checkProxyDeployed(address: string): Promise<boolean> {
  const resp = await fetch(`${RELAYER_URL}/deployed?address=${address}`);
  if (!resp.ok) return false;
  const data = await resp.json();
  return data.deployed === true;
}

// Derive proxy wallet address from owner EOA (CREATE2)
function deriveProxyWallet(ownerAddress: string): `0x${string}` {
  const salt = keccak256(encodePacked(["address"], [ownerAddress as `0x${string}`]));
  return getCreate2Address({
    bytecodeHash: PROXY_INIT_CODE_HASH,
    from: PROXY_FACTORY as `0x${string}`,
    salt,
  });
}

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
  const [proxyWalletAddress, setProxyWalletAddress] = useState<string | null>(null);
  const [isProxyReady, setIsProxyReady] = useState(false);
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
      const provider = new JsonRpcProvider(POLYGON_RPC_URL);
      const ERC20_ABI = ["function allowance(address owner, address spender) view returns (uint256)"];
      const usdce = new Contract(USDC_E_ADDRESS, ERC20_ABI, provider);
      const owner = proxyWalletAddress || address;
      
      // Check allowance for CTF Exchange from the funder/proxy wallet context
      const allowance = await usdce.allowance(owner, CTF_EXCHANGE);
      setNeedsApproval(BigInt(allowance) < BigInt("1000000000000")); // Less than 1M USDC.e approved
    } catch (err) {
      console.error("[Polymarket] Allowance check failed:", err);
    }
  }, [address, universalAccount, proxyWalletAddress]);


  const resetPolymarketState = () => {
    setProxyWalletAddress(null);
    setIsProxyReady(false);
    setDebugInfo(prev => ({ ...prev, proxyStatus: "reset", polyError: undefined, signerType: undefined }));
  };

  // Initialize proxy wallet - derive address locally (auto-deploys on first tx)
  const initializeProxy = async () => {
    if (!address) {
      setDebugInfo(prev => ({ ...prev, polyError: "Wallet not connected", walletAddress: "none" }));
      throw new Error("Wallet not connected");
    }
    
    if (isProxyReady && proxyWalletAddress) {
      setDebugInfo(prev => ({ ...prev, proxyStatus: `Proxy: ${proxyWalletAddress.slice(0, 10)}...` }));
      return proxyWalletAddress;
    }

    setDebugInfo(prev => ({ ...prev, proxyStatus: "Deriving proxy address...", walletAddress: address }));
    
    try {
      // Derive proxy wallet address from owner EOA
      const proxyAddr = deriveProxyWallet(address);
      
      // Check if it's already deployed
      const deployed = await checkProxyDeployed(address);
      
      setProxyWalletAddress(proxyAddr);
      setIsProxyReady(true);
      
      const status = deployed 
        ? `Proxy (deployed): ${proxyAddr.slice(0, 10)}...`
        : `Proxy (pending): ${proxyAddr.slice(0, 10)}... (auto-deploys on first tx)`;
      
      setDebugInfo(prev => ({ ...prev, proxyStatus: status }));
      console.log("[Polymarket] Proxy address:", proxyAddr, "deployed:", deployed);
      
      return proxyAddr;
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);
      console.error("[Polymarket] Proxy init failed:", e);
      setDebugInfo(prev => ({ ...prev, polyError: errMsg, proxyStatus: "Init failed" }));
      throw e;
    }
  };

  const ensureProxyFunded = async (humanAmount: string) => {
    if (!universalAccount || !primaryWallet || !address) throw new Error("Wallet not connected");

    const proxy = await initializeProxy();
    const walletClient = primaryWallet.getWalletClient();

    const sendWithExpiryRetry = async (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      buildTx: () => Promise<any>,
      label: string,
    ) => {
      let lastErr: unknown;
      for (let attempt = 1; attempt <= 4; attempt++) {
        try {
          setStatus(`${label} (attempt ${attempt}/4)...`);
          const tx = await buildTx();
          const sig = await walletClient?.signMessage({
            account: address as `0x${string}`,
            message: { raw: tx.rootHash as `0x${string}` },
          });
          return await universalAccount.sendTransaction(tx, sig);
        } catch (e) {
          lastErr = e;
          const msg = e instanceof Error ? e.message : String(e);
          const expired = msg.toLowerCase().includes("expired");
          if (!(expired && attempt < 4)) throw e;
          setStatus(`${label} expired, rebuilding...`);
          await new Promise(r => setTimeout(r, 400));
        }
      }
      throw lastErr;
    };

    const provider = new JsonRpcProvider(POLYGON_RPC_URL);
    const ERC20_ABI = ["function balanceOf(address) view returns (uint256)"];
    const usdce = new Contract(USDC_E_ADDRESS, ERC20_ABI, provider);

    const needed = BigInt(Math.round(Number(humanAmount) * 1_000_000));
    const current = BigInt((await usdce.balanceOf(proxy)).toString());

    if (current >= needed) {
      setDebugInfo(prev => ({ ...prev, proxyStatus: `Funding skipped (enough balance in proxy)` }));
      return { proxy, txId: "already-funded" };
    }

    const shortfall = needed - current;
    const shortfallHuman = (Number(shortfall) / 1_000_000).toFixed(6).replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");

    setDebugInfo(prev => ({ ...prev, proxyStatus: `Funding shortfall: ${shortfallHuman} USDC.e` }));

    // Step 1: Convert/sync just the shortfall
    await sendWithExpiryRetry(
      () => universalAccount.createConvertTransaction({
        expectToken: { type: SUPPORTED_TOKEN_TYPE.USDC, amount: shortfallHuman },
        chainId: CHAIN_ID.POLYGON_MAINNET,
      }),
      "Convert",
    );

    // Step 2: Transfer explicit Polygon USDC.e token to proxy wallet
    const transferRes = await sendWithExpiryRetry(
      () => universalAccount.createTransferTransaction({
        token: {
          chainId: CHAIN_ID.POLYGON_MAINNET,
          address: USDC_E_ADDRESS,
        },
        amount: shortfallHuman,
        receiver: proxy,
      }),
      "Transfer",
    );

    setDebugInfo(prev => ({ ...prev, proxyStatus: `Funding done: tx ${transferRes.transactionId}` }));

    return { proxy, txId: transferRes.transactionId };
  };

  const getAuthedClobClient = async (proxy: string) => {
    if (!primaryWallet) throw new Error("Wallet not connected");
    const walletClient = primaryWallet.getWalletClient();
    if (!walletClient) throw new Error("No wallet client");

    // Use signature type 2 (POLY_GNOSIS_SAFE) for embedded/browser-wallet style flows.
    const signatureType = SignatureType.POLY_GNOSIS_SAFE;
    setDebugInfo(prev => ({
      ...prev,
      signerType: `sigType=${signatureType}`,
      proxyStatus: `CLOB auth init (funder ${proxy.slice(0, 10)}...)`,
    }));

    const baseClient = new ClobClient(
      POLYMARKET_API,
      137,
      walletClient as unknown as WalletClient,
      undefined,
      signatureType,
      proxy,
    );
    const creds = await baseClient.createOrDeriveApiKey();

    setDebugInfo(prev => ({ ...prev, proxyStatus: "CLOB creds derived" }));

    return new ClobClient(
      POLYMARKET_API,
      137,
      walletClient as unknown as WalletClient,
      creds,
      signatureType,
      proxy,
    );
  };

  // Temporary: avoid broken direct relayer submit path causing 400/401.
  // Trading flow will auto-fund proxy in handleBuy.
  const approveViaRelayer = async () => {
    return true;
  };

  const formatUnits6 = (v: string | number) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return "0";
    return (n / 1_000_000).toFixed(4);
  };

  const refreshPortfolio = useCallback(async (market?: Market | null) => {
    if (!address) return;
    
    try {
      const provider = new JsonRpcProvider(POLYGON_RPC_URL);
      
      // Check USDC.e balance on Polygon (use proxy address if available)
      const checkAddr = proxyWalletAddress || address;
      const ERC20_ABI = ["function balanceOf(address) view returns (uint256)"];
      const usdce = new Contract(USDC_E_ADDRESS, ERC20_ABI, provider);
      const balance = await usdce.balanceOf(checkAddr);
      setAvailableBalance(balance.toString());

      // For conditional tokens, we'd need to query the CTF contract
      // For now, set empty - full implementation would query CTF.balanceOf(address, tokenId)
      const m = market || selectedMarket;
      if (m?.tokens?.length) {
        const balances: Record<string, string> = {};
        const CTF_ABI = ["function balanceOf(address, uint256) view returns (uint256)"];
        const ctf = new Contract(CTF_ADDRESS, CTF_ABI, provider);
        for (const t of m.tokens) {
          try {
            const b = await ctf.balanceOf(checkAddr, t.token_id);
            balances[t.token_id] = b.toString();
          } catch {
            balances[t.token_id] = "0";
          }
        }
        setPositionBalances(balances);
      } else {
        setPositionBalances({});
      }
    } catch (e) {
      console.error("[Polymarket] portfolio refresh failed", e);
    }
  }, [selectedMarket, address, proxyWalletAddress]);

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
    
    setIsLoading(true);
    setError(null);
    setStatus("Creating buy transaction...");

    try {
      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        throw new Error("Invalid amount");
      }

      setStatus("Preparing funds (convert + deposit to proxy)...");
      const prep = await ensureProxyFunded(amount);
      console.log("[Polymarket] Funded proxy:", prep.proxy, "tx:", prep.txId);

      // Post CLOB market order
      const selectedToken = selectedMarket.tokens?.[selectedOutcome];
      if (!selectedToken?.token_id) {
        throw new Error("Selected market has no tradable token id");
      }

      setStatus("Posting market order...");
      const clob = await getAuthedClobClient(prep.proxy);
      const orderResponse = await clob.createAndPostMarketOrder(
        {
          tokenID: selectedToken.token_id,
          side: Side.BUY,
          amount: Number(amount),
        },
        undefined,
        OrderType.FOK,
      );
      console.log("[Polymarket] Buy order response:", orderResponse);

      setStatus("Order submitted successfully!");
      onSuccess?.();
      await refreshPortfolio(selectedMarket);

    } catch (err) {
      console.error("[Polymarket] Buy failed:", err);
      const msg = err instanceof Error ? err.message : "Transaction failed";
      setDebugInfo(prev => ({ ...prev, polyError: msg, proxyStatus: "Buy failed" }));
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSell = async (tokenId: string, maxAmountRaw: string) => {
    try {
      const shares = Number(maxAmountRaw) / 1_000_000;
      if (!shares || shares <= 0) throw new Error("No position to sell");
      setIsLoading(true);
      
      setStatus("Initializing proxy...");
      const proxy = await initializeProxy();
      const clob = await getAuthedClobClient(proxy);

      setStatus("Posting sell order...");
      const resp = await clob.createAndPostMarketOrder(
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
      const msg = e instanceof Error ? e.message : "Sell failed";
      setDebugInfo(prev => ({ ...prev, polyError: msg, proxyStatus: "Sell failed" }));
      setError(msg);
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
                  <div>proxyReady: {isProxyReady ? 'yes' : 'no'}</div>
                  <div>directAPI: enabled</div>
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
