import { Coin, Platform, Ground, CoinPhysicsConfig } from "../types/interfaces";
import { GAME_CONFIG } from "../types/constants";
import { COIN_PHYSICS } from "../config/coinTypes";
import { log } from "../lib/logger";

export class CoinPhysics {
  /**
   * Updates the physics and movement of a coin based on its physics configuration
   */
  static updateCoin(
    coin: Coin,
    platforms: Platform[],
    ground: Ground,
    physicsConfig?: CoinPhysicsConfig,
    deltaTime?: number
  ): void {
    if (coin.isCollected) return;

    if (physicsConfig) {
      // Use the provided physics configuration
      if (physicsConfig.hasGravity) {
        const frameMultiplier = deltaTime ? deltaTime / 16.67 : 1; // 16.67ms = 60fps
        coin.velocityY += GAME_CONFIG.COIN_GRAVITY * frameMultiplier;
      }

      const frameMultiplier = deltaTime ? deltaTime / 16.67 : 1; // 16.67ms = 60fps
      coin.x += coin.velocityX * frameMultiplier;
      coin.y += coin.velocityY * frameMultiplier;

      if (physicsConfig.reflects) {
        this.handleReflectiveCollisions(coin, platforms, ground);
      } else if (physicsConfig.bounces) {
        this.handleBouncingCollisions(coin, platforms, ground);
      }

      // Use custom update function if provided
      if (physicsConfig.customUpdate) {
        physicsConfig.customUpdate(coin, platforms, ground, deltaTime);
      }
    } else {
      // Fallback to standard physics
      this.updateStandardCoin(coin, platforms, ground, deltaTime);
    }
  }

  /**
   * Legacy method for backward compatibility - uses standard physics
   */
  static updateStandardCoin(
    coin: Coin,
    platforms: Platform[],
    ground: Ground,
    deltaTime?: number
  ): void {
    this.updateCoin(coin, platforms, ground, COIN_PHYSICS.STANDARD, deltaTime);
  }

  /**
   * Legacy method for backward compatibility - uses power coin physics
   */
  static updatePowerCoin(
    coin: Coin,
    platforms: Platform[],
    ground: Ground,
    deltaTime?: number
  ): void {
    this.updateCoin(coin, platforms, ground, COIN_PHYSICS.POWER, deltaTime);
  }

  /**
   * Handles collisions with bouncing behavior (damped bounces)
   */
  private static handleBouncingCollisions(
    coin: Coin,
    platforms: Platform[],
    ground: Ground
  ): void {
    // Check collisions with boundaries
    this.handleBoundaryCollisions(coin);

    // Check collisions with platforms
    this.handlePlatformCollisions(coin, platforms);

    // Check collisions with ground
    this.handleGroundCollisions(coin, ground);
  }

  /**
   * Handles collisions with reflective behavior (perfect reflection)
   */
  private static handleReflectiveCollisions(
    coin: Coin,
    platforms: Platform[],
    ground: Ground
  ): void {
    // Check collisions with boundaries and reflect
    this.handlePowerCoinBoundaryCollisions(coin);

    // Check collisions with platforms and reflect
    this.handlePowerCoinPlatformCollisions(coin, platforms);

    // Check collisions with ground and reflect
    this.handlePowerCoinGroundCollisions(coin, ground);
  }

  /**
   * Handles collisions with canvas boundaries
   */
  private static handleBoundaryCollisions(coin: Coin): void {
    // Left and right boundaries
    if (coin.x <= 0) {
      coin.x = 0;
      coin.velocityX =
        Math.abs(coin.velocityX) * GAME_CONFIG.COIN_BOUNCE_DAMPING;
    } else if (coin.x + coin.width >= GAME_CONFIG.CANVAS_WIDTH) {
      coin.x = GAME_CONFIG.CANVAS_WIDTH - coin.width;
      coin.velocityX =
        -Math.abs(coin.velocityX) * GAME_CONFIG.COIN_BOUNCE_DAMPING;
    }

    // Top boundary (ceiling)
    if (coin.y <= 0) {
      coin.y = 0;
      coin.velocityY =
        Math.abs(coin.velocityY) * GAME_CONFIG.COIN_BOUNCE_DAMPING;
    }
  }

  /**
   * Handles collisions with canvas boundaries for power coins (simple reflection)
   */
  private static handlePowerCoinBoundaryCollisions(coin: Coin): void {
    // Left boundary
    if (coin.x <= 0) {
      coin.x = 0;
      coin.velocityX = Math.abs(coin.velocityX); // Reflect horizontally
    }
    // Right boundary
    else if (coin.x + coin.width >= GAME_CONFIG.CANVAS_WIDTH) {
      coin.x = GAME_CONFIG.CANVAS_WIDTH - coin.width;
      coin.velocityX = -Math.abs(coin.velocityX); // Reflect horizontally
    }

    // Top boundary
    if (coin.y <= 0) {
      coin.y = 0;
      coin.velocityY = Math.abs(coin.velocityY); // Reflect vertically
    }
    // Bottom boundary - this should rarely happen since we have ground collision
    else if (coin.y + coin.height >= GAME_CONFIG.CANVAS_HEIGHT) {
      coin.y = GAME_CONFIG.CANVAS_HEIGHT - coin.height;
      coin.velocityY = -Math.abs(coin.velocityY); // Reflect vertically
    }
  }

  /**
   * Handles collisions with platforms
   */
  private static handlePlatformCollisions(
    coin: Coin,
    platforms: Platform[]
  ): void {
    platforms.forEach((platform) => {
      if (this.isColliding(coin, platform)) {
        // Determine collision side and bounce accordingly
        const coinCenterX = coin.x + coin.width / 2;
        const coinCenterY = coin.y + coin.height / 2;
        const platformCenterX = platform.x + platform.width / 2;
        const platformCenterY = platform.y + platform.height / 2;

        const deltaX = coinCenterX - platformCenterX;
        const deltaY = coinCenterY - platformCenterY;

        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          // Horizontal collision
          if (deltaX > 0) {
            coin.x = platform.x + platform.width;
            coin.velocityX =
              Math.abs(coin.velocityX) * GAME_CONFIG.COIN_BOUNCE_DAMPING;
          } else {
            coin.x = platform.x - coin.width;
            coin.velocityX =
              -Math.abs(coin.velocityX) * GAME_CONFIG.COIN_BOUNCE_DAMPING;
          }
        } else {
          // Vertical collision
          if (deltaY > 0) {
            coin.y = platform.y + platform.height;
            coin.velocityY =
              Math.abs(coin.velocityY) * GAME_CONFIG.COIN_BOUNCE_DAMPING;
          } else {
            coin.y = platform.y - coin.height;
            coin.velocityY =
              -Math.abs(coin.velocityY) * GAME_CONFIG.COIN_BOUNCE_DAMPING;
          }
        }
      }
    });
  }

  /**
   * Handles collisions with platforms for power coins (using FloaterMovement logic)
   */
  private static handlePowerCoinPlatformCollisions(
    coin: Coin,
    platforms: Platform[]
  ): void {
    // Check collisions with platforms in order, but only handle the first collision
    for (const platform of platforms) {
      if (this.isColliding(coin, platform)) {
        // Use FloaterMovement's collision detection logic
        const collisionNormal = this.calculateCollisionNormal(coin, platform);

        // Debug: Log collision info (throttled)
        if (Math.random() < 0.1) {
          log.debug(
            `P-coin platform collision - Normal: (${collisionNormal.x.toFixed(
              2
            )}, ${collisionNormal.y.toFixed(
              2
            )}), Velocity before: (${coin.velocityX.toFixed(
              2
            )}, ${coin.velocityY.toFixed(2)})`
          );
        }

        // Reflect the velocity vector using the normal (same as FloaterMovement)
        const dotProduct =
          coin.velocityX * collisionNormal.x +
          coin.velocityY * collisionNormal.y;
        const oldVX = coin.velocityX;
        const oldVY = coin.velocityY;
        coin.velocityX = coin.velocityX - 2 * dotProduct * collisionNormal.x;
        coin.velocityY = coin.velocityY - 2 * dotProduct * collisionNormal.y;

        // Debug: Log velocity after reflection
        if (Math.random() < 0.1) {
          log.debug(
            `P-coin platform collision - Velocity after: (${coin.velocityX.toFixed(
              2
            )}, ${coin.velocityY.toFixed(2)})`
          );
        }

        // Simple repositioning - just move coin out of collision
        if (collisionNormal.x !== 0) {
          // Horizontal collision
          if (collisionNormal.x > 0) {
            coin.x = platform.x + platform.width + 1;
          } else {
            coin.x = platform.x - coin.width - 1;
          }
        } else {
          // Vertical collision
          if (collisionNormal.y > 0) {
            coin.y = platform.y + platform.height + 1;
          } else {
            coin.y = platform.y - coin.height - 1;
          }
        }

        // Only handle one collision per frame to avoid multiple reflections
        break;
      }
    }
  }

  /**
   * Handles collisions with ground
   */
  private static handleGroundCollisions(coin: Coin, ground: Ground): void {
    if (this.isColliding(coin, ground)) {
      coin.y = ground.y - coin.height;
      coin.velocityY =
        -Math.abs(coin.velocityY) * GAME_CONFIG.COIN_BOUNCE_DAMPING;

      // Stop very small bounces
      if (Math.abs(coin.velocityY) < 0.5) {
        coin.velocityY = 0;
      }
    }
  }

  /**
   * Handles collisions with ground for power coins (using FloaterMovement logic)
   */
  private static handlePowerCoinGroundCollisions(
    coin: Coin,
    ground: Ground
  ): void {
    if (this.isColliding(coin, ground)) {
      // Use FloaterMovement's collision detection logic
      const collisionNormal = this.calculateCollisionNormal(coin, ground);

      // Reflect the velocity vector using the normal (same as FloaterMovement)
      const dotProduct =
        coin.velocityX * collisionNormal.x + coin.velocityY * collisionNormal.y;
      coin.velocityX = coin.velocityX - 2 * dotProduct * collisionNormal.x;
      coin.velocityY = coin.velocityY - 2 * dotProduct * collisionNormal.y;

      // Simple repositioning - move coin above ground
      coin.y = ground.y - coin.height - 1;
    }
  }

  /**
   * Checks if two objects are colliding
   */
  private static isColliding(
    coin: Coin,
    object: { x: number; y: number; width: number; height: number }
  ): boolean {
    return (
      coin.x < object.x + object.width &&
      coin.x + coin.width > object.x &&
      coin.y < object.y + object.height &&
      coin.y + coin.height > object.y
    );
  }

  /**
   * Creates initial velocity for a newly spawned coin
   */
  static createInitialVelocity(): { velocityX: number; velocityY: number } {
    return {
      velocityX: (Math.random() - 0.5) * GAME_CONFIG.COIN_BOUNCE_SPEED * 2,
      velocityY: -GAME_CONFIG.COIN_BOUNCE_SPEED,
    };
  }

  /**
   * Creates initial velocity for power coins (pure freedom)
   */
  static createPowerCoinVelocity(spawnAngle?: number): {
    velocityX: number;
    velocityY: number;
  } {
    const speed = GAME_CONFIG.COIN_BOUNCE_SPEED;

    if (spawnAngle !== undefined) {
      // Use predefined angle (convert from degrees to radians)
      const angleRad = (spawnAngle * Math.PI) / 180;
      return {
        velocityX: Math.cos(angleRad) * speed,
        velocityY: Math.sin(angleRad) * speed,
      };
    }

    // Pure freedom: random angle from 0 to 360 degrees
    const randomAngle = Math.random() * 360;
    const angleRad = (randomAngle * Math.PI) / 180;

    return {
      velocityX: Math.cos(angleRad) * speed,
      velocityY: Math.sin(angleRad) * speed,
    };
  }

  /**
   * Calculates the surface normal at the collision point
   */
  private static calculateSurfaceNormal(
    coin: Coin,
    object: { x: number; y: number; width: number; height: number }
  ): { x: number; y: number } {
    const coinCenterX = coin.x + coin.width / 2;
    const coinCenterY = coin.y + coin.height / 2;

    // Find the closest point on the surface to the coin center
    const closestX = Math.max(
      object.x,
      Math.min(coinCenterX, object.x + object.width)
    );
    const closestY = Math.max(
      object.y,
      Math.min(coinCenterY, object.y + object.height)
    );

    // Calculate the normal vector from the closest point to the coin center
    const normalX = coinCenterX - closestX;
    const normalY = coinCenterY - closestY;

    // Normalize the normal vector
    const length = Math.sqrt(normalX * normalX + normalY * normalY);

    if (length > 0.1) {
      // Normal case: normalize the vector
      return { x: normalX / length, y: normalY / length };
    } else {
      // Coin is very close to or on the surface - determine which side it's on
      const coinLeft = coin.x;
      const coinRight = coin.x + coin.width;
      const coinTop = coin.y;
      const coinBottom = coin.y + coin.height;

      const objectLeft = object.x;
      const objectRight = object.x + object.width;
      const objectTop = object.y;
      const objectBottom = object.y + object.height;

      // Determine which side the collision is on by checking distances
      const distToLeft = Math.abs(coinRight - objectLeft);
      const distToRight = Math.abs(coinLeft - objectRight);
      const distToTop = Math.abs(coinBottom - objectTop);
      const distToBottom = Math.abs(coinTop - objectBottom);

      const minDist = Math.min(
        distToLeft,
        distToRight,
        distToTop,
        distToBottom
      );

      if (minDist === distToLeft) {
        return { x: -1, y: 0 }; // Left side
      } else if (minDist === distToRight) {
        return { x: 1, y: 0 }; // Right side
      } else if (minDist === distToTop) {
        return { x: 0, y: -1 }; // Top side
      } else {
        return { x: 0, y: 1 }; // Bottom side
      }
    }
  }

  /**
   * Reflects velocity vector using the normal vector
   */
  private static reflectVelocity(
    coin: Coin,
    normal: { x: number; y: number }
  ): void {
    // Vector reflection formula: v' = v - 2(v · n)n
    const dotProduct = coin.velocityX * normal.x + coin.velocityY * normal.y;

    const oldVX = coin.velocityX;
    const oldVY = coin.velocityY;

    coin.velocityX = coin.velocityX - 2 * dotProduct * normal.x;
    coin.velocityY = coin.velocityY - 2 * dotProduct * normal.y;

    // Ensure the speed remains constant (power coins should maintain their speed)
    const oldSpeed = Math.sqrt(oldVX * oldVX + oldVY * oldVY);
    const newSpeed = Math.sqrt(
      coin.velocityX * coin.velocityX + coin.velocityY * coin.velocityY
    );

    if (newSpeed > 0.001) {
      const speedRatio = oldSpeed / newSpeed;
      coin.velocityX *= speedRatio;
      coin.velocityY *= speedRatio;
    }
  }

  /**
   * Moves coin out of collision with an object
   */
  private static moveCoinOutOfCollision(
    coin: Coin,
    object: { x: number; y: number; width: number; height: number }
  ): void {
    const coinCenterX = coin.x + coin.width / 2;
    const coinCenterY = coin.y + coin.height / 2;

    // Find the closest point on the surface
    const closestX = Math.max(
      object.x,
      Math.min(coinCenterX, object.x + object.width)
    );
    const closestY = Math.max(
      object.y,
      Math.min(coinCenterY, object.y + object.height)
    );

    // Calculate the penetration depth
    const penetrationX = coinCenterX - closestX;
    const penetrationY = coinCenterY - closestY;

    // Move coin out based on penetration
    if (Math.abs(penetrationX) > Math.abs(penetrationY)) {
      // Horizontal penetration - move horizontally
      coin.x +=
        penetrationX > 0 ? Math.abs(penetrationX) : -Math.abs(penetrationX);
    } else {
      // Vertical penetration - move vertically
      coin.y +=
        penetrationY > 0 ? Math.abs(penetrationY) : -Math.abs(penetrationY);
    }
  }

  /**
   * Moves coin out of collision with simple positioning
   */
  private static moveCoinOutOfCollisionSimple(
    coin: Coin,
    platform: { x: number; y: number; width: number; height: number }
  ): void {
    const coinCenterX = coin.x + coin.width / 2;
    const coinCenterY = coin.y + coin.height / 2;
    const platformCenterX = platform.x + platform.width / 2;
    const platformCenterY = platform.y + platform.height / 2;

    const deltaX = Math.abs(coinCenterX - platformCenterX);
    const deltaY = Math.abs(coinCenterY - platformCenterY);

    // Move coin out based on which axis had more overlap
    if (deltaX > deltaY) {
      // Horizontal collision - move coin to the side
      if (coinCenterX < platformCenterX) {
        coin.x = platform.x - coin.width - 1; // Move to left
      } else {
        coin.x = platform.x + platform.width + 1; // Move to right
      }
    } else {
      // Vertical collision - move coin above or below
      if (coinCenterY < platformCenterY) {
        coin.y = platform.y - coin.height - 1; // Move above
      } else {
        coin.y = platform.y + platform.height + 1; // Move below
      }
    }
  }

  private static calculateCollisionNormal(
    coin: Coin,
    platform: { x: number; y: number; width: number; height: number }
  ): { x: number; y: number } {
    const coinCenterX = coin.x + coin.width / 2;
    const coinCenterY = coin.y + coin.height / 2;

    // Find the closest point on the platform to the coin center
    const closestX = Math.max(
      platform.x,
      Math.min(coinCenterX, platform.x + platform.width)
    );
    const closestY = Math.max(
      platform.y,
      Math.min(coinCenterY, platform.y + platform.height)
    );

    // Calculate the normal vector from the closest point to the coin center
    const normalX = coinCenterX - closestX;
    const normalY = coinCenterY - closestY;

    // Normalize the normal vector
    const length = Math.sqrt(normalX * normalX + normalY * normalY);

    if (length > 0.1) {
      return { x: normalX / length, y: normalY / length };
    } else {
      // Coin is very close to the platform - determine which side
      const distToLeft = Math.abs(coin.x + coin.width - platform.x);
      const distToRight = Math.abs(coin.x - (platform.x + platform.width));
      const distToTop = Math.abs(coin.y + coin.height - platform.y);
      const distToBottom = Math.abs(coin.y - (platform.y + platform.height));

      const minDist = Math.min(
        distToLeft,
        distToRight,
        distToTop,
        distToBottom
      );

      if (minDist === distToLeft) return { x: -1, y: 0 };
      if (minDist === distToRight) return { x: 1, y: 0 };
      if (minDist === distToTop) return { x: 0, y: -1 };
      return { x: 0, y: 1 };
    }
  }
}
