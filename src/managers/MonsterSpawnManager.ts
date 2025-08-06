import { Monster, MonsterSpawnPoint } from "../types/interfaces";
import { MonsterType } from "../types/enums";
import { GAME_CONFIG, COLORS } from "../types/constants";
import { logger } from "../lib/logger";
import { useGameStore } from "../stores/gameStore";
import { MonsterBehaviorManager } from "./MonsterBehaviorManager";
// MonsterFactory functions are now used directly in spawn points

export class MonsterSpawnManager {
  private levelStartTime: number = 0;
  private spawnPoints: MonsterSpawnPoint[] = [];
  private spawnedMonsters: Set<string> = new Set(); // Track which spawn points have been used
  private behaviorManager: MonsterBehaviorManager;
  private pendingSpawns: Map<string, number> = new Map(); // Track pending spawns with their scheduled times
  
  // Pause functionality
  private isPaused: boolean = false;
  private pauseStartTime: number = 0;
  private totalPausedTime: number = 0;

  constructor(spawnPoints: MonsterSpawnPoint[] = []) {
    this.spawnPoints = spawnPoints;
    this.levelStartTime = Date.now();
    this.behaviorManager = new MonsterBehaviorManager();
  }

  public initializeLevel(spawnPoints: MonsterSpawnPoint[]): void {
    this.spawnPoints = spawnPoints;
    this.levelStartTime = Date.now();
    this.spawnedMonsters.clear();
    this.pendingSpawns.clear();
    this.isPaused = false;
    this.pauseStartTime = 0;
    this.totalPausedTime = 0;

    // Schedule all spawn points based on their spawnDelay
    this.scheduleSpawns();

    logger.info(
      `Initialized monster spawn manager with ${spawnPoints.length} spawn points`
    );
  }

  private scheduleSpawns(): void {
    this.spawnPoints.forEach((spawnPoint, index) => {
      const spawnKey = `spawn-${index}`;
      const scheduledTime = this.levelStartTime + spawnPoint.spawnDelay;
      
      this.pendingSpawns.set(spawnKey, scheduledTime);
      
      logger.debug(
        `Scheduled monster spawn at ${scheduledTime} (${spawnPoint.spawnDelay}ms delay)`
      );
    });
  }

  public update(currentTime: number): void {
    const gameState = useGameStore.getState();
    const currentMonsterCount = gameState.monsters.filter(
      (m) => m.isActive
    ).length;

    // Debug logging (reduced frequency)
    if (this.pendingSpawns.size > 0 && currentTime % 10000 < 16) { // Every ~10 seconds
      console.log(`[MonsterSpawnManager] Pending spawns: ${this.pendingSpawns.size}`);
    }

    // Check for monsters that should spawn now
    this.checkScheduledSpawns(currentTime, gameState);

    // Update monster behaviors
    this.behaviorManager.updateMonsterBehaviors(currentTime, gameState);
  }

  public pause(): void {
    if (!this.isPaused) {
      this.isPaused = true;
      this.pauseStartTime = Date.now();
      logger.debug("MonsterSpawnManager: Paused monster spawning");
    }
  }

  public resume(): void {
    if (this.isPaused) {
      this.isPaused = false;
      const pauseDuration = Date.now() - this.pauseStartTime;
      this.totalPausedTime += pauseDuration;
      logger.debug(`MonsterSpawnManager: Resumed monster spawning (paused for ${(pauseDuration / 1000).toFixed(1)}s)`);
    }
  }

  public isCurrentlyPaused(): boolean {
    return this.isPaused;
  }

  private getAdjustedTime(): number {
    const currentTime = Date.now();
    const actualElapsed = currentTime - this.levelStartTime;
    const adjustedElapsed = actualElapsed - this.totalPausedTime;
    return this.levelStartTime + adjustedElapsed;
  }

  private checkScheduledSpawns(currentTime: number, gameState: any): void {
    const spawnsToExecute: string[] = [];

    // Use adjusted time that accounts for pauses
    const adjustedTime = this.getAdjustedTime();

    // Find all spawns that should happen now
    this.pendingSpawns.forEach((scheduledTime, spawnKey) => {
      if (adjustedTime >= scheduledTime) {
        spawnsToExecute.push(spawnKey);
      }
    });

    // Execute all pending spawns
    spawnsToExecute.forEach(spawnKey => {
      // console.log(`[MonsterSpawnManager] Executing spawn: ${spawnKey}`);
      this.executeSpawn(spawnKey, currentTime, gameState);
      this.pendingSpawns.delete(spawnKey);
    });
  }

  private executeSpawn(spawnKey: string, currentTime: number, gameState: any): void {
    // Find the spawn point by parsing the key
    const keyParts = spawnKey.split('-');
    const index = parseInt(keyParts[1]);

    const spawnPoint = this.spawnPoints[index];
    if (!spawnPoint) {
      logger.warn(`Spawn point not found for key: ${spawnKey}`);
      return;
    }

    // Create monster using the provided function
    let monster: Monster;
    
    try {
      monster = spawnPoint.createMonster();

      // Add custom color override if specified
      if (spawnPoint.color) {
        monster.color = spawnPoint.color;
      }

      // Add to game state
      this.addMonsterToGameState(monster, gameState);
      
      // Mark as spawned
      this.spawnedMonsters.add(spawnKey);
      
      logger.info(
        `Spawned monster: ${monster.type} at (${monster.x}, ${monster.y})`
      );

    } catch (error) {
      logger.error(`Failed to spawn monster: ${error}`);
    }
  }

  private addMonsterToGameState(monster: Monster, gameState: any): void {
    if (gameState.updateMonsters) {
      const currentMonsters = gameState.monsters || [];
      const updatedMonsters = [...currentMonsters, monster];
      gameState.updateMonsters(updatedMonsters);
    } else {
      logger.warn("Game state updateMonsters method is not available");
    }
  }

  public removeMonster(monster: Monster): void {
    monster.isActive = false;

    const gameState = useGameStore.getState();
    if (gameState.updateMonsters) {
      const currentMonsters = gameState.monsters || [];
      const updatedMonsters = currentMonsters.filter((m) => m !== monster);
      gameState.updateMonsters(updatedMonsters);

      logger.debug(
        `Removed monster from game state. Total monsters: ${updatedMonsters.length}`
      );
    }
  }

  public reset(): void {
    this.levelStartTime = Date.now();
    this.spawnedMonsters.clear();
    this.pendingSpawns.clear();
    this.scheduleSpawns();
  }

  // Debug method to get spawn status
  public getSpawnStatus(): any {
    return {
      totalSpawnPoints: this.spawnPoints.length,
      spawnedCount: this.spawnedMonsters.size,
      pendingSpawns: this.pendingSpawns.size,
      pendingSpawnsList: Array.from(this.pendingSpawns.entries()).map(([key, time]) => ({
        key,
        scheduledTime: time,
        timeUntilSpawn: time - Date.now()
      }))
    };
  }

  // Debug method to expose spawn status to global scope for console access
  public debugSpawnStatus(): void {
    const status = this.getSpawnStatus();
    console.log('[MonsterSpawnManager] Debug Status:', status);
    
    // Also expose to global scope for easy console access
    (window as any).monsterSpawnStatus = status;
    (window as any).monsterSpawnManager = this;
  }
}
