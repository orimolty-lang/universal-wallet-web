/* eslint-disable @next/next/no-img-element */
"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { createChart, ColorType, IChartApi, CandlestickData, Time, CandlestickSeries } from "lightweight-charts";

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

// Time interval options for chart
type TimeInterval = "1M" | "5M" | "15M" | "1H" | "4H" | "12H";

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

// Candlestick Chart Component
const CandlestickChart = ({ 
  symbol, 
  interval,
  onIntervalChange 
}: { 
  symbol: string;
  interval: TimeInterval;
  onIntervalChange: (interval: TimeInterval) => void;
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch OHLCV data from GeckoTerminal or similar
  const fetchOHLCVData = useCallback(async (): Promise<CandlestickData<Time>[]> => {
    // For now, generate mock data - replace with real API call
    // GeckoTerminal API: GET /networks/{network}/pools/{address}/ohlcv/{timeframe}
    const now = Math.floor(Date.now() / 1000);
    const intervalSeconds: Record<TimeInterval, number> = {
      "1M": 60,
      "5M": 300,
      "15M": 900,
      "1H": 3600,
      "4H": 14400,
      "12H": 43200,
    };
    const seconds = intervalSeconds[interval];
    const points = 100;
    const data: CandlestickData<Time>[] = [];
    
    let basePrice = 1 + Math.random() * 0.5;
    for (let i = points; i >= 0; i--) {
      const time = (now - i * seconds) as Time;
      const volatility = 0.02;
      const change = (Math.random() - 0.5) * volatility;
      const open = basePrice;
      const close = basePrice * (1 + change);
      const high = Math.max(open, close) * (1 + Math.random() * volatility * 0.5);
      const low = Math.min(open, close) * (1 - Math.random() * volatility * 0.5);
      
      data.push({
        time,
        open,
        high,
        low,
        close,
      });
      
      basePrice = close;
    }
    
    return data;
  }, [interval]);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    setLoading(true);
    setError(null);

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#6B7280",
      },
      grid: {
        vertLines: { color: "rgba(107, 114, 128, 0.1)" },
        horzLines: { color: "rgba(107, 114, 128, 0.1)" },
      },
      width: chartContainerRef.current.clientWidth,
      height: 200,
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        horzLine: { visible: false, labelVisible: false },
        vertLine: { labelVisible: false },
      },
    });

    chartRef.current = chart;

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderUpColor: "#22c55e",
      borderDownColor: "#ef4444",
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
    });

    // Fetch and set data
    fetchOHLCVData()
      .then((data) => {
        candlestickSeries.setData(data);
        chart.timeScale().fitContent();
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [symbol, interval, fetchOHLCVData]);

  const intervals: TimeInterval[] = ["1M", "5M", "15M", "1H", "4H", "12H"];

  return (
    <div className="mt-4">
      {/* Chart Container */}
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0a]/50 z-10">
            <div className="text-gray-500 text-sm">Loading chart...</div>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0a]/50 z-10">
            <div className="text-red-500 text-sm">{error}</div>
          </div>
        )}
        <div ref={chartContainerRef} className="w-full h-[200px]" />
      </div>

      {/* Time Interval Selector */}
      <div className="flex items-center justify-center gap-2 mt-3">
        {intervals.map((int) => (
          <button
            key={int}
            onClick={() => onIntervalChange(int)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              interval === int
                ? "bg-[#1a3a5c] text-cyan-400"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {int}
          </button>
        ))}
        {/* Candlestick icon */}
        <button className="w-8 h-8 rounded-lg bg-[#1a3a5c] flex items-center justify-center ml-2">
          <span className="text-xs">📊</span>
        </button>
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
  const [chartInterval, setChartInterval] = useState<TimeInterval>("1H");
  const [showMoreMenu, setShowMoreMenu] = useState(false);

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
      <div className="fixed inset-x-0 bottom-0 z-50 max-h-[90vh] bg-[#0d1b2a] rounded-t-3xl overflow-hidden flex flex-col animate-slide-up">
        {/* Drag Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-gray-600 rounded-full" />
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 pb-24">
          {/* Token Header */}
          <div className="flex items-center gap-3 mb-1">
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
            <span className="text-cyan-400 font-medium text-lg">{token.name}</span>
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
              {chartInterval}
            </span>
          </div>

          {/* Candlestick Chart */}
          <CandlestickChart
            symbol={token.symbol}
            interval={chartInterval}
            onIntervalChange={setChartInterval}
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
