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
    case MonsterType.BUREAUCRAT:
      return COLORS.MONSTER;
    case MonsterType.WISP:
      return '#FFD93D'; // Yellow
    case MonsterType.TAXGHOST:
      return '#FF8800'; // Orange
    case MonsterType.FOUNDER:
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
    // Identity-dedup as a safety net. The respawn pipeline mutates dead
    // monster refs in-place and re-appends them via GameLoopManager, so a
    // missed dedup upstream would duplicate refs in the array — every
    // duplicate then gets a second movement update per frame, manifesting
    // as visible "monster spawn count spikes". Set preserves insertion
    // order, so the relative ordering of unique refs is unchanged.
    const unique =
      new Set(monsters).size === monsters.length
        ? monsters
        : Array.from(new Set(monsters));
    set({ monsters: unique });
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