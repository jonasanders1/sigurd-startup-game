import { Monster, isAmbusherMonster } from "../../types/interfaces";
import { GAME_CONFIG } from "../../types/constants";
import { logger } from "../../lib/logger";
import { MovementUtils } from "./MovementUtils";
import { DifficultyManager } from "../DifficultyManager";

export class AmbusherMovement {
  public update(monster: Monster, currentTime: number, gameState: any): void {
    // Type guard to ensure this is an ambusher monster
    if (!isAmbusherMonster(monster)) return;
    
    const player = gameState.player;
    if (!player) return;

    // Get current difficulty values
    const difficultyManager = DifficultyManager.getInstance();
    const scaledValues = difficultyManager.getScaledValues();

    // Initialize ambusher state if not set
    if (!monster.behaviorState) {
      monster.behaviorState = 'wandering';
      monster.lastDirectionChange = currentTime;
      monster.ambushCooldown = 2000; // Start with 2 second delay
    }

    const platforms = gameState.platforms || [];

    if (monster.behaviorState === 'wandering') {
      // Simple wandering: move in random direction
      const timeSinceDirectionChange = currentTime - (monster.lastDirectionChange || currentTime);

      // Change direction every 2-4 seconds
      if (timeSinceDirectionChange > 2000 + Math.random() * 2000) {
        monster.lastDirectionChange = currentTime;
      }

      // Simple movement: pick a random direction and try to move
      const moveSpeed = scaledValues.ambusher.speed * 0.5; // Use scaled speed
      const directions = [
        { x: moveSpeed, y: 0 },   // Right
        { x: -moveSpeed, y: 0 },  // Left
        { x: 0, y: moveSpeed },   // Down
        { x: 0, y: -moveSpeed },  // Up
      ];

      // Try each direction until one works
      let moved = false;
      for (const direction of directions) {
        const newX = monster.x + direction.x;
        const newY = monster.y + direction.y;
        
        // Check if new position is safe
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
          moved = true;
          break;
        }
      }

      // If we couldn't move, just stay still (don't get stuck trying to move)

      // Check if it's time to ambush using scaled interval
      monster.ambushCooldown += 16;
      if (monster.ambushCooldown >= scaledValues.ambusher.ambushInterval) {
        monster.behaviorState = 'ambushing';
        monster.lastDirectionChange = currentTime;
        monster.ambushCooldown = 0; // Reset cooldown
        monster.ambushTargetX = player.x;
        monster.ambushTargetY = player.y;
        logger.debug(`Ambusher switching to ambush mode, targeting player at (${monster.ambushTargetX}, ${monster.ambushTargetY})`);
      }
    } else if (monster.behaviorState === 'ambushing') {
      // Simple ambush: move toward player position
      const ambushSpeed = scaledValues.ambusher.speed * 3.0; // Use scaled speed
      const targetX = monster.ambushTargetX || monster.x;
      const targetY = monster.ambushTargetY || monster.y;
      const distance = Math.sqrt((targetX - monster.x) ** 2 + (targetY - monster.y) ** 2);

      if (distance > 5) {
        // Calculate direction to target
        const dx = targetX - monster.x;
        const dy = targetY - monster.y;
        const normX = dx / distance;
        const normY = dy / distance;

        // Try to move toward target
        const newX = monster.x + ambushSpeed * normX;
        const newY = monster.y + ambushSpeed * normY;

        // Check if movement is safe
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
        } else {
          // If blocked, end ambush
          monster.behaviorState = 'wandering';
          monster.lastDirectionChange = currentTime;
          logger.debug('Ambusher blocked, returning to wandering');
        }
      } else {
        // Reached target, return to wandering
        monster.behaviorState = 'wandering';
        monster.lastDirectionChange = currentTime;
        logger.debug('Ambusher reached target, returning to wandering');
      }
    }
  }
} 