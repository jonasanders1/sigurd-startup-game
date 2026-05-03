/**
 * 3-jump-type tests (game-specs §4.4).
 *
 * The spec requires three distinct heights produced from a single LUT:
 *  - Jump only (↑)         → normal (~3/4 screen)
 *  - ↑ + SHIFT             → high (full screen, slower ascent)
 *  - ↓ + ↑                 → short (~1/2 screen, starts past initial peak)
 *
 * These tests pin down the decision logic and the resulting arc shapes.
 */

import { describe, it, expect } from "vitest";
import {
  advanceGravityIndex,
  decideJumpType,
  GRAVITY_APEX_INDEX,
  gravityVelocityAt,
  jumpInitParams,
} from "./gravityLUT";

describe("decideJumpType (input modifier priority)", () => {
  it("returns normal when no modifiers held", () => {
    expect(decideJumpType({ fastFall: false, superJump: false })).toBe("normal");
  });

  it("returns high when only SHIFT held", () => {
    expect(decideJumpType({ fastFall: false, superJump: true })).toBe("high");
  });

  it("returns short when only DOWN held", () => {
    expect(decideJumpType({ fastFall: true, superJump: false })).toBe("short");
  });

  // Down "wins" over Shift — predictable since down is the "less power" cue
  // (it's also fast-fall when in air). Player who happens to hold both
  // fingers gets a short jump, not a high one.
  it("returns short when BOTH DOWN and SHIFT held (down wins)", () => {
    expect(decideJumpType({ fastFall: true, superJump: true })).toBe("short");
  });
});

describe("jumpInitParams (LUT entry-point per type)", () => {
  it("normal jump starts at LUT[0] with full advance rate", () => {
    const p = jumpInitParams("normal");
    expect(p.startIdx).toBe(0);
    expect(p.ascendAdvanceRate).toBe(1.0);
  });

  it("high jump starts at LUT[0] but ascends slower (rate < 1)", () => {
    const p = jumpInitParams("high");
    expect(p.startIdx).toBe(0);
    expect(p.ascendAdvanceRate).toBeLessThan(1);
    expect(p.ascendAdvanceRate).toBeGreaterThan(0);
  });

  it("short jump starts past initial peak (idx ~16) with full advance rate", () => {
    const p = jumpInitParams("short");
    expect(p.startIdx).toBeGreaterThan(0);
    expect(p.startIdx).toBeLessThan(GRAVITY_APEX_INDEX);
    expect(p.ascendAdvanceRate).toBe(1.0);
  });
});

// Integration check: simulate the ascending half of each jump type and
// compare peak height (cumulative |vy| from start to apex). High > normal > short.
describe("jump arc peaks (spec §4.4 height ranking)", () => {
  // Approximate ascending-phase peak by summing -vy per frame until idx >= APEX.
  // Returns positive number = total upward displacement at apex.
  const simulatePeak = (type: "normal" | "high" | "short"): number => {
    const params = jumpInitParams(type);
    let idx = params.startIdx;
    let totalUp = 0;
    let safety = 1000; // hard ceiling against runaway loop
    while (idx < GRAVITY_APEX_INDEX && safety-- > 0) {
      const vy = gravityVelocityAt(idx);
      totalUp += -vy; // vy is negative ascending, totalUp accumulates positive
      idx = advanceGravityIndex(idx, 16.67 * params.ascendAdvanceRate);
    }
    return totalUp;
  };

  it("high jump peaks higher than normal jump", () => {
    expect(simulatePeak("high")).toBeGreaterThan(simulatePeak("normal"));
  });

  it("short jump peaks lower than normal jump", () => {
    expect(simulatePeak("short")).toBeLessThan(simulatePeak("normal"));
  });

  // Locks in the relative gap: high should produce a meaningfully larger peak
  // (≥10% above normal), not a trivial difference.
  it("high jump exceeds normal by at least 10%", () => {
    const normal = simulatePeak("normal");
    const high = simulatePeak("high");
    expect(high / normal).toBeGreaterThan(1.1);
  });

  // Short jump should be a noticeably weaker hop. With JUMP_SHORT_START_IDX
  // = 35 (Sigurd default), it skips most of the strong upward LUT entries,
  // landing in the low-single-digit % range vs. a normal jump.
  it("short jump is meaningfully shorter than normal", () => {
    const normal = simulatePeak("normal");
    const short = simulatePeak("short");
    const ratio = short / normal;
    expect(ratio).toBeGreaterThan(0.02);
    expect(ratio).toBeLessThan(0.5);
  });
});
