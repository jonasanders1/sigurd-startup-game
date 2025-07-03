// Scoring configuration
export const SCORING_CONFIG = {
  // Multiplier system
  MULTIPLIER: {
    THRESHOLDS: {
      1: 0,     // 1x multiplier (default)
      2: 1800,  // 2x multiplier (1800 points needed)
      3: 3600,  // 3x multiplier (1800 more points = 3600 total)
      4: 5400,  // 4x multiplier (1800 more points = 5400 total)
      5: 7200,  // 5x multiplier (1800 more points = 7200 total)
    },
    MAX: 5,
    THRESHOLD_INCREMENT: 1800,
  },
  
  // Bonus points for completing levels with all bombs
  BONUS_POINTS: {
    23: 50000,  // All bombs collected
    22: 30000,
    21: 20000,
    20: 10000,
  },
  
  // Base scoring values (others are in entityConfig)
  BASE_POINTS: {
    LEVEL_COMPLETE: 1000,
    TIME_BONUS_PER_SECOND: 10,
  },
};