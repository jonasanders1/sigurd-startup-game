import { log } from './logger';

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
}

export const sendScoreToHost = (score: number, map: string, level?: number, lives?: number, multiplier?: number) => {
  const scoreData = {
    score,
    map,
    timestamp: Date.now(),
    level,
    lives,
    multiplier
  };
  
  log.debug('Sending score to host:', scoreData);
  
  // Send current score update
  const scoreEvent = new CustomEvent('scoreUpdate', {
    detail: { score },
    bubbles: true,
    composed: true,
  });
  window.dispatchEvent(scoreEvent);
  
  // Send detailed score data
  const detailedScoreEvent = new CustomEvent('game:score-updated', {
    detail: scoreData,
    bubbles: true,
    composed: true,
  });
  window.dispatchEvent(detailedScoreEvent);
};

export const sendGameReady = () => {
  log.debug('Game ready signal sent to host');
  const event = new CustomEvent('game:ready', {
    detail: { timestamp: Date.now() },
    bubbles: true,
    composed: true,
  });
  window.dispatchEvent(event);
};

export const sendGameStateUpdate = (state: string, map?: string) => {
  log.debug('Game state update sent to host:', state, map);
  const event = new CustomEvent('game:state-updated', {
    detail: { state, map, timestamp: Date.now() },
    bubbles: true,
    composed: true,
  });
  window.dispatchEvent(event);
};

export const sendMapCompletionData = (data: MapCompletionData) => {
  log.debug('Sending map completion data to host:', data);
  const event = new CustomEvent('game:map-completed', {
    detail: data,
    bubbles: true,
    composed: true,
  });
  window.dispatchEvent(event);
};

export const sendGameCompletionData = (data: {
  finalScore: number;
  totalLevels: number;
  completedLevels: number;
  timestamp: number;
  lives: number;
  multiplier: number;
  levelHistory: LevelHistoryEntry[];
  totalCoinsCollected?: number;
  totalPowerModeActivations?: number;
}) => {
  log.debug('Sending game completion data to host:', data);
  const event = new CustomEvent('game:completed', {
    detail: data,
    bubbles: true,
    composed: true,
  });
  window.dispatchEvent(event);
};



// Declare global game interface for TypeScript
declare global {
  interface Window {
    sigurdGame?: {
      sendScore: (score: number, map: string) => void;
      updateCurrentScore: (score: number) => void;
      _handleScoreUpdate: (score: number, map: string) => void;
      _updateCurrentScore: (score: number) => void;
    };
  }
}