import { Monster, isPatrolMonster } from "../../types/interfaces";
import { BYRAKRAT_TRANSITION_DURATION_MS } from "../../entities/Bureaucrat";
import { GAME_CONFIG, COLORS } from "../../types/constants";
import { PLAYFIELD_BOTTOM } from "../../config/floor";
import { useLevelStore } from "../../stores/gameStore";
import { MovementUtils } from "./MovementUtils";
import { ScalingManager } from "../ScalingManager";
import { logger } from "../../lib/logger";
import { armMonsterAsLethal } from "../../lib/bjRules";
import { getTuned } from "../../stores/systems/tuningStore";
import { getDefaultBounds } from "../../config/monsterBounds";

export class PatrolMovement {
  public update(monster: Monster, currentTime: number, gameState?: any, deltaTime?: number): void {
    // Check if game is paused
    if (gameState && gameState.currentState !== 'PLAYING') {
      return;
    }

    this.updateHorizontalPatrol(monster, currentTime, deltaTime);
  }

  private updateHorizontalPatrol(monster: Monster, currentTime: number, deltaTime?: number): void {
    // Type guard to ensure this is a patrol monster
    if (!isPatrolMonster(monster)) return;

    // Bureaucrat ground-impact transition: pause movement while the transition
    // animation plays. On completion, run the type-swap (or die for NONE).
    if (monster.isTransitioning) {
      const elapsed = Date.now() - (monster.transitionStartTime ?? 0);
      if (elapsed >= BYRAKRAT_TRANSITION_DURATION_MS) {
        monster.isTransitioning = false;
        monster.transitionStartTime = undefined;
        this.transformBureaucratOnGround(monster);
      }
      return;
    }

    const scalingManager = ScalingManager.getInstance();
    const valuesToUse = scalingManager.getMonsterScaledValues(monster);
    const monsterAge = scalingManager.getMonsterAge(monster);
    const speed = valuesToUse.patrol.speed;

    if (monsterAge < 2) {
      logger.debug(`Patrol scaling - Age: ${monsterAge.toFixed(1)}s, Speed: ${speed.toFixed(2)}`);
    }

    const frameMult = deltaTime ? deltaTime / 16.67 : 1;
    const frameSpeed = speed * frameMult;

    const levelState = useLevelStore.getState();
    const platforms = levelState.platforms || [];
    const isBureaucrat = monster.type === "BUREAUCRAT";

    // BJ §5.1.2: a bureaucrat that dropped off a platform falls until it hits a
    // platform below or the canvas bottom. On canvas-bottom hit it
    // transforms (Ground entity removed; bottom edge is the new floor).
    if (monster.isFalling) {
      this.updateFallingBureaucrat(monster, platforms, frameMult);
      return;
    }

    // Normal patrol movement
    const newX = monster.x + frameSpeed * monster.direction;

    if (
      newX < monster.patrolStartX ||
      newX + monster.width > monster.patrolEndX
    ) {
      // Bureaucrat drop trigger: deterministic by `walkLengths`. Each edge touch
      // increments `currentWalkCount`; when it reaches `walkLengths`, the
      // bureaucrat drops off this platform (BJ §5.1.2). Other patrol types
      // always turn.
      if (isBureaucrat) {
        const walks = (monster.currentWalkCount ?? 0) + 1;
        const limit = monster.walkLengths ?? 1;
        if (walks >= limit) {
          monster.currentWalkCount = 0;
          monster.isFalling = true;
          monster.velocityY = 0;
          monster.x = newX;
          monster.isGrounded = false;
          // Stamp start-of-fall Y so updateFallingBureaucrat gates re-landing on
          // a minimum drop distance (otherwise we land back on the source
          // platform within one frame).
          monster.fallStartY = monster.y;
          // CRITICAL: bail before findCurrentPlatform/handleGroundCollision
          // below — those would snap the bureaucrat back onto its source platform.
          return;
        }
        monster.currentWalkCount = walks;
      }
      monster.direction *= -1;
      monster.lastDirectionChange = currentTime;
      armMonsterAsLethal(monster);
    } else {
      monster.x = newX;
    }

    const currentPlatform = MovementUtils.findCurrentPlatform(monster, platforms);
    if (currentPlatform) {
      monster.y = currentPlatform.y - monster.height;
      monster.velocityY = 0;
      monster.isGrounded = true;
    } else if (monster.y + monster.height >= PLAYFIELD_BOTTOM) {
      // Standing on top of the floor strip (the playfield's ground).
      monster.y = PLAYFIELD_BOTTOM - monster.height;
      monster.velocityY = 0;
      monster.isGrounded = true;
    }
  }

  /**
   * BJ §5.1.2 dropped-bureaucrat fall. Falls under gravity until it lands on a
   * platform (continues patrolling there with new bounds) or the canvas
   * bottom (transforms into CONSULTANT — the Ground entity was removed and the
   * canvas bottom is now the floor).
   *
   * Re-landing is gated on minimum fallen distance: the bureaucrat starts the
   * fall on top of its source platform, so without this guard it would
   * "land" back on that platform within one frame (findCurrentPlatform's
   * 2-px tolerance + the 5-px landing tolerance both pass).
   */
  private updateFallingBureaucrat(
    monster: Monster,
    platforms: import("../../types/interfaces").Platform[],
    frameMult: number
  ): void {
    if (!isPatrolMonster(monster)) return;

    // Phase 1: "scoot off the edge". When the drop fires, the bureaucrat is only
    // ONE walk-frame past its patrol bound — its body still overlaps the
    // source platform horizontally. Letting gravity engage here would clip
    // it down through the platform's edge. Walk past the footprint first.
    const dir = monster.direction;
    const fullyCleared =
      dir > 0
        ? monster.x >= monster.patrolEndX
        : monster.x + monster.width <= monster.patrolStartX;

    if (!fullyCleared) {
      const speed = ScalingManager.getInstance()
        .getMonsterScaledValues(monster).patrol.speed;
      monster.x += speed * dir * frameMult;
      // fallStartY tracks current y so the gate measures from the moment
      // gravity actually starts, not from the trigger frame.
      monster.fallStartY = monster.y;
      return;
    }

    // Phase 2: gravity-driven fall. Snapshot prev-y BEFORE moving so the
    // swept-landing check below can detect feet crossing a platform top in
    // a single frame — a static y-tolerance test misses fast falls where
    // vy > the tolerance window.
    const prevY = monster.y;
    monster.velocityY =
      (monster.velocityY ?? 0) + getTuned("BUREAUCRAT_FALL_GRAVITY") * frameMult;
    monster.y += (monster.velocityY ?? 0) * frameMult;

    // Swept landing check. The scoot phase has already pushed us past the
    // source platform's x-range, so source self-landing is naturally
    // excluded by the x-overlap requirement.
    const prevBottom = prevY + monster.height;
    const newBottom = monster.y + monster.height;
    if (newBottom >= prevBottom) {
      for (const p of platforms) {
        if (
          prevBottom <= p.y &&
          newBottom >= p.y &&
          monster.x < p.x + p.width &&
          monster.x + monster.width > p.x
        ) {
          monster.y = p.y - monster.height;
          monster.velocityY = 0;
          monster.isFalling = false;
          monster.isGrounded = true;
          monster.fallStartY = undefined;
          monster.currentWalkCount = 0;
          monster.patrolStartX = p.x;
          monster.patrolEndX = p.x + p.width;
          return;
        }
      }
    }

    // Floor-top check after platforms — a platform sitting flush with the
    // floor should still catch the bureaucrat first.
    if (monster.y + monster.height >= PLAYFIELD_BOTTOM) {
      monster.y = PLAYFIELD_BOTTOM - monster.height;
      monster.velocityY = 0;
      monster.isFalling = false;
      monster.fallStartY = undefined;
      if (monster.type === "BUREAUCRAT") {
        // Enter transition phase — animation plays in place, then the next
        // updateHorizontalPatrol tick runs transformBureaucratOnGround.
        monster.isTransitioning = true;
        monster.transitionStartTime = Date.now();
      }
      return;
    }
  }

  /**
   * BJ §5.1.2 / Monster-Movments.md: ground-impact transform. Each bureaucrat
   * carries a per-instance `transformTarget` set in the editor. Canonical
   * BJ uses CONSULTANT/ROBOT; we allow any monster type plus "NONE" (die).
   * Re-uses the `mutationEndTime` channel for the pass-through safe window
   * so the player can cross the transformation point.
   */
  private transformBureaucratOnGround(monster: Monster): void {
    if (!isPatrolMonster(monster)) return;
    const target = monster.transformTarget ?? "CONSULTANT";

    if (target === "NONE") {
      monster.isActive = false;
      monster.isDead = true;
      logger.monster(`Bureaucrat died on ground at (${monster.x}, ${monster.y})`);
      return;
    }

    // Snapshot pre-transform shape so a kill on the transformed monster
    // respawns as a fresh bureaucrat. resetMonsterState restores from these
    // fields and clears them.
    monster.originalType = monster.type;
    monster.originalColor = monster.color;
    monster.originalWidth = monster.width;
    monster.originalHeight = monster.height;

    // Type and color move to the target — the discriminated union doesn't
    // permit cross-variant assignment, so cast through a narrow record.
    const cross = monster as unknown as { type: string; color: string };
    cross.type = target;
    cross.color = (COLORS.MONSTER_TYPES as Record<string, string>)[target];

    // Reset hitbox to the target type's default. Bureaucrat's per-frame stride
    // (32×18) leaves the wrong dimensions otherwise; anchor at the feet so
    // the swap doesn't visually jump.
    const newBox = getDefaultBounds(target);
    const feetX = monster.x + monster.width / 2;
    const feetY = monster.y + monster.height;
    monster.width = newBox.width;
    monster.height = newBox.height;
    monster.x = feetX - newBox.width / 2;
    monster.y = feetY - newBox.height;
    monster._boundsOffsetX = 0;
    monster._boundsOffsetY = 0;
    monster._boundsRotation = 0;

    monster.velocityX = 0;
    monster.velocityY = 0;
    monster.isGrounded = false;
    monster.isFalling = false;
    monster.mutationEndTime = Date.now() + getTuned("MUTATION_PASSTHROUGH_MS");

    // BUREAUCRAT-as-target needs patrol bounds at the impact site so
    // PatrolMovement has something to walk between. Use a small window
    // around the impact point clamped to the canvas; walkLengths=1 so it
    // immediately drops again on the next edge touch.
    if (target === "BUREAUCRAT") {
      const PATROL_HALF_WIDTH = 100;
      const minX = 0;
      const maxX = GAME_CONFIG.CANVAS_WIDTH;
      const start = Math.max(minX, monster.x + monster.width / 2 - PATROL_HALF_WIDTH);
      const end = Math.min(maxX, monster.x + monster.width / 2 + PATROL_HALF_WIDTH);
      const patrol = monster as unknown as {
        patrolStartX: number;
        patrolEndX: number;
        originalPatrolStartX?: number;
        originalPatrolEndX?: number;
        walkLengths?: number;
        currentWalkCount?: number;
        direction: number;
      };
      patrol.patrolStartX = start;
      patrol.patrolEndX = end;
      patrol.originalPatrolStartX = start;
      patrol.originalPatrolEndX = end;
      patrol.walkLengths = 1;
      patrol.currentWalkCount = 0;
      patrol.direction = patrol.direction >= 0 ? 1 : -1;
    }

    logger.monster(
      `Bureaucrat transformed into ${target} at (${monster.x}, ${monster.y})`
    );
  }

}