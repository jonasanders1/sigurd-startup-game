import { StateCreator } from 'zustand';

export interface LevelResult {
  level: number;
  mapName: string;
  correctOrderCount: number;
  totalBombs: number;
  score: number;
  bonus: number;
  hasBonus: boolean;
  coinsCollected: number;
  powerModeActivations: number;
  completionTime: number;
  timestamp: number;
  lives: number;
  multiplier: number;
}

export interface LevelHistorySlice {
  levelHistory: LevelResult[];
  gameStartTime: number;
  sessionId: string;
  
  addLevelResult: (result: LevelResult) => void;
  getLevelResults: () => LevelResult[];
  resetLevelHistory: () => void;
  setGameStartTime: (startTime: number) => void;
  getGameStartTime: () => number;
  getSessionId: () => string;
}

export const createLevelHistorySlice: StateCreator<LevelHistorySlice> = (set, get) => ({
  levelHistory: [],
  gameStartTime: 0,
  sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  
  addLevelResult: (result: LevelResult) => {
    set((state) => ({
      levelHistory: [...state.levelHistory, {
        ...result,
        completionTime: result.completionTime || 0,
        timestamp: result.timestamp || Date.now(),
        lives: result.lives || 0,
        multiplier: result.multiplier || 1,
        totalBombs: result.totalBombs || 0,
        correctOrderCount: result.correctOrderCount || 0
      }]
    }));
  },
  
  getLevelResults: () => {
    return get().levelHistory;
  },
  
  resetLevelHistory: () => {
    set({ 
      levelHistory: [],
      gameStartTime: Date.now(),
      sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    });
  },

  setGameStartTime: (startTime: number) => {
    set({ gameStartTime: startTime });
  },

  getGameStartTime: () => {
    return get().gameStartTime;
  },

  getSessionId: () => {
    return get().sessionId;
  }
}); 