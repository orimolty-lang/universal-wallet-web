/**
 * EIP-7702 delegation helpers for Universal Account.
 * Handles per-chain delegation when relay limits to 1 delegation per transaction.
 */

import type { UniversalAccount } from "@particle-network/universal-account-sdk";
import { SUPPORTED_TOKEN_TYPE } from "@particle-network/universal-account-sdk";

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
 * Tries createConvertTransaction (tiny amount) first - when user has balance on
 * target chain, backend may return single-chain tx. Falls back to no-op
 * createUniversalTransaction.
 */
export async function createDelegationOnlyTx(
  universalAccount: UniversalAccount,
  chainId: number,
  _ownerAddress: string
): Promise<{ tx: unknown; chainsNeedingAuth: number[] } | null> {
  // 1. Try minimal convert - often single-chain when user has balance on target
  try {
    const convertTx = await universalAccount.createConvertTransaction(
      {
        chainId,
        expectToken: { type: SUPPORTED_TOKEN_TYPE.USDC, amount: "0.000001" },
      },
      { usePrimaryTokens: [SUPPORTED_TOKEN_TYPE.USDC] }
    );
    const chains = getChainsNeedingAuth(convertTx);
    if (chains.length === 1 && chains[0] === chainId) {
      return { tx: convertTx, chainsNeedingAuth: chains };
    }
  } catch {
    // Fall through to no-op
  }

  // 2. Fallback: no-op (0 value to self) on target chain
  try {
    const tx = await universalAccount.createUniversalTransaction({
      chainId,
      expectTokens: [],
      transactions: [
        { to: _ownerAddress as `0x${string}`, data: "0x", value: "0x0" },
      ],
    });
    const chainsNeedingAuth = getChainsNeedingAuth(tx);
    return { tx, chainsNeedingAuth };
  } catch (err) {
    console.warn("[7702] createDelegationOnlyTx failed:", err);
    return null;
  }
}
