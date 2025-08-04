import { Player, Monster, Bomb, Platform, Ground, CollisionResult, Coin } from '../types/interfaces';

export class CollisionManager {
  checkPlayerPlatformCollision(player: Player, platforms: Platform[]): CollisionResult {
    for (const platform of platforms) {
      const collision = this.checkFullCollision(player, platform);
      if (collision.hasCollision) {
        return collision;
      }
    }
    return { hasCollision: false };
  }

  checkPlayerGroundCollision(player: Player, ground: Ground): CollisionResult {
    const collision = this.checkFullCollision(player, ground);
    return collision;
  }

  checkMonsterGroundCollision(monster: Monster, ground: Ground): CollisionResult {
    const collision = this.checkFullCollision(monster, ground);
    return collision;
  }

  checkPlayerCoinCollision(player: Player, coins: Coin[]): Coin | null {
    for (const coin of coins) {
      if (!coin.isCollected && this.isColliding(player, coin)) {
        return coin;
      }
    }
    return null;
  }

  private checkFullCollision(entity: { x: number; y: number; width: number; height: number; velocityX?: number; velocityY?: number }, surface: { x: number; y: number; width: number; height: number }): CollisionResult {
    // Calculate entity's next position
    const nextX = entity.x + (entity.velocityX || 0);
    const nextY = entity.y + (entity.velocityY || 0);
    
    // Check if there would be a collision at the next position
    if (this.wouldCollide(nextX, nextY, entity.width, entity.height, surface)) {
      // Determine which side of the collision is happening
      const entityCenterX = entity.x + entity.width / 2;
      const entityCenterY = entity.y + entity.height / 2;
      const surfaceCenterX = surface.x + surface.width / 2;
      const surfaceCenterY = surface.y + surface.height / 2;
      
      const deltaX = entityCenterX - surfaceCenterX;
      const deltaY = entityCenterY - surfaceCenterY;
      
      // Calculate overlap on each axis
      const overlapX = (entity.width + surface.width) / 2 - Math.abs(deltaX);
      const overlapY = (entity.height + surface.height) / 2 - Math.abs(deltaY);
      
      // Resolve collision based on smallest overlap
      if (overlapX < overlapY) {
        // Horizontal collision
        if (deltaX > 0) {
          // Player hitting from the right
          return {
            hasCollision: true,
            normal: { x: 1, y: 0 },
            penetration: overlapX
          };
        } else {
          // Player hitting from the left
          return {
            hasCollision: true,
            normal: { x: -1, y: 0 },
            penetration: overlapX
          };
        }
      } else {
        // Vertical collision
        if (deltaY > 0) {
          // Player hitting from below
          return {
            hasCollision: true,
            normal: { x: 0, y: 1 },
            penetration: overlapY
          };
        } else {
          // Player hitting from above (landing on platform)
          return {
            hasCollision: true,
            normal: { x: 0, y: -1 },
            penetration: overlapY
          };
        }
      }
    }
    
    return { hasCollision: false };
  }

  private wouldCollide(x: number, y: number, width: number, height: number, surface: { x: number; y: number; width: number; height: number }): boolean {
    return (
      x < surface.x + surface.width &&
      x + width > surface.x &&
      y < surface.y + surface.height &&
      y + height > surface.y
    );
  }

  checkPlayerBombCollision(player: Player, bombs: Bomb[]): Bomb | null {
    for (const bomb of bombs) {
      if (!bomb.isCollected && this.isColliding(player, bomb)) {
        return bomb;
      }
    }
    return null;
  }

  checkPlayerMonsterCollision(player: Player, monsters: Monster[]): Monster | null {
    for (const monster of monsters) {
      if (monster.isActive && this.isColliding(player, monster)) {
        return monster;
      }
    }
    return null;
  }

  checkBoundaryCollision(entity: { x: number; y: number; width: number; height: number }, bounds: { width: number; height: number }): CollisionResult {
    const nextX = entity.x;
    const nextY = entity.y;
    
    // Check each boundary
    if (nextX < 0) {
      // Left boundary collision
      return {
        hasCollision: true,
        normal: { x: 1, y: 0 },
        penetration: Math.abs(nextX)
      };
    }
    
    if (nextX + entity.width > bounds.width) {
      // Right boundary collision
      return {
        hasCollision: true,
        normal: { x: -1, y: 0 },
        penetration: nextX + entity.width - bounds.width
      };
    }
    
    if (nextY < 0) {
      // Top boundary collision
      return {
        hasCollision: true,
        normal: { x: 0, y: 1 },
        penetration: Math.abs(nextY)
      };
    }
    
    if (nextY + entity.height > bounds.height) {
      // Bottom boundary collision
      return {
        hasCollision: true,
        normal: { x: 0, y: -1 },
        penetration: nextY + entity.height - bounds.height
      };
    }
    
    return { hasCollision: false };
  }

  resolveBoundaryCollision(player: Player, bounds: { width: number; height: number }): { player: Player; fellOffScreen: boolean } {
    const boundaryCollision = this.checkBoundaryCollision(player, bounds);
    
    if (!boundaryCollision.hasCollision || !boundaryCollision.normal || !boundaryCollision.penetration) {
      return { player, fellOffScreen: false };
    }
    
    const updatedPlayer = { ...player };
    const { normal, penetration } = boundaryCollision;
    
    // Resolve collision based on normal direction
    if (normal.x === 1) {
      // Left boundary - move player to x = 0
      updatedPlayer.x = 0;
      updatedPlayer.velocityX = 0;
    } else if (normal.x === -1) {
      // Right boundary - move player to right edge
      updatedPlayer.x = bounds.width - player.width;
      updatedPlayer.velocityX = 0;
    } else if (normal.y === 1) {
      // Top boundary - move player to y = 0 and stop upward velocity
      updatedPlayer.y = 0;
      updatedPlayer.velocityY = 0;
    } else if (normal.y === -1) {
      // Bottom boundary - player fell off screen
      return { player: updatedPlayer, fellOffScreen: true };
    }
    
    return { player: updatedPlayer, fellOffScreen: false };
  }

  private isColliding(rect1: { x: number; y: number; width: number; height: number }, rect2: { x: number; y: number; width: number; height: number }): boolean {
    return (
      rect1.x < rect2.x + rect2.width &&
      rect1.x + rect1.width > rect2.x &&
      rect1.y < rect2.y + rect2.height &&
      rect1.y + rect1.height > rect2.y
    );
  }
}