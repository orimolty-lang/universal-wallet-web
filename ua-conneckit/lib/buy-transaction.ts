/**
 * createBuyTransaction - matches Particle 7702 example exactly.
 * Example: USDC Base → BNB BSC delegates both chains in one swap.
 */

import { CHAIN_ID, SUPPORTED_TOKEN_TYPE, type UniversalAccount } from "@particle-network/universal-account-sdk";

const NUMERIC_TO_UA_CHAIN_ID: Record<number, CHAIN_ID> = {
  1: CHAIN_ID.ETHEREUM_MAINNET,
  56: CHAIN_ID.BSC_MAINNET,
  137: CHAIN_ID.POLYGON_MAINNET,
  42161: CHAIN_ID.ARBITRUM_MAINNET_ONE,
  10: CHAIN_ID.OPTIMISM_MAINNET,
  8453: CHAIN_ID.BASE_MAINNET,
  43114: CHAIN_ID.AVALANCHE_MAINNET,
};

/** Wrapped native / primary token addresses per chain (for createBuyTransaction) */
const TOKEN_ADDRESSES: Record<string, Record<number, string>> = {
  eth: {
    1: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    10: "0x4200000000000000000000000000000000000006",
    56: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", // WBNB
    137: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
    42161: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
    8453: "0x4200000000000000000000000000000000000006",
    43114: "0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB",
  },
  usdc: {
    1: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    10: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
    56: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
    137: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
    42161: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    8453: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    43114: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
  },
  usdt: {
    1: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    10: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58",
    56: "0x55d398326f99059fF775485246999027B3197955",
    137: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
    42161: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
    8453: "0x0000000000000000000000000000000000000000", // no USDT on Base
    43114: "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7",
  },
  bnb: {
    56: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
  },
};

export interface CreateBuyTransactionParams {
  chainId: number;
  tokenType: SUPPORTED_TOKEN_TYPE;
  amountInUSD: string;
  universalAccount: UniversalAccount;
  usePrimaryTokens?: SUPPORTED_TOKEN_TYPE[];
}

export async function createBuyTransaction(params: CreateBuyTransactionParams) {
  const { chainId, tokenType, amountInUSD, universalAccount, usePrimaryTokens = [] } = params;
  const uaChainId = NUMERIC_TO_UA_CHAIN_ID[chainId];
  if (!uaChainId) {
    throw new Error(`Unsupported chain: ${chainId}`);
  }
  const key = tokenType.toLowerCase();
  const addrs = TOKEN_ADDRESSES[key];
  const tokenAddress = addrs?.[chainId];
  if (!tokenAddress || tokenAddress === "0x0000000000000000000000000000000000000000") {
    throw new Error(`Token ${tokenType} not supported on chain ${chainId}`);
  }
  const transaction = await universalAccount.createBuyTransaction(
    {
      token: { chainId: uaChainId, address: tokenAddress },
      amountInUSD,
    },
    { usePrimaryTokens }
  );
  return { transaction, description: `Buy $${amountInUSD} ${tokenType}` };
}
