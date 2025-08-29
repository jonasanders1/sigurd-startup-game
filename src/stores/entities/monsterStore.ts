import { create } from 'zustand';
import { Monster } from '../../types/interfaces';
import { MonsterType } from '../../types/enums';
import { COLORS } from '../../types/constants';

interface MonsterState {
  monsters: Monster[];
}

interface MonsterActions {
  setMonsters: (monsters: Monster[]) => void;
  updateMonsters: (monsters: Monster[]) => void;
  initializeMonsters: (monsters: Monster[]) => void;
  freezeAllMonsters: () => void;
  unfreezeAllMonsters: () => void;
  resetMonsters: () => void;
}

export type MonsterStore = MonsterState & MonsterActions;

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

export const useMonsterStore = create<MonsterStore>((set, get) => ({
  // State
  monsters: [],
  
  // Actions
  setMonsters: (monsters: Monster[]) => {
    set({ monsters });
  },
  
  updateMonsters: (monsters: Monster[]) => {
    set({ monsters });
  },
  
  initializeMonsters: (monsters: Monster[]) => {
    // Assign colors to monsters based on their type
    const monstersWithColors = monsters.map(monster => ({
      ...monster,
      color: monster.color || getMonsterColor(monster.type)
    }));
    
    set({ monsters: monstersWithColors });
  },
  
  freezeAllMonsters: () => {
    set(state => ({
      monsters: state.monsters.map(monster => ({
        ...monster,
        isFrozen: true
      }))
    }));
  },
  
  unfreezeAllMonsters: () => {
    set(state => ({
      monsters: state.monsters.map(monster => ({
        ...monster,
        isFrozen: false
      }))
    }));
  },
  
  resetMonsters: () => {
    set({ monsters: [] });
  }
}))