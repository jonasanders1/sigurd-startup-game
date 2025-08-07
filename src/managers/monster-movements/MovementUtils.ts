import { Monster, Platform, Ground } from "../../types/interfaces";
import { GAME_CONFIG } from "../../types/constants";

export class MovementUtils {
  public static checkMonsterPlatformCollision(
    monster: Monster,
    platform: any
  ): boolean {
    return (
      monster.x < platform.x + platform.width &&
      monster.x + monster.width > platform.x &&
      monster.y < platform.y + platform.height &&
      monster.y + monster.height > platform.y
    );
  }

  /**
   * Check if monster is standing on top of a platform
   */
  public static isMonsterOnPlatform(monster: Monster, platform: Platform): boolean {
    const tolerance = 2; // Small tolerance for platform detection
    return (
      monster.x < platform.x + platform.width &&
      monster.x + monster.width > platform.x &&
      Math.abs(monster.y + monster.height - platform.y) <= tolerance
    );
  }

  /**
   * Find the platform the monster is currently standing on
   */
  public static findCurrentPlatform(monster: Monster, platforms: Platform[]): Platform | null {
    for (const platform of platforms) {
      if (this.isMonsterOnPlatform(monster, platform)) {
        return platform;
      }
    }
    return null;
  }

  /**
   * Check if monster is on the ground
   */
  public static isMonsterOnGround(monster: Monster, ground: Ground): boolean {
    const tolerance = 2;
    return Math.abs(monster.y + monster.height - ground.y) <= tolerance;
  }

  /**
   * Apply gravity to monster
   */
  public static applyGravity(monster: Monster): void {
    if (!monster.velocityY) monster.velocityY = 0;
    if (!monster.gravity) monster.gravity = GAME_CONFIG.GRAVITY;
    
    monster.velocityY += monster.gravity;
    monster.y += monster.velocityY;
  }

  /**
   * Check if monster has reached the edge of a platform
   */
  public static isAtPlatformEdge(monster: Monster, platform: Platform, direction: number): boolean {
    const edgeTolerance = 5;
    
    if (direction > 0) {
      // Moving right, check right edge
      return monster.x + monster.width >= platform.x + platform.width - edgeTolerance;
    } else {
      // Moving left, check left edge
      return monster.x <= platform.x + edgeTolerance;
    }
  }

  /**
   * Check if monster has fallen off the platform
   */
  public static hasFallenOffPlatform(monster: Monster, platform: Platform): boolean {
    return (
      monster.x + monster.width < platform.x || // Fell off left edge
      monster.x > platform.x + platform.width    // Fell off right edge
    );
  }

  /**
   * Determine which side of a platform a monster spawned on
   */
  public static determineSpawnSide(monster: Monster, platform: Platform): 'left' | 'right' {
    const platformCenter = platform.x + platform.width / 2;
    return monster.x < platformCenter ? 'left' : 'right';
  }

  /**
   * Check if monster should fall based on walk count and position
   */
  public static shouldFall(
    monster: Monster, 
    platform: Platform, 
    originalSpawnX: number, 
    currentWalkCount: number, 
    walkLengths: number
  ): boolean {
    // Check if we've completed the required number of walks
    if (currentWalkCount >= walkLengths) {
      // Check if we're back at the original spawn position (with some tolerance)
      const tolerance = 10;
      const isAtSpawnPosition = Math.abs(monster.x - originalSpawnX) <= tolerance;
      
      if (isAtSpawnPosition) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if monster would be outside map boundaries at the given position
   */
  public static isOutsideBoundaries(
    monster: Monster,
    newX: number,
    newY: number
  ): boolean {
    return (
      newX <= 0 ||
      newX + monster.width >= GAME_CONFIG.CANVAS_WIDTH ||
      newY <= 0 ||
      newY + monster.height >= GAME_CONFIG.CANVAS_HEIGHT
    );
  }

  /**
   * Clamp monster position to map boundaries
   */
  public static clampToBoundaries(monster: Monster): void {
    monster.x = Math.max(0, Math.min(monster.x, GAME_CONFIG.CANVAS_WIDTH - monster.width));
    monster.y = Math.max(0, Math.min(monster.y, GAME_CONFIG.CANVAS_HEIGHT - monster.height));
  }

  /**
   * Check if movement to new position is safe (no platform collisions and within boundaries)
   */
  public static isMovementSafe(
    monster: Monster,
    newX: number,
    newY: number,
    platforms: any[]
  ): boolean {
    // Check boundary collisions
    if (this.isOutsideBoundaries(monster, newX, newY)) {
      return false;
    }

    // Check platform collisions
    for (const platform of platforms) {
      if (this.checkMonsterPlatformCollision({ ...monster, x: newX, y: newY }, platform)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check if movement to new position is safe (including ground collision)
   */
  public static isMovementSafeWithGround(
    monster: Monster,
    newX: number,
    newY: number,
    platforms: any[],
    ground: any
  ): boolean {
    // Check boundary collisions
    if (this.isOutsideBoundaries(monster, newX, newY)) {
      return false;
    }

    // Check platform collisions
    for (const platform of platforms) {
      if (this.checkMonsterPlatformCollision({ ...monster, x: newX, y: newY }, platform)) {
        return false;
      }
    }

    // Check ground collision
    if (ground) {
      if (this.checkMonsterPlatformCollision({ ...monster, x: newX, y: newY }, ground)) {
        return false;
      }
    }

    return true;
  }
} 