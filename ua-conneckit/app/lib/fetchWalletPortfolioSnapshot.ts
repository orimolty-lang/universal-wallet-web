import {
  UniversalAccount,
  UNIVERSAL_ACCOUNT_VERSION,
  type IUniversalAccountConfig,
} from "@particle-network/universal-account-sdk";
import { fetchParticleExternalAssets } from "../../lib/particle-balances";
import type { MobulaPortfolioAsset } from "./mobulaAssetIdentity";
import { mobulaAssetPositionKeys } from "./mobulaAssetIdentity";
import { computeExternalPortfolioUsd } from "./computeExternalPortfolioUsd";

const MOBULA_PROXY_BASE =
  process.env.NEXT_PUBLIC_LIFI_PROXY_URL || "https://lifi-proxy.orimolty.workers.dev";
const MORALIS_API_KEY = process.env.NEXT_PUBLIC_MORALIS_API_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6ImM3NzRhN2EyLThjMDItNDlhOS04ZDdlLTdiMmI3YWM5OTJlMSIsIm9yZ0lkIjoiNDQwODQxIiwidXNlcklkIjoiNDUzNTQ1IiwidHlwZUlkIjoiN2Y3NjRlZGMtMzI3Ni00NTQ3LTkzNWYtYzQ2NmVjNzJmNTYwIiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE3NDQyNDE4MjYsImV4cCI6NDkwMDAwMTgyNn0.jDl4YJnGYbEPp4zARV71TZupZBZmbHx4FABNIwT-CNc";

async function fetchMoralisWalletBalances(address: string): Promise<MobulaPortfolioAsset[]> {
  if (!address || !address.startsWith("0x") || !MORALIS_API_KEY) return [];
  try {
    const url = `https://deep-index.moralis.io/api/v2.2/wallets/${address}/tokens?chain=base&token_prices=true&exclude_spam=true`;
    const response = await fetch(url, { headers: { Accept: "application/json", "X-API-Key": MORALIS_API_KEY } });
    if (!response.ok) return [];
    const data = await response.json();
    const result = Array.isArray(data?.result) ? data.result : [];
    return result
      .map((row: Record<string, unknown>) => {
        const tokenBalance = Number(row?.balance_formatted || 0);
        const price = Number(row?.usd_price || 0);
        const estimated = Number(row?.usd_value ?? tokenBalance * price);
        const tokenAddress = typeof row?.token_address === "string" ? row.token_address : undefined;
        return {
          asset: {
            name: row?.name || row?.symbol || "Unknown",
            symbol: row?.symbol || "?",
            logo: row?.logo || row?.thumbnail,
            contracts: tokenAddress ? [tokenAddress] : [],
            blockchains: ["base"],
          },
          token_balance: Number.isFinite(tokenBalance) ? tokenBalance : 0,
          price: Number.isFinite(price) ? price : 0,
          estimated_balance: Number.isFinite(estimated) ? estimated : 0,
          contracts_balances: tokenAddress ? [{ address: tokenAddress, chainId: "8453" }] : [],
          cross_chain_balances: tokenAddress
            ? {
                base: {
                  address: tokenAddress,
                  balance: Number.isFinite(tokenBalance) ? tokenBalance : 0,
                  balanceRaw: String(row?.balance || "0"),
                  chainId: 8453,
                },
              }
            : {},
        } as MobulaPortfolioAsset;
      })
      .filter((a: MobulaPortfolioAsset) => (a.token_balance || 0) > 0 || (a.estimated_balance || 0) > 0);
  } catch {
    return [];
  }
}

async function fetchMobulaWalletBalances(address: string): Promise<MobulaPortfolioAsset[]> {
  if (!address) return [];
  try {
    const url = `${MOBULA_PROXY_BASE}/mobula/api/1/wallet/portfolio?wallet=${address}&blockchains=base,ethereum,arbitrum,polygon,solana,optimistic,bnb`;
    const response = await fetch(url, { method: "GET", headers: { "Content-Type": "application/json" } });
    if (!response.ok) return await fetchMoralisWalletBalances(address);
    const data = await response.json();
    return data.data?.assets || [];
  } catch {
    return await fetchMoralisWalletBalances(address);
  }
}

function mergeMobulaLists(evmAssets: MobulaPortfolioAsset[], solanaAssets: MobulaPortfolioAsset[]): MobulaPortfolioAsset[] {
  const assetMap = new Map<string, MobulaPortfolioAsset>();
  [...evmAssets, ...solanaAssets].forEach((asset) => {
    const keys = mobulaAssetPositionKeys(asset);
    if (keys.length === 0) return;
    const mapKey = keys[0];
    const existing = assetMap.get(mapKey);
    if (!existing || asset.estimated_balance > existing.estimated_balance) {
      assetMap.set(mapKey, asset);
    }
  });
  return Array.from(assetMap.values());
}

export type WalletPortfolioSnapshot = {
  unifiedUsd: number;
  externalUsd: number;
  combinedUsd: number;
};

/** Fetch UA primary + Mobula + Particle totals for an embedded EOA (owner), without switching the active wallet. */
export async function fetchWalletPortfolioSnapshot(ownerAddress: string): Promise<WalletPortfolioSnapshot> {
  const lo = ownerAddress?.trim();
  if (!lo?.startsWith("0x") || lo.length !== 42) {
    return { unifiedUsd: 0, externalUsd: 0, combinedUsd: 0 };
  }

  const projectId = process.env.NEXT_PUBLIC_PROJECT_ID || "c0cb9e74-192b-4bdc-ba62-852775c6e7fd";
  const clientKey = process.env.NEXT_PUBLIC_CLIENT_KEY || "caswUnSdr9LPg5HEhqAZouZAExKOKZPv791XBxSK";
  const appId = process.env.NEXT_PUBLIC_APP_ID || "e5be9376-1d3a-4882-b4a5-c5c0ce1b5182";

  const config: IUniversalAccountConfig = {
    projectId,
    projectClientKey: clientKey,
    projectAppUuid: appId,
    rpcUrl: "https://universal-rpc-staging.particle.network",
    smartAccountOptions: {
      useEIP7702: true,
      name: "UNIVERSAL",
      version: UNIVERSAL_ACCOUNT_VERSION,
      ownerAddress: lo,
    },
  };

  const ua = new UniversalAccount(config);

  let primary;
  try {
    primary = await ua.getPrimaryAssets();
  } catch {
    return { unifiedUsd: 0, externalUsd: 0, combinedUsd: 0 };
  }

  const unifiedUsd = primary.totalAmountInUSD || 0;

  let evm = "";
  let sol = "";
  try {
    const options = await ua.getSmartAccountOptions();
    evm = options.smartAccountAddress || "";
    sol = options.solanaSmartAccountAddress || "";
  } catch {
    return { unifiedUsd, externalUsd: 0, combinedUsd: unifiedUsd };
  }

  const [evmMob, solMob] = await Promise.all([
    evm ? fetchMobulaWalletBalances(evm) : Promise.resolve([] as MobulaPortfolioAsset[]),
    sol ? fetchMobulaWalletBalances(sol) : Promise.resolve([] as MobulaPortfolioAsset[]),
  ]);
  const mobulaMerged = mergeMobulaLists(evmMob, solMob);

  const primarySymbols = new Set(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (primary.assets?.map((a: any) => a.tokenType?.toUpperCase()?.trim()) || []).filter(
      (s: string | undefined) => s,
    ) as string[],
  );

  let particleAssets = [] as Awaited<ReturnType<typeof fetchParticleExternalAssets>>;
  if (evm) {
    try {
      particleAssets = await fetchParticleExternalAssets(evm, primarySymbols);
    } catch {
      particleAssets = [];
    }
  }

  const externalUsd = computeExternalPortfolioUsd(primary, mobulaMerged, particleAssets);
  return {
    unifiedUsd,
    externalUsd,
    combinedUsd: unifiedUsd + externalUsd,
  };
}
