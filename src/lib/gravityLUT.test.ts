/**
 * Gravity LUT tests.
 *
 * Locks in the curve shape required by game-specs §4.3 — the apex hang and
 * terminal-velocity cap are what make Founding Jack feel like Founding Jack.
 */

import { describe, it, expect } from "vitest";
import {
  advanceGravityIndex,
  GRAVITY_APEX_INDEX,
  GRAVITY_INITIAL_UP_VY,
  GRAVITY_LUT,
  GRAVITY_LUT_SIZE,
  GRAVITY_TERMINAL_INDEX,
  GRAVITY_TERMINAL_VY,
  gravityVelocityAt,
} from "./gravityLUT";

describe("gravity LUT shape", () => {
  it("has exactly 128 entries", () => {
    expect(GRAVITY_LUT.length).toBe(GRAVITY_LUT_SIZE);
    expect(GRAVITY_LUT_SIZE).toBe(128);
  });

  it("starts at the negative INITIAL_UP_VY (max upward)", () => {
    expect(GRAVITY_LUT[0]).toBeCloseTo(-GRAVITY_INITIAL_UP_VY);
  });

  it("crosses zero at the apex index (64)", () => {
    expect(GRAVITY_APEX_INDEX).toBe(64);
    expect(GRAVITY_LUT[GRAVITY_APEX_INDEX]).toBeCloseTo(0);
  });

  it("ends at TERMINAL_VY — vertical terminal velocity (Sigurd default)", () => {
    expect(GRAVITY_LUT[GRAVITY_TERMINAL_INDEX]).toBeCloseTo(GRAVITY_TERMINAL_VY);
  });

  it("is monotonically non-decreasing across the table", () => {
    for (let i = 1; i < GRAVITY_LUT.length; i++) {
      expect(GRAVITY_LUT[i]).toBeGreaterThanOrEqual(GRAVITY_LUT[i - 1] - 1e-9);
    }
  });

  it("is negative throughout the ascending half (excl. apex)", () => {
    for (let i = 0; i < GRAVITY_APEX_INDEX; i++) {
      expect(GRAVITY_LUT[i]).toBeLessThan(0);
    }
  });

  it("is positive throughout the descending half", () => {
    for (let i = GRAVITY_APEX_INDEX + 1; i <= GRAVITY_TERMINAL_INDEX; i++) {
      expect(GRAVITY_LUT[i]).toBeGreaterThan(0);
    }
  });

  // Apex-hang test: the deceleration near apex should be slow. Concretely,
  // the change in vy in the last 8 ascending steps should be small compared
  // to the change in the first 8 steps.
  it("has an apex hang (slow change near index 64)", () => {
    const startStepsDelta = GRAVITY_LUT[8] - GRAVITY_LUT[0];
    const apexStepsDelta = GRAVITY_LUT[64] - GRAVITY_LUT[56];
    expect(apexStepsDelta).toBeLessThan(startStepsDelta);
  });
});

describe("gravityVelocityAt (lookup)", () => {
  it("returns the LUT entry for an integer index", () => {
    expect(gravityVelocityAt(0)).toBe(GRAVITY_LUT[0]);
    expect(gravityVelocityAt(64)).toBe(GRAVITY_LUT[64]);
    expect(gravityVelocityAt(127)).toBe(GRAVITY_LUT[127]);
  });

  it("floors fractional indices", () => {
    expect(gravityVelocityAt(63.7)).toBe(GRAVITY_LUT[63]);
    expect(gravityVelocityAt(64.3)).toBe(GRAVITY_LUT[64]);
  });

  it("clamps below zero to LUT[0]", () => {
    expect(gravityVelocityAt(-5)).toBe(GRAVITY_LUT[0]);
    expect(gravityVelocityAt(-100)).toBe(GRAVITY_LUT[0]);
  });

  it("clamps above the table to terminal velocity", () => {
    expect(gravityVelocityAt(128)).toBe(GRAVITY_LUT[GRAVITY_TERMINAL_INDEX]);
    expect(gravityVelocityAt(9999)).toBe(GRAVITY_LUT[GRAVITY_TERMINAL_INDEX]);
  });

  it("returns 0 for NaN (defensive)", () => {
    expect(gravityVelocityAt(NaN)).toBe(0);
  });
});

describe("advanceGravityIndex (frame-rate independence)", () => {
  it("advances by 1.0 per 16.67ms (60Hz baseline)", () => {
    expect(advanceGravityIndex(0, 16.67)).toBeCloseTo(1, 5);
    expect(advanceGravityIndex(10, 16.67)).toBeCloseTo(11, 5);
  });

  it("advances proportionally faster at lower frame rates", () => {
    // 33.34ms = 30Hz → 2 indices per frame to maintain real-time pacing
    expect(advanceGravityIndex(0, 33.34)).toBeCloseTo(2, 5);
  });

  it("advances proportionally slower at higher frame rates", () => {
    // 8.335ms ≈ 120Hz → half index per frame (16.67 / 2 ≈ 8.335)
    expect(advanceGravityIndex(0, 8.335)).toBeCloseTo(0.5, 5);
  });

  it("caps at TERMINAL_INDEX (no overshoot)", () => {
    expect(advanceGravityIndex(127, 16.67)).toBe(GRAVITY_TERMINAL_INDEX);
    expect(advanceGravityIndex(200, 16.67)).toBe(GRAVITY_TERMINAL_INDEX);
  });
});

describe("end-to-end: jump arc shape", () => {
  // Simulate a single 60Hz jump from idx=0. Velocity should:
  // 1. start at -INITIAL_UP_VY, 2. decelerate, 3. cross zero around idx 64,
  // 4. accelerate down, 5. cap at TERMINAL_VY by idx 127.
  it("produces the canonical arc when stepped at 60Hz", () => {
    let idx = 0;
    expect(gravityVelocityAt(idx)).toBeCloseTo(-GRAVITY_INITIAL_UP_VY);

    // Step forward 64 frames — should be at apex (vy ≈ 0)
    for (let i = 0; i < 64; i++) idx = advanceGravityIndex(idx, 16.67);
    expect(gravityVelocityAt(idx)).toBeCloseTo(0, 1);

    // Step forward 63 more frames — should be at terminal
    for (let i = 0; i < 63; i++) idx = advanceGravityIndex(idx, 16.67);
    expect(gravityVelocityAt(idx)).toBeCloseTo(GRAVITY_TERMINAL_VY, 5);
  });
});
