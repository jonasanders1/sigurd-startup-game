import { useGameStore } from "../stores/gameStore";
import { AudioEvent } from "../types/enums";
import { DEV_CONFIG } from "../types/constants";
import { log } from "../lib/logger";
import type { AudioManager } from "./AudioManager";
import type { OptimizedRespawnManager } from "./OptimizedRespawnManager";
import type { ScoreManager } from "./ScoreManager";

export class PowerUpManager {
  private audioManager: AudioManager;
  private monsterRespawnManager: OptimizedRespawnManager;
  private scoreManager: ScoreManager;

  constructor(
    audioManager: AudioManager,
    monsterRespawnManager: OptimizedRespawnManager,
    scoreManager: ScoreManager
  ) {
    this.audioManager = audioManager;
    this.monsterRespawnManager = monsterRespawnManager;
    this.scoreManager = scoreManager;
  }

  public handlePowerCoinCollection(coin: any): void {
    const gameState = useGameStore.getState();
    
    // Activate power mode
    if (coin.type === "POWER") {
      this.audioManager.playSound(AudioEvent.POWER_COIN_ACTIVATE);
    }
  }

  public handleMonsterCollisionDuringPowerMode(monster: any): void {
    const gameState = useGameStore.getState();
    
    // Monster is killed during power mode
    this.scoreManager.handleMonsterKill(monster);
    
    // Play monster kill sound
    this.audioManager.playSound(AudioEvent.COIN_COLLECT);
    
    // Kill the monster and schedule for respawn
    this.monsterRespawnManager.killMonster(monster);
  }

  public isGodModeEnabled(): boolean {
    return DEV_CONFIG.GOD_MODE;
  }

  public isPowerModeActive(): boolean {
    const gameState = useGameStore.getState();
    return gameState.activeEffects.powerMode;
  }

  public getPowerModeEndTime(): number {
    const gameState = useGameStore.getState();
    return gameState.activeEffects.powerModeEndTime;
  }

  public getPowerModeTimeLeft(): number {
    const endTime = this.getPowerModeEndTime();
    if (endTime > 0) {
      return Math.max(0, endTime - Date.now());
    }
    return 0;
  }

  public stopPowerUpMelody(): void {
    if (this.audioManager.isPowerUpMelodyActive()) {
      log.audio("Stopping PowerUp melody");
      this.audioManager.stopPowerUpMelody();
    }
  }

  public handlePlayerDeath(): void {
    // Stop power-up melody if active when player dies
    if (this.audioManager.isPowerUpMelodyActive()) {
      log.audio("Player died during power mode, stopping PowerUp melody");
      this.audioManager.stopPowerUpMelody();
    }
  }

  public handleLevelTransition(): void {
    // Stop power-up melody on level transition
    if (this.audioManager.isPowerUpMelodyActive()) {
      log.audio("Level transition, stopping PowerUp melody");
      this.audioManager.stopPowerUpMelody();
    }
  }

  public resetEffects(): void {
    const gameState = useGameStore.getState();
    gameState.resetEffects();
  }

  public getPowerUpStatus(): any {
    const gameState = useGameStore.getState();
    
    return {
      powerUpMelody: this.audioManager.getPowerUpMelodyStatus(),
      powerMode: {
        isActive: this.isPowerModeActive(),
        endTime: this.getPowerModeEndTime(),
        timeLeft: this.getPowerModeTimeLeft(),
      },
      coinManager: gameState.coinManager
        ? {
            powerModeActive: gameState.coinManager.isPowerModeActive(),
            powerModeEndTime: gameState.coinManager.getPowerModeEndTime(),
          }
        : null,
    };
  }
}