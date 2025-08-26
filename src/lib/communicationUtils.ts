import { log } from "./logger";

export interface LevelStartData {
  level: number;
  mapName: string;
  timestamp: number;
}

export interface LevelFailureData {
  level: number;
  mapName: string;
  score: number;
  bombs?: number;
  correctOrders?: number;
  lives: number;
  multiplier: number;
  timestamp?: number;
}

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
  completionTime?: number; // Optional - not included for partial/incomplete levels
  coinsCollected: number;
  powerModeActivations: number;
  timestamp: number;
  correctOrderCount: number;
  totalBombs: number;
  lives: number;
  multiplier: number;
  isPartial?: boolean; // True for failed/incomplete levels
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

export interface AudioSettingsUpdateData {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  masterMuted: boolean;
  musicMuted: boolean;
  sfxMuted: boolean;
  timestamp: number;
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

  log.data("Sending score to host:", scoreData);

  // Send detailed score data only (removed scoreUpdate event)
  const detailedScoreEvent = new CustomEvent("game:score-updated", {
    detail: scoreData,
    bubbles: true,
    composed: true,
  });
  window.dispatchEvent(detailedScoreEvent);
};

export const sendLevelStart = (level: number, mapName: string) => {
  const levelStartData: LevelStartData = {
    level,
    mapName,
    timestamp: Date.now(),
  };

  log.data("Sending level start to host:", levelStartData);

  const event = new CustomEvent("game:level-started", {
    detail: levelStartData,
    bubbles: true,
    composed: true,
  });
  window.dispatchEvent(event);
};

export const sendLevelFailure = (data: LevelFailureData) => {
  const failureData = {
    ...data,
    timestamp: data.timestamp || Date.now(),
  };

  log.data("Sending level failure to host:", failureData);

  const event = new CustomEvent("game:level-failed", {
    detail: failureData,
    bubbles: true,
    composed: true,
  });
  window.dispatchEvent(event);
};

export const sendGameReady = () => {
  log.data("Game ready signal sent to host");
  const event = new CustomEvent("game:ready", {
    detail: { timestamp: Date.now() },
    bubbles: true,
    composed: true,
  });
  window.dispatchEvent(event);
};

export const sendGameStateUpdate = (state: string, map?: string) => {
  log.data("Game state update sent to host:", { state, map });
  const event = new CustomEvent("game:state-updated", {
    detail: { state, map, timestamp: Date.now() },
    bubbles: true,
    composed: true,
  });
  window.dispatchEvent(event);
};

export const sendMapCompletionData = (data: MapCompletionData) => {
  log.data("Sending map completion data to host:", data);
  const event = new CustomEvent("game:map-completed", {
    detail: data,
    bubbles: true,
    composed: true,
  });
  window.dispatchEvent(event);
};

export const sendGameCompletionData = (data: GameCompletionData) => {
  log.data("Sending game completion data to host:", data);
  const event = new CustomEvent("game:completed", {
    detail: data,
    bubbles: true,
    composed: true,
  });
  window.dispatchEvent(event);
};

export const sendAudioSettingsUpdate = (
  masterVolume: number,
  musicVolume: number,
  sfxVolume: number,
  masterMuted: boolean,
  musicMuted: boolean,
  sfxMuted: boolean
) => {
  const audioSettingsData: AudioSettingsUpdateData = {
    masterVolume,
    musicVolume,
    sfxVolume,
    masterMuted,
    musicMuted,
    sfxMuted,
    timestamp: Date.now(),
  };

  log.data("Sending audio settings update to host:", audioSettingsData);

  const event = new CustomEvent("game:audio-settings-updated", {
    detail: audioSettingsData,
    bubbles: true,
    composed: true,
  });
  window.dispatchEvent(event);
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

// New function to wait for game save confirmation
export const waitForGameSaveConfirmation = (): Promise<void> => {
  return new Promise((resolve) => {
    log.data("Waiting for game:run-saved event from host");
    
    const handleGameSaved = () => {
      log.data("Received game:run-saved event from host");
      window.removeEventListener("game:run-saved", handleGameSaved);
      resolve();
    };
    
    window.addEventListener("game:run-saved", handleGameSaved);
    
    // Add a timeout as a fallback (30 seconds)
    setTimeout(() => {
      log.warn("Timeout waiting for game:run-saved event, proceeding anyway");
      window.removeEventListener("game:run-saved", handleGameSaved);
      resolve();
    }, 30000);
  });
};
