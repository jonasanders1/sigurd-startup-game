import { Coin, Platform, Ground } from '../types/interfaces';
import { GAME_CONFIG } from '../types/constants';

export class CoinPhysics {
  /**
   * Updates the physics and movement of a coin
   */
  static updateCoin(coin: Coin, platforms: Platform[], ground: Ground): void {
    if (coin.isCollected) return;

    // Apply gravity
    coin.velocityY += GAME_CONFIG.COIN_GRAVITY;

    // Update position
    coin.x += coin.velocityX;
    coin.y += coin.velocityY;

    // Check collisions with boundaries
    this.handleBoundaryCollisions(coin);

    // Check collisions with platforms
    this.handlePlatformCollisions(coin, platforms);

    // Check collisions with ground
    this.handleGroundCollisions(coin, ground);
  }

  /**
   * Updates the physics and movement of a power coin (linear movement with fixed speed)
   */
  static updatePowerCoin(coin: Coin, platforms: Platform[], ground: Ground): void {
    if (coin.isCollected) return;

    // Debug: Log initial state
    const initialVX = coin.velocityX;
    const initialVY = coin.velocityY;
    const initialX = coin.x;
    const initialY = coin.y;

    // Power coins move linearly - NO GRAVITY APPLIED
    // The initial velocity is set correctly and should be maintained

    // Update position
    coin.x += coin.velocityX;
    coin.y += coin.velocityY;

    // Check collisions with boundaries and reflect
    this.handlePowerCoinBoundaryCollisions(coin);

    // Check collisions with platforms and reflect
    this.handlePowerCoinPlatformCollisions(coin, platforms);

    // Check collisions with ground and reflect
    this.handlePowerCoinGroundCollisions(coin, ground);

    // Debug: Verify velocity hasn't changed (no gravity applied)
    if (Math.abs(coin.velocityX - initialVX) > 0.001 || Math.abs(coin.velocityY - initialVY) > 0.001) {
      console.warn(`⚠️ Power coin velocity changed unexpectedly: (${initialVX.toFixed(3)},${initialVY.toFixed(3)}) → (${coin.velocityX.toFixed(3)},${coin.velocityY.toFixed(3)})`);
    }
  }

  /**
   * Handles collisions with canvas boundaries
   */
  private static handleBoundaryCollisions(coin: Coin): void {
    // Left and right boundaries
    if (coin.x <= 0) {
      coin.x = 0;
      coin.velocityX = Math.abs(coin.velocityX) * GAME_CONFIG.COIN_BOUNCE_DAMPING;
    } else if (coin.x + coin.width >= GAME_CONFIG.CANVAS_WIDTH) {
      coin.x = GAME_CONFIG.CANVAS_WIDTH - coin.width;
      coin.velocityX = -Math.abs(coin.velocityX) * GAME_CONFIG.COIN_BOUNCE_DAMPING;
    }

    // Top boundary (ceiling)
    if (coin.y <= 0) {
      coin.y = 0;
      coin.velocityY = Math.abs(coin.velocityY) * GAME_CONFIG.COIN_BOUNCE_DAMPING;
    }
  }

  /**
   * Handles collisions with canvas boundaries for power coins (perfect reflection)
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
    // Bottom boundary
    else if (coin.y + coin.height >= GAME_CONFIG.CANVAS_HEIGHT) {
      coin.y = GAME_CONFIG.CANVAS_HEIGHT - coin.height;
      coin.velocityY = -Math.abs(coin.velocityY); // Reflect vertically
    }
  }

  /**
   * Handles collisions with platforms
   */
  private static handlePlatformCollisions(coin: Coin, platforms: Platform[]): void {
    platforms.forEach(platform => {
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
            coin.velocityX = Math.abs(coin.velocityX) * GAME_CONFIG.COIN_BOUNCE_DAMPING;
          } else {
            coin.x = platform.x - coin.width;
            coin.velocityX = -Math.abs(coin.velocityX) * GAME_CONFIG.COIN_BOUNCE_DAMPING;
          }
        } else {
          // Vertical collision
          if (deltaY > 0) {
            coin.y = platform.y + platform.height;
            coin.velocityY = Math.abs(coin.velocityY) * GAME_CONFIG.COIN_BOUNCE_DAMPING;
          } else {
            coin.y = platform.y - coin.height;
            coin.velocityY = -Math.abs(coin.velocityY) * GAME_CONFIG.COIN_BOUNCE_DAMPING;
          }
        }
      }
    });
  }

  /**
   * Handles collisions with platforms for power coins (perfect reflection)
   */
  private static handlePowerCoinPlatformCollisions(coin: Coin, platforms: Platform[]): void {
    platforms.forEach(platform => {
      if (this.isColliding(coin, platform)) {
        // Calculate the surface normal at the collision point
        const normal = this.calculateSurfaceNormal(coin, platform);
        
        // Reflect the velocity vector using the normal
        this.reflectVelocity(coin, normal);
        
        // Move coin out of collision
        this.moveCoinOutOfCollision(coin, platform);
      }
    });
  }

  /**
   * Handles collisions with ground
   */
  private static handleGroundCollisions(coin: Coin, ground: Ground): void {
    if (this.isColliding(coin, ground)) {
      coin.y = ground.y - coin.height;
      coin.velocityY = -Math.abs(coin.velocityY) * GAME_CONFIG.COIN_BOUNCE_DAMPING;
      
      // Stop very small bounces
      if (Math.abs(coin.velocityY) < 0.5) {
        coin.velocityY = 0;
      }
    }
  }

  /**
   * Handles collisions with ground for power coins (perfect reflection)
   */
  private static handlePowerCoinGroundCollisions(coin: Coin, ground: Ground): void {
    if (this.isColliding(coin, ground)) {
      // Calculate the surface normal at the collision point
      const normal = this.calculateSurfaceNormal(coin, ground);
      
      // Reflect the velocity vector using the normal
      this.reflectVelocity(coin, normal);
      
      // Move coin out of collision
      this.moveCoinOutOfCollision(coin, ground);
    }
  }

  /**
   * Checks if two objects are colliding
   */
  private static isColliding(coin: Coin, object: { x: number; y: number; width: number; height: number }): boolean {
    return coin.x < object.x + object.width &&
           coin.x + coin.width > object.x &&
           coin.y < object.y + object.height &&
           coin.y + coin.height > object.y;
  }

  /**
   * Creates initial velocity for a newly spawned coin
   */
  static createInitialVelocity(): { velocityX: number; velocityY: number } {
    return {
      velocityX: (Math.random() - 0.5) * GAME_CONFIG.COIN_BOUNCE_SPEED * 2,
      velocityY: -GAME_CONFIG.COIN_BOUNCE_SPEED
    };
  }

  /**
   * Creates initial velocity for power coins (linear movement)
   */
  static createPowerCoinVelocity(spawnAngle?: number): { velocityX: number; velocityY: number } {
    const speed = GAME_CONFIG.COIN_BOUNCE_SPEED;
    
    if (spawnAngle !== undefined) {
      // Use predefined angle (convert from degrees to radians)
      const angleRad = (spawnAngle * Math.PI) / 180;
      return {
        velocityX: Math.cos(angleRad) * speed,
        velocityY: Math.sin(angleRad) * speed
      };
    }
    
    // Fallback: create non-cardinal angles (avoid 0°, 90°, 180°, 270°)
    const nonCardinalAngles = [
      15, 30, 45, 60, 75, 105, 120, 135, 150, 165,
      195, 210, 225, 240, 255, 285, 300, 315, 330, 345
    ];
    
    const randomAngle = nonCardinalAngles[Math.floor(Math.random() * nonCardinalAngles.length)];
    const angleRad = (randomAngle * Math.PI) / 180;
    
    return {
      velocityX: Math.cos(angleRad) * speed,
      velocityY: Math.sin(angleRad) * speed
    };
  }

  /**
   * Calculates the surface normal at the collision point
   */
  private static calculateSurfaceNormal(coin: Coin, object: { x: number; y: number; width: number; height: number }): { x: number; y: number } {
    const coinCenterX = coin.x + coin.width / 2;
    const coinCenterY = coin.y + coin.height / 2;
    
    // Find the closest point on the surface to the coin center
    const closestX = Math.max(object.x, Math.min(coinCenterX, object.x + object.width));
    const closestY = Math.max(object.y, Math.min(coinCenterY, object.y + object.height));
    
    // Calculate the normal vector from the closest point to the coin center
    const normalX = coinCenterX - closestX;
    const normalY = coinCenterY - closestY;
    
    // Normalize the normal vector
    const length = Math.sqrt(normalX * normalX + normalY * normalY);
    
    if (length > 0) {
      return { x: normalX / length, y: normalY / length };
    } else {
      // If coin is exactly at the center, use a default normal
      return { x: 0, y: 1 };
    }
  }

  /**
   * Reflects velocity vector using the normal vector
   */
  private static reflectVelocity(coin: Coin, normal: { x: number; y: number }): void {
    // Vector reflection formula: v' = v - 2(v · n)n
    const dotProduct = coin.velocityX * normal.x + coin.velocityY * normal.y;
    
    coin.velocityX = coin.velocityX - 2 * dotProduct * normal.x;
    coin.velocityY = coin.velocityY - 2 * dotProduct * normal.y;
  }

  /**
   * Moves coin out of collision with an object
   */
  private static moveCoinOutOfCollision(coin: Coin, object: { x: number; y: number; width: number; height: number }): void {
    const coinCenterX = coin.x + coin.width / 2;
    const coinCenterY = coin.y + coin.height / 2;
    
    // Find the closest point on the surface
    const closestX = Math.max(object.x, Math.min(coinCenterX, object.x + object.width));
    const closestY = Math.max(object.y, Math.min(coinCenterY, object.y + object.height));
    
    // Calculate the penetration depth
    const penetrationX = coinCenterX - closestX;
    const penetrationY = coinCenterY - closestY;
    
    // Move coin out based on penetration
    if (Math.abs(penetrationX) > Math.abs(penetrationY)) {
      // Horizontal penetration - move horizontally
      coin.x += penetrationX > 0 ? Math.abs(penetrationX) : -Math.abs(penetrationX);
    } else {
      // Vertical penetration - move vertically
      coin.y += penetrationY > 0 ? Math.abs(penetrationY) : -Math.abs(penetrationY);
    }
  }
} 