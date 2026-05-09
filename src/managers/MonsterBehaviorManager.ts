import { Monster } from "../types/interfaces";
import { MonsterType } from "../types/enums";
import {
  PatrolMovement,
  ChaserMovement,
  AmbusherMovement,
  FloaterMovement,
  AirborneMovement,
} from "./monster-movements";
import { MovementUtils } from "./monster-movements/MovementUtils";

export class MonsterBehaviorManager {
  private patrolMovement: PatrolMovement;
  private chaserMovement: ChaserMovement;
  private ambusherMovement: AmbusherMovement;
  private floaterMovement: FloaterMovement;
  private airborneMovement: AirborneMovement;

  constructor() {
    this.patrolMovement = new PatrolMovement();
    this.chaserMovement = new ChaserMovement();
    this.ambusherMovement = new AmbusherMovement();
    this.floaterMovement = new FloaterMovement();
    this.airborneMovement = new AirborneMovement();
  }

  public updateMonsterBehaviors(currentTime: number, gameState: any, deltaTime?: number): void {
    if (!gameState.monsters) return;

    gameState.monsters.forEach((monster: Monster) => {
      if (!monster.isActive || monster.isFrozen) return;

      switch (monster.type) {
        case MonsterType.BUREAUCRAT:
          this.patrolMovement.update(monster, currentTime, gameState, deltaTime);
          break;
        case MonsterType.WISP:
          this.chaserMovement.update(monster, currentTime, gameState, deltaTime);
          break;
        case MonsterType.TAXGHOST:
          this.ambusherMovement.update(monster, currentTime, gameState, deltaTime);
          break;
        case MonsterType.FOUNDER:
          this.floaterMovement.update(monster, currentTime, gameState, deltaTime);
          break;
        // BJ airborne forms — share a single movement class, branch on type
        // inside it (Monster-Movments.md / game-specs §5.1.3).
        case MonsterType.CONSULTANT:
        case MonsterType.ROBOT:
          this.airborneMovement.update(monster, currentTime, gameState, deltaTime);
          break;
      }

      // Safety check: clamp monster to boundaries if it somehow got outside
      MovementUtils.clampToBoundaries(monster);
    });
  }
}
