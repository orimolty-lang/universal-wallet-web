import type { IAssetsResponse } from "@particle-network/universal-account-sdk";
import type { MobulaPortfolioAsset } from "./mobulaAssetIdentity";
import {
  isMobulaDuplicateOfUaPrimaryStaple,
  mobulaAssetPositionKeys,
  positionKeysFromMergedShape,
  isPositionKeysDuplicateOfUaPrimaryStaple,
} from "./mobulaAssetIdentity";
import type { ParticleExternalAsset } from "../../lib/particle-balances";

/**
 * USD value of external (Mobula + Particle) holdings that the home `combinedAssets` memo would include,
 * excluding duplicates of UA primary staples.
 */
export function computeExternalPortfolioUsd(
  primaryAssets: IAssetsResponse,
  mobulaAssets: MobulaPortfolioAsset[],
  particleAssets: ParticleExternalAsset[],
): number {
  const fromMobula = mobulaAssets.filter((ma) => {
    if (ma.token_balance <= 0) return false;
    if (isMobulaDuplicateOfUaPrimaryStaple(ma, primaryAssets)) return false;
    return true;
  });

  const mobulaContractKeys = new Set<string>();
  for (const ma of fromMobula) {
    for (const k of mobulaAssetPositionKeys(ma)) {
      mobulaContractKeys.add(k);
    }
  }

  const fromParticle = particleAssets.filter((pa) => {
    if (pa.amount <= 0) return false;
    const pk = positionKeysFromMergedShape(pa);
    if (pk.length === 0) return false;
    if (pk.some((k) => mobulaContractKeys.has(k))) return false;
    if (isPositionKeysDuplicateOfUaPrimaryStaple(pa.symbol, pk, primaryAssets)) return false;
    return true;
  });

  const mobulaSum = fromMobula.reduce((s, ma) => s + (ma.estimated_balance || 0), 0);
  const particleSum = fromParticle.reduce((s, pa) => s + (pa.amountInUSD || 0), 0);
  return mobulaSum + particleSum;
}
