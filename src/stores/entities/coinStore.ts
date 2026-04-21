import { create } from "zustand";
import { Coin, Monster } from "../../types/interfaces";
import { CoinManager } from "../../managers/coinManager";
import { GAME_CONFIG } from "../../types/constants";
import { COIN_SPAWNING } from "../../config/coins";
import { log } from "../../lib/logger";
import { useScoreStore } from "../game/scoreStore";
import { useStateStore } from "../game/stateStore";
import { CoinType } from "../../types/enums";

interface CoinState {
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
  // Level-specific counters that accumulate across respawns
  levelCoinsCollected: number;
  levelPowerCoinsCollected: number;
  levelBonusMultiplierCoinsCollected: number;
  levelExtraLifeCoinsCollected: number;
}

interface CoinActions {
  setCoins: (coins: Coin[]) => void;
  setCoinManager: (manager: CoinManager) => void;
  setFirebombCount: (count: number) => void;
  clearActiveCoins: () => void;
  onPointsEarned: (points: number, isBonus: boolean) => void;
  calculateMonsterKillPoints: (multiplier: number) => number;
  collectCoin: (coin: Coin) => void;
  onFirebombCollected: () => void;
  resetCoinState: () => void;
  softResetCoinState: () => void;
  resetLevelCoinCounters: () => void;
  updateMonsterStates: (monsters: Monster[]) => void;
  resetEffects: () => void;
  getCoinStats: () => {
    totalCoinsCollected: number;
    totalPowerCoinsCollected: number;
    totalBonusMultiplierCoinsCollected: number;
    totalExtraLifeCoinsCollected: number;
  };
  getLevelCoinStats: () => {
    totalCoinsCollected: number;
    totalPowerCoinsCollected: number;
    totalBonusMultiplierCoinsCollected: number;
    totalExtraLifeCoinsCollected: number;
  };
}

export type CoinStore = CoinState & CoinActions;

export const useCoinStore = create<CoinStore>((set, get) => ({
  // State
  coins: [],
  coinManager: null,
  activeEffects: {
    powerMode: false,
    powerModeEndTime: 0,
  },
  firebombCount: 0,
  totalCoinsCollected: 0,
  totalPowerCoinsCollected: 0,
  totalBonusMultiplierCoinsCollected: 0,
  totalExtraLifeCoinsCollected: 0,
  // Level-specific counters
  levelCoinsCollected: 0,
  levelPowerCoinsCollected: 0,
  levelBonusMultiplierCoinsCollected: 0,
  levelExtraLifeCoinsCollected: 0,

  // Actions
  setCoins: (coins: Coin[]) => {
    set({ coins });
  },

  setCoinManager: (manager: CoinManager) => {
    set({ coinManager: manager });
  },

  setFirebombCount: (count: number) => {
    set({ firebombCount: count });
  },

  clearActiveCoins: () => {
    const { coinManager } = get();
    if (coinManager) {
      coinManager.clearActiveCoins();
    }
    set({ coins: [] });
  },

  onPointsEarned: (points: number, isBonus: boolean = false) => {
    const { coinManager } = get();
    if (coinManager) {
      coinManager.onPointsEarned(points, isBonus);
    }
  },

  calculateMonsterKillPoints: (multiplier: number): number => {
    const { coinManager } = get();
    if (coinManager) {
      return coinManager.calculateMonsterKillPoints(multiplier);
    }
    return 0; // Fallback if no coin manager available
  },

  collectCoin: (coin: Coin) => {
    const { coinManager } = get();
    if (!coinManager) return;

    log.coin(`Coin store: Collecting ${coin.type} coin`);

    // Use functional update to ensure we always work with the latest state
    set((currentState) => {
      log.data('CoinSpawn: BEFORE coin collection', {
        coinType: coin.type,
        currentBonusCount: currentState.totalBonusMultiplierCoinsCollected,
      });

      // Pass the game state to coinManager so effects can be applied
      coinManager.collectCoin(
        coin,
        currentState as unknown as Record<string, unknown>
      );

      log.coin(`Coin store: Coin manager collectCoin completed`);

      // Update coins list
      const updatedCoins = currentState.coins.map((c) =>
        c === coin ? { ...c, isCollected: true } : c
      );

      // Update active effects with dynamic duration for P-coins
      let powerModeEndTime = 0;
      if (coinManager.isPowerModeActive()) {
        if (coin.type === "POWER" && coin.spawnTime !== undefined) {
          // Get duration based on coin color
          const colorData = coinManager.getPcoinColorForTime(coin.spawnTime);
          powerModeEndTime = Date.now() + colorData.duration;
        }
      }

      const activeEffects = {
        powerMode: coinManager.isPowerModeActive(),
        powerModeEndTime,
      };

      // Update total collection counters
      const newTotalCoinsCollected = currentState.totalCoinsCollected + 1;
      const newTotalPowerCoinsCollected =
        currentState.totalPowerCoinsCollected + (coin.type === "POWER" || coin.type === CoinType.POWER ? 1 : 0);
      
      // Check for bonus multiplier coin (handle both string and enum)
      const isBonusCoin = coin.type === "BONUS_MULTIPLIER" || coin.type === CoinType.BONUS_MULTIPLIER;
      const bonusIncrement = isBonusCoin ? 1 : 0;
      
      // Debug: Log coin type and current bonus count before increment
      log.data('CoinSpawn: Updating bonus coin counter', {
        coinType: coin.type,
        coinTypeEnum: CoinType.BONUS_MULTIPLIER,
        typesMatch: coin.type === "BONUS_MULTIPLIER",
        typesMatchEnum: coin.type === CoinType.BONUS_MULTIPLIER,
        isBonusCoin,
        bonusIncrement,
        currentBonusCount: currentState.totalBonusMultiplierCoinsCollected,
        newBonusCount: currentState.totalBonusMultiplierCoinsCollected + bonusIncrement,
      });
      
      const newTotalBonusMultiplierCoinsCollected =
        currentState.totalBonusMultiplierCoinsCollected + bonusIncrement;
      const newTotalExtraLifeCoinsCollected =
        currentState.totalExtraLifeCoinsCollected +
        (coin.type === "EXTRA_LIFE" || coin.type === CoinType.EXTRA_LIFE ? 1 : 0);

      // Update level-specific counters (these accumulate across respawns)
      const newLevelCoinsCollected = currentState.levelCoinsCollected + 1;
      const newLevelPowerCoinsCollected =
        currentState.levelPowerCoinsCollected + (coin.type === "POWER" || coin.type === CoinType.POWER ? 1 : 0);
      const newLevelBonusMultiplierCoinsCollected =
        currentState.levelBonusMultiplierCoinsCollected + bonusIncrement;
      const newLevelExtraLifeCoinsCollected =
        currentState.levelExtraLifeCoinsCollected +
        (coin.type === "EXTRA_LIFE" || coin.type === CoinType.EXTRA_LIFE ? 1 : 0);

      // IMPORTANT: Spread existing state to preserve all fields, then update only what changed
      const updatedState = {
        ...currentState, // Preserve all existing state
        coins: updatedCoins,
        activeEffects,
        totalCoinsCollected: newTotalCoinsCollected,
        totalPowerCoinsCollected: newTotalPowerCoinsCollected,
        totalBonusMultiplierCoinsCollected: newTotalBonusMultiplierCoinsCollected,
        totalExtraLifeCoinsCollected: newTotalExtraLifeCoinsCollected,
        levelCoinsCollected: newLevelCoinsCollected,
        levelPowerCoinsCollected: newLevelPowerCoinsCollected,
        levelBonusMultiplierCoinsCollected: newLevelBonusMultiplierCoinsCollected,
        levelExtraLifeCoinsCollected: newLevelExtraLifeCoinsCollected,
      };

      // Store values for logging after state update
      const bonusCountForLogging = newTotalBonusMultiplierCoinsCollected;
      const totalCoinsForLogging = newTotalCoinsCollected;
      const powerCoinsForLogging = newTotalPowerCoinsCollected;

      // Log the state we're about to return
      log.data('CoinSpawn: Returning updated state', {
        coinType: coin.type,
        oldBonusCount: currentState.totalBonusMultiplierCoinsCollected,
        newBonusCount: bonusCountForLogging,
        returningBonusCount: updatedState.totalBonusMultiplierCoinsCollected,
      });

      return updatedState;
    });

    // Verify the state was actually updated (log after set completes)
    const verifyState = get();
    log.data('CoinSpawn: AFTER coin collection (state verification)', {
      coinType: coin.type,
      actualBonusCount: verifyState.totalBonusMultiplierCoinsCollected,
      timestamp: Date.now(),
    });

    // Get updated state for logging (after set completes)
    const updatedState = get();
    
    // Handle coin-specific effects by calling the individual stores
    const scoreStore = useScoreStore.getState();
    const stateStore = useStateStore.getState();

    if (coin.type === "POWER") {
      // Add points for POWER coin
      scoreStore.addScore(GAME_CONFIG.POWER_COIN_POINTS);
    } else if (coin.type === "BONUS_MULTIPLIER") {
      // Handle BONUS_MULTIPLIER coin effects
      const currentMultiplier = scoreStore.multiplier;
      const points = 1000 * currentMultiplier;
      scoreStore.addScore(points);

      // Increase multiplier if not at max
      if (currentMultiplier < GAME_CONFIG.MAX_MULTIPLIER) {
        // Add enough points to reach the next multiplier threshold
        const { MULTIPLIER_THRESHOLDS } = GAME_CONFIG;
        const nextThreshold =
          MULTIPLIER_THRESHOLDS[
            (currentMultiplier + 1) as keyof typeof MULTIPLIER_THRESHOLDS
          ];
        if (nextThreshold !== undefined) {
          const pointsNeeded = nextThreshold - scoreStore.multiplierScore;
          scoreStore.addMultiplierScore(pointsNeeded);
        }
      }
    } else if (coin.type === "EXTRA_LIFE") {
      // Handle EXTRA_LIFE coin effects
      const currentMultiplier = scoreStore.multiplier;
      const points = GAME_CONFIG.EXTRA_LIFE_COIN_POINTS * currentMultiplier;
      scoreStore.addScore(points);

      // Add extra life
      stateStore.addLife();
      log.player(`Extra life added via coin store!`);
    }

    log.coin(
      `Coin collected: ${coin.type} (Total: ${updatedState.totalCoinsCollected}, Power: ${updatedState.totalPowerCoinsCollected}, Bonus: ${updatedState.totalBonusMultiplierCoinsCollected})`
    );
    
    // Log coin collection for spawn debugging
    log.data('CoinSpawn: Coin collected', {
      coinType: coin.type,
      totalBonusMultiplierCoinsCollected: updatedState.totalBonusMultiplierCoinsCollected,
      nextMCoinAt: Math.ceil(updatedState.totalBonusMultiplierCoinsCollected / COIN_SPAWNING.EXTRA_LIFE_COIN_RATIO) * COIN_SPAWNING.EXTRA_LIFE_COIN_RATIO,
      willSpawnMCoin: updatedState.totalBonusMultiplierCoinsCollected > 0 && updatedState.totalBonusMultiplierCoinsCollected % COIN_SPAWNING.EXTRA_LIFE_COIN_RATIO === 0
    });
  },

  onFirebombCollected: () => {
    const { coinManager } = get();
    if (!coinManager) return;

    coinManager.onFirebombCollected();
    set({
      firebombCount: coinManager.getFirebombCount(),
      coins: coinManager.getCoins(),
    });
  },

  // Full reset for game over
  resetCoinState: () => {
    const { coinManager } = get();
    if (coinManager) {
      coinManager.reset();  // Full reset
    }

    set({
      coins: [],
      activeEffects: {
        powerMode: false,
        powerModeEndTime: 0,
      },
      firebombCount: 0,
      totalCoinsCollected: 0,
      totalPowerCoinsCollected: 0,
      totalBonusMultiplierCoinsCollected: 0,
      totalExtraLifeCoinsCollected: 0,
    });
    
    log.data('CoinStore: Full reset (game over) - all coin state cleared');
  },

  // Soft reset for level transitions - preserves spawn counters
  softResetCoinState: () => {
    const { coinManager } = get();
    if (coinManager) {
      coinManager.softReset();  // Soft reset preserves counters
    }

    // Preserve the counts that should persist across levels using functional update
    set((currentState) => {
      log.data('CoinStore: Soft reset - preserving counters', {
        totalBonusMultiplierCoinsCollected: currentState.totalBonusMultiplierCoinsCollected,
        totalCoinsCollected: currentState.totalCoinsCollected,
      });
      
      return {
        ...currentState, // Preserve all existing state
        coins: [],
        activeEffects: {
          powerMode: false,
          powerModeEndTime: 0,
        },
        // PRESERVE these counts across levels:
        firebombCount: coinManager?.getFirebombCount() || currentState.firebombCount,
        // The spread above already preserves all the total* counters, but being explicit:
        totalCoinsCollected: currentState.totalCoinsCollected,
        totalPowerCoinsCollected: currentState.totalPowerCoinsCollected,
        totalBonusMultiplierCoinsCollected: currentState.totalBonusMultiplierCoinsCollected,
        totalExtraLifeCoinsCollected: currentState.totalExtraLifeCoinsCollected,
      };
    });
    
    log.data('CoinStore: Soft reset (level transition) - preserving spawn counters:', {
      firebombCount: get().firebombCount,
      totalBonusMultiplierCoinsCollected: get().totalBonusMultiplierCoinsCollected,
      totalCoinsCollected: get().totalCoinsCollected
    });
  },

  resetLevelCoinCounters: () => {
    // Reset level-specific counters when moving to a new level
    set({
      levelCoinsCollected: 0,
      levelPowerCoinsCollected: 0,
      levelBonusMultiplierCoinsCollected: 0,
      levelExtraLifeCoinsCollected: 0,
    });
  },

  getCoinStats: () => {
    const state = get();
    return {
      totalCoinsCollected: state.totalCoinsCollected,
      totalPowerCoinsCollected: state.totalPowerCoinsCollected,
      totalBonusMultiplierCoinsCollected:
        state.totalBonusMultiplierCoinsCollected,
      totalExtraLifeCoinsCollected: state.totalExtraLifeCoinsCollected,
    };
  },

  getLevelCoinStats: () => {
    const state = get();
    return {
      totalCoinsCollected: state.levelCoinsCollected,
      totalPowerCoinsCollected: state.levelPowerCoinsCollected,
      totalBonusMultiplierCoinsCollected:
        state.levelBonusMultiplierCoinsCollected,
      totalExtraLifeCoinsCollected: state.levelExtraLifeCoinsCollected,
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
      monsters.forEach((monster) => {
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
        powerModeEndTime,
      },
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
        powerModeEndTime: 0,
      },
    });
  },
}));
