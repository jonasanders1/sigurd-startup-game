import { Monster } from "../../types/interfaces";
import { GAME_CONFIG } from "../../types/constants";
import { PLAYFIELD_BOTTOM } from "../../config/floor";
import { useGameStore, useLevelStore } from "../../stores/gameStore";
import { MovementUtils } from "./MovementUtils";
import { ScalingManager } from "../ScalingManager";
import { logger } from "../../lib/logger";
import { armMonsterAsLethal } from "../../lib/bjRules";
import { getTuned } from "../../stores/systems/tuningStore";

// Monster-Movments.md FOUNDER: "Bobs around the stage with no set intelligence.
// Caution: lack of attention holds a surprise despite its predictability."
// All four params live-tunable from the panel via getTuned() inside the
// methods below.

export class FloaterMovement {
  public update(
    monster: Monster,
    currentTime: number,
    gameStateParam?: any,
    deltaTime?: number
  ): void {
    // Check if game is paused
    if (gameStateParam && gameStateParam.currentState !== "PLAYING") {
      return;
    }

    // Get individual scaling values for this monster
    const scalingManager = ScalingManager.getInstance();
    const valuesToUse = scalingManager.getMonsterScaledValues(monster);
    const baseValues = scalingManager.getBaseValues();
    const monsterAge = scalingManager.getMonsterAge(monster);

    // Log scaling info for debugging (only in debug mode)
    if (monsterAge < 2) {
      logger.debug(
        `Floater scaling - Age: ${monsterAge.toFixed(
          1
        )}s, Speed: ${valuesToUse.floater.speed.toFixed(2)}`
      );
    }

    // Initialize velocity if not set (convert angle to velocity)
    if (!monster.velocityX && !monster.velocityY) {
      this.initializeVelocity(monster, valuesToUse.floater.speed);
    }

    // Schedule first surprise lazily — staggers Founders spawned at the same time.
    const m = monster as unknown as Record<string, unknown>;
    if (m.nextSurpriseTime === undefined) {
      const min = getTuned("FOUNDER_SURPRISE_INTERVAL_MIN");
      const max = getTuned("FOUNDER_SURPRISE_INTERVAL_MAX");
      m.nextSurpriseTime = currentTime + min + Math.random() * (max - min);
    }

    // Drive the surprise homing burst (Monster-Movments.md FOUNDER rule).
    // While active, Founder redirects velocity toward the player; once the
    // window closes it reverts to inertia-based bouncing.
    this.tickSurprise(monster, currentTime, gameStateParam?.player, valuesToUse.floater.speed);

    // Update velocity magnitude with current scaled speed (but preserve
    // direction). Skipped while a surprise burst is active — the burst sets a
    // boosted magnitude on purpose, and renormalizing here would cancel
    // FOUNDER_SURPRISE_BOOST the same frame it was applied.
    const surpriseActive = m.surpriseStartTime !== undefined;
    const currentSpeed = Math.sqrt(
      monster.velocityX * monster.velocityX +
        monster.velocityY * monster.velocityY
    );
    if (!surpriseActive && currentSpeed > 0) {
      const speedRatio = valuesToUse.floater.speed / currentSpeed;
      monster.velocityX *= speedRatio;
      monster.velocityY *= speedRatio;
    }

    // Move in straight line based on velocity (frame-rate independent)
    const frameMultiplier = deltaTime ? deltaTime / 16.67 : 1; // 16.67ms = 60fps
    const newX = monster.x + monster.velocityX * frameMultiplier;
    const newY = monster.y + monster.velocityY * frameMultiplier;

    // Check for collisions with platforms
    const gameState = useLevelStore.getState();
    const platforms = gameState.platforms || [];
    let canMove = true;
    let collisionNormal = { x: 0, y: 0 };

    // Check platform collisions
    for (const platform of platforms) {
      if (
        MovementUtils.checkMonsterPlatformCollision(
          { ...monster, x: newX, y: newY },
          platform
        )
      ) {
        canMove = false;
        collisionNormal = this.calculateCollisionNormal(monster, platform);
        break;
      }
    }

    // Check boundary collisions
    if (
      newX <= 0 ||
      newX + monster.width >= GAME_CONFIG.CANVAS_WIDTH ||
      newY <= 0 ||
      newY + monster.height >= PLAYFIELD_BOTTOM
    ) {
      canMove = false;
      collisionNormal = this.calculateBoundaryCollisionNormal(
        monster,
        newX,
        newY
      );
    }

    if (canMove) {
      // Safe to move
      monster.x = newX;
      monster.y = newY;
    } else {
      // Bounce off the collision using appropriate bounce angle
      this.bounceOffCollision(
        monster,
        collisionNormal,
        valuesToUse.floater.bounceAngle
      );
    }
  }

  /**
   * Founder "surprise" mechanic. Two windows:
   *  1. nextSurpriseTime not yet reached → predictable bouncing (no-op).
   *  2. Inside the SURPRISE_DURATION_MS window after that time → redirect
   *     velocity toward Jack at boosted speed.
   *  3. After the window closes → schedule the next surprise and resume
   *     bouncing.
   * Idempotent per frame; the velocity-magnitude rescale further down in
   * update() preserves the boost direction but normalizes magnitude — so
   * the boost is visible only for the surprise window.
   */
  private tickSurprise(
    monster: Monster,
    currentTime: number,
    player: { x: number; y: number } | undefined,
    baseSpeed: number
  ): void {
    if (!player) return;
    const m = monster as unknown as Record<string, unknown>;
    const nextSurprise = m.nextSurpriseTime as number | undefined;
    if (nextSurprise === undefined || currentTime < nextSurprise) return;

    const boost = getTuned("FOUNDER_SURPRISE_BOOST");
    const duration = getTuned("FOUNDER_SURPRISE_DURATION");

    const surpriseStart = m.surpriseStartTime as number | undefined;
    if (surpriseStart === undefined) {
      // First frame of the burst: pivot velocity toward Jack.
      m.surpriseStartTime = currentTime;
      const dx = player.x - monster.x;
      const dy = player.y - monster.y;
      const dist = Math.hypot(dx, dy) || 1;
      monster.velocityX = (dx / dist) * baseSpeed * boost;
      monster.velocityY = (dy / dist) * baseSpeed * boost;
      logger.monster(`Founder surprise burst → toward player`);
      return;
    }

    // Continuing burst — keep redirecting (player may have moved).
    if (currentTime - surpriseStart < duration) {
      const dx = player.x - monster.x;
      const dy = player.y - monster.y;
      const dist = Math.hypot(dx, dy) || 1;
      monster.velocityX = (dx / dist) * baseSpeed * boost;
      monster.velocityY = (dy / dist) * baseSpeed * boost;
      return;
    }

    // Burst complete — schedule the next one.
    const min = getTuned("FOUNDER_SURPRISE_INTERVAL_MIN");
    const max = getTuned("FOUNDER_SURPRISE_INTERVAL_MAX");
    m.surpriseStartTime = undefined;
    m.nextSurpriseTime = currentTime + min + Math.random() * (max - min);
  }

  private initializeVelocity(monster: Monster, scaledSpeed: number): void {
    // Type guard to ensure this is a floater monster
    if (monster.type !== "FOUNDER") return;

    const angle = monster.startAngle || 45; // Default to 45 degrees if not specified

    // Convert angle from degrees to radians
    const angleRad = (angle * Math.PI) / 180;

    monster.velocityX = Math.cos(angleRad) * scaledSpeed;
    monster.velocityY = Math.sin(angleRad) * scaledSpeed;
  }

  private calculateCollisionNormal(
    monster: Monster,
    platform: any
  ): { x: number; y: number } {
    const monsterCenterX = monster.x + monster.width / 2;
    const monsterCenterY = monster.y + monster.height / 2;

    // Find the closest point on the platform to the monster center
    const closestX = Math.max(
      platform.x,
      Math.min(monsterCenterX, platform.x + platform.width)
    );
    const closestY = Math.max(
      platform.y,
      Math.min(monsterCenterY, platform.y + platform.height)
    );

    // Calculate the normal vector from the closest point to the monster center
    const normalX = monsterCenterX - closestX;
    const normalY = monsterCenterY - closestY;

    // Normalize the normal vector
    const length = Math.sqrt(normalX * normalX + normalY * normalY);

    if (length > 0.1) {
      return { x: normalX / length, y: normalY / length };
    } else {
      // Monster is very close to the platform - determine which side
      const distToLeft = Math.abs(monster.x + monster.width - platform.x);
      const distToRight = Math.abs(monster.x - (platform.x + platform.width));
      const distToTop = Math.abs(monster.y + monster.height - platform.y);
      const distToBottom = Math.abs(monster.y - (platform.y + platform.height));

      const minDist = Math.min(
        distToLeft,
        distToRight,
        distToTop,
        distToBottom
      );

      if (minDist === distToLeft) return { x: -1, y: 0 };
      if (minDist === distToRight) return { x: 1, y: 0 };
      if (minDist === distToTop) return { x: 0, y: -1 };
      return { x: 0, y: 1 };
    }
  }

  private calculateBoundaryCollisionNormal(
    monster: Monster,
    newX: number,
    newY: number
  ): { x: number; y: number } {
    if (newX <= 0) return { x: 1, y: 0 }; // Left boundary
    if (newX + monster.width >= GAME_CONFIG.CANVAS_WIDTH)
      return { x: -1, y: 0 }; // Right boundary
    if (newY <= 0) return { x: 0, y: 1 }; // Top boundary
    return { x: 0, y: -1 }; // Bottom boundary
  }

  private bounceOffCollision(
    monster: Monster,
    normal: { x: number; y: number },
    bounceAngle: number
  ): void {
    // Capture facing for the bump animation suffix BEFORE the velocity flip.
    const vx = monster.velocityX ?? 0;
    const facing: -1 | 1 = vx < 0 ? -1 : vx > 0 ? 1 : monster.direction < 0 ? -1 : 1;

    // Calculate the dot product of velocity and normal
    const dotProduct =
      monster.velocityX * normal.x + monster.velocityY * normal.y;

    // Only reflect when actually moving INTO the surface. If the previous
    // bounce's random rotation left the velocity already pointing outward
    // while the body still overlaps, reflecting again would flip it back
    // inward — an endless jitter-against-the-wall loop that also re-arms
    // lethality every frame.
    if (dotProduct >= 0) return;

    // Reflect the velocity vector
    monster.velocityX = monster.velocityX - 2 * dotProduct * normal.x;
    monster.velocityY = monster.velocityY - 2 * dotProduct * normal.y;

    // Add some randomness to the bounce based on bounceAngle
    const randomAngle = (Math.random() - 0.5) * bounceAngle;
    const speed = Math.sqrt(
      monster.velocityX * monster.velocityX +
        monster.velocityY * monster.velocityY
    );

    // Apply random angle change
    const currentAngle = Math.atan2(monster.velocityY, monster.velocityX);
    const newAngle = currentAngle + randomAngle;

    monster.velocityX = Math.cos(newAngle) * speed;
    monster.velocityY = Math.sin(newAngle) * speed;

    // BJ §5.4: a bounce IS a direction change → arm Founder as lethal.
    armMonsterAsLethal(monster);

    // Bump animation: pick axis from the dominant collision normal.
    monster.bumpAxis =
      Math.abs(normal.x) > Math.abs(normal.y) ? "horizontal" : "vertical";
    monster.bumpDirection = facing;
    monster.bumpedAt = Date.now();
  }
}
