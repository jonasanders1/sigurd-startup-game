import { logger } from "../lib/logger";

export interface DifficultyConfig {
  // Base values (starting difficulty)
  base: {
    ambusher: {
      ambushInterval: number;
      speed: number;
    };
    chaser: {
      speed: number;
      directness: number;
      updateInterval: number;
    };
    floater: {
      speed: number;
      bounceAngle: number;
    };
    patrol: {
      speed: number;
    };
  };
  // Scaling factors (how much to increase per 10-second interval)
  scaling: {
    ambusher: {
      ambushInterval: number; // Negative = faster ambushes
      speed: number;
    };
    chaser: {
      speed: number;
      directness: number;
      updateInterval: number; // Negative = more frequent updates
    };
    floater: {
      speed: number;
      bounceAngle: number;
    };
    patrol: {
      speed: number;
    };
  };
  // Maximum values (caps to prevent impossible difficulty)
  max: {
    ambusher: {
      ambushInterval: number;
      speed: number;
    };
    chaser: {
      speed: number;
      directness: number;
      updateInterval: number;
    };
    floater: {
      speed: number;
      bounceAngle: number;
    };
    patrol: {
      speed: number;
    };
  };
}

export class DifficultyManager {
  private static instance: DifficultyManager;
  private mapStartTime: number = 0;
  private currentDifficulty: DifficultyConfig;
  private lastUpdateTime: number = 0;
  private updateInterval: number = 30000; // 30 seconds
  private currentValues: any = null;
  
  // Pause functionality
  private isPaused: boolean = false;
  private pauseStartTime: number = 0;
  private totalPausedTime: number = 0;

  // Default difficulty configuration
  private static readonly DEFAULT_CONFIG: DifficultyConfig = {
    base: {
      ambusher: {
        ambushInterval: 5000, // 5 seconds
        speed: 1.0,
      },
      chaser: {
        speed: 1,
        directness: 0.3, // How directly it chases (0-1)
        updateInterval: 500, // How often it recalculates path
      },
      floater: {
        speed: 1.2,
        bounceAngle: 0.3, // How much angle changes on bounce
      },
      patrol: {
        speed: 1.0,
      },
    },
    scaling: {
      ambusher: {
        ambushInterval: -1000, // 1 second faster per 10-second interval
        speed: 0.25, // 1.0 speed increase per 10-second interval
      },
      chaser: {
        speed: 0.25,
        directness: 0.1, // More direct over time
        updateInterval: -50, // 50ms faster updates per 10-second interval
      },
      floater: {
        speed: 0.8,
        bounceAngle: 0.1, // Slightly more erratic bounces
      },
      patrol: {
        speed: 0.25,
      },
    },
    max: {
      ambusher: {
        ambushInterval: 1000, // Minimum 1 second between ambushes
        speed: 3.0,
      },
      chaser: {
        speed: 4.0,
        directness: 0.95, // Almost perfect chasing
        updateInterval: 20, // Very frequent updates
      },
      floater: {
        speed: 2.5,
        bounceAngle: 0.5,
      },
      patrol: {
        speed: 20.0,
      },
    },
  };

  private constructor() {
    this.currentDifficulty = JSON.parse(JSON.stringify(DifficultyManager.DEFAULT_CONFIG));
  }

  public static getInstance(): DifficultyManager {
    if (!DifficultyManager.instance) {
      DifficultyManager.instance = new DifficultyManager();
    }
    return DifficultyManager.instance;
  }

  public startMap(): void {
    this.mapStartTime = Date.now();
    this.lastUpdateTime = Date.now();
    this.currentDifficulty = JSON.parse(JSON.stringify(DifficultyManager.DEFAULT_CONFIG));
    this.currentValues = this.calculateCurrentValues();
    this.isPaused = false;
    this.pauseStartTime = 0;
    this.totalPausedTime = 0;
    logger.debug("DifficultyManager: Started new map, resetting difficulty");
    
    // Log initial values
    this.logCurrentDifficultyValues();
  }

  public resetOnDeath(): void {
    this.mapStartTime = Date.now();
    this.lastUpdateTime = Date.now();
    this.currentDifficulty = JSON.parse(JSON.stringify(DifficultyManager.DEFAULT_CONFIG));
    this.currentValues = this.calculateCurrentValues();
    this.isPaused = false;
    this.pauseStartTime = 0;
    this.totalPausedTime = 0;
    logger.debug("DifficultyManager: Player died, resetting difficulty to base values");
    
    // Log reset values
    this.logCurrentDifficultyValues();
  }

  public getCurrentDifficulty(): DifficultyConfig {
    return this.currentDifficulty;
  }

  public getScaledValues(): {
    ambusher: { ambushInterval: number; speed: number };
    chaser: { speed: number; directness: number; updateInterval: number };
    floater: { speed: number; bounceAngle: number };
    patrol: { speed: number };
  } {
    const currentTime = Date.now();
    
    // Check if it's time to update values (every 10 seconds)
    if (currentTime - this.lastUpdateTime >= this.updateInterval) {
      this.currentValues = this.calculateCurrentValues();
      this.lastUpdateTime = currentTime;
      
      // Log the update
      this.logCurrentDifficultyValues();
    }

    return this.currentValues;
  }

  private calculateCurrentValues(): {
    ambusher: { ambushInterval: number; speed: number };
    chaser: { speed: number; directness: number; updateInterval: number };
    floater: { speed: number; bounceAngle: number };
    patrol: { speed: number };
  } {
    const timeElapsed = this.getTimeElapsed(); // Use adjusted time that accounts for pauses
    const intervals = Math.floor(timeElapsed / 10); // Number of 10-second intervals

    return {
      ambusher: {
        ambushInterval: this.calculateScaledValue(
          this.currentDifficulty.base.ambusher.ambushInterval,
          this.currentDifficulty.scaling.ambusher.ambushInterval,
          this.currentDifficulty.max.ambusher.ambushInterval,
          intervals
        ),
        speed: this.calculateScaledValue(
          this.currentDifficulty.base.ambusher.speed,
          this.currentDifficulty.scaling.ambusher.speed,
          this.currentDifficulty.max.ambusher.speed,
          intervals
        ),
      },
      chaser: {
        speed: this.calculateScaledValue(
          this.currentDifficulty.base.chaser.speed,
          this.currentDifficulty.scaling.chaser.speed,
          this.currentDifficulty.max.chaser.speed,
          intervals
        ),
        directness: this.calculateScaledValue(
          this.currentDifficulty.base.chaser.directness,
          this.currentDifficulty.scaling.chaser.directness,
          this.currentDifficulty.max.chaser.directness,
          intervals
        ),
        updateInterval: this.calculateScaledValue(
          this.currentDifficulty.base.chaser.updateInterval,
          this.currentDifficulty.scaling.chaser.updateInterval,
          this.currentDifficulty.max.chaser.updateInterval,
          intervals
        ),
      },
      floater: {
        speed: this.calculateScaledValue(
          this.currentDifficulty.base.floater.speed,
          this.currentDifficulty.scaling.floater.speed,
          this.currentDifficulty.max.floater.speed,
          intervals
        ),
        bounceAngle: this.calculateScaledValue(
          this.currentDifficulty.base.floater.bounceAngle,
          this.currentDifficulty.scaling.floater.bounceAngle,
          this.currentDifficulty.max.floater.bounceAngle,
          intervals
        ),
      },
      patrol: {
        speed: this.calculateScaledValue(
          this.currentDifficulty.base.patrol.speed,
          this.currentDifficulty.scaling.patrol.speed,
          this.currentDifficulty.max.patrol.speed,
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
    const scaledValue = baseValue + (scalingFactor * intervals);
    
    // Apply min/max constraints
    if (scalingFactor > 0) {
      // For increasing values (speed, directness, etc.)
      return Math.min(scaledValue, maxValue);
    } else {
      // For decreasing values (intervals, etc.)
      return Math.max(scaledValue, maxValue);
    }
  }

  public getTimeElapsed(): number {
    const currentTime = Date.now();
    const actualElapsed = currentTime - this.mapStartTime;
    const adjustedElapsed = actualElapsed - this.totalPausedTime;
    return adjustedElapsed / 1000;
  }

  public pause(): void {
    if (!this.isPaused) {
      this.isPaused = true;
      this.pauseStartTime = Date.now();
      logger.debug("DifficultyManager: Paused difficulty scaling");
    }
  }

  public resume(): void {
    if (this.isPaused) {
      this.isPaused = false;
      const pauseDuration = Date.now() - this.pauseStartTime;
      this.totalPausedTime += pauseDuration;
      logger.debug(`DifficultyManager: Resumed difficulty scaling (paused for ${(pauseDuration / 1000).toFixed(1)}s)`);
    }
  }

  public isCurrentlyPaused(): boolean {
    return this.isPaused;
  }

  public updateDifficultyConfig(newConfig: Partial<DifficultyConfig>): void {
    this.currentDifficulty = { ...this.currentDifficulty, ...newConfig };
    logger.debug("DifficultyManager: Updated difficulty configuration");
  }

  private logCurrentDifficultyValues(): void {
    const elapsed = this.getTimeElapsed();
    const intervals = Math.floor(elapsed / 10);
    
    logger.debug("🎯 DIFFICULTY UPDATE - Time Elapsed: " + elapsed.toFixed(1) + "s (Interval: " + intervals + ")");
    logger.debug("📊 AMBUSHER:");
    logger.debug(`   Ambush Interval: ${this.currentValues.ambusher.ambushInterval.toFixed(0)}ms`);
    logger.debug(`   Speed: ${this.currentValues.ambusher.speed.toFixed(2)}`);
    
    logger.debug("📊 CHASER:");
    logger.debug(`   Speed: ${this.currentValues.chaser.speed.toFixed(2)}`);
    logger.debug(`   Directness: ${this.currentValues.chaser.directness.toFixed(3)}`);
    logger.debug(`   Update Interval: ${this.currentValues.chaser.updateInterval.toFixed(0)}ms`);
    
    logger.debug("📊 FLOATER:");
    logger.debug(`   Speed: ${this.currentValues.floater.speed.toFixed(2)}`);
    logger.debug(`   Bounce Angle: ${this.currentValues.floater.bounceAngle.toFixed(3)}`);
    
    logger.debug("📊 PATROL:");
    logger.debug(`   Speed: ${this.currentValues.patrol.speed.toFixed(2)}`);
    logger.debug("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  }

  // Method to change update interval
  public setUpdateInterval(intervalMs: number): void {
    this.updateInterval = intervalMs;
    logger.debug(`DifficultyManager: Update interval set to ${intervalMs}ms`);
  }
} 