/**
 * EIP-7702 delegation helpers for Universal Account.
 * Handles per-chain delegation when relay limits to 1 delegation per transaction.
 */

import type { UniversalAccount } from "@particle-network/universal-account-sdk";

export type WalletClientLike = {
  account?: { address?: `0x${string}` };
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  signMessage?: (args: { message: string | { raw: `0x${string}` } }) => Promise<unknown>;
};

/**
 * Get EIP-7702 deployment status from UA SDK.
 * Returns which chains have delegation contracts deployed.
 */
export async function getEIP7702Deployments(
  universalAccount: UniversalAccount
): Promise<unknown> {
  try {
    const deployments = await universalAccount.getEIP7702Deployments();
    return deployments;
  } catch (err) {
    console.warn("[7702] getEIP7702Deployments failed:", err);
    return null;
  }
}

/**
 * Extract EVM chains that need 7702 auth from a transaction's userOps.
 * Skips Solana (chain 101) - no 7702 there.
 */
export function getChainsNeedingAuth(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tx: any
): number[] {
  const userOps = tx?.userOps;
  if (!Array.isArray(userOps)) return [];

  const chainIds = new Set<number>();
  for (const op of userOps) {
    if (op?.eip7702Auth && !op?.eip7702Delegated) {
      const chainId = Number(op.eip7702Auth.chainId ?? op.chainId);
      if (chainId > 0 && chainId !== 101) {
        chainIds.add(chainId);
      }
    }
  }
  return Array.from(chainIds);
}

/**
 * Create a minimal "delegation-only" transaction for a single chain.
 * Uses createUniversalTransaction with a no-op (0 value to self) to trigger 7702 auth.
 * Goal: one userOp on one chain so we stay within "1 delegation per txn" limit.
 */
export async function createDelegationOnlyTx(
  universalAccount: UniversalAccount,
  chainId: number,
  ownerAddress: string
): Promise<{ tx: unknown; chainsNeedingAuth: number[] } | null> {
  try {
    // Minimal no-op: send 0 value to self on this chain
    const tx = await universalAccount.createUniversalTransaction({
      chainId,
      expectTokens: [],
      transactions: [
        {
          to: ownerAddress as `0x${string}`,
          data: "0x",
          value: "0x0",
        },
      ],
    });

    const chainsNeedingAuth = getChainsNeedingAuth(tx);
    return { tx, chainsNeedingAuth };
  } catch (err) {
    console.warn("[7702] createDelegationOnlyTx failed:", err);
    return null;
  }
}
