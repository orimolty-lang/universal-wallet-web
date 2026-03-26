/**
 * Swap Service for Universal Wallet
 * - 0x API for EVM swaps
 * - Relay.link for EVM → Solana swaps
 */

import { UniversalAccount, CHAIN_ID, SUPPORTED_TOKEN_TYPE } from "@particle-network/universal-account-sdk";

// ============ CONSTANTS ============

// Unified swap proxy (Li.Fi + 0x) - use worker in production to hide API keys
const SWAP_PROXY_BASE = process.env.NEXT_PUBLIC_LIFI_PROXY_URL || "https://lifi-proxy.orimolty.workers.dev";
const LIFI_API_BASE = SWAP_PROXY_BASE;
const ZEROX_PROXY_BASE = SWAP_PROXY_BASE;

// Relay API (no key needed, rate limited)
const RELAY_API_BASE = "https://api.relay.link";

// Affiliate fee
const AFFILIATE_FEE_RECIPIENT = "0x40D57fdEa9EE39ec5e644E83975Dcbb97eE7De80";
const AFFILIATE_FEE_BPS = 35; // 0.35%

// Chain IDs
const RELAY_CHAIN_IDS = {
  ETHEREUM: 1,
  BASE: 8453,
  ARBITRUM: 42161,
  OPTIMISM: 10,
  POLYGON: 137,
  BSC: 56,
  SOLANA: 792703809,
};

// USDC addresses per chain
const USDC_ADDRESSES: Record<number, string> = {
  [RELAY_CHAIN_IDS.BASE]: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
  [RELAY_CHAIN_IDS.ETHEREUM]: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
  [RELAY_CHAIN_IDS.ARBITRUM]: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
  [RELAY_CHAIN_IDS.OPTIMISM]: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
  [RELAY_CHAIN_IDS.POLYGON]: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
  [RELAY_CHAIN_IDS.BSC]: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
  [RELAY_CHAIN_IDS.SOLANA]: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
};

// Native ETH placeholder
const NATIVE_ETH = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

const MIN_SLIPPAGE_BPS = 1; // 0.01%
const MAX_SLIPPAGE_BPS = 5000; // 50%

// Chain explorer URLs
const CHAIN_EXPLORERS: Record<number, string> = {
  1: "https://etherscan.io",
  8453: "https://basescan.org",
  42161: "https://arbiscan.io",
  10: "https://optimistic.etherscan.io",
  137: "https://polygonscan.com",
  56: "https://bscscan.com",
  43114: "https://snowtrace.io",
  101: "https://solscan.io", // Solana
};

// Chain logos
export const CHAIN_LOGOS: Record<string, string> = {
  "ethereum": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png",
  "base": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/info/logo.png",
  "arbitrum": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/info/logo.png",
  "optimism": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/optimism/info/logo.png",
  "polygon": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png",
  "bsc": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/smartchain/info/logo.png",
  "bnb": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/smartchain/info/logo.png",
  "solana": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png",
  "avalanche": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/avalanchec/info/logo.png",
};

/**
 * Get explorer URL for a transaction hash
 */
export function getExplorerTxUrl(chainId: number, txHash: string): string {
  const explorer = CHAIN_EXPLORERS[chainId];
  if (!explorer) return `https://basescan.org/tx/${txHash}`;
  
  // Solana uses different URL format
  if (chainId === 101) {
    return `${explorer}/tx/${txHash}`;
  }
  
  return `${explorer}/tx/${txHash}`;
}

/**
 * Get chain name from chain ID
 */
export function getChainName(chainId: number): string {
  const names: Record<number, string> = {
    1: "Ethereum",
    8453: "Base",
    42161: "Arbitrum",
    10: "Optimism",
    137: "Polygon",
    56: "BNB Chain",
    43114: "Avalanche",
    101: "Solana",
    792703809: "Solana", // Relay's Solana chain ID
  };
  return names[chainId] || `Chain ${chainId}`;
}

/**
 * UA Transaction Status enum (from SDK)
 * FINISHED = 7 means completed successfully
 */
const UA_STATUS = {
  INITIALIZING: 0,
  DEPOSIT_LOCAL: 1,
  DEPOSIT_PENDING: 2,
  WAIT_TO_REFUND: 3,
  EXECUTION_LOCAL: 4,
  EXECUTION_PENDING: 5,
  EXECUTION_FAILED: 6,
  FINISHED: 7,
  REFUND_LOCAL: 8,
  REFUND_PENDING: 9,
  REFUND_FAILED: 10,
  REFUND_FINISHED: 11,
};

/**
 * Poll transaction details to get actual received amounts and tx hash
 * @param ua UniversalAccount instance
 * @param transactionId UA transaction ID
 * @param targetChainId The target chain for the swap (used as fallback)
 * @param maxAttempts Max polling attempts
 * @param delayMs Delay between attempts
 */
export async function pollTransactionDetails(
  ua: UniversalAccount,
  transactionId: string,
  targetChainId: number = 8453,
  maxAttempts: number = 20,
  delayMs: number = 2000
): Promise<{
  status: string;
  receivedAmount?: string;
  receivedToken?: string;
  txHash?: string;
  chainId?: number;
  explorerUrl?: string;
}> {
  console.log("[TxDetails] Starting poll for:", transactionId, "targetChain:", targetChainId);
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const details = await ua.getTransaction(transactionId);
      console.log("[TxDetails] Attempt", i + 1, "status:", details?.status, "Full:", JSON.stringify(details, null, 2));
      
      // Status is NUMERIC in UA SDK (7 = FINISHED, 6 = FAILED)
      const statusNum = typeof details?.status === 'number' ? details.status : -1;
      const isComplete = statusNum === UA_STATUS.FINISHED;
      const isFailed = statusNum === UA_STATUS.EXECUTION_FAILED || 
                       statusNum === UA_STATUS.REFUND_FAILED;
      
      if (isComplete) {
        // Try multiple field names for the target chain tx hash
        let txHash = 
          details.targetTxHash ||
          details.executionTxHash ||
          details.destinationTxHash || 
          details.txHash || 
          details.hash ||
          details.targetHash ||
          details.finalTxHash ||
          details.outputTxHash ||
          details.swapTxHash;
        
        // Check nested structures - execution might have the hash
        if (!txHash && details.execution) {
          txHash = details.execution.txHash || 
                   details.execution.hash || 
                   details.execution.targetTxHash ||
                   details.execution.transactionHash;
        }
        
        // Check output/destination nested object
        if (!txHash && details.output) {
          txHash = details.output.txHash || details.output.hash || details.output.transactionHash;
        }
        if (!txHash && details.destination) {
          txHash = details.destination.txHash || details.destination.hash || details.destination.transactionHash;
        }
        
        // Check transactions array - look for target chain first, then last tx
        if (!txHash && details.transactions && Array.isArray(details.transactions)) {
          // Try to find tx on target chain
          const targetTx = details.transactions.find((t: { chainId?: number }) => 
            t.chainId === targetChainId
          );
          // Or just use the last transaction (usually the output)
          const lastTx = details.transactions[details.transactions.length - 1];
          const useTx = targetTx || lastTx;
          txHash = useTx?.hash || useTx?.txHash || useTx?.transactionHash;
        }
        
        // Check steps array (for Relay-style responses)
        if (!txHash && details.steps && Array.isArray(details.steps)) {
          const lastStep = details.steps[details.steps.length - 1];
          txHash = lastStep?.txHash || lastStep?.hash || lastStep?.transactionHash;
          if (!txHash && lastStep?.items && Array.isArray(lastStep.items)) {
            const lastItem = lastStep.items[lastStep.items.length - 1];
            txHash = lastItem?.txHash || lastItem?.hash || lastItem?.transactionHash;
          }
        }
        
        // For Solana, check for signature field
        if (!txHash && (targetChainId === 101 || targetChainId === 792703809)) {
          txHash = details.signature || details.solanaSignature || details.solanaTxHash;
        }

        // LiFi/UA: lendingUserOperations or settlementUserOperations (target chain swap tx)
        if (!txHash) {
          const lendingOps = details.lendingUserOperations || [];
          const settlementOps = details.settlementUserOperations || [];
          const depositOps = details.depositUserOperations || [];
          const allOps = [...lendingOps, ...settlementOps, ...depositOps];
          const targetOp = allOps.find((o: { chainId?: number }) => o.chainId === targetChainId)
            || allOps[allOps.length - 1];
          if (targetOp?.txHash) {
            txHash = targetOp.txHash;
          }
        }
        
        // Determine chain ID - use target chain as fallback
        const chainId = 
          details.targetChainId ||
          details.execution?.chainId ||
          details.destinationChainId || 
          details.output?.chainId ||
          details.chainId || 
          targetChainId; // Use the provided target chain as fallback
        
        console.log("[TxDetails] FINISHED! txHash:", txHash, "chainId:", chainId);
        
        return {
          status: "completed",
          receivedAmount: details.receivedAmount || details.outputAmount || details.amountOut,
          receivedToken: details.receivedToken || details.outputToken || details.tokenOut,
          txHash,
          chainId,
          explorerUrl: txHash ? getExplorerTxUrl(chainId, txHash) : undefined,
        };
      }
      
      if (isFailed) {
        console.log("[TxDetails] FAILED:", details.error || details.reason);
        return { status: "failed" };
      }
      
      console.log("[TxDetails] Status:", statusNum, "- still pending...");
      
      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, delayMs));
    } catch (e) {
      console.error("[TxDetails] Error:", e);
      // Continue polling on error
    }
  }
  
  console.log("[TxDetails] Max attempts reached, returning pending");
  return { status: "pending" };
}

// Token type mapping for UA SDK
const TOKEN_TYPE = {
  ETH: SUPPORTED_TOKEN_TYPE?.ETH || "eth",
  USDC: SUPPORTED_TOKEN_TYPE?.USDC || "usdc",
  USDT: SUPPORTED_TOKEN_TYPE?.USDT || "usdt",
  SOL: SUPPORTED_TOKEN_TYPE?.SOL || "sol",
};

// ============ TYPES ============

interface SwapQuote {
  success: boolean;
  error?: string;
  inputAmount?: string;
  outputAmount?: string;
  inputAmountUsd?: number;
  outputAmountUsd?: number;
  rate?: number;
  priceImpact?: number;
  estimatedGas?: string;
  transaction?: {
    to: string;
    data: string;
    value: string;
  };
  allowanceTarget?: string;
  raw?: unknown;
}

interface SwapResult {
  success: boolean;
  error?: string;
  transactionId?: string;
  explorerUrl?: string;
  outputAmount?: string;
  // Runtime route metric
  route?: "0x" | "lifi" | "relay";
  fallbackUsed?: boolean;
  // For wallet signing flow
  transaction?: unknown;
  rootHash?: string;
  requiresSignature?: boolean;
}

interface SwapParams {
  ua: UniversalAccount;
  fromToken: "USDC" | "USDT" | "ETH";
  toTokenAddress: string;
  toTokenChainId: number;
  amountUsd: number;
  slippageBps?: number;
}

interface SellParams {
  ua: UniversalAccount;
  tokenAddress: string;
  tokenChainId: number;
  amountRaw: string; // Raw token amount (with decimals)
  amount?: string; // Human-readable token amount (preferred for UA createSellTransaction)
  tokenDecimals?: number;
  slippagePct?: number;
}

function normalizeSlippageBps(value?: number, fallback: number = 100): number {
  if (!Number.isFinite(value)) return fallback;
  const rounded = Math.round(value as number);
  return Math.max(MIN_SLIPPAGE_BPS, Math.min(MAX_SLIPPAGE_BPS, rounded));
}

/** Normalize slippage percent (0.1-10) to bps for Li.Fi/Relay. Clamps invalid values. */
function normalizeSlippagePct(value?: number, fallbackPct: number = 1): number {
  if (!Number.isFinite(value)) return normalizeSlippageBps(fallbackPct * 100, 100);
  const clamped = Math.max(0.1, Math.min(10, Number((value as number).toFixed(2))));
  return normalizeSlippageBps(Math.round(clamped * 100), 100);
}

function weiToEthString(wei: bigint): string {
  const base = BigInt("1000000000000000000");
  const int = wei / base;
  const frac = (wei % base).toString().padStart(18, "0").replace(/0+$/, "");
  return frac ? `${int.toString()}.${frac}` : int.toString();
}

type ZeroXQuoteRaw = {
  transaction?: { value?: string };
  totalNetworkFee?: string;
  fees?: {
    integratorFee?: { amount?: string };
    zeroExFee?: { amount?: string };
  };
  issues?: {
    balance?: { token?: string; expected?: string; actual?: string };
    allowance?: { actual?: string };
  };
};

function get0xRequiredNativeWei(raw: unknown): bigint {
  const q = (raw || {}) as ZeroXQuoteRaw;
  try {
    const balanceIssue = q.issues?.balance;
    const token = String(balanceIssue?.token || "").toLowerCase();
    if (token === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee") {
      const expected = BigInt(balanceIssue?.expected || "0");
      const actual = BigInt(balanceIssue?.actual || "0");
      if (expected > actual) return expected - actual;
      return expected;
    }
  } catch {
    // ignore and fallback below
  }

  const txValue = BigInt(q.transaction?.value || "0");
  const integratorFee = BigInt(q.fees?.integratorFee?.amount || "0");
  const zeroExFee = BigInt(q.fees?.zeroExFee?.amount || "0");
  const networkFee = BigInt(q.totalNetworkFee || "0");
  return txValue + integratorFee + zeroExFee + networkFee;
}

function shouldAddApproval(raw: unknown, sellAmount: string): boolean {
  const q = (raw || {}) as ZeroXQuoteRaw;
  try {
    const allowanceIssue = q.issues?.allowance;
    if (!allowanceIssue) return true;
    const actual = BigInt(allowanceIssue.actual || "0");
    const needed = BigInt(sellAmount || "0");
    return actual < needed;
  } catch {
    return true;
  }
}

// ============ LI.FI API FUNCTIONS ============

/**
 * Get Li.Fi swap quote (better CORS support for browsers)
 * Includes affiliate fee: 0.35% to AFFILIATE_FEE_RECIPIENT
 */
export async function getLifiSwapQuote(
  fromAddress: string,
  fromChainId: number,
  toChainId: number,
  fromToken: string,
  toToken: string,
  fromAmount: string,
  slippageBps: number = 100
): Promise<SwapQuote> {
  try {
    const safeSlippageBps = normalizeSlippageBps(slippageBps, 100);
    const slippage = safeSlippageBps / 10000;
    
    const url = new URL(`${LIFI_API_BASE}/quote`);
    url.searchParams.set("fromChain", String(fromChainId));
    url.searchParams.set("toChain", String(toChainId));
    url.searchParams.set("fromToken", fromToken);
    url.searchParams.set("toToken", toToken);
    url.searchParams.set("fromAmount", fromAmount);
    url.searchParams.set("fromAddress", fromAddress);
    url.searchParams.set("slippage", String(slippage));
    // Integrator + fee - wallet configured in Li.Fi dashboard
    url.searchParams.set("integrator", "Omni");
    url.searchParams.set("fee", "0.0025"); // 0.25% our fee

    console.log("[Li.Fi] Fetching quote:", url.toString());

    const response = await fetch(url.toString(), {
      headers: { 
        "Accept": "application/json",
      },
    });

    const data = await response.json();
    console.log("[Li.Fi] Response:", response.status, data);

    if (!response.ok) {
      return {
        success: false,
        error: data.message || data.error || `Li.Fi error: ${response.status}`,
      };
    }

    // Extract transaction data
    const txData = data.transactionRequest;
    if (!txData) {
      return { success: false, error: "No transaction data from Li.Fi" };
    }

    return {
      success: true,
      inputAmount: data.estimate?.fromAmount,
      outputAmount: data.estimate?.toAmount,
      rate: data.estimate?.toAmount && data.estimate?.fromAmount 
        ? parseFloat(data.estimate.toAmount) / parseFloat(data.estimate.fromAmount) 
        : undefined,
      transaction: {
        to: txData.to,
        data: txData.data,
        value: txData.value || "0",
      },
      allowanceTarget: data.estimate?.approvalAddress,
    };
  } catch (error) {
    console.error("[Li.Fi] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get Li.Fi quote",
    };
  }
}

// ============ 0x API FUNCTIONS (primary EVM venue) ============

/**
 * Convert USD notional to native sell amount by quoting USDC -> native on the same chain.
 */
async function getNativeSellAmountForUsd(
  takerAddress: string,
  chainId: number,
  amountUsd: number,
  slippageBps: number
): Promise<{ success: boolean; sellAmountWei?: string; error?: string }> {
  const usdc = USDC_ADDRESSES[chainId];
  if (!usdc) return { success: false, error: `USDC not configured for chain ${chainId}` };

  const usdcAmount = String(Math.floor(amountUsd * 1e6));
  if (Number(usdcAmount) <= 0) return { success: false, error: "Invalid USD amount" };

  const quote = await get0xSwapQuote(
    takerAddress,
    usdc,
    NATIVE_ETH,
    usdcAmount,
    chainId,
    slippageBps,
    takerAddress
  );

  if (!quote.success || !quote.outputAmount) {
    return { success: false, error: quote.error || "Failed to derive native amount" };
  }

  // Add small cushion to reduce under-sizing risk.
  let nativeWei = BigInt(quote.outputAmount);
  nativeWei = (nativeWei * BigInt(102) + BigInt(99)) / BigInt(100);
  return { success: true, sellAmountWei: nativeWei.toString() };
}

/**
 * Get 0x swap quote for EVM chains (via proxy worker)
 */
export async function get0xSwapQuote(
  takerAddress: string,
  sellToken: string, // Token address (or NATIVE_ETH for ETH)
  buyToken: string,
  sellAmount: string, // In base units (wei)
  chainId: number,
  slippageBps: number = 100, // 1%
  txOrigin?: string
): Promise<SwapQuote> {
  try {
    const slippagePercent = slippageBps / 10000;

    const url = new URL(`${ZEROX_PROXY_BASE}/0x/swap/allowance-holder/quote`);
    url.searchParams.set("sellToken", sellToken);
    url.searchParams.set("buyToken", buyToken);
    url.searchParams.set("sellAmount", sellAmount);
    url.searchParams.set("chainId", String(chainId));
    url.searchParams.set("taker", takerAddress);
    url.searchParams.set("txOrigin", txOrigin || takerAddress);
    url.searchParams.set("slippagePercentage", String(slippagePercent));
    url.searchParams.set("swapFeeRecipient", AFFILIATE_FEE_RECIPIENT);
    url.searchParams.set("swapFeeBps", String(AFFILIATE_FEE_BPS));

    // Prefer fee in sell token when possible; if selling native, use buy token.
    const feeToken = sellToken !== NATIVE_ETH ? sellToken : buyToken;
    if (feeToken !== NATIVE_ETH) {
      url.searchParams.set("swapFeeToken", feeToken);
    }

    console.log("[0x] Fetching quote via proxy:", url.toString());

    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
      },
    });

    const data = await response.json().catch(() => ({}));
    console.log("[0x] Response:", response.status, data);

    if (!response.ok) {
      // Check for specific errors
      if (data.code === "INSUFFICIENT_ASSET_LIQUIDITY" || data.reason?.includes("liquidity")) {
        return { success: false, error: "No liquidity for this token on 0x" };
      }
      if (response.status === 400) {
        return { success: false, error: data.reason || "Token not supported by 0x" };
      }
      return {
        success: false,
        error: data.reason || data.message || `0x API error: ${response.status}`,
      };
    }

    return {
      success: true,
      inputAmount: data.sellAmount,
      outputAmount: data.buyAmount,
      rate: data.buyAmount && data.sellAmount ? parseFloat(data.buyAmount) / parseFloat(data.sellAmount) : undefined,
      priceImpact: data.estimatedPriceImpact ? parseFloat(data.estimatedPriceImpact) : undefined,
      estimatedGas: data.gas,
      transaction: data.transaction,
      allowanceTarget: data.allowanceTarget,
      raw: data,
    };
  } catch (error) {
    console.error("[0x] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch quote",
    };
  }
}

// ============ RELAY API FUNCTIONS ============

/**
 * Get Relay quote for EVM → Solana cross-chain swap
 */
export async function getRelayQuote(
  evmAddress: string,
  solanaAddress: string,
  sourceChainId: number,
  destTokenMint: string,
  amountUsdc: string, // In USDC units (6 decimals)
  slippageBps: number = 500
): Promise<SwapQuote> {
  try {
    const sourceUsdcAddress = USDC_ADDRESSES[sourceChainId];
    if (!sourceUsdcAddress) {
      return { success: false, error: `USDC not supported on chain ${sourceChainId}` };
    }

    const requestBody = {
      user: evmAddress,
      originChainId: sourceChainId,
      destinationChainId: RELAY_CHAIN_IDS.SOLANA,
      originCurrency: sourceUsdcAddress,
      destinationCurrency: destTokenMint,
      recipient: solanaAddress,
      tradeType: "EXACT_INPUT",
      amount: amountUsdc,
      slippageTolerance: String(slippageBps),
      appFees: [
        {
          recipient: AFFILIATE_FEE_RECIPIENT,
          fee: String(AFFILIATE_FEE_BPS),
        },
      ],
    };

    const response = await fetch(`${RELAY_API_BASE}/quote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || data.error || `Relay API error: ${response.status}`,
      };
    }

    return {
      success: true,
      inputAmount: data.details?.currencyIn?.amountFormatted,
      outputAmount: data.details?.currencyOut?.amountFormatted,
      inputAmountUsd: parseFloat(data.details?.currencyIn?.amountUsd || "0"),
      outputAmountUsd: parseFloat(data.details?.currencyOut?.amountUsd || "0"),
      priceImpact: parseFloat(data.details?.totalImpact?.percent || "0"),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Prepare Relay swap transaction for UA
 */
export async function prepareRelaySwap(
  evmAddress: string,
  solanaAddress: string,
  sourceChainId: number,
  destTokenMint: string,
  amountUsdc: string,
  slippageBps: number = 500
): Promise<{
  success: boolean;
  error?: string;
  transactions?: Array<{ to: string; data: string; value: string }>;
  chainId?: number;
  inputAmount?: string;
  outputAmount?: string;
  requestId?: string;
}> {
  try {
    const sourceUsdcAddress = USDC_ADDRESSES[sourceChainId];
    if (!sourceUsdcAddress) {
      return { success: false, error: `USDC not supported on chain ${sourceChainId}` };
    }

    const requestBody = {
      user: evmAddress,
      originChainId: sourceChainId,
      destinationChainId: RELAY_CHAIN_IDS.SOLANA,
      originCurrency: sourceUsdcAddress,
      destinationCurrency: destTokenMint,
      recipient: solanaAddress,
      tradeType: "EXACT_INPUT",
      amount: amountUsdc,
      slippageTolerance: String(slippageBps),
      appFees: [
        {
          recipient: AFFILIATE_FEE_RECIPIENT,
          fee: String(AFFILIATE_FEE_BPS),
        },
      ],
    };

    const response = await fetch(`${RELAY_API_BASE}/quote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || data.error || `Relay API error: ${response.status}`,
      };
    }

    // Extract transaction steps
    const transactions: Array<{ to: string; data: string; value: string }> = [];
    
    for (const step of data.steps || []) {
      for (const item of step.items || []) {
        if (item.data?.to && item.data?.data) {
          transactions.push({
            to: item.data.to,
            data: item.data.data,
            value: item.data.value || "0",
          });
        }
      }
    }

    return {
      success: true,
      transactions,
      chainId: sourceChainId,
      inputAmount: data.details?.currencyIn?.amountFormatted,
      outputAmount: data.details?.currencyOut?.amountFormatted,
      requestId: data.requestId,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function prepareRelayRoute(params: {
  user: string;
  originChainId: number;
  destinationChainId: number;
  originCurrency: string;
  destinationCurrency: string;
  recipient: string;
  amount: string;
  slippageBps?: number;
}): Promise<{
  success: boolean;
  error?: string;
  transactions?: Array<{ to: string; data: string; value: string }>;
  requestId?: string;
  outputAmount?: string;
}> {
  try {
    const requestBody = {
      user: params.user,
      originChainId: params.originChainId,
      destinationChainId: params.destinationChainId,
      originCurrency: params.originCurrency,
      destinationCurrency: params.destinationCurrency,
      recipient: params.recipient,
      tradeType: "EXACT_INPUT",
      amount: params.amount,
      slippageTolerance: String(params.slippageBps ?? 500),
      appFees: [
        {
          recipient: AFFILIATE_FEE_RECIPIENT,
          fee: String(AFFILIATE_FEE_BPS),
        },
      ],
    };

    const response = await fetch(`${RELAY_API_BASE}/quote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();
    if (!response.ok) {
      return {
        success: false,
        error: data.message || data.error || `Relay API error: ${response.status}`,
      };
    }

    const transactions: Array<{ to: string; data: string; value: string }> = [];
    for (const step of data.steps || []) {
      for (const item of step.items || []) {
        if (item.data?.to && item.data?.data) {
          transactions.push({
            to: item.data.to,
            data: item.data.data,
            value: item.data.value || "0",
          });
        }
      }
    }

    return {
      success: true,
      transactions,
      requestId: data.requestId,
      outputAmount: data.details?.currencyOut?.amountFormatted,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ============ MAIN SWAP FUNCTION ============

/**
 * Execute swap using Universal Account
 * - EVM tokens: 0x primary on destination EVM chain; Li.Fi fallback
 * - Solana tokens: Relay.link (EVM → Solana cross-chain)
 */
export async function executeSwap(params: SwapParams): Promise<SwapResult> {
  const { ua, fromToken, toTokenAddress, toTokenChainId, amountUsd, slippageBps = 100 } = params;
  const safeSlippageBps = normalizeSlippageBps(slippageBps, 100);

  console.log("[Swap] Starting swap:", { fromToken, toTokenAddress, toTokenChainId, amountUsd });

  try {
    // Get smart account addresses
    let smartAccountOptions;
    try {
      smartAccountOptions = await ua.getSmartAccountOptions();
    } catch (e) {
      console.error("[Swap] Failed to get smart account:", e);
      return { success: false, error: "Failed to get wallet address" };
    }
    
    const evmSmartAccount = smartAccountOptions.smartAccountAddress;
    const solanaSmartAccount = smartAccountOptions.solanaSmartAccountAddress;

    console.log("[Swap] Smart accounts:", { evmSmartAccount, solanaSmartAccount });

    if (!evmSmartAccount) {
      return { success: false, error: "EVM smart account not available" };
    }

    // Determine if Solana swap (chain ID 101 or Solana Relay ID)
    const isSolanaSwap = toTokenChainId === 101 || toTokenChainId === RELAY_CHAIN_IDS.SOLANA;

    if (isSolanaSwap) {
      // ========== SOLANA SWAP VIA RELAY ==========
      if (!solanaSmartAccount) {
        return { success: false, error: "Solana smart account not available" };
      }

      // Convert USD to USDC units (6 decimals)
      const usdcAmount = String(Math.floor(amountUsd * 1e6));

      // Prepare Relay transaction
      const relayResult = await prepareRelaySwap(
        evmSmartAccount,
        solanaSmartAccount,
        RELAY_CHAIN_IDS.BASE, // Source from Base
        toTokenAddress,
        usdcAmount,
        safeSlippageBps
      );

      if (!relayResult.success || !relayResult.transactions) {
        return { success: false, error: relayResult.error || "Failed to prepare Relay swap" };
      }

      // Build UA transaction with expectTokens for balance aggregation
      const expectTokens = [
        {
          type: TOKEN_TYPE.USDC,
          tokenType: TOKEN_TYPE.USDC,
          amount: String(amountUsd),
          chainId: CHAIN_ID.BASE_MAINNET,
        },
      ];

      const uaTx = await ua.createUniversalTransaction({
        chainId: CHAIN_ID.BASE_MAINNET,
        transactions: relayResult.transactions,
        expectTokens,
      });

      if (!uaTx?.rootHash) {
        return { success: false, error: "Failed to create UA transaction" };
      }

      // Return transaction for signing by wallet
      return {
        success: true,
        transaction: uaTx,
        rootHash: uaTx.rootHash,
        outputAmount: relayResult.outputAmount,
        route: "relay",
        fallbackUsed: false,
        requiresSignature: true,
      };
    } else {
      // ========== EVM SWAP VIA LI.FI ==========
      console.log("[Swap] EVM swap via Li.Fi, chain:", toTokenChainId);
      
      // Execute on destination EVM chain (strict; no Base fallback)
      const sourceChainId = toTokenChainId;
      if (!USDC_ADDRESSES[sourceChainId]) {
        return { success: false, error: `Unsupported chain for swap: ${sourceChainId}` };
      }

      // OmniUA parity: default BUY funding from USDC on execution chain.
      // ETH funding can be enabled by explicitly passing fromToken="ETH".
      const useNativeFunding = fromToken === "ETH";
      const sellToken = useNativeFunding ? NATIVE_ETH : (USDC_ADDRESSES[sourceChainId] || NATIVE_ETH);

      let sellAmount: string;
      if (useNativeFunding) {
        const nativeSizing = await getNativeSellAmountForUsd(
          evmSmartAccount,
          sourceChainId,
          amountUsd,
          safeSlippageBps
        );
        if (!nativeSizing.success || !nativeSizing.sellAmountWei) {
          return { success: false, error: nativeSizing.error || "Failed to size native sell amount" };
        }
        sellAmount = nativeSizing.sellAmountWei;
      } else {
        // USDC has 6 decimals on EVM chains in this app context.
        const usdcRaw = Math.floor(Math.max(0, amountUsd) * 1e6);
        if (!Number.isFinite(usdcRaw) || usdcRaw <= 0) {
          return { success: false, error: "Invalid USDC sell amount" };
        }
        sellAmount = String(usdcRaw);
      }
      
      console.log("[Swap] Quote params:", { 
        sellToken, 
        buyToken: toTokenAddress, 
        sellAmount, 
        fromChain: sourceChainId,
        toChain: toTokenChainId 
      });

      // 0x first for EVM swaps on selected execution chain, Li.Fi fallback on failures
      let quote: SwapQuote;
      let quoteSource: "0x" | "lifi" = "0x";
      let fallbackUsed = false;

      // 0x is primary venue for EVM swaps on the chain where swap executes.
      quote = await get0xSwapQuote(
        evmSmartAccount,
        sellToken,
        toTokenAddress,
        sellAmount,
        sourceChainId,
        safeSlippageBps,
        evmSmartAccount
      );

      console.log("[Swap] 0x quote result:", quote);

      if (!quote.success || !quote.transaction) {
        console.warn("[Swap] 0x quote failed, falling back to Li.Fi", quote.error);
        quoteSource = "lifi";
        fallbackUsed = true;
        quote = await getLifiSwapQuote(
          evmSmartAccount,
          sourceChainId,
          toTokenChainId,
          sellToken,
          toTokenAddress,
          sellAmount,
          safeSlippageBps
        );
        console.log("[Swap] Li.Fi fallback quote result:", quote);
      }

      if (!quote.success) {
        if (quote.error?.includes("liquidity") || quote.error?.includes("No available")) {
          return { success: false, error: "No liquidity available for this token" };
        }
        return { success: false, error: quote.error || "Token not available for swap" };
      }

      if (!quote.transaction) {
        return { success: false, error: `No swap route found (${quoteSource})` };
      }

      // Build transactions array (approval + swap)
      const transactions: Array<{ to: string; data: string; value: string }> = [];

      // Add approval if needed (OmniUA parity: check 0x reported allowance issue)
      if (quote.allowanceTarget && sellToken !== NATIVE_ETH) {
        const needApproval = shouldAddApproval(quote.raw, sellAmount);
        if (needApproval) {
          const approveData = encodeApprove(quote.allowanceTarget, sellAmount);
          transactions.push({
            to: sellToken,
            data: approveData,
            value: "0",
          });
        }
      }

      // Add swap transaction
      transactions.push({
        to: quote.transaction.to,
        data: quote.transaction.data,
        value: quote.transaction.value || "0",
      });

      // Build expectTokens for UA balance aggregation (primary funding token first).
      const tokenType = fromToken === "ETH" ? TOKEN_TYPE.ETH : TOKEN_TYPE.USDC;
      const fundingAmount = tokenType === TOKEN_TYPE.USDC
        ? String(Math.floor(Math.max(0, amountUsd) * 1e6) / 1e6)
        : String(amountUsd);
      const expectTokens: Array<{ type: SUPPORTED_TOKEN_TYPE; tokenType?: SUPPORTED_TOKEN_TYPE; amount: string; chainId: number }> = [
        {
          type: tokenType,
          tokenType: tokenType,
          amount: fundingAmount,
          chainId: sourceChainId,
        },
      ];

      // OmniUA parity: if 0x indicates native balance requirement, size ETH expect token from quote.
      if (quoteSource === "0x") {
        const requiredWeiBase = get0xRequiredNativeWei(quote.raw);
        if (requiredWeiBase > BigInt(0)) {
          let requiredWei = (requiredWeiBase * BigInt(112) + BigInt(99)) / BigInt(100); // +12% cushion
          const roundUnit = BigInt("1000000000000");
          if (requiredWei % roundUnit !== BigInt(0)) {
            requiredWei = ((requiredWei / roundUnit) + BigInt(1)) * roundUnit;
          }
          const needEth = weiToEthString(requiredWei);
          if (needEth && needEth !== "0") {
            // Keep primary funding expectation (e.g. USDC) and add ETH only as supplemental requirement.
            expectTokens.push({
              type: TOKEN_TYPE.ETH,
              tokenType: TOKEN_TYPE.ETH,
              amount: needEth,
              chainId: sourceChainId,
            });
          }
        }
      }

      // Execute on the selected EVM source chain (target chain preferred).
      const uaChainId = sourceChainId as CHAIN_ID;

      console.log("[Swap] Creating UA transaction on chain:", uaChainId, "route:", quoteSource, "fallback:", fallbackUsed);

      // Create UA transaction
      const uaTx = await ua.createUniversalTransaction({
        chainId: uaChainId,
        transactions,
        expectTokens,
      });

      if (!uaTx?.rootHash) {
        return { success: false, error: "Failed to create UA transaction" };
      }

      // Return transaction for signing by wallet
      return {
        success: true,
        transaction: uaTx,
        rootHash: uaTx.rootHash,
        outputAmount: quote.outputAmount,
        route: quoteSource,
        fallbackUsed,
        requiresSignature: true,
      };
    }
  } catch (error) {
    console.error("[SwapService] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown swap error",
    };
  }
}

// ============ HELPERS ============

/**
 * Encode ERC20 approve function call
 */
function encodeApprove(spender: string, amount: string): string {
  // approve(address,uint256) selector: 0x095ea7b3
  const amountHex = BigInt(amount).toString(16).padStart(64, "0");
  const spenderPadded = spender.toLowerCase().replace("0x", "").padStart(64, "0");
  return `0x095ea7b3${spenderPadded}${amountHex}`;
}

/**
 * Get token chain ID from blockchain name
 */
export function getChainIdFromBlockchain(blockchain: string): number {
  const mapping: Record<string, number> = {
    ethereum: 1,
    base: 8453,
    arbitrum: 42161,
    optimism: 10,
    polygon: 137,
    bsc: 56,
    bnb: 56,
    avalanche: 43114,
    solana: 101,
  };
  return mapping[blockchain.toLowerCase()] || 0;
}

/**
 * Execute SELL via Li.Fi (EVM) for integrator fee revenue, or UA createSellTransaction (Solana fallback)
 */
export async function executeSell(params: SellParams): Promise<SwapResult> {
  const { ua, tokenAddress, tokenChainId, amountRaw, amount, tokenDecimals, slippagePct = 1 } = params;
  const safeSlippageBps = normalizeSlippagePct(slippagePct, 1);

  console.log("[Sell] Starting:", { tokenAddress, tokenChainId, amountRaw, tokenDecimals });

  try {
    const isSolana = tokenChainId === 101 || tokenChainId === RELAY_CHAIN_IDS.SOLANA;

    if (isSolana) {
      const chainIdForUa = CHAIN_ID.SOLANA_MAINNET;
      let amountForUa = amount;
      if (!amountForUa) {
        const decimals = tokenDecimals ?? 9;
        const base = BigInt(`1${"0".repeat(decimals)}`);
        const raw = BigInt(amountRaw || "0");
        const int = raw / base;
        const frac = (raw % base).toString().padStart(decimals, "0").replace(/0+$/, "");
        amountForUa = frac ? `${int.toString()}.${frac}` : int.toString();
      }
      const uaTx = await ua.createSellTransaction(
        { token: { chainId: chainIdForUa, address: tokenAddress }, amount: amountForUa },
        { slippageBps: safeSlippageBps }
      );
      if (!uaTx?.rootHash) return { success: false, error: "Failed to create UA sell transaction" };
      return {
        success: true,
        transaction: uaTx,
        rootHash: uaTx.rootHash,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        outputAmount: (uaTx as any)?.tokenChanges?.receivedTokens?.[0]?.amount,
        requiresSignature: true,
      };
    }

    // EVM: 0x primary, Li.Fi fallback
    const evmSmartAccount = (await ua.getSmartAccountOptions())?.smartAccountAddress;
    if (!evmSmartAccount) return { success: false, error: "EVM smart account not available" };

    const buyToken = USDC_ADDRESSES[tokenChainId];
    if (!buyToken) return { success: false, error: "USDC not available on this chain" };

    const sellAmount = amountRaw || "0";
    if (BigInt(sellAmount) <= BigInt(0)) return { success: false, error: "Invalid sell amount" };

    let route: "0x" | "lifi" = "0x";
    let fallbackUsed = false;

    console.log("[Sell] 0x quote:", { fromToken: tokenAddress, toToken: buyToken, sellAmount, chainId: tokenChainId });

    let quote = await get0xSwapQuote(
      evmSmartAccount,
      tokenAddress,
      buyToken,
      sellAmount,
      tokenChainId,
      safeSlippageBps,
      evmSmartAccount
    );

    if (!quote.success || !quote.transaction) {
      route = "lifi";
      fallbackUsed = true;
      console.warn("[Sell] 0x failed, using Li.Fi fallback", quote.error);
      quote = await getLifiSwapQuote(
        evmSmartAccount,
        tokenChainId,
        tokenChainId,
        tokenAddress,
        buyToken,
        sellAmount,
        safeSlippageBps
      );
    }

    if (!quote.success) {
      if (quote.error?.includes("liquidity") || quote.error?.includes("No available")) {
        return { success: false, error: "No liquidity available for this token" };
      }
      return { success: false, error: quote.error || "Token not available for swap" };
    }
    if (!quote.transaction) return { success: false, error: "No swap route found" };

    const transactions: Array<{ to: string; data: string; value: string }> = [];
    if (quote.allowanceTarget && tokenAddress !== NATIVE_ETH) {
      const needApproval = route === "0x" ? shouldAddApproval(quote.raw, sellAmount) : true;
      if (needApproval) {
        transactions.push({
          to: tokenAddress,
          data: encodeApprove(quote.allowanceTarget, sellAmount),
          value: "0",
        });
      }
    }
    transactions.push({
      to: quote.transaction.to,
      data: quote.transaction.data,
      value: quote.transaction.value || "0",
    });

    const expectTokens: Array<{ type: SUPPORTED_TOKEN_TYPE; tokenType?: SUPPORTED_TOKEN_TYPE; amount: string; chainId: number }> = [];
    // IMPORTANT: For ERC20 sells (token -> USDC), do NOT force ETH as a primary expectToken.
    // 0x fee hints can be conservative/noisy and may trigger false
    // "Insufficient primary token balance" despite having sell-token balance.
    // Keep sell path funded by sell token + normal gas handling only.
    // If native-token sell support is added here later, revisit this branch.


    const uaTx = await ua.createUniversalTransaction({
      chainId: tokenChainId,
      transactions,
      expectTokens,
    });

    if (!uaTx?.rootHash) return { success: false, error: "Failed to create UA transaction" };

    return {
      success: true,
      transaction: uaTx,
      rootHash: uaTx.rootHash,
      outputAmount: quote.outputAmount,
      route,
      fallbackUsed,
      requiresSignature: true,
    };
  } catch (error) {
    console.error("[Sell] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Sell failed",
    };
  }
}

export { RELAY_CHAIN_IDS, USDC_ADDRESSES, TOKEN_TYPE };
