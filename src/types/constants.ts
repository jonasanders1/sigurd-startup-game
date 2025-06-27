
export const GAME_CONFIG = {
    CANVAS_WIDTH: 800,
    CANVAS_HEIGHT: 600,
    PLAYER_SIZE: 20,
    BOMB_SIZE: 16,
    MONSTER_SIZE: 18,
    PLATFORM_HEIGHT: 20,
    
    // Physics - Reduced for moon-like gravity
    GRAVITY: 0.3,
    FLOAT_GRAVITY: 0.005, // Reduced from 0.1 for much slower floating fall
    MOVE_SPEED: 4,
    JUMP_POWER: 8,
    SUPER_JUMP_POWER: 12,
    
    // Jump mechanics
    MIN_JUMP_DURATION: 50, // Minimum time for a jump (ms)
    MAX_JUMP_DURATION: 300, // Maximum time for variable jump height (ms)
    
    // Game rules
    TOTAL_BOMBS: 23,
    STARTING_LIVES: 3,
    
    // Bonus points
    BONUS_POINTS: {
      23: 50000,
      22: 30000,
      21: 20000,
      20: 10000
    }
  };
  
  // Development Mode Configuration
  export const DEV_CONFIG = {
    ENABLED: true, // Set to false to disable dev mode
    TARGET_STATE: 'GAME_OVER', // Options: 'START_MENU', 'COUNTDOWN', 'PLAYING', 'BONUS', 'VICTORY', 'GAME_OVER'
    MOCK_DATA: {
      score: 15000,
      lives: 2,
      currentLevel: 3,
      correctOrderCount: 18
    }
  };
  
  export const COLORS = {
    PLAYER: '#00FF00',
    BOMB: '#FFD700',
    BOMB_COLLECTED: '#666666',
    BOMB_NEXT: '#FF0000',
    MONSTER: '#FF4444',
    PLATFORM: '#484744',
    BACKGROUND: '#262521',
    GROUND: '#484744',
    UI_PRIMARY: '#00FFFF',
    UI_SECONDARY: '#FFFFFF'
  };