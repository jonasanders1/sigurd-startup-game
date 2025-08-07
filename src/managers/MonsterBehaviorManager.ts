import { Monster } from "../types/interfaces";
import { MonsterType } from "../types/enums";
import { 
  PatrolMovement,
  ChaserMovement,
  AmbusherMovement,
  FloaterMovement
} from "./monster-movements";
import { MovementUtils } from "./monster-movements/MovementUtils";

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
    });
  }
}
