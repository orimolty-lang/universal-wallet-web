/**
 * Swap Service for Universal Wallet
 * - 0x API for EVM swaps
 * - Relay.link for EVM → Solana swaps
 */

import { UniversalAccount, CHAIN_ID, SUPPORTED_TOKEN_TYPE } from "@particle-network/universal-account-sdk";

// ============ CONSTANTS ============

// 0x API
const ZEROX_API_KEY = process.env.NEXT_PUBLIC_ZEROX_API_KEY || "5673a1cb-0778-485d-9523-b98ee680ab97";
const ZEROX_BASE_URL = "https://api.0x.org";

// Relay API (no key needed, rate limited)
const RELAY_API_BASE = "https://api.relay.link";

// Affiliate fee
const AFFILIATE_FEE_RECIPIENT = "0x8Ffb38d9E7D843B6AaC1599Df40f09fa152876eF";
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
};

// Native ETH placeholder
const NATIVE_ETH = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

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
}

interface SwapResult {
  success: boolean;
  error?: string;
  transactionId?: string;
  explorerUrl?: string;
  outputAmount?: string;
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

// ============ 0x API FUNCTIONS ============

/**
 * Get chain-specific 0x API URL
 */
function get0xApiUrl(chainId: number): string {
  const chainUrls: Record<number, string> = {
    1: "https://api.0x.org",
    8453: "https://base.api.0x.org",
    10: "https://optimism.api.0x.org",
    42161: "https://arbitrum.api.0x.org",
    137: "https://polygon.api.0x.org",
    56: "https://bsc.api.0x.org",
    43114: "https://avalanche.api.0x.org",
  };
  return chainUrls[chainId] || ZEROX_BASE_URL;
}

/**
 * Get 0x swap quote for EVM chains
 */
export async function get0xSwapQuote(
  takerAddress: string,
  sellToken: string, // Token address (or NATIVE_ETH for ETH)
  buyToken: string,
  sellAmount: string, // In base units (wei)
  chainId: number,
  slippageBps: number = 100 // 1%
): Promise<SwapQuote> {
  try {
    const baseUrl = get0xApiUrl(chainId);
    const slippagePercent = slippageBps / 10000;

    const url = new URL(`${baseUrl}/swap/allowance-holder/quote`);
    url.searchParams.set("sellToken", sellToken);
    url.searchParams.set("buyToken", buyToken);
    url.searchParams.set("sellAmount", sellAmount);
    url.searchParams.set("chainId", String(chainId));
    url.searchParams.set("taker", takerAddress);
    url.searchParams.set("slippagePercentage", String(slippagePercent));
    url.searchParams.set("swapFeeRecipient", AFFILIATE_FEE_RECIPIENT);
    url.searchParams.set("swapFeeBps", String(AFFILIATE_FEE_BPS));
    url.searchParams.set("swapFeeToken", buyToken);

    const response = await fetch(url.toString(), {
      headers: {
        "0x-api-key": ZEROX_API_KEY,
        "0x-version": "v2",
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.reason || `0x API error: ${response.status}`,
      };
    }

    const data = await response.json();

    return {
      success: true,
      inputAmount: data.sellAmount,
      outputAmount: data.buyAmount,
      rate: data.buyAmount && data.sellAmount ? parseFloat(data.buyAmount) / parseFloat(data.sellAmount) : undefined,
      priceImpact: data.estimatedPriceImpact ? parseFloat(data.estimatedPriceImpact) : undefined,
      estimatedGas: data.gas,
      transaction: data.transaction,
      allowanceTarget: data.allowanceTarget,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
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

// ============ MAIN SWAP FUNCTION ============

/**
 * Execute swap using Universal Account
 * - EVM tokens: Use 0x API
 * - Solana tokens: Use Relay.link (EVM → Solana cross-chain)
 */
export async function executeSwap(params: SwapParams): Promise<SwapResult> {
  const { ua, fromToken, toTokenAddress, toTokenChainId, amountUsd, slippageBps = 100 } = params;

  try {
    // Get smart account addresses
    const smartAccountOptions = await ua.getSmartAccountOptions();
    const evmSmartAccount = smartAccountOptions.smartAccountAddress;
    const solanaSmartAccount = smartAccountOptions.solanaSmartAccountAddress;

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
        slippageBps
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
        requiresSignature: true,
      };
    } else {
      // ========== EVM SWAP VIA 0x ==========
      
      // Determine sell token (USDC/USDT on same chain, or cross-chain via UA)
      const sellToken = fromToken === "ETH" 
        ? NATIVE_ETH 
        : USDC_ADDRESSES[toTokenChainId] || USDC_ADDRESSES[RELAY_CHAIN_IDS.BASE];

      // Convert USD to token units
      const sellDecimals = fromToken === "ETH" ? 18 : 6;
      const sellAmount = fromToken === "ETH"
        ? String(BigInt(Math.floor(amountUsd * 1e18 / 3000))) // Rough ETH estimate at $3000
        : String(Math.floor(amountUsd * Math.pow(10, sellDecimals)));

      // Get 0x quote
      const quote = await get0xSwapQuote(
        evmSmartAccount,
        sellToken,
        toTokenAddress,
        sellAmount,
        toTokenChainId,
        slippageBps
      );

      if (!quote.success || !quote.transaction) {
        return { success: false, error: quote.error || "Failed to get 0x quote" };
      }

      // Build transactions array (approval + swap)
      const transactions: Array<{ to: string; data: string; value: string }> = [];

      // Add approval if needed (for ERC20, not native ETH)
      if (quote.allowanceTarget && sellToken !== NATIVE_ETH) {
        const approveData = encodeApprove(quote.allowanceTarget, sellAmount);
        transactions.push({
          to: sellToken,
          data: approveData,
          value: "0",
        });
      }

      // Add swap transaction
      transactions.push({
        to: quote.transaction.to,
        data: quote.transaction.data,
        value: quote.transaction.value || sellAmount,
      });

      // Build expectTokens for UA balance aggregation
      const tokenType = fromToken === "ETH" ? TOKEN_TYPE.ETH : TOKEN_TYPE.USDC;
      const expectTokens = [
        {
          type: tokenType,
          tokenType: tokenType,
          amount: String(amountUsd),
          chainId: toTokenChainId,
        },
      ];

      // Map to UA chain ID
      let uaChainId = toTokenChainId;
      if (toTokenChainId === 8453) uaChainId = CHAIN_ID.BASE_MAINNET;
      if (toTokenChainId === 1) uaChainId = CHAIN_ID.ETHEREUM_MAINNET;
      if (toTokenChainId === 42161) uaChainId = CHAIN_ID.ARBITRUM_MAINNET_ONE;
      if (toTokenChainId === 10) uaChainId = CHAIN_ID.OPTIMISM_MAINNET;
      if (toTokenChainId === 137) uaChainId = CHAIN_ID.POLYGON_MAINNET;

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
  return mapping[blockchain.toLowerCase()] || 8453; // Default to Base
}

export { RELAY_CHAIN_IDS, USDC_ADDRESSES, TOKEN_TYPE };
