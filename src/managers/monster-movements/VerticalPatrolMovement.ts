import { Monster } from "../../types/interfaces";
import { GAME_CONFIG } from "../../types/constants";
import { useGameStore } from "../../stores/gameStore";
import { MovementUtils } from "./MovementUtils";

export class VerticalPatrolMovement {
  public update(monster: Monster, currentTime: number): void {
    // Calculate new position
    const newY = monster.y + monster.speed * monster.direction;

    // Check platform collision
    const gameState = useGameStore.getState();
    const platforms = gameState.platforms || [];
    let canMove = true;

    for (const platform of platforms) {
      const wouldCollide = MovementUtils.checkMonsterPlatformCollision(
        { ...monster, y: newY },
        platform
      );

      if (wouldCollide) {
        canMove = false;
        break;
      }
    }

    if (canMove) {
      monster.y = newY;
    } else {
      // Change direction if we hit a platform
      monster.direction *= -1;
      monster.lastDirectionChange = currentTime;
    }

    // Change direction at boundaries
    if (
      monster.y <= (monster.patrolStartY || 0) ||
      monster.y >= (monster.patrolEndY || GAME_CONFIG.CANVAS_HEIGHT)
    ) {
      monster.direction *= -1;
      monster.lastDirectionChange = currentTime;
    }
  }
} 