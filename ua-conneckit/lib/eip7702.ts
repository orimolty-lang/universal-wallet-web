/**
 * EIP-7702 helpers - exact copy from Particle universal-accounts-7702 example.
 * https://github.com/Particle-Network/universal-accounts-7702
 */

import { Signature } from "ethers";
import type { UniversalAccount } from "@particle-network/universal-account-sdk";

/** Get EIP-7702 deployment status from UA SDK (for Settings UI) */
export async function getEIP7702Deployments(universalAccount: UniversalAccount): Promise<unknown> {
  try {
    return await universalAccount.getEIP7702Deployments();
  } catch (err) {
    console.warn("[7702] getEIP7702Deployments failed:", err);
    return null;
  }
}

type EIP7702Authorization = {
  userOpHash: string;
  signature: string;
};

type UserOp = {
  userOpHash: string;
  eip7702Auth?: {
    address: string;
    chainId: number;
    nonce: number;
  };
  eip7702Delegated?: boolean;
};

type SignAuthorizationFn = (
  params: {
    contractAddress: `0x${string}`;
    chainId: number;
    nonce: number;
  },
  options: {
    address: string;
  }
) => Promise<{
  r: string;
  s: string;
  v?: bigint;
  yParity: number;
}>;

/**
 * Handles EIP-7702 authorization for user operations.
 * Exact implementation from Particle example.
 */
export async function handleEIP7702Authorizations(
  userOps: UserOp[],
  signAuthorization: SignAuthorizationFn,
  walletAddress: string
): Promise<EIP7702Authorization[]> {
  const authorizations: EIP7702Authorization[] = [];
  const nonceMap = new Map<number, string>();

  for (const userOp of userOps) {
    if (!!userOp.eip7702Auth && !userOp.eip7702Delegated) {
      let signatureSerialized = nonceMap.get(userOp.eip7702Auth.nonce);

      if (!signatureSerialized) {
        const authorization = await signAuthorization(
          {
            contractAddress: userOp.eip7702Auth.address as `0x${string}`,
            chainId: Number(userOp.eip7702Auth.chainId),
            nonce: userOp.eip7702Auth.nonce,
          },
          {
            address: walletAddress,
          }
        );

        const sig = Signature.from({
          r: authorization.r,
          s: authorization.s,
          v: authorization.v ?? BigInt(authorization.yParity),
          yParity: authorization.yParity as 0 | 1,
        });
        signatureSerialized = sig.serialized;
        nonceMap.set(userOp.eip7702Auth.nonce, signatureSerialized);
      }

      if (signatureSerialized) {
        authorizations.push({
          userOpHash: userOp.userOpHash,
          signature: signatureSerialized,
        });
      }
    }
  }

  return authorizations;
}

/** Extract userOps from tx - supports tx.userOps or tx.feeQuotes[0].userOps */
export function getUserOpsFromTx(tx: { userOps?: unknown[]; feeQuotes?: { userOps?: unknown[] }[] }): unknown[] {
  const userOps = tx?.userOps;
  if (Array.isArray(userOps) && userOps.length > 0) return userOps;
  const fromFeeQuotes = tx?.feeQuotes?.[0]?.userOps;
  return Array.isArray(fromFeeQuotes) ? fromFeeQuotes : [];
}

/** Get chains needing 7702 auth (for Settings delegation UI) */
export function getChainsNeedingAuth(tx: { userOps?: unknown[]; feeQuotes?: { userOps?: unknown[] }[] }): number[] {
  const userOps = getUserOpsFromTx(tx);
  const chainIds = new Set<number>();
  for (const op of userOps) {
    const o = op as { eip7702Auth?: { chainId?: number }; eip7702Delegated?: boolean; chainId?: number };
    if (o?.eip7702Auth && !o?.eip7702Delegated) {
      const chainId = Number(o.chainId ?? o.eip7702Auth.chainId);
      if (chainId > 0 && chainId !== 101) chainIds.add(chainId);
    }
  }
  return Array.from(chainIds);
}

/** USDC addresses per chain - for delegation tx (Settings) */
const CHAIN_USDC: Record<number, string> = {
  1: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  10: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
  56: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
  137: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
  8453: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  42161: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
  43114: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
};

/** Create delegation tx - USDC transfer to self (like example TransferCard) */
export async function createDelegationOnlyTx(
  universalAccount: UniversalAccount,
  chainId: number,
  ownerAddress: string
): Promise<{ tx: unknown; chainsNeedingAuth: number[] } | null> {
  const { Interface, parseUnits } = await import("ethers");
  const { SUPPORTED_TOKEN_TYPE } = await import("@particle-network/universal-account-sdk");
  const usdcAddr = CHAIN_USDC[chainId];
  if (!usdcAddr) return null;

  const erc20 = new Interface(["function transfer(address to, uint256 amount) returns (bool)"]);
  const amount6 = parseUnits("0.000001", 6);

  try {
    const tx = await universalAccount.createUniversalTransaction({
      chainId,
      expectTokens: [{ type: SUPPORTED_TOKEN_TYPE.USDC, amount: "0.000001" }],
      transactions: [
        { to: usdcAddr as `0x${string}`, data: erc20.encodeFunctionData("transfer", [ownerAddress, amount6]) },
      ],
    });
    const chains = getChainsNeedingAuth(tx as Parameters<typeof getChainsNeedingAuth>[0]);
    if (chains.length >= 1) {
      return { tx, chainsNeedingAuth: chains };
    }
  } catch {
    // fallback: 1 wei ETH to self
    try {
      const tx = await universalAccount.createUniversalTransaction({
        chainId,
        expectTokens: [{ type: SUPPORTED_TOKEN_TYPE.ETH, amount: "0.000000000000000001" }],
        transactions: [{ to: ownerAddress as `0x${string}`, data: "0x", value: "0x1" }],
      });
      const chains = getChainsNeedingAuth(tx as Parameters<typeof getChainsNeedingAuth>[0]);
      if (chains.length >= 1) return { tx, chainsNeedingAuth: chains };
    } catch {
      /* ignore */
    }
  }
  return null;
}
