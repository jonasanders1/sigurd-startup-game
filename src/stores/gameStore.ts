import { create } from "zustand";
import { MapDefinition } from "../types/interfaces";
import { CoinManager } from "../managers/coinManager";
import { mapDefinitions } from "../maps/mapDefinitions";

// Import all individual stores
import { usePlayerStore } from "./entities/playerStore";
import { useCoinStore } from "./entities/coinStore";
import { useMonsterStore } from "./entities/monsterStore";
import { useAudioStore } from "./systems/audioStore";
import { useInputStore } from "./systems/inputStore";
import { useRenderStore } from "./systems/renderStore";
import { useLevelStore } from "./game/levelStore";
import { useScoreStore } from "./game/scoreStore";
import { useStateStore } from "./game/stateStore";

/**
 * Main Game Store - Orchestrator
 * 
 * This store provides backward compatibility while coordinating
 * between the new modular store architecture.
 * 
 * It acts as a facade that delegates to individual stores
 * and handles cross-store interactions.
 */

interface GameStore {
  // Orchestration methods
  resetGame: () => void;
  initializeLevel: (mapData: MapDefinition) => {
    bombManager: any;
    firstBomb: any;
  };
  getLevelHistory: () => any[];
  getGameStartTime: () => number;
  getSessionId: () => string;
}

export const useGameStore = create<GameStore>((set, get, api) => ({
  resetGame: () => {
    // Reset all stores in the correct order
    const stateStore = useStateStore.getState();
    const scoreStore = useScoreStore.getState();
    const playerStore = usePlayerStore.getState();
    const levelStore = useLevelStore.getState();
    const coinStore = useCoinStore.getState();
    const monsterStore = useMonsterStore.getState();
    const audioStore = useAudioStore.getState();
    const inputStore = useInputStore.getState();
    const renderStore = useRenderStore.getState();

    // Reset all state
    stateStore.resetGameState();
    stateStore.resetBombState();
    scoreStore.resetScore();
    scoreStore.resetMultiplier();
    playerStore.resetPlayer();
    levelStore.resetLevelState();
    levelStore.resetLevelHistory();
    coinStore.resetCoinState();
    coinStore.resetEffects();
    monsterStore.resetMonsters();
    audioStore.resetAudioSettings();
    inputStore.resetInput();
    renderStore.clearAllFloatingTexts();
    
    // After resetting everything, load the first level
    // This ensures the game is in a playable state with the first map loaded
    const firstMap = mapDefinitions[0];
    if (firstMap) {
      get().initializeLevel(firstMap);
    }
  },

  initializeLevel: (mapData: MapDefinition) => {
    const levelStore = useLevelStore.getState();
    const stateStore = useStateStore.getState();
    const coinStore = useCoinStore.getState();
    const monsterStore = useMonsterStore.getState();
    const playerStore = usePlayerStore.getState();
    
    // IMPORTANT: Reset bomb state first to clear collectedBombs from previous level
    stateStore.resetBombState();
    
    // Initialize level
    const { bombManager, firstBomb } = levelStore.initializeLevel(mapData);

    // Set up bombs without initial blinking (blinking will start after first bomb is collected)
    const bombsWithState = mapData.bombs.map((bomb) => ({
      ...bomb,
      isBlinking: false, // No initial blinking - will be set after first bomb collection
      isCollected: false,
      isCorrect: false,
    }));

    // Update bomb state
    stateStore.setBombs(bombsWithState);
    stateStore.setBombManager(bombManager);

    // Initialize coin manager
    const coinManager = new CoinManager(mapData.coinSpawnPoints || []);
    coinStore.setCoinManager(coinManager);

    // Initialize monsters
    monsterStore.initializeMonsters(mapData.monsters);

    // Reset bomb collection state
    stateStore.setBombs(bombsWithState);
    stateStore.setBombManager(bombManager);
    
    // Set player position
    playerStore.setPlayerPosition(mapData.playerStart.x, mapData.playerStart.y);

    return { bombManager, firstBomb };
  },

  // Convenience methods for accessing level history data
  getLevelHistory: () => {
    const levelStore = useLevelStore.getState();
    return levelStore.getLevelResults();
  },

  getGameStartTime: () => {
    const levelStore = useLevelStore.getState();
    return levelStore.getGameStartTime();
  },

  getSessionId: () => {
    const levelStore = useLevelStore.getState();
    return levelStore.getSessionId();
  },
}));

/**
 * Backward Compatibility Layer
 * 
 * These exports provide access to individual store methods
 * for components that haven't been updated to use the new stores directly
 */

// Helper function to get all store states combined
export const getGameState = () => {
  const player = usePlayerStore.getState();
  const coins = useCoinStore.getState();
  const monsters = useMonsterStore.getState();
  const audio = useAudioStore.getState();
  const input = useInputStore.getState();
  const render = useRenderStore.getState();
  const level = useLevelStore.getState();
  const score = useScoreStore.getState();
  const state = useStateStore.getState();

  return {
    // Player
    player: player.player,
    updatePlayer: player.updatePlayer,
    resetPlayer: player.resetPlayer,
    setPlayerPosition: player.setPlayerPosition,

    // State & Menu
    currentState: state.currentState,
    lives: state.lives,
    currentLevel: state.currentLevel,
    showMenu: state.showMenu,
    previousMenu: state.previousMenu,
    isPaused: state.isPaused,
    bonusAnimationComplete: state.bonusAnimationComplete,
    setState: state.setState,
    setMenuType: state.setMenuType,
    setBonusAnimationComplete: state.setBonusAnimationComplete,
    loseLife: state.loseLife,
    addLife: state.addLife,
    nextLevel: state.nextLevel,
    resetGameState: state.resetGameState,
    setGameStateManager: state.setGameStateManager,

    // Bombs
    bombs: state.bombs,
    collectedBombs: state.collectedBombs,
    correctOrderCount: state.correctOrderCount,
    nextBombOrder: state.nextBombOrder,
    bombManager: state.bombManager,
    collectBomb: state.collectBomb,
    setBombs: state.setBombs,
    setBombManager: state.setBombManager,
    resetBombState: state.resetBombState,

    // Score & Multiplier
    score: score.score,
    levelScore: score.levelScore,
    multiplier: score.multiplier,
    multiplierScore: score.multiplierScore,
    addScore: score.addScore,
    addMultiplierScore: score.addMultiplierScore,
    calculateMultiplier: score.calculateMultiplier,
    resetMultiplier: score.resetMultiplier,
    setMultiplier: score.setMultiplier,
    resetLevelScores: score.resetLevelScore,

    // Level
    currentMap: level.currentMap,
    levelStartTime: level.levelStartTime,
    levelCompletionTime: level.levelCompletionTime,
    platforms: level.platforms,
    ground: level.ground,
    sendLevelCompletionData: level.sendLevelCompletionData,
    resetLevelState: level.resetLevelState,

    // Level History
    levelHistory: level.levelHistory,
    gameStartTime: level.gameStartTime,
    sessionId: level.sessionId,
    addLevelResult: level.addLevelResult,
    getLevelResults: level.getLevelResults,
    resetLevelHistory: level.resetLevelHistory,
    setGameStartTime: level.setGameStartTime,

    // Monsters
    monsters: monsters.monsters,
    updateMonsters: monsters.updateMonsters,

    // Coins
    coins: coins.coins,
    coinManager: coins.coinManager,
    activeEffects: coins.activeEffects,
    firebombCount: coins.firebombCount,
    totalCoinsCollected: coins.totalCoinsCollected,
    totalPowerCoinsCollected: coins.totalPowerCoinsCollected,
    totalBonusMultiplierCoinsCollected: coins.totalBonusMultiplierCoinsCollected,
    totalExtraLifeCoinsCollected: coins.totalExtraLifeCoinsCollected,
    setCoins: coins.setCoins,
    setCoinManager: coins.setCoinManager,
    collectCoin: coins.collectCoin,
    onFirebombCollected: coins.onFirebombCollected,
    resetCoinState: coins.resetCoinState,
    updateMonsterStates: coins.updateMonsterStates,
    resetEffects: coins.resetEffects,
    getCoinStats: coins.getCoinStats,

    // Audio
    audioSettings: audio.audioSettings,
    audioManager: audio.audioManager,
    updateAudioSettings: audio.updateAudioSettings,
    resetAudioSettings: audio.resetAudioSettings,
    setAudioManager: audio.setAudioManager,

    // Input
    input: input.input,
    setInput: input.setInput,
    clearInput: input.clearInput,
    resetInput: input.resetInput,

    // Floating Texts
    floatingTexts: render.floatingTexts,
    addFloatingText: render.addFloatingText,
    removeFloatingText: render.removeFloatingText,
    updateFloatingTexts: render.updateFloatingTexts,
    clearAllFloatingTexts: render.clearAllFloatingTexts,
  };
};

// Export individual store hooks for direct access
export {
  usePlayerStore,
  useCoinStore,
  useMonsterStore,
  useAudioStore,
  useInputStore,
  useRenderStore,
  useLevelStore,
  useScoreStore,
  useStateStore,
};
