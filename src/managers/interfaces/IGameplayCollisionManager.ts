import { Player, Monster, Bomb, Platform, Ground, Coin } from '../../types/interfaces';

/**
 * Interface for GameplayCollisionManager
 * Defines the contract for handling gameplay-related collision detection and resolution
 * 
 * @since 2.0.0
 */
export interface IGameplayCollisionManager {
  /**
   * Handles all gameplay collisions for a frame
   * @param player - Current player state
   * @param platforms - Array of platforms
   * @param ground - Ground object (or null)
   * @param bombs - Array of bombs
   * @param coins - Array of coins
   * @param monsters - Array of monsters
   * @param isPowerModeActive - Whether power mode is currently active
   * @returns Collision results that need to be applied to game state
   */
  handleAllCollisions(
    player: Player,
    platforms: Platform[],
    ground: Ground | null,
    bombs: Bomb[],
    coins: Coin[],
    monsters: Monster[],
    isPowerModeActive: boolean
  ): CollisionResults;
}

/**
 * Results from collision handling that need to be applied to game state
 */
export interface CollisionResults {
  playerUpdate: Player | null;
  collectedBomb: Bomb | null;
  collectedCoin: Coin | null;
  hitMonster: Monster | null;
  killedMonster: Monster | null;
  playerDied: boolean;
  monsterKillPoints: number;
}