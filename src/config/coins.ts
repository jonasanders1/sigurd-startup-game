/**
 * Coin system configuration
 * Contains all coin-related settings including physics, spawning, and effects
 */

export const COIN_PHYSICS = {
  BOUNCE_SPEED: 3, // Initial speed when coin bounces
  BOUNCE_DAMPING: 0.8, // How much the coin slows down on bounce
  GRAVITY: 0.1, // Gravity affecting coins (reduced for moon-like physics)
} as const;

export const COIN_SPAWNING = {
  // Spawning intervals
  // BJ canonical: "P-coin every 9 firebombs". With weighted tokens
  // (firebomb=2, normal=1), threshold 18 means 9 firebombs alone = 1 P-coin
  // and 18 normal bombs = 1 P-coin (the "twice as many for firebombs" rule).
  POWER_COIN_SPAWN_INTERVAL: 18,
  POWER_COIN_MAX_PER_LEVEL: 2, // BJ: max 2 P-coin spawns per level (game-specs §7.1)
  BONUS_COIN_SPAWN_INTERVAL: 5000, // B-coin: every 5000 points of total score
  BONUS_COIN_MAX_PER_LEVEL: 5, // BJ: max 5 B-coin spawns per level
  EXTRA_LIFE_COIN_RATIO: 8, // E-coin: every 8 B-coins collected (with death-generosity)
  EXTRA_LIFE_DEATH_GENEROSITY: 2, // Each life lost adds this many credits toward next E-coin
  // F-coin (Founder Mode): rolled once per RUN at game start. If hit, picks
  // a random target level in [F_COIN_MIN_LEVEL .. F_COIN_MAX_LEVEL] and
  // schedules a single spawn during that level. Hard cap of 2 spawns per
  // run as defense in depth (very rarely reached at the default 5% rate).
  F_COIN_RUN_CHANCE: 0.05,
  F_COIN_MIN_LEVEL: 2, // Rookie gate — never spawns on level 1.
  F_COIN_MAX_LEVEL: 8,
  F_COIN_RUN_CAP: 2,
  // F-coin spawns when the Nth bomb of the target level is collected, where
  // N is randomly chosen in [F_COIN_TRIGGER_MIN_BOMB..F_COIN_TRIGGER_MAX_BOMB]
  // at level start. Default range is the full level (1..23) — fully random
  // across all bomb collections so the spawn moment is unpredictable.
  F_COIN_TRIGGER_MIN_BOMB: 1,
  F_COIN_TRIGGER_MAX_BOMB: 23,
} as const;

export const COIN_EFFECTS = {
  // Power coin
  POWER_COIN_DURATION: 7000, // Power coin effect duration in milliseconds (7 seconds)
  POWER_COIN_POINTS: 2000, // Points awarded for collecting power coin
  MONSTER_KILL_POINTS: 100, // Points for killing monsters during power mode

  // Other coins
  BONUS_MULTIPLIER_COIN_POINTS: 1000, // Base points for bonus multiplier coin
  EXTRA_LIFE_COIN_POINTS: 1000, // Base points for extra life coin
} as const;
