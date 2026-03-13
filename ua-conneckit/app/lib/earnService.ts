/**
 * Earn service: Morpho vaults + Aave supply. Fetch from APIs, build tx for UA.
 * Uses createUniversalTransaction with expectTokens for unified balance routing.
 */

import { CHAIN_ID } from "@particle-network/universal-account-sdk";
import { encodeFunctionData, parseUnits } from "viem";
import { EARN_CHAINS } from "./earnConfig";

const CHAIN_ID_MAP: Record<number, number> = {
  1: CHAIN_ID.ETHEREUM_MAINNET,
  8453: CHAIN_ID.BASE_MAINNET,
  42161: CHAIN_ID.ARBITRUM_MAINNET_ONE,
  10: CHAIN_ID.OPTIMISM_MAINNET,
  137: CHAIN_ID.POLYGON_MAINNET,
  56: CHAIN_ID.BSC_MAINNET,
  43114: CHAIN_ID.AVALANCHE_MAINNET,
};

// ERC-20 approve
const ERC20_ABI = [
  {
    name: "approve",
    type: "function",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
] as const;

// ERC-4626 deposit (Morpho)
const ERC4626_ABI = [
  {
    name: "deposit",
    type: "function",
    inputs: [
      { name: "assets", type: "uint256" },
      { name: "receiver", type: "address" },
    ],
    outputs: [{ name: "shares", type: "uint256" }],
  },
] as const;

// Aave Pool supply
const AAVE_POOL_ABI = [
  {
    name: "supply",
    type: "function",
    inputs: [
      { name: "asset", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "onBehalfOf", type: "address" },
      { name: "referralCode", type: "uint16" },
    ],
    outputs: [],
  },
] as const;

export type EarnProtocol = "morpho" | "aave";

export interface EarnMarket {
  id: string;
  protocol: EarnProtocol;
  chainId: number;
  chainName: string;
  uaChainId: number;
  address: string;
  name: string;
  symbol: string;
  assetAddress: string;
  assetSymbol: string;
  assetDecimals: number;
  apy: number;
  tvl: number;
}

/**
 * Fetch Morpho vaults from API (primary source - full list).
 */
async function fetchMorphoVaults(): Promise<EarnMarket[]> {
  const out: EarnMarket[] = [];
  try {
    const res = await fetch("https://api.morpho.org/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `query { vaultV2s(first: 500, where: { chainId_in: [1, 8453, 42161, 10, 137], listed: true }) { items { address symbol name chain { id network } asset { address decimals symbol } supplyApy totalSupply } } }`,
      }),
      cache: "no-store",
    });
    const data = await res.json();
    const items = data?.data?.vaultV2s?.items ?? [];
    const chainIdToUa = getChainIdToUaMap();
    for (const item of items) {
      const chainId = parseInt(String(item.chain?.id ?? 0), 10);
      if (!chainId) continue;
      const asset = item.asset ?? {};
      out.push({
        id: `morpho-${chainId}-${(item.address ?? "").toLowerCase()}`,
        protocol: "morpho",
        chainId,
        chainName: item.chain?.network || `Chain ${chainId}`,
        uaChainId: chainIdToUa[chainId] ?? chainId,
        address: item.address ?? "",
        name: item.name || item.symbol || "Vault",
        symbol: item.symbol || "vault",
        assetAddress: asset.address ?? "",
        assetSymbol: asset.symbol || "USDC",
        assetDecimals: parseInt(String(asset.decimals ?? 6), 10),
        apy: parseFloat(item.supplyApy ?? 0) * 100,
        tvl: parseFloat(item.totalSupply ?? 0),
      });
    }
  } catch (err) {
    console.error("[Earn] Morpho API failed:", err);
  }
  return out;
}

/**
 * Build Aave supply markets from config.
 */
function buildAaveMarkets(): EarnMarket[] {
  const out: EarnMarket[] = [];
  const chainIdToUa = getChainIdToUaMap();
  const aaveMarkets: Array<{ chainId: number; pool: string; usdc: string; name: string }> = [
    { chainId: 1, pool: "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2", usdc: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", name: "Aave V3" },
    { chainId: 8453, pool: "0xA238Dd80C259a72e81d7e4664a9801593F98d1c5", usdc: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", name: "Aave V3 USDC" },
    { chainId: 42161, pool: "0x794a61358D6845594F94dc1DB02A252b5b4814aD", usdc: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", name: "Aave V3 USDC" },
    { chainId: 10, pool: "0x794a61358D6845594F94dc1DB02A252b5b4814aD", usdc: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85", name: "Aave V3 USDC" },
    { chainId: 137, pool: "0x794a61358D6845594F94dc1DB02A252b5b4814aD", usdc: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359", name: "Aave V3 USDC" },
    { chainId: 43114, pool: "0x794a61358D6845594F94dc1DB02A252b5b4814aD", usdc: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E", name: "Aave V3 USDC" },
  ];
  const chainNames: Record<number, string> = {
    1: "Ethereum", 8453: "Base", 42161: "Arbitrum", 10: "Optimism",
    137: "Polygon", 43114: "Avalanche",
  };
  for (const m of aaveMarkets) {
    out.push({
      id: `aave-${m.chainId}-usdc`,
      protocol: "aave",
      chainId: m.chainId,
      chainName: chainNames[m.chainId] || `Chain ${m.chainId}`,
      uaChainId: chainIdToUa[m.chainId] ?? m.chainId,
      address: m.pool,
      name: m.name,
      symbol: "aUSDC",
      assetAddress: m.usdc,
      assetSymbol: "USDC",
      assetDecimals: 6,
      apy: 0,
      tvl: 0,
    });
  }
  return out;
}

function getChainIdToUaMap(): Record<number, number> {
  return CHAIN_ID_MAP;
}

/**
 * Fetch all earn markets (Morpho + Aave).
 */
export async function fetchEarnMarkets(protocolFilter?: EarnProtocol): Promise<EarnMarket[]> {
  const [morpho, aave] = await Promise.all([fetchMorphoVaults(), Promise.resolve(buildAaveMarkets())]);
  let combined = [...morpho, ...aave];
  if (protocolFilter === "morpho") combined = morpho;
  else if (protocolFilter === "aave") combined = aave;
  return combined;
}

/**
 * Build Morpho deposit tx. Receiver = UA address (shares go to UA).
 */
export function buildMorphoDepositTx(
  market: EarnMarket,
  amountHuman: string,
  receiver: string
): { approve: `0x${string}`; deposit: `0x${string}` } {
  const amountWei = parseUnits(amountHuman, market.assetDecimals);
  const approve = encodeFunctionData({
    abi: ERC20_ABI,
    functionName: "approve",
    args: [market.address as `0x${string}`, amountWei],
  });
  const deposit = encodeFunctionData({
    abi: ERC4626_ABI,
    functionName: "deposit",
    args: [amountWei, receiver as `0x${string}`],
  });
  return { approve, deposit };
}

/**
 * Build Aave supply tx. onBehalfOf = UA address (aTokens go to UA).
 */
export function buildAaveSupplyTx(
  market: EarnMarket,
  amountHuman: string,
  onBehalfOf: string
): { approve: `0x${string}`; supply: `0x${string}` } {
  const amountWei = parseUnits(amountHuman, market.assetDecimals);
  const approve = encodeFunctionData({
    abi: ERC20_ABI,
    functionName: "approve",
    args: [market.address as `0x${string}`, amountWei],
  });
  const supply = encodeFunctionData({
    abi: AAVE_POOL_ABI,
    functionName: "supply",
    args: [
      market.assetAddress as `0x${string}`,
      amountWei,
      onBehalfOf as `0x${string}`,
      0,
    ],
  });
  return { approve, supply };
}

export { EARN_CHAINS };
