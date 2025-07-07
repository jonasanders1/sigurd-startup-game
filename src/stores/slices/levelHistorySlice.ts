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
}

export interface LevelHistorySlice {
  levelHistory: LevelResult[];
  
  addLevelResult: (result: LevelResult) => void;
  getLevelResults: () => LevelResult[];
  resetLevelHistory: () => void;
}

export const createLevelHistorySlice: StateCreator<LevelHistorySlice> = (set, get) => ({
  levelHistory: [],
  
  addLevelResult: (result: LevelResult) => {
    set((state) => ({
      levelHistory: [...state.levelHistory, {
        ...result,
        completionTime: result.completionTime || 0,
        timestamp: result.timestamp || Date.now()
      }]
    }));
  },
  
  getLevelResults: () => {
    return get().levelHistory;
  },
  
  resetLevelHistory: () => {
    set({ levelHistory: [] });
  }
}); 