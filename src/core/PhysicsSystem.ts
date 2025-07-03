import { BaseEntity } from '../entities/BaseEntity';
import { PlayerEntity } from '../entities/PlayerEntity';
import { MonsterEntity } from '../entities/MonsterEntity';
import { CoinEntity } from '../entities/CoinEntity';
import { BombEntity } from '../entities/BombEntity';
import { Platform, Ground, CollisionResult } from '../types/interfaces';
import { GAME_CONFIG } from '../types/constants';

export class PhysicsSystem {
  // Check collision between two entities
  checkCollision(a: BaseEntity, b: BaseEntity): CollisionResult {
    const boundsA = a.getBounds();
    const boundsB = b.getBounds();

    const overlapX = Math.min(boundsA.right, boundsB.right) - Math.max(boundsA.left, boundsB.left);
    const overlapY = Math.min(boundsA.bottom, boundsB.bottom) - Math.max(boundsA.top, boundsB.top);

    if (overlapX > 0 && overlapY > 0) {
      // Determine collision normal based on smallest overlap
      let normal = { x: 0, y: 0 };
      let penetration = 0;

      if (overlapX < overlapY) {
        // Horizontal collision
        normal.x = boundsA.left < boundsB.left ? -1 : 1;
        penetration = overlapX;
      } else {
        // Vertical collision
        normal.y = boundsA.top < boundsB.top ? -1 : 1;
        penetration = overlapY;
      }

      return {
        hasCollision: true,
        normal,
        penetration,
      };
    }

    return { hasCollision: false };
  }

  // Check collision with static rectangle (platforms, ground)
  checkEntityRectCollision(entity: BaseEntity, rect: { x: number; y: number; width: number; height: number }): CollisionResult {
    const bounds = entity.getBounds();
    const rectBounds = {
      left: rect.x,
      right: rect.x + rect.width,
      top: rect.y,
      bottom: rect.y + rect.height,
    };

    const overlapX = Math.min(bounds.right, rectBounds.right) - Math.max(bounds.left, rectBounds.left);
    const overlapY = Math.min(bounds.bottom, rectBounds.bottom) - Math.max(bounds.top, rectBounds.top);

    if (overlapX > 0 && overlapY > 0) {
      let normal = { x: 0, y: 0 };
      let penetration = 0;

      if (overlapX < overlapY) {
        normal.x = bounds.left < rectBounds.left ? -1 : 1;
        penetration = overlapX;
      } else {
        normal.y = bounds.top < rectBounds.top ? -1 : 1;
        penetration = overlapY;
      }

      return {
        hasCollision: true,
        normal,
        penetration,
      };
    }

    return { hasCollision: false };
  }

  // Update physics for all entities
  update(entities: BaseEntity[], deltaTime: number): void {
    // Physics is already handled in entity update methods
    // This method would handle complex physics interactions if needed
  }

  // Resolve collision between entity and static object
  resolveCollision(entity: BaseEntity, collision: CollisionResult): void {
    if (!collision.hasCollision || !collision.normal || !collision.penetration) return;

    // Move entity out of collision
    entity.x += collision.normal.x * collision.penetration;
    entity.y += collision.normal.y * collision.penetration;

    // Adjust velocity based on collision normal
    if (collision.normal.x !== 0) {
      entity.velocityX = 0;
    }
    if (collision.normal.y !== 0) {
      entity.velocityY = 0;
      
      // Special handling for landing
      if (collision.normal.y === -1 && entity instanceof PlayerEntity) {
        entity.land();
      }
    }
  }

  // Check if entity is on ground
  isEntityGrounded(entity: BaseEntity, ground: Ground | null, platforms: Platform[]): boolean {
    if (!ground) return false;

    const bounds = entity.getBounds();
    const groundCheckY = bounds.bottom + 1; // Check 1 pixel below

    // Check ground collision
    if (groundCheckY >= ground.y && bounds.left < ground.x + ground.width && bounds.right > ground.x) {
      return true;
    }

    // Check platform collisions
    for (const platform of platforms) {
      if (
        groundCheckY >= platform.y &&
        groundCheckY <= platform.y + 5 && // Small tolerance
        bounds.left < platform.x + platform.width &&
        bounds.right > platform.x
      ) {
        return true;
      }
    }

    return false;
  }

  // Check boundary collisions
  checkBoundaryCollision(entity: BaseEntity, canvasWidth: number, canvasHeight: number): {
    hitBoundary: boolean;
    fellOffScreen: boolean;
  } {
    const bounds = entity.getBounds();
    let hitBoundary = false;
    let fellOffScreen = false;

    // Left boundary
    if (bounds.left < 0) {
      entity.x = 0;
      entity.velocityX = 0;
      hitBoundary = true;
    }

    // Right boundary
    if (bounds.right > canvasWidth) {
      entity.x = canvasWidth - entity.width;
      entity.velocityX = 0;
      hitBoundary = true;
    }

    // Top boundary
    if (bounds.top < 0) {
      entity.y = 0;
      entity.velocityY = 0;
      hitBoundary = true;
    }

    // Bottom boundary (fell off screen)
    if (bounds.top > canvasHeight) {
      fellOffScreen = true;
    }

    return { hitBoundary, fellOffScreen };
  }
}