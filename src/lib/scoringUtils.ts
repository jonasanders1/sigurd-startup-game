import { GAME_CONFIG } from "../types/constants";

export interface ScoreCalculation {
  basePoints: number;
  actualPoints: number;
  multiplier: number;
  isFirefounding: boolean;
}

export const calculateFoundingScore = (
  isFirefounding: boolean,
  multiplier: number
): ScoreCalculation => {
  const basePoints = isFirefounding
    ? GAME_CONFIG.FOUNDING_POINTS.FIREFOUNDING
    : GAME_CONFIG.FOUNDING_POINTS.NORMAL;

  const actualPoints = basePoints * multiplier;

  return {
    basePoints,
    actualPoints,
    multiplier,
    isFirefounding,
  };
};

export const formatScoreLog = (calculation: ScoreCalculation): string => {
  const { actualPoints, isFirefounding, multiplier } = calculation;
  const foundingType = isFirefounding ? "Firefounding" : "Normal";
  return `🎯 Score: +${actualPoints} (${foundingType} x${multiplier})`;
};

/**
 * Format a score pop-up. When the multiplier is greater than 1, show the
 * formula (`200 × 5`) so the player can see *why* their score jumped.
 * At 1× we drop the suffix to keep low-multiplier pop-ups uncluttered.
 */
export const formatScoreText = (
  basePoints: number,
  multiplier: number
): string =>
  multiplier > 1 ? `${basePoints} × ${multiplier}` : `${basePoints}`;

export const calculateMultiplierProgress = (
  multiplierScore: number,
  currentMultiplier: number
): number => {
  const { MULTIPLIER_THRESHOLDS, MAX_MULTIPLIER } = GAME_CONFIG;

  // If we're at max multiplier, show 100% progress
  if (currentMultiplier >= MAX_MULTIPLIER) {
    return 1;
  }

  // Calculate progress to next multiplier
  const currentThreshold =
    MULTIPLIER_THRESHOLDS[
      currentMultiplier as keyof typeof MULTIPLIER_THRESHOLDS
    ];
  const nextThreshold =
    MULTIPLIER_THRESHOLDS[
      (currentMultiplier + 1) as keyof typeof MULTIPLIER_THRESHOLDS
    ];

  if (!nextThreshold) {
    return 1; // No next threshold, so we're at max
  }

  const progress =
    (multiplierScore - currentThreshold) / (nextThreshold - currentThreshold);
  return Math.max(0, Math.min(1, progress)); // Clamp between 0 and 1
};
