import { Player } from '../../types/interfaces';
import { GameState } from '../../types/enums';

/**
 * Interface for PlayerPhysicsManager
 * Defines the contract for handling player physics and movement
 * 
 * @since 2.0.0
 */
export interface IPlayerPhysicsManager {
  /**
   * Updates the player's physics based on input and delta time
   * @param player - Current player state
   * @param deltaTime - Time elapsed since last frame in milliseconds
   * @param gameState - Current game state (for animation purposes)
   * @returns Updated player state after physics calculations
   */
  update(player: Player, deltaTime: number, gameState: GameState): Player;

  /**
   * Resets the player's physics state
   * Used when respawning or starting a new level
   */
  reset(): void;
}