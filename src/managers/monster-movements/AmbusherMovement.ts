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
      // Initialize current wandering direction if not set
      if (!(monster as any).targetX || !(monster as any).targetY) {
        this.chooseNewWanderingDirection(monster, currentTime);
      }

      const timeSinceDirectionChange = currentTime - (monster.lastDirectionChange || currentTime);

      // Change direction every 2-4 seconds
      if (timeSinceDirectionChange > 2000 + Math.random() * 2000) {
        this.chooseNewWanderingDirection(monster, currentTime);
      }

      // Move toward current wandering target
      const moveSpeed = scaledValues.ambusher.speed * 0.5; // Use scaled speed
      const targetX = (monster as any).targetX || monster.x;
      const targetY = (monster as any).targetY || monster.y;
      
      // Calculate direction to target
      const dx = targetX - monster.x;
      const dy = targetY - monster.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 5) {
        // Normalize direction
        const normX = dx / distance;
        const normY = dy / distance;

        // Try to move toward target
        const newX = monster.x + moveSpeed * normX;
        const newY = monster.y + moveSpeed * normY;
        
        // Check if new position is safe (platforms and boundaries)
        if (MovementUtils.isMovementSafe(monster, newX, newY, platforms)) {
          monster.x = newX;
          monster.y = newY;
        } else {
          // If blocked, choose new direction
          this.chooseNewWanderingDirection(monster, currentTime);
        }
      } else {
        // Reached target, choose new direction
        this.chooseNewWanderingDirection(monster, currentTime);
      }

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

        // Check if movement is safe (platforms and boundaries)
        if (MovementUtils.isMovementSafe(monster, newX, newY, platforms)) {
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

  private chooseNewWanderingDirection(monster: Monster, currentTime: number): void {
    // Choose a random direction (up, down, left, right, or diagonal)
    const directions = [
      { x: 1, y: 0 },   // Right
      { x: -1, y: 0 },  // Left
      { x: 0, y: 1 },   // Down
      { x: 0, y: -1 },  // Up
      { x: 1, y: 1 },   // Down-Right
      { x: -1, y: 1 },  // Down-Left
      { x: 1, y: -1 },  // Up-Right
      { x: -1, y: -1 }, // Up-Left
    ];

    const randomDirection = directions[Math.floor(Math.random() * directions.length)];
    
    // Set a target point in that direction (within map bounds)
    const targetDistance = 50 + Math.random() * 100; // Random distance between 50-150 pixels
    const newTargetX = Math.max(0, Math.min(
      monster.x + randomDirection.x * targetDistance,
      GAME_CONFIG.CANVAS_WIDTH - monster.width
    ));
    const newTargetY = Math.max(0, Math.min(
      monster.y + randomDirection.y * targetDistance,
      GAME_CONFIG.CANVAS_HEIGHT - monster.height
    ));

    (monster as any).targetX = newTargetX;
    (monster as any).targetY = newTargetY;
    monster.lastDirectionChange = currentTime;
  }
} 