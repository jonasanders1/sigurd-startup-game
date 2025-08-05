import { Monster, isChaserMonster } from "../../types/interfaces";
import { useGameStore } from "../../stores/gameStore";
import { logger } from "../../lib/logger";
import { MovementUtils } from "./MovementUtils";
import { DifficultyManager } from "../DifficultyManager";

export class ChaserMovement {
  public update(monster: Monster, currentTime: number, gameState: any): void {
    // Type guard to ensure this is a chaser monster
    if (!isChaserMonster(monster)) return;
    
    // Get player position
    const player = gameState.player;
    if (!player) return;

    // Get current difficulty values
    const difficultyManager = DifficultyManager.getInstance();
    const scaledValues = difficultyManager.getScaledValues();

    // Initialize chaser state if not set
    if (!monster.behaviorState) {
      monster.behaviorState = 'chasing';
      monster.lastDirectionChange = currentTime;
      monster.chaseTargetX = player.x;
      monster.chaseTargetY = player.y;
      monster.chaseUpdateInterval = scaledValues.chaser.updateInterval; // Use scaled interval
    }

    const platforms = gameState.platforms || [];
    const directness = scaledValues.chaser.directness; // Use scaled directness
    const updateInterval = scaledValues.chaser.updateInterval; // Use scaled interval

    // Update chase target periodically (creates "drifting" effect)
    const timeSinceLastUpdate = currentTime - (monster.lastDirectionChange || currentTime);
    if (timeSinceLastUpdate > updateInterval) {
      // Blend current target with new player position based on directness
      const currentTargetX = monster.chaseTargetX || monster.x;
      const currentTargetY = monster.chaseTargetY || monster.y;
      
      monster.chaseTargetX = currentTargetX + (player.x - currentTargetX) * directness;
      monster.chaseTargetY = currentTargetY + (player.y - currentTargetY) * directness;
      
      monster.lastDirectionChange = currentTime;
      
      // logger.debug(`Chaser updated target: (${monster.chaseTargetX}, ${monster.chaseTargetY}) from player (${player.x}, ${player.y}) with directness ${directness}`);
    }

    // Calculate direction to current target
    const targetX = monster.chaseTargetX || monster.x;
    const targetY = monster.chaseTargetY || monster.y;
    const dx = targetX - monster.x;
    const dy = targetY - monster.y;

    // Calculate distance to target
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Debug logging
    // logger.debug(`Chaser at (${monster.x}, ${monster.y}), target at (${targetX}, ${targetY}), dx=${dx}, dy=${dy}, distance=${distance}`);
    
    // Only move if we're not too close to the target (prevents jittering)
    if (distance > 10) {
      // Simple direct movement - move towards target using scaled speed
      const moveX = Math.sign(dx) * scaledValues.chaser.speed;
      const moveY = Math.sign(dy) * scaledValues.chaser.speed;
      
      const newX = monster.x + moveX;
      const newY = monster.y + moveY;
      
      // logger.debug(`Chaser movement: (${moveX}, ${moveY}), new position: (${newX}, ${newY})`);
      
      // Check platform collisions for X movement
      let canMoveX = true;
      for (const platform of platforms) {
        if (MovementUtils.checkMonsterPlatformCollision({ ...monster, x: newX }, platform)) {
          canMoveX = false;
          break;
        }
      }
      
      // Check platform collisions for Y movement
      let canMoveY = true;
      for (const platform of platforms) {
        if (MovementUtils.checkMonsterPlatformCollision({ ...monster, y: newY }, platform)) {
          canMoveY = false;
          break;
        }
      }
      
      // Apply movement if possible
      if (canMoveX) {
        monster.x = newX;
      }
      
      if (canMoveY) {
        monster.y = newY;
      }
      
      // Handle ground collision
      this.handleGroundCollision(monster, gameState.ground);
      
      // If we can't move in either direction, try to find an alternative path
      if (!canMoveX && !canMoveY) {
        this.findAlternativePath(monster, targetX, targetY, platforms);
      }
    }
  }
  
  private findAlternativePath(monster: Monster, targetX: number, targetY: number, platforms: any[]): void {
    const dx = targetX - monster.x;
    const dy = targetY - monster.y;
    
    // When blocked, try to move around the platform by going perpendicular to the target direction
    // This creates a more natural "go around" behavior
    
    // Determine which direction to try first based on target position
    const targetDirection = Math.abs(dx) > Math.abs(dy) ? 'horizontal' : 'vertical';
    
    if (targetDirection === 'horizontal') {
      // Target is more horizontally distant - try moving vertically to go around
      const verticalDirections = [1, -1]; // Try up, then down
      
      for (const verticalDir of verticalDirections) {
        const newY = monster.y + verticalDir * monster.speed;
        let canMoveY = true;
        
        for (const platform of platforms) {
          if (MovementUtils.checkMonsterPlatformCollision({ ...monster, y: newY }, platform)) {
            canMoveY = false;
            break;
          }
        }
        
        if (canMoveY) {
          monster.y = newY;
          // logger.debug(`Chaser found alternative path: moving vertically ${verticalDir > 0 ? 'down' : 'up'}`);
          return;
        }
      }
      
      // If vertical movement failed, try horizontal movement in the opposite direction
      const horizontalDir = Math.sign(dx) * -1; // Move away from target to go around
      const newX = monster.x + horizontalDir * monster.speed;
      let canMoveX = true;
      
      for (const platform of platforms) {
        if (MovementUtils.checkMonsterPlatformCollision({ ...monster, x: newX }, platform)) {
          canMoveX = false;
          break;
        }
      }
      
      if (canMoveX) {
        monster.x = newX;
        // logger.debug(`Chaser found alternative path: moving horizontally away from target`);
        return;
      }
    } else {
      // Target is more vertically distant - try moving horizontally to go around
      const horizontalDirections = [1, -1]; // Try right, then left
      
      for (const horizontalDir of horizontalDirections) {
        const newX = monster.x + horizontalDir * monster.speed;
        let canMoveX = true;
        
        for (const platform of platforms) {
          if (MovementUtils.checkMonsterPlatformCollision({ ...monster, x: newX }, platform)) {
            canMoveX = false;
            break;
          }
        }
        
        if (canMoveX) {
          monster.x = newX;
          // logger.debug(`Chaser found alternative path: moving horizontally ${horizontalDir > 0 ? 'right' : 'left'}`);
          return;
        }
      }
      
      // If horizontal movement failed, try vertical movement in the opposite direction
      const verticalDir = Math.sign(dy) * -1; // Move away from target to go around
      const newY = monster.y + verticalDir * monster.speed;
      let canMoveY = true;
      
      for (const platform of platforms) {
        if (MovementUtils.checkMonsterPlatformCollision({ ...monster, y: newY }, platform)) {
          canMoveY = false;
          break;
        }
      }
      
      if (canMoveY) {
        monster.y = newY;
        // logger.debug(`Chaser found alternative path: moving vertically away from target`);
        return;
      }
    }
    
    // If all alternative paths failed, try random movement to get unstuck
    this.tryRandomMovement(monster, platforms);
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
  
  private tryRandomMovement(monster: Monster, platforms: any[]): void {
    // Try moving in random directions to get unstuck
    const directions = [
      { x: 1, y: 0 },   // Right
      { x: -1, y: 0 },  // Left
      { x: 0, y: 1 },   // Down
      { x: 0, y: -1 },  // Up
      { x: 1, y: 1 },   // Down-right
      { x: -1, y: 1 },  // Down-left
      { x: 1, y: -1 },  // Up-right
      { x: -1, y: -1 }  // Up-left
    ];
    
    // Shuffle directions to try them in random order
    for (let i = directions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [directions[i], directions[j]] = [directions[j], directions[i]];
    }
    
    for (const dir of directions) {
      const newX = monster.x + dir.x * monster.speed;
      const newY = monster.y + dir.y * monster.speed;
      
      let canMove = true;
      for (const platform of platforms) {
        if (MovementUtils.checkMonsterPlatformCollision({ ...monster, x: newX, y: newY }, platform)) {
          canMove = false;
          break;
        }
      }
      
      if (canMove) {
        monster.x = newX;
        monster.y = newY;
        // logger.debug(`Chaser unstuck with random movement: (${dir.x}, ${dir.y})`);
        return;
      }
    }
    
    // If we still can't move, the monster is completely stuck
    // logger.debug('Chaser is completely stuck and cannot move');
  }
} 