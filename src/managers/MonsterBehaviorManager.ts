import { Monster } from "../types/interfaces";
import { MonsterType } from "../types/enums";
import { 
  PatrolMovement,
  ChaserMovement,
  AmbusherMovement,
  FloaterMovement
} from "./monster-movements";
import { MovementUtils } from "./monster-movements/MovementUtils";
import { monsterNeedsDirection } from "../config/monsterAnimations";

export class MonsterBehaviorManager {
  private patrolMovement: PatrolMovement;
  private chaserMovement: ChaserMovement;
  private ambusherMovement: AmbusherMovement;
  private floaterMovement: FloaterMovement;

  constructor() {
    this.patrolMovement = new PatrolMovement();
    this.chaserMovement = new ChaserMovement();
    this.ambusherMovement = new AmbusherMovement();
    this.floaterMovement = new FloaterMovement();
  }

  public updateMonsterBehaviors(currentTime: number, gameState: any, deltaTime?: number): void {
    if (!gameState.monsters) return;

    gameState.monsters.forEach((monster: Monster) => {
      if (!monster.isActive || monster.isFrozen) return;

      // Store the monster's position before updating to detect movement
      const prevX = monster.x;
      const prevY = monster.y;

      switch (monster.type) {
        case MonsterType.HORIZONTAL_PATROL:
        case MonsterType.VERTICAL_PATROL:
          this.patrolMovement.update(monster, currentTime, gameState, deltaTime);
          break;
        case MonsterType.CHASER:
          this.chaserMovement.update(monster, currentTime, gameState, deltaTime);
          break;
        case MonsterType.AMBUSHER:
          this.ambusherMovement.update(monster, currentTime, gameState, deltaTime);
          break;
        case MonsterType.FLOATER:
          this.floaterMovement.update(monster, currentTime, gameState, deltaTime);
          break;
      }

      // Safety check: clamp monster to boundaries if it somehow got outside
      MovementUtils.clampToBoundaries(monster);

      // Update sprite animations if the monster has a sprite
      if (monster.sprite && deltaTime) {
        // Update sprite animation timer
        monster.sprite.update(deltaTime);

        // Determine if the monster is moving
        const isMoving = Math.abs(monster.x - prevX) > 0.1 || Math.abs(monster.y - prevY) > 0.1;
        
        // Handle animation based on movement state and monster type
        if (monsterNeedsDirection(monster.type)) {
          // For monsters that need directional animations (e.g., HORIZONTAL_PATROL)
          if (isMoving) {
            if (monster.direction > 0) {
              monster.sprite.setAnimation("walk-right");
            } else {
              monster.sprite.setAnimation("walk-left");
            }
          } else {
            monster.sprite.setAnimation("idle");
          }
        } else {
          // For monsters that don't need directional animations
          if (isMoving) {
            monster.sprite.setAnimation("move");
          } else {
            monster.sprite.setAnimation("idle");
          }
        }
      }
    });
  }
}
