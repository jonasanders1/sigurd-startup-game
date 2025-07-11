import { StateCreator } from 'zustand';
import { Coin, CoinSpawnPoint, Monster } from '../../types/interfaces';
import { CoinManager } from '../../managers/coinManager';
import { GAME_CONFIG } from '../../types/constants';
import { log } from '../../lib/logger';

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
  totalBonusMultiplierCoinsCollected: number;
  
  // Actions
  setCoins: (coins: Coin[]) => void;
  setCoinManager: (manager: CoinManager) => void;
  collectCoin: (coin: Coin) => void;
  onFirebombCollected: () => void;
  resetCoinState: () => void;
  updateMonsterStates: (monsters: Monster[]) => void;
  resetEffects: () => void;
  getCoinStats: () => { totalCoinsCollected: number; totalPowerCoinsCollected: number; totalBonusMultiplierCoinsCollected: number };
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
  totalBonusMultiplierCoinsCollected: 0,
  
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
    const newTotalBonusMultiplierCoinsCollected = currentState.totalBonusMultiplierCoinsCollected + (coin.type === 'BONUS_MULTIPLIER' ? 1 : 0);
    
    set({ 
      coins: updatedCoins,
      activeEffects,
      totalCoinsCollected: newTotalCoinsCollected,
      totalPowerCoinsCollected: newTotalPowerCoinsCollected,
      totalBonusMultiplierCoinsCollected: newTotalBonusMultiplierCoinsCollected
    });
    
    // Handle coin-specific effects
    const api = get();
    
    if (coin.type === 'POWER') {
      // Add points for POWER coin
      if ('addScore' in api) {
        (api as { addScore: (points: number) => void }).addScore(GAME_CONFIG.POWER_COIN_POINTS);
      }
    } else if (coin.type === 'BONUS_MULTIPLIER') {
      // Handle BONUS_MULTIPLIER coin effects
      if ('addScore' in api && 'multiplier' in api) {
        const currentMultiplier = (api as { multiplier: number }).multiplier;
        const points = 1000 * currentMultiplier;
        (api as { addScore: (points: number) => void }).addScore(points);
        
        // Increase multiplier if not at max
        if (currentMultiplier < GAME_CONFIG.MAX_MULTIPLIER) {
          // Use the multiplier slice's method to properly increase multiplier
          if ('addMultiplierScore' in api && 'multiplierScore' in api) {
            // Add enough points to reach the next multiplier threshold
            const { MULTIPLIER_THRESHOLDS } = GAME_CONFIG;
            const nextThreshold = MULTIPLIER_THRESHOLDS[(currentMultiplier + 1) as keyof typeof MULTIPLIER_THRESHOLDS];
            if (nextThreshold !== undefined) {
              const pointsNeeded = nextThreshold - (api as { multiplierScore: number }).multiplierScore;
              (api as { addMultiplierScore: (points: number) => void }).addMultiplierScore(pointsNeeded);
            }
          }
        }
      }
    }
    
    log.debug(`Coin collected: ${coin.type} (Total: ${newTotalCoinsCollected}, Power: ${newTotalPowerCoinsCollected}, Bonus: ${newTotalBonusMultiplierCoinsCollected})`);
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
      totalPowerCoinsCollected: 0,
      totalBonusMultiplierCoinsCollected: 0
    });
  },
  
  getCoinStats: () => {
    const state = get();
    return {
      totalCoinsCollected: state.totalCoinsCollected,
      totalPowerCoinsCollected: state.totalPowerCoinsCollected,
      totalBonusMultiplierCoinsCollected: state.totalBonusMultiplierCoinsCollected
    };
  },
  
  updateMonsterStates: (monsters: Monster[]) => {
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