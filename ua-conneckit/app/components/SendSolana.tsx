"use client";

import { useState } from "react";
import "./animations.css";
import {
  UniversalAccount,
  CHAIN_ID,
  SUPPORTED_TOKEN_TYPE,
  serializeInstruction,
} from "@particle-network/universal-account-sdk";
import { Button } from "../../components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { PublicKey, SystemProgram } from "@solana/web3.js";

interface SendSolanaProps {
  universalAccountInstance: UniversalAccount | null;
  // EVM wallet client used to sign the UA root hash
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  walletClient: any;
  // EVM address behind the Universal Account (used for signMessage)
  address: string | undefined;
  // UA's Solana smart account owner address (from UA SDK / options)
  solanaSmartAccountAddress: string | undefined;
}

const SOL_DECIMALS = 9;
const SOL_FACTOR = BigInt("1" + "0".repeat(SOL_DECIMALS));

// Validate SOL amount format (up to 9 decimal places)
const SOL_AMOUNT_REGEX = /^\d+(\.\d{0,9})?$/;

// Convert "1.5" -> bigint in lamports (1500000000)
function parseSolAmount(amount: string): bigint {
  const [wholeRaw, fracRaw = ""] = amount.split(".");
  const whole = wholeRaw || "0";
  const fracPadded = (fracRaw + "0".repeat(SOL_DECIMALS)).slice(0, SOL_DECIMALS);

  const wholeBig = BigInt(whole);
  const fracBig = BigInt(fracPadded || "0");

  return wholeBig * SOL_FACTOR + fracBig;
}

export default function SendSolana({
  universalAccountInstance,
  walletClient,
  address,
  solanaSmartAccountAddress,
}: SendSolanaProps) {
  const [txResult, setTxResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showDetails, setShowDetails] = useState<boolean>(false);

  const [amount, setAmount] = useState<string>(""); // human-readable SOL, e.g. "0.5"
  const [recipient, setRecipient] = useState<string>(""); // Solana address

  const runTransaction = async () => {
    if (!universalAccountInstance) return;

    setIsLoading(true);
    setTxResult(null);

    try {
      if (!amount || !SOL_AMOUNT_REGEX.test(amount) || Number(amount) <= 0) {
        throw new Error("Please enter a valid SOL amount (e.g., 0.5 or 1.25).");
      }

      if (!address) {
        throw new Error(
          "Missing EVM address to sign the Universal transaction."
        );
      }

      if (!walletClient) {
        throw new Error(
          "Wallet client not available. Please reconnect your wallet."
        );
      }

      if (!solanaSmartAccountAddress) {
        throw new Error(
          "Missing Solana smart account address for the Universal Account."
        );
      }

      if (!recipient) {
        throw new Error("Please enter a valid recipient Solana address.");
      }

      let ownerPubkey: PublicKey;
      let recipientPubkey: PublicKey;

      try {
        ownerPubkey = new PublicKey(solanaSmartAccountAddress);
      } catch {
        throw new Error("Invalid Solana smart account address.");
      }

      try {
        recipientPubkey = new PublicKey(recipient);
      } catch {
        throw new Error("Invalid recipient Solana address.");
      }

      const lamports = parseSolAmount(amount);

      // Create System Program transfer instruction for native SOL
      const transferIx = SystemProgram.transfer({
        fromPubkey: ownerPubkey,
        toPubkey: recipientPubkey,
        lamports,
      });

      const serializedInstruction = serializeInstruction(transferIx);

      const transaction =
        await universalAccountInstance.createUniversalTransaction({
          chainId: CHAIN_ID.SOLANA_MAINNET,
          expectTokens: [
            {
              type: SUPPORTED_TOKEN_TYPE.SOL,
              amount,
            },
          ],
          transactions: [serializedInstruction],
        });

      // Sign the UA transaction hash with the connected EVM wallet
      const signature = await walletClient.signMessage({
        account: address as `0x${string}`,
        message: { raw: transaction.rootHash },
      });

      // Send through UA
      const result = await universalAccountInstance.sendTransaction(
        transaction,
        signature
      );

      setTxResult(
        `https://universalx.app/activity/details?id=${result.transactionId}`
      );
    } catch (error) {
      console.error("Solana SOL transfer failed:", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      setTxResult(`Error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      <h3 className="text-xl font-semibold text-gray-200 border-b border-[#4A4A6A] pb-2 text-center">
        Solana SOL Transfer
      </h3>

      <div className="bg-[#2A2A4A] rounded-lg p-6 border border-[#4A4A6A] shadow-inner flex flex-col gap-4 hover:border-purple-500 transition-colors flex-grow">
        <div className="w-full mb-2">
          <div className="flex justify-between items-center">
            <h4 className="text-lg font-medium text-purple-300">
              Send Native SOL
            </h4>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-purple-300 hover:text-purple-400 transition-colors"
              aria-label={showDetails ? "Hide details" : "Show details"}
            >
              {showDetails ? (
                <ChevronUp size={18} />
              ) : (
                <ChevronDown size={18} />
              )}
            </button>
          </div>

          {showDetails && (
            <div className="mt-3 animate-fadeIn">
              <p className="text-sm text-gray-300 mb-4">
                This example demonstrates how to send native SOL to a Solana
                address using Universal Accounts. It sources liquidity from ANY
                chain where you hold assets, converts it to SOL, and delivers
                it directly to the recipient on Solana—all in one transaction.
                <br />
                <br />
                It sends{" "}
                <span className="font-semibold">{amount || "X"}</span> SOL on
                Solana to{" "}
                <span className="font-semibold">
                  {recipient
                    ? `${recipient.slice(0, 4)}…${recipient.slice(-4)}`
                    : "Recipient (Solana address)"}
                </span>
                .
              </p>
              <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                <span>Native SOL (System Program)</span>
                <a
                  href="https://explorer.solana.com/address/11111111111111111111111111111111"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:underline"
                >
                  View System Program on Solana Explorer
                </a>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
                <span>Cross-chain → Solana SOL flow</span>
                <a
                  href="https://developers.particle.network/universal-accounts/cha/overview"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:underline flex items-center gap-1"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                  </svg>
                  View Chain Abstraction Docs
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 gap-3 w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <p className="text-sm text-gray-300 mb-2">Amount (SOL)</p>
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value.trim())}
                placeholder="e.g. 0.5"
                className="w-full px-4 py-2 bg-[#1A1A2A] border border-[#4A4A6A] rounded-md text-gray-200 placeholder-gray-500 focus:outline-none"
                inputMode="decimal"
              />
            </div>

            <div>
              <p className="text-sm text-gray-300 mb-2">
                Recipient (Solana address)
              </p>
              <input
                value={recipient}
                onChange={(e) => setRecipient(e.target.value.trim())}
                placeholder="e.g. 7uY2…wod8Hm"
                className="w-full px-4 py-2 bg-[#1A1A2A] border border-[#4A4A6A] rounded-md text-gray-200 placeholder-gray-500 focus:outline-none"
                inputMode="text"
              />
            </div>
          </div>
        </div>

        <Button
          onClick={runTransaction}
          disabled={isLoading || !amount || !recipient || !universalAccountInstance}
          className="w-full py-3 px-6 rounded-lg font-bold text-lg text-white bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 transition-all duration-300 shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Transferring..." : "Send SOL on Solana"}
        </Button>

        {txResult && (
          <div className="mt-4 text-center text-sm">
            {txResult.startsWith("Error") ? (
              <p className="text-red-400 break-all">{txResult}</p>
            ) : (
              <a
                href={txResult}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 hover:underline break-all"
              >
                View Transaction on Explorer
              </a>
            )}
          </div>
        )}

        <div className="w-full mt-2 pt-3 border-t border-[#4A4A6A]">
          <div className="flex justify-between items-start">
            <p className="text-xs text-gray-400">
              <span className="font-medium text-gray-300">
                SDK Functions Used:
              </span>
              <br />
              <code className="bg-[#1A1A2A] px-1 py-0.5 rounded text-purple-300 mx-1">
                createUniversalTransaction
              </code>
              ,
              <br />
              <code className="bg-[#1A1A2A] px-1 py-0.5 rounded text-purple-300 mx-1">
                sendTransaction
              </code>
            </p>
            <a
              href="https://developers.particle.network/universal-accounts/ua-reference/desktop/web#sending-a-custom-payable-transaction"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-purple-400 hover:underline flex items-center gap-1"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
              </svg>
              View Docs
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
