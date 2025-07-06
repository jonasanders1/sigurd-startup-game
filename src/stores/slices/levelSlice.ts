import { StateCreator } from 'zustand';
import { Monster, Platform, Ground, MapDefinition } from '../../types/interfaces';
import { LevelHistoryEntry } from '../../lib/communicationUtils';
import { BombManager } from '../../managers/bombManager';
import { mapDefinitions } from '../../maps/mapDefinitions';
import { sendMapCompletionData } from '../../lib/communicationUtils';
import { log } from '../../lib/logger';

export interface LevelSlice {
  currentMap: MapDefinition | null;
  levelHistory: LevelHistoryEntry[];
  levelStartTime: number;
  levelCompletionTime: number | null;
  monsters: Monster[];
  platforms: Platform[];
  ground: Ground | null;
  
  initializeLevel: (mapData: MapDefinition) => { bombManager: BombManager; firstBomb: unknown };
  updateMonsters: (monsters: Monster[]) => void;
  resetLevelState: () => void;
  getLevelHistory: () => LevelHistoryEntry[];
  addLevelToHistory: (entry: LevelHistoryEntry) => void;
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
}

export const createLevelSlice: StateCreator<LevelSlice> = (set, get) => ({
  currentMap: null,
  levelHistory: [],
  levelStartTime: 0,
  levelCompletionTime: null,
  monsters: [],
  platforms: [],
  ground: null,
  
  initializeLevel: (mapData: MapDefinition) => {
    const bombManager = new BombManager(mapData.bombs);
    
    const sortedBombs = [...mapData.bombs].sort((a, b) => a.group - b.group || a.order - b.order);
    const firstBomb = sortedBombs[0];
    
    set({
      currentMap: mapData,
      platforms: mapData.platforms,
      ground: mapData.ground,
      monsters: mapData.monsters
    });
    
    return { bombManager, firstBomb };
  },
  
  updateMonsters: (monsters: Monster[]) => {
    set({ monsters });
  },
  
  resetLevelState: () => {
    set({
      currentMap: null,
      levelHistory: [],
      levelStartTime: 0,
      levelCompletionTime: null,
      monsters: [],
      platforms: [],
      ground: null
    });
  },
  
  getLevelHistory: () => {
    return get().levelHistory;
  },
  
  addLevelToHistory: (entry: LevelHistoryEntry) => {
    const { levelHistory } = get();
    set({ levelHistory: [...levelHistory, entry] });
  },
  
  sendLevelCompletionData: (data) => {
    const { levelStartTime } = get();
    const completionTime = Date.now() - levelStartTime;
    
    const completionData = {
      ...data,
      timestamp: Date.now(),
      completionTime,
    };
    
    log.debug("Sending level completion data:", completionData);
    sendMapCompletionData(completionData);
    
    // Add to level history
    const historyEntry: LevelHistoryEntry = {
      level: data.level,
      mapName: data.mapName,
      score: data.score,
      bonus: data.bonus,
      completionTime,
      coinsCollected: data.coinsCollected || 0,
      powerModeActivations: data.powerModeActivations || 0,
      timestamp: Date.now(),
    };
    
    get().addLevelToHistory(historyEntry);
  },
});