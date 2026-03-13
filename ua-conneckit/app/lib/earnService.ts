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
  {
    name: "redeem",
    type: "function",
    inputs: [
      { name: "shares", type: "uint256" },
      { name: "receiver", type: "address" },
      { name: "owner", type: "address" },
    ],
    outputs: [{ name: "assets", type: "uint256" }],
  },
  {
    name: "balanceOf",
    type: "function",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }],
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
 * Fetch Morpho vaults from API. Fallback to config if API fails.
 */
async function fetchMorphoVaults(): Promise<EarnMarket[]> {
  const chainIdToUa = getChainIdToUaMap();
  const chainNames: Record<number, string> = {
    1: "Ethereum", 8453: "Base", 42161: "Arbitrum", 10: "Optimism", 137: "Polygon",
  };

  const out: EarnMarket[] = [];
  try {
    const res = await fetch("https://api.morpho.org/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `query { vaultV2s(first: 200, where: { chainId_in: [1, 8453, 42161, 10, 137] }) { items { address symbol name chain { id network } asset { address decimals symbol } avgApy avgNetApy totalSupply totalAssets } } }`,
      }),
      cache: "no-store",
    });
    const data = await res.json();
    const raw = data?.data?.vaultV2s;
    const items = Array.isArray(raw) ? raw : (raw?.items ?? []);
    for (const item of items) {
      const chainId = parseInt(String(item.chain?.id ?? 0), 10);
      if (!chainId) continue;
      const asset = item.asset ?? {};
      const decimals = parseInt(String(asset.decimals ?? 6), 10);
      const rawAssets = parseFloat(item.totalAssets ?? 0);
      const rawSupply = parseFloat(item.totalSupply ?? 0);
      const rawTvl = rawAssets > 0 ? rawAssets : rawSupply;
      let tvlUsd = rawTvl / Math.pow(10, decimals);
      if (tvlUsd > 1e12 || tvlUsd < 0) tvlUsd = 0;
      const apyRaw = parseFloat(item.avgNetApy ?? item.avgApy ?? 0);
      const apy = apyRaw <= 1 && apyRaw > 0 ? apyRaw * 100 : apyRaw;
      const name = item.name || item.symbol || "";
      const isTestOrGeneric = !name || /test/i.test(name) || /^vault$/i.test(name) || /^v\d*$/i.test(name);
      const hasData = apy > 0 || tvlUsd > 0;
      if (isTestOrGeneric || !hasData) continue;
      out.push({
        id: `morpho-${chainId}-${(item.address ?? "").toLowerCase()}`,
        protocol: "morpho",
        chainId,
        chainName: item.chain?.network || chainNames[chainId] || `Chain ${chainId}`,
        uaChainId: chainIdToUa[chainId] ?? chainId,
        address: item.address ?? "",
        name: name || item.symbol || "Vault",
        symbol: item.symbol || "vault",
        assetAddress: asset.address ?? "",
        assetSymbol: (asset.symbol || "USDC").toUpperCase(),
        assetDecimals: parseInt(String(asset.decimals ?? 6), 10),
        apy,
        tvl: tvlUsd,
      });
    }
    if (out.length > 0) return out;
  } catch (err) {
    console.error("[Earn] Morpho API failed:", err);
  }

  // Fallback: config vaults
  for (const chain of EARN_CHAINS) {
    for (const v of chain.morphoVaults) {
      out.push({
        id: `morpho-${chain.chainId}-${v.address.toLowerCase()}`,
        protocol: "morpho",
        chainId: chain.chainId,
        chainName: chain.name,
        uaChainId: chain.uaChainId,
        address: v.address,
        name: v.name,
        symbol: v.symbol,
        assetAddress: v.assetAddress,
        assetSymbol: v.assetSymbol,
        assetDecimals: v.assetDecimals,
        apy: 0,
        tvl: 0,
      });
    }
  }
  return out;
}

const AAVE_NETWORK_TO_CHAIN_ID: Record<string, number> = {
  ethereum: 1,
  base: 8453,
  arbitrum: 42161,
  optimism: 10,
  polygon: 137,
  avalanche: 43114,
  bnb: 56,
};

/**
 * Fetch Aave USDC supply APY from aave-v3-data (free, no key).
 */
async function fetchAaveUsdcApy(): Promise<Record<number, number>> {
  const out: Record<number, number> = {};
  try {
    const res = await fetch("https://th3nolo.github.io/aave-v3-data/aave_v3_data.json", {
      cache: "no-store",
    });
    const data = await res.json();
    const networks = data?.networks ?? {};
    for (const [netName, reserves] of Object.entries(networks)) {
      if (!Array.isArray(reserves)) continue;
      const usdc = reserves.find(
        (r: { symbol?: string }) => (r?.symbol || "").toUpperCase() === "USDC"
      );
      if (!usdc?.current_liquidity_rate) continue;
      const chainId = AAVE_NETWORK_TO_CHAIN_ID[netName.toLowerCase()];
      if (chainId) out[chainId] = parseFloat(String(usdc.current_liquidity_rate)) * 100;
    }
  } catch (err) {
    console.error("[Earn] Aave APY fetch failed:", err);
  }
  return out;
}

/**
 * Build Aave supply markets from config. Enriches with APY from aave-v3-data.
 */
async function buildAaveMarkets(): Promise<EarnMarket[]> {
  const [aaveApy] = await Promise.all([fetchAaveUsdcApy()]);
  const out: EarnMarket[] = [];
  const chainIdToUa = getChainIdToUaMap();
  const aaveMarkets: Array<{ chainId: number; pool: string; usdc: string; name: string }> = [
    { chainId: 1, pool: "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2", usdc: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", name: "Aave V3 USDC" },
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
      apy: aaveApy[m.chainId] ?? 0,
      tvl: 0,
    });
  }
  return out;
}

function getChainIdToUaMap(): Record<number, number> {
  return CHAIN_ID_MAP;
}

/**
 * Fetch all earn markets (Morpho + Aave). Sorted by TVL descending.
 */
export async function fetchEarnMarkets(): Promise<EarnMarket[]> {
  const [morpho, aave] = await Promise.all([fetchMorphoVaults(), buildAaveMarkets()]);
  const combined = [...morpho, ...aave];
  combined.sort((a, b) => (b.tvl || 0) - (a.tvl || 0));
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
 * Build Morpho redeem tx. Redeems shares for assets to owner (UA).
 */
export function buildMorphoRedeemTx(
  market: EarnMarket,
  sharesWei: bigint,
  owner: string
): { redeem: `0x${string}` } {
  const redeem = encodeFunctionData({
    abi: ERC4626_ABI,
    functionName: "redeem",
    args: [sharesWei, owner as `0x${string}`, owner as `0x${string}`],
  });
  return { redeem };
}

export interface EarnPosition {
  market: EarnMarket;
  sharesRaw: bigint;
  assetsApprox: number;
}

const MORPHO_GRAPHQL = "https://api.morpho.org/graphql";
const USER_POSITIONS_QUERY = `query UserVaultPositions($address: String!, $chainId: Int!) {
  userByAddress(address: $address, chainId: $chainId) {
    vaultPositions {
      vault { address name chain { id network } asset { address symbol decimals } }
      state { shares assets }
    }
    vaultV2Positions {
      vault { address name chain { id network } asset { address symbol decimals } }
      shares assets assetsUsd
    }
  }
}`;

const CHAIN_IDS = [1, 8453, 42161, 10, 137];
const chainNames: Record<number, string> = {
  1: "Ethereum", 8453: "Base", 42161: "Arbitrum", 10: "Optimism", 137: "Polygon",
};

/**
 * Fetch user's positions via Morpho GraphQL API.
 * Uses userByAddress (vaultPositions + vaultV2Positions) per docs.morpho.org.
 * Queries all supported chains in parallel.
 */
export async function fetchUserPositions(uaAddress: string): Promise<EarnPosition[]> {
  const chainIdToUa = getChainIdToUaMap();
  const seen = new Set<string>();
  const positions: EarnPosition[] = [];

  const addPosition = (market: EarnMarket, sharesRaw: bigint, assetsApprox: number) => {
    const key = `${market.chainId}-${market.address.toLowerCase()}`;
    if (seen.has(key)) return;
    seen.add(key);
    positions.push({ market, sharesRaw, assetsApprox });
  };

  try {
    const responses = await Promise.all(
      CHAIN_IDS.map((chainId) =>
        fetch(MORPHO_GRAPHQL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: USER_POSITIONS_QUERY,
            variables: { address: uaAddress.toLowerCase(), chainId },
          }),
          cache: "no-store",
        }).then((r) => r.json().then((j) => ({ chainId, data: j })))
      )
    );

    for (const { chainId, data: json } of responses) {
      const user = json?.data?.userByAddress;
      if (!user) continue;

      for (const item of user.vaultPositions ?? []) {
        const vault = item.vault ?? {};
        const state = item.state ?? {};
        const sharesStr = String(state.shares ?? "0");
        const sharesRaw = BigInt(sharesStr);
        if (sharesRaw <= BigInt(0)) continue;
        const decimals = parseInt(String(vault.asset?.decimals ?? 6), 10);
        const assetsRaw = Number(state.assets ?? 0);
        const assetsApprox = assetsRaw > 0 ? assetsRaw / Math.pow(10, decimals) : Number(sharesRaw) / 1e18;
        const cid = parseInt(String(vault.chain?.id ?? chainId), 10);
        if (!cid || !vault.address) continue;
        const market: EarnMarket = {
          id: `morpho-${cid}-${(vault.address ?? "").toLowerCase()}`,
          protocol: "morpho",
          chainId: cid,
          chainName: vault.chain?.network || chainNames[cid] || `Chain ${cid}`,
          uaChainId: chainIdToUa[cid] ?? cid,
          address: vault.address,
          name: vault.name || "Vault",
          symbol: "vault",
          assetAddress: vault.asset?.address ?? "",
          assetSymbol: (vault.asset?.symbol || "USDC").toUpperCase(),
          assetDecimals: decimals,
          apy: 0,
          tvl: 0,
        };
        addPosition(market, sharesRaw, assetsApprox);
      }

      for (const item of user.vaultV2Positions ?? []) {
        const vault = item.vault ?? {};
        const sharesStr = String(item.shares ?? "0");
        const sharesRaw = BigInt(sharesStr);
        if (sharesRaw <= BigInt(0)) continue;
        const decimals = parseInt(String(vault.asset?.decimals ?? 6), 10);
        const assetsRaw = Number(item.assets ?? 0);
        const assetsUsd = Number(item.assetsUsd ?? 0);
        const assetsApprox = assetsRaw > 0
          ? assetsRaw / Math.pow(10, decimals)
          : assetsUsd > 0
            ? assetsUsd
            : Number(sharesRaw) / 1e18;
        const cid = parseInt(String(vault.chain?.id ?? chainId), 10);
        if (!cid || !vault.address) continue;
        const market: EarnMarket = {
          id: `morpho-${cid}-${(vault.address ?? "").toLowerCase()}`,
          protocol: "morpho",
          chainId: cid,
          chainName: vault.chain?.network || chainNames[cid] || `Chain ${cid}`,
          uaChainId: chainIdToUa[cid] ?? cid,
          address: vault.address,
          name: vault.name || "Vault",
          symbol: "vault",
          assetAddress: vault.asset?.address ?? "",
          assetSymbol: (vault.asset?.symbol || "USDC").toUpperCase(),
          assetDecimals: decimals,
          apy: 0,
          tvl: 0,
        };
        addPosition(market, sharesRaw, assetsApprox);
      }
    }
  } catch (err) {
    console.error("[Earn] Fetch positions failed:", err);
  }
  return positions;
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

/** Format TVL for display (e.g. $1.2M, $450K). Sanity-cap to avoid garbage like $39B. */
export function formatTvl(usd: number): string {
  if (!Number.isFinite(usd) || usd <= 0 || usd > 1e12) return "—";
  if (usd >= 1e9) return `$${(usd / 1e9).toFixed(2)}B`;
  if (usd >= 1e6) return `$${(usd / 1e6).toFixed(2)}M`;
  if (usd >= 1e3) return `$${(usd / 1e3).toFixed(2)}K`;
  return `$${usd.toFixed(2)}`;
}
