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
  private monsterCache: Map<string, { values: MonsterScalingValues; lastUpdate: number }>;
  private globalCache: { values: MonsterScalingValues; lastUpdate: number } | null;
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
        ambusher: { ambushInterval: 5000, speed: 1.0 },
        chaser: { speed: 1, directness: 0.3, updateInterval: 100 },
        floater: { speed: 1.2, bounceAngle: 0.3 },
        patrol: { speed: 1.0 },
      },
      scaling: {
        ambusher: { ambushInterval: -1000, speed: 0.25 },
        chaser: { speed: 0.2, directness: 0.05, updateInterval: -50 },
        floater: { speed: 0.15, bounceAngle: 0.02 },
        patrol: { speed: 1.5 },
      },
      max: {
        ambusher: { ambushInterval: 1000, speed: 3.0 },
        chaser: { speed: 2.5, directness: 0.9, updateInterval: 50 },
        floater: { speed: 2.0, bounceAngle: 0.8 },
        patrol: { speed: 20.0 },
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
    
    if (this.globalPauseState.pauseReasons.size === 0 && this.globalPauseState.isPaused) {
      const pauseDuration = Date.now() - this.globalPauseState.pauseStartTime;
      this.globalPauseState.totalPausedTime += pauseDuration;
      this.globalPauseState.isPaused = false;
      this.clearCache();
      logger.pause(`Scaling resumed (paused for ${(pauseDuration / 1000).toFixed(1)}s)`);
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
    if (this.globalCache && (now - this.globalCache.lastUpdate) < this.cacheTimeout) {
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
    logger.pause("All monster scaling paused");
  }

  public resumeAllMonsterScaling(): void {
    this.resume("monster_scaling");
    logger.pause("All monster scaling resumed");
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
    if (cached && (now - cached.lastUpdate) < this.cacheTimeout) {
      return cached.values;
    }

    const values = this.calculateScaledValues(this.getMonsterAge(monster));
    this.monsterCache.set(cacheKey, { values, lastUpdate: now });
    return values;
  }

  public initializeMonster(monster: Monster): void {
    if (!monster.individualSpawnTime) {
      monster.individualSpawnTime = Date.now();
      monster.individualScalingPaused = false;
      // Store the total paused time when monster was spawned to account for future pauses
      (monster as any).spawnPauseTime = this.globalPauseState.totalPausedTime;
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
    const pauseTimeAfterSpawn = this.globalPauseState.totalPausedTime - ((monster as any).spawnPauseTime || 0);
    const adjustedElapsed = actualElapsed - pauseTimeAfterSpawn;
    const age = Math.max(0, adjustedElapsed) / 1000;
    
    // Debug logging for pause system verification (only in debug mode)
    if (this.globalPauseState.isPaused && age > 0) {
      logger.debug(`Monster age: ${monster.type} - Actual: ${(actualElapsed/1000).toFixed(1)}s, Paused: ${(pauseTimeAfterSpawn/1000).toFixed(1)}s, Adjusted: ${age.toFixed(1)}s`);
    }
    
    return age;
  }

  // ===== UTILITY METHODS =====
  private getMonsterCacheKey(monster: Monster): string {
    return `${monster.type}-${monster.individualSpawnTime || 0}`;
  }

  private calculateScaledValues(timeElapsed: number): MonsterScalingValues {
    const intervals = Math.floor(timeElapsed / 10);
    
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