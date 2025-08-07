import { Monster } from "../types/interfaces";
import { logger } from "../lib/logger";
import { ScalingManager } from "./ScalingManager";

export interface RespawnConfig {
  ambusher: number;
  chaser: number;
  floater: number;
  patrol: number;
}

interface DeadMonster {
  monster: Monster;
  respawnTime: number;
}

export class OptimizedRespawnManager {
  private static instance: OptimizedRespawnManager;
  private deadMonsters: DeadMonster[] = [];
  private respawnConfig: RespawnConfig;
  private scalingManager: ScalingManager;
  private lastUpdateTime: number = 0;
  private updateInterval: number = 500; // Update every 500ms instead of every frame
  private paused: boolean = false;

  private constructor() {
    this.respawnConfig = this.getDefaultRespawnConfig();
    this.scalingManager = ScalingManager.getInstance();
    logger.debug("Respawn manager initialized");
  }

  public static getInstance(): OptimizedRespawnManager {
    if (!OptimizedRespawnManager.instance) {
      OptimizedRespawnManager.instance = new OptimizedRespawnManager();
    }
    return OptimizedRespawnManager.instance;
  }

  // ===== CONFIGURATION =====
  private getDefaultRespawnConfig(): RespawnConfig {
    return {
      ambusher: 10000, // 10 seconds
      chaser: 7000, // 7 seconds
      floater: 15000, // 15 seconds
      patrol: 8000, // 8 seconds
    };
  }

  public updateRespawnConfig(newConfig: Partial<RespawnConfig>): void {
    this.respawnConfig = { ...this.respawnConfig, ...newConfig };
    logger.debug(
      "OptimizedRespawnManager: Updated respawn configuration",
      this.respawnConfig
    );
  }

  public getRespawnConfig(): RespawnConfig {
    return { ...this.respawnConfig };
  }

  // ===== MONSTER MANAGEMENT =====
  public killMonster(monster: Monster): void {
    if (monster.isDead) {
      logger.debug(`Monster already dead, skipping kill: ${monster.type}`);
      return;
    }

    // Store original spawn position if not already set
    if (!monster.originalSpawnPoint) {
      monster.originalSpawnPoint = { x: monster.x, y: monster.y };
    }

    // Mark monster as dead
    monster.isDead = true;
    monster.isActive = false;
    monster.deathTime = Date.now();
    monster.respawnTime =
      monster.deathTime + this.getRespawnDelay(monster.type);

    // Add to dead monsters list (sorted by respawn time for efficient processing)
    const deadMonster: DeadMonster = {
      monster,
      respawnTime: monster.respawnTime,
    };
    this.insertSorted(deadMonster);

    logger.monster(
      `${monster.type} killed - respawning in ${
        this.getRespawnDelay(monster.type) / 1000
      }s`
    );
  }

  private insertSorted(deadMonster: DeadMonster): void {
    // Binary search to find insertion point for optimal performance
    let left = 0;
    let right = this.deadMonsters.length;

    while (left < right) {
      const mid = Math.floor((left + right) / 2);
      if (this.deadMonsters[mid].respawnTime <= deadMonster.respawnTime) {
        left = mid + 1;
      } else {
        right = mid;
      }
    }

    this.deadMonsters.splice(left, 0, deadMonster);
  }

  // ===== UPDATE LOOP =====
  public update(): Monster[] {
    const currentTime = Date.now();

    // Throttle updates for better performance
    if (currentTime - this.lastUpdateTime < this.updateInterval) {
      return [];
    }
    this.lastUpdateTime = currentTime;

    // Don't update if paused
    if (this.paused) {
      return [];
    }

    const monstersToRespawn: Monster[] = [];

    // Process respawns (since array is sorted, we can process from the beginning)
    while (
      this.deadMonsters.length > 0 &&
      this.deadMonsters[0].respawnTime <= currentTime
    ) {
      const deadMonster = this.deadMonsters.shift()!;
      const respawnedMonster = this.respawnMonster(deadMonster.monster);
      monstersToRespawn.push(respawnedMonster);
    }

    if (monstersToRespawn.length > 0) {
      logger.monster(
        `Respawning ${monstersToRespawn.length} monsters: ${monstersToRespawn
          .map((m) => m.type)
          .join(", ")}`
      );
    }

    return monstersToRespawn;
  }

  // ===== PAUSE MANAGEMENT =====
  public pause(): void {
    this.paused = true;
    logger.pause("Respawn system paused");
  }

  public resume(): void {
    this.paused = false;
    logger.pause("Respawn system resumed");
  }

  public isPaused(): boolean {
    return this.paused;
  }

  private respawnMonster(monster: Monster): Monster {
    const spawnPoint = monster.originalSpawnPoint!;

    // Reset monster state
    this.resetMonsterState(monster, spawnPoint);

    // Reset individual scaling for this monster
    this.scalingManager.resetMonsterScaling(monster);

    logger.monster(`${monster.type} respawned`);

    return monster;
  }

  private resetMonsterState(
    monster: Monster,
    spawnPoint: { x: number; y: number }
  ): void {
    // Reset basic state
    monster.isDead = false;
    monster.isActive = true;
    monster.x = spawnPoint.x;
    monster.y = spawnPoint.y;
    monster.isFrozen = false;
    monster.isBlinking = false;

    // Reset movement properties
    monster.velocityX = 0;
    monster.velocityY = 0;
    monster.isGrounded = false;
    monster.isFalling = false;
    monster.currentPlatform = null;

    // Reset behavior state
    monster.behaviorState = undefined;
    monster.lastDirectionChange = undefined;

    // Clear respawn properties
    monster.deathTime = undefined;
    monster.respawnTime = undefined;
  }

  private getRespawnDelay(monsterType: string): number {
    switch (monsterType) {
      case "AMBUSHER":
        return this.respawnConfig.ambusher;
      case "CHASER":
        return this.respawnConfig.chaser;
      case "FLOATER":
        return this.respawnConfig.floater;
      case "HORIZONTAL_PATROL":
      case "VERTICAL_PATROL":
        return this.respawnConfig.patrol;
      default:
        logger.warn(
          `Unknown monster type for respawn delay: ${monsterType}, using default`
        );
        return this.respawnConfig.patrol;
    }
  }

  // ===== UTILITY METHODS =====
  public getDeadMonsterCount(): number {
    return this.deadMonsters.length;
  }

  public getDeadMonsters(): Monster[] {
    return this.deadMonsters.map((dm) => dm.monster);
  }

  public getRespawnTimeRemaining(monster: Monster): number {
    if (!monster.isDead || !monster.respawnTime) {
      return 0;
    }
    return Math.max(0, monster.respawnTime - Date.now());
  }

  public getNextRespawnTime(): number | null {
    return this.deadMonsters.length > 0
      ? this.deadMonsters[0].respawnTime
      : null;
  }

  public reset(): void {
    this.deadMonsters = [];
    this.lastUpdateTime = 0;
    logger.debug("OptimizedRespawnManager: Reset - cleared all dead monsters");
  }

  public setUpdateInterval(intervalMs: number): void {
    this.updateInterval = intervalMs;
    logger.debug(
      `OptimizedRespawnManager: Update interval set to ${intervalMs}ms`
    );
  }

  public cleanup(): void {
    this.deadMonsters = [];
    this.lastUpdateTime = 0;
  }
}
