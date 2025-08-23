import { Monster, isAmbusherMonster } from "../../types/interfaces";
import { GAME_CONFIG } from "../../types/constants";
import { logger } from "../../lib/logger";
import { MovementUtils } from "./MovementUtils";
import { ScalingManager } from "../ScalingManager";
import { useLevelStore } from "../../stores/game/levelStore";

export class AmbusherMovement {
  public update(monster: Monster, currentTime: number, gameState: any, deltaTime?: number): void {
    // Type guard to ensure this is an ambusher monster
    if (!isAmbusherMonster(monster)) return;

    // Check if game is paused
    if (gameState.currentState !== 'PLAYING') {
      return;
    }

    const player = gameState.player;
    if (!player) return;

    // Get individual scaling values for this monster
    const scalingManager = ScalingManager.getInstance();
    const valuesToUse = scalingManager.getMonsterScaledValues(monster);
    const baseValues = scalingManager.getBaseValues();
    const monsterAge = scalingManager.getMonsterAge(monster);

    // Log scaling info for debugging (only in debug mode)
    if (monsterAge < 2) {
      logger.debug(`Ambusher scaling - Age: ${monsterAge.toFixed(1)}s, Speed: ${valuesToUse.ambusher.speed.toFixed(2)}`);
    }

    // Initialize ambusher state if not set
    if (!monster.behaviorState) {
      monster.behaviorState = "wandering";
      monster.lastDirectionChange = currentTime;
      monster.ambushCooldown = 2000; // Start with 2 second delay
    }

    const levelStore = useLevelStore.getState();
    const platforms = levelStore.currentMap?.platforms || [];
    const ground = levelStore.currentMap?.ground;

    if (monster.behaviorState === "wandering") {
      // Initialize current wandering direction if not set
      if (!(monster as any).targetX || !(monster as any).targetY) {
        this.chooseNewWanderingDirection(monster, currentTime);
      }

      const timeSinceDirectionChange =
        currentTime - (monster.lastDirectionChange || currentTime);

      // Change direction every 2-4 seconds
      if (timeSinceDirectionChange > 2000 + Math.random() * 2000) {
        this.chooseNewWanderingDirection(monster, currentTime);
      }

      // Move toward current wandering target
      const moveSpeed = valuesToUse.ambusher.speed * 0.5; // Use appropriate speed
      const frameSpeed = deltaTime ? moveSpeed * (deltaTime / 16.67) : moveSpeed; // 16.67ms = 60fps
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

        // Try to move toward target (frame-rate independent)
        const newX = monster.x + frameSpeed * normX;
        const newY = monster.y + frameSpeed * normY;

        // Check if new position is safe (platforms, boundaries, and ground)
        if (MovementUtils.isMovementSafeWithGround(monster, newX, newY, platforms, ground)) {
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

      // Check if it's time to ambush using appropriate interval (frame-rate independent)
      monster.ambushCooldown += deltaTime || 16;
      if (monster.ambushCooldown >= valuesToUse.ambusher.ambushInterval) {
        monster.behaviorState = "ambushing";
        monster.lastDirectionChange = currentTime;
        monster.ambushCooldown = 0; // Reset cooldown
        monster.ambushTargetX = player.x;
        monster.ambushTargetY = player.y;
        logger.debug(
          `Ambusher switching to ambush mode, targeting player at (${monster.ambushTargetX}, ${monster.ambushTargetY})`
        );
      }
    } else if (monster.behaviorState === "ambushing") {
      // Simple ambush: move toward player position
      const ambushSpeed = valuesToUse.ambusher.speed * 3.0; // Use appropriate speed
      const frameSpeed = deltaTime ? ambushSpeed * (deltaTime / 16.67) : ambushSpeed; // 16.67ms = 60fps
      const targetX = monster.ambushTargetX || monster.x;
      const targetY = monster.ambushTargetY || monster.y;
      const distance = Math.sqrt(
        (targetX - monster.x) ** 2 + (targetY - monster.y) ** 2
      );

      if (distance > 5) {
        // Calculate direction to target
        const dx = targetX - monster.x;
        const dy = targetY - monster.y;
        const normX = dx / distance;
        const normY = dy / distance;

        // Try to move toward target (frame-rate independent)
        const newX = monster.x + frameSpeed * normX;
        const newY = monster.y + frameSpeed * normY;

        // Check if movement is safe (platforms, boundaries, and ground)
        if (MovementUtils.isMovementSafeWithGround(monster, newX, newY, platforms, ground)) {
          monster.x = newX;
          monster.y = newY;
        } else {
          // If blocked, end ambush
          monster.behaviorState = "wandering";
          monster.lastDirectionChange = currentTime;
          logger.debug("Ambusher blocked, returning to wandering");
        }
      } else {
        // Reached target, return to wandering
        monster.behaviorState = "wandering";
        monster.lastDirectionChange = currentTime;
        logger.debug("Ambusher reached target, returning to wandering");
      }
    }
  }

  private chooseNewWanderingDirection(
    monster: Monster,
    currentTime: number
  ): void {
    // Choose a random direction (up, down, left, right, or diagonal)
    const directions = [
      { x: 1, y: 0 }, // Right
      { x: -1, y: 0 }, // Left
      { x: 0, y: 1 }, // Down
      { x: 0, y: -1 }, // Up
      { x: 1, y: 1 }, // Down-Right
      { x: -1, y: 1 }, // Down-Left
      { x: 1, y: -1 }, // Up-Right
      { x: -1, y: -1 }, // Up-Left
    ];

    const randomDirection =
      directions[Math.floor(Math.random() * directions.length)];

    // Set a target point in that direction (within map bounds)
    const targetDistance = 50 + Math.random() * 100; // Random distance between 50-150 pixels
    const newTargetX = Math.max(
      0,
      Math.min(
        monster.x + randomDirection.x * targetDistance,
        GAME_CONFIG.CANVAS_WIDTH - monster.width
      )
    );
    const newTargetY = Math.max(
      0,
      Math.min(
        monster.y + randomDirection.y * targetDistance,
        GAME_CONFIG.CANVAS_HEIGHT - monster.height
      )
    );

    (monster as any).targetX = newTargetX;
    (monster as any).targetY = newTargetY;
    monster.lastDirectionChange = currentTime;
  }
}
