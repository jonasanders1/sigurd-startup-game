import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// Domain stores
import { PlayerStore, createPlayerStore } from '../domains/player/stores/PlayerStore';
import { GameStateStore, createGameStateStore } from '../domains/game/stores/GameStateStore';
import { CoinStore, createCoinStore } from '../domains/coin/stores/CoinStore';
import { BombStore, createBombStore } from '../domains/bomb/stores/BombStore';
import { LevelStore, createLevelStore } from '../domains/level/stores/LevelStore';
import { UIStore, createUIStore } from '../domains/ui/stores/UIStore';

export interface RootStore {
  player: PlayerStore;
  gameState: GameStateStore;
  coins: CoinStore;
  bombs: BombStore;
  level: LevelStore;
  ui: UIStore;
  
  // Global actions
  resetGame: () => void;
  initializeGame: () => void;
}

/**
 * Root store that combines all domain stores
 * Each domain manages its own state independently
 */
export const useRootStore = create<RootStore>()(
  subscribeWithSelector(
    immer(
      devtools(
        (set, get) => ({
          // Initialize domain stores
          player: createPlayerStore(set, get),
          gameState: createGameStateStore(set, get),
          coins: createCoinStore(set, get),
          bombs: createBombStore(set, get),
          level: createLevelStore(set, get),
          ui: createUIStore(set, get),
          
          // Global actions
          resetGame: () => {
            set((state) => {
              state.player.reset();
              state.gameState.reset();
              state.coins.reset();
              state.bombs.reset();
              state.level.reset();
              state.ui.reset();
            });
          },
          
          initializeGame: () => {
            set((state) => {
              // Initialize game with default settings
              state.gameState.initialize();
              state.level.loadLevel(1);
            });
          },
        }),
        {
          name: 'sigurd-game-store',
        }
      )
    )
  )
);

// Selectors for easy access
export const usePlayerStore = () => useRootStore((state) => state.player);
export const useGameStateStore = () => useRootStore((state) => state.gameState);
export const useCoinStore = () => useRootStore((state) => state.coins);
export const useBombStore = () => useRootStore((state) => state.bombs);
export const useLevelStore = () => useRootStore((state) => state.level);
export const useUIStore = () => useRootStore((state) => state.ui);