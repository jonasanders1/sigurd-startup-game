import { create } from "zustand";
import { Coin, Monster } from "../../types/interfaces";
import { CoinManager } from "../../managers/coinManager";
import { GAME_CONFIG } from "../../types/constants";
import { COIN_SPAWNING } from "../../config/coins";
import { log } from "../../lib/logger";
import { useScoreStore } from "../game/scoreStore";
import { useStateStore } from "../game/stateStore";
import { useRenderStore } from "../gameStore";

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

  collectCoin: (coin: Coin) => {
    const { coinManager } = get();
    if (!coinManager) return;

    log.coin(`Coin store: Collecting ${coin.type} coin`);

    // Get the current game state to pass to coinManager.collectCoin
    const currentState = get();
    const scoreState = useScoreStore.getState();
    const renderState = useRenderStore.getState();
    
    // Create combined game state with all necessary properties
    const gameState = {
      ...currentState,
      multiplier: scoreState.multiplier,
      score: scoreState.score,
      addFloatingText: renderState.addFloatingText,
    } as Record<string, unknown>;
    
    log.data('CoinSpawn: Passing gameState to collectCoin', {
      multiplier: scoreState.multiplier,
      hasCoinManager: !!coinManager,
      coinType: coin.type
    });

    // Pass the game state to coinManager so effects can be applied
    // CoinManager returns the calculated points
    const pointsEarned = coinManager.collectCoin(coin, gameState);

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
      currentState.totalPowerCoinsCollected + (coin.type === "POWER" ? 1 : 0);
    const newTotalBonusMultiplierCoinsCollected =
      currentState.totalBonusMultiplierCoinsCollected +
      (coin.type === "BONUS_MULTIPLIER" ? 1 : 0);
    const newTotalExtraLifeCoinsCollected =
      currentState.totalExtraLifeCoinsCollected +
      (coin.type === "EXTRA_LIFE" ? 1 : 0);

    // Update level-specific counters (these accumulate across respawns)
    const newLevelCoinsCollected = currentState.levelCoinsCollected + 1;
    const newLevelPowerCoinsCollected =
      currentState.levelPowerCoinsCollected + (coin.type === "POWER" ? 1 : 0);
    const newLevelBonusMultiplierCoinsCollected =
      currentState.levelBonusMultiplierCoinsCollected +
      (coin.type === "BONUS_MULTIPLIER" ? 1 : 0);
    const newLevelExtraLifeCoinsCollected =
      currentState.levelExtraLifeCoinsCollected +
      (coin.type === "EXTRA_LIFE" ? 1 : 0);

    set({
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
    });

    // Add the calculated points to score (coinManager already calculated with multiplier)
    const scoreStore = useScoreStore.getState();
    const stateStore = useStateStore.getState();
    
    if (pointsEarned > 0) {
      scoreStore.addScore(pointsEarned);
      log.coin(`Added ${pointsEarned} points to score`);
    }

    // Handle special effects that aren't point-related
    if (coin.type === "BONUS_MULTIPLIER") {
      // Increase multiplier if not at max
      const currentMultiplier = scoreStore.multiplier;
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
      // Add extra life
      stateStore.addLife();
      log.player(`Extra life added via coin store!`);
    }

    log.coin(
      `Coin collected: ${coin.type} (Total: ${newTotalCoinsCollected}, Power: ${newTotalPowerCoinsCollected}, Bonus: ${newTotalBonusMultiplierCoinsCollected})`
    );
    
    // Log coin collection for spawn debugging
    log.data('CoinSpawn: Coin collected', {
      coinType: coin.type,
      totalBonusMultiplierCoinsCollected: newTotalBonusMultiplierCoinsCollected,
      nextMCoinAt: Math.ceil(newTotalBonusMultiplierCoinsCollected / COIN_SPAWNING.EXTRA_LIFE_COIN_RATIO) * COIN_SPAWNING.EXTRA_LIFE_COIN_RATIO,
      willSpawnMCoin: newTotalBonusMultiplierCoinsCollected > 0 && newTotalBonusMultiplierCoinsCollected % COIN_SPAWNING.EXTRA_LIFE_COIN_RATIO === 0
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

    // Preserve the counts that should persist across levels
    const currentState = get();
    
    set({
      coins: [],
      activeEffects: {
        powerMode: false,
        powerModeEndTime: 0,
      },
      // PRESERVE these counts across levels:
      firebombCount: coinManager?.getFirebombCount() || currentState.firebombCount,
      totalCoinsCollected: currentState.totalCoinsCollected,
      totalPowerCoinsCollected: currentState.totalPowerCoinsCollected,
      totalBonusMultiplierCoinsCollected: currentState.totalBonusMultiplierCoinsCollected,
      totalExtraLifeCoinsCollected: currentState.totalExtraLifeCoinsCollected,
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
