/**
 * Development mode configuration
 * Contains settings for development and debugging features
 */

export const DEV_CONFIG = {
  ENABLED: false, // Set to false to disable dev mode

  // Game state configuration
  TARGET_STATE: "PLAYING", // Options: 'START_MENU', 'COUNTDOWN', 'PLAYING', 'PAUSED', 'SETTINGS', 'BONUS', 'VICTORY', 'GAME_OVER'
  TARGET_LEVEL: 1, // Which level to load in dev mode (1-7, corresponds to mapDefinitions index + 1)

  // Debug features
  GOD_MODE: false, // Set to true to enable god mode (player is invincible to monsters)
  SKIP_AUDIO_SETTINGS_WAIT: false, // Set to true to skip waiting for audio settings from host

  // Mock data for testing
  MOCK_DATA: {
    score: 15000,
    lives: 2,
    currentLevel: 1,
    correctOrderCount: 18,
    multiplier: 2, // Mock multiplier level (1-5)
    multiplierScore: 2600, // Mock points toward next multiplier (0-1800)
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
