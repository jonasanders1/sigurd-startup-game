import { create } from "zustand";
import { PlayerSlice, createPlayerSlice } from "./slices/playerSlice";
import { GameStateSlice, createGameStateSlice } from "./slices/gameStateSlice";
import { BombSlice, createBombSlice } from "./slices/bombSlice";
import { LevelSlice, createLevelSlice } from "./slices/levelSlice";
import {
  LevelHistorySlice,
  createLevelHistorySlice,
} from "./slices/levelHistorySlice";
import {
  MultiplierSlice,
  createMultiplierSlice,
} from "./slices/multiplierSlice";
import {
  AudioSettingsSlice,
  createAudioSettingsSlice,
} from "./slices/audioSettingsSlice";
import { CoinSlice, createCoinSlice } from "./slices/coinSlice";
import {
  FloatingTextSlice,
  createFloatingTextSlice,
} from "./slices/floatingTextSlice";
import { MapDefinition } from "../types/interfaces";
import { CoinManager } from "../managers/coinManager";

interface GameStore
  extends PlayerSlice,
    GameStateSlice,
    BombSlice,
    LevelSlice,
    LevelHistorySlice,
    MultiplierSlice,
    AudioSettingsSlice,
    CoinSlice,
    FloatingTextSlice {
  resetGame: () => void;
  initializeLevel: (mapData: MapDefinition) => {
    bombManager: any;
    firstBomb: any;
  };
  getLevelHistory: () => any[];
  getGameStartTime: () => number;
  getSessionId: () => string;
}

export const useGameStore = create<GameStore>((set, get, api) => {
  // Create all slices first
  const playerSlice = createPlayerSlice(set, get, api);
  const gameStateSlice = createGameStateSlice(set, get, api);
  const bombSlice = createBombSlice(set, get, api);
  const levelSlice = createLevelSlice(set, get, api);
  const levelHistorySlice = createLevelHistorySlice(set, get, api);
  const multiplierSlice = createMultiplierSlice(set, get, api);
  const audioSettingsSlice = createAudioSettingsSlice(set, get, api);
  const coinSlice = createCoinSlice(set, get, api);
  const floatingTextSlice = createFloatingTextSlice(set, get, api);

  return {
    ...playerSlice,
    ...gameStateSlice,
    ...bombSlice,
    ...levelSlice,
    ...levelHistorySlice,
    ...multiplierSlice,
    ...audioSettingsSlice,
    ...coinSlice,
    ...floatingTextSlice,

    resetGame: () => {
      get().resetGameState();
      get().resetPlayer();
      get().resetBombState();
      get().resetLevelState();
      get().resetLevelHistory();
      get().resetMultiplier();
      get().resetAudioSettings();
      get().resetCoinState();
      get().resetEffects();
      get().clearAllFloatingTexts();
    },

    // Override initializeLevel to handle the full game initialization
    initializeLevel: (mapData: MapDefinition) => {
      // Get the level slice's initializeLevel method
      const { bombManager, firstBomb } = levelSlice.initializeLevel(mapData);

      // Set up bombs without initial blinking (blinking will start after first bomb is collected)
      const bombsWithState = mapData.bombs.map((bomb) => ({
        ...bomb,
        isBlinking: false, // No initial blinking - will be set after first bomb collection
        isCollected: false,
        isCorrect: false,
      }));

      // Update bomb state
      get().setBombs(bombsWithState);
      get().setBombManager(bombManager);

      // Initialize coin manager
      const coinManager = new CoinManager(mapData.coinSpawnPoints || []);
      get().setCoinManager(coinManager);

      // Reset bomb collection state
      set({
        collectedBombs: [],
        correctOrderCount: 0,
        nextBombOrder: 1,
      });

      // Set player position
      get().setPlayerPosition(mapData.playerStart.x, mapData.playerStart.y);

      return { bombManager, firstBomb };
    },

    // Add convenience methods for accessing level history data
    getLevelHistory: () => {
      return levelHistorySlice.getLevelResults();
    },

    getGameStartTime: () => {
      return levelHistorySlice.getGameStartTime();
    },

    getSessionId: () => {
      return levelHistorySlice.getSessionId();
    },
  };
});
