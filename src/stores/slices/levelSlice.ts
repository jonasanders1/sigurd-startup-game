import { StateCreator } from 'zustand';
import { Monster, Platform, Ground, MapDefinition } from '../../types/interfaces';
import { LevelHistoryEntry } from '../../lib/communicationUtils';
import { BombManager } from '../../managers/bombManager';
import { mapDefinitions } from '../../maps/mapDefinitions';
import { sendMapCompletionData } from '../../lib/communicationUtils';
import { log } from '../../lib/logger';
import { MonsterType } from '../../types/enums';
import { COLORS } from '../../types/constants';

export interface LevelSlice {
  currentMap: MapDefinition | null;
  levelStartTime: number;
  levelCompletionTime: number | null;
  monsters: Monster[];
  platforms: Platform[];
  ground: Ground | null;
  
  initializeLevel: (mapData: MapDefinition) => { bombManager: BombManager; firstBomb: unknown };
  updateMonsters: (monsters: Monster[]) => void;
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
}

export const createLevelSlice: StateCreator<LevelSlice> = (set, get) => ({
  currentMap: null,
  levelStartTime: 0,
  levelCompletionTime: null,
  monsters: [],
  platforms: [],
  ground: null,
  
  initializeLevel: (mapData: MapDefinition) => {
    const bombManager = new BombManager(mapData.bombs);
    
    const sortedBombs = [...mapData.bombs].sort((a, b) => a.group - b.group || a.order - b.order);
    const firstBomb = sortedBombs[0];
    
    // Assign colors to monsters based on their type
    const getMonsterColor = (type: string): string => {
      switch (type) {
        case MonsterType.HORIZONTAL_PATROL:
          return COLORS.MONSTER;
        case MonsterType.VERTICAL_PATROL:
          return '#FF6B6B'; // Red
        case MonsterType.CHASER:
          return '#FFD93D'; // Yellow
        case MonsterType.AMBUSHER:
          return '#FF8800'; // Orange
        case MonsterType.FLOATER:
          return '#4ECDC4'; // Cyan
        default:
          return COLORS.MONSTER;
      }
    };
    
    const monstersWithColors = mapData.monsters.map(monster => ({
      ...monster,
      color: monster.color || getMonsterColor(monster.type)
    }));
    
    set({
      currentMap: mapData,
      platforms: mapData.platforms,
      ground: mapData.ground,
      monsters: monstersWithColors
    });
    
    return { bombManager, firstBomb };
  },
  
  updateMonsters: (monsters: Monster[]) => {
    set({ monsters });
  },
  
  resetLevelState: () => {
    set({
      currentMap: null,
      levelStartTime: 0,
      levelCompletionTime: null,
      monsters: [],
      platforms: [],
      ground: null
    });
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
    
    // Note: Level history is now handled by LevelHistorySlice
  },
});