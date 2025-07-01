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
}

export interface LevelHistorySlice {
  levelHistory: LevelResult[];
  
  addLevelResult: (result: LevelResult) => void;
  getLevelHistory: () => LevelResult[];
  resetLevelHistory: () => void;
}

export const createLevelHistorySlice: StateCreator<LevelHistorySlice> = (set, get) => ({
  levelHistory: [],
  
  addLevelResult: (result: LevelResult) => {
    set((state) => ({
      levelHistory: [...state.levelHistory, result]
    }));
  },
  
  getLevelHistory: () => {
    return get().levelHistory;
  },
  
  resetLevelHistory: () => {
    set({ levelHistory: [] });
  }
}); 