import { GameState, MenuType } from "../types/enums";
import { GAME_CONFIG } from "../types/constants";
import { mapDefinitions } from "../maps/mapDefinitions";
import { AudioManager } from "./AudioManager";
import { AudioEvent } from "../types/enums";
import { IGameStateManager } from "./interfaces/IGameStateManager";
import { log } from "../lib/logger";
import {
  sendGameStateUpdate,
  sendMapCompletionData,
  MapCompletionData,
} from "../lib/communicationUtils";

/**
 * Manages game state transitions and win conditions.
 * Extracted from GameManager to follow single-responsibility principle.
 *
 * Responsibilities:
 * - Handle state transitions (menu, playing, paused, etc.)
 * - Check and handle win conditions
 * - Manage level progression
 * - Handle game over conditions
 * - Send state update events to external systems
 *
 * @since 2.0.0
 */
export class GameStateManager implements IGameStateManager {
  private audioManager: AudioManager;
  private mapStartTime: number = 0;
  private wasGroundedWhenMapCleared: boolean = false;
  private previousState: GameState | null = null;

  constructor(audioManager: AudioManager) {
    this.audioManager = audioManager;
  }

  /**
   * Handles state transition with proper validation
   */
  transitionToState(
    currentState: GameState,
    newState: GameState,
    gameStore: any
  ): void {
    log.game(`Attempting state transition: ${currentState} -> ${newState}`);

    // Validate state transition
    if (!this.isValidTransition(currentState, newState)) {
      log.game(`Invalid state transition from ${currentState} to ${newState}`);
      return;
    }

    this.previousState = currentState;

    // Handle exit actions for current state
    this.handleStateExit(currentState, gameStore);

    // Perform transition
    log.game(`Setting state to: ${newState}`);
    gameStore.setState(newState);

    // Handle entry actions for new state
    this.handleStateEntry(newState, gameStore);

    // Send state update to external systems
    sendGameStateUpdate(newState);

    log.game(`State transition completed: ${currentState} -> ${newState}`);
  }

  /**
   * Checks if a state transition is valid
   * @private
   */
  private isValidTransition(from: GameState, to: GameState): boolean {
    // Define valid state transitions
    const validTransitions: Record<GameState, GameState[]> = {
      [GameState.MENU]: [GameState.COUNTDOWN, GameState.PLAYING],
      [GameState.COUNTDOWN]: [GameState.PLAYING, GameState.MENU],
      [GameState.PLAYING]: [
        GameState.PAUSED,
        GameState.MAP_CLEARED,
        GameState.GAME_OVER,
        GameState.COUNTDOWN,
        GameState.MENU,
      ],
      [GameState.PAUSED]: [GameState.PLAYING, GameState.MENU],
      [GameState.MAP_CLEARED]: [GameState.BONUS, GameState.VICTORY],
      [GameState.BONUS]: [GameState.COUNTDOWN, GameState.VICTORY],
      [GameState.VICTORY]: [GameState.MENU],
      [GameState.GAME_OVER]: [GameState.MENU],
    };

    const allowedTransitions = validTransitions[from] || [];
    return allowedTransitions.includes(to);
  }

  /**
   * Handles actions when exiting a state
   * @private
   */
  private handleStateExit(state: GameState, gameStore: any): void {
    switch (state) {
      case GameState.PLAYING:
        // Record time when leaving playing state
        const playTime = Date.now() - this.mapStartTime;
        log.game(`Exited playing state after ${playTime}ms`);
        break;

      case GameState.MAP_CLEARED:
        // Stop map cleared sound if still playing - AudioManager doesn't have stopSound method
        // The sound will naturally fade out or we can implement a proper stop mechanism later
        break;
    }
  }

  /**
   * Handles actions when entering a state
   * @private
   */
  private handleStateEntry(state: GameState, gameStore: any): void {
    switch (state) {
      case GameState.PLAYING:
        // Record when playing starts
        this.mapStartTime = Date.now();
        break;

      case GameState.MAP_CLEARED:
        // Play map cleared sound
        this.audioManager.playSound(AudioEvent.MAP_CLEARED);
        // Record if player was grounded
        this.wasGroundedWhenMapCleared = gameStore.player.isGrounded;
        // Don't set menu type - this is a transient processing state
        break;

      case GameState.COUNTDOWN:
        // Set countdown menu
        gameStore.setMenuType(MenuType.COUNTDOWN);
        break;

      case GameState.GAME_OVER:
        // Stop background music and play game over sound
        this.audioManager.stopBackgroundMusic();
        this.audioManager.playSound(AudioEvent.GAME_OVER);
        break;
    }
  }

  /**
   * Checks if the win condition has been met
   */
  checkWinCondition(collectedBombs: number): boolean {
    return collectedBombs === GAME_CONFIG.TOTAL_BOMBS;
  }

  /**
   * Handles the win condition being met
   */
  handleWinCondition(gameStore: any): void {
    log.game("Level completed - all bombs collected");
    log.game(
      `Current state: ${gameStore.currentState}, transitioning to MAP_CLEARED`
    );

    // Transition to MAP_CLEARED state
    this.transitionToState(
      gameStore.currentState,
      GameState.MAP_CLEARED,
      gameStore
    );

    log.game(
      `State transition completed. New state: ${gameStore.currentState}`
    );

    // Schedule transition to bonus screen
    setTimeout(() => {
      log.game("Proceeding to bonus screen after map cleared animation");
      this.proceedAfterMapCleared(gameStore);
    }, 3000); // Brief pause for animation
  }

  /**
   * Proceeds after map cleared animation
   * @private
   */
  private proceedAfterMapCleared(gameStore: any): void {
    // Stop power-up melody if active
    if (this.audioManager.isPowerUpMelodyActive()) {
      log.audio("Map completed during power mode, stopping PowerUp melody");
      this.audioManager.stopPowerUpMelody();
    }

    // Calculate bonus and completion data
    const completionData = this.calculateCompletionData(gameStore);

    // Send completion data to external systems
    sendMapCompletionData(completionData);

    // Determine next state based on completion
    const isLastLevel = gameStore.currentLevel >= mapDefinitions.length;
    if (isLastLevel) {
      this.transitionToState(
        GameState.MAP_CLEARED,
        GameState.VICTORY,
        gameStore
      );
    } else {
      // Show bonus screen - the bonus screen gets data from existing store properties
      this.transitionToState(GameState.MAP_CLEARED, GameState.BONUS, gameStore);
    }
  }

  /**
   * Calculates level completion data including bonuses
   * @private
   */
  private calculateCompletionData(gameStore: any): MapCompletionData {
    const livesLost = GAME_CONFIG.STARTING_LIVES - gameStore.lives;
    const effectiveCount = Math.max(0, gameStore.correctOrderCount - livesLost);

    const bonusPoints =
      GAME_CONFIG.BONUS_POINTS[
        effectiveCount as keyof typeof GAME_CONFIG.BONUS_POINTS
      ] || 0;

    const completionTime = Date.now() - this.mapStartTime;
    const currentLevel = gameStore.currentLevel;
    const isLastLevel = currentLevel >= mapDefinitions.length;

    // Get current map definition for mapName
    const currentMapDef = mapDefinitions[currentLevel - 1];
    const mapName = currentMapDef
      ? currentMapDef.name
      : `Level ${currentLevel}`;

    return {
      mapName,
      level: currentLevel,
      correctOrderCount: gameStore.correctOrderCount,
      totalBombs: GAME_CONFIG.TOTAL_BOMBS,
      score: gameStore.score,
      bonus: bonusPoints,
      hasBonus: bonusPoints > 0,
      timestamp: Date.now(),
      lives: gameStore.lives,
      multiplier: gameStore.multiplier || 1,
      completionTime,
      coinsCollected: gameStore.coinsCollected || 0,
      powerModeActivations: gameStore.powerModeActivations || 0,
    };
  }

  /**
   * Handles level progression
   */
  proceedToNextLevel(gameStore: any): void {
    const nextLevel = gameStore.currentLevel + 1;

    if (nextLevel > mapDefinitions.length) {
      // No more levels - show victory
      this.transitionToState(
        gameStore.currentState,
        GameState.VICTORY,
        gameStore
      );
    } else {
      // Load next level
      gameStore.setCurrentLevel(nextLevel);

      // Show countdown before starting
      this.transitionToState(
        gameStore.currentState,
        GameState.COUNTDOWN,
        gameStore
      );

      // Start playing after countdown
      setTimeout(() => {
        this.transitionToState(
          GameState.COUNTDOWN,
          GameState.PLAYING,
          gameStore
        );
      }, 3000);
    }
  }

  /**
   * Handles game over condition
   */
  handleGameOver(gameStore: any): void {
    log.game("Game over - no lives remaining");

    // Stop background music
    this.audioManager.stopBackgroundMusic();

    // Transition to game over state
    this.transitionToState(
      gameStore.currentState,
      GameState.GAME_OVER,
      gameStore
    );

    // Record game over statistics
    const stats = {
      finalScore: gameStore.score,
      levelReached: gameStore.currentLevel,
      bombsCollected: gameStore.collectedBombs.length,
      playTime: Date.now() - gameStore.gameStartTime,
    };

    log.game("Game over stats:", stats);
  }

  /**
   * Resets the state manager for a new game
   */
  reset(): void {
    this.mapStartTime = 0;
    this.wasGroundedWhenMapCleared = false;
    this.previousState = null;
  }

  /**
   * Gets the current map start time
   */
  getMapStartTime(): number {
    return this.mapStartTime;
  }

  /**
   * Gets the previous state
   */
  getPreviousState(): GameState | null {
    return this.previousState;
  }
}
