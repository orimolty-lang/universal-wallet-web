/**
 * Fetch external token balances via Particle RPC (particle_getTokens).
 * Fallback for Mobula when credits are exhausted. No API credits needed.
 * Based on Particle universal-accounts-7702 example.
 */

const PARTICLE_RPC_URL = "https://rpc.particle.network/evm-chain";

const SUPPORTED_CHAIN_IDS = [
  1, 56, 137, 42161, 10, 43114, 8453, // Ethereum, BNB, Polygon, Arbitrum, Optimism, Avalanche, Base
];

const NATIVE_TOKENS: Record<number, { symbol: string; name: string; logoURI: string }> = {
  1: { symbol: "ETH", name: "Ethereum", logoURI: "https://assets.coingecko.com/coins/images/279/small/ethereum.png" },
  56: { symbol: "BNB", name: "BNB", logoURI: "https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png" },
  137: { symbol: "POL", name: "Polygon", logoURI: "https://assets.coingecko.com/coins/images/4713/small/polygon.png" },
  42161: { symbol: "ETH", name: "Ethereum", logoURI: "https://assets.coingecko.com/coins/images/279/small/ethereum.png" },
  10: { symbol: "ETH", name: "Ethereum", logoURI: "https://assets.coingecko.com/coins/images/279/small/ethereum.png" },
  43114: { symbol: "AVAX", name: "Avalanche", logoURI: "https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png" },
  8453: { symbol: "ETH", name: "Ethereum", logoURI: "https://assets.coingecko.com/coins/images/279/small/ethereum.png" },
};

interface ParticleToken {
  decimals: number;
  amount: string;
  address: string;
  name: string;
  symbol: string;
  image?: string;
}

interface ParticleTokensResponse {
  native: string;
  tokens: ParticleToken[];
}

export interface ParticleBalanceItem {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  chainId: number;
  amount: string;
  amountInUSD: number;
  logoURI?: string;
}

/** External asset format for combined assets (matches Mobula output shape) */
export interface ParticleExternalAsset {
  symbol: string;
  name: string;
  amount: number;
  amountInUSD: number;
  price: number;
  logo?: string;
  isExternal: true;
  contracts: Array<{ address: string; blockchain: string }>;
  chainAggregation: Array<{ token: { chainId: number; address: string }; amount: number; amountInUSD: number }>;
}

function getParticleCredentials(): { projectId: string; clientKey: string } {
  const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;
  const clientKey = process.env.NEXT_PUBLIC_CLIENT_KEY;
  if (!projectId || !clientKey) {
    throw new Error("Particle credentials not configured");
  }
  return { projectId, clientKey };
}

async function fetchChainTokens(walletAddress: string, chainId: number): Promise<ParticleBalanceItem[]> {
  try {
    const { projectId, clientKey } = getParticleCredentials();
    const response = await fetch(PARTICLE_RPC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${btoa(`${projectId}:${clientKey}`)}`,
      },
      body: JSON.stringify({
        chainId,
        jsonrpc: "2.0",
        id: 1,
        method: "particle_getTokens",
        params: [walletAddress],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return [];
      return [];
    }

    const data = await response.json();
    if (data.error) return [];

    const result: ParticleTokensResponse = data.result;
    const balances: ParticleBalanceItem[] = [];

    const nativeBalance = BigInt(result.native || "0");
    if (nativeBalance > BigInt(0)) {
      const nativeToken = NATIVE_TOKENS[chainId];
      if (nativeToken) {
        balances.push({
          address: "0x0000000000000000000000000000000000000000",
          symbol: nativeToken.symbol,
          name: nativeToken.name,
          decimals: 18,
          chainId,
          amount: result.native,
          amountInUSD: 0,
          logoURI: nativeToken.logoURI,
        });
      }
    }

    for (const token of result.tokens || []) {
      const tokenBalance = BigInt(token.amount || "0");
      if (tokenBalance > BigInt(0)) {
        balances.push({
          address: token.address,
          symbol: token.symbol,
          name: token.name,
          decimals: token.decimals,
          chainId,
          amount: token.amount,
          amountInUSD: 0,
          logoURI: token.image,
        });
      }
    }

    return balances;
  } catch {
    return [];
  }
}

const CHAIN_ID_TO_BLOCKCHAIN: Record<number, string> = {
  1: "ethereum", 8453: "base", 42161: "arbitrum",
  10: "optimism", 137: "polygon", 56: "bsc", 43114: "avalanche",
};

/** CoinGecko coin IDs for native tokens (WETH≈ETH, WBNB≈BNB, etc.) */
const SYMBOL_TO_COINGECKO_ID: Record<string, string> = {
  WETH: "ethereum",
  ETH: "ethereum",
  WBNB: "binancecoin",
  BNB: "binancecoin",
  WMATIC: "matic-network",
  POL: "matic-network",
  MATIC: "matic-network",
  WAVAX: "avalanche-2",
  AVAX: "avalanche-2",
  WBTC: "bitcoin",
  BTC: "bitcoin",
};

let priceCache: { prices: Record<string, number>; ts: number } | null = null;
const PRICE_CACHE_TTL_MS = 60_000; // 1 min

async function fetchPricesForSymbols(symbols: string[]): Promise<Record<string, number>> {
  const ids = Array.from(new Set(symbols.map((s) => SYMBOL_TO_COINGECKO_ID[s?.toUpperCase()]).filter(Boolean)));
  if (ids.length === 0) return {};

  const now = Date.now();
  if (priceCache && now - priceCache.ts < PRICE_CACHE_TTL_MS) {
    return priceCache.prices;
  }

  try {
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(",")}&vs_currencies=usd`;
    const res = await fetch(url);
    if (!res.ok) return {};
    const data = (await res.json()) as Record<string, { usd?: number }>;
    const prices: Record<string, number> = {};
    for (const [id, val] of Object.entries(data)) {
      if (typeof val?.usd === "number") prices[id] = val.usd;
    }
    priceCache = { prices, ts: now };
    return prices;
  } catch {
    return priceCache?.prices ?? {};
  }
}

/** Map symbol -> USD price using CoinGecko native token prices (WETH=ETH, WBNB=BNB) */
function getPriceForSymbol(symbol: string, prices: Record<string, number>): number {
  const id = SYMBOL_TO_COINGECKO_ID[symbol?.toUpperCase()];
  return id ? (prices[id] ?? 0) : 0;
}

/**
 * Fetch all token balances via Particle RPC and aggregate into external asset format.
 * Excludes tokens that match primarySymbols (UA primary assets) to avoid duplicates.
 * Enriches with USD prices via CoinGecko for total value display.
 */
export async function fetchParticleExternalAssets(
  walletAddress: string,
  primarySymbols: Set<string>
): Promise<ParticleExternalAsset[]> {
  if (!walletAddress) return [];

  const allBalances = await Promise.all(
    SUPPORTED_CHAIN_IDS.map((chainId) => fetchChainTokens(walletAddress, chainId))
  );

  const flat = allBalances.flat();

  // Aggregate by symbol (e.g. WETH from multiple chains -> one asset with chainAggregation)
  const bySymbol = new Map<string, ParticleBalanceItem[]>();
  for (const b of flat) {
    const sym = b.symbol?.toUpperCase()?.trim();
    if (!sym || primarySymbols.has(sym)) continue; // Skip primary dupes
    const list = bySymbol.get(sym) || [];
    list.push(b);
    bySymbol.set(sym, list);
  }

  const symbols = Array.from(bySymbol.keys());
  const prices = await fetchPricesForSymbols(symbols);

  const assets: ParticleExternalAsset[] = [];
  for (const items of Array.from(bySymbol.values())) {
    const totalAmount = items.reduce((sum, i) => sum + parseFloat(i.amount) / Math.pow(10, i.decimals), 0);
    if (totalAmount <= 0) continue;

    const first = items[0];
    const price = getPriceForSymbol(first.symbol, prices);
    const totalUSD = price > 0 ? totalAmount * price : 0;

    const chainAggregation = items.map((i) => {
      const amt = parseFloat(i.amount) / Math.pow(10, i.decimals);
      const amtUsd = price > 0 ? amt * price : 0;
      return {
        token: { chainId: i.chainId, address: i.address },
        amount: amt,
        amountInUSD: amtUsd,
      };
    });

    assets.push({
      symbol: first.symbol,
      name: first.name,
      amount: totalAmount,
      amountInUSD: totalUSD,
      price,
      logo: first.logoURI,
      isExternal: true,
      contracts: items.map((i) => ({
        address: i.address,
        blockchain: CHAIN_ID_TO_BLOCKCHAIN[i.chainId] || `chain-${i.chainId}`,
      })),
      chainAggregation,
    });
  }

  return assets;
}
