import {
  useGameStore,
  useStateStore,
  useScoreStore,
  useLevelStore,
  useCoinStore,
} from "../stores/gameStore";

import { GameState, MenuType, AudioEvent, TutorialMissionId, PauseReason } from "../types/enums";
import { TUTORIAL_MISSIONS, TUTORIAL_MISSION_ORDER } from "../tutorials/missions";
import type { TutorialManager } from "./TutorialManager";
import { DEV_CONFIG, GAME_CONFIG } from "../types/constants";
import { sendGameStateUpdate } from "../lib/communicationUtils";
import { log } from "../lib/logger";
import type { AudioManager } from "./AudioManager";
import type { ScalingManager } from "./ScalingManager";
import type { OptimizedSpawnManager } from "./OptimizedSpawnManager";
import type { OptimizedRespawnManager } from "./OptimizedRespawnManager";

export class GameStateManager {
  private previousGameState: GameState = GameState.MENU;
  // Tracks which state preceded the current COUNTDOWN so PLAYING can
  // distinguish a resume-from-pause (no spawn-timing reset) from a
  // fresh-start countdown (needs spawn-timing reset).
  private stateBeforeCountdown: GameState | null = null;
  private isBackgroundMusicPlaying = false;
  private devModeInitialized = false;
  private bonusTransitionInProgress = false;
  private activeTimers: Set<ReturnType<typeof setTimeout>> = new Set();
  private onRestartCallback?: () => void;

  // Dependencies
  private audioManager: AudioManager;
  private scalingManager: ScalingManager;
  private monsterSpawnManager: OptimizedSpawnManager;
  private monsterRespawnManager: OptimizedRespawnManager;
  private tutorialManager?: TutorialManager;
  private onTutorialMapLoad?: (mapId: TutorialMissionId) => void;

  private scheduleTimer(callback: () => void, delay: number): ReturnType<typeof setTimeout> {
    const id = setTimeout(() => {
      this.activeTimers.delete(id);
      callback();
    }, delay);
    this.activeTimers.add(id);
    return id;
  }

  public clearAllTimers(): void {
    for (const id of this.activeTimers) {
      clearTimeout(id);
    }
    this.activeTimers.clear();
  }

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

  public setOnRestartCallback(callback: () => void): void {
    this.onRestartCallback = callback;
  }

  // Pause/resume the spawn + respawn managers under the PowerMode reason,
  // matching how ScalingManager.pauseForPowerMode/resumeFromPowerMode work.
  // Encapsulating the pair here keeps the spawn/respawn manager refs
  // private and gives coinManager a single named call instead of three
  // optional-chained reach-ins.
  public pauseForPowerMode(): void {
    this.monsterSpawnManager.pause(PauseReason.PowerMode);
    this.monsterRespawnManager.pause(PauseReason.PowerMode);
  }

  public resumeFromPowerMode(): void {
    this.monsterSpawnManager.resume(PauseReason.PowerMode);
    this.monsterRespawnManager.resume(PauseReason.PowerMode);
  }

  // Expose statuses for diagnostic logging in coinManager.
  public getPowerModePauseStatus(): {
    spawnReasons: PauseReason[];
    respawnReasons: PauseReason[];
  } {
    return {
      spawnReasons: this.monsterSpawnManager.getPauseStatus().pauseReasons,
      respawnReasons: this.monsterRespawnManager.getPauseStatus().pauseReasons,
    };
  }

  public initializeDevMode(): void {
    const { resetGameState, nextLevel, loseLife, setState, lives } =
      useStateStore.getState();
    const { setMultiplier } = useScoreStore.getState();
    const { addScore } = useScoreStore.getState();
    const { resetLevelState, addLevelResult } = useLevelStore.getState();

    // Reset game state first
    resetGameState();
    // Apply mock data AFTER reset
    addScore(DEV_CONFIG.MOCK_DATA.score);

    // Add mock level history if provided and target state is GAME_OVER or VICTORY
    if (
      DEV_CONFIG.MOCK_DATA.levelHistory &&
      (DEV_CONFIG.TARGET_STATE === ("GAME_OVER" as any) ||
        DEV_CONFIG.TARGET_STATE === ("VICTORY" as any))
    ) {
      // Clear existing history and add mock data
      DEV_CONFIG.MOCK_DATA.levelHistory.forEach((levelResult: any) => {
        addLevelResult(levelResult);
      });
    }

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
    log.debug(
      `DEV_MODE: Setting multiplier to ${DEV_CONFIG.MOCK_DATA.multiplier}x`
    );
    setMultiplier(
      DEV_CONFIG.MOCK_DATA.multiplier,
      DEV_CONFIG.MOCK_DATA.multiplierScore
    );

    log.debug(
      `DEV_MODE initialized with state: ${DEV_CONFIG.TARGET_STATE}, level: ${DEV_CONFIG.TARGET_LEVEL}`
    );
    this.devModeInitialized = true;
  }

  private setDevModeState(targetState: string): void {
    const { resetFoundingState, collectFounding } = useStateStore.getState();

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
        // Mock founding collection
        resetFoundingState();
        for (let i = 0; i < DEV_CONFIG.MOCK_DATA.correctOrderCount; i++) {
          collectFounding(i + 1);
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
    // Get the actual current map name from levelStore, not menuType
    const levelStore = useLevelStore.getState();
    sendGameStateUpdate(state, levelStore.currentMap?.name);
  }

  private handleStateTransition(state: GameState): void {
    // IMPORTANT: Handle difficulty pausing first (stops all managers)
    // This must happen before background music to prevent race conditions
    this.handleDifficultyPause(state);

    // Then handle background music
    this.handleBackgroundMusic(state);
  }

  public handleBackgroundMusic(currentState: GameState): void {
    if (this.previousGameState !== currentState) {
      log.audio(
        `Game state changed: ${this.previousGameState} -> ${currentState}`
      );
    }

    // Tutorials run silent — kill any leftover loop and bail before the
    // PLAYING start branch can fire.
    const inTutorial = useStateStore.getState().tutorialMission !== null;
    if (inTutorial) {
      if (this.isBackgroundMusicPlaying) {
        this.audioManager.stopBackgroundMusic();
        this.isBackgroundMusicPlaying = false;
      }
      this.previousGameState = currentState;
      return;
    }

    if (
      currentState === GameState.PLAYING &&
      !this.audioManager.isPowerUpMelodyActive()
    ) {
      if (!this.isBackgroundMusicPlaying) {
        log.audio("Starting background music");
        this.audioManager.playSound(AudioEvent.BACKGROUND_MUSIC, currentState);
        this.isBackgroundMusicPlaying = true;
      }
    } else if (currentState !== GameState.PLAYING) {
      if (this.isBackgroundMusicPlaying) {
        log.audio(`Stopping background music (state: ${currentState})`);
        this.audioManager.stopBackgroundMusic();
        this.isBackgroundMusicPlaying = false;
      }
    }

    // Also stop music if power-up melody becomes active during PLAYING
    if (
      this.audioManager.isPowerUpMelodyActive() &&
      this.isBackgroundMusicPlaying
    ) {
      log.audio("PowerUp melody active, stopping background music");
      this.audioManager.stopBackgroundMusic();
      this.isBackgroundMusicPlaying = false;
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

        // Check if we're coming from COUNTDOWN state (game just started/respawned)
        const wasCountdown = this.previousGameState === GameState.COUNTDOWN;
        // Resume-from-pause also goes PAUSED -> COUNTDOWN -> PLAYING, but the
        // pause clock already accounts for paused time, so resetSpawnTiming
        // would wrongly re-fire already-executed spawns (duplicating monsters).
        const isResumeFromPause =
          wasCountdown && this.stateBeforeCountdown === GameState.PAUSED;

        // 1. Resume spawn/respawn managers first
        this.monsterSpawnManager.resume();
        this.monsterRespawnManager.resume();

        // 1b. Reset spawn timing only on a fresh-start countdown, not on resume from pause.
        if (wasCountdown && !isResumeFromPause) {
          this.monsterSpawnManager.resetSpawnTiming();
          log.spawn("Reset spawn timing after countdown");
        }

        this.stateBeforeCountdown = null;

        // 2. Resume scaling manager (respects power mode state)
        if (!this.scalingManager.isCurrentlyPausedByPowerMode()) {
          this.scalingManager.resume();
        }
        this.scalingManager.resumeAllMonsterScaling();

        // 3. Resume coin manager
        if (coinManager) {
          coinManager.resume();
        }

        // 4. Un-mute the P-coin ambient loop if a coin is still alive.
        this.audioManager.resumePowerCoinAmbient();

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

        // 5. Mute the P-coin ambient loop without tearing it down so the
        //    same playhead resumes when the user un-pauses.
        this.audioManager.pausePowerCoinAmbient();

        log.debug("Game state PAUSED: All managers paused in correct order");
        break;

      case GameState.COUNTDOWN:
        // Remember what we came from so the PLAYING handler can distinguish
        // a resume-from-pause from a fresh-start countdown.
        this.stateBeforeCountdown = this.previousGameState;
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

        // 5. Tear down the P-coin loop — the level/run is over.
        this.audioManager.stopPowerCoinAmbient();

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

        // 5. Tear down the P-coin loop — the map is done.
        this.audioManager.stopPowerCoinAmbient();

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

    this.scheduleTimer(() => {
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
      this.scheduleTimer(() => {
        log.info("Transition delay complete, proceeding to next level now");

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

    this.scheduleTimer(() => {
      this.setState(GameState.PLAYING);
    }, 3000);
  }

  /**
   * Restart the game after game over
   */
  public restartGame(): void {
    const stateStore = useStateStore.getState();
    const gameState = useGameStore.getState();

    log.info("Restarting game");

    this.clearAllTimers();
    this.resetBonusTransition();

    // Tutorial-aware restart — re-run the active mission instead of dropping
    // the player into the main game's Level 1 with the tutorial overlay still
    // visible.
    const activeMission = stateStore.tutorialMission;
    if (activeMission) {
      this.startTutorialMission(activeMission);
      return;
    }

    log.data('CoinSpawn: Game restart - full reset, all coin spawn counters cleared');
    gameState.resetGame();
    this.onRestartCallback?.();
    this.setState(GameState.COUNTDOWN, MenuType.COUNTDOWN);
    this.scheduleTimer(() => {
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

    this.scheduleTimer(() => {
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

  public openControls(): void {
    const { setMenuType } = useStateStore.getState();
    setMenuType(MenuType.CONTROLS);
  }

  public setTutorialManager(manager: TutorialManager): void {
    this.tutorialManager = manager;
  }

  public setOnTutorialMapLoad(cb: (id: TutorialMissionId) => void): void {
    this.onTutorialMapLoad = cb;
  }

  public openTutorialSelect(): void {
    const { setMenuType, setPendingTutorialMission } = useStateStore.getState();
    setPendingTutorialMission(null);
    setMenuType(MenuType.TUTORIAL_SELECT);
  }

  public openTutorialBrief(id: TutorialMissionId): void {
    const { setMenuType, setPendingTutorialMission } = useStateStore.getState();
    setPendingTutorialMission(id);
    setMenuType(MenuType.TUTORIAL_BRIEF);
  }

  public goToNextTutorialMission(): void {
    const current = this.lastFinishedMissionId();
    if (current === null) {
      this.openTutorialSelect();
      return;
    }
    const idx = TUTORIAL_MISSION_ORDER.indexOf(current);
    const next = TUTORIAL_MISSION_ORDER[idx + 1];
    if (next) this.openTutorialBrief(next);
    else this.openTutorialSelect();
  }

  public goToPreviousTutorialMission(): void {
    const current = this.lastFinishedMissionId();
    if (current === null) {
      this.openTutorialSelect();
      return;
    }
    const idx = TUTORIAL_MISSION_ORDER.indexOf(current);
    const prev = TUTORIAL_MISSION_ORDER[idx - 1];
    if (prev) this.openTutorialBrief(prev);
    else this.openTutorialSelect();
  }

  private lastFinishedMissionId(): TutorialMissionId | null {
    const { tutorialResult, pendingTutorialMission } =
      useStateStore.getState();
    return tutorialResult?.missionId ?? pendingTutorialMission ?? null;
  }

  public startTutorialMission(id: TutorialMissionId): void {
    log.info(`Starting tutorial mission: ${id}`);
    this.clearAllTimers();
    this.resetBonusTransition();

    // Mark tutorial state — gates score/credit/scaling logic elsewhere.
    this.tutorialManager?.startMission(id);

    // Load the mission's map (skips deductCredits / scoring path).
    this.onTutorialMapLoad?.(id);

    this.setState(GameState.COUNTDOWN, MenuType.COUNTDOWN);
    this.scheduleTimer(() => {
      this.setState(GameState.PLAYING);
    }, 3000);
  }

  public skipTutorialMission(): void {
    this.tutorialManager?.skipMission();
    this.finishTutorialMission();
  }

  /**
   * Called when TutorialManager has set tutorialResult (mission complete or
   * skipped). Cleans up game-loop side effects and shows the result menu.
   */
  public finishTutorialMission(): void {
    log.info("Tutorial mission ended");
    this.clearAllTimers();
    const stateStore = useStateStore.getState();
    stateStore.setTutorialMission(null);
    this.setState(GameState.MENU, MenuType.TUTORIAL_RESULT);
  }
  /**
   * Go back from settings menu
   */
  public closeNestedMenu(): void {
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
   * Go back from controls menu
   */

  /**
   * Quit to main menu
   */
  public quitToMenu(): void {
    const gameState = useGameStore.getState();
    const stateStore = useStateStore.getState();

    log.info("Quitting to main menu");

    this.clearAllTimers();

    // Clear any active tutorial state so InGameMenu/HUD don't carry over.
    this.tutorialManager?.exitMission();
    stateStore.setTutorialResult(null);

    log.data('CoinSpawn: Quit to menu - full reset, all coin spawn counters cleared');
    gameState.resetGame();
    this.setState(GameState.MENU, MenuType.START);
  }
}
