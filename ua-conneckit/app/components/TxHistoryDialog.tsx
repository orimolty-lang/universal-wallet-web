/* eslint-disable @next/next/no-img-element */
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { type ITransactionHistory } from "../types/transaction-history";
import { Link, Github } from "lucide-react";

interface TxHistoryDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  transactions: ITransactionHistory[];
  onTransactionClick: (transactionId: string) => void;
}

const TxHistoryDialog = ({
  isOpen,
  setIsOpen,
  transactions,
  onTransactionClick,
}: TxHistoryDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md bg-[#1F1F3A] border border-[#4A4A6A] text-gray-200">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-center text-[#C084FC]">
            Transaction History
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-4 mt-4 max-h-96 overflow-y-auto">
          {transactions?.length > 0 ? (
            transactions.map((tx) => {
              const amount = tx.change?.amount || "0";
              const amountInUSD = tx.change?.amountInUSD || "0.00";
              const isNegative = amount.startsWith("-");

              return (
                <button
                  key={tx.transactionId}
                  onClick={() => onTransactionClick(tx.transactionId)}
                  className="w-full bg-[#2A2A4A] rounded-lg p-4 border border-[#4A4A6A] shadow-inner hover:border-purple-500 transition-colors cursor-pointer text-left"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      {tx.targetToken?.image && (
                        <img
                          src={tx.targetToken.image}
                          alt={tx.targetToken.symbol}
                          className="w-8 h-8 rounded-full"
                        />
                      )}
                      <div>
                        <p className="font-semibold">{tx.tag}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(tx.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-semibold ${
                          isNegative ? "text-red-500" : "text-green-500"
                        }`}
                      >
                        {amount} {tx.targetToken?.symbol || ""}
                      </p>
                      <p className="text-xs text-gray-400">{amountInUSD} USD</p>
                    </div>
                  </div>
                </button>
              );
            })
          ) : (
            <p className="text-center text-gray-400">No transactions found.</p>
          )}
        </div>
        <div className="flex justify-center gap-4 mt-4 pt-4 border-t border-[#4A4A6A]">
          <a
            href="https://developers.particle.network/universal-accounts/ua-reference/desktop/web#fetching-transaction-history"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-300 bg-[#2A2A4A] rounded-lg border border-[#4A4A6A] hover:bg-[#3A3A5A] transition-colors"
          >
            <Link className="h-4 w-4" />
            View Docs
          </a>
          <a
            href="https://github.com/Particle-Network/universal-accounts-connectkit-demo/blob/cb524c3e17f410d3401e77b871bf0e16632086e7/ua-conneckit/app/page.tsx#L179"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-300 bg-[#2A2A4A] rounded-lg border border-[#4A4A6A] hover:bg-[#3A3A5A] transition-colors"
          >
            <Github className="h-4 w-4" />
            GitHub
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TxHistoryDialog;
