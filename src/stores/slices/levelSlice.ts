import { StateCreator } from 'zustand';
import { Monster, Platform, Ground, MapDefinition } from '../../types/interfaces';
import { BombManager } from '../../managers/bombManager';

export interface LevelSlice {
  currentMap: MapDefinition | null;
  monsters: Monster[];
  platforms: Platform[];
  ground: Ground | null;
  
  initializeLevel: (mapData: MapDefinition) => { bombManager: BombManager; firstBomb: any };
  updateMonsters: (monsters: Monster[]) => void;
  resetLevelState: () => void;
}

export const createLevelSlice: StateCreator<LevelSlice> = (set, get) => ({
  currentMap: null,
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
      monsters: [],
      platforms: [],
      ground: null
    });
  }
});