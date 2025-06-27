import { StateCreator } from 'zustand';
import { GameState, MenuType } from '../../types/enums';
import { GAME_CONFIG } from '../../types/constants';

export interface GameStateSlice {
  currentState: GameState;
  score: number;
  lives: number;
  currentLevel: number;
  showMenu: MenuType;
  isPaused: boolean;
  bonusAnimationComplete: boolean;
  
  setState: (state: GameState) => void;
  setMenuType: (menuType: MenuType) => void;
  loseLife: () => void;
  nextLevel: () => void;
  addScore: (points: number) => void;
  resetGameState: () => void;
  setBonusAnimationComplete: (complete: boolean) => void;
}

export const createGameStateSlice: StateCreator<GameStateSlice> = (set, get) => ({
  currentState: GameState.MENU,
  score: 0,
  lives: GAME_CONFIG.STARTING_LIVES,
  currentLevel: 1,
  showMenu: MenuType.START,
  isPaused: false,
  bonusAnimationComplete: false,
  
  setState: (state: GameState) => {
    set({ 
      currentState: state,
      isPaused: state === GameState.PAUSED
    });
    if (state === GameState.MENU) {
      set({ showMenu: MenuType.START });
    } else if (state === GameState.PLAYING) {
      set({ showMenu: MenuType.IN_GAME });
    }
  },
  
  setMenuType: (menuType: MenuType) => set({ showMenu: menuType }),
  
  loseLife: () => {
    const { lives } = get();
    const newLives = lives - 1;
    set({ lives: newLives });
    
    if (newLives <= 0) {
      set({ currentState: GameState.GAME_OVER, showMenu: MenuType.GAME_OVER });
    }
  },
  
  nextLevel: () => {
    const { currentLevel } = get();
    set({ currentLevel: currentLevel + 1 });
  },
  
  addScore: (points: number) => {
    set({ score: get().score + points });
  },
  
  resetGameState: () => {
    set({
      currentState: GameState.MENU,
      showMenu: MenuType.START,
      score: 0,
      lives: GAME_CONFIG.STARTING_LIVES,
      currentLevel: 1,
      isPaused: false,
      bonusAnimationComplete: false
    });
  },
  
  setBonusAnimationComplete: (complete: boolean) => {
    set({ bonusAnimationComplete: complete });
  }
});