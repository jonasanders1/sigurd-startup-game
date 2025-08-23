import { Monster } from "../types/interfaces";
import { MonsterType } from "../types/enums";
import { PatrolMovement } from "./monster-movements/PatrolMovement";
import { ChaserMovement } from "./monster-movements/ChaserMovement";
import { FloaterMovement } from "./monster-movements/FloaterMovement";
import { VerticalPatrolMovement } from "./monster-movements/VerticalPatrolMovement";
import { HorizontalPatrolMovement } from "./monster-movements/HorizontalPatrolMovement";
import { AmbusherMovement } from "./monster-movements/AmbusherMovement";
import { useMonsterStore } from "../stores/entities/monsterStore";
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
    const monsterStore = useMonsterStore.getState();
    if (!monsterStore.monsters) return;

    monsterStore.monsters.forEach((monster: Monster) => {
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
