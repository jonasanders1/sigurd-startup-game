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
  totalExtraLifeCoinsCollected: number;
  
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
  totalExtraLifeCoinsCollected: 0,
  
  setCoins: (coins: Coin[]) => {
    set({ coins });
  },
  
  setCoinManager: (manager: CoinManager) => {
    set({ coinManager: manager });
  },
  
  collectCoin: (coin: Coin) => {
    const { coinManager } = get();
    if (!coinManager) return;
    
    log.debug(`Coin slice: Collecting ${coin.type} coin`);
    
    // Get the current game state to pass to coinManager.collectCoin
    const currentState = get();
    
    // Pass the game state to coinManager so effects can be applied
    coinManager.collectCoin(coin, currentState as unknown as Record<string, unknown>);
    
    log.debug(`Coin slice: Coin manager collectCoin completed`);
    
    // Update coins list
    const updatedCoins = currentState.coins.map(c => 
      c === coin ? { ...c, isCollected: true } : c
    );
    
    // Update active effects with dynamic duration for P-coins
    let powerModeEndTime = 0;
    if (coinManager.isPowerModeActive()) {
      if (coin.type === 'POWER' && coin.spawnTime !== undefined) {
        // Get duration based on coin color
        const colorData = coinManager.getPcoinColorForTime(coin.spawnTime);
        powerModeEndTime = Date.now() + colorData.duration;
      }
      // No fallback needed - if it's not a P-coin, power mode shouldn't be active
    }
    
    const activeEffects = {
      powerMode: coinManager.isPowerModeActive(),
      powerModeEndTime
    };
    
    // Update total collection counters
    const newTotalCoinsCollected = currentState.totalCoinsCollected + 1;
    const newTotalPowerCoinsCollected = currentState.totalPowerCoinsCollected + (coin.type === 'POWER' ? 1 : 0);
    const newTotalBonusMultiplierCoinsCollected = currentState.totalBonusMultiplierCoinsCollected + (coin.type === 'BONUS_MULTIPLIER' ? 1 : 0);
    const newTotalExtraLifeCoinsCollected = currentState.totalExtraLifeCoinsCollected + (coin.type === 'EXTRA_LIFE' ? 1 : 0);
    
    set({ 
      coins: updatedCoins,
      activeEffects,
      totalCoinsCollected: newTotalCoinsCollected,
      totalPowerCoinsCollected: newTotalPowerCoinsCollected,
      totalBonusMultiplierCoinsCollected: newTotalBonusMultiplierCoinsCollected,
      totalExtraLifeCoinsCollected: newTotalExtraLifeCoinsCollected
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
    } else if (coin.type === 'EXTRA_LIFE') {
      // Handle EXTRA_LIFE coin effects
      if ('addScore' in api && 'multiplier' in api && 'addLife' in api) {
        const currentMultiplier = (api as { multiplier: number }).multiplier;
        const points = GAME_CONFIG.EXTRA_LIFE_COIN_POINTS * currentMultiplier;
        (api as { addScore: (points: number) => void }).addScore(points);
        
        // Add extra life
        (api as { addLife: () => void }).addLife();
        log.debug(`Extra life added via coin slice!`);
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
      totalBonusMultiplierCoinsCollected: 0,
      totalExtraLifeCoinsCollected: 0
    });
  },
  
  getCoinStats: () => {
    const state = get();
    return {
      totalCoinsCollected: state.totalCoinsCollected,
      totalPowerCoinsCollected: state.totalPowerCoinsCollected,
      totalBonusMultiplierCoinsCollected: state.totalBonusMultiplierCoinsCollected,
      totalExtraLifeCoinsCollected: state.totalExtraLifeCoinsCollected
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
    let powerModeEndTime = 0;
    if (isPowerModeActive && coinManager) {
      // For ongoing power mode, get the actual end time from the effect
      powerModeEndTime = coinManager.getPowerModeEndTime();
    }
    
    set({
      activeEffects: {
        powerMode: isPowerModeActive,
        powerModeEndTime
      }
    });
  },
  
  resetEffects: () => {
    const { coinManager } = get();
    if (coinManager) {
      // Force stop power mode and melody before resetting
      coinManager.forceStopPowerMode();
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