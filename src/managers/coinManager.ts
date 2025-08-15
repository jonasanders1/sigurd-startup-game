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
import { useGameStore } from "../stores/gameStore";

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
  private monsterKillCount: number = 0; // Track monsters killed in current power mode session
  private pCoinColorIndex: number = 0; // Track current P-coin color index
  
  // Pause state tracking
  private isPaused: boolean = false;
  private pauseStartTime: number = 0;

  constructor(spawnPoints: CoinSpawnPoint[] = []) {
    this.spawnPoints = spawnPoints;
    log.debug("CoinManager initialized");
  }

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
    this.monsterKillCount = 0;
    // Don't reset pCoinColorIndex - let it persist across sessions
  }

  update(platforms: Platform[], ground: Ground, gameState?: GameStateInterface): void {
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
    log.debug(
      `Spawned ${type} coin at (${x}, ${y}) with angle ${
        spawnAngle || "random"
      }`
    );
  }

  onFirebombCollected(): void {
    this.firebombCount++;
    log.debug(`Firebomb count: ${this.firebombCount}`);

    // Check spawn conditions immediately when firebomb count changes
    this.checkSpawnConditionsOnFirebombChange();
  }

  // Track points from bombs and monsters (excluding bonus points)
  onPointsEarned(points: number, isBonus: boolean = false): void {
    if (!isBonus) {
      this.bombAndMonsterPoints += points;
      log.debug(
        `Points earned: ${points}, total bomb/monster points: ${this.bombAndMonsterPoints}`
      );

      // Check for B-coin spawn conditions immediately when points are earned
      this.checkBcoinSpawnConditions();
    }
  }

  // Check B-coin spawn conditions specifically when points are earned
  private checkBcoinSpawnConditions(): void {
    const coinConfig = COIN_TYPES.BONUS_MULTIPLIER;
    if (!coinConfig) return;

    // Check if we've crossed a new threshold
    const currentThreshold =
      Math.floor(
        this.bombAndMonsterPoints / GAME_CONFIG.BONUS_COIN_SPAWN_INTERVAL
      ) * GAME_CONFIG.BONUS_COIN_SPAWN_INTERVAL;
    const lastThreshold =
      Math.floor(this.lastScoreCheck / GAME_CONFIG.BONUS_COIN_SPAWN_INTERVAL) *
      GAME_CONFIG.BONUS_COIN_SPAWN_INTERVAL;

    // If we've crossed a new threshold, spawn a coin
    if (
      currentThreshold > lastThreshold &&
      currentThreshold >= GAME_CONFIG.BONUS_COIN_SPAWN_INTERVAL
    ) {
      const spawnKey = `${coinConfig.type}_${currentThreshold}`;

      // Check if we've already triggered this spawn condition
      if (this.triggeredSpawnConditions.has(spawnKey)) {
        log.debug(
          `B-coin spawn condition already triggered for threshold ${currentThreshold}`
        );
        return;
      }

      log.debug(
        `B-coin threshold crossed: ${lastThreshold} -> ${currentThreshold} (bomb/monster points: ${this.bombAndMonsterPoints})`
      );

      // Mark this spawn condition as triggered
      this.triggeredSpawnConditions.add(spawnKey);

      // Update the last score we checked
      this.lastScoreCheck = this.bombAndMonsterPoints;

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
      }
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

        if (coinConfig.spawnCondition(combinedState as unknown as GameStateInterface)) {
          // Create a unique key for this spawn condition
          const spawnKey = `${coinConfig.type}_${this.firebombCount}`;

          // Check if we've already triggered this spawn condition
          if (this.triggeredSpawnConditions.has(spawnKey)) {
            return; // Already triggered this spawn condition
          }

          log.debug(
            `P-coin spawn condition met (firebombCount: ${this.firebombCount}, key: ${spawnKey})`
          );

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
        };

        if (coinConfig.spawnCondition(combinedState as unknown as GameStateInterface)) {
          // Create a unique key for this spawn condition based on the current state
          let spawnKey = `${coinConfig.type}`;

          // For score-based spawns, include the score threshold
          if (coinConfig.spawnCondition.toString().includes("score")) {
            if (coinConfig.type === "BONUS_MULTIPLIER") {
              // Use bombAndMonsterPoints instead of total score for B-coin spawning
              const currentThreshold =
                Math.floor(
                  this.bombAndMonsterPoints /
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
                log.debug(
                  `B-coin threshold crossed: ${lastThreshold} -> ${currentThreshold} (bomb/monster points: ${this.bombAndMonsterPoints})`
                );
              } else {
                return; // Skip this spawn condition
              }

              // Update the last score we checked
              this.lastScoreCheck = this.bombAndMonsterPoints;
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
            const threshold = Math.floor(bonusCount / GAME_CONFIG.EXTRA_LIFE_COIN_RATIO) * GAME_CONFIG.EXTRA_LIFE_COIN_RATIO;
            spawnKey = `${coinConfig.type}_${threshold}`;
            // log.debug(
            //   `E-coin spawn check: bonusCount=${bonusCount}, threshold=${threshold}, ratio=${GAME_CONFIG.EXTRA_LIFE_COIN_RATIO}, shouldSpawn=${bonusCount > 0 && bonusCount % GAME_CONFIG.EXTRA_LIFE_COIN_RATIO === 0}`
            // );
          }

          // Check if we've already triggered this spawn condition
          if (this.triggeredSpawnConditions.has(spawnKey)) {
            return; // Already triggered this spawn condition
          }

          log.debug(
            `Spawn condition met for ${coinConfig.type} coin (key: ${spawnKey})`
          );

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
        }
      }
    });
  }

  collectCoin(coin: Coin, gameState?: Record<string, unknown>): void {
    coin.isCollected = true;
    log.debug(`Collected ${coin.type} coin`);
    
    const coinConfig = COIN_TYPES[coin.type];
    if (coinConfig && gameState) {
      log.debug(`Processing ${coin.type} coin with ${coinConfig.effects.length} effects`);
      
      // Calculate points earned from this coin
      let pointsEarned = coinConfig.points;

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

      // Show floating text for points earned
      if ('addFloatingText' in gameState && typeof gameState.addFloatingText === 'function') {
        const text = pointsEarned.toString();
        (gameState.addFloatingText as (text: string, x: number, y: number, duration: number, color: string, fontSize: number) => void)(
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
          ...gameState as any,
          activeEffects: {
            powerMode: false,
            powerModeEndTime: 0,
            ...(gameState as any).activeEffects
          },
          coinManager: {
            resetMonsterKillCount: () => this.resetMonsterKillCount(),
            getPcoinColorForTime: (spawnTime: number) => this.getPcoinColorForTime(spawnTime),
            getPowerModeEndTime: () => this.getPowerModeEndTime()
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
            }
          },
          // Ensure audioManager is included from the original gameState
          audioManager: (gameState as any).audioManager
        };
        
        log.debug(`GameStateWithManager created, audioManager:`, (gameStateWithManager as any).audioManager);
        log.debug(`GameStateWithManager keys:`, Object.keys(gameStateWithManager));
        // Apply the effect first
        log.debug(`Applying effect: ${effect.type}`);
        effect.apply(gameStateWithManager, coin);
        log.debug(`Effect ${effect.type} applied successfully`);

        // Track timed effects - for POWER_MODE, get the duration from the activeEffects
        if (effect.type === "POWER_MODE") {
          // POWER_MODE effect calculates its own duration, so get it from the updated gameState
          const powerModeEndTime = (gameStateWithManager as any).activeEffects.powerModeEndTime;
          if (powerModeEndTime > 0) {
            this.activeEffects.set(effect.type, {
              endTime: powerModeEndTime,
              effect,
            });
            
            // Also update the coin manager's internal power mode state
            this.powerModeActive = true;
            this.powerModeEndTime = powerModeEndTime;
            
            log.debug(`POWER_MODE effect tracked with endTime: ${powerModeEndTime}, internal state updated`);
            log.debug(`Current time: ${Date.now()}, Effect will end at: ${powerModeEndTime}, Duration: ${powerModeEndTime - Date.now()}ms`);
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
      if (coin.type !== CoinType.POWER && coin.type !== CoinType.BONUS_MULTIPLIER && coin.type !== CoinType.EXTRA_LIFE) {
        log.warn(`Unknown coin type: ${coin.type}, using legacy behavior`);
      }
      if (coin.type === CoinType.POWER) {
        this.activatePowerMode();
      }
    }
  }

  private checkEffectsEnd(gameState?: Record<string, unknown>): void {
    // Don't check effects while paused
    if (this.isPaused) {
      return;
    }
    
    const currentTime = Date.now();
    const effectsToRemove: string[] = [];

    log.debug(`checkEffectsEnd called at ${currentTime}, checking ${this.activeEffects.size} active effects`);

    this.activeEffects.forEach((effectData, effectType) => {
      const timeLeft = effectData.endTime - currentTime;
      log.debug(`Checking effect: ${effectType}, endTime: ${effectData.endTime}, currentTime: ${currentTime}, timeLeft: ${timeLeft}ms, shouldEnd: ${timeLeft <= 0}`);
      
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
            ...gameState as any,
            activeEffects: {
              powerMode: false,
              powerModeEndTime: 0,
              ...(gameState as any).activeEffects
            },
            coinManager: {
              resetMonsterKillCount: () => this.resetMonsterKillCount(),
              getPcoinColorForTime: (spawnTime: number) => this.getPcoinColorForTime(spawnTime),
              getPowerModeEndTime: () => this.getPowerModeEndTime()
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
              }
            }
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
      log.debug(`Removing ${effectsToRemove.length} effects: ${effectsToRemove.join(', ')}`);
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
        log.debug(`Pausing effect ${effectType} with ${remainingTime}ms remaining`);
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
      if (effectData.remainingDuration !== undefined && effectData.remainingDuration > 0) {
        effectData.endTime = Date.now() + effectData.remainingDuration;
        log.debug(`Resuming effect ${effectType} with ${effectData.remainingDuration}ms remaining, new endTime: ${effectData.endTime}`);
        
        // Restart power-up melody if it's the POWER_MODE effect
        if (effectType === 'POWER_MODE' && effectData.remainingDuration > 0) {
          // Get the game state to access audioManager
          const gameState = useGameStore?.getState?.();
          if (gameState?.audioManager && typeof gameState.audioManager.startPowerUpMelodyWithDuration === 'function') {
            log.debug(`Restarting PowerUp melody with ${effectData.remainingDuration}ms remaining`);
            gameState.audioManager.startPowerUpMelodyWithDuration(effectData.remainingDuration);
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
        log.debug(`Resuming legacy power mode, new endTime: ${this.powerModeEndTime}`);
      }
    }
    
    this.pauseStartTime = 0;
  }

  resetEffects(): void {
    // Stop power-up melody if active when resetting effects
    if (this.powerModeActive) {
      log.debug("Resetting effects while power mode is active, this should stop PowerUp melody");
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
        log.debug("Could not resume difficulty scaling (ScalingManager not available)");
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
    let duration = GAME_CONFIG.POWER_COIN_DURATION; // Default fallback
    
    // Find the most recent P-coin to get its color
    const recentPcoin = this.coins.find(coin => coin.type === CoinType.POWER && coin.spawnTime);
    if (recentPcoin && recentPcoin.spawnTime) {
      const colorData = this.getPcoinColorForTime(recentPcoin.spawnTime);
      duration = colorData.duration;
    }
    
    this.powerModeEndTime = Date.now() + duration;
    this.resetMonsterKillCount();
    
    // Also add to activeEffects Map so checkEffectsEnd can handle it properly
    this.activeEffects.set("POWER_MODE", {
      endTime: this.powerModeEndTime,
      effect: COIN_EFFECTS.POWER_MODE
    });
    
    log.debug(`Power mode timing - duration: ${duration}ms, endTime: ${this.powerModeEndTime}, currentTime: ${Date.now()}`);
    
    // Pause difficulty scaling during power mode
    try {
      const scalingManager = ScalingManager.getInstance();
      scalingManager.pauseForPowerMode();
      log.debug("Difficulty scaling paused (power mode active)");
    } catch (error) {
      log.debug("Could not pause difficulty scaling (ScalingManager not available)");
    }
    
    log.debug(`Power mode activated for ${duration}ms (${duration/1000}s)`);
  }
}
