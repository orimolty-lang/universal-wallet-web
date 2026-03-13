/**
 * Earn feature config: Morpho vaults and Aave markets per UA-supported chain.
 * Chains align with lib/chains.ts (Ethereum, Base, Arbitrum, Optimism, Polygon, Avalanche, BNB).
 */

import { CHAIN_ID } from "@particle-network/universal-account-sdk";

export interface EarnChainConfig {
  chainId: number;
  uaChainId: number;
  name: string;
  morphoVaults: Array<{
    address: string;
    name: string;
    symbol: string;
    assetAddress: string;
    assetSymbol: string;
    assetDecimals: number;
  }>;
  aavePool?: string;
  usdcAddress: string;
}

// UA-supported EVM chains with Morpho/Aave deployments
export const EARN_CHAINS: EarnChainConfig[] = [
  {
    chainId: 1,
    uaChainId: CHAIN_ID.ETHEREUM_MAINNET,
    name: "Ethereum",
    usdcAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    morphoVaults: [
      {
        address: "0x603CDEAEC82A60E3C4A10dA6ab546459E5f64Fa0",
        name: "Origin USDC",
        symbol: "oUSDC",
        assetAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        assetSymbol: "USDC",
        assetDecimals: 6,
      },
    ],
    aavePool: "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2",
  },
  {
    chainId: 8453,
    uaChainId: CHAIN_ID.BASE_MAINNET,
    name: "Base",
    usdcAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    morphoVaults: [
      {
        address: "0xc1256Ae5FF1cf2719D4937adb3bbCCab2E00A2Ca",
        name: "Moonwell USDC",
        symbol: "mwUSDC",
        assetAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        assetSymbol: "USDC",
        assetDecimals: 6,
      },
    ],
    aavePool: "0xA238Dd80C259a72e81d7e4664a9801593F98d1c5",
  },
  {
    chainId: 42161,
    uaChainId: CHAIN_ID.ARBITRUM_MAINNET_ONE,
    name: "Arbitrum",
    usdcAddress: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    morphoVaults: [],
    aavePool: "0x794a61358D6845594F94dc1DB02A252b5b4814aD",
  },
  {
    chainId: 10,
    uaChainId: CHAIN_ID.OPTIMISM_MAINNET,
    name: "Optimism",
    usdcAddress: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
    morphoVaults: [],
    aavePool: "0x794a61358D6845594F94dc1DB02A252b5b4814aD",
  },
  {
    chainId: 137,
    uaChainId: CHAIN_ID.POLYGON_MAINNET,
    name: "Polygon",
    usdcAddress: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
    morphoVaults: [],
    aavePool: "0x794a61358D6845594F94dc1DB02A252b5b4814aD",
  },
  {
    chainId: 43114,
    uaChainId: CHAIN_ID.AVALANCHE_MAINNET,
    name: "Avalanche",
    usdcAddress: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
    morphoVaults: [],
    aavePool: "0x794a61358D6845594F94dc1DB02A252b5b4814aD",
  },
  {
    chainId: 56,
    uaChainId: CHAIN_ID.BSC_MAINNET,
    name: "BNB Chain",
    usdcAddress: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
    morphoVaults: [],
  },
];

export function getEarnChainByChainId(chainId: number): EarnChainConfig | undefined {
  return EARN_CHAINS.find((c) => c.chainId === chainId);
}

export function getEarnChainByUaChainId(uaChainId: number): EarnChainConfig | undefined {
  return EARN_CHAINS.find((c) => c.uaChainId === uaChainId);
}
