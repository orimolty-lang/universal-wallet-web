/* eslint-disable @next/next/no-img-element */
"use client";
import { useState, useEffect, useCallback } from "react";
import type { IAssetsResponse } from "@particle-network/universal-account-sdk";

// Types
interface TokenInfo {
  symbol: string;
  name: string;
  logo?: string;
  price?: number;
  decimals?: number;
  address?: string;
  chainId?: number;
}

interface SwapModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetToken: TokenInfo | null; // The token user wants to buy
  primaryAssets: IAssetsResponse | null;
  onSwapExecute?: (params: SwapParams) => Promise<void>;
}

interface SwapParams {
  fromToken: string;
  toToken: TokenInfo;
  amountUsd: number;
  slippage: number;
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

const formatTokenAmount = (amount: number, decimals: number = 6): string => {
  if (amount === 0) return "0";
  if (amount < 0.000001) return amount.toExponential(2);
  if (amount < 1) return amount.toFixed(Math.min(decimals, 6));
  if (amount < 1000) return amount.toFixed(4);
  if (amount < 1000000) return amount.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return amount.toLocaleString(undefined, { maximumFractionDigits: 0 });
};

// Token logos
const TOKEN_LOGOS: Record<string, string> = {
  "USDC": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png",
  "USDT": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png",
  "ETH": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png",
  "SOL": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png",
};

export const SwapModal = ({
  isOpen,
  onClose,
  targetToken,
  primaryAssets,
  onSwapExecute,
}: SwapModalProps) => {
  const [amount, setAmount] = useState("");
  const [sliderValue, setSliderValue] = useState(50);
  const [selectedFromToken, setSelectedFromToken] = useState("USDC");
  const [showFromTokenPicker, setShowFromTokenPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_quote, _setQuote] = useState<{ outputAmount: number; rate: number } | null>(null);

  // Get available "from" tokens (stablecoins for USD-first approach)
  const fromTokens = ["USDC", "USDT"];

  // Get user's balance of selected from token
  const getFromTokenBalance = useCallback(() => {
    if (!primaryAssets?.assets) return 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const asset = primaryAssets.assets.find((a: any) => 
      a.symbol?.toUpperCase() === selectedFromToken
    );
    if (!asset) return 0;
    return typeof asset.amount === 'string' ? parseFloat(asset.amount) : (asset.amount || 0);
  }, [primaryAssets, selectedFromToken]);

  const fromBalance = getFromTokenBalance();
  const amountNum = parseFloat(amount) || 0;
  const amountUsd = amountNum; // For stablecoins, amount ≈ USD

  // Calculate output amount based on target token price
  const outputAmount = targetToken?.price ? amountUsd / targetToken.price : 0;
  const rate = targetToken?.price ? 1 / targetToken.price : 0;

  // Update amount based on slider
  useEffect(() => {
    if (fromBalance > 0) {
      const newAmount = (fromBalance * sliderValue / 100).toFixed(2);
      setAmount(newAmount);
    }
  }, [sliderValue, fromBalance]);

  // Number pad handler
  const handleNumPad = (key: string) => {
    if (key === "backspace") {
      setAmount(prev => prev.slice(0, -1));
    } else if (key === ".") {
      if (!amount.includes(".")) {
        setAmount(prev => prev + ".");
      }
    } else {
      // Limit to reasonable input
      if (amount.length < 10) {
        setAmount(prev => prev + key);
      }
    }
  };

  // Handle swap execution
  const handleSwap = async () => {
    if (!targetToken || amountNum <= 0) return;
    
    setIsLoading(true);
    try {
      await onSwapExecute?.({
        fromToken: selectedFromToken,
        toToken: targetToken,
        amountUsd: amountUsd,
        slippage: 1, // 1% default
      });
      onClose();
    } catch (error) {
      console.error("Swap failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const hasInsufficientBalance = amountNum > fromBalance;
  const canSwap = amountNum > 0 && !hasInsufficientBalance && targetToken;

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/70 z-50" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-x-0 bottom-0 z-50 bg-[#0d1b2a] rounded-t-3xl overflow-hidden flex flex-col max-h-[95vh] animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4">
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center"
          >
            {/* Profile/close icon */}
            <span className="text-lg">👤</span>
          </button>
          <span className="text-white font-bold text-lg">Swap</span>
          <button className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center">
            <span className="text-sm">⚙️</span>
          </button>
        </div>

        {/* Swap Content */}
        <div className="flex-1 overflow-y-auto px-5 pb-4">
          {/* From Token Card */}
          <div className="bg-[#0f2744] rounded-2xl p-4 mb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img 
                  src={TOKEN_LOGOS[selectedFromToken]} 
                  alt={selectedFromToken}
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <input
                    type="text"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    className="bg-transparent text-white text-3xl font-bold w-32 outline-none"
                    readOnly
                  />
                  <div className="text-gray-400 text-sm">${amountUsd.toFixed(2)}</div>
                </div>
              </div>
              <div className="text-right">
                <button 
                  onClick={() => setShowFromTokenPicker(!showFromTokenPicker)}
                  className="bg-cyan-500 text-white px-3 py-1.5 rounded-full font-medium flex items-center gap-1"
                >
                  {selectedFromToken}
                  <span className="text-xs">▼</span>
                </button>
                <div className="text-gray-400 text-sm mt-1">
                  {fromBalance.toFixed(2)} {selectedFromToken}
                </div>
              </div>
            </div>

            {/* From Token Picker Dropdown */}
            {showFromTokenPicker && (
              <div className="mt-3 bg-[#1a3a5c] rounded-xl p-2">
                {fromTokens.map(token => (
                  <button
                    key={token}
                    onClick={() => {
                      setSelectedFromToken(token);
                      setShowFromTokenPicker(false);
                    }}
                    className={`w-full flex items-center gap-3 p-2 rounded-lg ${
                      selectedFromToken === token ? "bg-cyan-500/20" : "hover:bg-gray-700/50"
                    }`}
                  >
                    <img src={TOKEN_LOGOS[token]} alt={token} className="w-8 h-8 rounded-full" />
                    <span className="text-white">{token}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Swap Arrow */}
          <div className="flex justify-center -my-2 relative z-10">
            <div className="w-10 h-10 rounded-full bg-[#1a3a5c] border-4 border-[#0d1b2a] flex items-center justify-center">
              <span className="text-gray-400">↓</span>
            </div>
          </div>

          {/* To Token Card */}
          <div className="bg-[#0f2744] rounded-2xl p-4 mt-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {targetToken?.logo ? (
                  <img src={targetToken.logo} alt={targetToken.symbol} className="w-10 h-10 rounded-full" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-cyan-600 flex items-center justify-center text-white font-bold">
                    {targetToken?.symbol?.slice(0, 2) || "?"}
                  </div>
                )}
                <div>
                  <div className="text-white text-3xl font-bold">
                    {formatTokenAmount(outputAmount)}
                  </div>
                  <div className="text-gray-400 text-sm">
                    {formatPrice(amountUsd)}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="bg-gray-700 text-white px-3 py-1.5 rounded-full font-medium">
                  {targetToken?.symbol || "Select"}
                </div>
                <div className="text-gray-400 text-sm mt-1">No Balance</div>
              </div>
            </div>
          </div>

          {/* Rate Display */}
          <div className="flex items-center justify-between mt-3 text-sm">
            <span className="text-gray-400">
              1 {selectedFromToken} ≈ {formatTokenAmount(rate)} {targetToken?.symbol || "???"}
            </span>
            <button className="text-gray-400 flex items-center gap-1">
              <span>📋</span> Review
            </button>
          </div>

          {/* Slider */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-gray-400">💵</span>
                <span className="text-white font-medium">Swap {sliderValue}%</span>
              </div>
              <button 
                onClick={() => setSliderValue(100)}
                className="text-cyan-400 font-medium"
              >
                Max
              </button>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={sliderValue}
              onChange={(e) => setSliderValue(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
          </div>

          {/* Number Pad */}
          <div className="grid grid-cols-3 gap-2 mt-6">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "backspace"].map((key) => (
              <button
                key={key}
                onClick={() => handleNumPad(key)}
                className="h-14 rounded-xl bg-[#1a2a3a] text-white text-xl font-medium flex items-center justify-center active:bg-gray-700"
              >
                {key === "backspace" ? "⌫" : key}
              </button>
            ))}
          </div>
        </div>

        {/* Bottom Action */}
        <div className="px-5 py-4 border-t border-gray-800" style={{ paddingBottom: "max(env(safe-area-inset-bottom), 16px)" }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-orange-500">⛽</span>
              <span className="text-white font-medium">Fast</span>
              <span className="text-xs text-gray-400">▼</span>
            </div>
            <span className="text-gray-400 text-sm">
              <span className="text-gray-500">📋</span> &lt;$0.01
            </span>
          </div>
          
          <button
            onClick={handleSwap}
            disabled={!canSwap || isLoading}
            className={`w-full py-4 rounded-xl font-bold text-lg ${
              canSwap
                ? "bg-cyan-500 text-white"
                : "bg-gray-700 text-gray-400"
            }`}
          >
            {isLoading 
              ? "Swapping..." 
              : hasInsufficientBalance 
                ? `Insufficient ${selectedFromToken}`
                : "Swap"
            }
          </button>
        </div>
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
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 20px;
          height: 20px;
          background: #06b6d4;
          border-radius: 50%;
          cursor: pointer;
        }
      `}</style>
    </>
  );
};

export default SwapModal;
