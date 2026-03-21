/**
 * Contract + chain identity for portfolio rows (never use token symbol as unique key).
 */

import type { IAssetsResponse } from "@particle-network/universal-account-sdk";

export const BLOCKCHAIN_SLUG_TO_CHAIN_ID: Record<string, number> = {
  ethereum: 1,
  eth: 1,
  base: 8453,
  arbitrum: 42161,
  arb: 42161,
  optimism: 10,
  optimistic: 10,
  polygon: 137,
  matic: 137,
  bsc: 56,
  binance: 56,
  solana: 101,
  sol: 101,
  avalanche: 43114,
  avax: 43114,
};

/** Canonical wrapped native per chain — UA often uses 0x0/0xeee for gas while Mobula uses these. */
export const WRAPPED_NATIVE_BY_CHAIN_ID: Partial<Record<number, string>> = {
  1: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
  8453: "0x4200000000000000000000000000000000000006",
  42161: "0x82af49447d8a07e3bd95bd0d56f35241523fbab1",
  10: "0x4200000000000000000000000000000000000006",
  56: "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c",
  137: "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270",
  43114: "0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7",
};

const NATIVE_SENTINEL_LOWER = new Set([
  "0x0000000000000000000000000000000000000000",
  "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
]);

export interface MobulaPortfolioAsset {
  asset: {
    name: string;
    symbol: string;
    logo?: string;
    contracts?: string[];
    blockchains?: string[];
  };
  token_balance: number;
  price: number;
  price_change_24h?: number;
  estimated_balance: number;
  contracts_balances?: Array<{ address?: string; chainId?: string | number }>;
  cross_chain_balances?: Record<
    string,
    {
      address: string;
      balance: number;
      balanceRaw?: string;
      chainId: number | string;
    }
  >;
}

export function parseChainIdMobula(raw: unknown): number | undefined {
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw === "string") {
    const n = parseInt(raw.replace(/^evm:/i, ""), 10);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

export function contractPositionKey(chainId: number, address: string): string {
  return `${chainId}:${address.trim().toLowerCase()}`;
}

/** EVM: `chainId:0x...` lowercased. Solana: `101:<base58>` (case-preserved). */
export function positionKeyForChainAddress(chainId: number, addressRaw: string): string | null {
  const trimmed = addressRaw.trim();
  if (chainId === 101) {
    if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(trimmed)) return `101:${trimmed}`;
    return null;
  }
  if (!/^0x[a-fA-F0-9]{40}$/i.test(trimmed)) return null;
  return `${chainId}:${trimmed.toLowerCase()}`;
}

export function chainIdFromBlockchainSlug(slug: string | undefined): number | undefined {
  if (!slug) return undefined;
  const k = slug.toLowerCase().replace(/\s+/g, "");
  if (BLOCKCHAIN_SLUG_TO_CHAIN_ID[k] !== undefined) return BLOCKCHAIN_SLUG_TO_CHAIN_ID[k];
  if (/^\d+$/.test(k)) {
    const n = parseInt(k, 10);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

/** Add wrapped-native / native-sentinel aliases so Mobula WETH rows match UA ETH rows. */
export function expandNativeWrappedEquivalentKeys(keys: Set<string>): void {
  const toAdd: string[] = [];
  for (const k of Array.from(keys)) {
    const idx = k.indexOf(":");
    if (idx <= 0) continue;
    const chainId = Number(k.slice(0, idx));
    if (!Number.isFinite(chainId) || chainId === 101) continue;
    const addr = k.slice(idx + 1).toLowerCase();
    const wrapped = WRAPPED_NATIVE_BY_CHAIN_ID[chainId];
    const w = wrapped?.toLowerCase();
    if (!w) continue;
    if (NATIVE_SENTINEL_LOWER.has(addr)) {
      toAdd.push(`${chainId}:${w}`);
    }
    if (addr === w) {
      toAdd.push(`${chainId}:0x0000000000000000000000000000000000000000`);
      toAdd.push(`${chainId}:0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee`);
    }
  }
  for (const x of toAdd) keys.add(x);
}

export function mobulaAssetPositionKeys(ma: MobulaPortfolioAsset): string[] {
  const keys: string[] = [];
  const seen = new Set<string>();
  const add = (cid: number | undefined, addr: string | undefined) => {
    if (!cid || !addr) return;
    const k = positionKeyForChainAddress(cid, addr);
    if (!k || seen.has(k)) return;
    seen.add(k);
    keys.push(k);
  };
  if (Array.isArray(ma.contracts_balances)) {
    for (const row of ma.contracts_balances) {
      add(parseChainIdMobula(row.chainId), row.address);
    }
  }
  if (ma.cross_chain_balances) {
    for (const v of Object.values(ma.cross_chain_balances)) {
      add(parseChainIdMobula(v.chainId), v.address);
    }
  }
  if (ma.asset.contracts?.length) {
    const bl = ma.asset.blockchains || [];
    for (let i = 0; i < ma.asset.contracts.length; i++) {
      add(chainIdFromBlockchainSlug(bl[i]), ma.asset.contracts[i]);
    }
  }
  return keys;
}

export function positionKeysFromMergedShape(a: {
  contracts?: Array<{ address: string; blockchain: string }>;
  chainAggregation?: Array<{ token?: { chainId?: number | string; address?: string } }>;
}): string[] {
  const keys: string[] = [];
  const seen = new Set<string>();
  const add = (cid: number | undefined, addr: string | undefined) => {
    if (!cid || !addr) return;
    const k = positionKeyForChainAddress(cid, addr);
    if (!k || seen.has(k)) return;
    seen.add(k);
    keys.push(k);
  };
  if (Array.isArray(a.chainAggregation)) {
    for (const c of a.chainAggregation) {
      const t = c.token;
      if (!t?.address) continue;
      const cid =
        typeof t.chainId === "number"
          ? t.chainId
          : parseInt(String(t.chainId || "").replace(/^evm:/i, ""), 10);
      if (Number.isFinite(cid)) add(cid, t.address);
    }
  }
  if (Array.isArray(a.contracts)) {
    for (const c of a.contracts) {
      add(chainIdFromBlockchainSlug(c.blockchain), c.address);
    }
  }
  return keys;
}

/** UA `getPrimaryAssets()` staples — hide external rows that mirror these when chains overlap. */
export const PRIMARY_UA_STAPLE_TOKEN_TYPES = new Set(["ETH", "BNB", "USDC", "SOL", "USDT"]);

const AGGREGATED_STAPLE_PLACEHOLDER = -2;

const STAPLE_SYMBOL_TO_TYPE: Record<string, string> = {
  ETH: "ETH",
  WETH: "ETH",
  BNB: "BNB",
  WBNB: "BNB",
  USDC: "USDC",
  USDBC: "USDC",
  SOL: "SOL",
  WSOL: "SOL",
  USDT: "USDT",
};

/** Dotless Mobula variants e.g. USDT.E → USDTE */
const STAPLE_COMPACT_TO_TYPE: Record<string, string> = {
  USDTE: "USDT",
  USDCE: "USDC",
};

export function mobulaSymbolToPrimaryStapleType(symbol: string): string | null {
  const s = symbol.trim().toUpperCase().replace(/\s+/g, "");
  const compact = s.replace(/\./g, "");
  const st = STAPLE_SYMBOL_TO_TYPE[s] || STAPLE_SYMBOL_TO_TYPE[compact] || STAPLE_COMPACT_TO_TYPE[compact];
  if (st && PRIMARY_UA_STAPLE_TOKEN_TYPES.has(st)) return st;
  return null;
}

function chainIdsFromPrimaryAssetRecord(a: unknown): Set<number> {
  const MIN = 1e-12;
  const out = new Set<number>();
  const rec = a as {
    chainAggregation?: Array<{ amount?: number | string; token?: { chainId?: number | string } }>;
  };
  if (Array.isArray(rec.chainAggregation)) {
    for (const c of rec.chainAggregation) {
      const amt = Number(c.amount || 0);
      if (amt < MIN) continue;
      const raw = c.token?.chainId;
      const cid = typeof raw === "number" ? raw : parseInt(String(raw || "").replace(/^evm:/i, ""), 10);
      if (Number.isFinite(cid)) out.add(cid);
    }
  }
  for (const k of positionKeysFromMergedShape(rec as Parameters<typeof positionKeysFromMergedShape>[0])) {
    const i = k.indexOf(":");
    if (i > 0) {
      const n = Number(k.slice(0, i));
      if (Number.isFinite(n)) out.add(n);
    }
  }
  return out;
}

/**
 * For each UA staple tokenType, chain IDs where primary shows a balance.
 * If there is balance but no per-chain data, uses a placeholder so external staples are suppressed.
 */
export function primaryStapleChainCoverage(primaryAssets: IAssetsResponse): Map<string, Set<number>> {
  const map = new Map<string, Set<number>>();
  for (const a of primaryAssets.assets || []) {
    const tt = String((a as { tokenType?: string }).tokenType || "")
      .toUpperCase()
      .trim();
    if (!PRIMARY_UA_STAPLE_TOKEN_TYPES.has(tt)) continue;
    if (!map.has(tt)) map.set(tt, new Set());
    const set = map.get(tt)!;
    const chainIds = chainIdsFromPrimaryAssetRecord(a);
    chainIds.forEach((id) => set.add(id));
    const amt = Number((a as { amount?: number | string }).amount || 0);
    if (chainIds.size === 0 && Number.isFinite(amt) && amt > 1e-12) {
      set.add(AGGREGATED_STAPLE_PLACEHOLDER);
    }
  }
  return map;
}

/** Contract overlap with UA primary, or same staple (ETH/WETH, …) on a chain UA already holds. */
export function isPositionKeysDuplicateOfUaPrimaryStaple(
  symbol: string,
  positionKeys: string[],
  primaryAssets: IAssetsResponse,
  primaryContractKeys: Set<string>,
): boolean {
  if (positionKeys.length === 0) return true;
  if (positionKeys.some((k) => primaryContractKeys.has(k))) return true;

  const staple = mobulaSymbolToPrimaryStapleType(symbol);
  if (!staple) return false;

  const coverage = primaryStapleChainCoverage(primaryAssets);
  const primaryChains = coverage.get(staple);
  if (!primaryChains || primaryChains.size === 0) return false;
  if (primaryChains.has(AGGREGATED_STAPLE_PLACEHOLDER)) return true;

  for (const k of positionKeys) {
    const i = k.indexOf(":");
    if (i <= 0) continue;
    const n = Number(k.slice(0, i));
    if (Number.isFinite(n) && primaryChains.has(n)) return true;
  }
  return false;
}

export function isMobulaDuplicateOfUaPrimaryStaple(
  ma: MobulaPortfolioAsset,
  primaryAssets: IAssetsResponse,
  primaryContractKeys: Set<string>,
): boolean {
  return isPositionKeysDuplicateOfUaPrimaryStaple(
    ma.asset.symbol,
    mobulaAssetPositionKeys(ma),
    primaryAssets,
    primaryContractKeys,
  );
}

export function primaryPortfolioContractKeys(primaryAssets: IAssetsResponse): Set<string> {
  const set = new Set<string>();
  for (const a of primaryAssets.assets || []) {
    positionKeysFromMergedShape(a as unknown as Parameters<typeof positionKeysFromMergedShape>[0]).forEach((k) =>
      set.add(k),
    );
  }
  expandNativeWrappedEquivalentKeys(set);
  return set;
}

export function tokenContractKeySet(
  contracts: Array<{ address: string; blockchain: string }> | undefined,
): Set<string> {
  const s = new Set<string>();
  if (!contracts?.length) return s;
  for (const c of contracts) {
    const cid = chainIdFromBlockchainSlug(c.blockchain);
    if (cid && c.address) {
      const k = positionKeyForChainAddress(cid, c.address);
      if (k) s.add(k);
    }
  }
  return s;
}

export function mergedAssetMatchesContractKeys(
  asset: {
    contracts?: Array<{ address: string; blockchain: string }>;
    chainAggregation?: Array<{ token?: { chainId?: number | string; address?: string } }>;
  },
  want: Set<string>,
): boolean {
  if (want.size === 0) return false;
  const expandedWant = new Set(want);
  expandNativeWrappedEquivalentKeys(expandedWant);
  return positionKeysFromMergedShape(asset).some((k) => expandedWant.has(k));
}
