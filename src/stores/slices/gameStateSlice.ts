import { StateCreator } from "zustand";
import { GameState, MenuType } from "../../types/enums";
import { GAME_CONFIG } from "../../types/constants";
import { calculateBombScore, formatScoreLog } from "../../lib/scoringUtils";
import {
  sendScoreToHost,
  sendGameStateUpdate,
  sendGameCompletionData,
  LevelHistoryEntry,
  calculateGameStats,
  GameCompletionData,
} from "@/lib/communicationUtils";
import { mapDefinitions } from "@/maps/mapDefinitions";
import { log } from "../../lib/logger";

interface StoreAPI {
  currentMap?: { name: string };
  resetMultiplier: () => void;
  getLevelHistory: () => Array<{
    coinsCollected: number;
    powerModeActivations: number;
  }>;
  getLevelResults: () => LevelHistoryEntry[];
  getGameStartTime: () => number;
  getSessionId: () => string;
  multiplier: number;
}

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
  setBonusAnimationComplete: (complete: boolean) => void;
  loseLife: () => void;
  addLife: () => void;
  nextLevel: () => void;
  addScore: (points: number) => void;
  resetLevelScores: () => void;
  resetGameState: () => void;
}

export const createGameStateSlice: StateCreator<GameStateSlice> = (
  set,
  get
) => {
  log.info(
    `Initializing game state slice with ${GAME_CONFIG.STARTING_LIVES} lives`
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
      const api = get();
      const currentMap =
        "currentMap" in api
          ? (api as { currentMap?: { name: string } }).currentMap
          : undefined;
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

    setBonusAnimationComplete: (complete: boolean) => {
      set({ bonusAnimationComplete: complete });
    },

    loseLife: () => {
      const { lives } = get();
      const newLives = lives - 1;

      log.info(`Losing life: ${lives} → ${newLives}`);
      set({ lives: newLives });

      // Reset multiplier when player dies
      const api = get();
      if ("resetMultiplier" in api) {
        (api as { resetMultiplier: () => void }).resetMultiplier();
        log.info("Multiplier reset to 1x after player death");
      }

      // Get current map for state update
      const currentMap =
        "currentMap" in api
          ? (api as { currentMap?: { name: string } }).currentMap
          : undefined;
      sendGameStateUpdate(GameState.PLAYING, currentMap?.name);

      // Check if game over after setting new lives
      if (newLives <= 0) {
        log.info(`GAME OVER triggered at ${newLives} lives`);
        set({
          currentState: GameState.GAME_OVER,
          showMenu: MenuType.GAME_OVER,
        });
        const currentMap =
          "currentMap" in api
            ? (api as { currentMap?: { name: string } }).currentMap
            : undefined;
        sendGameStateUpdate(GameState.GAME_OVER, currentMap?.name);

        // Send comprehensive game completion data for game over
        const levelResults =
          "getLevelResults" in api
            ? (
                api as { getLevelResults: () => LevelHistoryEntry[] }
              ).getLevelResults()
            : [];
        const multiplier =
          "multiplier" in api ? (api as { multiplier: number }).multiplier : 1;
        const gameStartTime =
          "getGameStartTime" in api
            ? (api as { getGameStartTime: () => number }).getGameStartTime()
            : Date.now();
        const sessionId =
          "getSessionId" in api
            ? (api as { getSessionId: () => string }).getSessionId()
            : `session_${Date.now()}_${Math.random()
                .toString(36)
                .substr(2, 9)}`;

        const gameStats = calculateGameStats(
          levelResults,
          get().score,
          newLives,
          multiplier,
          "failed",
          gameStartTime,
          Date.now()
        );

        const gameCompletionData: GameCompletionData = {
          finalScore: get().score,
          totalLevels: mapDefinitions.length,
          completedLevels: levelResults.length,
          timestamp: Date.now(),
          lives: newLives,
          multiplier,
          levelHistory: levelResults,
          totalCoinsCollected: gameStats.totalCoinsCollected,
          totalPowerModeActivations: gameStats.totalPowerModeActivations,
          totalBombs: gameStats.totalBombs,
          totalCorrectOrders: gameStats.totalCorrectOrders,
          averageCompletionTime: gameStats.averageCompletionTime,
          gameEndReason: "failed",
          sessionId,
          startTime: gameStartTime,
          endTime: Date.now(),
        };

        sendGameCompletionData(gameCompletionData);
      }
    },

    addLife: () => {
      const { lives } = get();
      const newLives = lives + 1;

      log.info(`Adding life: ${lives} → ${newLives}`);
      set({ lives: newLives });
    },

    nextLevel: () => {
      const { currentLevel } = get();
      set({ currentLevel: currentLevel + 1 });

      // Reset level scores and multiplier for new level
      set({ levelScore: 0 });

      // Reset multiplier directly
      const api = get();
      if ("resetMultiplier" in api) {
        log.debug("Resetting multiplier on level change...");
        (api as { resetMultiplier: () => void }).resetMultiplier();
      }

      // Send state update with new level info
      const currentMap =
        "currentMap" in api
          ? (api as { currentMap?: { name: string } }).currentMap
          : undefined;
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
      const api = get();
      const multiplier =
        "multiplier" in api ? (api as { multiplier: number }).multiplier : 1;
      const currentMap =
        "currentMap" in api
          ? (api as { currentMap?: { name: string } }).currentMap
          : undefined;

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
      set({
        currentState: GameState.MENU,
        score: 0,
        levelScore: 0,
        lives: GAME_CONFIG.STARTING_LIVES,
        currentLevel: 1,
        showMenu: MenuType.START,
        previousMenu: null,
        isPaused: false,
        bonusAnimationComplete: false,
      });
    },
  };
};
