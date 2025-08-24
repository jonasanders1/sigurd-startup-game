import {
  useGameStore,
  useStateStore,
  useScoreStore,
  useLevelStore,
  useCoinStore,
} from "../stores/gameStore";

import { GameState, MenuType, AudioEvent } from "../types/enums";
import { DEV_CONFIG, GAME_CONFIG } from "../types/constants";
import { sendGameStateUpdate } from "../lib/communicationUtils";
import { log } from "../lib/logger";
import type { AudioManager } from "./AudioManager";
import type { ScalingManager } from "./ScalingManager";
import type { OptimizedSpawnManager } from "./OptimizedSpawnManager";
import type { OptimizedRespawnManager } from "./OptimizedRespawnManager";

export class GameStateManager {
  private previousGameState: GameState = GameState.MENU; // Initialize with MENU instead of null
  private isBackgroundMusicPlaying = false;
  private devModeInitialized = false;
  private bonusTransitionInProgress = false;

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
    const { resetGameState, nextLevel, loseLife, setState, lives } =
      useStateStore.getState();
    const { setMultiplier } = useScoreStore.getState();
    const { addScore } = useScoreStore.getState();
    const { resetLevelState } = useLevelStore.getState();

    // Reset game state first
    resetGameState();
    // Apply mock data AFTER reset
    addScore(DEV_CONFIG.MOCK_DATA.score);

    // Set lives
    const currentLives = lives;
    const targetLives = DEV_CONFIG.MOCK_DATA.lives;
    if (targetLives < currentLives) {
      for (let i = 0; i < currentLives - targetLives; i++) {
        loseLife();
      }
      if (targetLives > 0) {
        setState(GameState.MENU);
      }
    }

    // Set level
    const targetLevel = DEV_CONFIG.TARGET_LEVEL;
    if (targetLevel > 1) {
      resetLevelState();
      for (let i = 1; i < targetLevel; i++) {
        nextLevel();
      }
    }

    // Set the target state
    this.setDevModeState(DEV_CONFIG.TARGET_STATE);

    // Set multiplier LAST
    log.dev(
      `DEV_MODE: Setting multiplier to ${DEV_CONFIG.MOCK_DATA.multiplier}x`
    );
    setMultiplier(
      DEV_CONFIG.MOCK_DATA.multiplier,
      DEV_CONFIG.MOCK_DATA.multiplierScore
    );

    log.dev(
      `DEV_MODE initialized with state: ${DEV_CONFIG.TARGET_STATE}, level: ${DEV_CONFIG.TARGET_LEVEL}`
    );
    this.devModeInitialized = true;
  }

  private setDevModeState(targetState: string): void {
    const { resetBombState, collectBomb } = useStateStore.getState();

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
        resetBombState();
        for (let i = 0; i < DEV_CONFIG.MOCK_DATA.correctOrderCount; i++) {
          collectBomb(i + 1);
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
    const stateStore = useStateStore.getState();

    // Set the state first
    stateStore.setState(state);

    if (menuType !== undefined) {
      stateStore.setMenuType(menuType);
    }

    // CRITICAL: Handle state transition immediately and synchronously
    // This ensures managers are paused/resumed before any other code runs
    this.handleStateTransition(state);

    // Send state update to external system after handling the transition
    sendGameStateUpdate(
      JSON.stringify({
        state,
        menuType,
        timestamp: Date.now(),
      })
    );
  }

  private handleStateTransition(state: GameState): void {
    // IMPORTANT: Handle difficulty pausing first (stops all managers)
    // This must happen before background music to prevent race conditions
    this.handleDifficultyPause(state);

    // Then handle background music
    this.handleBackgroundMusic(state);
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
    if (
      currentState === GameState.PLAYING &&
      !this.audioManager.isPowerUpMelodyActive()
    ) {
      // Start music if not already playing
      if (!this.isBackgroundMusicPlaying) {
        log.audio("Starting background music");
        this.audioManager.playSound(AudioEvent.BACKGROUND_MUSIC, currentState);
        this.isBackgroundMusicPlaying = true;
      }
    } else if (currentState === GameState.PAUSED) {
      // Explicitly stop music when paused
      console.log("Entering paused state", currentState);
      console.log("handleBackgroundMusic", this.isBackgroundMusicPlaying);
      if (this.isBackgroundMusicPlaying) {
        log.audio("Game paused, stopping background music");
        this.audioManager.stopBackgroundMusic();
        this.isBackgroundMusicPlaying = false;
      }
    } else if (currentState !== GameState.PLAYING) {
      // Stop music for all other non-playing states
      if (this.isBackgroundMusicPlaying) {
        log.audio(`Stopping background music (state: ${currentState})`);
        this.audioManager.stopBackgroundMusic();
        this.isBackgroundMusicPlaying = false;
      }
    }

    // Also stop music if power-up melody becomes active
    if (
      this.audioManager.isPowerUpMelodyActive() &&
      this.isBackgroundMusicPlaying
    ) {
      log.audio("PowerUp melody active, stopping background music");
      this.audioManager.stopBackgroundMusic();
      this.isBackgroundMusicPlaying = false;
    }

    // Explicitly handle PAUSED state to ensure music stops
    if (currentState === GameState.PAUSED) {
      // Force stop background music when paused
      if (this.audioManager.isBackgroundMusicPlaying) {
        log.audio("Game paused, forcing background music stop");
        this.audioManager.stopBackgroundMusic();
        this.isBackgroundMusicPlaying = false;
      }
    }

    this.previousGameState = currentState;
  }

  public handleDifficultyPause(currentState: GameState): void {
    const { coinManager } = useCoinStore.getState();

    // Only pause/resume managers based on specific states
    switch (currentState) {
      case GameState.PLAYING:
        // Resume all managers when playing
        // IMPORTANT: Resume in correct order to avoid race conditions

        // 1. Resume spawn/respawn managers first
        this.monsterSpawnManager.resume();
        this.monsterRespawnManager.resume();

        // 2. Resume scaling manager (respects power mode state)
        if (!this.scalingManager.isCurrentlyPausedByPowerMode()) {
          this.scalingManager.resume();
        }
        this.scalingManager.resumeAllMonsterScaling();

        // 3. Resume coin manager
        if (coinManager) {
          coinManager.resume();
        }

        log.debug("Game state PLAYING: All managers resumed in correct order");
        break;

      case GameState.PAUSED:
        // Pause all managers when paused
        // IMPORTANT: Pause in reverse order to avoid race conditions

        // 1. Pause coin manager first (stops power-ups)
        if (coinManager) {
          coinManager.pause();
        }

        // 2. Pause scaling managers
        this.scalingManager.pause();
        this.scalingManager.pauseAllMonsterScaling();

        // 3. Pause spawn/respawn managers last
        this.monsterSpawnManager.pause();
        this.monsterRespawnManager.pause();

        // 4. Stop audio effects
        if (this.audioManager.isPowerUpMelodyActive()) {
          log.audio("Game paused, stopping PowerUp melody");
          this.audioManager.stopPowerUpMelody();
          this.isBackgroundMusicPlaying = false;
        }

        log.debug("Game state PAUSED: All managers paused in correct order");
        break;

      case GameState.COUNTDOWN:
        // Keep managers paused during countdown
        // They will resume when state changes to PLAYING
        // This prevents updates during countdown animation
        log.debug("Game state COUNTDOWN: Managers remain paused");
        break;

      case GameState.BONUS:
      case GameState.VICTORY:
      case GameState.GAME_OVER:
      case GameState.MENU:
        // Stop managers for end states and menu
        // Use same order as PAUSED state

        // 1. Pause coin manager first
        if (coinManager) {
          coinManager.pause();
        }

        // 2. Pause scaling managers
        this.scalingManager.pause();
        this.scalingManager.pauseAllMonsterScaling();

        // 3. Pause spawn/respawn managers
        this.monsterSpawnManager.pause();
        this.monsterRespawnManager.pause();

        // 4. Stop audio effects
        if (this.audioManager.isPowerUpMelodyActive()) {
          log.audio(`Game state ${currentState}, stopping PowerUp melody`);
          this.audioManager.stopPowerUpMelody();
          this.isBackgroundMusicPlaying = false;
        }

        log.debug(`Game state ${currentState}: All managers paused`);
        break;

      case GameState.MAP_CLEARED:
        // Pause all managers when map is cleared (similar to BONUS state)
        // IMPORTANT: Pause in reverse order to avoid race conditions

        // 1. Pause coin manager first (stops power-ups)
        if (coinManager) {
          coinManager.pause();
        }

        // 2. Pause scaling managers
        this.scalingManager.pause();
        this.scalingManager.pauseAllMonsterScaling();

        // 3. Pause spawn/respawn managers last
        this.monsterSpawnManager.pause();
        this.monsterRespawnManager.pause();

        // 4. Stop audio effects
        if (this.audioManager.isPowerUpMelodyActive()) {
          log.audio("Map cleared, stopping PowerUp melody");
          this.audioManager.stopPowerUpMelody();
          this.isBackgroundMusicPlaying = false;
        }

        log.debug(
          "Game state MAP_CLEARED: All managers paused in correct order"
        );
        break;

      default:
        // For any other states, default to paused
        log.warn(
          `Unhandled game state in handleDifficultyPause: ${currentState}`
        );
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
    const { currentState, bonusAnimationComplete, setBonusAnimationComplete } =
      useStateStore.getState();

    // Debug logging for tracking the bonus completion flow
    if (currentState === GameState.BONUS) {
      if (!bonusAnimationComplete) {
        // Only log this occasionally to avoid spam
        if (Math.random() < 0.01) {
          log.debug("Waiting for bonus animation to complete...");
        }
      } else if (this.bonusTransitionInProgress) {
        // Only log this occasionally to avoid spam
        if (Math.random() < 0.01) {
          log.debug("Bonus transition already in progress...");
        }
      }
    }

    if (
      currentState === GameState.BONUS &&
      bonusAnimationComplete &&
      !this.bonusTransitionInProgress
    ) {
      // Mark transition as in progress to prevent multiple calls
      this.bonusTransitionInProgress = true;
      log.info(
        "✅ Bonus animation complete, starting 2-second transition to next level"
      );
      log.debug(
        `Current state: ${currentState}, Animation flag: ${bonusAnimationComplete}, Transition flag: ${this.bonusTransitionInProgress}`
      );

      // Animation is complete, proceed after delay
      setTimeout(() => {
        log.info("✅ Transition delay complete, proceeding to next level now");

        // Reset the flag AFTER we're about to transition, not before
        setBonusAnimationComplete(false);

        // Call the completion callback
        onComplete();

        // Reset the transition flag after completion
        this.bonusTransitionInProgress = false;
        log.debug("Bonus transition flags reset for next bonus");
      }, 2000);
    }
  }

  public isDevModeInitialized(): boolean {
    return this.devModeInitialized;
  }

  public getCurrentState(): GameState {
    return useStateStore.getState().currentState;
  }

  public isBackgroundMusicActive(): boolean {
    return this.isBackgroundMusicPlaying;
  }

  /**
   * Reset bonus transition flags - useful for edge cases or cleanup
   */
  public resetBonusTransition(): void {
    const { setBonusAnimationComplete } = useStateStore.getState();
    this.bonusTransitionInProgress = false;
    setBonusAnimationComplete(false);
    log.debug("Bonus transition flags reset");
  }

  // ===== CENTRALIZED STATE TRANSITIONS =====

  /**
   * Start a new game from the start menu
   */
  public startNewGame(): void {
    log.info("Starting new game with countdown");

    // Reset any lingering bonus transition state
    this.resetBonusTransition();

    this.setState(GameState.COUNTDOWN, MenuType.COUNTDOWN);

    setTimeout(() => {
      this.setState(GameState.PLAYING);
    }, 3000);
  }

  /**
   * Restart the game after game over
   */
  public restartGame(): void {
    const gameState = useGameStore.getState();

    log.info("Restarting game");

    // Reset any lingering bonus transition state
    this.resetBonusTransition();

    // Reset the game (this now also loads the first level)
    gameState.resetGame();
    

    // Show countdown before starting
    this.setState(GameState.COUNTDOWN, MenuType.COUNTDOWN);

    setTimeout(() => {
      this.setState(GameState.PLAYING);
    }, 3000);
  }

  /**
   * Pause the game
   */
  public pauseGame(): void {
    log.info("Pausing game");
    this.setState(GameState.PAUSED, MenuType.PAUSE);
  }

  /**
   * Resume the game from pause
   */
  public resumeGame(): void {
    log.info("Resuming game with countdown");
    this.setState(GameState.COUNTDOWN, MenuType.COUNTDOWN);

    setTimeout(() => {
      this.setState(GameState.PLAYING);
    }, 3000);
  }

  /**
   * Toggle pause state
   */
  // public togglePause(): void {
  //   const gameState = useGameStore.getState();

  //   if (gameState.isPaused) {
  //     this.resumeGame();
  //   } else {
  //     this.pauseGame();
  //   }
  // }

  /**
   * Go to settings menu
   */
  public openSettings(): void {
    const { setMenuType } = useStateStore.getState();
    // Store current menu before switching to settings
    setMenuType(MenuType.SETTINGS);
  }

  /**
   * Go back from settings menu
   */
  public closeSettings(): void {
    const { previousMenu, setMenuType } = useStateStore.getState();
    // Go back to the previous menu that was stored when opening settings
    if (previousMenu) {
      setMenuType(previousMenu);
    } else {
      // Fallback to START menu if no previous menu is stored
      setMenuType(MenuType.START);
    }
  }

  /**
   * Quit to main menu
   */
  public quitToMenu(): void {
    const gameState = useGameStore.getState();

    log.info("Quitting to main menu");
    // Reset the game
    gameState.resetGame();
    // Set to menu state with start menu
    this.setState(GameState.MENU, MenuType.START);
  }
}
