"use client";

import { useState } from "react";
import "./animations.css";
import {
  UniversalAccount,
  CHAIN_ID,
  SUPPORTED_TOKEN_TYPE,
  EIP7702Authorization,
} from "@particle-network/universal-account-sdk";
import { Button } from "../../components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { BrowserProvider, getBytes } from "ethers";

interface ConvertWithEIP7702Props {
  universalAccountInstance: UniversalAccount | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  walletClient: any;
  address?: string | undefined;
}

export default function ConvertWithEIP7702({
  universalAccountInstance,
  walletClient,
  address: _address,
}: ConvertWithEIP7702Props) {
  void _address; // Kept for interface consistency with other transaction components
  const [amount, setAmount] = useState<string>("0.0001");
  const [txResult, setTxResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showDetails, setShowDetails] = useState<boolean>(false);

  const runConversion = async () => {
    if (!universalAccountInstance || !walletClient) return;
    setIsLoading(true);
    setTxResult(null);

    try {
      if (!amount || Number(amount) <= 0) {
        throw new Error("Please enter a valid USDT amount.");
      }

      // Get ethers provider from walletClient
      // walletClient is from Particle Connect and supports EIP-1193
      const ethersProvider = new BrowserProvider(walletClient);
      const ethersSigner = await ethersProvider.getSigner();

      // 1) Create conversion transaction with EIP-7702
      const transaction =
        await universalAccountInstance.createConvertTransaction(
          {
            expectToken: { type: SUPPORTED_TOKEN_TYPE.USDT, amount },
            chainId: CHAIN_ID.ARBITRUM_MAINNET_ONE,
          },
          {
            usePrimaryTokens: [SUPPORTED_TOKEN_TYPE.USDC],
          }
        );

      console.log("Transaction created:", transaction);

      // 2) Handle EIP-7702 authorizations using ethers
      // This matches the original example: wallet.authorizeSync(userOp.eip7702Auth)
      const authorizations: EIP7702Authorization[] = [];

      for (const userOp of transaction.userOps) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const userOpData = userOp as any;

        console.log("UserOp:", {
          eip7702Delegated: userOpData.eip7702Delegated,
          hasEip7702Auth: !!userOpData.eip7702Auth,
        });

        if (userOpData.eip7702Delegated === false && userOpData.eip7702Auth) {
          // Use ethers' Wallet.authorizeSync method (ethers v6 feature)
          // This is the same as the original example
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const authorization = (ethersSigner as any).authorizeSync(
            userOpData.eip7702Auth
          );

          console.log("Authorization created:", authorization);

          authorizations.push({
            address: authorization.address,
            userOpHash: userOp.userOpHash,
            chainId: Number(userOpData.eip7702Auth.chainId),
            nonce: Number(userOpData.eip7702Auth.nonce),
            signature: authorization.signature.serialized,
          });
        }
      }

      console.log("Authorizations:", authorizations);

      // 3) Sign the root hash using ethers
      const messageBytes = getBytes(transaction.rootHash);
      const signature = await ethersSigner.signMessage(messageBytes);

      console.log("Root hash signature:", signature);

      // 4) Send transaction with authorizations
      const result = await universalAccountInstance.sendTransaction(
        transaction,
        signature,
        authorizations
      );

      setTxResult(
        `https://universalx.app/activity/details?id=${result.transactionId}`
      );
    } catch (error) {
      console.error("EIP-7702 conversion failed:", error);
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
        EIP-7702 Conversion
      </h3>

      <div className="bg-[#2A2A4A] rounded-lg p-6 border border-[#4A4A6A] shadow-inner flex flex-col gap-4 hover:border-purple-500 transition-colors flex-grow">
        <div className="w-full mb-2">
          <div className="flex justify-between items-center">
            <h4 className="text-lg font-medium text-purple-300">
              Convert to USDT with EIP-7702
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
                This demonstrates EIP-7702 authorization for cross-chain
                conversions. The Universal Account converts assets to{" "}
                <span className="font-semibold">{amount || "X"}</span> USDT on
                BSC, using BNB as the source token. EIP-7702 allows your EOA to
                temporarily delegate authority to the smart account.
              </p>
              <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
                <span>Source: BNB → Destination: USDT (BSC)</span>
                <a
                  href="https://github.com/soos3d/universal-accounts-connectkit-demo/blob/main/ua-conneckit/app/components/ConvertWithEIP7702.tsx"
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
                    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77A5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                  </svg>
                  View Code on GitHub
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Amount input */}
        <div className="w-full">
          <p className="text-sm text-gray-300 mb-2">Amount (USDT)</p>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value.trim())}
            placeholder="e.g. 0.0001"
            className="w-full px-4 py-2 bg-[#1A1A2A] border border-[#4A4A6A] rounded-md text-gray-200 placeholder-gray-500 focus:outline-none"
            inputMode="decimal"
          />
        </div>

        <Button
          onClick={runConversion}
          disabled={isLoading}
          className="w-full py-3 px-6 rounded-lg font-bold text-lg text-white bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 transition-all duration-300 shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Converting with EIP-7702..." : "Convert to USDT"}
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
                createConvertTransaction
              </code>
              ,
              <br />
              <code className="bg-[#1A1A2A] px-1 py-0.5 rounded text-purple-300 mx-1">
                sendTransaction
              </code>
              <br />
              <span className="text-yellow-400">+ EIP-7702 Authorization</span>
            </p>
            <a
              href="https://developers.particle.network/universal-accounts/ua-reference/desktop/web#sending-a-conversion-transaction"
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
