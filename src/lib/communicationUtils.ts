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
