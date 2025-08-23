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
  POWER_COIN_SPAWN_INTERVAL: 9, // Power coin appears after every 9 firebombs
  BONUS_COIN_SPAWN_INTERVAL: 5000, // Bonus multiplier coin appears every 5000 points
  EXTRA_LIFE_COIN_RATIO: 10, // Extra life coin appears for every 10 bonus multiplier coins
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