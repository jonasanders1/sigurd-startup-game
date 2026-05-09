import { create } from "zustand";
import { MapDefinition, Founding } from "../types/interfaces";
import { CoinManager } from "../managers/coinManager";
import { mapDefinitions } from "../maps/mapDefinitions";
import { BackgroundManager } from "../managers/BackgroundManager";
import { GAME_CONFIG } from "../types/constants";

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
    foundingManager: any;
    firstFounding: any;
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

    // Reset all game state (but preserve audio settings as they are user preferences)
    stateStore.resetGameState();
    stateStore.resetFoundingState();
    scoreStore.resetScore();
    scoreStore.resetMultiplier();
    playerStore.resetPlayer();
    levelStore.resetLevelState();
    levelStore.resetLevelHistory();
    coinStore.resetCoinState();
    coinStore.resetEffects();
    coinStore.resetLevelCoinCounters();
    monsterStore.resetMonsters();
    // audioStore.resetAudioSettings(); // Don't reset audio settings - they should persist
    inputStore.resetInput();
    renderStore.clearAllFloatingTexts();
    
    // After resetting everything, load the first level
    // This ensures the game is in a playable state with the first map loaded
    const firstMap = mapDefinitions[0];
    if (firstMap) {
      get().initializeLevel(firstMap);
      
      // Load the background for the first map if renderManager is available
      if (renderStore.renderManager) {
        renderStore.renderManager.loadMapBackground(firstMap.name);
      }
    }
  },

  initializeLevel: (mapData: MapDefinition) => {
    const levelStore = useLevelStore.getState();
    const stateStore = useStateStore.getState();
    const coinStore = useCoinStore.getState();
    const monsterStore = useMonsterStore.getState();
    const playerStore = usePlayerStore.getState();

    // IMPORTANT: Reset founding state first to clear collectedFoundings from previous level
    stateStore.resetFoundingState();

    // Use the map's foundings as authored. The win condition (LevelManager
    // checkWinCondition) compares against currentMap.foundings.length so partial
    // editor previews can still be won. Legacy padFoundingsTo to TOTAL_FOUNDINGS at
    // (0,0) was removed — it left visible placeholder foundings piled in the
    // top-left corner of editor previews.
    const paddedMap: MapDefinition = mapData;
    const paddedFoundings = mapData.foundings;

    // Initialize level using padded foundings so FoundingManager and the level store
    // both see all 24.
    const { foundingManager, firstFounding } = levelStore.initializeLevel(paddedMap);

    // Set up foundings without initial blinking (blinking will start after first founding is collected)
    const foundingsWithState = paddedFoundings.map((founding) => ({
      ...founding,
      isBlinking: false, // No initial blinking - will be set after first founding collection
      isCollected: false,
      isCorrect: false,
    }));

    // Update founding state
    stateStore.setFoundings(foundingsWithState);
    stateStore.setFoundingManager(foundingManager);

    // Initialize or update coin manager
    // Check if we already have a coin manager (preserve score tracking across levels)
    const existingCoinManager = coinStore.coinManager;
    if (existingCoinManager) {
      // Update spawn points for new level but preserve score tracking
      existingCoinManager.updateSpawnPoints(paddedMap.coinSpawnPoints || []);
      // Clear active coins but preserve score tracking
      existingCoinManager.clearActiveCoins();
    } else {
      // First time initialization
    const coinManager = new CoinManager(paddedMap.coinSpawnPoints || []);
    coinStore.setCoinManager(coinManager);
    }

    // Initialize monsters
    monsterStore.initializeMonsters(paddedMap.monsters);

    // Reset founding collection state
    stateStore.setFoundings(foundingsWithState);
    stateStore.setFoundingManager(foundingManager);
    
    // Set player position
    playerStore.setPlayerPosition(paddedMap.playerStart.x, paddedMap.playerStart.y);

    return { foundingManager, firstFounding };
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

    // Foundings
    foundings: state.foundings,
    collectedFoundings: state.collectedFoundings,
    correctOrderCount: state.correctOrderCount,
    nextFoundingOrder: state.nextFoundingOrder,
    foundingManager: state.foundingManager,
    collectFounding: state.collectFounding,
    setFoundings: state.setFoundings,
    setFoundingManager: state.setFoundingManager,
    resetFoundingState: state.resetFoundingState,

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
    firefoundingCount: coins.firefoundingCount,
    totalCoinsCollected: coins.totalCoinsCollected,
    totalPowerCoinsCollected: coins.totalPowerCoinsCollected,
    totalBonusMultiplierCoinsCollected: coins.totalBonusMultiplierCoinsCollected,
    totalExtraLifeCoinsCollected: coins.totalExtraLifeCoinsCollected,
    setCoins: coins.setCoins,
    setCoinManager: coins.setCoinManager,
    setFirefoundingCount: coins.setFirefoundingCount,
    clearActiveCoins: coins.clearActiveCoins,
    onPointsEarned: coins.onPointsEarned,
    calculateMonsterKillPoints: coins.calculateMonsterKillPoints,
    collectCoin: coins.collectCoin,
    onFirefoundingCollected: coins.onFirefoundingCollected,
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
