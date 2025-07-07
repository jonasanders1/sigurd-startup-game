import { Monster, isChaserMonster, isAmbusherMonster } from "../types/interfaces";
import { MonsterType } from "../types/enums";
import { GAME_CONFIG } from "../types/constants";
import { logger } from "../lib/logger";
import { useGameStore } from "../stores/gameStore";

export class MonsterBehaviorManager {
  public updateMonsterBehaviors(currentTime: number, gameState: any): void {
    if (!gameState.monsters) return;

    gameState.monsters.forEach((monster: Monster) => {
      if (!monster.isActive || monster.isFrozen) return;

      switch (monster.type) {
        case MonsterType.HORIZONTAL_PATROL:
          this.updateHorizontalPatrol(monster, currentTime);
          break;
        case MonsterType.VERTICAL_PATROL:
          this.updateVerticalPatrol(monster, currentTime);
          break;
        case MonsterType.CHASER:
          this.updateChaser(monster, currentTime, gameState);
          break;
        case MonsterType.AMBUSHER:
          this.updateAmbusher(monster, currentTime, gameState);
          break;
        case MonsterType.FLOATER:
          this.updateFloater(monster, currentTime);
          break;
      }
    });
  }

  private updateHorizontalPatrol(monster: Monster, currentTime: number): void {
    // Calculate new position
    const newX = monster.x + monster.speed * monster.direction;

    // Check platform collision
    const gameState = useGameStore.getState();
    const platforms = gameState.platforms || [];
    let canMove = true;

    for (const platform of platforms) {
      const wouldCollide = this.checkMonsterPlatformCollision(
        { ...monster, x: newX },
        platform
      );

      if (wouldCollide) {
        canMove = false;
        break;
      }
    }

    if (canMove) {
      monster.x = newX;
    } else {
      // Change direction if we hit a platform
      monster.direction *= -1;
      monster.lastDirectionChange = currentTime;
    }

    // Change direction at boundaries
    if (monster.x <= monster.patrolStartX || monster.x >= monster.patrolEndX) {
      monster.direction *= -1;
      monster.lastDirectionChange = currentTime;
    }
  }

  private updateVerticalPatrol(monster: Monster, currentTime: number): void {
    // Calculate new position
    const newY = monster.y + monster.speed * monster.direction;

    // Check platform collision
    const gameState = useGameStore.getState();
    const platforms = gameState.platforms || [];
    let canMove = true;

    for (const platform of platforms) {
      const wouldCollide = this.checkMonsterPlatformCollision(
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

  private updateChaser(
    monster: Monster,
    currentTime: number,
    gameState: any
  ): void {
    // Type guard to ensure this is a chaser monster
    if (!isChaserMonster(monster)) return;
    
    // Get player position
    const player = gameState.player;
    if (!player) return;

    // Initialize chaser state if not set
    if (!monster.behaviorState) {
      monster.behaviorState = 'chasing';
      monster.lastDirectionChange = currentTime;
      monster.chaseTargetX = player.x;
      monster.chaseTargetY = player.y;
      monster.chaseUpdateInterval = 0.01; // Update target every 500ms (tunable)
    }

    const platforms = gameState.platforms || [];
    const directness = monster.directness || 0.3; // 0.0 = very indirect, 1.0 = perfect tracking (tunable)
    const updateInterval = monster.chaseUpdateInterval || 500;

    // Update chase target periodically (creates "drifting" effect)
    const timeSinceLastUpdate = currentTime - (monster.lastDirectionChange || currentTime);
    if (timeSinceLastUpdate > updateInterval) {
      // Blend current target with new player position based on directness
      const currentTargetX = monster.chaseTargetX || monster.x;
      const currentTargetY = monster.chaseTargetY || monster.y;
      
      monster.chaseTargetX = currentTargetX + (player.x - currentTargetX) * directness;
      monster.chaseTargetY = currentTargetY + (player.y - currentTargetY) * directness;
      
      monster.lastDirectionChange = currentTime;
      
      logger.debug(`Chaser updated target: (${monster.chaseTargetX}, ${monster.chaseTargetY}) from player (${player.x}, ${player.y}) with directness ${directness}`);
    }

    // Calculate direction to current target (not player)
    const targetX = monster.chaseTargetX || monster.x;
    const targetY = monster.chaseTargetY || monster.y;
    const dx = targetX - monster.x;
    const dy = targetY - monster.y;

    // Move towards target with platform collision checking
    if (Math.abs(dx) > 5) {
      const newX = monster.x + monster.speed * Math.sign(dx);
      let canMoveX = true;

      for (const platform of platforms) {
        if (
          this.checkMonsterPlatformCollision({ ...monster, x: newX }, platform)
        ) {
          canMoveX = false;
          break;
        }
      }

      if (canMoveX) {
        monster.x = newX;
      }
    }

    if (Math.abs(dy) > 5) {
      const newY = monster.y + monster.speed * Math.sign(dy);
      let canMoveY = true;

      for (const platform of platforms) {
        if (
          this.checkMonsterPlatformCollision({ ...monster, y: newY }, platform)
        ) {
          canMoveY = false;
          break;
        }
      }

      if (canMoveY) {
        monster.y = newY;
      }
    }
  }

  private updateAmbusher(
    monster: Monster,
    currentTime: number,
    gameState: any
  ): void {
    // Type guard to ensure this is an ambusher monster
    if (!isAmbusherMonster(monster)) return;
    
    const player = gameState.player;
    if (!player) return;

    // Initialize ambusher state if not set
    if (!monster.behaviorState) {
      monster.behaviorState = 'wandering';
      monster.lastDirectionChange = currentTime;
      monster.targetX = monster.x;
      monster.targetY = monster.y;
      monster.ambushCooldown = 0; // Time until next ambush
    }

    const platforms = gameState.platforms || [];
    const ambushInterval = 5000; // 5 seconds between ambushes (tunable)

    // Update ambush cooldown
    if (monster.ambushCooldown === undefined) {
      monster.ambushCooldown = 0;
    }

    if (monster.behaviorState === 'wandering') {
      // Wandering behavior: move randomly in horizontal and vertical patterns
      const timeSinceDirectionChange = currentTime - (monster.lastDirectionChange || currentTime);

      // Change direction every 2-4 seconds or when reaching target
      if (
        timeSinceDirectionChange > 2000 + Math.random() * 2000 ||
        Math.abs(monster.x - (monster.targetX || monster.x)) < 10
      ) {
        // Set new random target within patrol bounds
        monster.targetX =
          monster.patrolStartX +
          Math.random() * (monster.patrolEndX - monster.patrolStartX);
        monster.targetY =
          (monster.patrolStartY || GAME_CONFIG.CANVAS_HEIGHT - 200) +
          Math.random() * 100;
        monster.lastDirectionChange = currentTime;

        logger.debug(`Ambusher new target: (${monster.targetX}, ${monster.targetY})`);
      }

      // Move towards current target
      const targetX = monster.targetX || monster.x;
      const targetY = monster.targetY || monster.y;

      // Horizontal movement
      if (Math.abs(monster.x - targetX) > 5) {
        const newX = monster.x + monster.speed * 0.5 * Math.sign(targetX - monster.x);
        let canMoveX = true;

        for (const platform of platforms) {
          if (
            this.checkMonsterPlatformCollision({ ...monster, x: newX }, platform)
          ) {
            canMoveX = false;
            break;
          }
        }

        if (canMoveX) {
          monster.x = newX;
        }
      }

      // Vertical movement
      if (Math.abs(monster.y - targetY) > 5) {
        const newY = monster.y + monster.speed * 0.5 * Math.sign(targetY - monster.y);
        let canMoveY = true;

        for (const platform of platforms) {
          if (
            this.checkMonsterPlatformCollision({ ...monster, y: newY }, platform)
          ) {
            canMoveY = false;
            break;
          }
        }

        if (canMoveY) {
          monster.y = newY;
        }
      }

      // Check if it's time to ambush
      monster.ambushCooldown += 16; // Assuming 60fps, add ~16ms per frame
      if (monster.ambushCooldown >= ambushInterval) {
        monster.behaviorState = 'ambushing';
        monster.lastDirectionChange = currentTime;
        monster.ambushCooldown = 0;
        // Store the player's position at the moment of ambush
        monster.ambushTargetX = player.x;
        monster.ambushTargetY = player.y;
        logger.debug(`Ambusher switching to ambush mode, targeting (${monster.ambushTargetX}, ${monster.ambushTargetY})`);
      }
    } else if (monster.behaviorState === 'ambushing') {
      // Ambush behavior: shoot in a straight line toward the stored target position
      const ambushSpeed = monster.speed * 5.0; // Very fast during ambush
      const dx = (monster.ambushTargetX || monster.x) - monster.x;
      const dy = (monster.ambushTargetY || monster.y) - monster.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 5) { // Keep moving until we're close to the target
        // Normalize direction for straight line movement
        const normX = dx / distance;
        const normY = dy / distance;

        // Move in a straight line toward the stored target
        const newX = monster.x + ambushSpeed * normX;
        const newY = monster.y + ambushSpeed * normY;

        // Platform collision check
        let canMoveX = true,
          canMoveY = true;

        for (const platform of platforms) {
          if (
            this.checkMonsterPlatformCollision({ ...monster, x: newX }, platform)
          ) {
            canMoveX = false;
          }
          if (
            this.checkMonsterPlatformCollision({ ...monster, y: newY }, platform)
          ) {
            canMoveY = false;
          }
        }

        if (canMoveX) monster.x = newX;
        if (canMoveY) monster.y = newY;
      } else {
        // Reached the target position, return to wandering
        monster.behaviorState = 'wandering';
        monster.lastDirectionChange = currentTime;
        logger.debug('Ambusher reached target, returning to wandering mode');
      }
    }
  }

  private updateFloater(monster: Monster, currentTime: number): void {
    // Floater moves in a gentle sine wave pattern, staying within bounds
    const timeSinceSpawn = currentTime - (monster.spawnTime || currentTime);
    const waveOffset = Math.sin(timeSinceSpawn / 2000) * 20; // Slower, smaller wave

    // Move horizontally with platform collision checking
    const newX = monster.x + monster.speed * monster.direction;
    const gameState = useGameStore.getState();
    const platforms = gameState.platforms || [];
    let canMoveX = true;

    for (const platform of platforms) {
      if (
        this.checkMonsterPlatformCollision({ ...monster, x: newX }, platform)
      ) {
        canMoveX = false;
        break;
      }
    }

    if (canMoveX) {
      monster.x = newX;
    } else {
      // Change direction if we hit a platform
      monster.direction *= -1;
      monster.lastDirectionChange = currentTime;
    }

    // Apply gentle vertical wave movement with bounds checking
    const newY = monster.y + waveOffset * 0.1; // Very gentle movement
    const minY = monster.patrolStartY || GAME_CONFIG.CANVAS_HEIGHT - 200;
    const maxY = monster.patrolEndY || GAME_CONFIG.CANVAS_HEIGHT - 50;

    if (newY >= minY && newY <= maxY) {
      monster.y = newY;
    }

    // Change horizontal direction at boundaries
    if (monster.x <= monster.patrolStartX || monster.x >= monster.patrolEndX) {
      monster.direction *= -1;
      monster.lastDirectionChange = currentTime;
    }
  }

  private checkMonsterPlatformCollision(
    monster: Monster,
    platform: any
  ): boolean {
    return (
      monster.x < platform.x + platform.width &&
      monster.x + monster.width > platform.x &&
      monster.y < platform.y + platform.height &&
      monster.y + monster.height > platform.y
    );
  }
}
