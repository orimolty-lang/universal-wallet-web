"use client";

import { useState, useEffect, useCallback } from "react";
import { X, TrendingUp, TrendingDown, Loader2, ExternalLink, Search } from "lucide-react";
import type { UniversalAccount } from "@particle-network/universal-account-sdk";
import { CHAIN_ID, SUPPORTED_TOKEN_TYPE } from "@particle-network/universal-account-sdk";
import { Contract, JsonRpcProvider } from "ethers";
import { useWallets, useAccount } from "@particle-network/connectkit";
import { AssetType, ClobClient, OrderType, Side, SignatureType } from "@polymarket/clob-client";
import { BuilderConfig } from "@polymarket/builder-signing-sdk";
import { RelayClient, RelayerTxType } from "@polymarket/builder-relayer-client";
import type { WalletClient } from "viem";
import { getCreate2Address, keccak256, encodeAbiParameters } from "viem";
import { getLifiSwapQuote } from "../lib/swapService";

const RELAYER_URL = "https://relayer-v2.polymarket.com";
const BUILDER_SIGN_URL = "https://polymarket-builder-worker-ori.orimolty.workers.dev/builder/sign";
const POLYGON_RPC_URL = "https://polygon-bor-rpc.publicnode.com";
const SAFE_FACTORY = "0xaacFeEa03eb1561C4e67d661e40682Bd20E3541b";
const SAFE_INIT_CODE_HASH = "0x2bce2127ff07fb632d16c8347c4ebf501f4841168bed00d9e6ef715ddb6fcecf" as `0x${string}`;


/* eslint-disable @typescript-eslint/no-explicit-any */
class PolygonSignerWrapper {
  private walletClient: any;
  private userAddress: string;
  public chain: { id: number; name: string; network: string; rpcUrls: { default: { http: string[] } } };
  public transport: {
    config: { key: string; name: string; retryCount: number; retryDelay: number; timeout: number; type: string };
    name: string;
    request: (args: { method: string; params?: any[] }) => Promise<any>;
    type: string;
    value: { url: string };
  };
  public account: { address: `0x${string}`; type: string };

  constructor(walletClient: any, address: string) {
    this.walletClient = walletClient;
    this.userAddress = address;
    this.chain = {
      id: 137,
      name: "Polygon",
      network: "matic",
      rpcUrls: { default: { http: [POLYGON_RPC_URL] } },
    };
    this.transport = {
      config: { key: "http", name: "HTTP JSON-RPC", retryCount: 3, retryDelay: 150, timeout: 10000, type: "http" },
      name: "HTTP JSON-RPC",
      request: async (args: { method: string; params?: any[] }) => {
        const response = await fetch(POLYGON_RPC_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jsonrpc: "2.0", id: Date.now(), method: args.method, params: args.params || [] }),
        });
        const json = await response.json();
        if (json.error) throw new Error(json.error.message);
        return json.result;
      },
      type: "http",
      value: { url: POLYGON_RPC_URL },
    };
    this.account = { address: address as `0x${string}`, type: "json-rpc" };
  }

  async signMessage({ message }: { message: string | { raw: any } }): Promise<string> {
    if (typeof message === "object" && "raw" in message) {
      return this.walletClient.signMessage({ account: this.userAddress as `0x${string}`, message: { raw: message.raw } });
    }
    return this.walletClient.signMessage({ account: this.userAddress as `0x${string}`, message: message as string });
  }

  async signTypedData({ domain, types, primaryType, message }: any): Promise<string> {
    return this.walletClient.signTypedData({
      account: this.userAddress as `0x${string}`,
      domain: { ...domain, chainId: 137 },
      types,
      primaryType,
      message,
    });
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

function deriveSafeWallet(ownerAddress: string): `0x${string}` {
  return getCreate2Address({
    bytecodeHash: SAFE_INIT_CODE_HASH,
    from: SAFE_FACTORY,
    salt: keccak256(
      encodeAbiParameters(
        [{ name: "address", type: "address" }],
        [ownerAddress as `0x${string}`],
      ),
    ),
  });
}

// Polymarket API endpoints
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const POLYMARKET_API = "https://clob.polymarket.com"; // For CLOB trading (future)
const GAMMA_API = "https://gamma-api.polymarket.com";
const POLY_PROXY = process.env.NEXT_PUBLIC_POLYMARKET_PROXY_URL || "https://polymarket-proxy-ori.orimolty.workers.dev";

// Contract addresses on Polygon
const USDC_E_ADDRESS = "0x2791bca1f2de4661ed88a30c99a7a9449aa84174";
const BASE_USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
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
    phase?: string;
    safeAddress?: string;
    collateralBalance?: string;
    collateralAllowance?: string;
    conditionalAllowance?: string;
    bestAsk?: string;
    estPrice?: string;
    worstPrice?: string;
    orderId?: string;
    updatedAt?: string;
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

      // Liquid-only filter
      const minLiquidity = 5_000; // USD
      const minVolume = 500; // USD
      const liquidTradable = tradable.filter((m) => {
        const liq = Number(m.liquidity || "0");
        const vol = Number(m.volume || "0");
        return Number.isFinite(liq) && Number.isFinite(vol) && liq >= minLiquidity && vol >= minVolume;
      });

      // Fallbacks
      const openMarkets = normalized.filter((m) => m.active && !m.closed);
      const finalMarkets = liquidTradable.length > 0 ? liquidTradable : (tradable.length > 0 ? tradable : openMarkets);

      setDebugInfo({
        endpoint: usedEndpoint,
        rawCount: normalized.length,
        openCount: openMarkets.length,
        finalCount: finalMarkets.length,
      });

      console.log("[Polymarket] Loaded markets:", finalMarkets.length, "(liquid:", liquidTradable.length, ", tradable:", tradable.length, ")");
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
    if (!address || !primaryWallet) {
      setDebugInfo(prev => ({ ...prev, polyError: "Wallet not connected", walletAddress: "none" }));
      throw new Error("Wallet not connected");
    }

    if (isProxyReady && proxyWalletAddress) {
      setDebugInfo(prev => ({ ...prev, proxyStatus: `Safe: ${proxyWalletAddress.slice(0, 10)}...` }));
      return proxyWalletAddress;
    }

    setDebugInfo(prev => ({ ...prev, phase: "safe_resolve", proxyStatus: "phase=safe_resolve", walletAddress: address, updatedAt: new Date().toISOString() }));

    try {
      const walletClient = primaryWallet.getWalletClient();
      if (!walletClient) throw new Error("No wallet client");

      const builderConfig = new BuilderConfig({
        remoteBuilderConfig: { url: BUILDER_SIGN_URL },
      });

      // RelayClient expects a viem-like signer object; wrap Particle client accordingly.
      const polygonSigner = new PolygonSignerWrapper(walletClient, address);
      const relay = new RelayClient(
        RELAYER_URL,
        137,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        polygonSigner as any,
        builderConfig,
        RelayerTxType.SAFE,
      );

      const response = await relay.deploy();
      const result = await response.wait();
      const safeAddr = result?.proxyAddress;
      if (!safeAddr) throw new Error("Safe deploy returned no address");

      setProxyWalletAddress(safeAddr);
      setIsProxyReady(true);
      setDebugInfo(prev => ({ ...prev, phase: "safe_resolve_done", safeAddress: safeAddr, proxyStatus: `phase=safe_resolve done ${safeAddr.slice(0, 10)}...`, updatedAt: new Date().toISOString() }));
      return safeAddr;
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);

      // If safe already exists, resolve deterministically from signer and continue.
      if (errMsg.toLowerCase().includes("safe already deployed")) {
        const safeAddr = deriveSafeWallet(address);
        setProxyWalletAddress(safeAddr);
        setIsProxyReady(true);
        setDebugInfo(prev => ({ ...prev, phase: "safe_resolve_existing", safeAddress: safeAddr, proxyStatus: `phase=safe_resolve existing ${safeAddr.slice(0, 10)}...`, updatedAt: new Date().toISOString() }));
        return safeAddr;
      }

      console.error("[Polymarket] Safe init failed:", e);
      setDebugInfo(prev => ({ ...prev, polyError: errMsg, proxyStatus: "Init failed" }));
      throw e;
    }
  };

  const ensureProxyFunded = async (humanAmount: string) => {
    if (!universalAccount || !primaryWallet || !address) throw new Error("Wallet not connected");

    const proxy = await initializeProxy();
    const walletClient = primaryWallet.getWalletClient();
    if (!walletClient) throw new Error("No wallet client");

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
          const sig = await walletClient.signMessage({
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
      setDebugInfo(prev => ({ ...prev, proxyStatus: "Funding skipped (enough balance in proxy)" }));
      return { proxy, txId: "already-funded" };
    }

    const shortfall = needed - current;
    const shortfallHuman = (Number(shortfall) / 1_000_000)
      .toFixed(6)
      .replace(/\.0+$/, "")
      .replace(/(\.\d*?)0+$/, "$1");

    setDebugInfo(prev => ({ ...prev, proxyStatus: `Funding shortfall: ${shortfallHuman} USDC.e` }));

    // Step 1: Direct Unified -> Polygon USDC.e via LiFi route
    setDebugInfo(prev => ({ ...prev, proxyStatus: "Phase: quote unified->USDC.e (polygon)" }));
    const smart = await universalAccount.getSmartAccountOptions();
    const smartAddress = smart?.smartAccountAddress || address;

    const sellAmount = String(Math.floor(Number(shortfallHuman) * 1e6));
    const quote = await getLifiSwapQuote(
      smartAddress,
      8453,
      137,
      BASE_USDC_ADDRESS,
      USDC_E_ADDRESS,
      sellAmount,
      100,
    );

    if (!quote.success || !quote.transaction) {
      throw new Error(quote.error || "Failed to quote Unified -> USDC.e route");
    }

    const txs: Array<{ to: string; data: string; value: string }> = [];
    if (quote.allowanceTarget) {
      const approveData = `0x095ea7b3${quote.allowanceTarget.toLowerCase().replace("0x", "").padStart(64, "0")}${BigInt(sellAmount).toString(16).padStart(64, "0")}`;
      txs.push({ to: BASE_USDC_ADDRESS, data: approveData, value: "0" });
    }
    txs.push({
      to: quote.transaction.to,
      data: quote.transaction.data,
      value: quote.transaction.value || "0",
    });

    await sendWithExpiryRetry(
      () => universalAccount.createUniversalTransaction({
        chainId: CHAIN_ID.BASE_MAINNET,
        transactions: txs,
        expectTokens: [{ type: SUPPORTED_TOKEN_TYPE.USDC, amount: shortfallHuman }],
      }),
      "Unified swap to USDC.e",
    );

    // Cross-chain route may settle asynchronously. Wait until Polygon USDC.e is actually available.
    setDebugInfo(prev => ({ ...prev, proxyStatus: "Phase: wait for USDC.e settlement on Polygon" }));
    const smart2 = await universalAccount.getSmartAccountOptions();
    const uaAddress = smart2?.smartAccountAddress || address;

    const waitUntil = Date.now() + 120000; // 2 min
    while (Date.now() < waitUntil) {
      const bal = BigInt((await usdce.balanceOf(uaAddress)).toString());
      if (bal >= shortfall) break;
      await new Promise(r => setTimeout(r, 4000));
    }

    // Step 2: Transfer USDC.e from UA to proxy wallet
    setDebugInfo(prev => ({ ...prev, proxyStatus: "Phase: transfer USDC.e -> proxy" }));
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

  const approveViaRelayer = async () => {
    const proxy = await initializeProxy();
    const clob = await getAuthedClobClient(proxy);

    // Update collateral allowance (USDC.e)
    await clob.updateBalanceAllowance({ asset_type: AssetType.COLLATERAL });

    // If market token is selected, also update conditional token allowance for sell path
    const tokenId = selectedMarket?.tokens?.[selectedOutcome]?.token_id;
    if (tokenId) {
      await clob.updateBalanceAllowance({
        asset_type: AssetType.CONDITIONAL,
        token_id: tokenId,
      });
    }

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
      // Resolve SAFE early so address/balance are visible before trade actions.
      initializeProxy().catch(() => undefined);
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
      if (amountNum <= 0) {
        throw new Error("Amount must be greater than 0.");
      }

      setStatus("Preparing funds (convert + deposit to proxy)...");
      const prep = await ensureProxyFunded(amount);
      console.log("[Polymarket] Funded proxy:", prep.proxy, "tx:", prep.txId);

      // Post CLOB market order
      const selectedToken = selectedMarket.tokens?.[selectedOutcome];
      if (!selectedToken?.token_id) {
        throw new Error("Selected market has no tradable token id");
      }

      setStatus("Checking liquidity...");
      const clob = await getAuthedClobClient(prep.proxy);

      // Strict SAFE preflight: funder + balance + allowances must be ready before submit
      setStatus("Checking SAFE preflight...");
      if (!prep.proxy || !proxyWalletAddress || prep.proxy.toLowerCase() !== proxyWalletAddress.toLowerCase()) {
        throw new Error("SAFE funder mismatch. Re-open modal and retry.");
      }

      const neededRaw = Math.floor(Number(amount) * 1_000_000);

      // Collateral (USDC.e) balance + allowance
      let col = await clob.getBalanceAllowance({ asset_type: AssetType.COLLATERAL });
      setDebugInfo(prev => ({
        ...prev,
        phase: "preflight_collateral",
        collateralBalance: String(col.balance || "0"),
        collateralAllowance: String(col.allowance || "0"),
        updatedAt: new Date().toISOString(),
      }));
      if (Number(col.allowance || "0") < neededRaw) {
        setStatus("Updating collateral allowance...");
        await clob.updateBalanceAllowance({ asset_type: AssetType.COLLATERAL });
        col = await clob.getBalanceAllowance({ asset_type: AssetType.COLLATERAL });
        setDebugInfo(prev => ({
          ...prev,
          collateralBalance: String(col.balance || "0"),
          collateralAllowance: String(col.allowance || "0"),
          updatedAt: new Date().toISOString(),
        }));
      }
      if (Number(col.balance || "0") < neededRaw) {
        throw new Error("Insufficient SAFE USDC.e balance for this order.");
      }
      if (Number(col.allowance || "0") < neededRaw) {
        // Fallback to direct onchain allowance verification (CLOB endpoint can lag)
        const provider = new JsonRpcProvider(POLYGON_RPC_URL);
        const erc20 = new Contract(
          USDC_E_ADDRESS,
          ["function allowance(address owner, address spender) view returns (uint256)"],
          provider,
        );
        const aCtf = BigInt((await erc20.allowance(prep.proxy, CTF_ADDRESS)).toString());
        const aEx = BigInt((await erc20.allowance(prep.proxy, CTF_EXCHANGE)).toString());
        const needed = BigInt(neededRaw);

        setDebugInfo(prev => ({
          ...prev,
          collateralAllowance: `${col.allowance || "0"} (clob) / ctf=${aCtf.toString()} / ex=${aEx.toString()}`,
          updatedAt: new Date().toISOString(),
        }));

        if (aCtf < needed && aEx < needed) {
          throw new Error("SAFE collateral allowance still too low after update.");
        }
      }

      // Conditional token allowance (required for some matching/settlement paths)
      setStatus("Checking conditional allowance...");
      let cond = await clob.getBalanceAllowance({
        asset_type: AssetType.CONDITIONAL,
        token_id: selectedToken.token_id,
      });
      setDebugInfo(prev => ({
        ...prev,
        phase: "preflight_conditional",
        conditionalAllowance: String(cond.allowance || "0"),
        updatedAt: new Date().toISOString(),
      }));
      if (Number(cond.allowance || "0") <= 0) {
        await clob.updateBalanceAllowance({
          asset_type: AssetType.CONDITIONAL,
          token_id: selectedToken.token_id,
        });
        cond = await clob.getBalanceAllowance({
          asset_type: AssetType.CONDITIONAL,
          token_id: selectedToken.token_id,
        });
      }
      if (Number(cond.allowance || "0") <= 0) {
        throw new Error("SAFE conditional allowance missing for this market token.");
      }

      // Live liquidity gate: wait briefly for executable depth (better UX than instant fail/GTC fallback)
      let book: Record<string, unknown> = {};
      let asks: unknown[] = [];
      let estPrice = 0;

      const waitUntil = Date.now() + 20000; // 20s window
      while (Date.now() < waitUntil) {
        book = (await clob.getOrderBook(selectedToken.token_id)) as unknown as Record<string, unknown>;
        asks = (book.asks as unknown[] | undefined) || [];

        if (asks.length > 0) {
          estPrice = await clob
            .calculateMarketPrice(selectedToken.token_id, Side.BUY, Number(amount), OrderType.FAK)
            .catch(() => 0);

          // Dynamic market-specific minimum order size from orderbook
          const minOrderSizeRaw = Number(book.min_order_size || 0);
          if (Number.isFinite(minOrderSizeRaw) && minOrderSizeRaw > 0 && estPrice > 0) {
            const minUsdcApprox = minOrderSizeRaw * estPrice;
            if (Number(amount) < minUsdcApprox) {
              throw new Error(`Min order for this market is ~${minUsdcApprox.toFixed(2)} USDC.e (min size ${minOrderSizeRaw}).`);
            }
          }

          if (Number.isFinite(estPrice) && estPrice > 0 && estPrice < 1) {
            break;
          }
        }

        setDebugInfo(prev => ({ ...prev, proxyStatus: "Waiting for immediate liquidity..." }));
        await new Promise(r => setTimeout(r, 2000));
      }

      if (!asks.length || !Number.isFinite(estPrice) || estPrice <= 0 || estPrice >= 1) {
        throw new Error("No immediate liquidity right now. Try again in a moment.");
      }

      const bestAskObj = (asks[0] ?? {}) as Record<string, unknown>;
      const bestAsk = Number(bestAskObj.price || bestAskObj.p || 0);
      setDebugInfo(prev => ({ ...prev, phase: "liquidity_ok", bestAsk: bestAsk > 0 ? bestAsk.toFixed(4) : "n/a", estPrice: estPrice.toFixed(4), proxyStatus: `Liquidity OK, estPrice=${estPrice.toFixed(4)}`, updatedAt: new Date().toISOString() }));
      setStatus("Posting market order...");

      // Snapshot balances pre-order for fill verification
      const provider = new JsonRpcProvider(POLYGON_RPC_URL);
      const usdce = new Contract(USDC_E_ADDRESS, ["function balanceOf(address) view returns (uint256)"], provider);
      const ctf = new Contract(CTF_ADDRESS, ["function balanceOf(address, uint256) view returns (uint256)"], provider);
      const usdcBefore = BigInt((await usdce.balanceOf(prep.proxy)).toString());
      const posBefore = BigInt((await ctf.balanceOf(prep.proxy, selectedToken.token_id)).toString());

      const verifyFill = async (orderId: string) => {
        for (let i = 0; i < 20; i++) {
          await new Promise(r => setTimeout(r, 2000));

          // On-chain signals
          const usdcAfter = BigInt((await usdce.balanceOf(prep.proxy)).toString());
          const posAfter = BigInt((await ctf.balanceOf(prep.proxy, selectedToken.token_id)).toString());
          if (posAfter > posBefore || usdcAfter < usdcBefore) return true;

          // CLOB signal (if order id is available)
          if (orderId) {
            try {
              const ord = (await clob.getOrder(orderId)) as unknown as Record<string, unknown>;
              const ordState = String(ord.status || ord.state || "").toLowerCase();
              const sizeMatched = Number(ord.size_matched || ord.matched_size || 0);
              if (sizeMatched > 0 || ordState.includes("filled") || ordState.includes("matched")) return true;
            } catch {
              // continue polling
            }
          }
        }
        return false;
      };

      // Immediate execution path per docs: FOK + generous worst-price limit.
      const worstPrice = Math.min(0.99, Math.max(0.01, estPrice * 1.2));
      const impliedShares = Number(amount) / Math.max(worstPrice, 0.01);
      setDebugInfo(prev => ({ ...prev, phase: "submit_order", worstPrice: worstPrice.toFixed(4), proxyStatus: `Posting GTC worst=${worstPrice.toFixed(4)} impliedShares=${impliedShares.toFixed(4)}`, updatedAt: new Date().toISOString() }));

      // Let SDK resolve tick size / fee rate / market flags internally.
      // Marketable GTC: behaves like market order when liquidity exists,
      // and rests on book briefly if no immediate counterparty.
      const gtcPrice = worstPrice;
      const gtcSize = Number(amount) / Math.max(gtcPrice, 0.01);

      const orderResponse = await clob.createAndPostOrder(
        {
          tokenID: selectedToken.token_id,
          side: Side.BUY,
          price: gtcPrice,
          size: gtcSize,
        },
        undefined,
        OrderType.GTC,
      );

      const orderObj = (orderResponse ?? {}) as Record<string, unknown>;
      const orderId = (orderObj.orderID || orderObj.id || orderObj.orderId || "") as string;
      console.log("[Polymarket] Buy order response:", orderResponse);
      setDebugInfo(prev => ({ ...prev, orderId: orderId || "n/a", updatedAt: new Date().toISOString() }));

      const filled = await verifyFill(orderId);
      if (!filled) {
        setDebugInfo(prev => ({
          ...prev,
          proxyStatus: `GTC placed (resting): ${orderId || 'n/a'}`,
          polyError: undefined,
        }));
        setStatus("Order placed on book (resting). Will fill when matched.");
        setTimeout(() => setStatus(null), 4000);
        onSuccess?.();
        await refreshPortfolio(selectedMarket);
        return;
      }

      setStatus("Order filled successfully!");
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
        OrderType.FAK,
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
                  <div>phase: {debugInfo.phase || 'n/a'}</div>
                  <div>proxyStatus: {debugInfo.proxyStatus || 'not started'}</div>
                  <div>proxyWallet: {proxyWalletAddress || 'none'}</div>
                  <div>safeAddress: {debugInfo.safeAddress || proxyWalletAddress || 'none'}</div>
                  <div>proxyReady: {isProxyReady ? 'yes' : 'no'}</div>
                  <div>collateralBalance: {debugInfo.collateralBalance || 'n/a'}</div>
                  <div>collateralAllowance: {debugInfo.collateralAllowance || 'n/a'}</div>
                  <div>conditionalAllowance: {debugInfo.conditionalAllowance || 'n/a'}</div>
                  <div>bestAsk: {debugInfo.bestAsk || 'n/a'}</div>
                  <div>estPrice: {debugInfo.estPrice || 'n/a'}</div>
                  <div>worstPrice: {debugInfo.worstPrice || 'n/a'}</div>
                  <div>orderId: {debugInfo.orderId || 'n/a'}</div>
                  <div>updatedAt: {debugInfo.updatedAt || 'n/a'}</div>
                  <div>directAPI: enabled</div>
                  {debugInfo.polyError && <div className="text-red-400">polyError: {debugInfo.polyError}</div>}
                  <div className="mt-2 p-2 bg-black/40 rounded max-h-40 overflow-auto text-[10px] leading-tight">
                    <div className="text-gray-400 mb-1">Live JSON:</div>
                    <pre className="whitespace-pre-wrap break-words">{JSON.stringify(debugInfo, null, 2)}</pre>
                  </div>
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

                {/* Safe Wallet Info */}
                {proxyWalletAddress && (
                  <div className="mb-4 bg-[#1a1a2e] rounded-lg p-3 border border-blue-600">
                    <div className="text-xs text-blue-400 mb-1">🛡️ Safe Wallet (Polygon)</div>
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
                      Trading funder wallet for Polymarket (USDC.e on Polygon)
                    </div>
                    <div className="text-xs text-gray-400 mt-2">Safe USDC.e Balance</div>
                    <div className="text-white font-semibold">{formatUnits6(availableBalance)}</div>
                  </div>
                )}

                {/* Portfolio */}
                <div className="mb-4 bg-[#1a1a2e] rounded-lg p-3 border border-gray-700">
                  <div className="text-xs text-gray-400">Available to trade (USDC.e)</div>
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
