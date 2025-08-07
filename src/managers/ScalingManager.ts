import { Monster } from "../types/interfaces";
import { logger } from "../lib/logger";

// Unified scaling configuration
export interface ScalingConfig {
  base: MonsterScalingValues;
  scaling: MonsterScalingValues;
  max: MonsterScalingValues;
}

export interface MonsterScalingValues {
  ambusher: { ambushInterval: number; speed: number };
  chaser: { speed: number; directness: number; updateInterval: number };
  floater: { speed: number; bounceAngle: number };
  patrol: { speed: number };
}

export interface PauseState {
  isPaused: boolean;
  pauseStartTime: number;
  totalPausedTime: number;
  pauseReasons: Set<string>;
}

export class ScalingManager {
  private static instance: ScalingManager;
  private config: ScalingConfig;
  private globalPauseState: PauseState;
  private monsterCache: Map<
    string,
    { values: MonsterScalingValues; lastUpdate: number }
  >;
  private globalCache: {
    values: MonsterScalingValues;
    lastUpdate: number;
  } | null;
  private cacheTimeout: number = 1000; // 1 second cache

  private constructor() {
    this.config = this.getDefaultConfig();
    this.globalPauseState = this.createPauseState();
    this.monsterCache = new Map();
    this.globalCache = null;
  }

  public static getInstance(): ScalingManager {
    if (!ScalingManager.instance) {
      ScalingManager.instance = new ScalingManager();
    }
    return ScalingManager.instance;
  }

  // ===== CONFIGURATION =====
  private getDefaultConfig(): ScalingConfig {
    return {
      base: {
        ambusher: { ambushInterval: 5000, speed: 2 }, // Slower, less frequent ambushes
        chaser: { speed: 1, directness: 0.3, updateInterval: 200 }, // Slower, less direct, less frequent updates
        floater: { speed: 2, bounceAngle: 0.2 }, // Slower, less erratic
        patrol: { speed: 1 }, // Slower patrol
      },
      scaling: {
        ambusher: { ambushInterval: -500, speed: 0.08 }, // Increased scaling factors
        chaser: { speed: 0.2, directness: 0.08, updateInterval: -8 }, // Increased scaling factors
        floater: { speed: 0.5, bounceAngle: 0.008 }, // Increased scaling factors
        patrol: { speed: 0.2 }, // Increased scaling factors
      },
      max: {
        ambusher: { ambushInterval: 500, speed: 10 }, // Increased max values for more challenge
        chaser: { speed: 5.0, directness: 1, updateInterval: 100 }, // Increased max values for more challenge
        floater: { speed: 5.0, bounceAngle: 0.5 }, // Increased max values for more challenge
        patrol: { speed: 5.0 }, // Increased max values for more challenge
      },
    };
  }

  public updateConfig(newConfig: Partial<ScalingConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.clearCache();
    logger.debug("ScalingManager: Configuration updated");
  }

  // ===== PAUSE MANAGEMENT =====
  private createPauseState(): PauseState {
    return {
      isPaused: false,
      pauseStartTime: 0,
      totalPausedTime: 0,
      pauseReasons: new Set(),
    };
  }

  public pause(reason: string = "default"): void {
    if (!this.globalPauseState.isPaused) {
      this.globalPauseState.isPaused = true;
      this.globalPauseState.pauseStartTime = Date.now();
    }
    this.globalPauseState.pauseReasons.add(reason);
    logger.pause(`Scaling paused (${reason})`);
  }

  public resume(reason: string = "default"): void {
    this.globalPauseState.pauseReasons.delete(reason);

    if (
      this.globalPauseState.pauseReasons.size === 0 &&
      this.globalPauseState.isPaused
    ) {
      const pauseDuration = Date.now() - this.globalPauseState.pauseStartTime;
      this.globalPauseState.totalPausedTime += pauseDuration;
      this.globalPauseState.isPaused = false;
      this.clearCache();
      logger.pause(
        `Scaling resumed (paused for ${(pauseDuration / 1000).toFixed(1)}s)`
      );
    }
  }

  public isPaused(): boolean {
    return this.globalPauseState.isPaused;
  }

  public getPauseReasons(): string[] {
    return Array.from(this.globalPauseState.pauseReasons);
  }

  public getPauseStatus(): any {
    return {
      isPaused: this.globalPauseState.isPaused,
      pauseReasons: this.getPauseReasons(),
      totalPausedTime: this.globalPauseState.totalPausedTime,
      timeElapsed: this.getGlobalTimeElapsed(),
      globalStartTime: this.globalStartTime,
      currentTime: Date.now(),
    };
  }

  // ===== GLOBAL SCALING (DifficultyManager replacement) =====
  private globalStartTime: number = 0;

  public startMap(): void {
    this.globalStartTime = Date.now();
    this.globalPauseState = this.createPauseState();
    this.clearCache();
    logger.flow("New map started - difficulty reset");
  }

  public resetOnDeath(): void {
    this.globalStartTime = Date.now();
    this.globalPauseState = this.createPauseState();
    this.clearCache();
    logger.player("Player died - difficulty reset to base values");
  }

  public getGlobalScaledValues(): MonsterScalingValues {
    const now = Date.now();

    // Check cache first
    if (
      this.globalCache &&
      now - this.globalCache.lastUpdate < this.cacheTimeout
    ) {
      return this.globalCache.values;
    }

    const values = this.calculateScaledValues(this.getGlobalTimeElapsed());
    this.globalCache = { values, lastUpdate: now };
    return values;
  }

  private getGlobalTimeElapsed(): number {
    if (this.globalStartTime === 0) return 0;
    const currentTime = Date.now();
    const actualElapsed = currentTime - this.globalStartTime;
    return (actualElapsed - this.globalPauseState.totalPausedTime) / 1000;
  }

  public pauseForPowerMode(): void {
    this.pause("power_mode");
    logger.power("Power mode activated - scaling paused");
  }

  public resumeFromPowerMode(): void {
    this.resume("power_mode");
    logger.power("Power mode ended - scaling resumed");
  }

  public isCurrentlyPausedByPowerMode(): boolean {
    return this.globalPauseState.pauseReasons.has("power_mode");
  }

  // ===== GLOBAL MONSTER SCALING CONTROL =====
  public pauseAllMonsterScaling(): void {
    this.pause("monster_scaling");
    // Only log if this is a new pause (not already paused)
    if (this.globalPauseState.pauseReasons.size === 1) {
      logger.pause("All monster scaling paused");
    }
  }

  public resumeAllMonsterScaling(): void {
    this.resume("monster_scaling");
    // Only log if this was the last pause reason (completely resumed)
    if (this.globalPauseState.pauseReasons.size === 0) {
      logger.pause("All monster scaling resumed");
    }
  }

  // ===== INDIVIDUAL MONSTER SCALING =====
  public getMonsterScaledValues(monster: Monster): MonsterScalingValues {
    this.initializeMonster(monster);

    // Check both individual and global pause states
    if (monster.individualScalingPaused || this.globalPauseState.isPaused) {
      return this.config.base;
    }

    const cacheKey = this.getMonsterCacheKey(monster);
    const now = Date.now();

    // Check cache first
    const cached = this.monsterCache.get(cacheKey);
    if (cached && now - cached.lastUpdate < this.cacheTimeout) {
      return cached.values;
    }

    const oldValues = cached?.values || this.config.base;
    const values = this.calculateScaledValues(this.getMonsterAge(monster));

    // Log scaling changes if values have changed significantly
    this.logScalingChanges(monster, oldValues, values);

    this.monsterCache.set(cacheKey, { values, lastUpdate: now });
    return values;
  }

  public initializeMonster(monster: Monster): void {
    if (!monster.individualSpawnTime) {
      monster.individualSpawnTime = Date.now();
      monster.individualScalingPaused = false;
      // Store the total paused time when monster was spawned to account for future pauses
      (monster as any).spawnPauseTime = this.globalPauseState.totalPausedTime;

      // Log initial scaling values
      const baseValues = this.config.base;
      let initialInfo = "";

      switch (monster.type) {
        case "AMBUSHER":
          initialInfo = `ambush interval: ${
            baseValues.ambusher.ambushInterval
          }ms, speed: ${baseValues.ambusher.speed.toFixed(2)}`;
          break;
        case "CHASER":
          initialInfo = `speed: ${baseValues.chaser.speed.toFixed(
            2
          )}, directness: ${baseValues.chaser.directness.toFixed(
            3
          )}, update interval: ${baseValues.chaser.updateInterval}ms`;
          break;
        case "FLOATER":
          initialInfo = `speed: ${baseValues.floater.speed.toFixed(
            2
          )}, bounce angle: ${baseValues.floater.bounceAngle.toFixed(3)}`;
          break;
        case "HORIZONTAL_PATROL":
        case "VERTICAL_PATROL":
          initialInfo = `speed: ${baseValues.patrol.speed.toFixed(2)}`;
          break;
        default:
          initialInfo = "base values";
      }

      logger.scaling(`${monster.type} initialized with ${initialInfo}`);
    }
  }

  public resetMonsterScaling(monster: Monster): void {
    monster.individualSpawnTime = Date.now();
    monster.individualScalingPaused = false;
    (monster as any).spawnPauseTime = this.globalPauseState.totalPausedTime;
    this.monsterCache.delete(this.getMonsterCacheKey(monster));
    logger.monster(`${monster.type} scaling reset`);
  }

  public pauseMonsterScaling(monster: Monster): void {
    monster.individualScalingPaused = true;
    this.monsterCache.delete(this.getMonsterCacheKey(monster));
  }

  public resumeMonsterScaling(monster: Monster): void {
    monster.individualScalingPaused = false;
    this.monsterCache.delete(this.getMonsterCacheKey(monster));
  }

  public getMonsterAge(monster: Monster): number {
    if (!monster.individualSpawnTime) return 0;
    const currentTime = Date.now();
    const actualElapsed = currentTime - monster.individualSpawnTime;
    // Account for pause time that occurred after this monster was spawned
    const pauseTimeAfterSpawn =
      this.globalPauseState.totalPausedTime -
      ((monster as any).spawnPauseTime || 0);
    const adjustedElapsed = actualElapsed - pauseTimeAfterSpawn;
    const age = Math.max(0, adjustedElapsed) / 1000;

    // Debug logging for pause system verification (only in debug mode)
    if (this.globalPauseState.isPaused && age > 0) {
      logger.debug(
        `Monster age: ${monster.type} - Actual: ${(
          actualElapsed / 1000
        ).toFixed(1)}s, Paused: ${(pauseTimeAfterSpawn / 1000).toFixed(
          1
        )}s, Adjusted: ${age.toFixed(1)}s`
      );
    }

    return age;
  }

  // ===== UTILITY METHODS =====
  private getMonsterCacheKey(monster: Monster): string {
    // Use monster's position and spawn time to make cache key unique per instance
    // This ensures multiple monsters of the same type don't share the same cache
    const position = `${Math.round(monster.x)}-${Math.round(monster.y)}`;
    return `${monster.type}-${position}-${monster.individualSpawnTime || 0}`;
  }

  private logScalingChanges(
    monster: Monster,
    oldValues: MonsterScalingValues,
    newValues: MonsterScalingValues
  ): void {
    const age = this.getMonsterAge(monster);
    const intervals = Math.floor(age / 5);

    // Only log if we're in a new interval (to avoid spam)
    if (intervals > 0 && intervals % 1 === 0) {
      const changes: string[] = [];

      // Only show relevant changes for the specific monster type
      switch (monster.type) {
        case "AMBUSHER":
          if (
            Math.abs(oldValues.ambusher.speed - newValues.ambusher.speed) > 0.01
          ) {
            changes.push(
              `speed: ${oldValues.ambusher.speed.toFixed(
                2
              )} → ${newValues.ambusher.speed.toFixed(2)}`
            );
          }
          if (
            Math.abs(
              oldValues.ambusher.ambushInterval -
                newValues.ambusher.ambushInterval
            ) > 50
          ) {
            changes.push(
              `ambush interval: ${oldValues.ambusher.ambushInterval}ms → ${newValues.ambusher.ambushInterval}ms`
            );
          }
          break;

        case "CHASER":
          if (
            Math.abs(oldValues.chaser.speed - newValues.chaser.speed) > 0.01
          ) {
            changes.push(
              `speed: ${oldValues.chaser.speed.toFixed(
                2
              )} → ${newValues.chaser.speed.toFixed(2)}`
            );
          }
          if (
            Math.abs(
              oldValues.chaser.directness - newValues.chaser.directness
            ) > 0.01
          ) {
            changes.push(
              `directness: ${oldValues.chaser.directness.toFixed(
                3
              )} → ${newValues.chaser.directness.toFixed(3)}`
            );
          }
          if (
            Math.abs(
              oldValues.chaser.updateInterval - newValues.chaser.updateInterval
            ) > 5
          ) {
            changes.push(
              `update interval: ${oldValues.chaser.updateInterval}ms → ${newValues.chaser.updateInterval}ms`
            );
          }
          break;

        case "FLOATER":
          if (
            Math.abs(oldValues.floater.speed - newValues.floater.speed) > 0.01
          ) {
            changes.push(
              `speed: ${oldValues.floater.speed.toFixed(
                2
              )} → ${newValues.floater.speed.toFixed(2)}`
            );
          }
          if (
            Math.abs(
              oldValues.floater.bounceAngle - newValues.floater.bounceAngle
            ) > 0.001
          ) {
            changes.push(
              `bounce angle: ${oldValues.floater.bounceAngle.toFixed(
                3
              )} → ${newValues.floater.bounceAngle.toFixed(3)}`
            );
          }
          break;

        case "HORIZONTAL_PATROL":
        case "VERTICAL_PATROL":
          if (
            Math.abs(oldValues.patrol.speed - newValues.patrol.speed) > 0.01
          ) {
            changes.push(
              `speed: ${oldValues.patrol.speed.toFixed(
                2
              )} → ${newValues.patrol.speed.toFixed(2)}`
            );
          }
          break;
      }

      if (changes.length > 0) {
        logger.scaling(
          `${monster.type} scaling (${age.toFixed(
            1
          )}s, interval ${intervals}): ${changes.join(", ")}`
        );
      }
    }
  }

  private calculateScaledValues(timeElapsed: number): MonsterScalingValues {
    const intervals = Math.floor(timeElapsed / 5); // Changed from 10 to 5 seconds

    return {
      ambusher: {
        ambushInterval: this.calculateScaledValue(
          this.config.base.ambusher.ambushInterval,
          this.config.scaling.ambusher.ambushInterval,
          this.config.max.ambusher.ambushInterval,
          intervals
        ),
        speed: this.calculateScaledValue(
          this.config.base.ambusher.speed,
          this.config.scaling.ambusher.speed,
          this.config.max.ambusher.speed,
          intervals
        ),
      },
      chaser: {
        speed: this.calculateScaledValue(
          this.config.base.chaser.speed,
          this.config.scaling.chaser.speed,
          this.config.max.chaser.speed,
          intervals
        ),
        directness: this.calculateScaledValue(
          this.config.base.chaser.directness,
          this.config.scaling.chaser.directness,
          this.config.max.chaser.directness,
          intervals
        ),
        updateInterval: this.calculateScaledValue(
          this.config.base.chaser.updateInterval,
          this.config.scaling.chaser.updateInterval,
          this.config.max.chaser.updateInterval,
          intervals
        ),
      },
      floater: {
        speed: this.calculateScaledValue(
          this.config.base.floater.speed,
          this.config.scaling.floater.speed,
          this.config.max.floater.speed,
          intervals
        ),
        bounceAngle: this.calculateScaledValue(
          this.config.base.floater.bounceAngle,
          this.config.scaling.floater.bounceAngle,
          this.config.max.floater.bounceAngle,
          intervals
        ),
      },
      patrol: {
        speed: this.calculateScaledValue(
          this.config.base.patrol.speed,
          this.config.scaling.patrol.speed,
          this.config.max.patrol.speed,
          intervals
        ),
      },
    };
  }

  private calculateScaledValue(
    baseValue: number,
    scalingFactor: number,
    maxValue: number,
    intervals: number
  ): number {
    const scaledValue = baseValue + scalingFactor * intervals;
    return scalingFactor > 0
      ? Math.min(scaledValue, maxValue)
      : Math.max(scaledValue, maxValue);
  }

  private clearCache(): void {
    this.monsterCache.clear();
    this.globalCache = null;
  }

  public getBaseValues(): MonsterScalingValues {
    return { ...this.config.base };
  }

  public cleanup(): void {
    this.clearCache();
    this.globalPauseState = this.createPauseState();
  }
}
