import { Player, Monster, Bomb, Platform, Ground, CollisionResult } from '../types/interfaces';

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

  private checkFullCollision(player: Player, surface: { x: number; y: number; width: number; height: number }): CollisionResult {
    // Calculate player's next position
    const nextX = player.x + player.velocityX;
    const nextY = player.y + player.velocityY;
    
    // Check if there would be a collision at the next position
    if (this.wouldCollide(nextX, nextY, player.width, player.height, surface)) {
      // Determine which side of the collision is happening
      const playerCenterX = player.x + player.width / 2;
      const playerCenterY = player.y + player.height / 2;
      const surfaceCenterX = surface.x + surface.width / 2;
      const surfaceCenterY = surface.y + surface.height / 2;
      
      const deltaX = playerCenterX - surfaceCenterX;
      const deltaY = playerCenterY - surfaceCenterY;
      
      // Calculate overlap on each axis
      const overlapX = (player.width + surface.width) / 2 - Math.abs(deltaX);
      const overlapY = (player.height + surface.height) / 2 - Math.abs(deltaY);
      
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

  checkBoundaryCollision(entity: { x: number; y: number; width: number; height: number }, bounds: { width: number; height: number }): boolean {
    return (
      entity.x < 0 ||
      entity.x + entity.width > bounds.width ||
      entity.y < 0 ||
      entity.y + entity.height > bounds.height
    );
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