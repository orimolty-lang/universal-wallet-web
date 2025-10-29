/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ExternalLink, Copy, Check } from "lucide-react";
import { useState } from "react";

interface TxDetailsDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  transactionDetails: any | null;
  isLoading: boolean;
}

const TxDetailsDialog = ({
  isOpen,
  setIsOpen,
  transactionDetails,
  isLoading,
}: TxDetailsDialogProps) => {
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const formatHexAmount = (
    hexAmount: string,
    decimals: number = 18
  ): string => {
    try {
      // Remove '0x' prefix if present
      const cleanHex = hexAmount.startsWith("0x")
        ? hexAmount.slice(2)
        : hexAmount;
      const amount = BigInt("0x" + cleanHex);
      const divisor = BigInt(10 ** decimals);
      const wholePart = amount / divisor;
      const remainder = amount % divisor;
      const decimalPart = Number(remainder) / Number(divisor);
      const result = Number(wholePart) + decimalPart;
      return result.toFixed(decimals > 6 ? 6 : decimals);
    } catch (error) {
      console.error("Error formatting hex amount:", hexAmount, error);
      return "0";
    }
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-2xl bg-[#1F1F3A] border border-[#4A4A6A] text-gray-200">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-center text-[#C084FC]">
              Loading Transaction Details...
            </DialogTitle>
          </DialogHeader>
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!transactionDetails) {
    return null;
  }

  const tx = transactionDetails;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-y-auto bg-[#1F1F3A] border border-[#4A4A6A] text-gray-200">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-center text-[#C084FC]">
            Transaction Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Transaction ID */}
          <div className="bg-[#2A2A4A] rounded-lg p-4 border border-[#4A4A6A]">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-400 mb-1">Transaction ID</p>
                <p className="font-mono text-sm">{tx.transactionId}</p>
              </div>
              <button
                onClick={() => handleCopy(tx.transactionId)}
                className="p-2 rounded-full hover:bg-[#3A3A5A] transition-colors"
              >
                {copiedText === tx.transactionId ? (
                  <Check className="h-4 w-4 text-green-400" />
                ) : (
                  <Copy className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          {/* Status and Type */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#2A2A4A] rounded-lg p-4 border border-[#4A4A6A]">
              <p className="text-xs text-gray-400 mb-1">Type</p>
              <p className="font-semibold text-purple-300">{tx.tag}</p>
            </div>
            <div className="bg-[#2A2A4A] rounded-lg p-4 border border-[#4A4A6A]">
              <p className="text-xs text-gray-400 mb-1">Status</p>
              <p className="font-semibold text-green-400">
                {tx.status === 7 ? "Completed" : `Status ${tx.status}`}
              </p>
            </div>
          </div>

          {/* Sender and Receiver */}
          <div className="bg-[#2A2A4A] rounded-lg p-4 border border-[#4A4A6A]">
            <p className="text-xs text-gray-400 mb-2">From</p>
            <div className="flex justify-between items-center mb-4">
              <p className="font-mono text-sm break-all">{tx.sender}</p>
              <button
                onClick={() => handleCopy(tx.sender)}
                className="p-2 rounded-full hover:bg-[#3A3A5A] transition-colors flex-shrink-0 ml-2"
              >
                {copiedText === tx.sender ? (
                  <Check className="h-4 w-4 text-green-400" />
                ) : (
                  <Copy className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
            <p className="text-xs text-gray-400 mb-2">To</p>
            <div className="flex justify-between items-center">
              <p className="font-mono text-sm break-all">{tx.receiver}</p>
              <button
                onClick={() => handleCopy(tx.receiver)}
                className="p-2 rounded-full hover:bg-[#3A3A5A] transition-colors flex-shrink-0 ml-2"
              >
                {copiedText === tx.receiver ? (
                  <Check className="h-4 w-4 text-green-400" />
                ) : (
                  <Copy className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          {/* Token Changes */}
          {tx.tokenChanges && (
            <div className="bg-[#2A2A4A] rounded-lg p-4 border border-[#4A4A6A]">
              <p className="text-sm font-semibold text-gray-300 mb-3">
                Token Changes
              </p>

              {tx.tokenChanges.decr && tx.tokenChanges.decr.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-gray-400 mb-2">Sent</p>
                  {tx.tokenChanges.decr.map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 bg-[#1F1F3A] p-3 rounded-md"
                    >
                      <img
                        src={item.token.image}
                        alt={item.token.symbol}
                        className="w-8 h-8 rounded-full"
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-red-400">
                          -
                          {formatHexAmount(
                            item.amount,
                            item.token.realDecimals
                          )}{" "}
                          {item.token.symbol}
                        </p>
                        <p className="text-xs text-gray-400">
                          ${formatHexAmount(item.amountInUSD, 6)} USD
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {tx.tokenChanges.incr && tx.tokenChanges.incr.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 mb-2">Received</p>
                  {tx.tokenChanges.incr.map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 bg-[#1F1F3A] p-3 rounded-md"
                    >
                      <img
                        src={item.token.image}
                        alt={item.token.symbol}
                        className="w-8 h-8 rounded-full"
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-green-400">
                          +
                          {formatHexAmount(
                            item.amount,
                            item.token.realDecimals
                          )}{" "}
                          {item.token.symbol}
                        </p>
                        <p className="text-xs text-gray-400">
                          ${formatHexAmount(item.amountInUSD, 6)} USD
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Lending User Operations */}
          {tx.lendingUserOperations && tx.lendingUserOperations.length > 0 && (
            <div className="bg-[#2A2A4A] rounded-lg p-4 border border-[#4A4A6A]">
              <p className="text-sm font-semibold text-gray-300 mb-3">
                User Operations
              </p>
              {tx.lendingUserOperations.map((userOp: any, idx: number) => (
                <div key={idx} className="mb-4 last:mb-0">
                  <div className="bg-[#1F1F3A] p-3 rounded-md space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-400">Chain ID</span>
                      <span className="text-sm font-mono">
                        {userOp.chainId}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-400">Status</span>
                      <span
                        className={`text-sm font-semibold ${
                          userOp.status === 3
                            ? "text-green-400"
                            : "text-yellow-400"
                        }`}
                      >
                        {userOp.status === 3
                          ? "Completed"
                          : `Status ${userOp.status}`}
                      </span>
                    </div>
                    {userOp.txHash && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-400">Tx Hash</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono">
                            {userOp.txHash.substring(0, 10)}...
                            {userOp.txHash.substring(userOp.txHash.length - 8)}
                          </span>
                          <button
                            onClick={() => handleCopy(userOp.txHash)}
                            className="p-1 rounded-full hover:bg-[#3A3A5A] transition-colors"
                          >
                            {copiedText === userOp.txHash ? (
                              <Check className="h-3 w-3 text-green-400" />
                            ) : (
                              <Copy className="h-3 w-3 text-gray-400" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                    {userOp.userOpHash && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-400">
                          UserOp Hash
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono">
                            {userOp.userOpHash.substring(0, 10)}...
                            {userOp.userOpHash.substring(
                              userOp.userOpHash.length - 8
                            )}
                          </span>
                          <button
                            onClick={() => handleCopy(userOp.userOpHash)}
                            className="p-1 rounded-full hover:bg-[#3A3A5A] transition-colors"
                          >
                            {copiedText === userOp.userOpHash ? (
                              <Check className="h-3 w-3 text-green-400" />
                            ) : (
                              <Copy className="h-3 w-3 text-gray-400" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                    {userOp.gasFeeInUSD && userOp.gasFeeInUSD !== "0" && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-400">Gas Fee</span>
                        <span className="text-sm">
                          ${formatHexAmount(userOp.gasFeeInUSD, 6)} USD
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Fees */}
          {tx.fees && (
            <div className="bg-[#2A2A4A] rounded-lg p-4 border border-[#4A4A6A]">
              <p className="text-sm font-semibold text-gray-300 mb-3">Fees</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Gas Fee</span>
                  <span>
                    ${formatHexAmount(tx.fees.totals.gasFeeTokenAmountInUSD, 6)}{" "}
                    USD
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Service Fee</span>
                  <span>
                    $
                    {formatHexAmount(
                      tx.fees.totals.transactionServiceFeeTokenAmountInUSD,
                      6
                    )}{" "}
                    USD
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">LP Fee</span>
                  <span>
                    $
                    {formatHexAmount(
                      tx.fees.totals.transactionLPFeeTokenAmountInUSD,
                      6
                    )}{" "}
                    USD
                  </span>
                </div>
                <div className="border-t border-[#4A4A6A] pt-2 mt-2">
                  <div className="flex justify-between text-sm font-semibold">
                    <span className="text-gray-300">Total Fee</span>
                    <span className="text-yellow-400">
                      ${formatHexAmount(tx.fees.totals.feeTokenAmountInUSD, 6)}{" "}
                      USD
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#2A2A4A] rounded-lg p-4 border border-[#4A4A6A]">
              <p className="text-xs text-gray-400 mb-1">Created At</p>
              <p className="text-sm">
                {new Date(tx.created_at).toLocaleString()}
              </p>
            </div>
            <div className="bg-[#2A2A4A] rounded-lg p-4 border border-[#4A4A6A]">
              <p className="text-xs text-gray-400 mb-1">Updated At</p>
              <p className="text-sm">
                {new Date(tx.updated_at).toLocaleString()}
              </p>
            </div>
          </div>

          {/* View on Explorer */}
          <a
            href={`https://universalx.app/activity/details?id=${tx.transactionId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            View on UniversalX Explorer
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TxDetailsDialog;
