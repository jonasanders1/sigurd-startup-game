import { create } from "zustand";
import { AudioEvent, GameState, MenuType, TutorialMissionId } from "../../types/enums";
import { useAudioStore } from "../systems/audioStore";
import { Founding } from "../../types/interfaces";
import { FoundingManager } from "../../managers/foundingManager";
import { GAME_CONFIG } from "../../types/constants";
import {
  calculateFoundingScore,
  formatScoreLog,
  formatScoreText,
} from "../../lib/scoringUtils";
import { clampLives } from "../../lib/bjRules";
import { getTuned } from "../systems/tuningStore";
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
import type { SubTaskId } from "../../managers/TutorialManager";
import { TUTORIAL_MISSIONS } from "../../tutorials/missions";

interface StateData {
  currentState: GameState;
  lives: number;
  // Lifetime lives lost this game (NOT decremented by extra-life pickups).
  // Drives BJ-style E-coin death-generosity. Resets on resetGameState.
  livesLostThisGame: number;
  currentLevel: number;
  showMenu: MenuType;
  previousMenu: MenuType | null;
  isPaused: boolean;
  bonusAnimationComplete: boolean;
  gameStateManager?: any;

  // Founding-related state
  foundings: Founding[];
  collectedFoundings: number[];
  correctOrderCount: number;
  nextFoundingOrder: number;
  foundingManager: FoundingManager | null;

  // Tutorial state — null when playing the regular game.
  tutorialMission: TutorialMissionId | null;
  // Mission selected from the picker, awaiting Start on the brief screen.
  pendingTutorialMission: TutorialMissionId | null;
  tutorialSubTasks: string[]; // ids of completed sub-tasks for current mission
  // For Mission 4 (KILL): index into P_COIN_COLORS of the coin whose power mode
  // is currently active. Null when no power mode is running.
  tutorialActivePcoinIndex: number | null;
  tutorialResult: {
    missionId?: TutorialMissionId;
    stats?: Record<string, number | string>;
    reason: "complete" | "skipped";
  } | null;
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

  // Founding-related actions
  collectFounding: (foundingOrder: number) => { isValid: boolean; isCorrect: boolean };
  setFoundings: (foundings: Founding[]) => void;
  setFoundingManager: (foundingManager: FoundingManager) => void;
  resetFoundingState: () => void;

  // Tutorial actions
  setTutorialMission: (id: TutorialMissionId | null) => void;
  setPendingTutorialMission: (id: TutorialMissionId | null) => void;
  markTutorialSubTask: (id: SubTaskId) => void;
  resetTutorialSubTasks: () => void;
  setTutorialActivePcoinIndex: (index: number | null) => void;
  setTutorialResult: (
    result: {
      missionId?: TutorialMissionId;
      stats?: Record<string, number | string>;
      reason: "complete" | "skipped";
    } | null
  ) => void;
}

export type StateStore = StateData & StateActions;

export const useStateStore = create<StateStore>((set, get) => ({
  // State
  currentState: GameState.MENU,
  lives: GAME_CONFIG.STARTING_LIVES,
  livesLostThisGame: 0,
  currentLevel: 1,
  showMenu: MenuType.START,
  previousMenu: null,
  isPaused: false,
  bonusAnimationComplete: false,
  gameStateManager: undefined,

  foundings: [],
  collectedFoundings: [],
  correctOrderCount: 0,
  nextFoundingOrder: 1,
  foundingManager: null,

  tutorialMission: null,
  pendingTutorialMission: null,
  tutorialSubTasks: [],
  tutorialActivePcoinIndex: null,
  tutorialResult: null,

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
    const { lives, livesLostThisGame } = get();
    const newLives = lives - 1;

    log.player(`Losing life: ${lives} → ${newLives}`);
    set({ lives: newLives, livesLostThisGame: livesLostThisGame + 1 });

    // Reset multiplier when player dies
    const scoreStore = useScoreStore.getState();
    scoreStore.resetMultiplier();
    log.score("Multiplier reset to 1x after player death");

    // Get current map for state update
    const levelStore = useLevelStore.getState();
    sendGameStateUpdate(GameState.PLAYING, levelStore.currentMap?.name);

    // Check if game over after setting new lives
    if (newLives <= 0) {
      log.game(`GAME OVER triggered at ${newLives} lives`);
      // Route through GameStateManager so handleStateTransition fires —
      // that's where the P-coin ambient loop, power-up melody, and all the
      // pausable managers get torn down. A direct `set` would update the
      // HUD state but leave the P-coin loop playing into the menu.
      const gameStateManager = get().gameStateManager;
      if (gameStateManager) {
        gameStateManager.setState(GameState.GAME_OVER, MenuType.GAME_OVER);
      } else {
        set({
          currentState: GameState.GAME_OVER,
          showMenu: MenuType.GAME_OVER,
        });
      }
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
        completedLevels: levelResults.filter((l: any) => !l.isPartial).length,
        timestamp: Date.now(),
        lives: newLives,
        multiplier,
        levelHistory: levelResults,
        totalCoinsCollected: gameStats.totalCoinsCollected,
        totalPowerModeActivations: gameStats.totalPowerModeActivations,
        totalPCoinTierCollections: gameStats.totalPCoinTierCollections,
        totalFoundings: gameStats.totalFoundings,
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
    // BJ HUD constraint (game-specs §11): cap at 9 lives. Live-tunable.
    const cap = getTuned("MAX_LIVES");
    const newLives = clampLives(lives + 1, cap);

    if (newLives === lives) {
      log.player(`Add-life ignored — already at cap (${cap})`);
      return;
    }
    log.player(`Adding life: ${lives} → ${newLives}`);
    set({ lives: newLives });
  },

  nextLevel: () => {
    const { currentLevel } = get();
    set({ currentLevel: currentLevel + 1 });

    // Reset level scores and multiplier for new level
    const scoreStore = useScoreStore.getState();
    scoreStore.resetLevelScore();
    scoreStore.resetMultiplier();
    log.score("Resetting multiplier on level change...");

    // Send state update with new level info
    const levelStore = useLevelStore.getState();
    sendGameStateUpdate(GameState.PLAYING, levelStore.currentMap?.name);

    return currentLevel + 1;
  },

  resetGameState: () => {
    set({
      currentState: GameState.MENU,
      lives: getTuned("STARTING_LIVES"),
      livesLostThisGame: 0,
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

  // Founding actions
  collectFounding: (foundingOrder: number) => {
    const { foundings, foundingManager } = get();

    const founding = foundings.find((b) => b.order === foundingOrder);
    if (!founding || !foundingManager) {
      log.warn("Founding or founding manager not found");
      return { isValid: false, isCorrect: false };
    }

    const result = foundingManager.handleFoundingClick(founding.group, founding.order);

    if (!result.isValid) {
      return { isValid: false, isCorrect: false };
    }

    // Determine if this is a firefounding (next correct founding in sequence)
    const isFirefounding = result.isCorrect;

    // Get current multiplier from the score store
    const scoreStore = useScoreStore.getState();
    const currentMultiplier = scoreStore.multiplier;

    // Calculate score using utility function
    const scoreCalculation = calculateFoundingScore(isFirefounding, currentMultiplier);

    // Add score to game state
    scoreStore.addScore(scoreCalculation.actualPoints);

    // BJ: multiplier advances ONLY via B-coin pickup, not via score thresholds.

    // Notify coin manager. Founding points (correct + incorrect) count toward
    // the BJ B-coin 5K threshold (bjRules.isThresholdablePointSource).
    const coinStore = useCoinStore.getState();
    if (coinStore.coinManager) {
      coinStore.coinManager.onFirefoundingPointsEarned(scoreCalculation.actualPoints); // stats only
      coinStore.onPointsEarned(scoreCalculation.actualPoints, false);
    }

    // Log the score (only for firefoundings or high scores to reduce spam)
    if (isFirefounding || scoreCalculation.actualPoints >= 400) {
      log.score(formatScoreLog(scoreCalculation));
    }

    // Add floating text for correct founding collection
    if (isFirefounding) {
      const founding = foundings.find((b) => b.order === foundingOrder);
      if (founding) {
        const renderStore = useRenderStore.getState();
        const text = formatScoreText(
          scoreCalculation.basePoints,
          scoreCalculation.multiplier
        );
        renderStore.addFloatingText(
          text,
          founding.x + founding.width / 2,
          founding.y + founding.height / 2,
          1000, // duration
          "#fff", // color
          15 // fontSize
        );
      }
    }

    const updatedFoundings = foundings.map((b) => {
      if (b.order === foundingOrder) {
        return { ...b, isCollected: true, isCorrect: result.isCorrect };
      }

      const nextGroup = foundingManager.getActiveGroup();
      const nextOrder = foundingManager.getNextFoundingOrder();
      const isNextFounding =
        nextGroup !== null &&
        nextOrder !== null &&
        b.group === nextGroup &&
        b.order === nextOrder &&
        !b.isCollected;

      return { ...b, isBlinking: isNextFounding };
    });

    set({
      foundings: updatedFoundings,
      correctOrderCount: foundingManager.getCorrectOrderCount(),
      collectedFoundings: Array.from(foundingManager.getCollectedFoundings()).map((id) => {
        const [group, order] = id.split("-").map(Number);
        return order;
      }),
    });

    return { isValid: true, isCorrect: result.isCorrect };
  },

  setFoundings: (foundings: Founding[]) => {
    set({ foundings });
  },

  setFoundingManager: (foundingManager: FoundingManager) => {
    set({ foundingManager });
  },

  resetFoundingState: () => {
    set({
      foundings: [],
      collectedFoundings: [],
      correctOrderCount: 0,
      nextFoundingOrder: 1,
      foundingManager: null,
    });
  },

  setTutorialMission: (id) => {
    set({
      tutorialMission: id,
      tutorialSubTasks: [],
      tutorialActivePcoinIndex: null,
    });
  },

  setPendingTutorialMission: (id) => set({ pendingTutorialMission: id }),

  setTutorialActivePcoinIndex: (index) =>
    set({ tutorialActivePcoinIndex: index }),

  markTutorialSubTask: (id) => {
    const { tutorialSubTasks, tutorialMission } = get();
    if (tutorialSubTasks.includes(id)) return;
    if (!tutorialMission) return;
    // Order gate: a sub-task is only accepted when it's the next expected one
    // in the mission's declared subTasks order. Lets the UI dim upcoming rows
    // and prevents the player from completing them out-of-sequence.
    const subTasks = TUTORIAL_MISSIONS[tutorialMission].subTasks;
    if (!subTasks) return;
    if (subTasks[tutorialSubTasks.length]?.id !== id) return;
    set({ tutorialSubTasks: [...tutorialSubTasks, id] });
    useAudioStore.getState().audioManager?.playSound(
      AudioEvent.TUTORIAL_SUBTASK_COMPLETE,
    );
  },

  resetTutorialSubTasks: () => set({ tutorialSubTasks: [] }),

  setTutorialResult: (result) => set({ tutorialResult: result }),
}));
