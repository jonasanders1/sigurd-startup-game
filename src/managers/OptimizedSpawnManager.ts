import { Monster, MonsterSpawnPoint } from "../types/interfaces";
import { logger, LogCategory } from "../lib/logger";
import {
  useGameStore,
  useMonsterStore,
  useLevelStore,
  usePlayerStore,
} from "../stores/gameStore";
import { MonsterBehaviorManager } from "./MonsterBehaviorManager";

interface ScheduledSpawn {
  id: string;
  spawnPoint: MonsterSpawnPoint;
  scheduledTime: number;
  executed: boolean;
}

interface PauseState {
  isPaused: boolean;
  pauseStartTime: number;
  totalPausedTime: number;
  pauseReasons: Set<string>;
}

export class OptimizedSpawnManager {
  private levelStartTime: number = 0;
  private scheduledSpawns: ScheduledSpawn[] = [];
  private behaviorManager: MonsterBehaviorManager;
  private pauseState: PauseState;
  private lastUpdateTime: number = 0;
  private updateInterval: number = 16; // Update every 16ms (60fps) for smooth movement
  private isInitialized: boolean = false; // Add initialization flag

  constructor() {
    this.behaviorManager = new MonsterBehaviorManager();
    this.pauseState = this.createPauseState();
  }

  // ===== INITIALIZATION =====
  public initializeLevel(spawnPoints: MonsterSpawnPoint[]): void {
    // Warn if already initialized without cleanup
    if (this.isInitialized && this.scheduledSpawns.length > 0) {
      logger.warn(
        `SpawnManager.initializeLevel called while already initialized with ${this.scheduledSpawns.length} spawns. Cleaning up first.`
      );
      this.cleanup();
    }

    // Reset and initialize properly
    this.reset();
    this.levelStartTime = Date.now();
    this.scheduledSpawns = this.createScheduledSpawns(spawnPoints);
    this.resetPauseState();
    this.isInitialized = true; // Mark as initialized

    logger.level(`Level initialized with ${spawnPoints.length} spawn points`);

    // Debug: Log scheduled spawns
    this.scheduledSpawns.forEach((spawn, index) => {
      const delaySeconds = (spawn.scheduledTime - this.levelStartTime) / 1000;
      try {
        const monster = spawn.spawnPoint.createMonster();
        logger.debug(
          `Scheduled spawn ${index}: ${monster.type} at ${delaySeconds.toFixed(
            1
          )}s`
        );
      } catch (error) {
        logger.error(`Failed to create monster for spawn ${index}: ${error}`);
      }
    });
  }

  private createScheduledSpawns(
    spawnPoints: MonsterSpawnPoint[]
  ): ScheduledSpawn[] {
    return spawnPoints.map((spawnPoint, index) => ({
      id: `spawn-${index}`,
      spawnPoint,
      scheduledTime: this.levelStartTime + spawnPoint.spawnDelay,
      executed: false,
    }));
  }

  private resetPauseState(): void {
    this.pauseState = this.createPauseState();
  }

  private createPauseState(): PauseState {
    return {
      isPaused: false,
      pauseStartTime: 0,
      totalPausedTime: 0,
      pauseReasons: new Set(),
    };
  }

  // ===== UPDATE LOOP =====
  public update(currentTime: number, deltaTime?: number): void {
    // Don't update if not initialized
    if (!this.isInitialized) {
      return;
    }

    // Don't update if paused
    if (this.pauseState.isPaused) {
      return;
    }

    const { monsters, updateMonsters } = useMonsterStore.getState();
    const { player } = usePlayerStore.getState();
    const { platforms, ground } = useLevelStore.getState();
    const adjustedTime = this.getAdjustedTime();

    // Debug: Log that update is being called (every 5 seconds)
    if (
      Math.floor(adjustedTime / 5000) !== Math.floor((adjustedTime - 16) / 5000)
    ) {
      logger.debug(
        `SpawnManager.update() called at ${(adjustedTime / 1000).toFixed(
          1
        )}s, paused: ${this.pauseState.isPaused}, spawns: ${
          this.scheduledSpawns.length
        }`
      );
    }

    // Create a gameState object with ALL required properties for movement classes
    const gameState = {
      monsters,
      updateMonsters,
      player, // Needed by Chaser and Ambusher monsters
      platforms, // Needed by all monster types for collision detection
      ground, // Needed for ground collision detection
      currentState: "PLAYING", // Add this for movement classes to check pause state
    };

    // Process spawns every frame (no throttling for spawn timing)
    this.processSpawns(currentTime, gameState);

    // Update behaviors every frame for smooth movement (only if there are active monsters)
    if (monsters.some((m) => m.isActive)) {
      this.behaviorManager.updateMonsterBehaviors(
        currentTime,
        gameState,
        deltaTime
      );
    }
  }

  private processSpawns(currentTime: number, gameState: any): void {
    // Defensive check: Don't process spawns if level hasn't been initialized properly
    if (this.levelStartTime === 0) {
      logger.warn("processSpawns called with levelStartTime = 0, skipping");
      return;
    }

    const adjustedTime = this.getAdjustedTime();
    const adjustedAbsoluteTime = this.getAdjustedAbsoluteTime();
    const spawnsToExecute: ScheduledSpawn[] = [];

    // Debug: Log spawn processing (every 5 seconds)
    if (
      Math.floor(adjustedTime / 5000) !== Math.floor((adjustedTime - 16) / 5000)
    ) {
      const pendingSpawns = this.scheduledSpawns.filter((s) => !s.executed);
      logger.spawn(
        `Spawn check at ${(adjustedTime / 1000).toFixed(1)}s: ${
          pendingSpawns.length
        } pending spawns`
      );
      pendingSpawns.forEach((spawn) => {
        const timeUntilSpawn =
          (spawn.scheduledTime - adjustedAbsoluteTime) / 1000;
        try {
          const monster = spawn.spawnPoint.createMonster();
          logger.spawn(
            `  - ${monster.type} in ${timeUntilSpawn.toFixed(1)}s (scheduled: ${
              spawn.scheduledTime
            }, current: ${adjustedAbsoluteTime})`
          );
        } catch (error) {
          logger.error(`  - Failed to create monster: ${error}`);
        }
      });
    }

    // Find spawns that should execute now
    for (const spawn of this.scheduledSpawns) {
      if (!spawn.executed && adjustedAbsoluteTime >= spawn.scheduledTime) {
        spawnsToExecute.push(spawn);
        logger.spawn(
          `Spawn ready to execute: ${
            spawn.spawnPoint.createMonster().type
          } (scheduled at ${(spawn.scheduledTime / 1000).toFixed(
            1
          )}s, current time ${(adjustedTime / 1000).toFixed(1)}s)`
        );
      }
    }

    // Execute spawns in batch
    if (spawnsToExecute.length > 0) {
      logger.spawn(
        `Executing ${spawnsToExecute.length} spawns at ${(
          adjustedTime / 1000
        ).toFixed(1)}s`
      );
      this.executeSpawns(spawnsToExecute, currentTime, gameState);
    }
  }

  private executeSpawns(
    spawns: ScheduledSpawn[],
    currentTime: number,
    gameState: any
  ): void {
    const spawnedMonsters: Monster[] = [];

    for (const spawn of spawns) {
      try {
        const monster = this.createMonster(spawn.spawnPoint);
        spawnedMonsters.push(monster);
        spawn.executed = true;

        logger.monster(
          `Spawned ${monster.type} at (${monster.x}, ${monster.y})`
        );
      } catch (error) {
        logger.error(`Failed to spawn monster: ${error}`);
      }
    }

    // Batch update game state
    if (spawnedMonsters.length > 0) {
      this.addMonstersToGameState(spawnedMonsters, gameState);
      logger.debug(`Added ${spawnedMonsters.length} monsters to game state`);
    }
  }

  private createMonster(spawnPoint: MonsterSpawnPoint): Monster {
    const monster = spawnPoint.createMonster();

    if (spawnPoint.color) {
      monster.color = spawnPoint.color;
    }

    // Set original spawn point for respawn system
    if (!monster.originalSpawnPoint) {
      monster.originalSpawnPoint = { x: monster.x, y: monster.y };
    }

    return monster;
  }

  private addMonstersToGameState(monsters: Monster[], gameState: any): void {
    if (gameState.updateMonsters) {
      const currentMonsters = gameState.monsters || [];
      const updatedMonsters = [...currentMonsters, ...monsters];
      gameState.updateMonsters(updatedMonsters);
    } else {
      logger.warn("Game state updateMonsters method is not available");
    }
  }

  // ===== PAUSE MANAGEMENT =====
  public pause(reason: string = "default"): void {
    if (!this.pauseState.isPaused) {
      this.pauseState.isPaused = true;
      this.pauseState.pauseStartTime = Date.now();
    }
    this.pauseState.pauseReasons.add(reason);
    // Use throttled logging to prevent spam
    logger.throttled(
      LogCategory.GAME,
      `spawning_paused_${reason}`,
      `Spawning paused (${reason})`,
      5000
    );
    logger.debug(
      `SpawnManager pause state: ${
        this.pauseState.isPaused
      }, reasons: ${Array.from(this.pauseState.pauseReasons).join(", ")}`
    );
  }

  public resume(reason: string = "default"): void {
    this.pauseState.pauseReasons.delete(reason);

    if (this.pauseState.pauseReasons.size === 0 && this.pauseState.isPaused) {
      const pauseDuration = Date.now() - this.pauseState.pauseStartTime;
      this.pauseState.totalPausedTime += pauseDuration;
      this.pauseState.isPaused = false;
      // Use throttled logging to prevent spam
      logger.throttled(
        LogCategory.GAME,
        `spawning_resumed_${reason}`,
        `Spawning resumed (paused for ${(pauseDuration / 1000).toFixed(1)}s)`,
        5000
      );
    }
    logger.debug(
      `SpawnManager pause state: ${
        this.pauseState.isPaused
      }, reasons: ${Array.from(this.pauseState.pauseReasons).join(", ")}`
    );
  }

  public isPaused(): boolean {
    return this.pauseState.isPaused;
  }

  public getPauseStatus(): any {
    return {
      isPaused: this.pauseState.isPaused,
      pauseReasons: Array.from(this.pauseState.pauseReasons),
      totalPausedTime: this.pauseState.totalPausedTime,
    };
  }

  private getAdjustedTime(): number {
    const currentTime = Date.now();
    const actualElapsed = currentTime - this.levelStartTime;
    return actualElapsed - this.pauseState.totalPausedTime;
  }

  private getAdjustedAbsoluteTime(): number {
    return this.levelStartTime + this.getAdjustedTime();
  }

  // ===== MONSTER MANAGEMENT =====
  public removeMonster(monster: Monster): void {
    monster.isActive = false;

    const { updateMonsters, monsters } = useMonsterStore.getState();
    if (updateMonsters) {
      const currentMonsters = monsters || [];
      const updatedMonsters = currentMonsters.filter((m) => m !== monster);
      updateMonsters(updatedMonsters);
    }
  }

  // ===== UTILITY METHODS =====
  public reset(): void {
    this.levelStartTime = Date.now();
    this.scheduledSpawns.forEach((spawn) => (spawn.executed = false));
    this.resetPauseState();
    this.lastUpdateTime = 0;
    this.isInitialized = false; // Reset initialization flag
  }

  public getSpawnStatus(): any {
    const executedCount = this.scheduledSpawns.filter((s) => s.executed).length;
    const pendingCount = this.scheduledSpawns.filter((s) => !s.executed).length;
    const adjustedTime = this.getAdjustedTime();

    return {
      totalSpawnPoints: this.scheduledSpawns.length,
      executedCount,
      pendingCount,
      isPaused: this.pauseState.isPaused,
      pauseReasons: Array.from(this.pauseState.pauseReasons),
      adjustedTime: adjustedTime / 1000,
      levelStartTime: this.levelStartTime,
      totalPausedTime: this.pauseState.totalPausedTime,
    };
  }

  public getSpawnTimeRemaining(spawn: ScheduledSpawn): number {
    if (spawn.executed) {
      return 0;
    }
    const adjustedAbsoluteTime = this.getAdjustedAbsoluteTime();
    return Math.max(0, spawn.scheduledTime - adjustedAbsoluteTime);
  }

  public getPendingSpawns(): ScheduledSpawn[] {
    return this.scheduledSpawns.filter((s) => !s.executed);
  }

  public setUpdateInterval(intervalMs: number): void {
    this.updateInterval = intervalMs;
    logger.debug(
      `OptimizedSpawnManager: Update interval set to ${intervalMs}ms`
    );
  }

  public cleanup(): void {
    this.scheduledSpawns = [];
    this.resetPauseState();
    this.lastUpdateTime = 0;
    this.isInitialized = false; // Reset initialization flag
  }
}
