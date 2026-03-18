/**
 * EIP-7702 delegation helpers for Universal Account.
 * Handles per-chain delegation when relay limits to 1 delegation per transaction.
 */

import type { UniversalAccount } from "@particle-network/universal-account-sdk";
import { SUPPORTED_TOKEN_TYPE } from "@particle-network/universal-account-sdk";
import { toBeHex } from "ethers";

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
export type AddDebugFn = (msg: string) => void;

export type Sign7702Fn = (params: {
  contractAddress: `0x${string}`;
  chainId: number;
  nonce: number;
}, options: { address: string }) => Promise<{ r: string; s: string; v?: bigint; yParity: number }>;

/**
 * Delegate directly on-chain via type-4 tx (Particle 7702-create-delegated pattern).
 * Bypasses UA relay - no convert, no rate limit.
 */
export async function delegateChainDirectly(
  universalAccount: UniversalAccount,
  chainId: number,
  signAuthorization: Sign7702Fn,
  walletAddress: string,
  walletRequest: (args: { method: string; params?: unknown[] }) => Promise<unknown>,
  addDebug?: AddDebugFn
): Promise<boolean> {
  try {
    const auths = await universalAccount.getEIP7702Auth([chainId]);
    const auth = Array.isArray(auths) ? auths[0] : null;
    if (!auth?.address || auth?.chainId == null || auth?.nonce == null) {
      addDebug?.(`[7702] getEIP7702Auth returned no auth for chain ${chainId}`);
      return false;
    }

    addDebug?.(`[7702] Signing direct delegation for chain ${chainId}...`);
    const sig = await signAuthorization(
      {
        contractAddress: auth.address as `0x${string}`,
        chainId: Number(auth.chainId),
        nonce: Number(auth.nonce),
      },
      { address: walletAddress }
    );

    const signedAuth = {
      address: auth.address,
      chainId: Number(auth.chainId),
      nonce: Number(auth.nonce),
      r: sig.r.startsWith("0x") ? sig.r : `0x${sig.r}`,
      s: sig.s.startsWith("0x") ? sig.s : `0x${sig.s}`,
      yParity: sig.yParity as 0 | 1,
    };

    await walletRequest({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: toBeHex(chainId) }],
    });

    const nonceHex = await walletRequest({
      method: "eth_getTransactionCount",
      params: [walletAddress, "latest"],
    });
    const nonce = typeof nonceHex === "string" ? parseInt(nonceHex, 16) : 0;

    const txHash = await walletRequest({
      method: "eth_sendTransaction",
      params: [
        {
          from: walletAddress,
          to: "0x0000000000000000000000000000000000000000",
          type: "0x4",
          authorizationList: [signedAuth],
          accessList: [],
          nonce: toBeHex(nonce),
          maxFeePerGas: toBeHex(BigInt(0.1 * 1e9)),
          maxPriorityFeePerGas: toBeHex(BigInt(0.1 * 1e9)),
          gas: toBeHex(BigInt(21000)),
        },
      ],
    });

    if (txHash && typeof txHash === "string") {
      addDebug?.(`[7702] Delegated chain ${chainId} tx=${txHash.slice(0, 18)}...`);
      return true;
    }
    return false;
  } catch (err) {
    addDebug?.(`[7702] delegateChainDirectly failed: ${err instanceof Error ? err.message : String(err)}`);
    console.warn("[7702] delegateChainDirectly failed:", err);
    return false;
  }
}

export async function createDelegationOnlyTx(
  universalAccount: UniversalAccount,
  chainId: number,
  _ownerAddress: string,
  addDebug?: AddDebugFn
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
    const userOps = (tx as { userOps?: unknown[] })?.userOps ?? [];
    const hasAuth = userOps.some((u: unknown) => !!(u as Record<string, unknown>)?.eip7702Auth);
    const summary = `no-op chain=${chainId} userOps=${userOps.length} hasAuth=${hasAuth} chainsNeeding=${chainsNeedingAuth.join(",") || "none"}`;
    console.log("[7702] createUniversalTransaction no-op:", summary);
    addDebug?.(`[7702] ${summary}`);
    return { tx, chainsNeedingAuth };
  } catch (err) {
    console.warn("[7702] createDelegationOnlyTx failed:", err);
    return null;
  }
}
