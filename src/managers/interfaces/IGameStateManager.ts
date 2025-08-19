import { GameState } from '../../types/enums';

/**
 * Interface for GameStateManager
 * Defines the contract for managing game state transitions and win conditions
 * 
 * @since 2.0.0
 */
export interface IGameStateManager {
  /**
   * Handles state transition with proper validation
   * @param currentState - Current game state
   * @param newState - State to transition to
   * @param gameStore - Game store instance
   */
  transitionToState(
    currentState: GameState,
    newState: GameState,
    gameStore: any
  ): void;

  /**
   * Checks if the win condition has been met
   * @param collectedBombs - Number of bombs collected
   * @returns True if win condition is met
   */
  checkWinCondition(collectedBombs: number): boolean;

  /**
   * Handles the win condition being met
   * @param gameStore - Game store instance
   */
  handleWinCondition(gameStore: any): void;

  /**
   * Handles level progression
   * @param gameStore - Game store instance
   */
  proceedToNextLevel(gameStore: any): void;

  /**
   * Handles game over condition
   * @param gameStore - Game store instance
   */
  handleGameOver(gameStore: any): void;

  /**
   * Resets the state manager for a new game
   */
  reset(): void;

  /**
   * Gets the current map start time
   * @returns Map start time in milliseconds
   */
  getMapStartTime(): number;

  /**
   * Gets the previous state
   * @returns Previous game state or null
   */
  getPreviousState(): GameState | null;

  /**
   * Gets whether the player was grounded when map was cleared
   * @returns True if player was grounded
   */
  getWasGroundedWhenMapCleared(): boolean;

  /**
   * Sets the map start time
   * @param time - Time in milliseconds
   */
  setMapStartTime(time: number): void;
}