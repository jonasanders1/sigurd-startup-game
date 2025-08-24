import { create } from 'zustand';
import { Platform, Ground, MapDefinition } from '../../types/interfaces';
import { BombManager } from '../../managers/bombManager';
import { sendMapCompletionData } from '../../lib/communicationUtils';
import { log } from '../../lib/logger';

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
  completionTime?: number; // Optional - not included for partial/incomplete levels
  timestamp: number;
  lives: number;
  multiplier: number;
  isPartial?: boolean; // True for failed/incomplete levels
}

interface LevelState {
  currentMap: MapDefinition | null;
  levelStartTime: number;
  levelCompletionTime: number | null;
  platforms: Platform[];
  ground: Ground | null;
  levelHistory: LevelResult[];
  gameStartTime: number;
  sessionId: string;
}

interface LevelActions {
  initializeLevel: (mapData: MapDefinition) => { bombManager: BombManager; firstBomb: unknown };
  resetLevelState: () => void;
  sendLevelCompletionData: (data: {
    mapName: string;
    level: number;
    correctOrderCount: number;
    totalBombs: number;
    score: number;
    bonus: number;
    hasBonus: boolean;
    lives: number;
    multiplier: number;
    coinsCollected?: number;
    powerModeActivations?: number;
  }) => void;
  addLevelResult: (result: LevelResult) => void;
  getLevelResults: () => LevelResult[];
  resetLevelHistory: () => void;
  setGameStartTime: (startTime: number) => void;
  getGameStartTime: () => number;
  getSessionId: () => string;
}

export type LevelStore = LevelState & LevelActions;

export const useLevelStore = create<LevelStore>((set, get) => ({
  // State
  currentMap: null,
  levelStartTime: 0,
  levelCompletionTime: null,
  platforms: [],
  ground: null,
  levelHistory: [],
  gameStartTime: 0,
  sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  
  // Actions
  initializeLevel: (mapData: MapDefinition) => {
    const bombManager = new BombManager(mapData.bombs);
    
    const sortedBombs = [...mapData.bombs].sort((a, b) => a.group - b.group || a.order - b.order);
    const firstBomb = sortedBombs[0];
    
    set({
      currentMap: mapData,
      platforms: mapData.platforms,
      ground: mapData.ground,
      levelStartTime: Date.now()
    });
    
    return { bombManager, firstBomb };
  },
  
  resetLevelState: () => {
    set({
      currentMap: null,
      levelStartTime: 0,
      levelCompletionTime: null,
      platforms: [],
      ground: null
    });
  },
  
  sendLevelCompletionData: (data) => {
    const { levelStartTime } = get();
    const completionTime = Date.now() - levelStartTime;
    
    log.level('Sending level completion data with bonus:', data.hasBonus);
    
    sendMapCompletionData({
      mapName: data.mapName,
      level: data.level,
      correctOrderCount: data.correctOrderCount,
      totalBombs: data.totalBombs,
      score: data.score,
      bonus: data.bonus,
      hasBonus: data.hasBonus,
      lives: data.lives,
      multiplier: data.multiplier,
      coinsCollected: data.coinsCollected || 0,
      powerModeActivations: data.powerModeActivations || 0,
      completionTime: completionTime,
      timestamp: Date.now()
    });
  },
  
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
}));