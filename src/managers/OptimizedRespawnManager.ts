import { Monster } from "../types/interfaces";
import { logger, LogCategory } from "../lib/logger";
import { ScalingManager } from "./ScalingManager";
import { useStateStore } from "../stores/game/stateStore";
import { TutorialMissionId, PauseReason } from "../types/enums";
import { getTuned } from "../stores/systems/tuningStore";

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
  // 50ms (≈3 frames at 60fps) keeps the loop cheap (sorted-list + Date.now
  // compare) while keeping the respawn within ~3 frames of the indicator
  // hitting zero. The previous 500ms allowed up to half a second of visible
  // "0 on the indicator but monster invisible" desync.
  private updateInterval: number = 50;
  private paused: boolean = false;
  private pauseStartTime: number = 0;
  private totalPausedTime: number = 0;
  // Reason-set so independent pausers (game-state, power_mode) compose:
  // both must clear before the manager unpauses.
  private pauseReasons: Set<PauseReason> = new Set();

  private constructor() {
    // respawnConfig kept for the public read/update API, but per-type delays
    // are now read live via getTuned() in getRespawnDelay() — so panel edits
    // take effect on the next monster kill without restart.
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
      ambusher: getTuned("RESPAWN_UFO_MS"),
      chaser: getTuned("RESPAWN_BIRD_MS"),
      floater: getTuned("RESPAWN_HORN_MS"),
      patrol: getTuned("RESPAWN_MUMMY_MS"),
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
    // Validate monster object
    if (!monster || !monster.type) {
      logger.error("killMonster called with invalid monster object");
      return;
    }

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
    const adjustedNow = Date.now() - this.totalPausedTime;
    monster.deathTime = adjustedNow;

    // Mission 4 (KILL) is a kill-the-byråkratene gauntlet — respawning would
    // make the totalMonsters target unwinnable and reset the player's progress
    // mid-power-mode. Skip the respawn queue entirely while it's active.
    if (
      useStateStore.getState().tutorialMission === TutorialMissionId.KILL
    ) {
      logger.monster(`${monster.type} killed (tutorial KILL — no respawn)`);
      return;
    }

    monster.respawnTime =
      adjustedNow + this.getRespawnDelay(monster.type);

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
    const adjustedCurrentTime = currentTime - this.totalPausedTime;

    // Process respawns (since array is sorted, we can process from the beginning)
    while (
      this.deadMonsters.length > 0 &&
      this.deadMonsters[0].respawnTime <= adjustedCurrentTime
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
  public pause(reason: PauseReason = PauseReason.Default): void {
    if (!this.paused) {
      this.paused = true;
      this.pauseStartTime = Date.now();
    }
    this.pauseReasons.add(reason);
    logger.throttled(
      LogCategory.GAME,
      `respawn_paused_${reason}`,
      `Respawn system paused (${reason})`,
      5000
    );
  }

  public resume(reason: PauseReason = PauseReason.Default): void {
    this.pauseReasons.delete(reason);
    // Stay paused if any other reason still holds the lock.
    if (this.pauseReasons.size > 0) {
      logger.throttled(
        LogCategory.GAME,
        `respawn_resume_partial_${reason}`,
        `Respawn resume(${reason}) — still paused by: ${Array.from(this.pauseReasons).join(", ")}`,
        5000
      );
      return;
    }
    if (this.paused) {
      this.paused = false;
      this.totalPausedTime += Date.now() - this.pauseStartTime;
      logger.throttled(
        LogCategory.GAME,
        `respawn_resumed_${reason}`,
        `Respawn system resumed (${reason})`,
        5000
      );
    } else {
      this.paused = false;
    }
  }

  public isPaused(): boolean {
    return this.paused;
  }

  public getPauseStatus(): {
    isPaused: boolean;
    pauseReasons: PauseReason[];
    totalPausedTime: number;
  } {
    return {
      isPaused: this.paused,
      pauseReasons: Array.from(this.pauseReasons),
      totalPausedTime: this.totalPausedTime,
    };
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
    // If the monster transformed during its previous life (Mummy → SPHERE/ORB),
    // restore its pre-transform shape so it respawns as a mummy. Skip when
    // no snapshot exists (monster never transformed).
    if (monster.originalType !== undefined) {
      const cross = monster as unknown as { type: string; color: string };
      cross.type = monster.originalType;
      if (monster.originalColor !== undefined) cross.color = monster.originalColor;
      if (monster.originalWidth !== undefined) monster.width = monster.originalWidth;
      if (monster.originalHeight !== undefined) monster.height = monster.originalHeight;
      monster._hitboxOffsetX = 0;
      monster._hitboxOffsetY = 0;
      monster._hitboxRotation = 0;
      monster.originalType = undefined;
      monster.originalColor = undefined;
      monster.originalWidth = undefined;
      monster.originalHeight = undefined;
    }

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

    // Clear power-mode + movement-class wall-clock timestamps. If a monster
    // is killed during power mode, leftover frozenAt would corrupt the next
    // life: the unfreeze loop in POWER_MODE.remove computes
    // `now - frozenAt` and shifts lastSeenAt / nextHopTime by that amount,
    // which would inject a multi-second offset from the prior life.
    monster.frozenAt = undefined;
    monster.mutationEndTime = undefined;
    monster.lastSeenAt = undefined;
    monster.nextHopTime = undefined;
    delete (monster as any).lastSeenPlayerX;
    delete (monster as any).lastSeenPlayerY;
    delete (monster as any).hopTargetX;
    delete (monster as any).hopTargetY;

    // Reset individual movement properties that are stored on the monster object
    // These properties are used by movement classes and need to be cleared on respawn
    delete (monster as any).updateIntervalMultiplier;
    delete (monster as any).directnessMultiplier;
    delete (monster as any).speedMultiplier;
    delete (monster as any).targetX;
    delete (monster as any).targetY;
    delete (monster as any).patrolSide;
    delete (monster as any).targetPlatformX;
    delete (monster as any).chaseTargetX;
    delete (monster as any).chaseTargetY;
    delete (monster as any).ambushCooldown;
    delete (monster as any).spawnPauseTime;
    delete (monster as any).walkLengths;
    delete (monster as any).currentWalkCount;
    delete (monster as any).originalSpawnX;
  }

  private getRespawnDelay(monsterType: string): number {
    // Live-read each kill so the Tuning Panel takes effect immediately.
    switch (monsterType) {
      case "UFO":
        return getTuned("RESPAWN_UFO_MS");
      case "BIRD":
        return getTuned("RESPAWN_BIRD_MS");
      case "HORN":
        return getTuned("RESPAWN_HORN_MS");
      case "MUMMY":
      case "VERTICAL_PATROL":
        return getTuned("RESPAWN_MUMMY_MS");
      default:
        logger.warn(
          `Unknown monster type for respawn delay: ${monsterType}, using default`
        );
        return getTuned("RESPAWN_MUMMY_MS");
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
    // respawnTime was set in adjusted-time space (Date.now - totalPausedTime),
    // so the indicator must compare against the same clock. Otherwise pauses
    // (notably power-mode) cause "indicator hits 0 but monster doesn't appear
    // for `totalPausedTime` ms" because the actual respawn check in update()
    // also uses adjusted time.
    const adjustedNow = Date.now() - this.totalPausedTime;
    return Math.max(0, monster.respawnTime - adjustedNow);
  }

  public getNextRespawnTime(): number | null {
    return this.deadMonsters.length > 0
      ? this.deadMonsters[0].respawnTime
      : null;
  }

  public reset(): void {
    this.deadMonsters = [];
    this.lastUpdateTime = 0;
    this.paused = false;
    this.pauseStartTime = 0;
    this.totalPausedTime = 0;
    this.pauseReasons.clear();
    logger.debug("OptimizedRespawnManager: Reset - cleared all dead monsters and pause state");
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
    this.paused = false;
    this.pauseStartTime = 0;
    this.totalPausedTime = 0;
    this.pauseReasons.clear();
  }
}
