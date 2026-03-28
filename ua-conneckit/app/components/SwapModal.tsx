/* eslint-disable @next/next/no-img-element */
"use client";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import type { IAssetsResponse, UniversalAccount } from "@particle-network/universal-account-sdk";
import { executeSwap, executeSell, get0xSwapQuote, getRelayQuote, getChainIdFromBlockchain, pollTransactionDetails, USDC_ADDRESSES } from "../lib/swapService";
import { mergedAssetMatchesContractKeys, tokenContractKeySet } from "../lib/mobulaAssetIdentity";
import { useWallets, useSign7702AuthorizationCompat } from "@/app/lib/connectkit-compat";
import { getUserOpsFromTx, handleEIP7702Authorizations } from "@/lib/eip7702";
import SlideToConfirm from "../../components/SlideToConfirm";
import type { WalletActivityToastKind } from "./WalletActivityToast";
import { parseUnits } from "viem";

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
  /** UA primary portfolio only — used for buy-side unified USD cap (matches Perps). */
  primaryAssets: IAssetsResponse | null;
  /** Optional Mobula/Particle merge — used to resolve sell balances & chainAggregation for external tokens. */
  portfolioAssets?: IAssetsResponse | null;
  universalAccount: UniversalAccount | null;
  onSwapSuccess?: (txId: string) => void;
  onWalletActivity?: (kind: WalletActivityToastKind, detail?: string) => void;
  onBalancesRefresh?: () => void;
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

const SLIPPAGE_STORAGE_KEY = "omni_swap_slippage_pct_v1";
const DEFAULT_SLIPPAGE_PCT = 1;
const MIN_SLIPPAGE_PCT = 0.1;
const MAX_SLIPPAGE_PCT = 50;

// Helper functions
const formatTokenAmount = (amount: number, decimals: number = 6): string => {
  if (amount === 0) return "0";
  if (amount < 0.000001) return amount.toFixed(10).replace(/\.?0+$/, "");
  if (amount < 1) return amount.toFixed(Math.min(decimals, 6));
  if (amount < 1000) return amount.toFixed(4);
  if (amount < 1000000) return amount.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return amount.toLocaleString(undefined, { maximumFractionDigits: 0 });
};

const clampSlippagePct = (value: number): number => {
  if (!Number.isFinite(value)) return DEFAULT_SLIPPAGE_PCT;
  return Math.max(MIN_SLIPPAGE_PCT, Math.min(MAX_SLIPPAGE_PCT, Number(value.toFixed(2))));
};

/** Floor human token amount to base units (avoids float overshoot on max sells). */
function humanToRawUnits(human: number, decimals: number): bigint {
  if (!(human > 0) || !Number.isFinite(human)) return BigInt(0);
  const d = Math.min(Math.max(0, decimals), 36);
  const s = human.toFixed(d);
  return parseUnits(s as `${string}`, d);
}

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
  portfolioAssets,
  universalAccount,
  onSwapSuccess,
  onWalletActivity,
  onBalancesRefresh,
}: SwapModalProps) => {
  const [amount, setAmount] = useState("");
  const [sliderValue, setSliderValue] = useState(50);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [direction, setDirection] = useState<"buy" | "sell">("buy"); // buy = USD→Token, sell = Token→USD
  const [isConfirming, setIsConfirming] = useState(false);
  const [isTyping, setIsTyping] = useState(false); // Track manual input to prevent slider override
  const [showSlippageSettings, setShowSlippageSettings] = useState(false);
  const [slippagePct, setSlippagePct] = useState<number>(DEFAULT_SLIPPAGE_PCT);
  const [liveBuyOutput, setLiveBuyOutput] = useState<number | null>(null);
  const [liveSellUsd, setLiveSellUsd] = useState<number | null>(null);
  const [, setQuoteStatus] = useState<"idle" | "loading" | "error">("idle");
  const [quoteTick, setQuoteTick] = useState(0);

  /** Buy cap: primary UA unified USD (sum amountInUSD), not combined Mobula total. */
  const unifiedUaBuyBalance = useMemo(() => {
    const list = (primaryAssets?.assets || []) as Array<{ amountInUSD?: number | string }>;
    if (list.length > 0) {
      let sum = 0;
      for (const a of list) {
        const raw = a.amountInUSD;
        const v = typeof raw === "string" ? parseFloat(raw) : Number(raw || 0);
        if (Number.isFinite(v)) sum += v;
      }
      return sum;
    }
    const t = primaryAssets?.totalAmountInUSD as number | string | undefined;
    if (t === undefined || t === null) return 0;
    const n = typeof t === "string" ? parseFloat(t) : Number(t);
    return Number.isFinite(n) ? n : 0;
  }, [primaryAssets]);

  const totalBalance = unifiedUaBuyBalance;

  const assetsForTokenLookup = portfolioAssets ?? primaryAssets;
  
  const amountNum = parseFloat(amount) || 0;
  const amountUsd = amountNum;
  const slippageBps = Math.round(slippagePct * 100);
  const slippageLabel = Number(slippagePct.toFixed(2)).toString();

  const applySlippagePct = useCallback((nextValue: number) => {
    const safe = clampSlippagePct(nextValue);
    setSlippagePct(safe);
    try {
      window.localStorage.setItem(SLIPPAGE_STORAGE_KEY, safe.toString());
    } catch {
      // no-op (private mode or blocked storage)
    }
  }, []);

  // Calculate output amount (fallback estimate) based on target token price
  const outputAmount = targetToken?.price ? amountUsd / targetToken.price : 0;
  const displayedOutputAmount = liveBuyOutput ?? outputAmount;
  const rate = targetToken?.price ? 1 / targetToken.price : 0;

  // Reset state when modal opens + ensure balances are fresh before use
  useEffect(() => {
    if (isOpen) {
      setAmount("");
      setSliderValue(50);
      setError(null);
      setIsConfirming(false);
      setDirection("buy"); // Default to buy mode
      setIsTyping(false); // Reset typing state
      setShowSlippageSettings(false);
      setLiveBuyOutput(null);
      setLiveSellUsd(null);
      setQuoteStatus("idle");
      // Refresh balances so unifiedUaBuyBalance is not stale
      onBalancesRefresh?.();
    }
  }, [isOpen, onBalancesRefresh]);

  useEffect(() => {
    if (!isOpen) return;
    try {
      const raw = window.localStorage.getItem(SLIPPAGE_STORAGE_KEY);
      if (!raw) return;
      const parsed = Number(raw);
      if (!Number.isFinite(parsed)) return;
      const safe = clampSlippagePct(parsed);
      setSlippagePct(safe);
    } catch {
      // no-op (private mode or blocked storage)
    }
  }, [isOpen]);

  // Sell balance: contract + chain only (symbol can collide across scam tokens)
  const getTokenBalance = useCallback(() => {
    if (!targetToken || !assetsForTokenLookup?.assets) return 0;
    const want = tokenContractKeySet(targetToken.contracts);
    if (want.size === 0) return 0;
    const asset = assetsForTokenLookup.assets.find((a) => mergedAssetMatchesContractKeys(a as never, want));
    if (!asset) return 0;

    // Prefer chain-specific balance when available (prevents inflated merged balances on sell math).
    const chainAgg = (asset as { chainAggregation?: Array<{ amount?: number | string; token?: { address?: string; chainId?: number } }> }).chainAggregation;
    const selectedAddress = targetToken.address
      || targetToken.contracts?.find((c) => c.blockchain.toLowerCase() === "base")?.address
      || targetToken.contracts?.[0]?.address
      || "";
    const selectedChainId = targetToken.chainId
      || (targetToken.contracts?.find((c) => c.blockchain.toLowerCase() === "base") ? 8453 :
          (targetToken.contracts?.find((c) => c.blockchain.toLowerCase() === "ethereum") ? 1 :
            (targetToken.contracts?.find((c) => c.blockchain.toLowerCase() === "solana") ? 101 : undefined)));
    if (chainAgg?.length && selectedAddress && selectedChainId) {
      const row = chainAgg.find((c) =>
        (c.token?.chainId === selectedChainId) &&
        String(c.token?.address || "").toLowerCase() === selectedAddress.toLowerCase()
      ) || chainAgg.find((c) => c.token?.chainId === selectedChainId);
      if (row) {
        const v = row.amount;
        const n = typeof v === "string" ? parseFloat(v) : Number(v || 0);
        if (Number.isFinite(n) && n > 0) return n;
      }
    }

    const amt = (asset as { amount?: number | string }).amount;
    return typeof amt === "string" ? parseFloat(amt) : (amt || 0);
  }, [assetsForTokenLookup, targetToken]);

  const tokenBalance = getTokenBalance();

  // Update amount based on slider - ONLY when user drags slider, not when typing
  useEffect(() => {
    if (!isLoading && !isConfirming && !isTyping) {
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
  }, [sliderValue, totalBalance, tokenBalance, direction, isLoading, isConfirming, targetToken?.price, isTyping]);

  // Debounce timer ref for slider sync
  const sliderSyncTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Number pad handler - sets isTyping to prevent slider from overriding typed amount
  const handleNumPad = (key: string) => {
    if (isLoading || isConfirming) return;
    
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
      return { address: "", chainId: 0 };
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
    
    if (assetsForTokenLookup?.assets && targetToken.contracts?.length) {
      const want = tokenContractKeySet(targetToken.contracts);
      if (want.size > 0) {
        const matchingAsset = assetsForTokenLookup.assets.find((a) =>
          mergedAssetMatchesContractKeys(a as never, want),
        );
        if (matchingAsset && (matchingAsset as { chainAggregation?: unknown[] }).chainAggregation) {
          const agg = (matchingAsset as { chainAggregation: Array<{ token?: { address?: string; chainId?: number } }> })
            .chainAggregation;
          const chainData = agg.find((c) => c.token?.address && c.token?.chainId);
          if (chainData?.token?.address) {
            console.log("[SwapModal] Using chainAggregation address:", chainData.token.address);
            return {
              address: chainData.token.address,
              chainId: chainData.token.chainId || 0,
            };
          }
        }
      }
    }
    
    console.log("[SwapModal] No address found for token:", targetToken.symbol);
    return { address: "", chainId: 0 };
  }, [targetToken, assetsForTokenLookup]);

  // Live requote for 0x (EVM) and Relay (Solana) while modal is open.
  const quoteReqIdRef = useRef(0);

  // Periodic refresh every 5s while modal is open.
  useEffect(() => {
    if (!isOpen) return;
    const id = setInterval(() => setQuoteTick((t) => t + 1), 5000);
    return () => clearInterval(id);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !universalAccount || !targetToken || amountNum <= 0) {
      setQuoteStatus("idle");
      if (direction === "buy") setLiveBuyOutput(null);
      else setLiveSellUsd(null);
      return;
    }

    const { address, chainId: targetChainId } = getTokenAddressAndChain();
    if (!address || !targetChainId) {
      setQuoteStatus("error");
      return;
    }

    const reqId = ++quoteReqIdRef.current;
    setQuoteStatus("loading");

    const timer = setTimeout(async () => {
      try {
        const options = await universalAccount.getSmartAccountOptions();
        const evmAddress = options?.smartAccountAddress;
        const solAddress = options?.solanaSmartAccountAddress;
        if (!evmAddress) {
          if (reqId === quoteReqIdRef.current) setQuoteStatus("error");
          return;
        }

        if (direction === "buy") {
          const usdcRaw = String(Math.max(0, Math.floor(amountUsd * 1e6)));
          if (targetChainId === 101) {
            if (!solAddress) {
              if (reqId === quoteReqIdRef.current) setQuoteStatus("error");
              return;
            }
            const relayQuote = await getRelayQuote(
              evmAddress,
              solAddress,
              8453,
              address,
              usdcRaw,
              slippageBps,
            );
            if (reqId !== quoteReqIdRef.current) return;
            if (!relayQuote.success) {
              setQuoteStatus("error");
              setLiveBuyOutput(null);
              return;
            }
            const out = Number(relayQuote.outputAmount || "0");
            setLiveBuyOutput(Number.isFinite(out) ? out : null);
            setQuoteStatus("idle");
          } else {
            const sellToken = USDC_ADDRESSES[8453] || "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913";
            const quote = await get0xSwapQuote(
              evmAddress,
              sellToken,
              address,
              usdcRaw,
              targetChainId,
              slippageBps,
              evmAddress,
              "sell",
            );
            if (reqId !== quoteReqIdRef.current) return;
            if (!quote.success || !quote.outputAmount) {
              setQuoteStatus("error");
              setLiveBuyOutput(null);
              return;
            }
            const dec = targetToken?.decimals ?? 18;
            const out = Number(quote.outputAmount) / Math.pow(10, dec);
            setLiveBuyOutput(Number.isFinite(out) ? out : null);
            setQuoteStatus("idle");
          }
        } else {
          // Sell side live quote for EVM tokens via 0x
          if (targetChainId === 101) {
            if (reqId === quoteReqIdRef.current) {
              setLiveSellUsd(null);
              setQuoteStatus("idle");
            }
            return;
          }

          const tokenAmountToSell = tokenBalance * sliderValue / 100;
          const decimals = targetToken?.decimals || 18;
          const amountRaw = humanToRawUnits(tokenAmountToSell, decimals).toString();
          if (!amountRaw || BigInt(amountRaw) <= BigInt(0)) {
            if (reqId === quoteReqIdRef.current) setQuoteStatus("error");
            return;
          }

          const buyUsdc = USDC_ADDRESSES[targetChainId] || USDC_ADDRESSES[8453];
          if (!buyUsdc) {
            if (reqId === quoteReqIdRef.current) setQuoteStatus("error");
            return;
          }

          const sellQuote = await get0xSwapQuote(
            evmAddress,
            address,
            buyUsdc,
            amountRaw,
            targetChainId,
            slippageBps,
            evmAddress,
            "buy",
          );
          if (reqId !== quoteReqIdRef.current) return;
          if (!sellQuote.success || !sellQuote.outputAmount) {
            setQuoteStatus("error");
            setLiveSellUsd(null);
            return;
          }
          const usd = Number(sellQuote.outputAmount) / 1e6;
          setLiveSellUsd(Number.isFinite(usd) ? usd : null);
          setQuoteStatus("idle");
        }
      } catch {
        if (reqId === quoteReqIdRef.current) setQuoteStatus("error");
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [
    isOpen,
    universalAccount,
    targetToken,
    amountNum,
    amountUsd,
    slippageBps,
    direction,
    sliderValue,
    tokenBalance,
    quoteTick,
    getTokenAddressAndChain,
  ]);

  // Get wallet for signing
  const [primaryWallet] = useWallets();
  const sign7702 = useSign7702AuthorizationCompat();

  const sellTokenHuman = tokenBalance * sliderValue / 100;

  const sellUsdPreview = liveSellUsd ?? (amountNum * Math.max(0, 1 - slippagePct / 100));

  // Handle swap execution (buy or sell based on direction)
  const handleSwap = async () => {
    if (!targetToken || amountNum <= 0 || !universalAccount) {
      setError("Invalid swap parameters");
      return;
    }

    const { address, chainId: targetChainId } = getTokenAddressAndChain();
    if (!address || !targetChainId) {
      setError("Token address/chain not found");
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
          slippageBps,
        });
      } else {
        // SELL: Token → USD (`amount` is USD notional; matches numpad + slider)
        const isSolanaToken = targetChainId === 101;
        const rawDecimals = targetToken.decimals || (isSolanaToken ? 9 : 18);
        const decimals = isSolanaToken ? Math.min(rawDecimals, 9) : rawDecimals;
        const tokenAmountToSell = tokenBalance * sliderValue / 100;
        if (tokenAmountToSell <= 0) {
          setError("Invalid sell amount");
          setIsLoading(false);
          return;
        }
        const maxRaw = humanToRawUnits(tokenBalance, decimals);
        let wantRaw = humanToRawUnits(tokenAmountToSell, decimals);
        if (wantRaw > maxRaw) wantRaw = maxRaw;
        const isFullSell =
          sliderValue >= 100 || tokenAmountToSell >= tokenBalance * 0.999999999;
        if (isFullSell && maxRaw > BigInt(1)) wantRaw = maxRaw - BigInt(1);
        else if (isFullSell && maxRaw === BigInt(1)) wantRaw = BigInt(1);
        const amountRaw = wantRaw.toString();

        console.log("[Sell] Amount calc:", { tokenAmountToSell, decimals, amountRaw, chainId: targetChainId });

        result = await executeSell({
          ua: universalAccount,
          tokenAddress: address,
          tokenChainId: targetChainId,
          amountRaw,
          amount: tokenAmountToSell.toString(),
          tokenDecimals: decimals,
          slippagePct,
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
          
          // Sign rootHash (demo parity): prefer signMessage(raw) path.
          let signature: unknown;
          if (walletClient.signMessage) {
            signature = await walletClient.signMessage({ message: { raw: result.rootHash as `0x${string}` } });
          } else {
            signature = await walletClient.request({
              method: 'personal_sign',
              params: [result.rootHash as `0x${string}`, walletClient.account?.address as `0x${string}`],
            });
          }

          // Step 3: Send transaction (+EIP-7702 authorizations - demo-aligned, no chain switch)
          setLoadingStatus("Sending transaction...");
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const txAny = result.transaction as any;
          let authorizations: Array<{ userOpHash: string; signature: string }> | undefined;
          const walletAddr = walletClient.account?.address as string | undefined;
          const userOps = getUserOpsFromTx(txAny);
          if (userOps.length > 0) {
            if (sign7702 && walletAddr) {
              authorizations = await handleEIP7702Authorizations(userOps as Parameters<typeof handleEIP7702Authorizations>[0], sign7702, walletAddr);
            } else {
              const { Signature } = await import("ethers");
              const nonceMap = new Map<string, string>();
              authorizations = [];
              for (const op of userOps) {
                const userOp = op as { eip7702Auth?: { chainId?: number; address: string; nonce: number }; eip7702Delegated?: boolean; chainId?: number; userOpHash?: string };
                const auth = userOp?.eip7702Auth;
                if (!auth || userOp?.eip7702Delegated) continue;
                const chainId = auth.chainId || userOp.chainId;
                if (!chainId || chainId === 101) continue;
                const nonceKey = `${chainId}:${auth.nonce}`;
                let serialized = nonceMap.get(nonceKey);
                if (!serialized) {
                  const payload = await walletClient.request({
                    method: "magic_wallet_sign_7702_authorization",
                    params: [{ contractAddress: auth.address, chainId, nonce: auth.nonce }],
                  }) as { r: string; s: string; v?: number | bigint; yParity: number };
                  serialized = Signature.from({
                    r: payload.r,
                    s: payload.s,
                    v: payload.v ?? BigInt(payload.yParity ?? 0),
                    yParity: (payload.yParity ?? 0) as 0 | 1,
                  }).serialized;
                  nonceMap.set(nonceKey, serialized);
                }
                if (serialized && userOp?.userOpHash) authorizations.push({ userOpHash: userOp.userOpHash, signature: serialized });
              }
            }
            if (!authorizations?.length) authorizations = undefined;
          }
          const sendResult = await universalAccount.sendTransaction(txAny, signature as string, authorizations);
          
          if (sendResult?.transactionId) {
            onWalletActivity?.("swap_submit", targetToken.symbol);
            setIsLoading(false);
            setIsConfirming(true);
            setLoadingStatus("");
            try {
              const txDetails = await pollTransactionDetails(
                universalAccount,
                sendResult.transactionId,
                targetChainId,
              );
              if (txDetails.status === "completed") {
                const fromSym = direction === "buy" ? "USDC" : (targetToken?.symbol || "TOKEN");
                const toSym = direction === "buy" ? (targetToken?.symbol || "TOKEN") : "USDC";
                let detail: string | undefined;
                if (txDetails.receivedAmount) {
                  detail = `${formatTokenAmount(parseFloat(txDetails.receivedAmount))} ${toSym} · ${fromSym} → ${toSym}`;
                } else {
                  detail = `${fromSym} → ${toSym}`;
                }
                onWalletActivity?.("swap_confirmed", detail);
                onSwapSuccess?.(sendResult.transactionId);
                onClose();
              } else if (txDetails.status === "failed") {
                setError("Swap failed on-chain");
              }
            } finally {
              setIsConfirming(false);
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
        onWalletActivity?.("swap_submit", targetToken.symbol);
        setIsConfirming(true);
        try {
          const txDetails = await pollTransactionDetails(
            universalAccount,
            result.transactionId,
            targetChainId,
          );
          if (txDetails.status === "completed") {
            const fromSym = direction === "buy" ? "USDC" : (targetToken?.symbol || "TOKEN");
            const toSym = direction === "buy" ? (targetToken?.symbol || "TOKEN") : "USDC";
            onWalletActivity?.("swap_confirmed", `${fromSym} → ${toSym}`);
            onSwapSuccess?.(result.transactionId);
            onClose();
          } else if (txDetails.status === "failed") {
            setError("Swap failed on-chain");
          }
        } finally {
          setIsConfirming(false);
        }
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


  const hasInsufficientBalance = direction === "sell" ? tokenBalance <= 0 : false;
  const canSwap =
    sliderValue > 0 &&
    targetToken &&
    universalAccount &&
    !isConfirming &&
    (direction === "buy" ? amountNum > 0 : tokenBalance > 0);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 z-50"
        onClick={() => (showSlippageSettings ? setShowSlippageSettings(false) : onClose())}
      />

      {/* Modal */}
      <div className="fixed inset-x-0 bottom-0 z-50 bg-[#0a0a0a] rounded-t-3xl overflow-hidden flex flex-col max-h-[95vh] animate-slide-up border-t border-white/10" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4">
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center"
          >
            <span className="text-lg">✕</span>
          </button>
          <span className="text-white font-bold text-lg">Swap</span>
          <button
            onClick={() => setShowSlippageSettings((prev) => !prev)}
            className={`w-10 h-10 rounded-full flex items-center justify-center ${
              showSlippageSettings ? "bg-accent-dynamic/30 border border-accent-dynamic/50" : "bg-gray-800"
            }`}
            title="Swap settings"
          >
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
          </button>
        </div>

        <>
            <div className="flex-1 px-5 pb-3">
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
                          {formatTokenAmount(sellTokenHuman)}
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
                        <div className="text-white text-3xl font-bold">{formatTokenAmount(displayedOutputAmount)}</div>
                      </>
                    ) : (
                      <>
                        <img src={USDC_LOGO} alt="USDC" className="w-10 h-10 rounded-full" />
                        <div className="flex items-center gap-1">
                          <span className="text-gray-400 text-2xl">$</span>
                          <span className="text-white text-3xl font-bold">{sellUsdPreview.toFixed(2)}</span>
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

              {/* Quick Size Buttons */}
              <div className="mt-6 grid grid-cols-4 gap-2">
                {[10, 25, 50, 100].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => { setIsTyping(false); setSliderValue(pct); }}
                    className={`h-10 rounded-xl text-sm font-medium ${sliderValue === pct ? "bg-accent-dynamic text-white" : "bg-white/10 text-white"}`}
                  >
                    {pct === 100 ? "Max" : `${pct}%`}
                  </button>
                ))}
              </div>

              {/* Number Pad */}
              <div className="grid grid-cols-3 gap-1.5 mt-4">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "backspace"].map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleNumPad(key)}
                    className="h-11 rounded-lg bg-white/10 text-white text-base font-medium flex items-center justify-center active:bg-white/20"
                  >
                    {key === "backspace" ? "⌫" : key}
                  </button>
                ))}
              </div>
            </div>

            {/* Bottom Action */}
            <div className="px-5 py-3 border-t border-white/10 shrink-0" style={{ paddingBottom: "max(env(safe-area-inset-bottom), 12px)" }}>
              <SlideToConfirm
                label={
                  direction === "sell" && tokenBalance <= 0
                    ? "No tokens to sell"
                    : hasInsufficientBalance && direction === "buy"
                      ? "Insufficient balance"
                      : !universalAccount
                        ? "Connect wallet"
                        : sliderValue <= 0
                          ? "Enter amount"
                          : direction === "buy"
                            ? `Slide to buy ${targetToken?.symbol || ""}`
                            : `Slide to sell ${targetToken?.symbol || ""}`
                }
                variant={direction === "buy" ? "accent" : "short"}
                disabled={
                  !canSwap ||
                  isLoading ||
                  isConfirming ||
                  !universalAccount ||
                  sliderValue <= 0 ||
                  (direction === "sell" && tokenBalance <= 0)
                }
                loading={isLoading || isConfirming}
                loadingLabel={
                  isConfirming
                    ? "Confirming…"
                    : loadingStatus || (direction === "buy" ? "Buying…" : "Selling…")
                }
                onConfirm={handleSwap}
              />
            </div>
          </>
      </div>

      {showSlippageSettings && (
        <>
          <div
            className="fixed inset-0 z-[100] bg-black/80"
            onClick={() => setShowSlippageSettings(false)}
            aria-hidden
          />
          <div
            className="fixed left-4 right-4 top-[14%] z-[101] max-h-[min(72vh,520px)] overflow-y-auto rounded-2xl border border-white/15 bg-[#101010] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.85)]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="swap-slippage-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 id="swap-slippage-title" className="text-white font-semibold text-lg">
                Slippage
              </h3>
              <button
                type="button"
                onClick={() => setShowSlippageSettings(false)}
                className="rounded-full bg-white/10 px-3 py-1 text-sm text-gray-200"
              >
                Done
              </button>
            </div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-400 text-sm">Tolerance</span>
              <span className="text-accent-dynamic text-sm font-medium">{slippageLabel}%</span>
            </div>
            <div className="mb-2">
              <input
                type="range"
                min={MIN_SLIPPAGE_PCT}
                max={MAX_SLIPPAGE_PCT}
                step="0.1"
                value={slippagePct}
                onChange={(e) => applySlippagePct(Number(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[var(--accent-color,#f97316)]"
              />
            </div>
            <p className="text-[11px] text-gray-500">Range: 0.1% – 50%</p>
          </div>
        </>
      )}

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
