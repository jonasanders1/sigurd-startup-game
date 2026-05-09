/**
 * Founding Jack gravity look-up table.
 *
 * Per game-specs §4.1, §4.3: Jack's vertical motion is driven by an index
 * into a 128-entry table — NOT by a constant-acceleration physics model.
 *
 *   gravityIndex = 0   → maximum upward velocity (jump just initiated)
 *   gravityIndex = 64  → zero (apex / hover)
 *   gravityIndex = 127 → terminal downward velocity (3.5 px/f cap)
 *
 * The asymmetric curve (quadratic up, quadratic down) gives the game its
 * signature "hangs at apex, accelerates on descent" feel — the float/glide
 * mechanic snaps the index back to 64, restoring the apex hang.
 *
 * Values are EMPIRICAL per spec §4.3 / §19. The function shape matters more
 * than the exact entries; tune by feel against the reference emulator if
 * jump arcs end up off.
 */

import { getTuned, getTuningVersion } from "../stores/systems/tuningStore";

export const GRAVITY_LUT_SIZE = 128;
export const GRAVITY_APEX_INDEX = 64;
export const GRAVITY_TERMINAL_INDEX = GRAVITY_LUT_SIZE - 1;

/**
 * Per spec §4.3: vertical terminal velocity caps at 3.5 px/frame on the BJ
 * 256-tall screen. Scaled to our 600-tall canvas → ~4 px/f. Lower terminal
 * makes the descent LUT curve more perceptible (less of the fall is at
 * saturated terminal speed) — the "starts slow, then accelerates" shape
 * the spec describes.
 */
export const GRAVITY_TERMINAL_VY = 4;

/**
 * Initial upward velocity at the bottom of the LUT (gravityIndex = 0).
 * Spec sample LUT shows -0x300 = -3 px/f initial; scaled to our canvas this
 * lands around 8. Combined with reduced jump rates (JUMP_NORMAL_RATE=0.4,
 * JUMP_HIGH_RATE=0.28), normal still reaches ~3/4 screen and high still
 * touches the ceiling, while the launch feels less abrupt.
 */
export const GRAVITY_INITIAL_UP_VY = 8;

/**
 * Index to skip ahead to when DOWN is held in air (fast-fall). High enough
 * to be well past apex but below terminal so the player still has a beat
 * before reaching max fall speed.
 */
export const GRAVITY_FAST_FALL_INDEX = 100;

/**
 * Index used while float (SPACE held) is active. Slightly past apex so vy
 * is small but positive — produces a gentle downward drift instead of
 * perfect hover, preventing infinite-float exploits while still feeling
 * dramatically slower than free fall.
 *
 * At idx 76: vy ≈ 0.13 px/frame = ~7.6 px/sec at 60Hz. Tunable.
 */
export const GRAVITY_FLOAT_INDEX = 76;

// ─── Jump type init parameters (game-specs §4.4) ────────────────────────────

/**
 * The 3 BJ jump heights are produced from the same LUT by varying:
 *   - Starting gravity index (lower = higher peak)
 *   - Advance rate during ascent (slower = longer time before apex = higher
 *     peak)
 *
 * Pure data; consumed by PlayerManager via jumpInitParams().
 */
export type JumpType = "normal" | "high" | "short";

export interface JumpInitParams {
  /** LUT index to set on jump initiation. */
  startIdx: number;
  /** Multiplier applied to gravity-index advance during the ascending half
   *  (idx < APEX). Lower = higher peak. 1.0 = normal pace. */
  ascendAdvanceRate: number;
}

/**
 * Jump init params now read live from the tuning store so the panel can
 * adjust ascent rates / short-jump start index without a restart.
 */
export const jumpInitParams = (type: JumpType): JumpInitParams => {
  switch (type) {
    case "high":
      return { startIdx: 0, ascendAdvanceRate: getTuned("JUMP_HIGH_RATE") };
    case "short":
      return {
        startIdx: getTuned("JUMP_SHORT_START_IDX"),
        ascendAdvanceRate: 1.0,
      };
    case "normal":
    default:
      return { startIdx: 0, ascendAdvanceRate: getTuned("JUMP_NORMAL_RATE") };
  }
};

/**
 * Decide which jump type to perform given the input modifiers held at the
 * moment of jump press. Priority: short (↓+↑) > high (↑+SHIFT) > normal.
 * Down wins over Shift so a player who happens to hold both gets a short
 * jump (predictable: down is "less power").
 */
export interface JumpModifiers {
  fastFall: boolean; // DOWN held
  superJump: boolean; // SHIFT held
}
export const decideJumpType = (mods: JumpModifiers): JumpType => {
  if (mods.fastFall) return "short";
  if (mods.superJump) return "high";
  return "normal";
};

/**
 * Build the curve. Reads INITIAL_UP_VY and TERMINAL_VY from the tuning
 * store so live overrides take effect on the next cache miss (next call to
 * `getCurrentLUT`).
 *
 * - 0..APEX:        quadratic ease-out from -INITIAL_UP_VY → 0 (decelerates
 *                   smoothly, hangs near apex)
 * - APEX..TERMINAL: quadratic ease-in from 0 → +TERMINAL_VY (accelerates
 *                   smoothly into terminal)
 */
const buildLUT = (
  initialUpVy: number = GRAVITY_INITIAL_UP_VY,
  terminalVy: number = GRAVITY_TERMINAL_VY
): readonly number[] => {
  const out: number[] = new Array(GRAVITY_LUT_SIZE);
  for (let i = 0; i < GRAVITY_LUT_SIZE; i++) {
    if (i <= GRAVITY_APEX_INDEX) {
      const t = i / GRAVITY_APEX_INDEX;
      // (1 - t)^2 → 1 at t=0, 0 at t=1; negate for upward velocity.
      out[i] = -initialUpVy * (1 - t) * (1 - t);
    } else {
      const t =
        (i - GRAVITY_APEX_INDEX) /
        (GRAVITY_TERMINAL_INDEX - GRAVITY_APEX_INDEX);
      out[i] = terminalVy * t * t;
    }
  }
  return out;
};

/** Default LUT built with the canonical constants. Stable export for tests. */
export const GRAVITY_LUT: readonly number[] = buildLUT();

// ─── Live-tuning cache ────────────────────────────────────────────────────
// `gravityVelocityAt` reads through `getCurrentLUT`, which rebuilds when the
// tuning store version bumps. Idle frames pay one map lookup + one int
// compare — cheap.
let _cachedLUT: readonly number[] = GRAVITY_LUT;
let _cachedVersion = -1;

const getCurrentLUT = (): readonly number[] => {
  const v = getTuningVersion();
  if (v !== _cachedVersion) {
    _cachedLUT = buildLUT(
      getTuned("GRAVITY_INITIAL_UP_VY"),
      getTuned("GRAVITY_TERMINAL_VY")
    );
    _cachedVersion = v;
  }
  return _cachedLUT;
};

/**
 * Look up vy for a (possibly fractional) index. Clamps to [0, TERMINAL_INDEX].
 * Floors before lookup — sub-frame interpolation gives no audible benefit
 * given the smooth quadratic curve. Reads through `getCurrentLUT` so
 * tuning-panel changes to INITIAL_UP_VY / TERMINAL_VY take effect live.
 */
export const gravityVelocityAt = (index: number): number => {
  if (Number.isNaN(index)) return 0;
  const i = Math.max(0, Math.min(Math.floor(index), GRAVITY_TERMINAL_INDEX));
  return getCurrentLUT()[i];
};

/**
 * Advance the gravity index by one frame's worth of progression. With
 * deltaTime = 16.67 ms (60 Hz baseline), idx increases by 1.0; other refresh
 * rates scale proportionally so motion stays frame-rate independent.
 */
export const advanceGravityIndex = (
  index: number,
  deltaTimeMs: number
): number => {
  const frameRatio = deltaTimeMs / 16.67;
  return Math.min(index + frameRatio, GRAVITY_TERMINAL_INDEX);
};
