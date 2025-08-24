/**
 * Spawn System Diagnostics
 * 
 * This utility provides diagnostic information for debugging spawn timing issues.
 * Add this to the console or developer tools to monitor spawn system health.
 */

import { OptimizedSpawnManager } from "./OptimizedSpawnManager";
import { OptimizedRespawnManager } from "./OptimizedRespawnManager";

export class SpawnDiagnostics {
  private spawnManager: OptimizedSpawnManager;
  private respawnManager: OptimizedRespawnManager;
  private diagnosticInterval: number | null = null;

  constructor(
    spawnManager: OptimizedSpawnManager,
    respawnManager: OptimizedRespawnManager
  ) {
    this.spawnManager = spawnManager;
    this.respawnManager = respawnManager;
  }

  /**
   * Start real-time diagnostics logging
   */
  public startDiagnostics(intervalMs: number = 1000): void {
    if (this.diagnosticInterval) {
      this.stopDiagnostics();
    }

    this.diagnosticInterval = window.setInterval(() => {
      this.logDiagnostics();
    }, intervalMs);

    console.log(`[SpawnDiagnostics] Started with ${intervalMs}ms interval`);
  }

  /**
   * Stop diagnostics logging
   */
  public stopDiagnostics(): void {
    if (this.diagnosticInterval) {
      clearInterval(this.diagnosticInterval);
      this.diagnosticInterval = null;
      console.log("[SpawnDiagnostics] Stopped");
    }
  }

  /**
   * Log current spawn system status
   */
  public logDiagnostics(): void {
    const spawnStatus = this.spawnManager.getSpawnStatus();
    const respawnStatus = {
      deadMonsters: this.respawnManager.getDeadMonsterCount(),
      isPaused: this.respawnManager.isPaused(),
      nextRespawnTime: this.respawnManager.getNextRespawnTime(),
    };

    console.group("[SpawnDiagnostics] System Status");
    
    console.group("Spawn Manager:");
    console.log(`Initialized: ${spawnStatus.levelStartTime > 0}`);
    console.log(`Level Start Time: ${new Date(spawnStatus.levelStartTime).toLocaleTimeString()}`);
    console.log(`Adjusted Time: ${spawnStatus.adjustedTime?.toFixed(1)}s`);
    console.log(`Total Spawns: ${spawnStatus.totalSpawnPoints}`);
    console.log(`Executed: ${spawnStatus.executedCount}`);
    console.log(`Pending: ${spawnStatus.pendingCount}`);
    console.log(`Paused: ${spawnStatus.isPaused}`);
    if (spawnStatus.pauseReasons?.length > 0) {
      console.log(`Pause Reasons: ${spawnStatus.pauseReasons.join(", ")}`);
    }
    console.log(`Total Paused Time: ${(spawnStatus.totalPausedTime / 1000).toFixed(1)}s`);
    console.groupEnd();

    console.group("Respawn Manager:");
    console.log(`Dead Monsters: ${respawnStatus.deadMonsters}`);
    console.log(`Paused: ${respawnStatus.isPaused}`);
    if (respawnStatus.nextRespawnTime) {
      const timeUntilRespawn = (respawnStatus.nextRespawnTime - Date.now()) / 1000;
      console.log(`Next Respawn In: ${timeUntilRespawn.toFixed(1)}s`);
    }
    console.groupEnd();

    // Check for common issues
    const issues: string[] = [];
    
    if (spawnStatus.levelStartTime === 0 && spawnStatus.totalSpawnPoints > 0) {
      issues.push("⚠️ Spawn points configured but level not initialized!");
    }
    
    if (spawnStatus.isPaused && spawnStatus.pauseReasons?.length === 0) {
      issues.push("⚠️ Spawn manager paused but no pause reasons!");
    }
    
    if (spawnStatus.pendingCount > 0 && spawnStatus.adjustedTime > 60) {
      issues.push("⚠️ Spawns still pending after 60 seconds - possible timing issue!");
    }

    if (issues.length > 0) {
      console.group("⚠️ Detected Issues:");
      issues.forEach(issue => console.warn(issue));
      console.groupEnd();
    }

    console.groupEnd();
  }

  /**
   * Get pending spawns with time until spawn
   */
  public getPendingSpawnsInfo(): any[] {
    const pendingSpawns = this.spawnManager.getPendingSpawns();
    return pendingSpawns.map(spawn => ({
      id: spawn.id,
      timeRemaining: (this.spawnManager.getSpawnTimeRemaining(spawn) / 1000).toFixed(1) + "s",
      monsterType: spawn.spawnPoint.createMonster?.().type || "Unknown",
    }));
  }

  /**
   * Force a diagnostic dump to console
   */
  public dumpFullDiagnostics(): void {
    console.group("[SpawnDiagnostics] Full System Dump");
    
    this.logDiagnostics();
    
    const pendingSpawns = this.getPendingSpawnsInfo();
    if (pendingSpawns.length > 0) {
      console.group("Pending Spawns Detail:");
      console.table(pendingSpawns);
      console.groupEnd();
    }

    const deadMonsters = this.respawnManager.getDeadMonsters();
    if (deadMonsters.length > 0) {
      console.group("Dead Monsters Detail:");
      deadMonsters.forEach(monster => {
        const timeRemaining = this.respawnManager.getRespawnTimeRemaining(monster) / 1000;
        console.log(`${monster.type}: respawns in ${timeRemaining.toFixed(1)}s`);
      });
      console.groupEnd();
    }

    console.groupEnd();
  }
}