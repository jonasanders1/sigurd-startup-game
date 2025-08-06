import { Monster, isPatrolMonster } from "../../types/interfaces";
import { GAME_CONFIG } from "../../types/constants";
import { useGameStore } from "../../stores/gameStore";
import { MovementUtils } from "./MovementUtils";
import { DifficultyManager } from "../DifficultyManager";

export class PatrolMovement {
  public update(monster: Monster, currentTime: number): void {
    // Determine if this is horizontal or vertical patrol based on monster type
    const isHorizontal = monster.type === "HORIZONTAL_PATROL";
    
    if (isHorizontal) {
      this.updateHorizontalPatrol(monster, currentTime);
    } else {
      this.updateVerticalPatrol(monster, currentTime);
    }
  }

  private updateHorizontalPatrol(monster: Monster, currentTime: number): void {
    // Type guard to ensure this is a patrol monster
    if (!isPatrolMonster(monster)) return;
    
    // Get scaled speed from DifficultyManager
    const difficultyManager = DifficultyManager.getInstance();
    const scaledValues = difficultyManager.getScaledValues();
    const scaledSpeed = scaledValues.patrol.speed;

    // Simple back and forth movement on the platform
    const newX = monster.x + scaledSpeed * monster.direction;

    // Check if we would walk off the platform
    if (
      newX < monster.patrolStartX ||
      newX + monster.width > monster.patrolEndX
    ) {
      // Turn around
      monster.direction *= -1;
      monster.lastDirectionChange = currentTime;
    } else {
      // Safe to move
      monster.x = newX;
    }

    // Keep monster on platform
    const gameState = useGameStore.getState();
    const platforms = gameState.platforms || [];
    const currentPlatform = MovementUtils.findCurrentPlatform(monster, platforms);
    
    if (currentPlatform) {
      monster.y = currentPlatform.y - monster.height;
      monster.velocityY = 0;
      monster.isGrounded = true;
    } else {
      // Check ground collision if not on platform
      this.handleGroundCollision(monster, gameState.ground);
    }
  }

  private updateVerticalPatrol(monster: Monster, currentTime: number): void {
    // Type guard to ensure this is a patrol monster
    if (!isPatrolMonster(monster)) return;
    
    // Get scaled speed from DifficultyManager
    const difficultyManager = DifficultyManager.getInstance();
    const scaledValues = difficultyManager.getScaledValues();
    const scaledSpeed = scaledValues.patrol.speed;
    
    // Initialize target X position only once
    if (!monster.originalSpawnX) {
      const gameState = useGameStore.getState();
      const platforms = gameState.platforms || [];
      const patrolSide = (monster as any).patrolSide || "left";
      const targetPlatformX = (monster as any).targetPlatformX;
      
      // Find the target vertical platform using the stored targetPlatformX
      const targetPlatform = platforms.find(platform => 
        platform.isVertical && 
        Math.abs(platform.x - targetPlatformX) < 1 // Use exact match with small tolerance
      );
      
      if (targetPlatform) {
        const spacing = 8; // Equal spacing from platform edge
        monster.originalSpawnX = patrolSide === "left" 
          ? targetPlatform.x - monster.width - spacing // Left side of wall
          : targetPlatform.x + spacing + targetPlatform.width; // Right side of wall
        monster.x = monster.originalSpawnX; // Set initial position
      }
    }
    
    // Simple up and down movement within patrol bounds using scaled speed
    const newY = monster.y + scaledSpeed * monster.direction;

    // Check if we would walk off the patrol area
    if (
      newY < monster.patrolStartY ||
      newY + monster.height > monster.patrolEndY
    ) {
      // Turn around
      monster.direction *= -1;
      monster.lastDirectionChange = currentTime;
    } else {
      // Safe to move
      monster.y = newY;
    }

    // Keep monster at fixed X position (no repositioning every frame)
    if (monster.originalSpawnX !== undefined) {
      monster.x = monster.originalSpawnX; // Always return to exact position
      monster.velocityX = 0;
      monster.velocityY = 0;
      monster.isGrounded = false;
    } else {
      // Keep monster at fixed X position if no vertical platform found
      monster.velocityX = 0;
      monster.velocityY = 0;
      monster.isGrounded = false;
    }
  }

  private handleGroundCollision(monster: Monster, ground: any): void {
    if (!ground) return;

    // Check if monster is colliding with ground
    const isColliding = (
      monster.x < ground.x + ground.width &&
      monster.x + monster.width > ground.x &&
      monster.y < ground.y + ground.height &&
      monster.y + monster.height > ground.y
    );
    
    if (isColliding) {
      // Monster is colliding with ground - place it on top
      monster.y = ground.y - monster.height;
      monster.velocityY = 0;
      monster.isGrounded = true;
    }
  }
} 