import { Monster, Platform } from "../../types/interfaces";
import { useGameStore } from "../../stores/gameStore";
import { useLevelStore } from "../../stores/game/levelStore";
import { MovementUtils } from "./MovementUtils";

export class HorizontalPatrolMovement {
  public update(monster: Monster, currentTime: number): void {
    const levelStore = useLevelStore.getState();
    const platforms = levelStore.currentMap?.platforms || [];

    // Initialize monster properties if not set
    this.initializeMonster(monster, platforms);

    // Get current platform
    const currentPlatform =
      monster.currentPlatform ||
      MovementUtils.findCurrentPlatform(monster, platforms);
    monster.currentPlatform = currentPlatform;

    if (currentPlatform) {
      // Monster is on a platform - handle movement
      this.handlePlatformMovement(monster, currentPlatform, currentTime);
    }
  }

  private initializeMonster(monster: Monster, platforms: Platform[]): void {
    // Initialize basic properties
    if (!monster.velocityX) monster.velocityX = 0;
    if (!monster.velocityY) monster.velocityY = 0;
    if (!monster.isGrounded) monster.isGrounded = true;

    // Initialize direction if not set
    if (!monster.direction) {
      monster.direction = Math.random() < 0.5 ? -1 : 1;
    }

    // Initialize platform-specific properties
    if (!monster.currentPlatform) {
      monster.currentPlatform = MovementUtils.findCurrentPlatform(
        monster,
        platforms
      );
    }

    if (monster.currentPlatform && !monster.spawnSide) {
      monster.spawnSide = MovementUtils.determineSpawnSide(
        monster,
        monster.currentPlatform
      );
    }

    if (!monster.walkLengths) monster.walkLengths = 1;
    if (!monster.currentWalkCount) monster.currentWalkCount = 0;
    if (!monster.originalSpawnX) monster.originalSpawnX = monster.x;
  }

  private handlePlatformMovement(
    monster: Monster,
    platform: Platform,
    currentTime: number
  ): void {
    // Simple back and forth movement on the platform
    const newX = monster.x + monster.speed * monster.direction;

    // Check if we would walk off the platform
    if (
      newX < platform.x ||
      newX + monster.width > platform.x + platform.width
    ) {
      // Turn around
      monster.direction *= -1;
      monster.lastDirectionChange = currentTime;
    } else {
      // Safe to move
      monster.x = newX;
    }

    // Keep monster on platform
    monster.y = platform.y - monster.height;
    monster.velocityY = 0;
    monster.isGrounded = true;
  }
}
 