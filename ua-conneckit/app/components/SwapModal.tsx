/* eslint-disable @next/next/no-img-element */
"use client";
import { useState, useEffect, useCallback } from "react";
import type { IAssetsResponse, UniversalAccount } from "@particle-network/universal-account-sdk";
import { executeSwap, getChainIdFromBlockchain } from "../lib/swapService";
import { useWallets } from "@particle-network/connectkit";

// Types
interface TokenInfo {
  symbol: string;
  name: string;
  logo?: string;
  price?: number;
  decimals?: number;
  address?: string;
  chainId?: number;
  contracts?: Array<{ address: string; blockchain: string }>;
}

interface SwapModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetToken: TokenInfo | null;
  primaryAssets: IAssetsResponse | null;
  universalAccount: UniversalAccount | null;
  onSwapSuccess?: (txId: string) => void;
}

// Helper functions
const formatTokenAmount = (amount: number, decimals: number = 6): string => {
  if (amount === 0) return "0";
  if (amount < 0.000001) return amount.toExponential(2);
  if (amount < 1) return amount.toFixed(Math.min(decimals, 6));
  if (amount < 1000) return amount.toFixed(4);
  if (amount < 1000000) return amount.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return amount.toLocaleString(undefined, { maximumFractionDigits: 0 });
};

export const SwapModal = ({
  isOpen,
  onClose,
  targetToken,
  primaryAssets,
  universalAccount,
  onSwapSuccess,
}: SwapModalProps) => {
  const [amount, setAmount] = useState("");
  const [sliderValue, setSliderValue] = useState(50);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txResult, setTxResult] = useState<{ txId: string; outputAmount?: string } | null>(null);

  // Get total unified balance (UA aggregates across all chains)
  const totalBalance = primaryAssets?.totalAmountInUSD || 0;
  
  const amountNum = parseFloat(amount) || 0;
  const amountUsd = amountNum;

  // Calculate output amount based on target token price
  const outputAmount = targetToken?.price ? amountUsd / targetToken.price : 0;
  const rate = targetToken?.price ? 1 / targetToken.price : 0;

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setAmount("");
      setSliderValue(50);
      setError(null);
      setTxResult(null);
    }
  }, [isOpen]);

  // Update amount based on slider (uses total unified balance)
  useEffect(() => {
    if (totalBalance > 0 && !txResult) {
      const newAmount = (totalBalance * sliderValue / 100).toFixed(2);
      setAmount(newAmount);
    }
  }, [sliderValue, totalBalance, txResult]);

  // Number pad handler
  const handleNumPad = (key: string) => {
    if (txResult) return; // Don't allow input after success
    
    if (key === "backspace") {
      setAmount(prev => prev.slice(0, -1));
    } else if (key === ".") {
      if (!amount.includes(".")) {
        setAmount(prev => prev + ".");
      }
    } else {
      if (amount.length < 10) {
        setAmount(prev => prev + key);
      }
    }
  };

  // Get token address and chain ID
  const getTokenAddressAndChain = useCallback(() => {
    if (!targetToken) return { address: "", chainId: 8453 };
    
    // If token has direct address/chainId
    if (targetToken.address && targetToken.chainId) {
      return { address: targetToken.address, chainId: targetToken.chainId };
    }
    
    // If token has contracts array (from Mobula search)
    if (targetToken.contracts && targetToken.contracts.length > 0) {
      // Prefer Base, then Ethereum, then first available
      const baseContract = targetToken.contracts.find(c => 
        c.blockchain.toLowerCase() === "base"
      );
      const ethContract = targetToken.contracts.find(c => 
        c.blockchain.toLowerCase() === "ethereum"
      );
      const solContract = targetToken.contracts.find(c => 
        c.blockchain.toLowerCase() === "solana"
      );
      
      if (baseContract) {
        return { address: baseContract.address, chainId: 8453 };
      }
      if (ethContract) {
        return { address: ethContract.address, chainId: 1 };
      }
      if (solContract) {
        return { address: solContract.address, chainId: 101 };
      }
      
      // Use first contract
      const first = targetToken.contracts[0];
      return { 
        address: first.address, 
        chainId: getChainIdFromBlockchain(first.blockchain) 
      };
    }
    
    return { address: "", chainId: 8453 };
  }, [targetToken]);

  // Get wallet for signing
  const [primaryWallet] = useWallets();

  // Handle swap execution
  const handleSwap = async () => {
    if (!targetToken || amountNum <= 0 || !universalAccount) {
      setError("Invalid swap parameters");
      return;
    }

    const { address, chainId } = getTokenAddressAndChain();
    if (!address) {
      setError("Token address not found");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Step 1: Prepare transaction
      const result = await executeSwap({
        ua: universalAccount,
        fromToken: "USDC", // UA SDK will aggregate from all available balances
        toTokenAddress: address,
        toTokenChainId: chainId,
        amountUsd: amountUsd,
        slippageBps: 100, // 1% slippage
      });

      if (!result.success) {
        setError(result.error || "Failed to prepare swap");
        return;
      }

      // Step 2: Sign with wallet
      if (result.requiresSignature && result.rootHash && primaryWallet) {
        try {
          const walletClient = primaryWallet.getWalletClient();
          
          // Sign the root hash using personal_sign
          const signature = await walletClient.request({
            method: 'personal_sign',
            params: [result.rootHash as `0x${string}`, walletClient.account?.address as `0x${string}`],
          });

          // Step 3: Send transaction
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const sendResult = await universalAccount.sendTransaction(result.transaction as any, signature as string);
          
          if (sendResult?.transactionId) {
            setTxResult({
              txId: sendResult.transactionId,
              outputAmount: result.outputAmount,
            });
            onSwapSuccess?.(sendResult.transactionId);
          } else {
            setError("Transaction failed - no ID returned");
          }
        } catch (signError) {
          console.error("Signing error:", signError);
          setError("Failed to sign transaction");
          return;
        }
      } else if (result.transactionId) {
        // Direct result (shouldn't happen in current flow)
        setTxResult({
          txId: result.transactionId,
          outputAmount: result.outputAmount,
        });
        onSwapSuccess?.(result.transactionId);
      } else {
        setError("Swap failed - no transaction created");
      }
    } catch (err) {
      console.error("Swap error:", err);
      setError(err instanceof Error ? err.message : "Swap failed");
    } finally {
      setIsLoading(false);
    }
  };

  const hasInsufficientBalance = amountNum > totalBalance;
  const canSwap = amountNum > 0 && targetToken && universalAccount && !txResult;

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
            <span className="text-lg">✕</span>
          </button>
          <span className="text-white font-bold text-lg">Swap</span>
          <button className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center">
            <span className="text-sm">⚙️</span>
          </button>
        </div>

        {/* Success State */}
        {txResult && (
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-white text-xl font-bold mb-2">Swap Submitted!</h2>
            <p className="text-gray-400 text-center mb-4">
              {txResult.outputAmount && `Expected: ~${txResult.outputAmount} ${targetToken?.symbol}`}
            </p>
            <a
              href={`https://universalx.app/activity/details?id=${txResult.txId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 underline mb-6"
            >
              View Transaction
            </a>
            <button
              onClick={onClose}
              className="w-full max-w-xs bg-cyan-500 text-white py-3 rounded-xl font-bold"
            >
              Done
            </button>
          </div>
        )}

        {/* Swap Form */}
        {!txResult && (
          <>
            <div className="flex-1 overflow-y-auto px-5 pb-4">
              {/* Error Message */}
              {error && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 mb-4">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {/* From (USD) Card - Unified Balance */}
              <div className="bg-[#0f2744] rounded-2xl p-4 mb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-xl">
                      💵
                    </div>
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400 text-2xl">$</span>
                        <input
                          type="text"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="0"
                          className="bg-transparent text-white text-3xl font-bold w-28 outline-none"
                          readOnly
                        />
                      </div>
                      <div className="text-gray-400 text-sm">USD Amount</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="bg-green-600 text-white px-3 py-1.5 rounded-full font-medium">
                      USD
                    </div>
                    <div className="text-gray-400 text-sm mt-1">
                      Balance: ${totalBalance.toFixed(2)}
                    </div>
                  </div>
                </div>
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
                        ~${amountUsd.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="bg-gray-700 text-white px-3 py-1.5 rounded-full font-medium">
                      {targetToken?.symbol || "Select"}
                    </div>
                    <div className="text-gray-400 text-sm mt-1">
                      {getTokenAddressAndChain().chainId === 101 ? "Solana" : 
                       getTokenAddressAndChain().chainId === 8453 ? "Base" :
                       getTokenAddressAndChain().chainId === 1 ? "Ethereum" : ""}
                    </div>
                  </div>
                </div>
              </div>

              {/* Rate Display */}
              <div className="flex items-center justify-between mt-3 text-sm">
                <span className="text-gray-400">
                  $1 ≈ {formatTokenAmount(rate)} {targetToken?.symbol || "???"}
                </span>
                <span className="text-gray-500 text-xs">
                  via {getTokenAddressAndChain().chainId === 101 ? "Relay" : "0x"} • UA Unified
                </span>
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
                </div>
                <span className="text-gray-400 text-sm">
                  Gas: &lt;$0.01
                </span>
              </div>
              
              <button
                onClick={handleSwap}
                disabled={!canSwap || isLoading}
                className={`w-full py-4 rounded-xl font-bold text-lg ${
                  canSwap && !isLoading
                    ? "bg-cyan-500 text-white"
                    : "bg-gray-700 text-gray-400"
                }`}
              >
                {isLoading 
                  ? "Swapping..." 
                  : hasInsufficientBalance 
                    ? "Insufficient Balance"
                    : !universalAccount
                      ? "Connect Wallet"
                      : amountNum <= 0
                        ? "Enter Amount"
                        : "Swap"
                }
              </button>
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
