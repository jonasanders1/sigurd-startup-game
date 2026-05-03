import { Monster, isPatrolMonster } from "../../types/interfaces";
import { GAME_CONFIG, COLORS } from "../../types/constants";
import { useLevelStore } from "../../stores/gameStore";
import { MovementUtils } from "./MovementUtils";
import { ScalingManager } from "../ScalingManager";
import { logger } from "../../lib/logger";
import { armMonsterAsLethal } from "../../lib/bjRules";
import { getTuned } from "../../stores/systems/tuningStore";
import { getDefaultHitbox } from "../../config/monsterHitboxes";

export class PatrolMovement {
  public update(monster: Monster, currentTime: number, gameState?: any, deltaTime?: number): void {
    // Check if game is paused
    if (gameState && gameState.currentState !== 'PLAYING') {
      return;
    }

    // Determine if this is horizontal or vertical patrol based on monster type
    const isHorizontal = monster.type === "MUMMY";
    
    if (isHorizontal) {
      this.updateHorizontalPatrol(monster, currentTime, deltaTime);
    } else {
      this.updateVerticalPatrol(monster, currentTime, deltaTime);
    }
  }

  private updateHorizontalPatrol(monster: Monster, currentTime: number, deltaTime?: number): void {
    // Type guard to ensure this is a patrol monster
    if (!isPatrolMonster(monster)) return;

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
    const isMummy = monster.type === "MUMMY";

    // BJ §5.1.2: a mummy that dropped off a platform falls until it hits a
    // platform below or the canvas bottom. On canvas-bottom hit it
    // transforms (Ground entity removed; bottom edge is the new floor).
    if (monster.isFalling) {
      this.updateFallingMummy(monster, platforms, frameMult);
      return;
    }

    // Normal patrol movement
    const newX = monster.x + frameSpeed * monster.direction;

    if (
      newX < monster.patrolStartX ||
      newX + monster.width > monster.patrolEndX
    ) {
      // Mummy drop trigger: deterministic by `walkLengths`. Each edge touch
      // increments `currentWalkCount`; when it reaches `walkLengths`, the
      // mummy drops off this platform (BJ §5.1.2). Other patrol types
      // always turn.
      if (isMummy) {
        const walks = (monster.currentWalkCount ?? 0) + 1;
        const limit = monster.walkLengths ?? 1;
        if (walks >= limit) {
          monster.currentWalkCount = 0;
          monster.isFalling = true;
          monster.velocityY = 0;
          monster.x = newX;
          monster.isGrounded = false;
          // Stamp start-of-fall Y so updateFallingMummy gates re-landing on
          // a minimum drop distance (otherwise we land back on the source
          // platform within one frame).
          monster.fallStartY = monster.y;
          // CRITICAL: bail before findCurrentPlatform/handleGroundCollision
          // below — those would snap the mummy back onto its source platform.
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
    } else if (monster.y + monster.height >= GAME_CONFIG.CANVAS_HEIGHT) {
      // Standing on the canvas bottom (the new floor).
      monster.y = GAME_CONFIG.CANVAS_HEIGHT - monster.height;
      monster.velocityY = 0;
      monster.isGrounded = true;
    }
  }

  /**
   * BJ §5.1.2 dropped-mummy fall. Falls under gravity until it lands on a
   * platform (continues patrolling there with new bounds) or the canvas
   * bottom (transforms into SPHERE — the Ground entity was removed and the
   * canvas bottom is now the floor).
   *
   * Re-landing is gated on minimum fallen distance: the mummy starts the
   * fall on top of its source platform, so without this guard it would
   * "land" back on that platform within one frame (findCurrentPlatform's
   * 2-px tolerance + the 5-px landing tolerance both pass).
   */
  private updateFallingMummy(
    monster: Monster,
    platforms: import("../../types/interfaces").Platform[],
    frameMult: number
  ): void {
    if (!isPatrolMonster(monster)) return;

    // Phase 1: "scoot off the edge". When the drop fires, the mummy is only
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
      (monster.velocityY ?? 0) + getTuned("MUMMY_FALL_GRAVITY") * frameMult;
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

    // Canvas-bottom check after platforms — a platform sitting flush with
    // the canvas bottom should still catch the mummy first.
    if (monster.y + monster.height >= GAME_CONFIG.CANVAS_HEIGHT) {
      monster.y = GAME_CONFIG.CANVAS_HEIGHT - monster.height;
      monster.velocityY = 0;
      monster.isFalling = false;
      monster.fallStartY = undefined;
      if (monster.type === "MUMMY") {
        this.transformMummyOnGround(monster);
      }
      return;
    }
  }

  /**
   * BJ §5.1.2 / Monster-Movments.md: ground-impact transform. Each mummy
   * carries a per-instance `transformTarget` set in the editor:
   *   "SPHERE" (default — canonical BJ), "ORB", or "NONE" (die).
   * Re-uses the `mutationEndTime` channel for the pass-through safe window
   * so the player can cross the transformation point.
   */
  private transformMummyOnGround(monster: Monster): void {
    if (!isPatrolMonster(monster)) return;
    const target = monster.transformTarget ?? "SPHERE";

    if (target === "NONE") {
      monster.isActive = false;
      monster.isDead = true;
      logger.monster(`Mummy died on ground at (${monster.x}, ${monster.y})`);
      return;
    }

    // Snapshot pre-transform shape so a kill on the transformed monster
    // respawns as a fresh mummy. resetMonsterState restores from these
    // fields and clears them.
    monster.originalType = monster.type;
    monster.originalColor = monster.color;
    monster.originalWidth = monster.width;
    monster.originalHeight = monster.height;

    // Type and color move into the airborne family — the discriminated
    // union doesn't permit cross-variant assignment, so cast through a
    // narrow record for those two fields only.
    const cross = monster as unknown as { type: string; color: string };
    cross.type = target;
    cross.color = (COLORS.MONSTER_TYPES as Record<string, string>)[target];

    // Reset hitbox to the target type's default. Mummy's per-frame stride
    // (32×18) leaves the wrong dimensions otherwise; anchor at the feet so
    // the swap doesn't visually jump.
    const newBox = getDefaultHitbox(target);
    const feetX = monster.x + monster.width / 2;
    const feetY = monster.y + monster.height;
    monster.width = newBox.width;
    monster.height = newBox.height;
    monster.x = feetX - newBox.width / 2;
    monster.y = feetY - newBox.height;
    monster._hitboxOffsetX = 0;
    monster._hitboxOffsetY = 0;
    monster._hitboxRotation = 0;

    monster.velocityX = 0;
    monster.velocityY = 0;
    monster.isGrounded = false;
    monster.isFalling = false;
    monster.mutationEndTime = Date.now() + getTuned("MUTATION_PASSTHROUGH_MS");
    logger.monster(
      `Mummy transformed into ${target} at (${monster.x}, ${monster.y})`
    );
  }

  private updateVerticalPatrol(monster: Monster, currentTime: number, deltaTime?: number): void {
    // Type guard to ensure this is a patrol monster
    if (!isPatrolMonster(monster)) return;
    
    // Get individual scaling values for this monster
    const scalingManager = ScalingManager.getInstance();
    const valuesToUse = scalingManager.getMonsterScaledValues(monster);
    const baseValues = scalingManager.getBaseValues();
    const monsterAge = scalingManager.getMonsterAge(monster);
    const speed = valuesToUse.patrol.speed;
    
    // Initialize target X position only once
    if (!monster.originalSpawnX) {
      const platforms = useLevelStore.getState().platforms || [];
      const patrolSide = (monster as any).patrolSide || "left";
      const targetPlatformX = (monster as any).targetPlatformX;
      
      // Find the target vertical platform using the stored targetPlatformX
      const targetPlatform = platforms.find(platform => 
        platform.isVertical && 
        Math.abs(platform.x - targetPlatformX) < 1 // Use exact match with small tolerance
      );
      
      if (targetPlatform) {
        const spacing = 8; // Equal spacing from platform edge
        monster.originalSpawnX = patrolSide === "left" 
          ? targetPlatform.x - monster.width - spacing // Left side of wall
          : targetPlatform.x + spacing + targetPlatform.width; // Right side of wall
        monster.x = monster.originalSpawnX; // Set initial position
      }
    }
    
    // Simple up and down movement within patrol bounds using appropriate speed (frame-rate independent)
    const frameSpeed = deltaTime ? speed * (deltaTime / 16.67) : speed; // 16.67ms = 60fps
    const newY = monster.y + frameSpeed * monster.direction;

    // Check if we would walk off the patrol area
    if (
      newY < monster.patrolStartY ||
      newY + monster.height > monster.patrolEndY
    ) {
      // Turn around
      monster.direction *= -1;
      monster.lastDirectionChange = currentTime;
      armMonsterAsLethal(monster);
    } else {
      // Safe to move
      monster.y = newY;
    }

    // Keep monster at fixed X position (no repositioning every frame)
    if (monster.originalSpawnX !== undefined) {
      monster.x = monster.originalSpawnX; // Always return to exact position
      monster.velocityX = 0;
      monster.velocityY = 0;
      monster.isGrounded = false;
    } else {
      // Keep monster at fixed X position if no vertical platform found
      monster.velocityX = 0;
      monster.velocityY = 0;
      monster.isGrounded = false;
    }
  }

}