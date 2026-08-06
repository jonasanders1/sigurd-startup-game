/**
 * Scoring / multiplier tests.
 *
 * Locks in the bomb-scoring math and multiplier-progress curve from
 * game-specs §6 (scoring) and §6.x (multiplier thresholds). These are pure
 * functions, so they are cheap to pin down exactly.
 */

import { describe, it, expect } from "vitest";
import {
  calculateBombScore,
  calculateMultiplierProgress,
} from "./scoringUtils";
import { GAME_CONFIG } from "../types/constants";

const { BOMB_POINTS, MAX_MULTIPLIER, MULTIPLIER_THRESHOLDS } = GAME_CONFIG;

describe("calculateBombScore", () => {
  it("uses NORMAL base points for a non-firebomb", () => {
    const result = calculateBombScore(false, 1);
    expect(result.basePoints).toBe(BOMB_POINTS.NORMAL);
    expect(result.actualPoints).toBe(BOMB_POINTS.NORMAL);
    expect(result.isFirebomb).toBe(false);
  });

  it("uses FIREBOMB base points for a firebomb", () => {
    const result = calculateBombScore(true, 1);
    expect(result.basePoints).toBe(BOMB_POINTS.FIREBOMB);
    expect(result.isFirebomb).toBe(true);
  });

  it("multiplies base points by the multiplier", () => {
    const result = calculateBombScore(false, 3);
    expect(result.actualPoints).toBe(BOMB_POINTS.NORMAL * 3);
    expect(result.multiplier).toBe(3);
  });

  it("scales a firebomb at max multiplier", () => {
    const result = calculateBombScore(true, MAX_MULTIPLIER);
    expect(result.actualPoints).toBe(BOMB_POINTS.FIREBOMB * MAX_MULTIPLIER);
  });
});

describe("calculateMultiplierProgress", () => {
  it("reports full progress once at max multiplier", () => {
    expect(calculateMultiplierProgress(999999, MAX_MULTIPLIER)).toBe(1);
    // Even beyond max multiplier, still clamped to full.
    expect(calculateMultiplierProgress(0, MAX_MULTIPLIER + 1)).toBe(1);
  });

  it("is 0 at the start of a multiplier band", () => {
    // At exactly the current band's threshold, no progress yet toward the next.
    const atBand2Start = MULTIPLIER_THRESHOLDS[2];
    expect(calculateMultiplierProgress(atBand2Start, 2)).toBe(0);
  });

  it("is 0.5 halfway between two thresholds", () => {
    const lower = MULTIPLIER_THRESHOLDS[2];
    const upper = MULTIPLIER_THRESHOLDS[3];
    const midpoint = (lower + upper) / 2;
    expect(calculateMultiplierProgress(midpoint, 2)).toBeCloseTo(0.5, 10);
  });

  it("clamps below 0 when the score is under the current threshold", () => {
    expect(calculateMultiplierProgress(0, 2)).toBe(0);
  });

  it("clamps above 1 when the score overshoots the next threshold", () => {
    const beyondUpper = MULTIPLIER_THRESHOLDS[3] + 5000;
    expect(calculateMultiplierProgress(beyondUpper, 2)).toBe(1);
  });
});
