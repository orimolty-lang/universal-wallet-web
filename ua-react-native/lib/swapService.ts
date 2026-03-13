import {
  UniversalAccount,
  CHAIN_ID,
  SUPPORTED_TOKEN_TYPE,
} from "@particle-network/universal-account-sdk";

const LIFI_API_BASE =
  "https://lifi-proxy.orimolty.workers.dev/lifi/v1";

const USDC_ADDRESSES: Record<number, string> = {
  8453: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
  1: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
  42161: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
  10: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
  137: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
};

const CHAIN_EXPLORERS: Record<number, string> = {
  1: "https://etherscan.io",
  8453: "https://basescan.org",
  42161: "https://arbiscan.io",
  10: "https://optimistic.etherscan.io",
  137: "https://polygonscan.com",
  56: "https://bscscan.com",
  43114: "https://snowtrace.io",
  101: "https://solscan.io",
};

const MIN_SLIPPAGE_BPS = 1;
const MAX_SLIPPAGE_BPS = 5000;

const TOKEN_TYPE = {
  ETH: SUPPORTED_TOKEN_TYPE?.ETH || "eth",
  USDC: SUPPORTED_TOKEN_TYPE?.USDC || "usdc",
  USDT: SUPPORTED_TOKEN_TYPE?.USDT || "usdt",
  SOL: SUPPORTED_TOKEN_TYPE?.SOL || "sol",
};

// ============ TYPES ============

export interface SwapQuote {
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
}

export interface SwapResult {
  success: boolean;
  error?: string;
  transactionId?: string;
  explorerUrl?: string;
  outputAmount?: string;
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
  amountRaw: string;
  slippagePct?: number;
}

// ============ HELPERS ============

function normalizeSlippageBps(
  value?: number,
  fallback: number = 100
): number {
  if (!Number.isFinite(value)) return fallback;
  const rounded = Math.round(value as number);
  return Math.max(MIN_SLIPPAGE_BPS, Math.min(MAX_SLIPPAGE_BPS, rounded));
}

function normalizeSlippagePct(
  value?: number,
  fallbackPct: number = 1
): number {
  if (!Number.isFinite(value)) return normalizeSlippageBps(fallbackPct * 100, 100);
  const clamped = Math.max(0.1, Math.min(10, Number((value as number).toFixed(2))));
  return normalizeSlippageBps(Math.round(clamped * 100), 100);
}

function encodeApprove(spender: string, amount: string): string {
  const amountHex = BigInt(amount).toString(16).padStart(64, "0");
  const spenderPadded = spender
    .toLowerCase()
    .replace("0x", "")
    .padStart(64, "0");
  return `0x095ea7b3${spenderPadded}${amountHex}`;
}

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
  return mapping[blockchain.toLowerCase()] || 8453;
}

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
    792703809: "Solana",
  };
  return names[chainId] || `Chain ${chainId}`;
}

export function getExplorerTxUrl(
  chainId: number,
  txHash: string
): string {
  const explorer = CHAIN_EXPLORERS[chainId];
  if (!explorer) return `https://basescan.org/tx/${txHash}`;
  return `${explorer}/tx/${txHash}`;
}

// ============ LI.FI API ============

export async function getLiFiQuote(
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

    const params = new URLSearchParams({
      fromChain: String(fromChainId),
      toChain: String(toChainId),
      fromToken,
      toToken,
      fromAmount,
      fromAddress,
      slippage: String(slippage),
      integrator: "Omni",
      fee: "0.0025",
    });

    const url = `${LIFI_API_BASE}/quote?${params.toString()}`;
    console.log("[Li.Fi] Fetching quote:", url);

    const response = await fetch(url, {
      headers: { Accept: "application/json" },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error:
          data.message ||
          data.error ||
          `Li.Fi error: ${response.status}`,
      };
    }

    const txData = data.transactionRequest;
    if (!txData) {
      return { success: false, error: "No transaction data from Li.Fi" };
    }

    return {
      success: true,
      inputAmount: data.estimate?.fromAmount,
      outputAmount: data.estimate?.toAmount,
      rate:
        data.estimate?.toAmount && data.estimate?.fromAmount
          ? parseFloat(data.estimate.toAmount) /
            parseFloat(data.estimate.fromAmount)
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
      error:
        error instanceof Error
          ? error.message
          : "Failed to get Li.Fi quote",
    };
  }
}

// ============ BUILD SWAP TRANSACTION ============

export function buildSwapTransaction(
  quote: SwapQuote,
  sellToken: string,
  sellAmount: string
): Array<{ to: string; data: string; value: string }> {
  const transactions: Array<{ to: string; data: string; value: string }> = [];

  if (quote.allowanceTarget) {
    const approveData = encodeApprove(
      quote.allowanceTarget,
      sellAmount
    );
    transactions.push({
      to: sellToken,
      data: approveData,
      value: "0",
    });
  }

  if (quote.transaction) {
    transactions.push({
      to: quote.transaction.to,
      data: quote.transaction.data,
      value: quote.transaction.value || "0",
    });
  }

  return transactions;
}

// ============ MAIN SWAP FUNCTION ============

export async function executeSwap(
  params: SwapParams
): Promise<SwapResult> {
  const {
    ua,
    fromToken,
    toTokenAddress,
    toTokenChainId,
    amountUsd,
    slippageBps = 100,
  } = params;
  const safeSlippageBps = normalizeSlippageBps(slippageBps, 100);

  try {
    let smartAccountOptions;
    try {
      smartAccountOptions = await ua.getSmartAccountOptions();
    } catch (e) {
      console.error("[Swap] Failed to get smart account:", e);
      return { success: false, error: "Failed to get wallet address" };
    }

    const evmSmartAccount = smartAccountOptions.smartAccountAddress;
    if (!evmSmartAccount) {
      return {
        success: false,
        error: "EVM smart account not available",
      };
    }

    const sourceChainId = 8453; // Base
    const sellToken = USDC_ADDRESSES[sourceChainId];
    if (!sellToken) {
      return { success: false, error: "USDC not available" };
    }

    const sellAmount = String(Math.floor(amountUsd * 1e6));

    const quote = await getLiFiQuote(
      evmSmartAccount,
      sourceChainId,
      toTokenChainId,
      sellToken,
      toTokenAddress,
      sellAmount,
      safeSlippageBps
    );

    if (!quote.success || !quote.transaction) {
      if (
        quote.error?.includes("liquidity") ||
        quote.error?.includes("No available")
      ) {
        return {
          success: false,
          error: "No liquidity available for this token",
        };
      }
      return {
        success: false,
        error: quote.error || "No swap route found",
      };
    }

    const transactions = buildSwapTransaction(
      quote,
      sellToken,
      sellAmount
    );

    const tokenType =
      fromToken === "ETH" ? TOKEN_TYPE.ETH : TOKEN_TYPE.USDC;
    const expectTokens = [
      {
        type: tokenType,
        tokenType: tokenType,
        amount: String(amountUsd),
        chainId: toTokenChainId,
      },
    ];

    const uaChainId = CHAIN_ID.BASE_MAINNET;

    const uaTx = await ua.createUniversalTransaction({
      chainId: uaChainId,
      transactions,
      expectTokens,
    });

    if (!(uaTx as any)?.rootHash) {
      return {
        success: false,
        error: "Failed to create UA transaction",
      };
    }

    return {
      success: true,
      transaction: uaTx,
      rootHash: (uaTx as any).rootHash,
      outputAmount: quote.outputAmount,
      requiresSignature: true,
    };
  } catch (error) {
    console.error("[SwapService] Error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Unknown swap error",
    };
  }
}

// ============ SELL FUNCTION ============

export async function executeSell(
  params: SellParams
): Promise<SwapResult> {
  const {
    ua,
    tokenAddress,
    tokenChainId,
    amountRaw,
    slippagePct = 1,
  } = params;
  const safeSlippageBps = normalizeSlippagePct(slippagePct, 1);

  try {
    const smartAccountOptions = await ua.getSmartAccountOptions();
    const evmSmartAccount = smartAccountOptions.smartAccountAddress;

    if (!evmSmartAccount) {
      return {
        success: false,
        error: "EVM smart account not available",
      };
    }

    const usdcAddress =
      USDC_ADDRESSES[tokenChainId] || USDC_ADDRESSES[8453];
    if (!usdcAddress) {
      return {
        success: false,
        error: "USDC not available on this chain",
      };
    }

    const quote = await getLiFiQuote(
      evmSmartAccount,
      tokenChainId,
      tokenChainId,
      tokenAddress,
      usdcAddress,
      amountRaw,
      safeSlippageBps
    );

    if (!quote.success || !quote.transaction) {
      return {
        success: false,
        error: quote.error || "Failed to get sell quote",
      };
    }

    const transactions = buildSwapTransaction(
      quote,
      tokenAddress,
      amountRaw
    );

    let uaChainId = tokenChainId;
    if (tokenChainId === 8453) uaChainId = CHAIN_ID.BASE_MAINNET;
    if (tokenChainId === 1) uaChainId = CHAIN_ID.ETHEREUM_MAINNET;
    if (tokenChainId === 42161)
      uaChainId = CHAIN_ID.ARBITRUM_MAINNET_ONE;

    const uaTx = await ua.createUniversalTransaction({
      chainId: uaChainId,
      transactions,
      expectTokens: [],
    });

    if (!(uaTx as any)?.rootHash) {
      return {
        success: false,
        error: "Failed to create UA transaction",
      };
    }

    return {
      success: true,
      transaction: uaTx,
      rootHash: (uaTx as any).rootHash,
      outputAmount: quote.outputAmount,
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
  const UA_STATUS_FINISHED = 7;
  const UA_STATUS_EXECUTION_FAILED = 6;
  const UA_STATUS_REFUND_FAILED = 10;

  for (let i = 0; i < maxAttempts; i++) {
    try {
      const details: any = await ua.getTransaction(transactionId);
      const statusNum =
        typeof details?.status === "number" ? details.status : -1;
      const isComplete = statusNum === UA_STATUS_FINISHED;
      const isFailed =
        statusNum === UA_STATUS_EXECUTION_FAILED ||
        statusNum === UA_STATUS_REFUND_FAILED;

      if (isComplete) {
        let txHash =
          details.targetTxHash ||
          details.executionTxHash ||
          details.destinationTxHash ||
          details.txHash ||
          details.hash;

        if (!txHash && details.execution) {
          txHash =
            details.execution.txHash ||
            details.execution.hash ||
            details.execution.transactionHash;
        }

        if (
          !txHash &&
          details.transactions &&
          Array.isArray(details.transactions)
        ) {
          const targetTx = details.transactions.find(
            (t: any) => t.chainId === targetChainId
          );
          const lastTx =
            details.transactions[details.transactions.length - 1];
          const useTx = targetTx || lastTx;
          txHash =
            useTx?.hash || useTx?.txHash || useTx?.transactionHash;
        }

        const chainId =
          details.targetChainId ||
          details.execution?.chainId ||
          details.destinationChainId ||
          details.chainId ||
          targetChainId;

        return {
          status: "completed",
          receivedAmount:
            details.receivedAmount ||
            details.outputAmount ||
            details.amountOut,
          receivedToken:
            details.receivedToken ||
            details.outputToken ||
            details.tokenOut,
          txHash,
          chainId,
          explorerUrl: txHash
            ? getExplorerTxUrl(chainId, txHash)
            : undefined,
        };
      }

      if (isFailed) {
        return { status: "failed" };
      }

      await new Promise((resolve) => setTimeout(resolve, delayMs));
    } catch (e) {
      console.error("[TxDetails] Error:", e);
    }
  }

  return { status: "pending" };
}

export { USDC_ADDRESSES, TOKEN_TYPE };
