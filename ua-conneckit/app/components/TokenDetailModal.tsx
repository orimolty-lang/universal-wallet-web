/* eslint-disable @next/next/no-img-element */
"use client";
import { useEffect, useState, useRef } from "react";

// Types
interface TokenContract {
  address: string;
  blockchain: string;
}

interface TokenData {
  id: string;
  symbol: string;
  name: string;
  logo?: string;
  price?: number;
  price_change_24h?: number;
  market_cap?: number;
  contracts?: TokenContract[];
  liquidity?: number;
  volume?: number;
  twitter?: string;
  website?: string;
  totalSupply?: number;
  circulatingSupply?: number;
  description?: string;
}

interface UserBalance {
  amount: number;
  amountInUSD: number;
}

const WATCHLIST_STORAGE_KEY = "omni_swap_watchlist_v1";

interface TokenDetailModalProps {
  token: TokenData | null;
  userBalance?: UserBalance | null;
  onClose: () => void;
  onSwap?: (token: TokenData) => void;
  onSend?: (token: TokenData) => void;
  onWatchlistChange?: () => void;
}

// Helper functions
const formatPrice = (price: number): string => {
  if (price === 0) return "$0.00";
  if (price < 0.000001) return `$${price.toFixed(10).replace(/\.?0+$/, "")}`;
  if (price < 0.01) return `$${price.toFixed(8).replace(/\.?0+$/, "")}`;
  if (price < 1) return `$${price.toFixed(4)}`;
  if (price < 1000) return `$${price.toFixed(2)}`;
  return `$${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
};

const formatLargeNumber = (num: number): string => {
  if (!num || num === 0) return "N/A";
  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
  return `$${num.toFixed(2)}`;
};

const formatSupply = (num: number): string => {
  if (!num || num === 0) return "N/A";
  if (num >= 1e12) return `${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
  return num.toLocaleString();
};

const formatAddress = (addr: string): string => {
  if (!addr) return "";
  return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
};

// Chain logo URLs
const CHAIN_LOGOS: Record<string, string> = {
  "ethereum": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png",
  "base": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/info/logo.png",
  "arbitrum": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/info/logo.png",
  "optimism": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/optimism/info/logo.png",
  "polygon": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png",
  "bsc": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/info/logo.png",
  "bnb": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/info/logo.png",
  "solana": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png",
  "avalanche": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/avalanchec/info/logo.png",
};

// Map blockchain names to block explorer token URLs (for "View on Explorer")
const EXPLORER_TOKEN_URLS: Record<string, string> = {
  ethereum: "https://etherscan.io/token/",
  base: "https://basescan.org/token/",
  arbitrum: "https://arbiscan.io/token/",
  optimism: "https://optimistic.etherscan.io/token/",
  polygon: "https://polygonscan.com/token/",
  bsc: "https://bscscan.com/token/",
  bnb: "https://bscscan.com/token/",
  solana: "https://explorer.solana.com/address/",
  avalanche: "https://snowtrace.io/token/",
};

// Map blockchain names to DEXScreener/GeckoTerminal network slugs
const NETWORK_SLUGS: Record<string, { dexscreener: string; geckoterminal: string }> = {
  "ethereum": { dexscreener: "ethereum", geckoterminal: "eth" },
  "base": { dexscreener: "base", geckoterminal: "base" },
  "arbitrum": { dexscreener: "arbitrum", geckoterminal: "arbitrum" },
  "optimism": { dexscreener: "optimism", geckoterminal: "optimism" },
  "polygon": { dexscreener: "polygon", geckoterminal: "polygon_pos" },
  "bsc": { dexscreener: "bsc", geckoterminal: "bsc" },
  "bnb": { dexscreener: "bsc", geckoterminal: "bsc" },
  "solana": { dexscreener: "solana", geckoterminal: "solana" },
  "avalanche": { dexscreener: "avalanche", geckoterminal: "avax" },
};

const normalizeBlockchain = (blockchain?: string): string => {
  if (!blockchain) return "";
  const raw = blockchain.trim().toLowerCase();
  if (!raw) return "";
  if (raw.includes("sol")) return "solana";
  if (raw.includes("arb")) return "arbitrum";
  if (raw.includes("optim")) return "optimism";
  if (raw.includes("polygon") || raw === "matic") return "polygon";
  if (raw.includes("avax") || raw.includes("avalanche")) return "avalanche";
  if (raw.includes("bnb") || raw.includes("bsc") || raw.includes("binance")) return "bsc";
  if (raw.includes("eth") || raw.includes("erc20")) return "ethereum";
  if (raw.includes("base")) return "base";
  return raw;
};

// Embedded Chart Component using GeckoTerminal
const EmbeddedChart = ({ 
  tokenAddress,
  blockchain,
}: { 
  tokenAddress?: string;
  blockchain?: string;
}) => {
  const [loading, setLoading] = useState(true);
  
  // Get network slug for GeckoTerminal (use normalized chain for BNB/BSC/ETH aliases)
  const normalized = blockchain ? normalizeBlockchain(blockchain) : "";
  const networkSlug = normalized ? NETWORK_SLUGS[normalized] : null;
  
  if (!tokenAddress || !networkSlug) {
    return (
      <div className="mt-4 h-[360px] bg-black/30 rounded-xl flex items-center justify-center">
        <span className="text-gray-500 text-sm">No chart available</span>
      </div>
    );
  }

  return (
    <div className="mt-4">
      {/* Chart Container - Full Size */}
      <div className="relative rounded-xl overflow-hidden bg-black/30" style={{ height: '360px' }}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-10">
            <div className="flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-accent-dynamic border-t-transparent rounded-full animate-spin" />
              <span className="text-gray-500 text-sm">Loading chart...</span>
            </div>
          </div>
        )}
        
        <iframe
          src={`https://www.geckoterminal.com/${networkSlug.geckoterminal}/tokens/${tokenAddress}?embed=1&info=0&swaps=0`}
          title="Token Chart"
          className="w-full h-full border-0"
          style={{ 
            colorScheme: 'dark',
            background: 'transparent',
          }}
          onLoad={() => setLoading(false)}
          allow="clipboard-write"
          sandbox="allow-scripts allow-same-origin allow-popups"
        />
      </div>
    </div>
  );
};

// Expandable Section Component
const ExpandableSection = ({
  icon,
  title,
  defaultExpanded = false,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  defaultExpanded?: boolean;
  children: React.ReactNode;
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className="border-t border-gray-800/50">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between py-4 px-1"
      >
        <div className="flex items-center gap-3">
          <span className="text-accent-dynamic">{icon}</span>
          <span className="text-white font-medium">{title}</span>
        </div>
        <span
          className={`text-accent-dynamic transition-transform ${
            expanded ? "rotate-180" : ""
          }`}
        >
          ▼
        </span>
      </button>
      {expanded && <div className="pb-4">{children}</div>}
    </div>
  );
};

// Main Token Detail Modal
export const TokenDetailModal = ({
  token,
  userBalance,
  onClose,
  onSwap,
  onSend,
  onWatchlistChange,
}: TokenDetailModalProps) => {
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [fallbackMetrics, setFallbackMetrics] = useState<{ volume?: number; liquidity?: number; priceChange24h?: number } | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef<number | null>(null);
  const currentYRef = useRef<number>(0);

  const getClientY = (e: React.TouchEvent | React.MouseEvent) =>
    "touches" in e ? (e as React.TouchEvent).touches[0]?.clientY : (e as React.MouseEvent).clientY;

  const handleDragStart = (e: React.TouchEvent | React.MouseEvent) => {
    startYRef.current = getClientY(e);
  };

  const handleDragMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (startYRef.current === null || !modalRef.current) return;
    const y = getClientY(e);
    const deltaY = y - startYRef.current;
    if (deltaY > 0) {
      currentYRef.current = deltaY;
      modalRef.current.style.transform = `translateY(${deltaY}px)`;
    }
  };

  const handleDragEnd = () => {
    if (!modalRef.current) return;
    if (currentYRef.current > 100) {
      onClose();
    } else {
      modalRef.current.style.transform = "";
    }
    startYRef.current = null;
    currentYRef.current = 0;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    handleDragStart(e);
    const onMouseMove = (ev: MouseEvent) => handleDragMove(ev as unknown as React.MouseEvent);
    const onMouseUp = () => {
      handleDragEnd();
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  const dragHandlers = {
    onTouchStart: handleDragStart,
    onTouchMove: handleDragMove,
    onTouchEnd: handleDragEnd,
    onMouseDown: handleMouseDown,
  };

  const handleCopyContract = (addr: string) => {
    navigator.clipboard.writeText(addr);
    setShowMoreMenu(false);
  };

  const handleViewOnExplorer = (contract: { address: string; blockchain: string }) => {
    const norm = normalizeBlockchain(contract.blockchain);
    const base = EXPLORER_TOKEN_URLS[norm] || EXPLORER_TOKEN_URLS.ethereum;
    const url = norm === "solana" ? `${base}${contract.address}` : `${base}${contract.address}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setShowMoreMenu(false);
  };

  const handleAddToWatchlist = () => {
    if (!token?.id) return;
    try {
      const raw = localStorage.getItem(WATCHLIST_STORAGE_KEY);
      const tokens: Array<{ id: string; symbol: string; name: string; logo?: string; price?: number; contracts?: TokenContract[] }> = raw ? JSON.parse(raw) : [];
      if (!tokens.some((t) => t.id === token.id)) {
        tokens.unshift({
          id: token.id,
          symbol: token.symbol,
          name: token.name,
          logo: token.logo,
          price: token.price,
          contracts: token.contracts,
        });
        localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(tokens.slice(0, 50)));
      }
      onWatchlistChange?.();
    } catch {
      // ignore
    }
    setShowMoreMenu(false);
  };

  useEffect(() => {
    let cancelled = false;
    setFallbackMetrics(null);
    const loadFallbackMetrics = async () => {
      if (!token?.contracts?.length) return;
      if (token.volume && token.liquidity && typeof token.price_change_24h === "number") return;
      const contract = token.contracts[0];
      if (!contract?.address) return;
      try {
        const normalized = normalizeBlockchain(contract.blockchain);
        const dexChain = NETWORK_SLUGS[normalized]?.dexscreener;
        const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${contract.address}`);
        if (!res.ok) return;
        const data = await res.json();
        const allPairs = Array.isArray(data?.pairs) ? data.pairs : [];
        if (!allPairs.length) return;
        const filtered = dexChain
          ? allPairs.filter((p: { chainId?: string }) => (p.chainId || "").toLowerCase() === dexChain)
          : allPairs;
        const pairs = filtered.length ? filtered : allPairs;
        const best = [...pairs].sort((a: {
          volume?: { h24?: number | string };
          liquidity?: { usd?: number | string };
        }, b: {
          volume?: { h24?: number | string };
          liquidity?: { usd?: number | string };
        }) => {
          const av = Number(a?.volume?.h24 || 0);
          const bv = Number(b?.volume?.h24 || 0);
          const al = Number(a?.liquidity?.usd || 0);
          const bl = Number(b?.liquidity?.usd || 0);
          return (bv * 1.5 + bl) - (av * 1.5 + al);
        })[0] as {
          volume?: { h24?: number | string };
          liquidity?: { usd?: number | string };
          priceChange?: { h24?: number | string };
        };
        if (cancelled) return;
        setFallbackMetrics({
          volume: Number(best?.volume?.h24 || 0) || undefined,
          liquidity: Number(best?.liquidity?.usd || 0) || undefined,
          priceChange24h: Number(best?.priceChange?.h24 || 0) || undefined,
        });
      } catch {
        // ignore fallback errors
      }
    };
    loadFallbackMetrics();
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (!token) return null;

  const displayedVolume = token.volume || fallbackMetrics?.volume || 0;
  const displayedLiquidity = token.liquidity || fallbackMetrics?.liquidity || 0;
  const hasKnownPriceChange = typeof token.price_change_24h === "number" || typeof fallbackMetrics?.priceChange24h === "number";
  const priceChange = typeof token.price_change_24h === "number" ? token.price_change_24h : (fallbackMetrics?.priceChange24h || 0);
  const priceChangePositive = priceChange >= 0;

  // Get primary contract address (first one)
  const primaryContract = token.contracts?.[0];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-40"
        onClick={onClose}
      />

      {/* Modal - uses dynamic theme */}
      <div 
        ref={modalRef}
        className="fixed inset-x-0 bottom-0 z-50 max-h-[90vh] bg-[#0a0a0a] rounded-t-3xl overflow-hidden flex flex-col animate-slide-up border-t border-white/10"
        style={{ touchAction: 'pan-y', paddingTop: 'env(safe-area-inset-top)' }}
      >
        {/* Drag handle - visible bar, larger touch target */}
        <div 
          className="flex justify-center pt-4 pb-4 cursor-grab active:cursor-grabbing shrink-0 touch-none select-none"
          {...dragHandlers}
        >
          <div className="w-12 h-1.5 bg-white/30 rounded-full" />
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 pb-24 min-h-0 overscroll-contain">
          {/* Token Header */}
          <div className="flex items-center gap-3 mb-1">
            <div className="relative">
              {token.logo ? (
                <img
                  src={token.logo}
                  alt={token.symbol}
                  className="w-10 h-10 rounded-full"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-accent-dynamic flex items-center justify-center text-white font-bold">
                  {token.symbol.slice(0, 2)}
                </div>
              )}
              {/* Single chain badge on logo only - no duplicate badges next to name */}
              {token.contracts && token.contracts.length > 0 && (() => {
                const normalized = normalizeBlockchain(token.contracts[0].blockchain);
                const logoUrl = normalized ? CHAIN_LOGOS[normalized] : CHAIN_LOGOS[token.contracts[0].blockchain.toLowerCase()];
                return logoUrl ? (
                  <img 
                    src={logoUrl}
                    alt=""
                    className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#0d1b2a]"
                  />
                ) : null;
              })()}
            </div>
            <div>
              <span className="text-accent-dynamic font-medium text-lg">{token.name}</span>
            </div>
          </div>

          {/* Price Display */}
          <div className="mb-1">
            <span className="text-white text-4xl font-bold">
              {formatPrice(token.price || 0)}
            </span>
          </div>

          {/* Price Change */}
          <div className="flex items-center gap-2 mb-4">
            {hasKnownPriceChange && (
              <span
                className={`text-sm font-medium ${
                  priceChangePositive ? "text-green-500" : "text-red-500"
                }`}
              >
                {priceChangePositive ? "↑" : "↓"}
                {Math.abs(priceChange).toFixed(2)}%
              </span>
            )}
            <span className="text-gray-500 text-sm bg-gray-800 px-2 py-0.5 rounded">
              24h
            </span>
          </div>

          {/* Embedded Real-time Chart */}
          <EmbeddedChart
            tokenAddress={primaryContract?.address}
            blockchain={primaryContract?.blockchain}
          />

          {/* User Balance Card */}
          {userBalance && userBalance.amount > 0 && (
            <div className="mt-6 bg-white/5 rounded-xl p-4 flex items-center justify-between border border-white/10">
              <div>
                <div className="text-gray-400 text-xs">Balance</div>
                <div className="flex items-center gap-2 mt-1">
                  {token.logo ? (
                    <img src={token.logo} alt="" className="w-5 h-5 rounded-full" />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-accent-dynamic" />
                  )}
                  <span className="text-white font-medium">
                    {userBalance.amount.toFixed(2)} {token.symbol}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-gray-400 text-xs">Value</div>
                <div className="text-white font-bold text-lg">
                  ${userBalance.amountInUSD.toFixed(2)}
                </div>
              </div>
            </div>
          )}

          {/* Market Stats - Expandable */}
          <div className="mt-4">
            <ExpandableSection
              icon={<span>📊</span>}
              title="Market Stats"
              defaultExpanded={true}
            >
              <div className="space-y-3 px-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <span>$</span>
                    <span>Market Cap</span>
                  </div>
                  <span className="text-accent-dynamic font-medium">
                    {formatLargeNumber(token.market_cap || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <span>📈</span>
                    <span>24h Volume</span>
                  </div>
                  <span className="text-accent-dynamic font-medium">
                    {formatLargeNumber(displayedVolume)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <span>💧</span>
                    <span>Liquidity</span>
                  </div>
                  <span className="text-accent-dynamic font-medium">
                    {formatLargeNumber(displayedLiquidity)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <span>⏱️</span>
                    <span>Fully Diluted Valuation</span>
                  </div>
                  <span className="text-accent-dynamic font-medium">
                    {formatLargeNumber((token.totalSupply || 0) * (token.price || 0))}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <span>🔄</span>
                    <span>Circulating Supply</span>
                  </div>
                  <span className="text-accent-dynamic font-medium">
                    {formatSupply(token.circulatingSupply || token.totalSupply || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <span>⬆️</span>
                    <span>Max Supply</span>
                  </div>
                  <span className="text-accent-dynamic font-medium">
                    {formatSupply(token.totalSupply || 0)}
                  </span>
                </div>
              </div>
            </ExpandableSection>

            {/* History - Expandable */}
            <ExpandableSection icon={<span>🕐</span>} title="History">
              <div className="px-1">
                <div className="text-gray-500 text-sm text-center py-4">
                  No transaction history for this token
                </div>
              </div>
            </ExpandableSection>

            {/* About - Expandable */}
            <ExpandableSection icon={<span>ℹ️</span>} title="About">
              <div className="space-y-3 px-1">
                {primaryContract && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <span>👤</span>
                      <span>Creator</span>
                    </div>
                    <span className="text-accent-dynamic font-mono text-sm">
                      {formatAddress(primaryContract.address)}
                    </span>
                  </div>
                )}
              </div>
            </ExpandableSection>

            {/* Details - Expandable */}
            <ExpandableSection icon={<span>📋</span>} title="Details">
              <div className="space-y-3 px-1">
                {token.website && (
                  <a
                    href={token.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between py-1"
                  >
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <span>🏠</span>
                      <span>Website</span>
                    </div>
                    <span className="text-accent-dynamic text-sm flex items-center gap-1">
                      {new URL(token.website).hostname.replace("www.", "")}
                      <span>↗</span>
                    </span>
                  </a>
                )}
                {token.twitter && (
                  <a
                    href={token.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between py-1"
                  >
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <span>𝕏</span>
                      <span>X Account</span>
                    </div>
                    <span className="text-accent-dynamic text-sm flex items-center gap-1">
                      {(() => {
                        try {
                          const url = new URL(token.twitter);
                          const handle = url.pathname.replace(/^\//, '').split('/')[0];
                          return handle ? `@${handle}` : '';
                        } catch { return ''; }
                      })()}
                      <span>↗</span>
                    </span>
                  </a>
                )}

                {/* Token Description */}
                {token.description && (
                  <div className="mt-4">
                    <h4 className="text-white font-medium mb-2">
                      What is {token.name}?
                    </h4>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      {token.description}
                    </p>
                  </div>
                )}
              </div>
            </ExpandableSection>

            {/* Contracts */}
            {token.contracts && token.contracts.length > 0 && (
              <ExpandableSection icon={<span>📝</span>} title="Contracts">
                <div className="space-y-2 px-1">
                  {token.contracts.map((contract, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-2 py-1"
                    >
                      <span className="text-gray-400 text-sm shrink-0">
                        {contract.blockchain}
                      </span>
                      <span className="text-accent-dynamic font-mono text-xs break-all text-right flex-1 min-w-0">
                        {contract.address}
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(contract.address);
                        }}
                        className="shrink-0 w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20"
                        aria-label="Copy contract"
                      >
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h2m8 0h2a2 2 0 012 2v2m2 4a2 2 0 01-2 2h-2m-4-1h.01M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </ExpandableSection>
            )}
          </div>
        </div>

        {/* Fixed Bottom Bar - matches main screen style */}
        <div
          className="absolute bottom-0 left-0 right-0 bg-[#0a0a0a] border-t border-white/10 px-5 py-4 flex items-center gap-3"
          style={{ paddingBottom: "max(env(safe-area-inset-bottom), 16px)" }}
        >
          {/* More Button */}
          <button
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <span className="text-white text-lg">•••</span>
          </button>

          {/* Swap Button - matches main screen pill bar style */}
          <button
            onClick={() => onSwap?.(token)}
            className="flex-1 h-12 rounded-full bg-accent-dynamic text-white font-semibold text-base hover:opacity-90 transition-opacity"
          >
            Swap
          </button>

          {/* Send Button - matches main screen pill bar style */}
          <button
            onClick={() => onSend?.(token)}
            className="flex-1 h-12 rounded-full bg-accent-dynamic text-white font-semibold text-base hover:opacity-90 transition-opacity"
          >
            Send
          </button>
        </div>

        {/* More Menu Popup */}
        {showMoreMenu && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowMoreMenu(false)}
              aria-hidden="true"
            />
            <div className="absolute bottom-24 left-5 right-5 sm:right-auto sm:w-64 bg-white/10 backdrop-blur-lg rounded-xl p-2 shadow-xl z-50 border border-white/20">
              <button onClick={handleAddToWatchlist} className="w-full text-left px-4 py-2 text-white text-sm rounded-lg hover:bg-white/10 flex items-center gap-2">
                <span>📈</span> Add to Watchlist
              </button>
              {primaryContract && (
                <>
                  <button onClick={() => handleCopyContract(primaryContract.address)} className="w-full text-left px-4 py-2 text-white text-sm rounded-lg hover:bg-white/10 flex items-center gap-2">
                    <span>📋</span> Copy Contract
                  </button>
                  <button onClick={() => handleViewOnExplorer(primaryContract)} className="w-full text-left px-4 py-2 text-white text-sm rounded-lg hover:bg-white/10 flex items-center gap-2">
                    <span>🔗</span> View on Explorer
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* Animation Styles */}
      <style jsx>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default TokenDetailModal;
