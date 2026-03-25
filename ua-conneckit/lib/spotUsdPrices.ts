/**
 * Live-ish USD spot for major assets (Convert modal, etc.).
 * CoinGecko public API; cached briefly to avoid hammering on every keystroke.
 */

const CG_IDS = {
  ETH: "ethereum",
  SOL: "solana",
  BNB: "binancecoin",
  BTC: "bitcoin",
} as const;

type MajorSymbol = keyof typeof CG_IDS;

let cache: { map: Record<string, number>; ts: number } | null = null;
const TTL_MS = 45_000;

/** USD prices for ETH, SOL, BNB, BTC (uppercase keys). */
export async function fetchMajorSpotUsdPrices(): Promise<Record<string, number>> {
  const now = Date.now();
  if (cache && now - cache.ts < TTL_MS) {
    return { ...cache.map };
  }

  const ids = Array.from(new Set(Object.values(CG_IDS))).join(",");
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`;

  try {
    const res = await fetch(url);
    if (!res.ok) return cache?.map ? { ...cache.map } : {};
    const data = (await res.json()) as Record<string, { usd?: number } | undefined>;

    const map: Record<string, number> = {};
    (Object.entries(CG_IDS) as [MajorSymbol, string][]).forEach(([sym, id]) => {
      const u = data[id]?.usd;
      if (typeof u === "number" && Number.isFinite(u) && u > 0) {
        map[sym] = u;
      }
    });

    if (Object.keys(map).length > 0) {
      cache = { map, ts: now };
    }
    return { ...map };
  } catch {
    return cache?.map ? { ...cache.map } : {};
  }
}

export function spotPriceForSymbol(map: Record<string, number>, symbol: string): number {
  const p = map[symbol.toUpperCase()];
  return typeof p === "number" && p > 0 ? p : 0;
}
