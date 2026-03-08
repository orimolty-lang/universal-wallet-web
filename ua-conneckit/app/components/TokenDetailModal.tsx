/* eslint-disable @next/next/no-img-element */
"use client";
import { useState, useRef } from "react";

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

interface TokenDetailModalProps {
  token: TokenData | null;
  userBalance?: UserBalance | null;
  onClose: () => void;
  onSwap?: (token: TokenData) => void;
  onSend?: (token: TokenData) => void;
}

// Helper functions
const formatPrice = (price: number): string => {
  if (price === 0) return "$0.00";
  if (price < 0.00001) return `$${price.toExponential(2)}`;
  if (price < 0.01) return `$${price.toFixed(6)}`;
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

// Chain badge component
const ChainBadge = ({ blockchain }: { blockchain: string }) => {
  const logo = CHAIN_LOGOS[blockchain.toLowerCase()];
  const shortNames: Record<string, string> = {
    ethereum: "ETH", base: "Base", arbitrum: "ARB", optimism: "OP",
    polygon: "MATIC", bsc: "BSC", bnb: "BSC", solana: "SOL", avalanche: "AVAX",
  };
  const shortName = shortNames[blockchain.toLowerCase()] || blockchain;
  
  return (
    <div className="flex items-center gap-1 bg-gray-800/80 rounded-full px-2 py-0.5">
      {logo && <img src={logo} alt={blockchain} className="w-3.5 h-3.5 rounded-full" />}
      <span className="text-gray-300 text-xs">{shortName}</span>
    </div>
  );
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

// Embedded Chart Component using GeckoTerminal
const EmbeddedChart = ({ 
  tokenAddress,
  blockchain,
  coingeckoId,
}: { 
  tokenAddress?: string;
  blockchain?: string;
  coingeckoId?: string;
}) => {
  const [loading, setLoading] = useState(true);
  const [chartSource, setChartSource] = useState<'geckoterminal' | 'coingecko'>('geckoterminal');
  
  // Get network slug for the chart provider
  const networkSlug = blockchain ? NETWORK_SLUGS[blockchain.toLowerCase()] : null;
  
  // Build chart URL
  let chartUrl = '';
  if (chartSource === 'geckoterminal' && tokenAddress && networkSlug) {
    // GeckoTerminal embed - token page (will show main pool)
    chartUrl = `https://www.geckoterminal.com/${networkSlug.geckoterminal}/tokens/${tokenAddress}?embed=1&info=0&swaps=0`;
  } else if (coingeckoId) {
    // Fallback to CoinGecko widget
    chartUrl = `https://www.coingecko.com/coins/${coingeckoId}/sparkline.svg`;
  }
  
  if (!chartUrl && !tokenAddress) {
    return (
      <div className="mt-4 h-[280px] bg-[#0a0a12] rounded-xl flex items-center justify-center">
        <span className="text-gray-500 text-sm">No chart available</span>
      </div>
    );
  }

  return (
    <div className="mt-4">
      {/* Chart Source Toggle */}
      <div className="flex items-center justify-end gap-2 mb-2">
        <button
          onClick={() => setChartSource('geckoterminal')}
          className={`px-2 py-1 rounded text-xs transition-colors ${
            chartSource === 'geckoterminal' 
              ? 'bg-green-500/20 text-green-400' 
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          GeckoTerminal
        </button>
        {coingeckoId && (
          <button
            onClick={() => setChartSource('coingecko')}
            className={`px-2 py-1 rounded text-xs transition-colors ${
              chartSource === 'coingecko' 
                ? 'bg-orange-500/20 text-orange-400' 
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            CoinGecko
          </button>
        )}
      </div>
      
      {/* Chart Container */}
      <div className="relative rounded-xl overflow-hidden bg-[#0a0a12]" style={{ height: '280px' }}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a12] z-10">
            <div className="flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-gray-500 text-sm">Loading chart...</span>
            </div>
          </div>
        )}
        
        {chartSource === 'geckoterminal' && tokenAddress && networkSlug ? (
          <iframe
            src={`https://www.geckoterminal.com/${networkSlug.geckoterminal}/tokens/${tokenAddress}?embed=1&info=0&swaps=0`}
            title="Token Chart"
            className="w-full h-full border-0"
            style={{ 
              colorScheme: 'dark',
              background: '#0a0a12',
            }}
            onLoad={() => setLoading(false)}
            allow="clipboard-write"
            sandbox="allow-scripts allow-same-origin allow-popups"
          />
        ) : coingeckoId ? (
          <iframe
            src={`https://www.coingecko.com/coins/${coingeckoId}/sparkline.svg`}
            title="Price Chart"
            className="w-full h-full border-0"
            onLoad={() => setLoading(false)}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <span className="text-gray-500 text-sm">Chart not available for this token</span>
          </div>
        )}
      </div>
      
      {/* Open full chart link */}
      {tokenAddress && networkSlug && (
        <div className="flex justify-center mt-2">
          <a
            href={`https://www.geckoterminal.com/${networkSlug.geckoterminal}/tokens/${tokenAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
          >
            Open full chart ↗
          </a>
        </div>
      )}
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
          <span className="text-cyan-400">{icon}</span>
          <span className="text-white font-medium">{title}</span>
        </div>
        <span
          className={`text-cyan-400 transition-transform ${
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
}: TokenDetailModalProps) => {
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef<number | null>(null);
  const currentYRef = useRef<number>(0);

  // Handle drag to dismiss
  const handleTouchStart = (e: React.TouchEvent) => {
    startYRef.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startYRef.current === null || !modalRef.current) return;
    const deltaY = e.touches[0].clientY - startYRef.current;
    if (deltaY > 0) {
      currentYRef.current = deltaY;
      modalRef.current.style.transform = `translateY(${deltaY}px)`;
    }
  };

  const handleTouchEnd = () => {
    if (!modalRef.current) return;
    if (currentYRef.current > 100) {
      // Dismiss if dragged more than 100px
      onClose();
    } else {
      // Snap back
      modalRef.current.style.transform = '';
    }
    startYRef.current = null;
    currentYRef.current = 0;
  };

  if (!token) return null;

  const priceChange = token.price_change_24h || 0;
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

      {/* Modal */}
      <div 
        ref={modalRef}
        className="fixed inset-x-0 bottom-0 z-50 max-h-[90vh] bg-[#0d1b2a] rounded-t-3xl overflow-hidden flex flex-col animate-slide-up"
        style={{ touchAction: 'pan-y' }}
      >
        {/* Drag Handle - with touch events */}
        <div 
          className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="w-10 h-1 bg-gray-600 rounded-full" />
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 pb-24">
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
                <div className="w-10 h-10 rounded-full bg-cyan-600 flex items-center justify-center text-white font-bold">
                  {token.symbol.slice(0, 2)}
                </div>
              )}
              {/* Single chain badge on logo */}
              {token.contracts && token.contracts.length > 0 && (
                <img 
                  src={CHAIN_LOGOS[token.contracts[0].blockchain.toLowerCase()]}
                  alt=""
                  className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#0d1b2a]"
                />
              )}
            </div>
            <div>
              <span className="text-cyan-400 font-medium text-lg">{token.name}</span>
              {/* Chain badges */}
              {token.contracts && token.contracts.length > 0 && (
                <div className="flex gap-1 mt-1">
                  {token.contracts.slice(0, 3).map((c, i) => (
                    <ChainBadge key={i} blockchain={c.blockchain} />
                  ))}
                  {token.contracts.length > 3 && (
                    <span className="text-gray-500 text-xs">+{token.contracts.length - 3}</span>
                  )}
                </div>
              )}
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
            <span
              className={`text-sm font-medium ${
                priceChangePositive ? "text-red-500" : "text-green-500"
              }`}
            >
              {priceChangePositive ? "↓" : "↑"}
              {Math.abs(priceChange).toFixed(2)}%
            </span>
            <span className="text-gray-500 text-sm bg-gray-800 px-2 py-0.5 rounded">
              24h
            </span>
          </div>

          {/* Embedded Real-time Chart */}
          <EmbeddedChart
            tokenAddress={primaryContract?.address}
            blockchain={primaryContract?.blockchain}
            coingeckoId={token.id}
          />

          {/* User Balance Card */}
          {userBalance && userBalance.amount > 0 && (
            <div className="mt-6 bg-[#0f2744] rounded-xl p-4 flex items-center justify-between">
              <div>
                <div className="text-gray-400 text-xs">Balance</div>
                <div className="flex items-center gap-2 mt-1">
                  {token.logo ? (
                    <img src={token.logo} alt="" className="w-5 h-5 rounded-full" />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-cyan-600" />
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
                  <span className="text-cyan-400 font-medium">
                    {formatLargeNumber(token.market_cap || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <span>📈</span>
                    <span>24h Volume</span>
                  </div>
                  <span className="text-cyan-400 font-medium">
                    {formatLargeNumber(token.volume || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <span>⏱️</span>
                    <span>Fully Diluted Valuation</span>
                  </div>
                  <span className="text-cyan-400 font-medium">
                    {formatLargeNumber((token.totalSupply || 0) * (token.price || 0))}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <span>🔄</span>
                    <span>Circulating Supply</span>
                  </div>
                  <span className="text-cyan-400 font-medium">
                    {formatSupply(token.circulatingSupply || token.totalSupply || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <span>⬆️</span>
                    <span>Max Supply</span>
                  </div>
                  <span className="text-cyan-400 font-medium">
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
                    <span className="text-cyan-400 font-mono text-sm">
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
                    <span className="text-cyan-400 text-sm flex items-center gap-1">
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
                      <span>🔍</span>
                      <span>Search on X</span>
                    </div>
                    <span className="text-cyan-400 text-sm">↗</span>
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
                      className="flex items-center justify-between py-1"
                    >
                      <span className="text-gray-400 text-sm">
                        {contract.blockchain}
                      </span>
                      <span className="text-cyan-400 font-mono text-xs">
                        {formatAddress(contract.address)}
                      </span>
                    </div>
                  ))}
                </div>
              </ExpandableSection>
            )}
          </div>
        </div>

        {/* Fixed Bottom Bar */}
        <div
          className="absolute bottom-0 left-0 right-0 bg-[#0d1b2a] border-t border-gray-800/50 px-5 py-4 flex items-center gap-3"
          style={{ paddingBottom: "max(env(safe-area-inset-bottom), 16px)" }}
        >
          {/* More Button */}
          <button
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className="w-12 h-12 rounded-xl bg-[#1a3a5c] border border-cyan-800/50 flex items-center justify-center"
          >
            <span className="text-white text-lg">•••</span>
          </button>

          {/* Swap Button */}
          <button
            onClick={() => onSwap?.(token)}
            className="flex-1 h-12 rounded-xl bg-cyan-500 text-white font-bold text-lg"
          >
            Swap
          </button>

          {/* Send Button */}
          <button
            onClick={() => onSend?.(token)}
            className="flex-1 h-12 rounded-xl bg-cyan-500 text-white font-bold text-lg"
          >
            Send
          </button>
        </div>

        {/* More Menu Popup */}
        {showMoreMenu && (
          <div
            className="absolute bottom-24 left-5 bg-[#1a3a5c] rounded-xl p-2 shadow-xl z-50"
            onClick={() => setShowMoreMenu(false)}
          >
            <button className="w-full text-left px-4 py-2 text-white text-sm rounded-lg hover:bg-cyan-800/30">
              📈 Add to Watchlist
            </button>
            <button className="w-full text-left px-4 py-2 text-white text-sm rounded-lg hover:bg-cyan-800/30">
              📋 Copy Contract
            </button>
            <button className="w-full text-left px-4 py-2 text-white text-sm rounded-lg hover:bg-cyan-800/30">
              🔗 View on Explorer
            </button>
          </div>
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
