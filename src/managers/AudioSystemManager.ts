import { AudioEvent, GameState } from "../types/enums";
import { getAudioPath } from "../config/assets";
import { useGameStore } from "../stores/gameStore";
import { GAME_CONFIG } from "../types/constants";
import { log, logger } from "../lib/logger";
import { AudioManager } from "./AudioManager";
import { PauseManager } from "./PauseManager";

/**
 * Unified AudioSystemManager that consolidates audio and pause management
 * Combines AudioManager and PauseManager into a single cohesive system
 */
export class AudioSystemManager {
  // Internal managers (we'll gradually migrate their functionality here)
  private audioManager: AudioManager;
  private pauseManager: PauseManager;
  
  // Unified pause state
  private pauseState: {
    isPaused: boolean;
    pauseStartTime: number;
    totalPausedTime: number;
    pauseReasons: Set<string>;
    audioWasPaused: boolean;
  };
  
  // Timing
  private startTime: number = 0;

  constructor() {
    // Initialize internal managers (for backward compatibility during migration)
    this.audioManager = new AudioManager();
    this.pauseManager = PauseManager.getInstance();
    
    // Initialize unified pause state
    this.pauseState = {
      isPaused: false,
      pauseStartTime: 0,
      totalPausedTime: 0,
      pauseReasons: new Set(),
      audioWasPaused: false,
    };
    
    logger.debug("AudioSystemManager: Initialized with unified audio and pause management");
  }

  // ===== AUDIO MANAGEMENT =====
  
  /**
   * Play background music
   */
  public playBackgroundMusic(): void {
    this.audioManager.playBackgroundMusic();
  }

  /**
   * Stop background music
   */
  public stopBackgroundMusic(): void {
    this.audioManager.stopBackgroundMusic();
  }

  /**
   * Play a sound effect
   */
  public playSound(event: AudioEvent): void {
    this.audioManager.playSound(event);
  }

  /**
   * Play power-up melody (special audio sequence)
   */
  public playPowerUpMelody(): void {
    this.audioManager.playPowerUpMelody();
  }

  /**
   * Stop power-up melody
   */
  public stopPowerUpMelody(): void {
    this.audioManager.stopPowerUpMelody();
  }

  /**
   * Update audio volumes from settings
   */
  public updateAudioVolumes(): void {
    this.audioManager.updateAudioVolumes();
  }

  /**
   * Handle audio cleanup on game over
   */
  public handleGameOver(): void {
    this.audioManager.handleGameOver();
  }

  /**
   * Handle audio for level completion
   */
  public handleLevelComplete(): void {
    this.audioManager.handleLevelComplete();
  }

  // ===== PAUSE MANAGEMENT =====
  
  /**
   * Start timing (for pause-aware time calculations)
   */
  public start(): void {
    this.startTime = Date.now();
    this.pauseState = {
      isPaused: false,
      pauseStartTime: 0,
      totalPausedTime: 0,
      pauseReasons: new Set(),
      audioWasPaused: false,
    };
    logger.debug("AudioSystemManager: Timing started");
  }

  /**
   * Pause the game system
   * @param reason - Reason for pausing (e.g., "menu", "countdown", "user")
   * @param pauseAudio - Whether to pause audio as well
   */
  public pause(reason: string = "default", pauseAudio: boolean = true): void {
    // Add pause reason
    this.pauseState.pauseReasons.add(reason);
    
    // If not already paused, mark pause start
    if (!this.pauseState.isPaused) {
      this.pauseState.isPaused = true;
      this.pauseState.pauseStartTime = Date.now();
      
      // Pause audio if requested
      if (pauseAudio) {
        this.pauseState.audioWasPaused = true;
        this.audioManager.pauseBackgroundMusic();
      }
      
      logger.debug(`AudioSystemManager: System paused (reason: ${reason}, audio: ${pauseAudio})`);
    } else {
      logger.debug(`AudioSystemManager: Added pause reason: ${reason}`);
    }
    
    // Also update legacy pause manager for compatibility
    this.pauseManager.pause(reason);
  }

  /**
   * Resume the game system
   * @param reason - Reason to remove from pause reasons
   */
  public resume(reason: string = "default"): void {
    // Remove pause reason
    this.pauseState.pauseReasons.delete(reason);
    
    // If no more pause reasons, resume
    if (this.pauseState.pauseReasons.size === 0 && this.pauseState.isPaused) {
      const pauseDuration = Date.now() - this.pauseState.pauseStartTime;
      this.pauseState.totalPausedTime += pauseDuration;
      this.pauseState.isPaused = false;
      
      // Resume audio if it was paused
      if (this.pauseState.audioWasPaused) {
        this.audioManager.resumeBackgroundMusic();
        this.pauseState.audioWasPaused = false;
      }
      
      logger.debug(`AudioSystemManager: System resumed (paused for ${(pauseDuration / 1000).toFixed(1)}s)`);
    } else if (this.pauseState.pauseReasons.size > 0) {
      logger.debug(`AudioSystemManager: Removed pause reason: ${reason}, remaining: ${Array.from(this.pauseState.pauseReasons).join(", ")}`);
    }
    
    // Also update legacy pause manager for compatibility
    this.pauseManager.resume(reason);
  }

  /**
   * Check if system is paused
   */
  public isPaused(): boolean {
    return this.pauseState.isPaused;
  }

  /**
   * Get all active pause reasons
   */
  public getPauseReasons(): string[] {
    return Array.from(this.pauseState.pauseReasons);
  }

  /**
   * Check if a specific pause reason is active
   */
  public hasPauseReason(reason: string): boolean {
    return this.pauseState.pauseReasons.has(reason);
  }

  /**
   * Get time elapsed accounting for pauses
   */
  public getAdjustedTime(): number {
    const currentTime = Date.now();
    const actualElapsed = currentTime - this.startTime;
    return actualElapsed - this.pauseState.totalPausedTime;
  }

  /**
   * Get time elapsed in seconds
   */
  public getTimeElapsed(): number {
    return this.getAdjustedTime() / 1000;
  }

  /**
   * Get total paused time in milliseconds
   */
  public getTotalPausedTime(): number {
    return this.pauseState.totalPausedTime;
  }

  // ===== STATE MANAGEMENT =====
  
  /**
   * Handle game state changes
   */
  public handleStateChange(newState: GameState, previousState?: GameState): void {
    logger.debug(`AudioSystemManager: State change from ${previousState} to ${newState}`);
    
    switch (newState) {
      case GameState.MENU:
        this.handleMenuState();
        break;
      case GameState.PLAYING:
        this.handlePlayingState();
        break;
      case GameState.PAUSED:
        this.handlePausedState();
        break;
      case GameState.GAME_OVER:
        this.handleGameOverState();
        break;
      case GameState.VICTORY:
        this.handleVictoryState();
        break;
      case GameState.MAP_CLEARED:
        this.handleMapClearedState();
        break;
      case GameState.BONUS:
        this.handleBonusState();
        break;
    }
  }

  // ===== CLEANUP =====
  
  /**
   * Reset the audio system
   */
  public reset(): void {
    // Reset pause state
    this.startTime = Date.now();
    this.pauseState = {
      isPaused: false,
      pauseStartTime: 0,
      totalPausedTime: 0,
      pauseReasons: new Set(),
      audioWasPaused: false,
    };
    
    // Reset audio
    this.audioManager.stopBackgroundMusic();
    this.audioManager.stopPowerUpMelody();
    
    // Reset legacy managers
    this.pauseManager.reset();
    
    logger.debug("AudioSystemManager: System reset");
  }

  /**
   * Cleanup all resources
   */
  public cleanup(): void {
    // Stop all audio
    this.audioManager.stopBackgroundMusic();
    this.audioManager.stopPowerUpMelody();
    
    // Reset pause state
    this.pauseState = {
      isPaused: false,
      pauseStartTime: 0,
      totalPausedTime: 0,
      pauseReasons: new Set(),
      audioWasPaused: false,
    };
    this.startTime = 0;
    
    // Cleanup legacy managers
    this.pauseManager.cleanup();
    
    logger.debug("AudioSystemManager: Cleaned up all resources");
  }

  /**
   * Get system status for debugging
   */
  public getStatus(): any {
    return {
      audio: {
        isBackgroundMusicPlaying: this.audioManager.isBackgroundMusicPlaying,
        powerUpMelodyActive: this.audioManager.powerUpMelodyActive,
      },
      pause: {
        isPaused: this.pauseState.isPaused,
        pauseReasons: this.getPauseReasons(),
        totalPausedTime: this.pauseState.totalPausedTime,
        timeElapsed: this.getTimeElapsed(),
      },
    };
  }

  // ===== PRIVATE METHODS =====
  
  private handleMenuState(): void {
    this.stopBackgroundMusic();
    this.pause("menu", false); // Don't pause audio in menu
  }

  private handlePlayingState(): void {
    this.playBackgroundMusic();
    this.resume("menu");
    this.resume("paused");
  }

  private handlePausedState(): void {
    this.pause("paused", true);
  }

  private handleGameOverState(): void {
    this.handleGameOver();
    this.pause("game-over", true);
  }

  private handleVictoryState(): void {
    this.playSound(AudioEvent.VICTORY);
    this.pause("victory", false);
  }

  private handleMapClearedState(): void {
    this.handleLevelComplete();
    this.pause("map-cleared", false);
  }

  private handleBonusState(): void {
    this.playSound(AudioEvent.BONUS);
    this.pause("bonus", false);
  }

  // ===== LEGACY COMPATIBILITY =====
  
  /**
   * Get the internal AudioManager (for backward compatibility)
   */
  public getAudioManager(): AudioManager {
    return this.audioManager;
  }

  /**
   * Get the internal PauseManager (for backward compatibility)
   */
  public getPauseManager(): PauseManager {
    return this.pauseManager;
  }
}