/**
 * Wedding Match default weights (cahier des charges §16). The table there
 * sums to 100% — kept as fractions of 1 here so scores compose cleanly.
 * These MUST stay configurable at runtime (per-deployment or per-experiment)
 * without touching the scoring engine itself — see `computeMatchScore`.
 */
export interface MatchWeights {
  budget: number;
  location: number;
  availability: number;
  style: number;
  weddingType: number;
  capacity: number;
  experience: number;
  reviews: number;
  preferences: number;
}

export const DEFAULT_MATCH_WEIGHTS: MatchWeights = {
  budget: 0.2,
  location: 0.15,
  availability: 0.2,
  style: 0.15,
  weddingType: 0.1,
  capacity: 0.05,
  experience: 0.05,
  reviews: 0.05,
  preferences: 0.05,
};

export function assertWeightsSumToOne(weights: MatchWeights, tolerance = 0.001): void {
  const sum = Object.values(weights).reduce((total, value) => total + value, 0);
  if (Math.abs(sum - 1) > tolerance) {
    throw new Error(`Match weights must sum to 1, got ${sum.toFixed(4)}`);
  }
}
