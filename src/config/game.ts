/**
 * Core game configuration
 * Contains fundamental game settings for canvas, physics, and movement
 */

export const CANVAS_CONFIG = {
  WIDTH: 800,
  HEIGHT: 600,
} as const;

export const GAME_LOOP = {
  // Hard cap on the per-frame delta fed to physics/AI (ms). rAF suspends in
  // background tabs, so the first frame after returning can carry a multi-
  // second delta — unclamped, that scales every per-frame value by delta/16.67
  // in a single discrete AABB step (player tunnels through platforms, coins
  // skip their landing window). 50ms ≈ 3 baseline frames: big enough to
  // absorb normal jitter/GC pauses, small enough that no entity crosses a
  // 25px platform in one step at game speeds.
  MAX_FRAME_DELTA_MS: 50,
} as const;

export const PHYSICS_CONFIG = {
  // Gravity settings - Moon-like physics
  GRAVITY: 0.2,
  FLOAT_GRAVITY: 0.005, // Reduced for slower floating fall
  FAST_FALL_GRAVITY_MULTIPLIER: 2, // Multiplier when fast falling

  // Movement
  MOVE_SPEED: 4,
  JUMP_POWER: 7,
  SUPER_JUMP_POWER: 12,

  // Jump mechanics
  MIN_JUMP_DURATION: 50, // Minimum time for a jump (ms)
  MAX_JUMP_DURATION: 300, // Maximum time for variable jump height (ms)

  // Jump feel (both delta-driven, pause-safe):
  // Coyote time — grace window after walking off a ledge during which a jump
  // press still fires, so edge jumps don't feel unfairly dropped.
  COYOTE_TIME_MS: 90,
  // Jump buffer — a press this close before landing fires on touchdown.
  // Bounded on purpose: the old behavior buffered a held mid-air press
  // forever and auto-fired it on landing no matter how much later.
  JUMP_BUFFER_MS: 100,
} as const;

export const GAME_RULES = {
  TOTAL_FOUNDINGS: 23, // Sigurd's canonical (was 24 BJ-canonical; reverted per design)
  STARTING_LIVES: 3,
  // BJ HUD constraint — Jack icons must fit on screen. E-coin grants +1 life
  // capped here. (game-specs §11)
  MAX_LIVES: 9,
} as const;

export const RENDERING_CONFIG = {
  USE_SPRITES: true,
} as const;
