import { Monster } from "../../types/interfaces";
import { GAME_CONFIG } from "../../types/constants";
import { useGameStore } from "../../stores/gameStore";
import { MovementUtils } from "./MovementUtils";
import { ScalingManager } from "../ScalingManager";
import { logger } from "../../lib/logger";

export class FloaterMovement {
    public update(monster: Monster, currentTime: number, gameStateParam?: any, deltaTime?: number): void {
    // Check if game is paused
    if (gameStateParam && gameStateParam.currentState !== 'PLAYING') {
      return;
    }

    // Get individual scaling values for this monster
    const scalingManager = ScalingManager.getInstance();
    const valuesToUse = scalingManager.getMonsterScaledValues(monster);
    const baseValues = scalingManager.getBaseValues();
    const monsterAge = scalingManager.getMonsterAge(monster);
    
    // Log scaling info for debugging (only in debug mode)
    if (monsterAge < 2) {
      logger.debug(`Floater scaling - Age: ${monsterAge.toFixed(1)}s, Speed: ${valuesToUse.floater.speed.toFixed(2)}`);
    }

    // Initialize velocity if not set (convert angle to velocity)
    if (!monster.velocityX && !monster.velocityY) {
      this.initializeVelocity(monster, valuesToUse.floater.speed);
    }

    // Move in straight line based on velocity (frame-rate independent)
    const frameMultiplier = deltaTime ? deltaTime / 16.67 : 1; // 16.67ms = 60fps
    const newX = monster.x + monster.velocityX * frameMultiplier;
    const newY = monster.y + monster.velocityY * frameMultiplier;

    // Check for collisions with platforms
    const gameState = useGameStore.getState();
    const platforms = gameState.platforms || [];
    let canMove = true;
    let collisionNormal = { x: 0, y: 0 };

    // Check platform collisions
    for (const platform of platforms) {
      if (MovementUtils.checkMonsterPlatformCollision({ ...monster, x: newX, y: newY }, platform)) {
        canMove = false;
        collisionNormal = this.calculateCollisionNormal(monster, platform);
        break;
      }
    }

    // Check boundary collisions
    if (newX <= 0 || newX + monster.width >= GAME_CONFIG.CANVAS_WIDTH ||
        newY <= 0 || newY + monster.height >= GAME_CONFIG.CANVAS_HEIGHT) {
      canMove = false;
      collisionNormal = this.calculateBoundaryCollisionNormal(monster, newX, newY);
    }
    
    // Check ground collision
    if (gameState.ground) {
      if (MovementUtils.checkMonsterPlatformCollision({ ...monster, x: newX, y: newY }, gameState.ground)) {
        canMove = false;
        collisionNormal = this.calculateCollisionNormal(monster, gameState.ground);
      }
    }

    if (canMove) {
      // Safe to move
      monster.x = newX;
      monster.y = newY;
    } else {
      // Bounce off the collision using appropriate bounce angle
      this.bounceOffCollision(monster, collisionNormal, valuesToUse.floater.bounceAngle);
    }
  }

  private initializeVelocity(monster: Monster, scaledSpeed: number): void {
    // Type guard to ensure this is a floater monster
    if (monster.type !== "FLOATER") return;
    
    const angle = monster.startAngle || 45; // Default to 45 degrees if not specified
    
    // Convert angle from degrees to radians
    const angleRad = (angle * Math.PI) / 180;
    
    monster.velocityX = Math.cos(angleRad) * scaledSpeed;
    monster.velocityY = Math.sin(angleRad) * scaledSpeed;
  }

  private calculateCollisionNormal(monster: Monster, platform: any): { x: number; y: number } {
    const monsterCenterX = monster.x + monster.width / 2;
    const monsterCenterY = monster.y + monster.height / 2;
    
    // Find the closest point on the platform to the monster center
    const closestX = Math.max(platform.x, Math.min(monsterCenterX, platform.x + platform.width));
    const closestY = Math.max(platform.y, Math.min(monsterCenterY, platform.y + platform.height));
    
    // Calculate the normal vector from the closest point to the monster center
    const normalX = monsterCenterX - closestX;
    const normalY = monsterCenterY - closestY;
    
    // Normalize the normal vector
    const length = Math.sqrt(normalX * normalX + normalY * normalY);
    
    if (length > 0.1) {
      return { x: normalX / length, y: normalY / length };
    } else {
      // Monster is very close to the platform - determine which side
      const distToLeft = Math.abs(monster.x + monster.width - platform.x);
      const distToRight = Math.abs(monster.x - (platform.x + platform.width));
      const distToTop = Math.abs(monster.y + monster.height - platform.y);
      const distToBottom = Math.abs(monster.y - (platform.y + platform.height));
      
      const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom);
      
      if (minDist === distToLeft) return { x: -1, y: 0 };
      if (minDist === distToRight) return { x: 1, y: 0 };
      if (minDist === distToTop) return { x: 0, y: -1 };
      return { x: 0, y: 1 };
    }
  }

  private calculateBoundaryCollisionNormal(monster: Monster, newX: number, newY: number): { x: number; y: number } {
    if (newX <= 0) return { x: 1, y: 0 }; // Left boundary
    if (newX + monster.width >= GAME_CONFIG.CANVAS_WIDTH) return { x: -1, y: 0 }; // Right boundary
    if (newY <= 0) return { x: 0, y: 1 }; // Top boundary
    return { x: 0, y: -1 }; // Bottom boundary
  }

  private bounceOffCollision(monster: Monster, normal: { x: number; y: number }, bounceAngle: number): void {
    // Calculate the dot product of velocity and normal
    const dotProduct = monster.velocityX * normal.x + monster.velocityY * normal.y;
    
    // Reflect the velocity vector
    monster.velocityX = monster.velocityX - 2 * dotProduct * normal.x;
    monster.velocityY = monster.velocityY - 2 * dotProduct * normal.y;
    
    // Add some randomness to the bounce based on bounceAngle
    const randomAngle = (Math.random() - 0.5) * bounceAngle;
    const speed = Math.sqrt(monster.velocityX * monster.velocityX + monster.velocityY * monster.velocityY);
    
    // Apply random angle change
    const currentAngle = Math.atan2(monster.velocityY, monster.velocityX);
    const newAngle = currentAngle + randomAngle;
    
    monster.velocityX = Math.cos(newAngle) * speed;
    monster.velocityY = Math.sin(newAngle) * speed;
  }
} 