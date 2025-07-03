// Entity configuration
export const ENTITY_CONFIG = {
  // Player
  PLAYER: {
    WIDTH: 25,
    HEIGHT: 40,
    MOVE_SPEED: 4,
    JUMP_POWER: 8,
    SUPER_JUMP_POWER: 12,
    MIN_JUMP_DURATION: 50, // ms
    MAX_JUMP_DURATION: 300, // ms
  },
  
  // Bombs
  BOMB: {
    SIZE: 16,
    TOTAL_COUNT: 23,
    POINTS: {
      NORMAL: 100,
      FIREBOMB: 200,
    },
  },
  
  // Monsters
  MONSTER: {
    SIZE: 18,
    DEFAULT_SPEED: 1,
    KILL_POINTS: 100,
  },
  
  // Coins
  COIN: {
    SIZE: 20,
    GRAVITY: 0.2,
    BOUNCE_SPEED: 3,
    BOUNCE_DAMPING: 0.8,
    SPAWN_INTERVALS: {
      POWER: 9, // After every 9 firebombs
      BONUS_MULTIPLIER: 5000, // Every 5000 points
      EXTRA_LIFE: 10, // Every 10 bonus multiplier coins
    },
    POINTS: {
      POWER: 2000,
      BONUS_MULTIPLIER: 1000,
      EXTRA_LIFE: 1000,
    },
    EFFECTS: {
      POWER_DURATION: 7000, // 7 seconds
    },
  },
  
  // Platforms
  PLATFORM: {
    HEIGHT: 20,
  },
};