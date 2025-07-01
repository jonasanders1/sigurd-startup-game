import { StateCreator } from 'zustand';
import { Coin, CoinSpawnPoint } from '../../types/interfaces';
import { CoinManager } from '../../managers/coinManager';
import { GAME_CONFIG } from '../../types/constants';

export interface CoinSlice {
  coins: Coin[];
  coinManager: CoinManager | null;
  activeEffects: {
    powerMode: boolean;
    powerModeEndTime: number;
  };
  firebombCount: number;
  totalCoinsCollected: number;
  totalPowerCoinsCollected: number;
  
  // Actions
  setCoins: (coins: Coin[]) => void;
  setCoinManager: (manager: CoinManager) => void;
  collectCoin: (coin: Coin) => void;
  onFirebombCollected: () => void;
  resetCoinState: () => void;
  updateMonsterStates: (monsters: any[]) => void;
  resetEffects: () => void;
  getCoinStats: () => { totalCoinsCollected: number; totalPowerCoinsCollected: number };
}

export const createCoinSlice: StateCreator<CoinSlice> = (set, get) => ({
  coins: [],
  coinManager: null,
  activeEffects: {
    powerMode: false,
    powerModeEndTime: 0
  },
  firebombCount: 0,
  totalCoinsCollected: 0,
  totalPowerCoinsCollected: 0,
  
  setCoins: (coins: Coin[]) => {
    set({ coins });
  },
  
  setCoinManager: (manager: CoinManager) => {
    set({ coinManager: manager });
  },
  
  collectCoin: (coin: Coin) => {
    const { coinManager } = get();
    if (!coinManager) return;
    
    coinManager.collectCoin(coin);
    
    // Update coins list
    const updatedCoins = get().coins.map(c => 
      c === coin ? { ...c, isCollected: true } : c
    );
    
    // Update active effects
    const activeEffects = {
      powerMode: coinManager.isPowerModeActive(),
      powerModeEndTime: coinManager.isPowerModeActive() ? Date.now() + GAME_CONFIG.POWER_COIN_DURATION : 0
    };
    
    // Update total collection counters
    const currentState = get();
    const newTotalCoinsCollected = currentState.totalCoinsCollected + 1;
    const newTotalPowerCoinsCollected = currentState.totalPowerCoinsCollected + (coin.type === 'POWER' ? 1 : 0);
    
    set({ 
      coins: updatedCoins,
      activeEffects,
      totalCoinsCollected: newTotalCoinsCollected,
      totalPowerCoinsCollected: newTotalPowerCoinsCollected
    });
    
    // Add points to score if we have access to the score system
    const api = get();
    if ('addScore' in api) {
      // Add points based on coin type
      let points = 0;
      if (coin.type === 'POWER') {
        points = GAME_CONFIG.POWER_COIN_POINTS;
      }
      
      if (points > 0) {
        (api as any).addScore(points);
      }
    }
    
    console.log(`💰 Coin collected: ${coin.type} (Total: ${newTotalCoinsCollected}, Power: ${newTotalPowerCoinsCollected})`);
  },
  
  onFirebombCollected: () => {
    const { coinManager } = get();
    if (!coinManager) return;
    
    coinManager.onFirebombCollected();
    set({ 
      firebombCount: coinManager.getFirebombCount(),
      coins: coinManager.getCoins()
    });
  },
  
  resetCoinState: () => {
    const { coinManager } = get();
    if (coinManager) {
      coinManager.reset();
    }
    
    set({
      coins: [],
      activeEffects: {
        powerMode: false,
        powerModeEndTime: 0
      },
      firebombCount: 0,
      totalCoinsCollected: 0,
      totalPowerCoinsCollected: 0
    });
  },
  
  getCoinStats: () => {
    const state = get();
    return {
      totalCoinsCollected: state.totalCoinsCollected,
      totalPowerCoinsCollected: state.totalPowerCoinsCollected
    };
  },
  
  updateMonsterStates: (monsters: any[]) => {
    const { coinManager } = get();
    if (!coinManager) return;
    
    // Check if power mode just ended
    const wasPowerModeActive = get().activeEffects.powerMode;
    const isPowerModeActive = coinManager.isPowerModeActive();
    
    if (wasPowerModeActive && !isPowerModeActive) {
      // Power mode just ended, unfreeze all monsters
      monsters.forEach(monster => {
        monster.isFrozen = false;
      });
    } else {
      // Update monster states based on current power mode
      coinManager.updateMonsters(monsters);
    }
    
    // Update active effects state
    set({
      activeEffects: {
        powerMode: isPowerModeActive,
        powerModeEndTime: isPowerModeActive ? Date.now() + GAME_CONFIG.POWER_COIN_DURATION : 0
      }
    });
  },
  
  resetEffects: () => {
    const { coinManager } = get();
    if (coinManager) {
      coinManager.resetEffects();
    }
    
    set({
      activeEffects: {
        powerMode: false,
        powerModeEndTime: 0
      }
    });
  }
}); 