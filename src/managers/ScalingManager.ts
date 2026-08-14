import { Monster } from "../types/interfaces";
import { PauseReason } from "../types/enums";
import { logger, LogCategory } from "../lib/logger";
import { getTuned, getTuningVersion } from "../stores/systems/tuningStore";
import { getEffectivePausedMs } from "../lib/pauseClock";

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
  pauseReasons: Set<PauseReason>;
}

export class ScalingManager {
  private static instance: ScalingManager;
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
    // `this.config` is a getter that reads live from the tuning store.
    this.globalPauseState = this.createPauseState();
    this.monsterCache = new Map();
    this.globalCache = null;
  }

  /**
   * Live-read scaling config. Each access rebuilds from tuning store; cheap
   * (a dozen Map lookups). Holders of `valuesToUse` keep their snapshot for
   * the call's duration.
   */
  private get config(): ScalingConfig {
    return this.getDefaultConfig();
  }

  public static getInstance(): ScalingManager {
    if (!ScalingManager.instance) {
      ScalingManager.instance = new ScalingManager();
    }
    return ScalingManager.instance;
  }

  // ===== CONFIGURATION =====
  /**
   * Build the scaling config from the live tuning store. Called fresh each
   * time `this.config` is accessed (the property is a getter below).
   * Per-monster scaled-value caches invalidate when the tuning version
   * changes (see maybeInvalidateForTuning).
   */
  private getDefaultConfig(): ScalingConfig {
    return {
      base: {
        ambusher: {
          ambushInterval: getTuned("TAXGHOST_BASE_AMBUSH_INTERVAL"),
          speed: getTuned("TAXGHOST_BASE_SPEED"),
        },
        chaser: {
          speed: getTuned("WISP_BASE_SPEED"),
          directness: getTuned("WISP_BASE_DIRECTNESS"),
          updateInterval: getTuned("WISP_BASE_UPDATE_INTERVAL"),
        },
        floater: {
          speed: getTuned("FOUNDER_BASE_SPEED"),
          bounceAngle: getTuned("FOUNDER_BASE_BOUNCE_ANGLE"),
        },
        patrol: { speed: getTuned("BUREAUCRAT_BASE_SPEED") },
      },
      scaling: {
        ambusher: {
          ambushInterval: getTuned("TAXGHOST_AMBUSH_INTERVAL_SCALING"),
          speed: getTuned("TAXGHOST_SPEED_SCALING"),
        },
        chaser: {
          speed: getTuned("WISP_SPEED_SCALING"),
          directness: getTuned("WISP_DIRECTNESS_SCALING"),
          updateInterval: getTuned("WISP_UPDATE_INTERVAL_SCALING"),
        },
        floater: {
          speed: getTuned("FOUNDER_SPEED_SCALING"),
          bounceAngle: getTuned("FOUNDER_BOUNCE_ANGLE_SCALING"),
        },
        patrol: { speed: getTuned("BUREAUCRAT_SPEED_SCALING") },
      },
      max: {
        ambusher: {
          ambushInterval: getTuned("TAXGHOST_MIN_AMBUSH_INTERVAL"),
          speed: getTuned("TAXGHOST_MAX_SPEED"),
        },
        chaser: {
          speed: getTuned("WISP_MAX_SPEED"),
          directness: getTuned("WISP_MAX_DIRECTNESS"),
          updateInterval: getTuned("WISP_MIN_UPDATE_INTERVAL"),
        },
        floater: {
          speed: getTuned("FOUNDER_MAX_SPEED"),
          bounceAngle: getTuned("FOUNDER_MAX_BOUNCE_ANGLE"),
        },
        patrol: { speed: getTuned("BUREAUCRAT_MAX_SPEED") },
      },
    };
  }

  /**
   * If the tuning version has bumped since last check, dump the cache so the
   * next scaled-value computation uses fresh tuned values. Called at the
   * top of any method that returns cached scaling.
   */
  private maybeInvalidateForTuning(): void {
    const v = getTuningVersion();
    if (v !== this.tuningVersionAtCache) {
      this.tuningVersionAtCache = v;
      this.clearCache();
    }
  }
  private tuningVersionAtCache = -1;

  public updateConfig(_newConfig: Partial<ScalingConfig>): void {
    // `config` is now a getter that reads live from the tuning store, so
    // mutation here is a no-op. Kept for API compatibility; just bust the
    // cache so subsequent reads pick up any external tuning changes.
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

  public pause(reason: PauseReason = PauseReason.Default): void {
    if (!this.globalPauseState.isPaused) {
      this.globalPauseState.isPaused = true;
      this.globalPauseState.pauseStartTime = Date.now();
    }
    this.globalPauseState.pauseReasons.add(reason);
    // Use throttled logging to prevent spam
    logger.throttled(LogCategory.GAME, `scaling_paused_${reason}`, `Scaling paused (${reason})`, 5000);
  }

  public resume(reason: PauseReason = PauseReason.Default): void {
    this.globalPauseState.pauseReasons.delete(reason);

    if (
      this.globalPauseState.pauseReasons.size === 0 &&
      this.globalPauseState.isPaused
    ) {
      const pauseDuration = Date.now() - this.globalPauseState.pauseStartTime;
      this.globalPauseState.totalPausedTime += pauseDuration;
      this.globalPauseState.isPaused = false;
      this.clearCache();
      // Use throttled logging to prevent spam
      logger.throttled(LogCategory.GAME, `scaling_resumed_${reason}`, `Scaling resumed (paused for ${(pauseDuration / 1000).toFixed(1)}s)`, 5000);
    }
  }

  public isPaused(): boolean {
    return this.globalPauseState.isPaused;
  }

  public getPauseReasons(): PauseReason[] {
    return Array.from(this.globalPauseState.pauseReasons);
  }

  public getPauseStatus(): {
    isPaused: boolean;
    pauseReasons: PauseReason[];
    totalPausedTime: number;
    timeElapsed: number;
    globalStartTime: number;
    currentTime: number;
  } {
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
    this.resetGlobalClock();
    logger.level("New map started - difficulty reset");
  }

  public resetOnDeath(): void {
    this.resetGlobalClock();
    logger.player("Player died - difficulty reset to base values");
  }

  /**
   * Reset the difficulty clock WITHOUT dropping active pause reasons.
   * Level loads and death resets happen while scaling is paused for a
   * menu/map-cleared/countdown state; replacing the pause state with a
   * fresh unpaused one silently resumed the clock, so difficulty accrued
   * through bonus screens and countdowns before play actually began —
   * "difficulty rises while paused".
   */
  private resetGlobalClock(): void {
    const activeReasons = new Set(this.globalPauseState.pauseReasons);
    this.globalStartTime = Date.now();
    this.globalPauseState = this.createPauseState();
    if (activeReasons.size > 0) {
      this.globalPauseState.pauseReasons = activeReasons;
      this.globalPauseState.isPaused = true;
      this.globalPauseState.pauseStartTime = this.globalStartTime;
    }
    this.clearCache();
  }

  public getGlobalScaledValues(): MonsterScalingValues {
    this.maybeInvalidateForTuning();
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
    const now = Date.now();
    const elapsed =
      now - this.globalStartTime - getEffectivePausedMs(this.globalPauseState, now);
    return elapsed / 1000;
  }

  public pauseForPowerMode(): void {
    this.pause(PauseReason.PowerMode);
    logger.throttled(LogCategory.POWER, "power_mode_activated", "Power mode activated - scaling paused", 5000);
  }

  public resumeFromPowerMode(): void {
    this.resume(PauseReason.PowerMode);
    logger.throttled(LogCategory.POWER, "power_mode_ended", "Power mode ended - scaling resumed", 5000);
  }

  public isCurrentlyPausedByPowerMode(): boolean {
    return this.globalPauseState.pauseReasons.has(PauseReason.PowerMode);
  }

  // ===== GLOBAL MONSTER SCALING CONTROL =====
  public pauseAllMonsterScaling(): void {
    this.pause(PauseReason.MonsterScaling);
    if (this.globalPauseState.pauseReasons.size === 1) {
      logger.throttled(LogCategory.GAME, "monster_scaling_paused", "All monster scaling paused", 5000);
    }
  }

  public resumeAllMonsterScaling(): void {
    this.resume(PauseReason.MonsterScaling);
    if (this.globalPauseState.pauseReasons.size === 0) {
      logger.throttled(LogCategory.GAME, "monster_scaling_resumed", "All monster scaling resumed", 5000);
    }
  }

  // ===== INDIVIDUAL MONSTER SCALING =====
  public getMonsterScaledValues(monster: Monster): MonsterScalingValues {
    this.maybeInvalidateForTuning();
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
      const now = Date.now();
      monster.individualSpawnTime = now;
      monster.individualScalingPaused = false;
      // Snapshot the effective paused-ms at spawn so getMonsterAge can
      // subtract pauses that happen AFTER spawn (and not the ones before).
      // Includes any in-progress pause if the monster spawns mid-pause.
      (monster as any).spawnPauseTime = getEffectivePausedMs(
        this.globalPauseState,
        now
      );

      // Log initial scaling values
      const baseValues = this.config.base;
      let initialInfo = "";

      switch (monster.type) {
        case "TAXGHOST":
          initialInfo = `ambush interval: ${
            baseValues.ambusher.ambushInterval
          }ms, speed: ${baseValues.ambusher.speed.toFixed(2)}`;
          break;
        case "WISP":
          initialInfo = `speed: ${baseValues.chaser.speed.toFixed(
            2
          )}, directness: ${baseValues.chaser.directness.toFixed(
            3
          )}, update interval: ${baseValues.chaser.updateInterval}ms`;
          break;
        case "FOUNDER":
          initialInfo = `speed: ${baseValues.floater.speed.toFixed(
            2
          )}, bounce angle: ${baseValues.floater.bounceAngle.toFixed(3)}`;
          break;
        case "BUREAUCRAT":
          initialInfo = `speed: ${baseValues.patrol.speed.toFixed(2)}`;
          break;
        default:
          initialInfo = "base values";
      }

      logger.performance(`${monster.type} initialized with ${initialInfo}`);
    }
  }

  public resetMonsterScaling(monster: Monster): void {
    const now = Date.now();
    monster.individualSpawnTime = now;
    monster.individualScalingPaused = false;
    (monster as any).spawnPauseTime = getEffectivePausedMs(
      this.globalPauseState,
      now
    );
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
    const now = Date.now();
    const actualElapsed = now - monster.individualSpawnTime;
    // Effective paused time includes the in-progress pause (e.g. during
    // P-coin freeze), so monster age stays frozen during power mode.
    const pauseTimeAfterSpawn =
      getEffectivePausedMs(this.globalPauseState, now) -
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
        case "TAXGHOST":
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

        case "WISP":
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

        case "FOUNDER":
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

        case "BUREAUCRAT":
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
        logger.performance(
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
