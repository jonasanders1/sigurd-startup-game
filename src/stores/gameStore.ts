import { create } from 'zustand';
import { PlayerSlice, createPlayerSlice } from './slices/playerSlice';
import { GameStateSlice, createGameStateSlice } from './slices/gameStateSlice';
import { BombSlice, createBombSlice } from './slices/bombSlice';
import { LevelSlice, createLevelSlice } from './slices/levelSlice';
import { LevelHistorySlice, createLevelHistorySlice } from './slices/levelHistorySlice';
import { MultiplierSlice, createMultiplierSlice } from './slices/multiplierSlice';
import { AudioSettingsSlice, createAudioSettingsSlice } from './slices/audioSettingsSlice';
import { CoinSlice, createCoinSlice } from './slices/coinSlice';
import { MapDefinition } from '../types/interfaces';
import { CoinManager } from '../managers/coinManager';

interface GameStore extends PlayerSlice, GameStateSlice, BombSlice, LevelSlice, LevelHistorySlice, MultiplierSlice, AudioSettingsSlice, CoinSlice {
  resetGame: () => void;
}

export const useGameStore = create<GameStore>((set, get, api) => ({
  ...createPlayerSlice(set, get, api),
  ...createGameStateSlice(set, get, api),
  ...createBombSlice(set, get, api),
  ...createLevelSlice(set, get, api),
  ...createLevelHistorySlice(set, get, api),
  ...createMultiplierSlice(set, get, api),
  ...createAudioSettingsSlice(set, get, api),
  ...createCoinSlice(set, get, api),
  
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
  },
  
  // Override initializeLevel to handle the full game initialization
  initializeLevel: (mapData: MapDefinition) => {
    // Get the level slice's initializeLevel method
    const levelSlice = createLevelSlice(set, get, api);
    const { bombManager, firstBomb } = levelSlice.initializeLevel(mapData);
    
    // Set up bombs with blinking state
    const bombsWithState = mapData.bombs.map(bomb => ({
      ...bomb,
      isBlinking: bomb.group === firstBomb?.group && bomb.order === firstBomb?.order,
      isCollected: false,
      isCorrect: false
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
      nextBombOrder: 1
    });
    
    // Set player position
    get().setPlayerPosition(mapData.playerStartX, mapData.playerStartY);
    
    return { bombManager, firstBomb };
  }
}));