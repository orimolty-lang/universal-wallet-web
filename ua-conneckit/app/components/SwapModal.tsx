/* eslint-disable @next/next/no-img-element */
"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import type { IAssetsResponse, UniversalAccount } from "@particle-network/universal-account-sdk";
import { executeSwap, executeSell, getChainIdFromBlockchain, pollTransactionDetails, getChainName } from "../lib/swapService";
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

// Official USDC logo
const USDC_LOGO = "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png";

// Chain logos for badge
const CHAIN_LOGOS: Record<number, string> = {
  1: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png",
  8453: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/info/logo.png",
  42161: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/info/logo.png",
  10: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/optimism/info/logo.png",
  137: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png",
  101: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png",
};

// Helper functions
const formatTokenAmount = (amount: number, decimals: number = 6): string => {
  if (amount === 0) return "0";
  if (amount < 0.000001) return amount.toExponential(2);
  if (amount < 1) return amount.toFixed(Math.min(decimals, 6));
  if (amount < 1000) return amount.toFixed(4);
  if (amount < 1000000) return amount.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return amount.toLocaleString(undefined, { maximumFractionDigits: 0 });
};

// Token logo with chain badge component
const TokenWithChainBadge = ({ logo, symbol, chainId, size = "w-10 h-10" }: { 
  logo?: string; 
  symbol: string; 
  chainId?: number;
  size?: string;
}) => {
  const chainLogo = chainId ? CHAIN_LOGOS[chainId] : null;
  
  return (
    <div className="relative">
      {logo ? (
        <img src={logo} alt={symbol} className={`${size} rounded-full`} />
      ) : (
        <div className={`${size} rounded-full bg-accent-dynamic flex items-center justify-center text-white font-bold`}>
          {symbol?.slice(0, 2) || "?"}
        </div>
      )}
      {chainLogo && (
        <img 
          src={chainLogo} 
          alt="chain" 
          className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#0a0a0a]" 
        />
      )}
    </div>
  );
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
  const [loadingStatus, setLoadingStatus] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [direction, setDirection] = useState<"buy" | "sell">("buy"); // buy = USD→Token, sell = Token→USD
  const [txResult, setTxResult] = useState<{ 
    txId: string; 
    expectedAmount?: string;
    actualAmount?: string;
    explorerUrl?: string;
    chainId?: number;
    status: "pending" | "completed" | "failed";
  } | null>(null);
  const [isTyping, setIsTyping] = useState(false); // Track manual input to prevent slider override

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
      setDirection("buy"); // Default to buy mode
      setIsTyping(false); // Reset typing state
    }
  }, [isOpen]);

  // Get user's token balance (for sell mode)
  const getTokenBalance = useCallback(() => {
    if (!targetToken || !primaryAssets?.assets) return 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const asset = primaryAssets.assets.find((a: any) => 
      a.symbol?.toUpperCase() === targetToken.symbol?.toUpperCase()
    );
    if (!asset) return 0;
    return typeof asset.amount === 'string' ? parseFloat(asset.amount) : (asset.amount || 0);
  }, [primaryAssets, targetToken]);

  const tokenBalance = getTokenBalance();

  // Update amount based on slider - ONLY when user drags slider, not when typing
  useEffect(() => {
    if (!txResult && !isTyping) {
      if (direction === "buy" && totalBalance > 0) {
        // Buy mode: slider controls USD amount
        const newAmount = (totalBalance * sliderValue / 100).toFixed(2);
        setAmount(newAmount);
      } else if (direction === "sell" && tokenBalance > 0) {
        // Sell mode: slider controls token amount (show USD value)
        const tokenAmt = tokenBalance * sliderValue / 100;
        const usdValue = tokenAmt * (targetToken?.price || 0);
        setAmount(usdValue.toFixed(2));
      }
    }
  }, [sliderValue, totalBalance, tokenBalance, direction, txResult, targetToken?.price, isTyping]);

  // Debounce timer ref for slider sync
  const sliderSyncTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Number pad handler - sets isTyping to prevent slider from overriding typed amount
  const handleNumPad = (key: string) => {
    if (txResult) return; // Don't allow input after success
    
    // Set typing mode immediately to prevent slider useEffect from overriding
    setIsTyping(true);
    
    let newAmount = amount;
    if (key === "backspace") {
      newAmount = amount.slice(0, -1);
    } else if (key === ".") {
      if (!amount.includes(".")) {
        newAmount = amount + ".";
      }
    } else {
      if (amount.length < 10) {
        newAmount = amount + key;
      }
    }
    
    setAmount(newAmount);
    
    // Debounce slider sync - wait 1.5s after last keystroke before syncing slider
    // After sync, clear isTyping so slider can control amount again
    if (sliderSyncTimerRef.current) {
      clearTimeout(sliderSyncTimerRef.current);
    }
    
    sliderSyncTimerRef.current = setTimeout(() => {
      const enteredValue = parseFloat(newAmount) || 0;
      if (direction === "buy" && totalBalance > 0) {
        // In buy mode, amount is USD - calculate percentage of total balance
        const pct = Math.min(100, Math.round((enteredValue / totalBalance) * 100));
        setSliderValue(pct);
      } else if (direction === "sell" && tokenBalance > 0 && targetToken?.price) {
        // In sell mode, amount is USD value of tokens - calculate percentage
        const maxUsdValue = tokenBalance * targetToken.price;
        const pct = Math.min(100, Math.round((enteredValue / maxUsdValue) * 100));
        setSliderValue(pct);
      }
      // Keep isTyping true - only clear when user drags slider
    }, 1500);
  };

  // Handle slider change - when user drags slider, clear typing mode
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsTyping(false); // User is now using slider, allow slider->amount sync
    setSliderValue(parseInt(e.target.value));
  };

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (sliderSyncTimerRef.current) {
        clearTimeout(sliderSyncTimerRef.current);
      }
    };
  }, []);

  // Get token address and chain ID
  const getTokenAddressAndChain = useCallback(() => {
    if (!targetToken) {
      console.log("[SwapModal] No target token");
      return { address: "", chainId: 8453 };
    }
    
    console.log("[SwapModal] getTokenAddressAndChain for:", targetToken.symbol, "contracts:", targetToken.contracts);
    
    // If token has direct address/chainId
    if (targetToken.address && targetToken.chainId) {
      console.log("[SwapModal] Using direct address:", targetToken.address);
      return { address: targetToken.address, chainId: targetToken.chainId };
    }
    
    // If token has contracts array (from Mobula search or external assets)
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
        console.log("[SwapModal] Using Base contract:", baseContract.address);
        return { address: baseContract.address, chainId: 8453 };
      }
      if (ethContract) {
        console.log("[SwapModal] Using Ethereum contract:", ethContract.address);
        return { address: ethContract.address, chainId: 1 };
      }
      if (solContract) {
        console.log("[SwapModal] Using Solana contract:", solContract.address);
        return { address: solContract.address, chainId: 101 };
      }
      
      // Use first contract
      const first = targetToken.contracts[0];
      console.log("[SwapModal] Using first contract:", first.address, first.blockchain);
      return { 
        address: first.address, 
        chainId: getChainIdFromBlockchain(first.blockchain) 
      };
    }
    
    // Fallback: try to find from primaryAssets if we have access
    // This helps when external tokens have chainAggregation but no contracts
    if (primaryAssets?.assets) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const matchingAsset = primaryAssets.assets.find((a: any) => 
        a.symbol?.toUpperCase() === targetToken.symbol?.toUpperCase()
      );
      if (matchingAsset?.chainAggregation) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const chainData = matchingAsset.chainAggregation.find((c: any) => 
          c.token?.address && c.token?.chainId
        );
        if (chainData?.token?.address) {
          console.log("[SwapModal] Using chainAggregation address:", chainData.token.address);
          return { 
            address: chainData.token.address, 
            chainId: chainData.token.chainId || 8453 
          };
        }
      }
    }
    
    console.log("[SwapModal] No address found for token:", targetToken.symbol);
    return { address: "", chainId: 8453 };
  }, [targetToken, primaryAssets]);

  // Get wallet for signing
  const [primaryWallet] = useWallets();

  // Handle swap execution (buy or sell based on direction)
  const handleSwap = async () => {
    if (!targetToken || amountNum <= 0 || !universalAccount) {
      setError("Invalid swap parameters");
      return;
    }

    const { address, chainId: targetChainId } = getTokenAddressAndChain();
    if (!address) {
      setError("Token address not found");
      return;
    }
    
    console.log("[SwapModal] handleSwap - target chain:", targetChainId, "address:", address);
    
    setIsLoading(true);
    setError(null);
    setLoadingStatus(direction === "buy" ? "Preparing buy..." : "Preparing sell...");
    
    try {
      let result;
      
      if (direction === "buy") {
        // BUY: USD → Token
        result = await executeSwap({
          ua: universalAccount,
          fromToken: "USDC",
          toTokenAddress: address,
          toTokenChainId: targetChainId,
          amountUsd: amountUsd,
          slippageBps: 100,
        });
      } else {
        // SELL: Token → USD
        // Calculate token amount to sell based on slider percentage
        const tokenAmountToSell = tokenBalance * sliderValue / 100;
        const decimals = targetToken.decimals || 18;
        
        // Format amount without scientific notation
        // Split into integer and decimal parts, then pad with zeros
        const amountStr = tokenAmountToSell.toFixed(decimals);
        const [intPart, decPart = ""] = amountStr.split(".");
        const paddedDec = (decPart + "0".repeat(decimals)).slice(0, decimals);
        const amountRaw = (intPart + paddedDec).replace(/^0+/, "") || "0";
        
        console.log("[Sell] Amount calc:", { tokenAmountToSell, decimals, amountRaw });
        
        result = await executeSell({
          ua: universalAccount,
          tokenAddress: address,
          tokenChainId: targetChainId,
          amountRaw: amountRaw,
          slippagePct: 5,
        });
      }

      if (!result.success) {
        setError(result.error || "Failed to prepare swap");
        return;
      }

      // Step 2: Sign with wallet
      if (result.requiresSignature && result.rootHash && primaryWallet) {
        try {
          const walletClient = primaryWallet.getWalletClient();

          // Resolve signer address robustly (embedded wallets may not expose walletClient.account)
          let signerAddress = walletClient.account?.address as `0x${string}` | undefined;
          if (!signerAddress) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const accounts = await (walletClient as any).request({ method: 'eth_accounts', params: [] }) as `0x${string}`[];
            signerAddress = accounts?.[0];
          }
          if (!signerAddress) {
            throw new Error('No signer address found for swap signing');
          }

          // Sign the root hash (use signMessage for better embedded-wallet compatibility)
          const signature = await walletClient.signMessage({
            account: signerAddress,
            message: { raw: result.rootHash as `0x${string}` },
          });

          // 7702 auth pattern (only when needed by userOps)
          const authorizations: Array<{ userOpHash: string; signature: string }> = [];
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const txAny = result.transaction as any;
          if (txAny?.userOps?.length) {
            const nonceMap = new Map<number, string>();
            for (const userOp of txAny.userOps) {
              if (!!userOp.eip7702Auth && !userOp.eip7702Delegated) {
                let authSig = nonceMap.get(userOp.eip7702Auth.nonce);
                if (!authSig) {
                  // Preferred: wallet.authorizeSync(userOp.eip7702Auth) if available
                  const authorizeSync =
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (walletClient as any)?.authorizeSync ||
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (primaryWallet as any)?.authorizeSync;

                  if (typeof authorizeSync === 'function') {
                    const authorization = authorizeSync(userOp.eip7702Auth);
                    authSig = authorization?.signature?.serialized;
                  } else {
                    // Fallback: typed-data signing (embedded wallets often support this)
                    const typedData = {
                      types: {
                        Authorization: [
                          { name: 'chainId', type: 'uint256' },
                          { name: 'address', type: 'address' },
                          { name: 'nonce', type: 'uint256' },
                        ],
                      },
                      primaryType: 'Authorization',
                      domain: {},
                      message: {
                        chainId: String(userOp.eip7702Auth.chainId),
                        address: userOp.eip7702Auth.address,
                        nonce: String(userOp.eip7702Auth.nonce),
                      },
                    };
                    authSig = await walletClient.request({
                      method: 'eth_signTypedData_v4',
                      params: [signerAddress, JSON.stringify(typedData)],
                    }) as string;
                  }

                  if (!authSig) throw new Error('Failed to produce 7702 authorization signature');
                  nonceMap.set(userOp.eip7702Auth.nonce, authSig);
                }
                authorizations.push({ userOpHash: userOp.userOpHash, signature: authSig });
              }
            }
          }

          // Step 3: Send transaction
          setLoadingStatus("Sending transaction...");
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const sendResult = await universalAccount.sendTransaction(result.transaction as any, signature as string, authorizations);
          
          if (sendResult?.transactionId) {
            // Format expected amount
            // When selling: output is USDC (6 decimals), when buying: output is target token
            const outputDecimals = direction === "sell" ? 6 : (targetToken?.decimals || 18);
            const expectedFormatted = result.outputAmount 
              ? formatTokenAmount(parseFloat(result.outputAmount) / Math.pow(10, outputDecimals))
              : undefined;
            
            // Show pending state with TARGET chain (not source chain)
            setTxResult({
              txId: sendResult.transactionId,
              expectedAmount: expectedFormatted,
              status: "pending",
              chainId: targetChainId, // Use target chain ID for display
            });
            onSwapSuccess?.(sendResult.transactionId);
            setIsLoading(false);
            
            // Poll for actual transaction details
            setLoadingStatus("Confirming...");
            const txDetails = await pollTransactionDetails(universalAccount, sendResult.transactionId, targetChainId);
            
            if (txDetails.status === "completed") {
              setTxResult(prev => prev ? {
                ...prev,
                status: "completed",
                actualAmount: txDetails.receivedAmount,
                explorerUrl: txDetails.explorerUrl,
                chainId: txDetails.chainId || targetChainId, // Fallback to target chain
              } : null);
            } else if (txDetails.status === "failed") {
              setTxResult(prev => prev ? { ...prev, status: "failed" } : null);
            }
          } else {
            setError("Transaction failed - no ID returned");
          }
        } catch (signError) {
          console.error("Signing error:", signError);
          setError("Failed to sign transaction");
          return;
        }
      } else if (result.transactionId) {
        setTxResult({
          txId: result.transactionId,
          expectedAmount: result.outputAmount,
          status: "pending",
          chainId: targetChainId,
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
      setLoadingStatus("");
    }
  };

  const hasInsufficientBalance = direction === "buy" ? amountNum > totalBalance : tokenBalance <= 0;
  const canSwap = sliderValue > 0 && targetToken && universalAccount && !txResult && 
    (direction === "buy" ? amountNum > 0 : tokenBalance > 0);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/70 z-50" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-x-0 bottom-0 z-50 bg-[#0a0a0a] rounded-t-3xl overflow-hidden flex flex-col max-h-[95vh] animate-slide-up border-t border-white/10">
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

        {/* Success/Pending State */}
        {txResult && (
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            {/* Status Icon with animation */}
            <div className="text-6xl mb-4">
              {txResult.status === "completed" ? (
                <span className="animate-bounce inline-block">✅</span>
              ) : txResult.status === "failed" ? (
                <span>❌</span>
              ) : (
                <span className="inline-block animate-pulse">⏳</span>
              )}
            </div>
            
            {/* Title */}
            <h2 className="text-white text-xl font-bold mb-2">
              {txResult.status === "completed" ? "Swap Complete!" : 
               txResult.status === "failed" ? "Swap Failed" : "Swap Pending..."}
            </h2>
            
            {/* Amount Display */}
            <div className="text-center mb-4">
              {txResult.status === "completed" && txResult.actualAmount ? (
                <p className="text-green-400 text-lg">
                  Received: {formatTokenAmount(parseFloat(txResult.actualAmount))} {direction === "sell" ? "USDC" : targetToken?.symbol}
                </p>
              ) : txResult.expectedAmount ? (
                <p className="text-gray-400">
                  Expected: ~{txResult.expectedAmount} {direction === "sell" ? "USDC" : targetToken?.symbol}
                </p>
              ) : null}
              
              {/* Chain info */}
              {txResult.chainId && (
                <p className="text-gray-500 text-sm mt-1">
                  on {getChainName(txResult.chainId)}
                </p>
              )}
            </div>
            
            {/* Explorer Links - prioritize actual tx hash link */}
            <div className="flex flex-col gap-3 mb-6 w-full max-w-xs">
              {txResult.explorerUrl ? (
                <>
                  {/* Primary: Actual transaction on block explorer */}
                  <a
                    href={txResult.explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 bg-accent-dynamic/20 border border-accent-dynamic/50 text-accent-dynamic py-3 px-4 rounded-full font-medium"
                  >
                    <span>View on {getChainName(txResult.chainId || 8453)}</span>
                    <span>↗</span>
                  </a>
                  {/* Secondary: UniversalX details */}
                  <a
                    href={`https://universalx.app/activity/details?id=${txResult.txId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-500 underline text-sm text-center"
                  >
                    View full details on UniversalX
                  </a>
                </>
              ) : (
                /* Fallback when no explorer URL yet (still pending) */
                <a
                  href={`https://universalx.app/activity/details?id=${txResult.txId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-dynamic underline text-center"
                >
                  View on UniversalX
                </a>
              )}
            </div>
            
            <button
              onClick={onClose}
              className="w-full max-w-xs bg-accent-dynamic text-white py-3 rounded-full font-bold"
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

              {/* From Card - USD (buy) or Token (sell) */}
              <div className="bg-white/5 rounded-2xl p-4 mb-3 border border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {direction === "buy" ? (
                      <>
                        <img src={USDC_LOGO} alt="USDC" className="w-10 h-10 rounded-full" />
                        <div className="flex items-center gap-1">
                          <span className="text-gray-400 text-2xl">$</span>
                          <input type="text" value={amount} placeholder="0" className="bg-transparent text-white text-3xl font-bold w-28 outline-none" readOnly />
                        </div>
                      </>
                    ) : (
                      <>
                        <TokenWithChainBadge 
                          logo={targetToken?.logo} 
                          symbol={targetToken?.symbol || "?"} 
                          chainId={getTokenAddressAndChain().chainId}
                        />
                        <div className="text-white text-3xl font-bold">
                          {formatTokenAmount(tokenBalance * sliderValue / 100)}
                        </div>
                      </>
                    )}
                  </div>
                  <div className="text-right">
                    <div className={`${direction === "buy" ? "bg-blue-600" : "bg-red-500"} text-white px-3 py-1.5 rounded-full font-medium flex items-center gap-1.5`}>
                      {direction === "buy" && <img src={USDC_LOGO} alt="USDC" className="w-4 h-4 rounded-full" />}
                      {direction === "buy" ? "USDC" : targetToken?.symbol}
                    </div>
                    <div className="text-gray-400 text-sm mt-1">
                      {direction === "buy" 
                        ? `Balance: $${totalBalance.toFixed(2)}`
                        : `Balance: ${formatTokenAmount(tokenBalance)}`
                      }
                    </div>
                  </div>
                </div>
              </div>

              {/* Swap Arrow - CLICKABLE to flip direction */}
              <div className="flex justify-center -my-2 relative z-10">
                <button 
                  onClick={() => setDirection(d => d === "buy" ? "sell" : "buy")}
                  className="w-10 h-10 rounded-full bg-white/10 border-4 border-[#0a0a0a] flex items-center justify-center hover:bg-white/20 transition-colors"
                  title="Flip direction"
                >
                  <span className="text-accent-dynamic text-lg">⇅</span>
                </button>
              </div>

              {/* To Card - Token (buy) or USD (sell) */}
              <div className="bg-white/5 rounded-2xl p-4 mt-3 border border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {direction === "buy" ? (
                      <>
                        <TokenWithChainBadge 
                          logo={targetToken?.logo} 
                          symbol={targetToken?.symbol || "?"} 
                          chainId={getTokenAddressAndChain().chainId}
                        />
                        <div className="text-white text-3xl font-bold">{formatTokenAmount(outputAmount)}</div>
                      </>
                    ) : (
                      <>
                        <img src={USDC_LOGO} alt="USDC" className="w-10 h-10 rounded-full" />
                        <div className="flex items-center gap-1">
                          <span className="text-gray-400 text-2xl">$</span>
                          <span className="text-white text-3xl font-bold">{(tokenBalance * sliderValue / 100 * (targetToken?.price || 0) * 0.995).toFixed(2)}</span>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="text-right">
                    <div className={`${direction === "sell" ? "bg-blue-600" : "bg-gray-700"} text-white px-3 py-1.5 rounded-full font-medium flex items-center gap-1.5`}>
                      {direction === "sell" && <img src={USDC_LOGO} alt="USDC" className="w-4 h-4 rounded-full" />}
                      {direction === "buy" ? targetToken?.symbol || "Select" : "USDC"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Rate Display */}
              <div className="mt-3 text-sm">
                <span className="text-gray-400">
                  {direction === "buy" 
                    ? `$1 ≈ ${formatTokenAmount(rate)} ${targetToken?.symbol || "???"}`
                    : `1 ${targetToken?.symbol} ≈ $${(targetToken?.price || 0).toFixed(6)}`
                  }
                </span>
              </div>

              {/* Slider */}
              <div className="mt-8">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <img src={USDC_LOGO} alt="USDC" className="w-5 h-5 rounded-full" />
                    <span className="text-white font-medium">
                      {direction === "buy" ? `Buy ${sliderValue}%` : `Sell ${sliderValue}%`}
                    </span>
                  </div>
                  <button 
                    onClick={() => { setIsTyping(false); setSliderValue(100); }}
                    className="text-accent-dynamic font-medium"
                  >
                    Max
                  </button>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sliderValue}
                  onChange={handleSliderChange}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[var(--accent-color,#f97316)]"
                />
              </div>

              {/* Number Pad */}
              <div className="grid grid-cols-3 gap-2 mt-6">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "backspace"].map((key) => (
                  <button
                    key={key}
                    onClick={() => handleNumPad(key)}
                    className="h-14 rounded-xl bg-white/10 text-white text-xl font-medium flex items-center justify-center active:bg-white/20"
                  >
                    {key === "backspace" ? "⌫" : key}
                  </button>
                ))}
              </div>
            </div>

            {/* Bottom Action */}
            <div className="px-5 py-4 border-t border-white/10" style={{ paddingBottom: "max(env(safe-area-inset-bottom), 16px)" }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-accent-dynamic">⛽</span>
                  <span className="text-white font-medium">Fast</span>
                </div>
                <span className="text-gray-400 text-sm">
                  Gas: &lt;$0.01
                </span>
              </div>
              
              <button
                onClick={handleSwap}
                disabled={!canSwap || isLoading}
                className={`w-full py-4 rounded-full font-bold text-lg ${
                  canSwap && !isLoading
                    ? direction === "buy" ? "bg-accent-dynamic text-white" : "bg-red-500 text-white"
                    : "bg-gray-700 text-gray-400"
                }`}
              >
                {isLoading 
                  ? loadingStatus || (direction === "buy" ? "Buying..." : "Selling...")
                  : direction === "sell" && tokenBalance <= 0
                    ? "No tokens to sell"
                    : hasInsufficientBalance && direction === "buy"
                      ? "Insufficient Balance"
                      : !universalAccount
                        ? "Connect Wallet"
                        : sliderValue <= 0
                          ? "Enter Amount"
                          : direction === "buy" 
                            ? `Buy ${targetToken?.symbol}`
                            : `Sell ${targetToken?.symbol}`
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
