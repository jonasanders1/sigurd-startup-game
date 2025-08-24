import { GAME_CONFIG } from "../types/constants";

export interface ScoreCalculation {
  basePoints: number;
  actualPoints: number;
  multiplier: number;
  isFirebomb: boolean;
}

export const calculateBombScore = (
  isFirebomb: boolean,
  multiplier: number
): ScoreCalculation => {
  const basePoints = isFirebomb
    ? GAME_CONFIG.BOMB_POINTS.FIREBOMB
    : GAME_CONFIG.BOMB_POINTS.NORMAL;

  const actualPoints = basePoints * multiplier;

  return {
    basePoints,
    actualPoints,
    multiplier,
    isFirebomb,
  };
};

export const formatScoreLog = (calculation: ScoreCalculation): string => {
  const { actualPoints, isFirebomb, multiplier } = calculation;
  const bombType = isFirebomb ? "Firebomb" : "Normal";
  return `🎯 Score: +${actualPoints} (${bombType} x${multiplier})`;
};

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
