import { Player, Monster, Bomb, Platform, Ground, Coin } from '../types/interfaces';
import { CollisionManager } from './CollisionManager';
import { AudioManager } from './AudioManager';
import { AudioEvent } from '../types/enums';
import { GAME_CONFIG, DEV_CONFIG } from '../types/constants';
import { IGameplayCollisionManager, CollisionResults } from './interfaces/IGameplayCollisionManager';
import { log } from '../lib/logger';

/**
 * Manages gameplay-related collision detection and resolution.
 * Extracted from GameManager to follow single-responsibility principle.
 * 
 * This manager is responsible for:
 * - Platform and ground collision resolution
 * - Bomb collection handling
 * - Coin collection handling
 * - Monster collision handling (including power mode interactions)
 * 
 * Note: This is separate from the low-level CollisionManager which only detects collisions.
 * This manager handles the gameplay consequences of those collisions.
 * 
 * @since 2.0.0
 */
export class GameplayCollisionManager implements IGameplayCollisionManager {
  private collisionManager: CollisionManager;
  private audioManager: AudioManager;

  constructor(collisionManager: CollisionManager, audioManager: AudioManager) {
    this.collisionManager = collisionManager;
    this.audioManager = audioManager;
  }

  /**
   * Handles all gameplay collisions for a frame
   * Returns collision results that need to be applied to game state
   */
  handleAllCollisions(
    player: Player,
    platforms: Platform[],
    ground: Ground | null,
    bombs: Bomb[],
    coins: Coin[],
    monsters: Monster[],
    isPowerModeActive: boolean
  ): CollisionResults {
    const results: CollisionResults = {
      playerUpdate: null,
      collectedBomb: null,
      collectedCoin: null,
      hitMonster: null,
      killedMonster: null,
      playerDied: false,
      monsterKillPoints: 0,
    };

    // Handle platform collisions
    const platformResult = this.handlePlatformCollisions(player, platforms);
    if (platformResult) {
      results.playerUpdate = platformResult;
    }

    // Handle ground collisions
    if (ground) {
      const groundResult = this.handleGroundCollisions(
        results.playerUpdate || player,
        ground
      );
      if (groundResult) {
        results.playerUpdate = groundResult;
      }
    }

    // Handle bomb collisions
    const collectedBomb = this.handleBombCollisions(player, bombs);
    if (collectedBomb) {
      results.collectedBomb = collectedBomb;
    }

    // Handle coin collisions
    const collectedCoin = this.handleCoinCollisions(player, coins);
    if (collectedCoin) {
      results.collectedCoin = collectedCoin;
    }

    // Handle monster collisions
    const monsterResult = this.handleMonsterCollisions(
      player,
      monsters,
      isPowerModeActive
    );
    if (monsterResult.hitMonster) {
      results.hitMonster = monsterResult.hitMonster;
      results.killedMonster = monsterResult.killedMonster;
      results.playerDied = monsterResult.playerDied;
      results.monsterKillPoints = monsterResult.points;
    }

    return results;
  }

  /**
   * Handles platform collision resolution
   * @private
   */
  private handlePlatformCollisions(
    player: Player,
    platforms: Platform[]
  ): Player | null {
    const collision = this.collisionManager.checkPlayerPlatformCollision(player, platforms);
    
    if (collision.hasCollision && collision.normal && collision.penetration) {
      const updatedPlayer = { ...player };

      if (collision.normal.y === -1) {
        // Landing on top of platform
        updatedPlayer.y = updatedPlayer.y - collision.penetration;
        updatedPlayer.velocityY = 0;
        updatedPlayer.isGrounded = true;
      } else if (collision.normal.y === 1) {
        // Hitting platform from below
        updatedPlayer.y = updatedPlayer.y + collision.penetration;
        updatedPlayer.velocityY = 0;
      } else if (collision.normal.x === 1) {
        // Hitting platform from the right
        updatedPlayer.x = updatedPlayer.x + collision.penetration;
        updatedPlayer.velocityX = 0;
      } else if (collision.normal.x === -1) {
        // Hitting platform from the left
        updatedPlayer.x = updatedPlayer.x - collision.penetration;
        updatedPlayer.velocityX = 0;
      }

      return updatedPlayer;
    }

    return null;
  }

  /**
   * Handles ground collision resolution
   * @private
   */
  private handleGroundCollisions(player: Player, ground: Ground): Player | null {
    const collision = this.collisionManager.checkPlayerGroundCollision(player, ground);
    
    if (collision.hasCollision && collision.normal && collision.penetration) {
      const updatedPlayer = { ...player };

      if (collision.normal.y === -1) {
        // Landing on top of ground
        updatedPlayer.y = updatedPlayer.y - collision.penetration;
        updatedPlayer.velocityY = 0;
        updatedPlayer.isGrounded = true;
      } else if (collision.normal.y === 1) {
        // Hitting ground from below (shouldn't normally happen)
        updatedPlayer.y = updatedPlayer.y + collision.penetration;
        updatedPlayer.velocityY = 0;
      } else if (collision.normal.x === 1) {
        // Hitting ground from the right
        updatedPlayer.x = updatedPlayer.x + collision.penetration;
        updatedPlayer.velocityX = 0;
      } else if (collision.normal.x === -1) {
        // Hitting ground from the left
        updatedPlayer.x = updatedPlayer.x - collision.penetration;
        updatedPlayer.velocityX = 0;
      }

      return updatedPlayer;
    }

    return null;
  }

  /**
   * Handles bomb collection
   * @private
   */
  private handleBombCollisions(player: Player, bombs: Bomb[]): Bomb | null {
    const collectedBomb = this.collisionManager.checkPlayerBombCollision(player, bombs);
    
    if (collectedBomb) {
      this.audioManager.playSound(AudioEvent.BOMB_COLLECT);
      return collectedBomb;
    }

    return null;
  }

  /**
   * Handles coin collection
   * @private
   */
  private handleCoinCollisions(player: Player, coins: Coin[]): Coin | null {
    const collectedCoin = this.collisionManager.checkPlayerCoinCollision(player, coins);
    
    if (collectedCoin) {
      this.audioManager.playSound(AudioEvent.COIN_COLLECT);

      // Play special sound for power coins
      if (collectedCoin.type === "POWER") {
        this.audioManager.playSound(AudioEvent.POWER_COIN_ACTIVATE);
      }

      return collectedCoin;
    }

    return null;
  }

  /**
   * Handles monster collisions, including power mode interactions
   * @private
   */
  private handleMonsterCollisions(
    player: Player,
    monsters: Monster[],
    isPowerModeActive: boolean
  ): MonsterCollisionResult {
    const result: MonsterCollisionResult = {
      hitMonster: null,
      killedMonster: null,
      playerDied: false,
      points: 0,
    };

    const hitMonster = this.collisionManager.checkPlayerMonsterCollision(player, monsters);
    
    if (hitMonster) {
      result.hitMonster = hitMonster;

      // Check if god mode is enabled
      if (DEV_CONFIG.GOD_MODE) {
        log.dev("God mode enabled - player is invincible to monsters");
        return result;
      }

      // Check if power mode is active
      if (isPowerModeActive) {
        // Monster is killed during power mode
        result.killedMonster = hitMonster;
        result.points = this.calculateMonsterKillPoints();
        
        log.debug(`Monster killed during power mode: ${result.points} points`);
        
        // Play monster kill sound
        this.audioManager.playSound(AudioEvent.COIN_COLLECT);
      } else {
        // Normal monster collision - player dies
        this.audioManager.playSound(AudioEvent.MONSTER_HIT);
        result.playerDied = true;
      }
    }

    return result;
  }

  /**
   * Calculates points for killing a monster
   * This is a simplified version - the actual calculation should come from CoinManager
   * @private
   */
  private calculateMonsterKillPoints(): number {
    // Base points for killing a monster
    // The actual implementation should get this from CoinManager's progressive bonus system
    return GAME_CONFIG.MONSTER_KILL_POINTS;
  }
}

/**
 * Result from monster collision handling
 */
interface MonsterCollisionResult {
  hitMonster: Monster | null;
  killedMonster: Monster | null;
  playerDied: boolean;
  points: number;
}