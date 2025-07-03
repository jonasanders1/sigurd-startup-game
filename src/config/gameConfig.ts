// Core game configuration
export const GAME_CONFIG = {
  // Canvas dimensions
  CANVAS_WIDTH: 800,
  CANVAS_HEIGHT: 600,
  
  // Physics
  GRAVITY: 0.3,
  FLOAT_GRAVITY: 0.005,
  
  // Game rules
  STARTING_LIVES: 3,
  
  // Development mode
  DEV_MODE: {
    ENABLED: false,
    TARGET_STATE: "START_MENU",
    MOCK_DATA: {
      score: 15000,
      lives: 2,
      currentLevel: 2,
      correctOrderCount: 18,
      multiplier: 2,
      multiplierScore: 2600,
    },
  },
};