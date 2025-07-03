import { StateCreator } from "zustand";
import { GameState, MenuType } from "../../types/enums";
import { GAME_CONFIG } from "../../types/constants";
import { calculateBombScore, formatScoreLog } from "../../lib/scoringUtils";
import {
  sendScoreToHost,
  sendGameStateUpdate,
  sendGameCompletionData,
} from "@/lib/communicationUtils";
import { mapDefinitions } from "@/maps/mapDefinitions";

export interface GameStateSlice {
  currentState: GameState;
  score: number;
  levelScore: number;
  lives: number;
  currentLevel: number;
  showMenu: MenuType;
  previousMenu: MenuType | null;
  isPaused: boolean;
  bonusAnimationComplete: boolean;

  setState: (state: GameState) => void;
  setMenuType: (menuType: MenuType) => void;
  loseLife: () => void;
  nextLevel: () => void;
  addScore: (points: number) => void;
  resetGameState: () => void;
  setBonusAnimationComplete: (complete: boolean) => void;
  resetLevelScores: () => void;
}

export const createGameStateSlice: StateCreator<GameStateSlice> = (
  set,
  get
) => {
  console.log(
    `🎮 Initializing game state slice with ${GAME_CONFIG.STARTING_LIVES} lives`
  );
  return {
    currentState: GameState.MENU,
    score: 0,
    levelScore: 0,
    lives: GAME_CONFIG.STARTING_LIVES,
    currentLevel: 1,
    showMenu: MenuType.START,
    previousMenu: null,
    isPaused: false,
    bonusAnimationComplete: false,

    setState: (state: GameState) => {
      set({
        currentState: state,
        isPaused: state === GameState.PAUSED,
      });
      if (state === GameState.MENU) {
        set({ showMenu: MenuType.START });
      } else if (state === GameState.PLAYING) {
        set({ showMenu: MenuType.IN_GAME });
      }

      // Get current map for state update
      const currentMap =
        "currentMap" in get() ? (get() as any).currentMap : null;
      sendGameStateUpdate(state, currentMap?.name);
    },

    setMenuType: (menuType: MenuType) => {
      const currentState = get();
      if (menuType === MenuType.SETTINGS) {
        // Store the current menu as previous when opening settings
        set({ showMenu: menuType, previousMenu: currentState.showMenu });
      } else {
        set({ showMenu: menuType });
      }
    },

      loseLife: () => {
        const { lives, currentState } = get();
        
        // Prevent losing life if already at 0 or game is already over
        if (lives <= 0 || currentState === GameState.GAME_OVER) {
          console.log(`🚫 Cannot lose life: lives=${lives}, state=${currentState}`);
          return;
        }
        
        const newLives = lives - 1;
        
        console.log(`💔 Losing life: ${lives} → ${newLives}`);

        // Set new lives first
        set({ lives: newLives });

        // Reset only level scores and multiplier, not the entire level state
        set({ levelScore: 0 });

        // Reset multiplier directly
        if ("resetMultiplier" in get()) {
          console.log("🔄 Resetting multiplier on death...");
          (get() as any).resetMultiplier();
        }

        // Check if game over after setting new lives
        if (newLives <= 0) {
          console.log(`🎯 GAME OVER triggered at ${newLives} lives`);
          set({
            currentState: GameState.GAME_OVER,
            showMenu: MenuType.GAME_OVER,
          });
          const currentMap =
            "currentMap" in get() ? (get() as any).currentMap : null;
          sendGameStateUpdate(GameState.GAME_OVER, currentMap?.name);

          // Send game completion data for game over
          const levelHistory =
            "getLevelHistory" in get() ? (get() as any).getLevelHistory() : [];
          const multiplier =
            "multiplier" in get() ? (get() as any).multiplier : 1;

          // Calculate total coin stats from level history
          const totalCoinsCollected = levelHistory.reduce((total, level) => total + level.coinsCollected, 0);
          const totalPowerModeActivations = levelHistory.reduce((total, level) => total + level.powerModeActivations, 0);

          sendGameCompletionData({
            finalScore: get().score,
            totalLevels: mapDefinitions.length,
            completedLevels: levelHistory.length,
            timestamp: Date.now(),
            lives: newLives,
            multiplier,
            levelHistory,
            totalCoinsCollected,
            totalPowerModeActivations
          });
        }
      },

    nextLevel: () => {
      const { currentLevel } = get();
      set({ currentLevel: currentLevel + 1 });

      // Reset level scores and multiplier for new level
      set({ levelScore: 0 });

      // Reset multiplier directly
      if ("resetMultiplier" in get()) {
        console.log("🔄 Resetting multiplier on level change...");
        (get() as any).resetMultiplier();
      }

      // Send state update with new level info
      const currentMap =
        "currentMap" in get() ? (get() as any).currentMap : null;
      sendGameStateUpdate(GameState.PLAYING, currentMap?.name);
    },

    addScore: (points: number) => {
      const { score, levelScore, currentLevel, lives } = get();
      const newScore = score + points;

      set({
        score: newScore,
        levelScore: levelScore + points,
      });

      // Get multiplier and currentMap from the store if available
      const multiplier = "multiplier" in get() ? (get() as any).multiplier : 1;
      const currentMap =
        "currentMap" in get() ? (get() as any).currentMap : null;

      // Send comprehensive score data to host
      sendScoreToHost(
        newScore,
        currentMap?.name || `Level ${currentLevel}`,
        currentLevel,
        lives,
        multiplier
      );
    },

    resetLevelScores: () => {
      set({ levelScore: 0 });
    },

    resetGameState: () => {
      console.log(
        `🔄 Resetting game state - setting lives to ${GAME_CONFIG.STARTING_LIVES}`
      );
      set({
        currentState: GameState.MENU,
        showMenu: MenuType.START,
        previousMenu: null,
        score: 0,
        levelScore: 0,
        lives: GAME_CONFIG.STARTING_LIVES,
        currentLevel: 1,
        isPaused: false,
        bonusAnimationComplete: false,
      });

      // Send state update
      const currentMap =
        "currentMap" in get() ? (get() as any).currentMap : null;
      sendGameStateUpdate(GameState.MENU, currentMap?.name);
    },

    setBonusAnimationComplete: (complete: boolean) => {
      set({ bonusAnimationComplete: complete });
    },
  };
};
