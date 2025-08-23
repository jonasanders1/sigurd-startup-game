import { useGameStore } from "../stores/gameStore";
import { useCoinStore } from "../stores/entities/coinStore";
import { useMonsterStore } from "../stores/entities/monsterStore";
import { useAudioStore } from "../stores/systems/audioStore";
import { AudioEvent } from "../types/enums";
import { DEV_CONFIG } from "../types/constants";
import { log } from "../lib/logger";
import type { AudioManager } from "./AudioManager";
import type { ScoreManager } from "./ScoreManager";

export class PowerUpManager {
  private audioManager: AudioManager;
  private scoreManager: ScoreManager;

  constructor(audioManager: AudioManager, scoreManager: ScoreManager) {
    this.audioManager = audioManager;
    this.scoreManager = scoreManager;
  }

  public stopPowerUpMelodyIfActive(): void {
    this.audioManager.stopAudio(AudioEvent.POWERUP_MELODY);
  }

  public handlePowerCoinCollection(coin: any): void {
    const coinStore = useCoinStore.getState();
    
    // Activate power mode
    coinStore.activatePowerMode();
    this.audioManager.playSound(AudioEvent.POWERUP_MELODY);
    log.game("Power mode activated!");
  }

  public handleMonsterCollisionDuringPowerMode(monster: any): void {
    const monsterStore = useMonsterStore.getState();
    
    // Monster is killed during power mode
    monsterStore.removeMonster(monster.id);
    
    // Score is handled by ScoreManager
    this.scoreManager.handleMonsterKill(monster);
    
    // Play kill sound
    this.audioManager.playSound(AudioEvent.MONSTER_KILL);
    
    log.debug(`Monster ${monster.id} killed during power mode`);
  }

  public handlePowerModeExpiration(): void {
    this.audioManager.stopAudio(AudioEvent.POWERUP_MELODY);
    log.game("Power mode expired");
  }

  public isPowerModeActive(): boolean {
    const coinStore = useCoinStore.getState();
    return coinStore.activeEffects.powerMode;
  }

  public getPowerModeEndTime(): number {
    const coinStore = useCoinStore.getState();
    return coinStore.activeEffects.powerModeEndTime;
  }

  public updatePowerModeState(currentTime: number): void {
    // Check if power mode should expire
    if (this.isPowerModeActive()) {
      const endTime = this.getPowerModeEndTime();
      
      if (currentTime >= endTime) {
        this.handlePowerModeExpiration();
        // The coin store will handle deactivating power mode
      }
      
      // Log remaining time in dev mode
      if (DEV_CONFIG.LOG_POWERUP_STATUS) {
        const remaining = Math.max(0, endTime - currentTime);
        log.debug(`Power mode remaining: ${(remaining / 1000).toFixed(1)}s`);
      }
    }
  }

  public canCollectCoinDuringPowerMode(): boolean {
    // Power coins can be collected during power mode
    // This extends the power mode duration
    return true;
  }

  public getTimeUntilPowerModeEnds(): number {
    if (!this.isPowerModeActive()) {
      return 0;
    }
    
    const endTime = this.getPowerModeEndTime();
    const remaining = Math.max(0, endTime - Date.now());
    return remaining;
  }

  public resetEffects(): void {
    const coinStore = useCoinStore.getState();
    coinStore.resetEffects();
  }

  public getPowerUpStatus(): any {
    const coinStore = useCoinStore.getState();
    
    return {
      powerMode: coinStore.activeEffects.powerMode,
      powerModeEndTime: coinStore.activeEffects.powerModeEndTime,
      timeRemaining: this.getTimeUntilPowerModeEnds(),
    };
  }

  public debugLogStatus(): void {
    if (DEV_CONFIG.LOG_POWERUP_STATUS) {
      const status = this.getPowerUpStatus();
      log.debug("Power-up Status:", status);
    }
  }
}