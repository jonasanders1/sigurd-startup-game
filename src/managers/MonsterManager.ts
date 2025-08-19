import { Monster, MonsterSpawnPoint } from "../types/interfaces";
import { logger } from "../lib/logger";
import { useGameStore } from "../stores/gameStore";
import { MonsterBehaviorManager } from "./MonsterBehaviorManager";
import { ScalingManager } from "./ScalingManager";
import { MonsterFactory } from "./MonsterFactory";
import { MonsterType } from "../types/enums";

// Internal manager interfaces
interface MonsterSpawnManager {
  initializeLevel(spawnPoints: MonsterSpawnPoint[]): void;
  update(currentTime: number, gameState: any, deltaTime?: number): void;
  pause(reason?: string): void;
  resume(reason?: string): void;
  cleanup(): void;
  getPendingSpawns(): number;
}

interface MonsterRespawnManager {
  addDeadMonster(monster: Monster): void;
  update(currentTime: number, monsters: Monster[]): Monster[];
  pause(reason?: string): void;
  resume(reason?: string): void;
  cleanup(): void;
  updateRespawnConfig(config: Partial<RespawnConfig>): void;
}

interface MonsterScalingManager {
  getScaledValues(timeAlive: number, levelNumber: number): any;
  resetOnDeath(): void;
  pause(reason?: string): void;
  resume(reason?: string): void;
  cleanup(): void;
}

// Types from original managers
interface ScheduledSpawn {
  id: string;
  spawnPoint: MonsterSpawnPoint;
  scheduledTime: number;
  executed: boolean;
}

interface DeadMonster {
  monster: Monster;
  respawnTime: number;
}

interface RespawnConfig {
  ambusher: number;
  chaser: number;
  floater: number;
  patrol: number;
}

interface PauseState {
  isPaused: boolean;
  pauseStartTime: number;
  totalPausedTime: number;
  pauseReasons: Set<string>;
}

/**
 * Unified MonsterManager that consolidates all monster-related functionality
 * Combines spawn management, respawn management, behavior management, and scaling
 */
export class MonsterManager {
  // Internal managers
  private spawnManager: InternalSpawnManager;
  private respawnManager: InternalRespawnManager;
  private behaviorManager: MonsterBehaviorManager;
  private scalingManager: InternalScalingManager;
  
  // Shared pause state
  private pauseState: PauseState;

  constructor() {
    this.pauseState = this.createPauseState();
    
    // Initialize internal managers
    this.spawnManager = new InternalSpawnManager(this.pauseState);
    this.respawnManager = new InternalRespawnManager(this.pauseState);
    this.behaviorManager = new MonsterBehaviorManager();
    this.scalingManager = new InternalScalingManager(this.pauseState);
    
    logger.debug("MonsterManager: Initialized with consolidated managers");
  }

  // ===== PUBLIC API =====
  
  /**
   * Initialize monsters for a new level
   */
  public initializeLevel(spawnPoints: MonsterSpawnPoint[], levelNumber: number): void {
    this.spawnManager.initializeLevel(spawnPoints);
    this.scalingManager.setLevel(levelNumber);
    this.respawnManager.cleanup();
    logger.flow(`MonsterManager: Level ${levelNumber} initialized with ${spawnPoints.length} spawn points`);
  }

  /**
   * Main update method - handles all monster updates
   */
  public update(currentTime: number, gameState: any, deltaTime?: number): void {
    if (this.pauseState.isPaused) return;

    // Update spawn manager (creates new monsters)
    this.spawnManager.update(currentTime, gameState, deltaTime);
    
    // Update respawn manager (respawns dead monsters)
    const respawnedMonsters = this.respawnManager.update(currentTime, gameState.monsters || []);
    if (respawnedMonsters.length > 0) {
      const currentMonsters = gameState.monsters || [];
      gameState.updateMonsters([...currentMonsters, ...respawnedMonsters]);
    }
    
    // Update monster behaviors (movement, AI)
    this.behaviorManager.updateMonsterBehaviors(currentTime, gameState, deltaTime);
    
    // Apply scaling to active monsters
    this.applyScaling(gameState.monsters, currentTime);
  }

  /**
   * Add a dead monster for respawning
   */
  public addDeadMonster(monster: Monster): void {
    this.respawnManager.addDeadMonster(monster);
  }

  /**
   * Pause all monster activities
   */
  public pause(reason: string = "default"): void {
    if (!this.pauseState.isPaused) {
      this.pauseState.isPaused = true;
      this.pauseState.pauseStartTime = Date.now();
    }
    this.pauseState.pauseReasons.add(reason);
    logger.pause(`MonsterManager: Paused (${reason})`);
  }

  /**
   * Resume monster activities
   */
  public resume(reason: string = "default"): void {
    this.pauseState.pauseReasons.delete(reason);
    
    if (this.pauseState.pauseReasons.size === 0 && this.pauseState.isPaused) {
      const pauseDuration = Date.now() - this.pauseState.pauseStartTime;
      this.pauseState.totalPausedTime += pauseDuration;
      this.pauseState.isPaused = false;
      logger.pause(`MonsterManager: Resumed (paused for ${(pauseDuration / 1000).toFixed(1)}s)`);
    }
  }

  /**
   * Reset scaling on player death
   */
  public resetOnDeath(): void {
    this.scalingManager.resetOnDeath();
    logger.debug("MonsterManager: Reset difficulty to base values after player death");
  }

  /**
   * Get number of pending spawns
   */
  public getPendingSpawns(): number {
    return this.spawnManager.getPendingSpawns();
  }

  /**
   * Update respawn configuration
   */
  public updateRespawnConfig(config: Partial<RespawnConfig>): void {
    this.respawnManager.updateRespawnConfig(config);
  }

  /**
   * Cleanup all resources
   */
  public cleanup(): void {
    this.spawnManager.cleanup();
    this.respawnManager.cleanup();
    this.scalingManager.cleanup();
    this.pauseState = this.createPauseState();
    logger.debug("MonsterManager: Cleaned up all resources");
  }

  // ===== PRIVATE METHODS =====

  private createPauseState(): PauseState {
    return {
      isPaused: false,
      pauseStartTime: 0,
      totalPausedTime: 0,
      pauseReasons: new Set(),
    };
  }

  private applyScaling(monsters: Monster[], currentTime: number): void {
    if (!monsters) return;
    
    const gameState = useGameStore.getState();
    const levelNumber = gameState.currentLevel;
    
    monsters.forEach((monster) => {
      if (!monster.isActive) return;
      
      const timeAlive = (currentTime - (monster.spawnTime || currentTime)) / 1000;
      const scaledValues = this.scalingManager.getScaledValues(
        timeAlive,
        levelNumber,
        monster.type
      );
      
      // Apply scaled values to monster
      if (scaledValues) {
        Object.assign(monster, scaledValues);
      }
    });
  }
}

/**
 * Internal Spawn Manager - handles scheduled monster spawning
 */
class InternalSpawnManager implements MonsterSpawnManager {
  private levelStartTime: number = 0;
  private scheduledSpawns: ScheduledSpawn[] = [];
  private pauseState: PauseState;
  private lastUpdateTime: number = 0;
  private updateInterval: number = 16; // 60fps

  constructor(pauseState: PauseState) {
    this.pauseState = pauseState;
  }

  public initializeLevel(spawnPoints: MonsterSpawnPoint[]): void {
    this.levelStartTime = Date.now();
    this.scheduledSpawns = this.createScheduledSpawns(spawnPoints);
    
    logger.flow(`InternalSpawnManager: Initialized with ${spawnPoints.length} spawn points`);
  }

  public update(currentTime: number, gameState: any, deltaTime?: number): void {
    if (this.pauseState.isPaused) return;
    
    // Throttle updates
    if (currentTime - this.lastUpdateTime < this.updateInterval) return;
    this.lastUpdateTime = currentTime;

    const adjustedTime = this.getAdjustedTime(currentTime);
    const spawnsToExecute = this.scheduledSpawns.filter(
      (spawn) => !spawn.executed && spawn.scheduledTime <= adjustedTime
    );

    if (spawnsToExecute.length > 0) {
      const newMonsters: Monster[] = [];
      
      spawnsToExecute.forEach((spawn) => {
        try {
          const monster = spawn.spawnPoint.createMonster();
          monster.spawnTime = currentTime;
          newMonsters.push(monster);
          spawn.executed = true;
        } catch (error) {
          logger.error(`Failed to spawn monster: ${error}`);
        }
      });

      if (newMonsters.length > 0) {
        const currentMonsters = gameState.monsters || [];
        gameState.updateMonsters([...currentMonsters, ...newMonsters]);
      }
    }
  }

  public pause(reason?: string): void {
    // Handled by shared pause state
  }

  public resume(reason?: string): void {
    // Handled by shared pause state
  }

  public cleanup(): void {
    this.scheduledSpawns = [];
    this.levelStartTime = 0;
    this.lastUpdateTime = 0;
  }

  public getPendingSpawns(): number {
    return this.scheduledSpawns.filter((spawn) => !spawn.executed).length;
  }

  private createScheduledSpawns(spawnPoints: MonsterSpawnPoint[]): ScheduledSpawn[] {
    return spawnPoints.map((point, index) => ({
      id: `spawn-${index}-${Date.now()}`,
      spawnPoint: point,
      scheduledTime: this.levelStartTime + (point.spawnDelay || 0),
      executed: false,
    }));
  }

  private getAdjustedTime(currentTime: number): number {
    const elapsed = currentTime - this.levelStartTime;
    return this.levelStartTime + elapsed - this.pauseState.totalPausedTime;
  }
}

/**
 * Internal Respawn Manager - handles monster respawning after death
 */
class InternalRespawnManager implements MonsterRespawnManager {
  private deadMonsters: DeadMonster[] = [];
  private respawnConfig: RespawnConfig;
  private pauseState: PauseState;
  private lastUpdateTime: number = 0;
  private updateInterval: number = 500; // Update every 500ms

  constructor(pauseState: PauseState) {
    this.pauseState = pauseState;
    this.respawnConfig = this.getDefaultRespawnConfig();
  }

  public addDeadMonster(monster: Monster): void {
    const respawnDelay = this.getRespawnDelay(monster.type);
    this.deadMonsters.push({
      monster: { ...monster }, // Clone to preserve state
      respawnTime: Date.now() + respawnDelay,
    });
    logger.debug(`InternalRespawnManager: Added ${monster.type} for respawn in ${respawnDelay}ms`);
  }

  public update(currentTime: number, monsters: Monster[]): Monster[] {
    if (this.pauseState.isPaused) return [];
    
    // Throttle updates
    if (currentTime - this.lastUpdateTime < this.updateInterval) return [];
    this.lastUpdateTime = currentTime;

    const monstersToRespawn = this.deadMonsters.filter(
      (dead) => dead.respawnTime <= currentTime
    );

    if (monstersToRespawn.length === 0) return [];

    const respawnedMonsters: Monster[] = [];
    
    monstersToRespawn.forEach((dead) => {
      const respawned = this.respawnMonster(dead.monster);
      if (respawned) {
        respawnedMonsters.push(respawned);
      }
    });

    // Remove respawned monsters from dead list
    this.deadMonsters = this.deadMonsters.filter(
      (dead) => !monstersToRespawn.includes(dead)
    );

    return respawnedMonsters;
  }

  public pause(reason?: string): void {
    // Handled by shared pause state
  }

  public resume(reason?: string): void {
    // Handled by shared pause state
  }

  public cleanup(): void {
    this.deadMonsters = [];
    this.lastUpdateTime = 0;
  }

  public updateRespawnConfig(config: Partial<RespawnConfig>): void {
    this.respawnConfig = { ...this.respawnConfig, ...config };
    logger.debug("InternalRespawnManager: Configuration updated");
  }

  private getDefaultRespawnConfig(): RespawnConfig {
    return {
      ambusher: 10000, // 10 seconds
      chaser: 7000, // 7 seconds
      floater: 15000, // 15 seconds
      patrol: 8000, // 8 seconds
    };
  }

  private getRespawnDelay(monsterType: MonsterType): number {
    switch (monsterType) {
      case MonsterType.AMBUSHER:
        return this.respawnConfig.ambusher;
      case MonsterType.CHASER:
        return this.respawnConfig.chaser;
      case MonsterType.FLOATER:
        return this.respawnConfig.floater;
      case MonsterType.HORIZONTAL_PATROL:
      case MonsterType.VERTICAL_PATROL:
        return this.respawnConfig.patrol;
      default:
        return 8000; // Default 8 seconds
    }
  }

  private respawnMonster(monster: Monster): Monster | null {
    // Reset monster to original spawn position
    const respawned: Monster = {
      ...monster,
      isActive: true,
      isDead: false,
      spawnTime: Date.now(),
      // Reset position to original spawn point
      x: monster.originalX || monster.x,
      y: monster.originalY || monster.y,
    };

    return respawned;
  }
}

/**
 * Internal Scaling Manager - handles difficulty scaling for monsters
 */
class InternalScalingManager implements MonsterScalingManager {
  private pauseState: PauseState;
  private currentLevel: number = 1;
  private baseValues: Map<MonsterType, any> = new Map();

  constructor(pauseState: PauseState) {
    this.pauseState = pauseState;
    this.initializeBaseValues();
  }

  public setLevel(level: number): void {
    this.currentLevel = level;
  }

  public getScaledValues(timeAlive: number, levelNumber: number, monsterType: MonsterType): any {
    const baseValues = this.baseValues.get(monsterType);
    if (!baseValues) return null;

    // Simple scaling formula: increases with time and level
    const timeFactor = 1 + (timeAlive / 60); // Increases every minute
    const levelFactor = 1 + ((levelNumber - 1) * 0.2); // 20% increase per level

    return {
      speed: Math.min(baseValues.speed * timeFactor * levelFactor, baseValues.maxSpeed),
      ...this.getTypeSpecificScaling(monsterType, timeFactor, levelFactor),
    };
  }

  public resetOnDeath(): void {
    // Reset any death-specific scaling modifiers
    logger.debug("InternalScalingManager: Reset difficulty modifiers");
  }

  public pause(reason?: string): void {
    // Handled by shared pause state
  }

  public resume(reason?: string): void {
    // Handled by shared pause state
  }

  public cleanup(): void {
    this.currentLevel = 1;
  }

  private initializeBaseValues(): void {
    this.baseValues.set(MonsterType.HORIZONTAL_PATROL, {
      speed: 1,
      maxSpeed: 3,
    });
    this.baseValues.set(MonsterType.VERTICAL_PATROL, {
      speed: 1,
      maxSpeed: 3,
    });
    this.baseValues.set(MonsterType.CHASER, {
      speed: 1.5,
      maxSpeed: 4,
      directness: 0.3,
      maxDirectness: 0.8,
    });
    this.baseValues.set(MonsterType.AMBUSHER, {
      speed: 2,
      maxSpeed: 5,
      ambushInterval: 5000,
      minAmbushInterval: 1000,
    });
    this.baseValues.set(MonsterType.FLOATER, {
      speed: 2,
      maxSpeed: 4,
      bounceAngle: 0.2,
      maxBounceAngle: 0.5,
    });
  }

  private getTypeSpecificScaling(
    monsterType: MonsterType,
    timeFactor: number,
    levelFactor: number
  ): any {
    const baseValues = this.baseValues.get(monsterType);
    if (!baseValues) return {};

    switch (monsterType) {
      case MonsterType.CHASER:
        return {
          directness: Math.min(
            baseValues.directness * timeFactor,
            baseValues.maxDirectness
          ),
        };
      case MonsterType.AMBUSHER:
        return {
          ambushInterval: Math.max(
            baseValues.ambushInterval / timeFactor,
            baseValues.minAmbushInterval
          ),
        };
      case MonsterType.FLOATER:
        return {
          bounceAngle: Math.min(
            baseValues.bounceAngle * timeFactor,
            baseValues.maxBounceAngle
          ),
        };
      default:
        return {};
    }
  }
}