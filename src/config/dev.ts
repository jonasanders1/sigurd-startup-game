/**
 * Development mode configuration
 * Contains settings for development and debugging features
 */

interface LevelHistoryMock {
  level: number;
  mapName: string;
  correctOrderCount: number;
  totalBombs: number;
  score: number;
  bonus: number;
  hasBonus: boolean;
  coinsCollected: number;
  powerModeActivations: number;
  completionTime?: number;
  timestamp: number;
  lives: number;
  multiplier: number;
  isPartial?: boolean;
}

export const DEV_CONFIG = {
  ENABLED: false, // Set to false to disable dev mode

  // Game state configuration
  TARGET_STATE: "PLAYING", // Options: 'START_MENU', 'COUNTDOWN', 'PLAYING', 'PAUSED', 'SETTINGS', 'BONUS', 'VICTORY', 'GAME_OVER'
  TARGET_LEVEL: 5, // Which level to load in dev mode (1-7, corresponds to mapDefinitions index + 1)

  // Debug features
  GOD_MODE: false, // Set to true to enable god mode (player is invincible to monsters)
  SKIP_AUDIO_SETTINGS_WAIT: true, // Set to true to skip waiting for audio settings from host

  // Mock data for testing
  MOCK_DATA: {
    score: 42500, // Total score from all levels
    lives: 0, // 0 lives = game over
    currentLevel: 3, // Failed on level 3
    correctOrderCount: 35, // Total correct orders across all levels
    multiplier: 2, // Mock multiplier level (1-5)
    multiplierScore: 1200, // Mock points toward next multiplier (0-1800)

    // Mock level history for game over screen
    levelHistory: [
      {
        level: 1,
        mapName: "startup lab",
        correctOrderCount: 15,
        totalBombs: 15,
        score: 12500,
        bonus: 30000,
        hasBonus: true,
        coinsCollected: 2,
        powerModeActivations: 2,
        completionTime: 125000, // 2 min 5 sec
        timestamp: Date.now() - 300000,
        lives: 3,
        multiplier: 1,
        isPartial: false,
      },
      {
        level: 2,
        mapName: "innovasjon norge",
        correctOrderCount: 20,
        totalBombs: 20,
        score: 18500,
        bonus: 50000,
        hasBonus: true,
        coinsCollected: 62,
        powerModeActivations: 3,
        completionTime: 145000, // 2 min 25 sec
        timestamp: Date.now() - 150000,
        lives: 2,
        multiplier: 2,
        isPartial: false,
      },
      {
        level: 3,
        mapName: "skatteetaten",
        correctOrderCount: 8,
        totalBombs: 12,
        score: 8500,
        bonus: 0,
        hasBonus: false,
        coinsCollected: 28,
        powerModeActivations: 1,
        // No completionTime for partial/failed level
        timestamp: Date.now() - 10000,
        lives: 0,
        multiplier: 2,
        isPartial: true, // Failed level
      },
    ],
  },

  COLORS: {
    BACKGROUND: "#333",
    PLATFORM: "#555",
    GROUND: "#777",
  }, // Options: 'DARK', 'LIGHT'
} as const;

// Set global dev logging flag
if (typeof window !== "undefined") {
  (window as any).__DEV_LOGGING_ENABLED__ = DEV_CONFIG.ENABLED;
}
