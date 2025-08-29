/**
 * Core game configuration
 * Contains fundamental game settings for canvas, physics, and movement
 */

export const CANVAS_CONFIG = {
  WIDTH: 800,
  HEIGHT: 600,
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
} as const;

export const GAME_RULES = {
  TOTAL_BOMBS: 23,
  STARTING_LIVES: 3,
} as const;

export const RENDERING_CONFIG = {
  USE_SPRITES: true,
} as const;
