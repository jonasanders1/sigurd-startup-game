import {
  Coin,
  CoinSpawnPoint,
  Monster,
  Platform,
  Ground,
  CoinTypeConfig,
  GameStateInterface,
  CoinEffect,
} from "../types/interfaces";
import { CoinType } from "../types/enums";
import { GAME_CONFIG } from "../types/constants";
import { CoinPhysics } from "./coinPhysics";
import { COIN_TYPES, P_COIN_COLORS, COIN_EFFECTS } from "../config/coinTypes";
import { log } from "../lib/logger";
import { ScalingManager } from "./ScalingManager";
import { useAudioStore } from "../stores/systems/audioStore";
import { useScoreStore, useStateStore } from "../stores/gameStore";

interface EffectData {
  endTime: number;
  effect: CoinEffect;
  remainingDuration?: number; // Track remaining duration when paused
}

export class CoinManager {
  private coins: Coin[] = [];
  private spawnPoints: CoinSpawnPoint[] = [];
  private firebombCount: number = 0;
  private powerModeActive: boolean = false;
  private powerModeEndTime: number = 0;
  private activeEffects: Map<string, EffectData> = new Map();
  private triggeredSpawnConditions: Set<string> = new Set(); // Track which spawn conditions have been triggered
  private lastProcessedScore: number = 0; // Track the last score threshold that was processed
  private lastScoreCheck: number = 0; // Track the last score we checked
  private bombAndMonsterPoints: number = 0; // Track points from bombs and monsters only (no bonus)
  private coinPoints: number = 0; // Track points earned from coin collection only (for B-coin spawning)
  private monsterKillCount: number = 0; // Track monsters killed in current power mode session
  private pCoinColorIndex: number = 0; // Track current P-coin color index

  // Pause state tracking
  private isPaused: boolean = false;
  private pauseStartTime: number = 0;

  constructor(spawnPoints: CoinSpawnPoint[] = []) {
    this.spawnPoints = spawnPoints;
    log.debug("CoinManager initialized");
  }

  // Full reset for game over - clears everything
  reset(): void {
    this.coins = [];
    this.firebombCount = 0;
    this.powerModeActive = false;
    this.powerModeEndTime = 0;
    this.activeEffects.clear();
    this.triggeredSpawnConditions.clear();
    this.lastProcessedScore = 0;
    this.lastScoreCheck = 0;
    this.bombAndMonsterPoints = 0;
    this.coinPoints = 0;
    this.monsterKillCount = 0;
    // Don't reset pCoinColorIndex - let it persist across sessions
    log.data('CoinManager: Full reset (game over) - all counters cleared');
  }

  // Soft reset for level transitions - preserves spawn counters
  softReset(): void {
    this.coins = [];
    this.powerModeActive = false;
    this.powerModeEndTime = 0;
    this.activeEffects.clear();
    // DON'T reset these - they accumulate across levels:
    // - firebombCount (for P-coin spawning)
    // - bombAndMonsterPoints (for B-coin spawning)
    // - triggeredSpawnConditions (prevents duplicate spawns)
    // - lastProcessedScore, lastScoreCheck (for threshold tracking)
    log.data(`CoinManager: Soft reset (level transition) - preserving counters:`, {
      firebombCount: this.firebombCount,
      bombAndMonsterPoints: this.bombAndMonsterPoints,
      lastScoreCheck: this.lastScoreCheck
    });
  }

  // Update spawn points when loading a new level
  updateSpawnPoints(spawnPoints: CoinSpawnPoint[]): void {
    this.spawnPoints = spawnPoints;
    log.debug(`Updated coin spawn points for new level: ${spawnPoints.length} spawn points`);
  }

  // Clear active coins but preserve score tracking for new level
  clearActiveCoins(): void {
    this.coins = [];
    this.powerModeActive = false;
    this.powerModeEndTime = 0;
    this.activeEffects.clear();
    // Don't clear score tracking or firebomb count - these persist across levels
    log.data(`CoinManager: Cleared active coins for new level, preserved spawn tracking:`, {
      firebombCount: this.firebombCount,
      bombAndMonsterPoints: this.bombAndMonsterPoints,
      lastScoreCheck: this.lastScoreCheck
    });
  }

  update(
    platforms: Platform[],
    ground: Ground,
    gameState?: GameStateInterface
  ): void {
    // Update coin physics based on coin type
    this.coins.forEach((coin) => {
      if (coin.isCollected) return;

      const coinConfig = COIN_TYPES[coin.type];
      if (coinConfig) {
        CoinPhysics.updateCoin(coin, platforms, ground, coinConfig.physics);
      } else {
        // Fallback to legacy behavior
        if (coin.type === CoinType.POWER) {
          CoinPhysics.updatePowerCoin(coin, platforms, ground);
        } else {
          CoinPhysics.updateCoin(coin, platforms, ground);
        }
      }
    });

    // Check if effects should end
    this.checkEffectsEnd(gameState as unknown as Record<string, unknown>);

    // Remove collected coins
    this.coins = this.coins.filter((coin) => !coin.isCollected);
  }

  spawnCoin(type: CoinType, x: number, y: number, spawnAngle?: number): void {
    const coinConfig = COIN_TYPES[type];

    // Check if a coin of this type already exists and respect maxActive limit
    if (coinConfig?.maxActive) {
      const existingCoins = this.coins.filter(
        (coin) => coin.type === type && !coin.isCollected
      );
      if (existingCoins.length >= coinConfig.maxActive) {
        log.debug(
          `${type} coin limit reached (${coinConfig.maxActive}), skipping spawn`
        );
        return;
      }
    } else {
      // Legacy behavior - check if any coin of this type exists
      const existingCoin = this.coins.find((coin) => coin.type === type);
      if (existingCoin) {
        log.debug(`${type} coin already exists, skipping spawn`);
        return;
      }
    }

    let initialVelocity;
    if (type === CoinType.POWER) {
      initialVelocity = CoinPhysics.createPowerCoinVelocity(spawnAngle);
    } else {
      initialVelocity = CoinPhysics.createInitialVelocity();
    }

    const coin: Coin = {
      type,
      x,
      y,
      width: GAME_CONFIG.COIN_SIZE,
      height: GAME_CONFIG.COIN_SIZE,
      velocityX: initialVelocity.velocityX,
      velocityY: initialVelocity.velocityY,
      isCollected: false,
      spawnX: x,
      spawnY: y,
    };

    // Set initial color and spawn time for P-coins
    if (type === CoinType.POWER) {
      coin.colorIndex = 0; // Start with blue (index 0)
      coin.spawnTime = Date.now();
      log.debug("Spawning P-coin with Blue color (100 points)");
    }

    this.coins.push(coin);
    log.coin(
      `Spawned ${type} coin at (${x}, ${y}) with angle ${
        spawnAngle || "random"
      }`
    );
    log.data('CoinSpawn: Coin spawned', {
      type,
      x,
      y,
      spawnAngle: spawnAngle || "random",
      totalCoins: this.coins.length,
      activeCoins: this.coins.filter(c => !c.isCollected).length
    });
  }

  onFirebombCollected(): void {
    this.firebombCount++;
    log.coin(`Firebomb collected! Count: ${this.firebombCount}`);
    log.data('CoinSpawn: Firebomb collected', {
      newFirebombCount: this.firebombCount,
      nextPCoinAt: Math.ceil(this.firebombCount / COIN_SPAWNING.POWER_COIN_SPAWN_INTERVAL) * COIN_SPAWNING.POWER_COIN_SPAWN_INTERVAL,
      willSpawnPCoin: this.firebombCount % COIN_SPAWNING.POWER_COIN_SPAWN_INTERVAL === 0
    });

    // Check spawn conditions immediately when firebomb count changes
    this.checkSpawnConditionsOnFirebombChange();
  }

  // Track points from bombs and monsters (excluding bonus points)
  onPointsEarned(points: number, isBonus: boolean = false): void {
    if (!isBonus) {
      const previousPoints = this.bombAndMonsterPoints;
      this.bombAndMonsterPoints += points;
      
      log.data('CoinSpawn: Non-bonus points earned', {
        pointsEarned: points,
        previousTotal: previousPoints,
        newTotal: this.bombAndMonsterPoints,
        nextBCoinAt: Math.ceil(this.bombAndMonsterPoints / COIN_SPAWNING.BONUS_COIN_SPAWN_INTERVAL) * COIN_SPAWNING.BONUS_COIN_SPAWN_INTERVAL,
        willSpawnBCoin: Math.floor(this.bombAndMonsterPoints / COIN_SPAWNING.BONUS_COIN_SPAWN_INTERVAL) > Math.floor(previousPoints / COIN_SPAWNING.BONUS_COIN_SPAWN_INTERVAL)
      });

      // Check for B-coin spawn conditions immediately when points are earned
      this.checkBcoinSpawnConditions();
    } else {
      log.data('CoinSpawn: Bonus points earned (not counted for B-coin)', { points });
    }
  }

  // Track points from coin collection (for B-coin spawning)
  onCoinPointsEarned(points: number): void {
    const previousPoints = this.coinPoints;
    this.coinPoints += points;
    
    const previousThreshold = Math.floor(previousPoints / COIN_SPAWNING.BONUS_COIN_SPAWN_INTERVAL);
    const currentThreshold = Math.floor(this.coinPoints / COIN_SPAWNING.BONUS_COIN_SPAWN_INTERVAL);
    const crossedThreshold = currentThreshold > previousThreshold;
    
    log.data('CoinSpawn: Coin points earned', {
      pointsEarned: points,
      previousTotal: previousPoints,
      newTotal: this.coinPoints,
      previousThreshold: previousThreshold * COIN_SPAWNING.BONUS_COIN_SPAWN_INTERVAL,
      currentThreshold: currentThreshold * COIN_SPAWNING.BONUS_COIN_SPAWN_INTERVAL,
      crossedThreshold,
      nextBCoinAt: (currentThreshold + 1) * COIN_SPAWNING.BONUS_COIN_SPAWN_INTERVAL
    });

    // Check for B-coin spawn conditions immediately when coin points are earned
    if (crossedThreshold && this.coinPoints >= COIN_SPAWNING.BONUS_COIN_SPAWN_INTERVAL) {
      log.coin('B-coin threshold crossed! Checking spawn conditions...');
      this.checkBcoinSpawnConditions();
    }
  }

  // Check B-coin spawn conditions specifically when points are earned
  private checkBcoinSpawnConditions(): void {
    const coinConfig = COIN_TYPES.BONUS_MULTIPLIER;
    if (!coinConfig) {
      log.data('CoinSpawn: B-coin config not found!');
      return;
    }

    // Check if we've crossed a new threshold (using coinPoints)
    const currentThreshold =
      Math.floor(
        this.coinPoints / GAME_CONFIG.BONUS_COIN_SPAWN_INTERVAL
      ) * GAME_CONFIG.BONUS_COIN_SPAWN_INTERVAL;
    const lastThreshold =
      Math.floor(this.lastScoreCheck / GAME_CONFIG.BONUS_COIN_SPAWN_INTERVAL) *
      GAME_CONFIG.BONUS_COIN_SPAWN_INTERVAL;

    log.data('CoinSpawn: B-coin threshold check', {
      coinPoints: this.coinPoints,
      currentThreshold,
      lastThreshold,
      lastScoreCheck: this.lastScoreCheck,
      willSpawn: currentThreshold > lastThreshold && currentThreshold >= GAME_CONFIG.BONUS_COIN_SPAWN_INTERVAL
    });

    // If we've crossed a new threshold, spawn a coin
    if (
      currentThreshold > lastThreshold &&
      currentThreshold >= GAME_CONFIG.BONUS_COIN_SPAWN_INTERVAL
    ) {
      const spawnKey = `${coinConfig.type}_${currentThreshold}`;

      // Check if we've already triggered this spawn condition
      if (this.triggeredSpawnConditions.has(spawnKey)) {
        log.data(
          `CoinSpawn: B-coin already spawned for threshold ${currentThreshold}`,
          { spawnKey, triggeredKeys: Array.from(this.triggeredSpawnConditions) }
        );
        return;
      }

      log.coin(
        `B-coin threshold crossed: ${lastThreshold} -> ${currentThreshold} (coin points: ${this.coinPoints})`
      );
      log.data('CoinSpawn: B-coin spawning', {
        coinPoints: this.coinPoints,
        currentThreshold,
        lastThreshold,
        spawnInterval: GAME_CONFIG.BONUS_COIN_SPAWN_INTERVAL
      });

      // Mark this spawn condition as triggered
      this.triggeredSpawnConditions.add(spawnKey);

      // Update the last score we checked
      this.lastScoreCheck = this.coinPoints;

      // Find spawn point for this coin type
      const spawnPoints = this.spawnPoints.filter(
        (point) => point.type === coinConfig.type
      );

      if (spawnPoints.length > 0) {
        const spawnPoint =
          spawnPoints[Math.floor(Math.random() * spawnPoints.length)];
        log.data('CoinSpawn: Spawning B-coin at spawn point', {
          x: spawnPoint.x,
          y: spawnPoint.y,
          angle: spawnPoint.spawnAngle
        });
        this.spawnCoin(
          coinConfig.type as CoinType,
          spawnPoint.x,
          spawnPoint.y,
          spawnPoint.spawnAngle
        );
      } else {
        // Fallback spawn position
        const spawnX = 400 + (Math.random() - 0.5) * 200;
        const spawnY = 50; // Top of screen for gravity coins
        log.data('CoinSpawn: Spawning B-coin at fallback position', {
          x: spawnX,
          y: spawnY
        });
        this.spawnCoin(coinConfig.type as CoinType, spawnX, spawnY);
      }
    } else {
      log.data('CoinSpawn: B-coin threshold NOT crossed', {
        reason: 'No new threshold reached',
        currentThreshold,
        lastThreshold,
        coinPoints: this.coinPoints
      });
    }
  }

  // Check spawn conditions when firebomb count changes (for firebomb-based spawns)
  private checkSpawnConditionsOnFirebombChange(): void {
    Object.values(COIN_TYPES).forEach((coinConfig) => {
      // Only check spawn conditions that depend on firebomb count (P-coin)
      if (
        coinConfig.spawnCondition &&
        coinConfig.spawnCondition.toString().includes("firebombCount")
      ) {
        const combinedState = {
          firebombCount: this.firebombCount,
        };

        if (
          coinConfig.spawnCondition(
            combinedState as unknown as GameStateInterface
          )
        ) {
          // Create a unique key for this spawn condition
          const spawnKey = `${coinConfig.type}_${this.firebombCount}`;

          // Check if we've already triggered this spawn condition
          if (this.triggeredSpawnConditions.has(spawnKey)) {
            return; // Already triggered this spawn condition
          }

          log.coin(
            `P-coin spawn condition met! (firebombCount: ${this.firebombCount}, key: ${spawnKey})`
          );
          log.data('CoinSpawn: P-coin spawning', {
            firebombCount: this.firebombCount,
            spawnKey,
            spawnInterval: COIN_SPAWNING.POWER_COIN_SPAWN_INTERVAL
          });

          // Mark this spawn condition as triggered
          this.triggeredSpawnConditions.add(spawnKey);

          // Find spawn point for this coin type
          const spawnPoints = this.spawnPoints.filter(
            (point) => point.type === coinConfig.type
          );

          if (spawnPoints.length > 0) {
            const spawnPoint =
              spawnPoints[Math.floor(Math.random() * spawnPoints.length)];
            this.spawnCoin(
              coinConfig.type as CoinType,
              spawnPoint.x,
              spawnPoint.y,
              spawnPoint.spawnAngle
            );
          } else {
            // Fallback spawn position for P-coin (random bouncing)
            const spawnX = 400 + (Math.random() - 0.5) * 200;
            const spawnY = 100 + Math.random() * 100;
            this.spawnCoin(coinConfig.type as CoinType, spawnX, spawnY);
          }
        }
      }
    });
  }

  // Check spawn conditions for other types (score-based, time-based, etc.)
  checkSpawnConditions(gameState: Record<string, unknown>): void {
    Object.values(COIN_TYPES).forEach((coinConfig) => {
      // Skip firebomb-based spawns as they're handled separately
      if (
        coinConfig.spawnCondition &&
        !coinConfig.spawnCondition.toString().includes("firebombCount") &&
        coinConfig.type !== "POWER"
      ) {
        const combinedState = {
          ...gameState,
          firebombCount: this.firebombCount,
          bombAndMonsterPoints: this.bombAndMonsterPoints,
          coinPoints: this.coinPoints,
        };
        
        // Debug logging for coin spawn checks
        if (coinConfig.type === "BONUS_MULTIPLIER") {
          log.data(`CoinSpawn: Checking B-coin spawn`, {
            coinPoints: this.coinPoints,
            threshold: GAME_CONFIG.BONUS_COIN_SPAWN_INTERVAL,
            lastScoreCheck: this.lastScoreCheck,
            conditionWillPass: this.coinPoints >= GAME_CONFIG.BONUS_COIN_SPAWN_INTERVAL
          });
        }
        if (coinConfig.type === "EXTRA_LIFE") {
          const bonusCount = (combinedState as any).totalBonusMultiplierCoinsCollected || 0;
          log.data(`CoinSpawn: Checking M-coin spawn`, {
            bonusCount,
            ratio: GAME_CONFIG.EXTRA_LIFE_COIN_RATIO,
            conditionWillPass: bonusCount > 0 && bonusCount % GAME_CONFIG.EXTRA_LIFE_COIN_RATIO === 0
          });
        }

        if (
          coinConfig.spawnCondition(
            combinedState as unknown as GameStateInterface
          )
        ) {
          // Create a unique key for this spawn condition based on the current state
          let spawnKey = `${coinConfig.type}`;

          // For B-coin (BONUS_MULTIPLIER) spawns
          if (coinConfig.type === "BONUS_MULTIPLIER" || coinConfig.spawnCondition.toString().includes("coinPoints")) {
            if (coinConfig.type === "BONUS_MULTIPLIER") {
              // Use coinPoints instead of total score for B-coin spawning
              const currentThreshold =
                Math.floor(
                  this.coinPoints /
                    GAME_CONFIG.BONUS_COIN_SPAWN_INTERVAL
                ) * GAME_CONFIG.BONUS_COIN_SPAWN_INTERVAL;
              const lastThreshold =
                Math.floor(
                  this.lastScoreCheck / GAME_CONFIG.BONUS_COIN_SPAWN_INTERVAL
                ) * GAME_CONFIG.BONUS_COIN_SPAWN_INTERVAL;

              // If we've crossed a new threshold, spawn a coin
              if (
                currentThreshold > lastThreshold &&
                currentThreshold >= GAME_CONFIG.BONUS_COIN_SPAWN_INTERVAL
              ) {
                spawnKey = `${coinConfig.type}_${currentThreshold}`;
                log.coin(
                  `B-coin threshold crossed: ${lastThreshold} -> ${currentThreshold} (coin points: ${this.coinPoints})`
                );
                log.data('CoinSpawn: B-coin spawning', {
                  coinPoints: this.coinPoints,
                  currentThreshold,
                  lastThreshold,
                  spawnInterval: GAME_CONFIG.BONUS_COIN_SPAWN_INTERVAL
                });
              } else {
                return; // Skip this spawn condition
              }

              // Update the last score we checked
              this.lastScoreCheck = this.coinPoints;
            }
          }

          // For bonus multiplier-based spawns (EXTRA_LIFE)
          if (
            coinConfig.spawnCondition
              .toString()
              .includes("totalBonusMultiplierCoinsCollected")
          ) {
            const bonusCount =
              (gameState.totalBonusMultiplierCoinsCollected as number) || 0;
            const threshold =
              Math.floor(bonusCount / GAME_CONFIG.EXTRA_LIFE_COIN_RATIO) *
              GAME_CONFIG.EXTRA_LIFE_COIN_RATIO;
            spawnKey = `${coinConfig.type}_${threshold}`;
            const shouldSpawn = bonusCount > 0 && bonusCount % GAME_CONFIG.EXTRA_LIFE_COIN_RATIO === 0;
            if (shouldSpawn) {
              log.coin(
                `M-coin spawn condition met! (bonusCount: ${bonusCount}, ratio: ${GAME_CONFIG.EXTRA_LIFE_COIN_RATIO})`
              );
              log.data('CoinSpawn: M-coin spawning', {
                totalBonusMultiplierCoinsCollected: bonusCount,
                threshold,
                ratio: GAME_CONFIG.EXTRA_LIFE_COIN_RATIO,
                spawnKey
              });
            }
          }

          // Check if we've already triggered this spawn condition
          if (this.triggeredSpawnConditions.has(spawnKey)) {
            log.data(`CoinSpawn: ${coinConfig.type} already spawned for key: ${spawnKey}`);
            return; // Already triggered this spawn condition
          }

          log.coin(
            `${coinConfig.type} spawn condition met! (key: ${spawnKey})`
          );
          log.data(`CoinSpawn: ${coinConfig.type} spawning`, {
            type: coinConfig.type,
            spawnKey,
            coinPoints: this.coinPoints,
            totalBonusMultiplierCoinsCollected: (gameState.totalBonusMultiplierCoinsCollected as number) || 0
          });

          // Mark this spawn condition as triggered
          this.triggeredSpawnConditions.add(spawnKey);

          // Find spawn point for this coin type
          const spawnPoints = this.spawnPoints.filter(
            (point) => point.type === coinConfig.type
          );

          if (spawnPoints.length > 0) {
            const spawnPoint =
              spawnPoints[Math.floor(Math.random() * spawnPoints.length)];
            this.spawnCoin(
              coinConfig.type as CoinType,
              spawnPoint.x,
              spawnPoint.y,
              spawnPoint.spawnAngle
            );
          } else {
            // Fallback spawn position - spawn from top for gravity coins
            const spawnX = 400 + (Math.random() - 0.5) * 200;
            let spawnY = 50; // Start from top of screen
            // For gravity-only coins, spawn from top
            if (
              coinConfig.physics.hasGravity &&
              !coinConfig.physics.bounces &&
              !coinConfig.physics.reflects
            ) {
              spawnY = 50; // Top of screen
            } else {
              spawnY = 100 + Math.random() * 100; // Random position for other coins
            }
            this.spawnCoin(coinConfig.type as CoinType, spawnX, spawnY);
          }
        } else {
          // Debug logging when spawn conditions are not met
          if (coinConfig.type === "BONUS_MULTIPLIER") {
            log.data(`CoinSpawn: B-coin NOT spawning`, {
              reason: "Condition not met",
              coinPoints: this.coinPoints,
              required: GAME_CONFIG.BONUS_COIN_SPAWN_INTERVAL,
              nextSpawnAt: Math.ceil(this.coinPoints / GAME_CONFIG.BONUS_COIN_SPAWN_INTERVAL) * GAME_CONFIG.BONUS_COIN_SPAWN_INTERVAL,
              pointsNeeded: GAME_CONFIG.BONUS_COIN_SPAWN_INTERVAL - (this.coinPoints % GAME_CONFIG.BONUS_COIN_SPAWN_INTERVAL)
            });
          }
          if (coinConfig.type === "EXTRA_LIFE") {
            const bonusCount = (combinedState as any).totalBonusMultiplierCoinsCollected || 0;
            log.data(`CoinSpawn: M-coin NOT spawning`, {
              reason: "Condition not met",
              bonusCount,
              ratio: GAME_CONFIG.EXTRA_LIFE_COIN_RATIO,
              nextSpawnAt: Math.ceil(bonusCount / GAME_CONFIG.EXTRA_LIFE_COIN_RATIO) * GAME_CONFIG.EXTRA_LIFE_COIN_RATIO,
              bCoinsNeeded: GAME_CONFIG.EXTRA_LIFE_COIN_RATIO - (bonusCount % GAME_CONFIG.EXTRA_LIFE_COIN_RATIO)
            });
          }
        }
      }
    });
  }

  collectCoin(coin: Coin, gameState?: Record<string, unknown>): number {
    coin.isCollected = true;
    log.debug(`Collected ${coin.type} coin`);

    let pointsEarned = 0;  // Track points to return
    const coinConfig = COIN_TYPES[coin.type];
    if (coinConfig && gameState) {
      log.debug(
        `Processing ${coin.type} coin with ${coinConfig.effects.length} effects`
      );

      // Calculate points earned from this coin
      pointsEarned = coinConfig.points;

      // Special handling for P-coin - points based on current color
      if (coin.type === CoinType.POWER) {
        const spawnTime = coin.spawnTime || Date.now();
        const colorData = this.getPcoinColorForTime(spawnTime);
        const currentMultiplier = (gameState.multiplier as number) || 1;
        pointsEarned = colorData.points * currentMultiplier;

        log.debug(
          `P-coin collected: ${colorData.name} color, ${colorData.points} × ${currentMultiplier} = ${pointsEarned} points`
        );
      }
      // Special handling for B-coin (Bonus Multiplier) - points = 1000 * current multiplier
      else if (coin.type === CoinType.BONUS_MULTIPLIER) {
        const currentMultiplier = (gameState.multiplier as number) || 1;
        pointsEarned = 1000 * currentMultiplier;
      }
      // Special handling for E-coin (Extra Life) - add extra life and award points
      else if (coin.type === CoinType.EXTRA_LIFE) {
        const currentMultiplier = (gameState.multiplier as number) || 1;
        pointsEarned = coinConfig.points * currentMultiplier;
      }

      // Track coin points for B-coin spawning (only coin collection points count)
      log.data('CoinSpawn: Coin collected, tracking points', {
        coinType: coin.type,
        pointsEarned,
        multiplier: (gameState.multiplier as number) || 1,
        previousCoinPoints: this.coinPoints,
        newCoinPoints: this.coinPoints + pointsEarned
      });
      this.onCoinPointsEarned(pointsEarned);

      // Show floating text for points earned
      if (
        "addFloatingText" in gameState &&
        typeof gameState.addFloatingText === "function"
      ) {
        const text = pointsEarned.toString();
        (
          gameState.addFloatingText as (
            text: string,
            x: number,
            y: number,
            duration: number,
            color: string,
            fontSize: number
          ) => void
        )(
          text,
          coin.x + coin.width / 2,
          coin.y + coin.height / 2,
          1000, // duration
          "#fff",
          15 // fontSize
        );
      }

      // Apply all effects for this coin type
      coinConfig.effects.forEach((effect) => {
        // Create a proper GameStateInterface object with coinManager and activeEffects
        const gameStateWithManager: GameStateInterface = {
          ...(gameState as any),
          // Ensure required properties are present
          player: (gameState as any).player || {
            x: 0,
            y: 0,
            width: 0,
            height: 0,
            velocityX: 0,
            velocityY: 0,
          },
          currentState: (gameState as any).currentState || "PLAYING",
          currentLevel: (gameState as any).currentLevel || 1,
          score: (gameState as any).score || 0,
          lives: (gameState as any).lives || 3,
          monsters: (gameState as any).monsters || [],
          multiplier: (gameState as any).multiplier || 1,
          multiplierScore: (gameState as any).multiplierScore || 0,
          bombs: (gameState as any).bombs || [],
          coins: (gameState as any).coins || [],
          platforms: (gameState as any).platforms || [],
          ground: (gameState as any).ground || {
            x: 0,
            y: 0,
            width: 0,
            height: 0,
          },
          firebombCount: (gameState as any).firebombCount || 0,
          totalCoinsCollected: (gameState as any).totalCoinsCollected || 0,
          totalPowerCoinsCollected:
            (gameState as any).totalPowerCoinsCollected || 0,
          totalBonusMultiplierCoinsCollected:
            (gameState as any).totalBonusMultiplierCoinsCollected || 0,
          activeEffects: {
            powerMode: false,
            powerModeEndTime: 0,
            ...(gameState as any).activeEffects,
          },
          coinManager: {
            resetMonsterKillCount: () => this.resetMonsterKillCount(),
            getPcoinColorForTime: (spawnTime: number) =>
              this.getPcoinColorForTime(spawnTime),
            getPowerModeEndTime: () => this.getPowerModeEndTime(),
          },
          difficultyManager: {
            pause: () => {
              // Access the global scaling manager instance
              const scalingManager = ScalingManager.getInstance();
              scalingManager.pause();
              log.debug("Difficulty scaling paused (power mode active)");
            },
            resume: () => {
              // Access the global scaling manager instance
              const scalingManager = ScalingManager.getInstance();
              scalingManager.resume();
              log.debug("Difficulty scaling resumed (power mode ended)");
            },
          },
          // Ensure audioManager is included from the original gameState
          audioManager: (gameState as any).audioManager,
          // Add the missing methods
          addScore: (points: number) => {
            const scoreStore = useScoreStore.getState();
            scoreStore.addScore(points);
          },
          setMultiplier: (multiplier: number, score: number) => {
            const scoreStore = useScoreStore.getState();
            scoreStore.setMultiplier(multiplier, score);
          },
        };

        log.debug(
          `GameStateWithManager created, audioManager:`,
          (gameStateWithManager as any).audioManager
        );
        log.debug(
          `GameStateWithManager keys:`,
          Object.keys(gameStateWithManager)
        );
        // Apply the effect first
        log.debug(`Applying effect: ${effect.type}`);
        effect.apply(gameStateWithManager, coin);
        log.debug(`Effect ${effect.type} applied successfully`);

        // Track timed effects - for POWER_MODE, get the duration from the activeEffects
        if (effect.type === "POWER_MODE") {
          // POWER_MODE effect calculates its own duration, so get it from the updated gameState
          const powerModeEndTime = (gameStateWithManager as any).activeEffects
            .powerModeEndTime;
          if (powerModeEndTime > 0) {
            this.activeEffects.set(effect.type, {
              endTime: powerModeEndTime,
              effect,
            });

            // Also update the coin manager's internal power mode state
            this.powerModeActive = true;
            this.powerModeEndTime = powerModeEndTime;

            log.debug(
              `POWER_MODE effect tracked with endTime: ${powerModeEndTime}, internal state updated`
            );
            log.debug(
              `Current time: ${Date.now()}, Effect will end at: ${powerModeEndTime}, Duration: ${
                powerModeEndTime - Date.now()
              }ms`
            );
          } else {
            log.warn("POWER_MODE effect applied but no endTime found");
          }
        } else if (effect.duration) {
          // For other effects with static durations
          this.activeEffects.set(effect.type, {
            endTime: Date.now() + effect.duration,
            effect,
          });
        }
      });
    } else {
      // Legacy behavior - just use the old system for now
      // Only warn if it's not a known coin type (to avoid spam)
      if (
        coin.type !== CoinType.POWER &&
        coin.type !== CoinType.BONUS_MULTIPLIER &&
        coin.type !== CoinType.EXTRA_LIFE
      ) {
        log.warn(`Unknown coin type: ${coin.type}, using legacy behavior`);
      }
      if (coin.type === CoinType.POWER) {
        this.activatePowerMode();
      }
    }
    
    // Return the points earned so the caller can add them to score correctly
    return pointsEarned;
  }

  private checkEffectsEnd(gameState?: Record<string, unknown>): void {
    // Don't check effects while paused
    if (this.isPaused) {
      return;
    }

    const currentTime = Date.now();
    const effectsToRemove: string[] = [];

    log.debug(
      `checkEffectsEnd called at ${currentTime}, checking ${this.activeEffects.size} active effects`
    );

    this.activeEffects.forEach((effectData, effectType) => {
      const timeLeft = effectData.endTime - currentTime;
      log.debug(
        `Checking effect: ${effectType}, endTime: ${
          effectData.endTime
        }, currentTime: ${currentTime}, timeLeft: ${timeLeft}ms, shouldEnd: ${
          timeLeft <= 0
        }`
      );

      // Add a minimum duration safeguard to prevent effects from being removed too quickly
      const minimumDuration = 100; // 100ms minimum
      const shouldEnd = timeLeft <= -minimumDuration; // Allow some buffer time

      if (shouldEnd) {
        effectsToRemove.push(effectType);
        log.debug(`Effect ${effectType} marked for removal`);

        if (effectData.effect.remove && gameState) {
          log.debug(`Removing effect: ${effectType}`);

          // Create a proper GameStateInterface for the remove function
          const gameStateWithManager: GameStateInterface = {
            ...(gameState as any),
            activeEffects: {
              powerMode: false,
              powerModeEndTime: 0,
              ...(gameState as any).activeEffects,
            },
            coinManager: {
              resetMonsterKillCount: () => this.resetMonsterKillCount(),
              getPcoinColorForTime: (spawnTime: number) =>
                this.getPcoinColorForTime(spawnTime),
              getPowerModeEndTime: () => this.getPowerModeEndTime(),
            },
            difficultyManager: {
              pause: () => {
                const scalingManager = ScalingManager.getInstance();
                scalingManager.pause();
                log.debug("Difficulty scaling paused (power mode active)");
              },
              resume: () => {
                const scalingManager = ScalingManager.getInstance();
                scalingManager.resumeFromPowerMode();
                log.debug("Difficulty scaling resumed (power mode ended)");
              },
            },
          };

          try {
            effectData.effect.remove(gameStateWithManager);
            log.debug(`Effect ${effectType} removed successfully`);
          } catch (error) {
            log.error(`Error removing effect ${effectType}:`, error);
          }
        }
      }
    });

    if (effectsToRemove.length > 0) {
      log.debug(
        `Removing ${effectsToRemove.length} effects: ${effectsToRemove.join(
          ", "
        )}`
      );
    }

    effectsToRemove.forEach((effectType) => {
      this.activeEffects.delete(effectType);

      // Handle legacy power mode state when POWER_MODE effect is removed
      if (effectType === "POWER_MODE") {
        this.powerModeActive = false;
        this.powerModeEndTime = 0;
        log.debug("Power mode deactivated, internal state updated");
        // Note: Difficulty scaling resume is handled by the effect's remove function
      }
    });
  }

  // Calculate monster kill points based on kill count progression
  calculateMonsterKillPoints(multiplier: number): number {
    this.monsterKillCount++;

    // Progressive monster kill bonus system
    let basePoints: number;
    switch (this.monsterKillCount) {
      case 1:
        basePoints = 100;
        break;
      case 2:
        basePoints = 200;
        break;
      case 3:
        basePoints = 300;
        break;
      case 4:
        basePoints = 500;
        break;
      case 5:
        basePoints = 800;
        break;
      case 6:
        basePoints = 1200;
        break;
      case 7:
        basePoints = 1700;
        break;
      case 8:
        basePoints = 2300;
        break;
      case 9:
        basePoints = 3000;
        break;
      case 10:
        basePoints = 4000;
        break;
      default:
        // For kills beyond 10, add 1000 per additional kill
        basePoints = 4000 + (this.monsterKillCount - 10) * 1000;
    }

    const totalPoints = basePoints * multiplier;
    log.debug(
      `Monster kill #${this.monsterKillCount}: ${basePoints} × ${multiplier} = ${totalPoints} points`
    );

    return totalPoints;
  }

  // Calculate current P-coin color based on time elapsed
  getPcoinColorForTime(spawnTime: number): {
    color: string;
    points: number;
    name: string;
    index: number;
    duration: number;
  } {
    const now = Date.now();
    const elapsed = now - spawnTime;
    const colorChangeInterval = 1000; // Change color every 1 second
    const colorIndex =
      Math.floor(elapsed / colorChangeInterval) % P_COIN_COLORS.length;
    const colorData = P_COIN_COLORS[colorIndex];
    return { ...colorData, index: colorIndex };
  }

  // Get current P-coin color and points (legacy method)
  getCurrentPcoinColor(): { color: string; points: number; name: string } {
    const colorData = P_COIN_COLORS[this.pCoinColorIndex];
    return colorData;
  }

  // Get current color for a specific P-coin
  getPcoinCurrentColor(coin: Coin): string {
    if (coin.type === CoinType.POWER && coin.spawnTime !== undefined) {
      const colorData = this.getPcoinColorForTime(coin.spawnTime);
      return colorData.color;
    }
    return P_COIN_COLORS[0].color; // Default to blue
  }

  // Advance P-coin color to next in sequence (legacy method)
  advancePcoinColor(): void {
    this.pCoinColorIndex = (this.pCoinColorIndex + 1) % P_COIN_COLORS.length;
    const newColor = this.getCurrentPcoinColor();
    log.debug(
      `P-coin color advanced to: ${newColor.name} (${newColor.points} points)`
    );
  }

  // Reset monster kill count when power mode starts
  resetMonsterKillCount(): void {
    this.monsterKillCount = 0;
    log.debug("Monster kill count reset for new power mode session");
  }

  isPowerModeActive(): boolean {
    // Check if POWER_MODE effect is active
    const powerModeEffect = this.activeEffects.get("POWER_MODE");
    if (powerModeEffect) {
      const isActive = Date.now() < powerModeEffect.endTime;
      if (!isActive) {
        // Effect has expired, remove it
        this.activeEffects.delete("POWER_MODE");
        this.powerModeActive = false;
      }
      return isActive;
    }
    return this.powerModeActive; // Fallback to legacy property
  }

  getCoins(): Coin[] {
    return this.coins.filter((coin) => !coin.isCollected);
  }

  getFirebombCount(): number {
    return this.firebombCount;
  }

  getAllCoins(): Coin[] {
    return [...this.coins];
  }

  getFirebombCount(): number {
    return this.firebombCount;
  }

  getBombAndMonsterPoints(): number {
    return this.bombAndMonsterPoints;
  }

  updateMonsters(monsters: Monster[]): void {
    // Check both new effect system and legacy system
    const isPowerModeActive = this.isPowerModeActive() || this.powerModeActive;

    if (isPowerModeActive) {
      // Calculate remaining time from either system
      let timeLeft = 0;

      // Check new effect system first
      const powerModeEffect = this.activeEffects.get("POWER_MODE");
      if (powerModeEffect) {
        timeLeft = powerModeEffect.endTime - Date.now();
      } else {
        // Fall back to legacy system
        timeLeft = this.powerModeEndTime - Date.now();
      }

      const shouldBlink = timeLeft <= 2000 && timeLeft > 0; // Blink when 2 seconds or less remaining

      monsters.forEach((monster) => {
        monster.isFrozen = true;
        monster.isBlinking = shouldBlink;
      });
    } else {
      monsters.forEach((monster) => {
        monster.isFrozen = false;
        monster.isBlinking = false;
      });
    }
  }

  unfreezeAllMonsters(monsters: Monster[]): void {
    monsters.forEach((monster) => {
      monster.isFrozen = false;
      monster.isBlinking = false;
    });
  }

  // Pause and resume methods for proper effect duration handling
  pause(): void {
    if (this.isPaused) return;

    this.isPaused = true;
    this.pauseStartTime = Date.now();

    // Store remaining duration for all active effects
    this.activeEffects.forEach((effectData, effectType) => {
      const remainingTime = effectData.endTime - Date.now();
      if (remainingTime > 0) {
        effectData.remainingDuration = remainingTime;
        log.debug(
          `Pausing effect ${effectType} with ${remainingTime}ms remaining`
        );
      }
    });

    // Also handle legacy powerModeEndTime
    if (this.powerModeActive && this.powerModeEndTime > Date.now()) {
      const remainingTime = this.powerModeEndTime - Date.now();
      log.debug(`Pausing legacy power mode with ${remainingTime}ms remaining`);
    }
  }

  resume(): void {
    if (!this.isPaused) return;

    this.isPaused = false;
    const pauseDuration = Date.now() - this.pauseStartTime;

    // Restore end times for all active effects
    this.activeEffects.forEach((effectData, effectType) => {
      if (
        effectData.remainingDuration !== undefined &&
        effectData.remainingDuration > 0
      ) {
        effectData.endTime = Date.now() + effectData.remainingDuration;
        log.debug(
          `Resuming effect ${effectType} with ${effectData.remainingDuration}ms remaining, new endTime: ${effectData.endTime}`
        );

        // Restart power-up melody if it's the POWER_MODE effect
        if (effectType === "POWER_MODE" && effectData.remainingDuration > 0) {
          // Get the audioManager from audioStore
          const audioStore = useAudioStore.getState();
          if (
            audioStore?.audioManager &&
            typeof audioStore.audioManager.startPowerUpMelodyWithDuration ===
              "function"
          ) {
            log.debug(
              `Restarting PowerUp melody with ${effectData.remainingDuration}ms remaining`
            );
            audioStore.audioManager.startPowerUpMelodyWithDuration(
              effectData.remainingDuration
            );
          }
        }

        effectData.remainingDuration = undefined; // Clear the remaining duration
      }
    });

    // Also update legacy powerModeEndTime if it was active
    if (this.powerModeActive && this.powerModeEndTime > 0) {
      // Only adjust if the power mode hasn't expired during pause
      const originalRemainingTime = this.powerModeEndTime - this.pauseStartTime;
      if (originalRemainingTime > 0) {
        this.powerModeEndTime = Date.now() + originalRemainingTime;
        log.debug(
          `Resuming legacy power mode, new endTime: ${this.powerModeEndTime}`
        );
      }
    }

    this.pauseStartTime = 0;
  }

  resetEffects(): void {
    // Stop power-up melody if active when resetting effects
    if (this.powerModeActive) {
      log.debug(
        "Resetting effects while power mode is active, this should stop PowerUp melody"
      );
    }

    this.powerModeActive = false;
    this.powerModeEndTime = 0;
    this.firebombCount = 0;
    this.coins = [];
    this.activeEffects.clear();
    this.bombAndMonsterPoints = 0;
    this.monsterKillCount = 0;
    log.debug("Coin effects reset");
  }

  // Method to force stop power mode and melody (for game state changes)
  forceStopPowerMode(): void {
    if (this.powerModeActive) {
      log.debug("Force stopping power mode");
      this.powerModeActive = false;
      this.powerModeEndTime = 0;
      this.activeEffects.delete("POWER_MODE");

      // Resume difficulty scaling
      try {
        const scalingManager = ScalingManager.getInstance();
        scalingManager.resumeFromPowerMode();
        log.debug("Difficulty scaling resumed after force stop");
      } catch (error) {
        log.debug(
          "Could not resume difficulty scaling (ScalingManager not available)"
        );
      }
    }
  }

  // New method to get coin configuration
  getCoinConfig(type: string): CoinTypeConfig | undefined {
    return COIN_TYPES[type];
  }

  // New method to check if an effect is active
  isEffectActive(effectType: string): boolean {
    return this.activeEffects.has(effectType);
  }

  // Get power mode end time
  getPowerModeEndTime(): number {
    const powerModeEffect = this.activeEffects.get("POWER_MODE");
    return powerModeEffect ? powerModeEffect.endTime : 0;
  }

  // Legacy method with dynamic duration
  private activatePowerMode(): void {
    this.powerModeActive = true;

    // Get duration based on current P-coin color (if we have a recent P-coin)
    let duration: number = GAME_CONFIG.POWER_COIN_DURATION; // Default fallback

    // Find the most recent P-coin to get its color
    const recentPcoin = this.coins.find(
      (coin) => coin.type === CoinType.POWER && coin.spawnTime
    );
    if (recentPcoin && recentPcoin.spawnTime) {
      const colorData = this.getPcoinColorForTime(recentPcoin.spawnTime);
      duration = colorData.duration || GAME_CONFIG.POWER_COIN_DURATION;
    }

    this.powerModeEndTime = Date.now() + duration;
    this.resetMonsterKillCount();

    // Also add to activeEffects Map so checkEffectsEnd can handle it properly
    this.activeEffects.set("POWER_MODE", {
      endTime: this.powerModeEndTime,
      effect: COIN_EFFECTS.POWER_MODE,
    });

    log.debug(
      `Power mode timing - duration: ${duration}ms, endTime: ${
        this.powerModeEndTime
      }, currentTime: ${Date.now()}`
    );

    // Pause difficulty scaling during power mode
    try {
      const scalingManager = ScalingManager.getInstance();
      scalingManager.pauseForPowerMode();
      log.debug("Difficulty scaling paused (power mode active)");
    } catch (error) {
      log.debug(
        "Could not pause difficulty scaling (ScalingManager not available)"
      );
    }

    log.debug(`Power mode activated for ${duration}ms (${duration / 1000}s)`);
  }
}
