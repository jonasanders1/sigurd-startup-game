import { AudioSettings } from "@/stores/slices/audioSettingsSlice";

export const GAME_CONFIG = {
  CANVAS_WIDTH: 800,
  CANVAS_HEIGHT: 600,
  PLAYER_HEIGHT: 35,
  PLAYER_WIDTH: 25,
  BOMB_SIZE: 25,
  MONSTER_SIZE: 18,
  PLATFORM_HEIGHT: 15,
  COIN_SIZE: 20, // Size of coins
  USE_SPRITES: true,
  PARALLAX_ENABLED: true, // Re-enabled parallax with fixed implementation

  // Physics - Reduced for moon-like gravity
  GRAVITY: 0.3,
  FLOAT_GRAVITY: 0.005, // Reduced from 0.1 for much slower floating fall
  MOVE_SPEED: 4,
  JUMP_POWER: 8,
  SUPER_JUMP_POWER: 12,

  // Coin physics
  COIN_BOUNCE_SPEED: 3, // Initial speed when coin bounces
  COIN_BOUNCE_DAMPING: 0.8, // How much the coin slows down on bounce
  COIN_GRAVITY: 0.2, // Gravity affecting coins

  // Jump mechanics
  MIN_JUMP_DURATION: 50, // Minimum time for a jump (ms)
  MAX_JUMP_DURATION: 300, // Maximum time for variable jump height (ms)

  // Game rules
  TOTAL_BOMBS: 23,
  STARTING_LIVES: 3,

  // Coin spawning rules
  POWER_COIN_SPAWN_INTERVAL: 9, // Power coin appears after every 9 firebombs
  BONUS_COIN_SPAWN_INTERVAL: 5000, // Bonus multiplier coin appears every 5000 points
  EXTRA_LIFE_COIN_RATIO: 10, // Extra life coin appears for every 10 bonus multiplier coins

  // Coin effects
  POWER_COIN_DURATION: 7000, // Power coin effect duration in milliseconds (7 seconds)
  POWER_COIN_POINTS: 2000, // Points awarded for collecting power coin
  MONSTER_KILL_POINTS: 100, // Points for killing monsters during power mode

  // Coin base points
  BONUS_MULTIPLIER_COIN_POINTS: 1000, // Base points for bonus multiplier coin
  EXTRA_LIFE_COIN_POINTS: 1000, // Base points for extra life coin

  // Multiplier system - incremental thresholds
  MULTIPLIER_THRESHOLDS: {
    1: 0, // 1x multiplier (default)
    2: 1800, // 2x multiplier (1800 points needed)
    3: 3600, // 3x multiplier (1800 more points needed = 3600 total)
    4: 5400, // 4x multiplier (1800 more points needed = 5400 total)
    5: 7200, // 5x multiplier (1800 more points needed = 7200 total)
  },
  MAX_MULTIPLIER: 5,

  // Scoring
  BOMB_POINTS: {
    NORMAL: 100, // Normal bomb base points
    FIREBOMB: 200, // Firebomb (next correct bomb) base points
  },

  // Bonus points
  BONUS_POINTS: {
    23: 50000,
    22: 30000,
    21: 20000,
    20: 10000,
  },
};

export const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  masterVolume: 80,
  musicVolume: 70,
  sfxVolume: 90,
  masterMuted: true,
  musicMuted: true,
  sfxMuted: true,
};

// Development Mode Configuration
export const DEV_CONFIG = {
  ENABLED: false, // Set to false to disable dev mode
  TARGET_STATE: "PLAYING", // Options: 'START_MENU', 'COUNTDOWN', 'PLAYING', 'PAUSED', 'SETTINGS', 'BONUS', 'VICTORY', 'GAME_OVER'
  TARGET_LEVEL: 2, // Which level to load in dev mode (1-6, corresponds to mapDefinitions index + 1)
  // Available levels:
  // 1: Bomb Jack Level 1 (classic)
  // 2: Bomb Jack Level 2 (advanced) 
  // 3: Bomb Jack Level 3 (maze)
  // 4: Bomb Jack Level 4 (tower)
  // 5: NAV (research)
  // 6: Skatteetaten (environment)
  
  MOCK_DATA: {
    score: 15000,
    lives: 2,
    currentLevel: 2,
    correctOrderCount: 18,
    multiplier: 2, // Mock multiplier level (1-5)
    multiplierScore: 2600, // Mock points toward next multiplier (0-1800)
  },
};

export const COLORS = {
  PLAYER: "#00FF00",
  BOMB: "#FFD700",
  BOMB_COLLECTED: "#666666",
  BOMB_NEXT: "#FF0000",
  MONSTER: "#FF4444",
  MONSTER_FROZEN: "#4444FF", // Blue color for frozen monsters
  PLATFORM: "#484744",
  BACKGROUND: "#262521",
  GROUND: "#484744",
  UI_PRIMARY: "#00FFFF",
  UI_SECONDARY: "#FFFFFF",
  COIN_POWER: "#0066FF", // Blue for power coin
  COIN_BONUS: "#FF6600", // Orange for bonus multiplier coin
  COIN_LIFE: "#FF0066", // Pink for extra life coin
};
