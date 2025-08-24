import { create } from "zustand";
import { GameState, MenuType } from "../../types/enums";
import { Bomb } from "../../types/interfaces";
import { BombManager } from "../../managers/bombManager";
import { GAME_CONFIG } from "../../types/constants";
import { calculateBombScore, formatScoreLog } from "../../lib/scoringUtils";
import {
  sendScoreToHost,
  sendGameStateUpdate,
  sendGameCompletionData,
  calculateGameStats,
  GameCompletionData,
} from "@/lib/communicationUtils";
import { mapDefinitions } from "@/maps/mapDefinitions";
import { log } from "../../lib/logger";
import { useScoreStore } from "./scoreStore";
import { useLevelStore } from "./levelStore";
import { useCoinStore } from "../entities/coinStore";
import { useRenderStore } from "../systems/renderStore";

interface StateData {
  currentState: GameState;
  lives: number;
  currentLevel: number;
  showMenu: MenuType;
  previousMenu: MenuType | null;
  isPaused: boolean;
  bonusAnimationComplete: boolean;
  gameStateManager?: any;

  // Bomb-related state
  bombs: Bomb[];
  collectedBombs: number[];
  correctOrderCount: number;
  nextBombOrder: number;
  bombManager: BombManager | null;
}

interface StateActions {
  setState: (state: GameState) => void;
  setMenuType: (menuType: MenuType) => void;
  setBonusAnimationComplete: (complete: boolean) => void;
  loseLife: () => void;
  addLife: () => void;
  nextLevel: () => number;
  resetGameState: () => void;
  setGameStateManager: (manager: any) => void;

  // Bomb-related actions
  collectBomb: (bombOrder: number) => { isValid: boolean; isCorrect: boolean };
  setBombs: (bombs: Bomb[]) => void;
  setBombManager: (bombManager: BombManager) => void;
  resetBombState: () => void;
}

export type StateStore = StateData & StateActions;

export const useStateStore = create<StateStore>((set, get) => ({
  // State
  currentState: GameState.MENU,
  lives: GAME_CONFIG.STARTING_LIVES,
  currentLevel: 1,
  showMenu: MenuType.START,
  previousMenu: null,
  isPaused: false,
  bonusAnimationComplete: false,
  gameStateManager: undefined,

  bombs: [],
  collectedBombs: [],
  correctOrderCount: 0,
  nextBombOrder: 1,
  bombManager: null,

  // Actions
  setState: (state: GameState) => {
    set({
      currentState: state,
      isPaused: state === GameState.PAUSED,
    });

    // Handle menu type based on game state
    switch (state) {
      case GameState.MENU:
        set({ showMenu: MenuType.START });
        break;
      case GameState.COUNTDOWN:
        set({ showMenu: MenuType.COUNTDOWN });
        break;
      case GameState.PLAYING:
        set({ showMenu: MenuType.IN_GAME });
        break;
      case GameState.PAUSED:
        set({ showMenu: MenuType.PAUSE });
        break;
      case GameState.BONUS:
        set({ showMenu: MenuType.BONUS });
        break;
      case GameState.VICTORY:
        set({ showMenu: MenuType.VICTORY });
        break;
      case GameState.GAME_OVER:
        set({ showMenu: MenuType.GAME_OVER });
        break;
      case GameState.MAP_CLEARED:
        // Keep current menu type for map cleared
        break;
      default:
        // For any other states, hide the menu
        set({ showMenu: MenuType.IN_GAME });
    }

    // Get current map for state update
    const levelStore = useLevelStore.getState();
    sendGameStateUpdate(state, levelStore.currentMap?.name);
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
    const scoreStore = useScoreStore.getState();
    scoreStore.resetMultiplier();
    log.info("Multiplier reset to 1x after player death");

    // Get current map for state update
    const levelStore = useLevelStore.getState();
    sendGameStateUpdate(GameState.PLAYING, levelStore.currentMap?.name);

    // Check if game over after setting new lives
    if (newLives <= 0) {
      log.info(`GAME OVER triggered at ${newLives} lives`);
      set({
        currentState: GameState.GAME_OVER,
        showMenu: MenuType.GAME_OVER,
      });
      sendGameStateUpdate(GameState.GAME_OVER, levelStore.currentMap?.name);

      // Send comprehensive game completion data for game over
      const levelResults = levelStore.getLevelResults();
      const multiplier = scoreStore.multiplier;
      const gameStartTime = levelStore.getGameStartTime();
      const sessionId = levelStore.getSessionId();
      const score = scoreStore.score;

      const gameStats = calculateGameStats(
        levelResults,
        score,
        newLives,
        multiplier,
        "failed",
        gameStartTime,
        Date.now()
      );

      const gameCompletionData: GameCompletionData = {
        finalScore: score,
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
    const scoreStore = useScoreStore.getState();
    scoreStore.resetLevelScore();
    scoreStore.resetMultiplier();
    log.debug("Resetting multiplier on level change...");

    // Send state update with new level info
    const levelStore = useLevelStore.getState();
    sendGameStateUpdate(GameState.PLAYING, levelStore.currentMap?.name);

    return currentLevel + 1;
  },

  resetGameState: () => {
    set({
      currentState: GameState.MENU,
      lives: GAME_CONFIG.STARTING_LIVES,
      currentLevel: 1,
      showMenu: MenuType.START,
      previousMenu: null,
      isPaused: false,
      bonusAnimationComplete: false,
    });
  },

  setGameStateManager: (manager: any) => {
    set({ gameStateManager: manager });
  },

  // Bomb actions
  collectBomb: (bombOrder: number) => {
    const { bombs, bombManager } = get();

    const bomb = bombs.find((b) => b.order === bombOrder);
    if (!bomb || !bombManager) {
      log.warn("Bomb or bomb manager not found");
      return { isValid: false, isCorrect: false };
    }

    const result = bombManager.handleBombClick(bomb.group, bomb.order);

    if (!result.isValid) {
      return { isValid: false, isCorrect: false };
    }

    // Determine if this is a firebomb (next correct bomb in sequence)
    const isFirebomb = result.isCorrect;

    // Get current multiplier from the score store
    const scoreStore = useScoreStore.getState();
    const currentMultiplier = scoreStore.multiplier;

    // Calculate score using utility function
    const scoreCalculation = calculateBombScore(isFirebomb, currentMultiplier);

    // Add score to game state
    scoreStore.addScore(scoreCalculation.actualPoints);

    // Add points to multiplier system
    scoreStore.addMultiplierScore(scoreCalculation.actualPoints);

    // Notify coin manager about points earned (not bonus)
    const coinStore = useCoinStore.getState();
    if (coinStore.coinManager) {
      coinStore.coinManager.onPointsEarned(
        scoreCalculation.actualPoints,
        false
      );
    }

    // Log the score (only for firebombs or high scores to reduce spam)
    if (isFirebomb || scoreCalculation.actualPoints >= 400) {
      log.score(formatScoreLog(scoreCalculation));
    }

    // Add floating text for correct bomb collection
    if (isFirebomb) {
      const bomb = bombs.find((b) => b.order === bombOrder);
      if (bomb) {
        const renderStore = useRenderStore.getState();
        const text = `${scoreCalculation.actualPoints}`;
        renderStore.addFloatingText(
          text,
          bomb.x + bomb.width / 2,
          bomb.y + bomb.height / 2,
          1000, // duration
          "#FFD700", // color
          15 // fontSize
        );
      }
    }

    const updatedBombs = bombs.map((b) => {
      if (b.order === bombOrder) {
        return { ...b, isCollected: true, isCorrect: result.isCorrect };
      }

      const nextGroup = bombManager.getActiveGroup();
      const nextOrder = bombManager.getNextBombOrder();
      const isNextBomb =
        nextGroup !== null &&
        nextOrder !== null &&
        b.group === nextGroup &&
        b.order === nextOrder &&
        !b.isCollected;

      return { ...b, isBlinking: isNextBomb };
    });

    set({
      bombs: updatedBombs,
      correctOrderCount: bombManager.getCorrectOrderCount(),
      collectedBombs: Array.from(bombManager.getCollectedBombs()).map((id) => {
        const [group, order] = id.split("-").map(Number);
        return order;
      }),
    });

    return { isValid: true, isCorrect: result.isCorrect };
  },

  setBombs: (bombs: Bomb[]) => {
    set({ bombs });
  },

  setBombManager: (bombManager: BombManager) => {
    set({ bombManager });
  },

  resetBombState: () => {
    set({
      bombs: [],
      collectedBombs: [],
      correctOrderCount: 0,
      nextBombOrder: 1,
      bombManager: null,
    });
  },
}));
