/**
 * Earn service: fetch vaults from Morpho API, build deposit/withdraw tx for UA.
 */

import { encodeFunctionData, parseUnits } from "viem";
import { EARN_CHAINS, type EarnChainConfig } from "./earnConfig";

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

// ERC-4626 deposit
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
] as const;

export interface EarnVault {
  id: string;
  chainId: number;
  chainName: string;
  uaChainId: number;
  address: string;
  name: string;
  symbol: string;
  assetAddress: string;
  assetSymbol: string;
  assetDecimals: number;
  apy?: number;
  tvl?: number;
}

export interface EarnVaultWithApy extends EarnVault {
  apy: number;
  tvl: number;
}

/**
 * Build list of earn vaults from config (Morpho). Optionally enrich with APY from API.
 */
export async function fetchEarnVaults(): Promise<EarnVaultWithApy[]> {
  const vaults: EarnVaultWithApy[] = [];

  for (const chain of EARN_CHAINS) {
    for (const v of chain.morphoVaults) {
      vaults.push({
        id: `${chain.chainId}-${v.address.toLowerCase()}`,
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

  // Enrich with Morpho API if available
  try {
    const res = await fetch("https://api.morpho.org/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `query { vaultV2s(first: 200, where: { chainId_in: [1, 8453, 42161] }) { items { address chain { id } asset { address } supplyApy totalSupply } } }`,
      }),
      cache: "no-store",
    });
    const data = await res.json();
    const items = data?.data?.vaultV2s?.items ?? [];
    for (const item of items) {
      const chainId = parseInt(item.chain?.id ?? "0", 10);
      const addr = (item.address ?? "").toLowerCase();
      const idx = vaults.findIndex(
        (v) => v.chainId === chainId && v.address.toLowerCase() === addr
      );
      if (idx >= 0) {
        vaults[idx].apy = parseFloat(item.supplyApy ?? 0) * 100;
        vaults[idx].tvl = parseFloat(item.totalSupply ?? 0);
      }
    }
  } catch {
    // Fallback: use static 0 APY
  }

  return vaults;
}

/**
 * Build deposit tx calldata for UA createUniversalTransaction.
 */
export function buildMorphoDepositTx(
  vault: EarnVault,
  amountHuman: string,
  receiver: string
): { approve: `0x${string}`; deposit: `0x${string}` } {
  const amountWei = parseUnits(amountHuman, vault.assetDecimals);

  const approve = encodeFunctionData({
    abi: ERC20_ABI,
    functionName: "approve",
    args: [vault.address as `0x${string}`, amountWei],
  });

  const deposit = encodeFunctionData({
    abi: ERC4626_ABI,
    functionName: "deposit",
    args: [amountWei, receiver as `0x${string}`],
  });

  return { approve, deposit };
}

/**
 * Build withdraw (redeem) tx calldata.
 */
export function buildMorphoRedeemTx(
  vault: EarnVault,
  sharesWei: bigint,
  receiver: string,
  owner: string
): `0x${string}` {
  return encodeFunctionData({
    abi: ERC4626_ABI,
    functionName: "redeem",
    args: [sharesWei, receiver as `0x${string}`, owner as `0x${string}`],
  });
}

export function getEarnChains(): EarnChainConfig[] {
  return EARN_CHAINS;
}
