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
 * Handle EIP-7702 authorizations - aligned with Particle demo.
 * No wallet_switchEthereumChain (demo doesn't switch).
 * Uses chainId:nonce cache for multi-chain (each chain has own delegation contract).
 */
export type Sign7702Fn = (params: {
  contractAddress: `0x${string}`;
  chainId: number;
  nonce: number;
}, options: { address: string }) => Promise<{ r: string; s: string; v?: bigint; yParity: number }>;

export type Eip7702Authorization = { userOpHash: string; signature: string };

export async function handleEIP7702Authorizations(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  userOps: any[],
  signAuthorization: Sign7702Fn,
  walletAddress: string,
  addDebug?: (msg: string) => void
): Promise<Eip7702Authorization[]> {
  const { Signature } = await import("ethers");
  const authorizations: Eip7702Authorization[] = [];
  const nonceMap = new Map<number, string>();

  addDebug?.(`[7702] userOps=${userOps.length} wallet=${walletAddress.slice(0, 10)}...`);
  for (const userOp of userOps) {
    if (!userOp?.eip7702Auth || userOp?.eip7702Delegated) continue;
    const auth = userOp.eip7702Auth;
    const chainId = Number(userOp.chainId ?? auth.chainId);
    if (!Number.isFinite(chainId) || chainId <= 0 || chainId === 101) continue;
    const nonceKey = auth.nonce;
    let serialized = nonceMap.get(nonceKey);
    if (!serialized) {
      addDebug?.(`[7702] sign auth chain=${chainId} addr=${String(auth.address).slice(0, 10)}... nonce=${auth.nonce}`);
      const authorization = await signAuthorization(
        { contractAddress: auth.address as `0x${string}`, chainId, nonce: Number(auth.nonce) },
        { address: walletAddress }
      );
      addDebug?.(`[7702] got r=${String(authorization.r).slice(0, 18)}... s=${String(authorization.s).slice(0, 18)}... yParity=${authorization.yParity}`);
      // Particle demo: v ?? BigInt(yParity)
      const sig = Signature.from({
        r: authorization.r,
        s: authorization.s,
        v: authorization.v ?? BigInt(authorization.yParity),
        yParity: authorization.yParity as 0 | 1,
      });
      serialized = sig.serialized;
      addDebug?.(`[7702] serialized=${String(serialized).slice(0, 20)}... len=${serialized?.length ?? 0}`);
      nonceMap.set(auth.nonce, serialized);
    }
    if (serialized && userOp.userOpHash) {
      authorizations.push({ userOpHash: userOp.userOpHash, signature: serialized });
      addDebug?.(`[7702] auth userOpHash=${userOp.userOpHash.slice(0, 18)}...`);
    }
  }
  addDebug?.(`[7702] authorizations count=${authorizations.length}`);
  return authorizations;
}

/**
 * Extract EVM chains that need 7702 auth from a transaction's userOps.
 * Skips Solana (chain 101) - no 7702 there.
 * UA SDK may put userOps in tx.userOps or tx.feeQuotes[0].userOps.
 */
export function getChainsNeedingAuth(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tx: any
): number[] {
  let userOps = tx?.userOps;
  if (!Array.isArray(userOps) || userOps.length === 0) {
    userOps = tx?.feeQuotes?.[0]?.userOps;
  }
  if (!Array.isArray(userOps)) return [];

  const chainIds = new Set<number>();
  for (const op of userOps) {
    const auth = op?.eip7702Auth;
    const delegated = op?.eip7702Delegated;
    if (auth && !delegated) {
      const chainId = Number(op.chainId ?? auth.chainId);
      if (chainId > 0 && chainId !== 101) {
        chainIds.add(chainId);
      }
    }
  }
  return Array.from(chainIds);
}

/** USDC addresses per chain - same as Particle demo TransferCard */
const CHAIN_USDC: Record<number, string> = {
  1: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  10: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
  56: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
  137: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
  8453: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  42161: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
  43114: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
};

/**
 * Create delegation tx - use REAL transaction like Particle demo (USDC transfer to self).
 * Demo does createUniversalTransaction with expectTokens + ERC20 transfer. No-op fails AA24.
 */
export type AddDebugFn = (msg: string) => void;

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
  ownerAddress: string,
  addDebug?: AddDebugFn
): Promise<{ tx: unknown; chainsNeedingAuth: number[] } | null> {
  const usdcAddr = CHAIN_USDC[chainId];
  const { Interface, parseUnits } = await import("ethers");
  const erc20 = new Interface(["function transfer(address to, uint256 amount) returns (bool)"]);
  const amount6 = parseUnits("0.000001", 6);

  // 1. Try real USDC transfer like Particle demo (user needs 0.000001 USDC on chain)
  if (usdcAddr) {
    try {
      addDebug?.(`[7702] createUniversalTransaction USDC chain=${chainId}`);
      const tx = await universalAccount.createUniversalTransaction({
        chainId,
        expectTokens: [{ type: SUPPORTED_TOKEN_TYPE.USDC, amount: "0.000001" }],
        transactions: [
          { to: usdcAddr as `0x${string}`, data: erc20.encodeFunctionData("transfer", [ownerAddress, amount6]) },
        ],
      });
      const chains = getChainsNeedingAuth(tx);
      const uo = (tx as { userOps?: unknown[] })?.userOps ?? [];
      addDebug?.(`[7702] USDC tx userOps=${uo.length} chainsNeeding=${chains.join(",")}`);
      if (chains.length === 1 && chains[0] === chainId) {
        addDebug?.(`[7702] USDC transfer chain=${chainId} (demo-aligned)`);
        return { tx, chainsNeedingAuth: chains };
      }
      addDebug?.(`[7702] USDC multi-chain, try ETH fallback`);
    } catch (e) {
      addDebug?.(`[7702] USDC failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  // 2. Fallback: 1 wei ETH to self (user needs any ETH on chain)
  try {
    const tx = await universalAccount.createUniversalTransaction({
      chainId,
      expectTokens: [{ type: SUPPORTED_TOKEN_TYPE.ETH, amount: "0.000000000000000001" }],
      transactions: [{ to: ownerAddress as `0x${string}`, data: "0x", value: "0x1" }],
    });
    const chains = getChainsNeedingAuth(tx);
    if (chains.length === 1 && chains[0] === chainId) {
      addDebug?.(`[7702] ETH 1wei transfer chain=${chainId}`);
      return { tx, chainsNeedingAuth: chains };
    }
  } catch (err) {
    addDebug?.(`[7702] createDelegationOnlyTx failed: ${err instanceof Error ? err.message : String(err)}`);
    console.warn("[7702] createDelegationOnlyTx failed:", err);
  }
  return null;
}
