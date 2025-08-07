import { Monster, MonsterSpawnPoint } from "../types/interfaces";
import { logger } from "../lib/logger";
import { useGameStore } from "../stores/gameStore";
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

  constructor() {
    this.behaviorManager = new MonsterBehaviorManager();
    this.pauseState = this.createPauseState();
  }

  // ===== INITIALIZATION =====
  public initializeLevel(spawnPoints: MonsterSpawnPoint[]): void {
    this.levelStartTime = Date.now();
    this.scheduledSpawns = this.createScheduledSpawns(spawnPoints);
    this.resetPauseState();
    
    logger.flow(`Level initialized with ${spawnPoints.length} spawn points`);
  }

  private createScheduledSpawns(spawnPoints: MonsterSpawnPoint[]): ScheduledSpawn[] {
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
    // Don't update if paused
    if (this.pauseState.isPaused) {
      return;
    }

    const gameState = useGameStore.getState();
    
    // Process spawns (throttled for performance)
    if (currentTime - this.lastUpdateTime >= this.updateInterval) {
      this.processSpawns(currentTime, gameState);
      this.lastUpdateTime = currentTime;
    }
    
    // Update behaviors every frame for smooth movement (only if there are active monsters)
    if (gameState.monsters.some(m => m.isActive)) {
      this.behaviorManager.updateMonsterBehaviors(currentTime, gameState, deltaTime);
    }
  }

  private processSpawns(currentTime: number, gameState: any): void {
    const adjustedTime = this.getAdjustedTime();
    const spawnsToExecute: ScheduledSpawn[] = [];

    // Find spawns that should execute now
    for (const spawn of this.scheduledSpawns) {
      if (!spawn.executed && adjustedTime >= spawn.scheduledTime) {
        spawnsToExecute.push(spawn);
      }
    }

    // Execute spawns in batch
    if (spawnsToExecute.length > 0) {
      this.executeSpawns(spawnsToExecute, currentTime, gameState);
    }
  }

  private executeSpawns(spawns: ScheduledSpawn[], currentTime: number, gameState: any): void {
    const spawnedMonsters: Monster[] = [];

    for (const spawn of spawns) {
      try {
        const monster = this.createMonster(spawn.spawnPoint);
        spawnedMonsters.push(monster);
        spawn.executed = true;
        
        logger.monster(`Spawned ${monster.type}`);
      } catch (error) {
        logger.error(`Failed to spawn monster: ${error}`);
      }
    }

    // Batch update game state
    if (spawnedMonsters.length > 0) {
      this.addMonstersToGameState(spawnedMonsters, gameState);
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
    logger.pause(`Spawning paused (${reason})`);
  }

  public resume(reason: string = "default"): void {
    this.pauseState.pauseReasons.delete(reason);
    
    if (this.pauseState.pauseReasons.size === 0 && this.pauseState.isPaused) {
      const pauseDuration = Date.now() - this.pauseState.pauseStartTime;
      this.pauseState.totalPausedTime += pauseDuration;
      this.pauseState.isPaused = false;
      logger.pause(`Spawning resumed (paused for ${(pauseDuration / 1000).toFixed(1)}s)`);
    }
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

  // ===== MONSTER MANAGEMENT =====
  public removeMonster(monster: Monster): void {
    monster.isActive = false;

    const gameState = useGameStore.getState();
    if (gameState.updateMonsters) {
      const currentMonsters = gameState.monsters || [];
      const updatedMonsters = currentMonsters.filter((m) => m !== monster);
      gameState.updateMonsters(updatedMonsters);
    }
  }

  // ===== UTILITY METHODS =====
  public reset(): void {
    this.levelStartTime = Date.now();
    this.scheduledSpawns.forEach(spawn => spawn.executed = false);
    this.resetPauseState();
    this.lastUpdateTime = 0;
  }

  public getSpawnStatus(): any {
    const executedCount = this.scheduledSpawns.filter(s => s.executed).length;
    const pendingCount = this.scheduledSpawns.filter(s => !s.executed).length;
    
    return {
      totalSpawnPoints: this.scheduledSpawns.length,
      executedCount,
      pendingCount,
      isPaused: this.pauseState.isPaused,
      pauseReasons: Array.from(this.pauseState.pauseReasons),
    };
  }

  public setUpdateInterval(intervalMs: number): void {
    this.updateInterval = intervalMs;
    logger.debug(`OptimizedSpawnManager: Update interval set to ${intervalMs}ms`);
  }

  public cleanup(): void {
    this.scheduledSpawns = [];
    this.resetPauseState();
    this.lastUpdateTime = 0;
  }
} 