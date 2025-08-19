import { GameState, MenuType } from '../types/enums';
import { GAME_CONFIG } from '../types/constants';
import { mapDefinitions } from '../maps/mapDefinitions';
import { AudioManager } from './AudioManager';
import { AudioEvent } from '../types/enums';
import { IGameStateManager } from './interfaces/IGameStateManager';
import { log } from '../lib/logger';
import { 
  sendGameStateUpdate
} from '../lib/communicationUtils';

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
    // Validate state transition
    if (!this.isValidTransition(currentState, newState)) {
      log.game(`Invalid state transition from ${currentState} to ${newState}`);
      return;
    }

    this.previousState = currentState;
    
    // Handle exit actions for current state
    this.handleStateExit(currentState, gameStore);
    
    // Perform transition
    gameStore.setState(newState);
    
    // Handle entry actions for new state
    this.handleStateEntry(newState, gameStore);
    
    // Send state update to external systems
    sendGameStateUpdate({
      previousState: currentState,
      currentState: newState,
      timestamp: Date.now(),
    });
    
    log.game(`State transition: ${currentState} -> ${newState}`);
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
        // Stop map cleared sound if still playing
        this.audioManager.stopSound(AudioEvent.MAP_CLEARED);
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
        break;
        
      case GameState.COUNTDOWN:
        // Set countdown menu
        gameStore.setMenuType(MenuType.COUNTDOWN);
        break;
        
      case GameState.GAME_OVER:
        // Stop all sounds and play game over sound
        this.audioManager.stopAllSounds();
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
   * This only handles the initial state transition to MAP_CLEARED
   * The actual bonus/progression logic should be handled by GameManager
   */
  handleWinCondition(gameStore: any): void {
    log.game("Level completed - all bombs collected");
    
    // Record if player was grounded when map was cleared
    this.wasGroundedWhenMapCleared = gameStore.player.isGrounded;
    
    // Transition to MAP_CLEARED state
    this.transitionToState(gameStore.currentState, GameState.MAP_CLEARED, gameStore);
    
    // Don't schedule proceedAfterMapCleared here - let GameManager handle it
    // The GameManager knows when to call proceedAfterMapCleared
  }

  /**
   * Gets whether the player was grounded when map was cleared
   */
  getWasGroundedWhenMapCleared(): boolean {
    return this.wasGroundedWhenMapCleared;
  }

  /**
   * Sets the map start time (called when a map starts)
   */
  setMapStartTime(time: number): void {
    this.mapStartTime = time;
  }



  /**
   * Handles level progression
   */
  proceedToNextLevel(gameStore: any): void {
    const nextLevel = gameStore.currentLevel + 1;
    
    if (nextLevel > mapDefinitions.length) {
      // No more levels - show victory
      this.transitionToState(gameStore.currentState, GameState.VICTORY, gameStore);
    } else {
      // Load next level
      gameStore.setCurrentLevel(nextLevel);
      
      // Show countdown before starting
      this.transitionToState(gameStore.currentState, GameState.COUNTDOWN, gameStore);
      
      // Start playing after countdown
      setTimeout(() => {
        this.transitionToState(GameState.COUNTDOWN, GameState.PLAYING, gameStore);
      }, 3000);
    }
  }

  /**
   * Handles game over condition
   */
  handleGameOver(gameStore: any): void {
    log.game("Game over - no lives remaining");
    
    // Stop all active sounds
    this.audioManager.stopAllSounds();
    
    // Transition to game over state
    this.transitionToState(gameStore.currentState, GameState.GAME_OVER, gameStore);
    
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

