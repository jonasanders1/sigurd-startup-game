/**
 * Scoring system configuration
 * Contains points, multipliers, and bonus settings
 */

export const BOMB_POINTS = {
  NORMAL: 100, // Normal bomb base points
  FIREBOMB: 200, // Firebomb (next correct bomb) base points
} as const;

export const MULTIPLIER_SYSTEM = {
  // Incremental thresholds for multiplier levels
  THRESHOLDS: {
    1: 0, // 1x multiplier (default)
    2: 1800, // 2x multiplier (1800 points needed)
    3: 3600, // 3x multiplier (1800 more points = 3600 total)
    4: 5400, // 4x multiplier (1800 more points = 5400 total)
    5: 7200, // 5x multiplier (1800 more points = 7200 total)
  },
  MAX_MULTIPLIER: 5,
  POINTS_PER_LEVEL: 1800, // Points needed to advance to next multiplier level
} as const;

export const BONUS_POINTS = {
  // End-of-level bonuses based on remaining bombs
  23: 50000, // Perfect score - all bombs collected
  22: 30000,
  21: 20000,
  20: 10000,
} as const;