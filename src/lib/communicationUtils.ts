import { log } from "./logger";

export interface MapCompletionData {
  mapName: string;
  level: number;
  correctOrderCount: number;
  totalBombs: number;
  score: number;
  bonus: number;
  hasBonus: boolean;
  timestamp: number;
  lives: number;
  multiplier: number;
  completionTime?: number; // Time taken to complete the map in milliseconds
  coinsCollected?: number; // Number of coins collected during the map
  powerModeActivations?: number; // Number of times power mode was activated
}

export interface LevelHistoryEntry {
  level: number;
  mapName: string;
  score: number;
  bonus: number;
  completionTime: number;
  coinsCollected: number;
  powerModeActivations: number;
  timestamp: number;
  correctOrderCount: number;
  totalBombs: number;
  lives: number;
  multiplier: number;
}

export interface GameCompletionData {
  finalScore: number;
  totalLevels: number;
  completedLevels: number;
  timestamp: number;
  lives: number;
  multiplier: number;
  levelHistory: LevelHistoryEntry[];
  totalCoinsCollected: number;
  totalPowerModeActivations: number;
  totalBombs: number;
  totalCorrectOrders: number;
  averageCompletionTime: number;
  gameEndReason: "completed" | "failed";
  sessionId: string;
  startTime: number;
  endTime: number;
  userDisplayName?: string;
  userEmail?: string;
  userId?: string;
}

export interface AudioSettingsData {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  masterMuted: boolean;
  musicMuted: boolean;
  sfxMuted: boolean;
  timestamp: number;
  sessionId?: string;
}

export interface GameSettingsData {
  audioSettings: AudioSettingsData;
  timestamp: number;
  sessionId?: string;
}

export const sendScoreToHost = (
  score: number,
  map: string,
  level?: number,
  lives?: number,
  multiplier?: number
) => {
  const scoreData = {
    score,
    map,
    timestamp: Date.now(),
    level,
    lives,
    multiplier,
  };

  log.dataPassing("Sending score to host:", scoreData);

  // Send current score update
  const scoreEvent = new CustomEvent("scoreUpdate", {
    detail: { score },
    bubbles: true,
    composed: true,
  });
  window.dispatchEvent(scoreEvent);

  // Send detailed score data
  const detailedScoreEvent = new CustomEvent("game:score-updated", {
    detail: scoreData,
    bubbles: true,
    composed: true,
  });
  window.dispatchEvent(detailedScoreEvent);
};

export const sendGameReady = () => {
  log.dataPassing("Game ready signal sent to host");
  const event = new CustomEvent("game:ready", {
    detail: { timestamp: Date.now() },
    bubbles: true,
    composed: true,
  });
  window.dispatchEvent(event);
};

export const sendGameStateUpdate = (state: string, map?: string) => {
  log.dataPassing("Game state update sent to host:", { state, map });
  const event = new CustomEvent("game:state-updated", {
    detail: { state, map, timestamp: Date.now() },
    bubbles: true,
    composed: true,
  });
  window.dispatchEvent(event);
};

export const sendMapCompletionData = (data: MapCompletionData) => {
  log.dataPassing("Sending map completion data to host:", data);
  const event = new CustomEvent("game:map-completed", {
    detail: data,
    bubbles: true,
    composed: true,
  });
  window.dispatchEvent(event);
};

export const sendGameCompletionData = (data: GameCompletionData) => {
  log.dataPassing("Sending game completion data to host:", data);
  const event = new CustomEvent("game:completed", {
    detail: data,
    bubbles: true,
    composed: true,
  });
  window.dispatchEvent(event);
};

/**
 * Sends audio settings update to the host application
 * @param audioSettings - The current audio settings (without timestamp)
 */
export const sendAudioSettingsUpdate = (
  audioSettings: Omit<AudioSettingsData, "timestamp">
) => {
  const settingsData: AudioSettingsData = {
    ...audioSettings,
    timestamp: Date.now(),
  };

  log.dataPassing("Sending audio settings update to host:", settingsData);

  // Send audio settings update event
  const audioSettingsEvent = new CustomEvent("game:audio-settings-updated", {
    detail: settingsData,
    bubbles: true,
    composed: true,
  });
  window.dispatchEvent(audioSettingsEvent);
};

/**
 * Sends fullscreen state update to the host application
 * @param isFullscreen - Whether the game is currently in fullscreen mode
 */
export const sendFullscreenStateUpdate = (isFullscreen: boolean) => {
  const fullscreenData = {
    isFullscreen,
    timestamp: Date.now(),
    sessionId: `game-${Date.now()}`,
  };

  log.dataPassing("Sending fullscreen state update to host:", fullscreenData);

  // Send fullscreen state update event
  const fullscreenEvent = new CustomEvent("game:fullscreen-state-updated", {
    detail: fullscreenData,
    bubbles: true,
    composed: true,
  });
  window.dispatchEvent(fullscreenEvent);
};

/**
 * Sends comprehensive game settings update to the host application
 * @param settings - The current game settings (without timestamp)
 */
export const sendGameSettingsUpdate = (
  settings: Omit<GameSettingsData, "timestamp">
) => {
  const settingsData: GameSettingsData = {
    ...settings,
    timestamp: Date.now(),
  };

  log.dataPassing("Sending game settings update to host:", settingsData);

  // Send comprehensive game settings update event
  const gameSettingsEvent = new CustomEvent("game:settings-updated", {
    detail: settingsData,
    bubbles: true,
    composed: true,
  });
  window.dispatchEvent(gameSettingsEvent);
};

/**
 * Listens for incoming audio settings from the external website
 * @param onSettingsReceived - Callback function to handle received settings
 * @returns Function to remove the event listener
 *
 * @example
 * // On the external website, send audio settings like this:
 * //
 * // Method 1: Send specific audio settings update
 * window.dispatchEvent(new CustomEvent('external:audio-settings-updated', {
 *   detail: {
 *     masterVolume: 80,
 *     musicVolume: 70,
 *     sfxVolume: 90,
 *     masterMuted: false,
 *     musicMuted: false,
 *     sfxMuted: false,
 *     timestamp: Date.now(),
 *     sessionId: 'user-session-123'
 *   }
 * }));
 *
 * // Method 2: Send generic settings update
 * window.dispatchEvent(new CustomEvent('external:settings-updated', {
 *   detail: {
 *     audioSettings: {
 *       masterVolume: 80,
 *       musicVolume: 70,
 *       sfxVolume: 90,
 *       masterMuted: false,
 *       musicMuted: false,
 *       sfxMuted: false,
 *       timestamp: Date.now(),
 *       sessionId: 'user-session-123'
 *     }
 *   }
 * }));
 *
 * // Method 3: Listen for game's request for settings
 * window.addEventListener('game:request-audio-settings', (event) => {
 *   const currentSettings = getCurrentUserSettings(); // Your function to get user settings
 *   window.dispatchEvent(new CustomEvent('external:audio-settings-updated', {
 *     detail: currentSettings
 *   }));
 * });
 *
 * // Method 4: Request current settings from game
 * window.dispatchEvent(new CustomEvent('external:request-audio-settings', {
 *   detail: { timestamp: Date.now() }
 * }));
 * // Then listen for the response:
 * window.addEventListener('game:audio-settings-updated', (event) => {
 *   const gameSettings = event.detail;
 *   console.log('Current game audio settings:', gameSettings);
 * });
 */
export const listenForExternalAudioSettings = (
  onSettingsReceived: (settings: AudioSettingsData) => void
) => {
  const handleExternalSettings = (event: CustomEvent) => {
    const settings = event.detail;

    if (settings && typeof settings === "object") {
      log.dataPassing("Received external audio settings:", settings);

      // Validate the received settings
      if (isValidAudioSettings(settings)) {
        onSettingsReceived(settings);
      } else {
        log.warn("Received invalid audio settings format:", settings);
      }
    }
  };

  // Handle external request for current game settings
  const handleExternalRequest = (event: CustomEvent) => {
    log.dataPassing("External website requested current audio settings");

    // Try to get current settings from the game store if available
    // Since we can't access the store directly from here, we'll send a request
    // for the game to send its current settings
    log.info("Requesting game to send current settings to host");
    
    // Send a request to the game to send current settings
    const gameRequestEvent = new CustomEvent("internal:request-game-settings", {
      detail: {
        timestamp: Date.now(),
        requestId: `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      },
      bubbles: true,
      composed: true,
    });
    
    window.dispatchEvent(gameRequestEvent);
    
    // For now, send default settings as fallback
    // The game should respond with actual settings via the internal event
    sendAudioSettingsUpdate({
      masterVolume: 50,
      musicVolume: 80,
      sfxVolume: 10,
      masterMuted: false,
      musicMuted: false,
      sfxMuted: false,
    });
  };

  // Listen for external audio settings events
  window.addEventListener(
    "external:audio-settings-updated",
    handleExternalSettings as EventListener
  );

  // Also listen for a more generic settings event
  window.addEventListener(
    "external:settings-updated",
    handleExternalSettings as EventListener
  );

  // Listen for external requests for current game settings
  window.addEventListener(
    "external:request-audio-settings",
    handleExternalRequest as EventListener
  );

  // Return function to remove listeners
  return () => {
    window.removeEventListener(
      "external:audio-settings-updated",
      handleExternalSettings as EventListener
    );
    window.removeEventListener(
      "external:settings-updated",
      handleExternalSettings as EventListener
    );
    window.removeEventListener(
      "external:request-audio-settings",
      handleExternalRequest as EventListener
    );
  };
};

/**
 * Validates that received settings have the correct structure
 * @param settings - The settings object to validate
 * @returns True if settings are valid, false otherwise
 */
const isValidAudioSettings = (settings: any): settings is AudioSettingsData => {
  return (
    settings &&
    typeof settings === "object" &&
    typeof settings.masterVolume === "number" &&
    typeof settings.musicVolume === "number" &&
    typeof settings.sfxVolume === "number" &&
    typeof settings.masterMuted === "boolean" &&
    typeof settings.musicMuted === "boolean" &&
    typeof settings.sfxMuted === "boolean" &&
    typeof settings.timestamp === "number"
  );
};

/**
 * Requests current audio settings from the external website
 * This can be used to sync settings when the game starts
 */
export const requestAudioSettingsFromHost = () => {
  log.dataPassing("Requesting audio settings from host");

  // Send a request event to the host
  const requestEvent = new CustomEvent("game:request-audio-settings", {
    detail: {
      timestamp: Date.now(),
      gameId: "sigurd-startup-game",
    },
    bubbles: true,
    composed: true,
  });

  window.dispatchEvent(requestEvent);

  // Also dispatch on document for iframe scenarios
  document.dispatchEvent(requestEvent);
};

// Helper function to calculate comprehensive game statistics
export const calculateGameStats = (
  levelHistory: LevelHistoryEntry[],
  finalScore: number,
  lives: number,
  multiplier: number,
  gameEndReason: "completed" | "failed",
  startTime: number,
  endTime: number
) => {
  const totalBombs = levelHistory.reduce(
    (sum, level) => sum + level.totalBombs,
    0
  );
  const totalCorrectOrders = levelHistory.reduce(
    (sum, level) => sum + level.correctOrderCount,
    0
  );
  const totalCoinsCollected = levelHistory.reduce(
    (sum, level) => sum + level.coinsCollected,
    0
  );
  const totalPowerModeActivations = levelHistory.reduce(
    (sum, level) => sum + level.powerModeActivations,
    0
  );
  const totalPlayTime = endTime - startTime;
  const averageCompletionTime =
    levelHistory.length > 0 ? totalPlayTime / levelHistory.length / 1000 : 0; // Convert to seconds

  return {
    totalBombs,
    totalCorrectOrders,
    totalCoinsCollected,
    totalPowerModeActivations,
    averageCompletionTime: Math.round(averageCompletionTime),
    totalPlayTime: Math.round(totalPlayTime / 1000), // Convert to seconds
  };
};
