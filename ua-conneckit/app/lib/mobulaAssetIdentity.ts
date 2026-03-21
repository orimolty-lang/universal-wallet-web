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

export function chainIdFromBlockchainSlug(slug: string | undefined): number | undefined {
  if (!slug) return undefined;
  return BLOCKCHAIN_SLUG_TO_CHAIN_ID[slug.toLowerCase().replace(/\s+/g, "")];
}

export function mobulaAssetPositionKeys(ma: MobulaPortfolioAsset): string[] {
  const keys: string[] = [];
  const seen = new Set<string>();
  const add = (cid: number | undefined, addr: string | undefined) => {
    if (!cid || !addr || !/^0x[a-fA-F0-9]{40}$/i.test(addr)) return;
    const k = contractPositionKey(cid, addr);
    if (!seen.has(k)) {
      seen.add(k);
      keys.push(k);
    }
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
    if (!cid || !addr || !/^0x[a-fA-F0-9]{40}$/i.test(addr)) return;
    const k = contractPositionKey(cid, addr);
    if (!seen.has(k)) {
      seen.add(k);
      keys.push(k);
    }
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

export function primaryPortfolioContractKeys(primaryAssets: IAssetsResponse): Set<string> {
  const set = new Set<string>();
  for (const a of primaryAssets.assets || []) {
    positionKeysFromMergedShape(a as unknown as Parameters<typeof positionKeysFromMergedShape>[0]).forEach((k) =>
      set.add(k),
    );
  }
  return set;
}

export function tokenContractKeySet(
  contracts: Array<{ address: string; blockchain: string }> | undefined,
): Set<string> {
  const s = new Set<string>();
  if (!contracts?.length) return s;
  for (const c of contracts) {
    const cid = chainIdFromBlockchainSlug(c.blockchain);
    if (cid && c.address) s.add(contractPositionKey(cid, c.address));
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
  return positionKeysFromMergedShape(asset).some((k) => want.has(k));
}
