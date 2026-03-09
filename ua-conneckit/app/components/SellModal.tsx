/* eslint-disable @next/next/no-img-element */
"use client";
import { useState, useEffect } from "react";
import type { UniversalAccount } from "@particle-network/universal-account-sdk";
import { useWallets } from "../lib/particleCompat";

interface TokenToSell {
  symbol: string;
  name: string;
  balance: number;
  amountInUSD: number;
  price: number;
  logo?: string;
  chainId?: number;
  address?: string;
}

interface SellModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: TokenToSell | null;
  universalAccount: UniversalAccount | null;
  onSellSuccess?: (txId: string) => void;
}

const formatTokenAmount = (amount: number): string => {
  if (amount === 0) return "0";
  if (amount < 0.000001) return amount.toExponential(2);
  if (amount < 1) return amount.toFixed(6);
  if (amount < 1000) return amount.toFixed(4);
  return amount.toLocaleString(undefined, { maximumFractionDigits: 2 });
};

export const SellModal = ({
  isOpen,
  onClose,
  token,
  universalAccount,
  onSellSuccess,
}: SellModalProps) => {
  const [percentage, setPercentage] = useState(100);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txResult, setTxResult] = useState<{ txId: string; received?: string } | null>(null);

  // Will be used when sell is implemented
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [primaryWallet] = useWallets();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ua = universalAccount;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _onSuccess = onSellSuccess;

  // Calculate sell amount based on percentage
  const sellAmount = token ? (token.balance * percentage / 100) : 0;
  const sellAmountUSD = token ? (token.amountInUSD * percentage / 100) : 0;

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setPercentage(100);
      setError(null);
      setTxResult(null);
    }
  }, [isOpen]);

  const handleSell = async () => {
    if (!token || !universalAccount || sellAmount <= 0) {
      setError("Invalid sell parameters");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // TODO: Implement actual sell logic using Li.Fi
      // For now, show a placeholder
      setError("Sell functionality coming soon! Use OmniUA Telegram bot for now.");
      
      // The actual implementation would:
      // 1. Get Li.Fi quote for TOKEN → USDC
      // 2. Build UA transaction with the swap calldata
      // 3. Sign with wallet
      // 4. Send transaction
      
    } catch (err) {
      console.error("Sell error:", err);
      setError(err instanceof Error ? err.message : "Sell failed");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !token) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/70 z-50" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-x-0 bottom-0 z-50 bg-[#0d1b2a] rounded-t-3xl overflow-hidden flex flex-col max-h-[90vh] animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center"
          >
            <span className="text-lg">✕</span>
          </button>
          <span className="text-white font-bold text-lg">Sell {token.symbol}</span>
          <div className="w-10" />
        </div>

        {/* Success State */}
        {txResult && (
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-white text-xl font-bold mb-2">Sold!</h2>
            <p className="text-green-400 text-lg mb-4">
              +{txResult.received || sellAmountUSD.toFixed(2)} USDC
            </p>
            <button
              onClick={onClose}
              className="w-full max-w-xs bg-cyan-500 text-white py-3 rounded-xl font-bold"
            >
              Done
            </button>
          </div>
        )}

        {/* Sell Form */}
        {!txResult && (
          <div className="flex-1 overflow-y-auto p-5">
            {/* Error */}
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 mb-4">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Token Info */}
            <div className="bg-[#0f2744] rounded-2xl p-4 mb-4">
              <div className="flex items-center gap-3">
                {token.logo ? (
                  <img src={token.logo} alt={token.symbol} className="w-12 h-12 rounded-full" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-white font-bold">
                    {token.symbol.slice(0, 2)}
                  </div>
                )}
                <div>
                  <div className="text-white font-bold text-xl">{token.symbol}</div>
                  <div className="text-gray-400">{token.name}</div>
                </div>
              </div>
              <div className="mt-4 flex justify-between">
                <span className="text-gray-400">Your Balance:</span>
                <span className="text-white">{formatTokenAmount(token.balance)} (${token.amountInUSD.toFixed(2)})</span>
              </div>
            </div>

            {/* Amount to Sell */}
            <div className="mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">Sell Amount</span>
                <span className="text-white font-bold">{percentage}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="10"
                value={percentage}
                onChange={(e) => setPercentage(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-500"
              />
              <div className="flex justify-between mt-2 text-sm">
                <span className="text-gray-500">10%</span>
                <span className="text-gray-500">50%</span>
                <span className="text-gray-500">100%</span>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-[#0f2744] rounded-2xl p-4 mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">Selling:</span>
                <span className="text-white">{formatTokenAmount(sellAmount)} {token.symbol}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">Value:</span>
                <span className="text-white">${sellAmountUSD.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">You&apos;ll Receive:</span>
                <span className="text-green-400 font-bold">~${(sellAmountUSD * 0.995).toFixed(2)} USDC</span>
              </div>
            </div>

            {/* Sell Button */}
            <button
              onClick={handleSell}
              disabled={isLoading || sellAmount <= 0}
              className={`w-full py-4 rounded-xl font-bold text-lg ${
                !isLoading && sellAmount > 0
                  ? "bg-red-500 text-white"
                  : "bg-gray-700 text-gray-400"
              }`}
            >
              {isLoading ? "Selling..." : `Sell ${token.symbol} for USDC`}
            </button>

            <p className="text-gray-500 text-xs text-center mt-3">
              Swaps via Li.Fi • 0.5% slippage • Gas paid from balance
            </p>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default SellModal;
