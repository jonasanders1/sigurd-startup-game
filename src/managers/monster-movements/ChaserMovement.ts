import { Monster, isChaserMonster } from "../../types/interfaces";
import { useGameStore } from "../../stores/gameStore";
import { usePlayerStore } from "../../stores/entities/playerStore";
import { logger } from "../../lib/logger";
import { MovementUtils } from "./MovementUtils";
import { ScalingManager } from "../ScalingManager";

export class ChaserMovement {
  public update(monster: Monster, currentTime: number, gameState: any, deltaTime?: number): void {
    // Type guard to ensure this is a chaser monster
    if (!isChaserMonster(monster)) return;

    // Check if game is paused
    if (gameState.currentState !== 'PLAYING') {
      return;
    }
    
    const playerStore = usePlayerStore.getState();
    const player = playerStore.player;
    if (!player) return;

    // Get individual scaling values for this monster
    const scalingManager = ScalingManager.getInstance();
    const valuesToUse = scalingManager.getMonsterScaledValues(monster);
    const baseValues = scalingManager.getBaseValues();
    const monsterAge = scalingManager.getMonsterAge(monster);
    
    // Log scaling info for debugging (only in debug mode)
    if (monsterAge < 2) {
      logger.debug(`Chaser scaling - Age: ${monsterAge.toFixed(1)}s, Speed: ${valuesToUse.chaser.speed.toFixed(2)}`);
    }

    // Initialize chaser state if not set
    if (!monster.behaviorState) {
      monster.behaviorState = 'chasing';
      monster.lastDirectionChange = currentTime;
      monster.chaseTargetX = player.x;
      monster.chaseTargetY = player.y;
      
      // Store randomization multipliers (not absolute values) to preserve difficulty scaling
      (monster as any).updateIntervalMultiplier = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
      (monster as any).directnessMultiplier = 0.85 + Math.random() * 0.3; // 0.85 to 1.15
      (monster as any).speedMultiplier = 0.9 + Math.random() * 0.2; // 0.9 to 1.1
      
      // Add random offset to initial target to prevent immediate convergence
      const targetOffsetX = (Math.random() - 0.5) * 50; // ±25 pixels
      const targetOffsetY = (Math.random() - 0.5) * 50; // ±25 pixels
      monster.chaseTargetX = player.x + targetOffsetX;
      monster.chaseTargetY = player.y + targetOffsetY;
      
      // Add random delay to prevent all chasers from updating at the same time
      monster.lastDirectionChange = currentTime + Math.random() * valuesToUse.chaser.updateInterval;
    }

    const platforms = gameState.platforms || [];
    // Apply individual multipliers to values to preserve difficulty scaling
    const directness = valuesToUse.chaser.directness * ((monster as any).directnessMultiplier || 1);
    const updateInterval = valuesToUse.chaser.updateInterval * ((monster as any).updateIntervalMultiplier || 1);

    // Update chase target periodically (creates "drifting" effect)
    const timeSinceLastUpdate = currentTime - (monster.lastDirectionChange || currentTime);
    if (timeSinceLastUpdate > updateInterval) {
      // Blend current target with new player position based on directness
      const currentTargetX = monster.chaseTargetX || monster.x;
      const currentTargetY = monster.chaseTargetY || monster.y;
      
      // Only add random offset occasionally (not every update) to reduce jittering
      const shouldAddOffset = Math.random() < 0.3; // 30% chance
      const randomOffsetX = shouldAddOffset ? (Math.random() - 0.5) * 15 : 0; // ±7.5 pixels, or 0
      const randomOffsetY = shouldAddOffset ? (Math.random() - 0.5) * 15 : 0; // ±7.5 pixels, or 0
      
      monster.chaseTargetX = currentTargetX + (player.x + randomOffsetX - currentTargetX) * directness;
      monster.chaseTargetY = currentTargetY + (player.y + randomOffsetY - currentTargetY) * directness;
      
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
    // Increased threshold to reduce micro-movements
    if (distance > 20) {
      // Simple direct movement - move towards target using speed with individual multiplier (frame-rate independent)
      const individualSpeed = valuesToUse.chaser.speed * ((monster as any).speedMultiplier || 1);
      const frameSpeed = deltaTime ? individualSpeed * (deltaTime / 16.67) : individualSpeed; // 16.67ms = 60fps
      const moveX = Math.sign(dx) * frameSpeed;
      const moveY = Math.sign(dy) * frameSpeed;
      
      this.applyMovement(monster, moveX, moveY, targetX, targetY, platforms, gameState.ground);
    } else if (distance > 5) {
      // When close to target, use slower, smoother movement to prevent jittering
      const individualSpeed = valuesToUse.chaser.speed * ((monster as any).speedMultiplier || 1) * 0.5; // Half speed when close
      const frameSpeed = deltaTime ? individualSpeed * (deltaTime / 16.67) : individualSpeed; // 16.67ms = 60fps
      const moveX = Math.sign(dx) * frameSpeed;
      const moveY = Math.sign(dy) * frameSpeed;
      
      this.applyMovement(monster, moveX, moveY, targetX, targetY, platforms, gameState.ground);
    }
    // If distance <= 5, don't move at all to prevent jittering
  }
  
  private applyMovement(monster: Monster, moveX: number, moveY: number, targetX: number, targetY: number, platforms: any[], ground: any): void {
    const newX = monster.x + moveX;
    const newY = monster.y + moveY;
    
    // logger.debug(`Chaser movement: (${moveX}, ${moveY}), new position: (${newX}, ${newY})`);
    
    // Check if X movement is safe (platforms and boundaries)
    const canMoveX = MovementUtils.isMovementSafe(monster, newX, monster.y, platforms);
    
    // Check if Y movement is safe (platforms and boundaries)
    const canMoveY = MovementUtils.isMovementSafe(monster, monster.x, newY, platforms);
    
    // Apply movement if possible
    if (canMoveX) {
      monster.x = newX;
    }
    
    if (canMoveY) {
      monster.y = newY;
    }
    
    // Handle ground collision
    this.handleGroundCollision(monster, ground);
    
    // If we can't move in either direction, try to find an alternative path
    if (!canMoveX && !canMoveY) {
      this.findAlternativePath(monster, targetX, targetY, platforms);
    }
  }
  
  private findAlternativePath(monster: Monster, targetX: number, targetY: number, platforms: any[]): void {
    const dx = targetX - monster.x;
    const dy = targetY - monster.y;
    
    // When blocked, try to move around the platform by going perpendicular to the target direction
    // This creates a more natural "go around" behavior
    
    // Determine which direction to try first based on target position
    // Add some randomization to prevent all chasers from choosing the same path
    const randomFactor = Math.random();
    const targetDirection = Math.abs(dx) > Math.abs(dy) 
      ? (randomFactor > 0.7 ? 'vertical' : 'horizontal')  // 30% chance to choose vertical even if horizontal is closer
      : (randomFactor > 0.7 ? 'horizontal' : 'vertical'); // 30% chance to choose horizontal even if vertical is closer
    
    if (targetDirection === 'horizontal') {
      // Target is more horizontally distant - try moving vertically to go around
      // Randomize direction order to prevent all chasers from choosing the same path
      const verticalDirections = Math.random() > 0.5 ? [1, -1] : [-1, 1]; // Randomize up/down order
      
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
      // Randomize direction order to prevent all chasers from choosing the same path
      const horizontalDirections = Math.random() > 0.5 ? [1, -1] : [-1, 1]; // Randomize left/right order
      
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