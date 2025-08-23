import { useGameStore } from "../stores/gameStore";
import { GameState, MenuType, AudioEvent } from "../types/enums";
import { DEV_CONFIG, GAME_CONFIG } from "../types/constants";
import { sendGameStateUpdate } from "../lib/communicationUtils";
import { log } from "../lib/logger";
import type { AudioManager } from "./AudioManager";
import type { ScalingManager } from "./ScalingManager";
import type { OptimizedSpawnManager } from "./OptimizedSpawnManager";
import type { OptimizedRespawnManager } from "./OptimizedRespawnManager";

export class GameStateManager {
  private previousGameState: GameState | null = null;
  private isBackgroundMusicPlaying = false;
  private devModeInitialized = false;

  // Dependencies
  private audioManager: AudioManager;
  private scalingManager: ScalingManager;
  private monsterSpawnManager: OptimizedSpawnManager;
  private monsterRespawnManager: OptimizedRespawnManager;

  constructor(
    audioManager: AudioManager,
    scalingManager: ScalingManager,
    monsterSpawnManager: OptimizedSpawnManager,
    monsterRespawnManager: OptimizedRespawnManager
  ) {
    this.audioManager = audioManager;
    this.scalingManager = scalingManager;
    this.monsterSpawnManager = monsterSpawnManager;
    this.monsterRespawnManager = monsterRespawnManager;
  }

  public initializeDevMode(): void {
    const gameState = useGameStore.getState();

    // Reset game state first
    gameState.resetGameState();

    // Apply mock data AFTER reset
    gameState.addScore(DEV_CONFIG.MOCK_DATA.score);

    // Set lives
    const currentLives = gameState.lives;
    const targetLives = DEV_CONFIG.MOCK_DATA.lives;
    if (targetLives < currentLives) {
      for (let i = 0; i < currentLives - targetLives; i++) {
        gameState.loseLife();
      }
      if (targetLives > 0) {
        gameState.setState(GameState.MENU);
      }
    }

    // Set level
    const targetLevel = DEV_CONFIG.TARGET_LEVEL;
    if (targetLevel > 1) {
      gameState.resetLevelState();
      for (let i = 1; i < targetLevel; i++) {
        gameState.nextLevel();
      }
    }

    // Set the target state
    this.setDevModeState(DEV_CONFIG.TARGET_STATE);

    // Set multiplier LAST
    log.dev(
      `DEV_MODE: Setting multiplier to ${DEV_CONFIG.MOCK_DATA.multiplier}x`
    );
    gameState.setMultiplier(
      DEV_CONFIG.MOCK_DATA.multiplier,
      DEV_CONFIG.MOCK_DATA.multiplierScore
    );

    log.dev(
      `DEV_MODE initialized with state: ${DEV_CONFIG.TARGET_STATE}, level: ${DEV_CONFIG.TARGET_LEVEL}`
    );
    this.devModeInitialized = true;
  }

  private setDevModeState(targetState: string): void {
    const gameState = useGameStore.getState();

    switch (targetState) {
      case "START_MENU":
        this.setState(GameState.MENU, MenuType.START);
        break;
      case "COUNTDOWN":
        this.setState(GameState.COUNTDOWN, MenuType.COUNTDOWN);
        break;
      case "PLAYING":
        this.setState(GameState.PLAYING, MenuType.IN_GAME);
        break;
      case "PAUSED":
        this.setState(GameState.PAUSED, MenuType.PAUSE);
        break;
      case "SETTINGS":
        this.setState(GameState.MENU, MenuType.SETTINGS);
        break;
      case "BONUS":
        this.setState(GameState.BONUS, MenuType.BONUS);
        // Mock bomb collection
        gameState.resetBombState();
        for (let i = 0; i < DEV_CONFIG.MOCK_DATA.correctOrderCount; i++) {
          gameState.collectBomb(i + 1);
        }
        break;
      case "VICTORY":
        this.setState(GameState.VICTORY, MenuType.VICTORY);
        break;
      case "GAME_OVER":
        this.setState(GameState.GAME_OVER, MenuType.GAME_OVER);
        break;
      default:
        log.warn(`Unknown DEV_MODE target state: ${targetState}`);
        this.setState(GameState.MENU, MenuType.START);
    }
  }

  public setState(state: GameState, menuType?: MenuType): void {
    const gameState = useGameStore.getState();
    gameState.setState(state);

    if (menuType !== undefined) {
      gameState.setMenuType(menuType);
    }

    // Send state update to external system
    sendGameStateUpdate(JSON.stringify({
      state,
      menuType,
      timestamp: Date.now(),
    }));

    // Handle state-specific logic
    this.handleStateTransition(state);
  }

  private handleStateTransition(state: GameState): void {
    // Handle background music
    this.handleBackgroundMusic(state);

    // Handle difficulty pausing
    this.handleDifficultyPause(state);
  }

  public handleBackgroundMusic(currentState: GameState): void {
    // Check if we should play music:
    // 1. State must be PLAYING
    // 2. PowerUp melody must NOT be active
    const shouldPlayMusic =
      currentState === GameState.PLAYING &&
      !this.audioManager.isPowerUpMelodyActive();

    const stateChanged = this.previousGameState !== currentState;

    if (stateChanged) {
      log.audio(
        `Game state changed: ${this.previousGameState} -> ${currentState}`
      );
    }

    // Handle music based on state
    if (currentState === GameState.PLAYING && !this.audioManager.isPowerUpMelodyActive()) {
      // Start music if not already playing
      if (!this.isBackgroundMusicPlaying) {
        log.audio("Starting background music");
        this.audioManager.playSound(AudioEvent.BACKGROUND_MUSIC, currentState);
        this.isBackgroundMusicPlaying = true;
      }
    } else if (currentState === GameState.PAUSED) {
      // Explicitly stop music when paused
      if (this.isBackgroundMusicPlaying) {
        log.audio("Game paused, stopping background music");
        this.audioManager.stopBackgroundMusic();
        this.isBackgroundMusicPlaying = false;
      }
    } else if (currentState !== GameState.PLAYING) {
      // Stop music for all other non-playing states
      if (this.isBackgroundMusicPlaying) {
        log.audio(
          `Stopping background music (state: ${currentState})`
        );
        this.audioManager.stopBackgroundMusic();
        this.isBackgroundMusicPlaying = false;
      }
    }

    // Also stop music if power-up melody becomes active
    if (this.audioManager.isPowerUpMelodyActive() && this.isBackgroundMusicPlaying) {
      log.audio("PowerUp melody active, stopping background music");
      this.audioManager.stopBackgroundMusic();
      this.isBackgroundMusicPlaying = false;
    }

    this.previousGameState = currentState;
  }

  public handleDifficultyPause(currentState: GameState): void {
    const gameState = useGameStore.getState();

    // Only pause/resume managers based on specific states
    switch (currentState) {
      case GameState.PLAYING:
        // Resume all managers when playing
        if (!this.scalingManager.isCurrentlyPausedByPowerMode()) {
          this.scalingManager.resume();
        }
        this.scalingManager.resumeAllMonsterScaling();
        this.monsterSpawnManager.resume();
        this.monsterRespawnManager.resume();

        // Resume coin manager
        if (gameState.coinManager) {
          gameState.coinManager.resume();
        }
        
        log.audio("Game playing, all managers resumed");
        break;

      case GameState.PAUSED:
        // Pause all managers when paused
        this.scalingManager.pause();
        this.scalingManager.pauseAllMonsterScaling();
        this.monsterSpawnManager.pause();
        this.monsterRespawnManager.pause();

        // Pause coin manager
        if (gameState.coinManager) {
          gameState.coinManager.pause();
        }

        // Stop power-up melody when paused
        if (this.audioManager.isPowerUpMelodyActive()) {
          log.audio("Game paused, stopping PowerUp melody");
          this.audioManager.stopPowerUpMelody();
          this.isBackgroundMusicPlaying = false;
        }
        
        log.audio("Game paused, all managers paused");
        break;

      case GameState.COUNTDOWN:
        // Keep managers paused during countdown
        // They will resume when state changes to PLAYING
        break;

      case GameState.BONUS:
      case GameState.VICTORY:
      case GameState.GAME_OVER:
      case GameState.MENU:
        // Stop managers for end states and menu
        this.scalingManager.pause();
        this.scalingManager.pauseAllMonsterScaling();
        this.monsterSpawnManager.pause();
        this.monsterRespawnManager.pause();

        // Pause coin manager
        if (gameState.coinManager) {
          gameState.coinManager.pause();
        }

        // Stop power-up melody for these states
        if (this.audioManager.isPowerUpMelodyActive()) {
          log.audio(`Game state ${currentState}, stopping PowerUp melody`);
          this.audioManager.stopPowerUpMelody();
          this.isBackgroundMusicPlaying = false;
        }
        break;

      default:
        // For any other states, default to paused
        break;
    }
  }

  public resetBackgroundMusicFlag(): void {
    this.isBackgroundMusicPlaying = false;
    log.audio("Reset background music flag");
  }

  public stopPowerUpMelodyIfActive(): void {
    if (this.audioManager.isPowerUpMelodyActive()) {
      this.audioManager.stopPowerUpMelody();
      this.resetBackgroundMusicFlag();
    }
  }

  public showCountdown(callback?: () => void, duration: number = 3000): void {
    const gameState = useGameStore.getState();
    this.setState(GameState.COUNTDOWN, MenuType.COUNTDOWN);

    setTimeout(() => {
      this.setState(GameState.PLAYING);
      callback?.();
    }, duration);
  }

  public handleBonusCompletion(onComplete: () => void): void {
    const gameState = useGameStore.getState();

    if (
      gameState.currentState === GameState.BONUS &&
      gameState.bonusAnimationComplete &&
      !DEV_CONFIG.ENABLED
    ) {
      // Animation is complete, proceed after delay
      setTimeout(() => {
        onComplete();
      }, 2000);

      // Reset the flag to prevent multiple calls
      gameState.setBonusAnimationComplete(false);
    }
  }

  public isDevModeInitialized(): boolean {
    return this.devModeInitialized;
  }

  public getCurrentState(): GameState {
    return useGameStore.getState().currentState;
  }

  public isBackgroundMusicActive(): boolean {
    return this.isBackgroundMusicPlaying;
  }
}
