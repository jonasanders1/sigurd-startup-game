/**
 * BJ airborne-form movement (Monster-Movments.md, game-specs §5.1.3).
 *
 * Two behaviors share a single frame-update method, branching on type:
 *
 *  - ROBOT:    tracks Jack's Y (horizontal row); bobs X edge-to-edge,
 *            bouncing off the left/right boundaries.
 *  - CONSULTANT: tracks Jack's X (vertical column); bobs Y edge-to-edge,
 *            bouncing off the top/bottom boundaries.
 *
 * Sigurd-deviates from BJ §5.5: airborne forms DO collide with platforms
 * and the canvas-bottom floor here (BJ canonical lets them fly through).
 */

import { Monster, Platform, isAirborneMonster } from "../../types/interfaces";
import { GAME_CONFIG } from "../../types/constants";
import { PLAYFIELD_BOTTOM } from "../../config/floor";
import { useLevelStore } from "../../stores/gameStore";
import { armMonsterAsLethal } from "../../lib/bjRules";
import { getTuned } from "../../stores/systems/tuningStore";
import { MovementUtils } from "./MovementUtils";

// Homing/cap constants are now tunable via the panel; read fresh on each
// frame inside the per-type updaters.

export class AirborneMovement {
  public update(
    monster: Monster,
    currentTime: number,
    gameState: { currentState?: string; player?: { x: number; y: number } } | undefined,
    deltaTime?: number
  ): void {
    if (!isAirborneMonster(monster)) return;
    if (gameState?.currentState !== "PLAYING") return;
    const player = gameState?.player;
    if (!player) return;

    // Airborne forms start moving immediately — first frame's motion IS
    // their first AI decision, so arm them up front (BJ §5.4).
    armMonsterAsLethal(monster);

    const frameMult = deltaTime ? deltaTime / 16.67 : 1;

    // Stamp the moment this monster became airborne — used to ramp the
    // homing pull from 0 → full over `*_HOMING_RAMP_MS`. We use a separate
    // field (not `individualSpawnTime`) so the ScalingManager's bureaucrat-age
    // tracking isn't affected by the transformation.
    //
    // Also stamp per-monster homing jitter on first sight: a multiplicative
    // scale on the spring constant + a small offset on the target lane.
    // Without this, every Robot has identical spring dynamics and they
    // synchronize after a handful of wall bounces (same for Consultants). The
    // jitter is set once and never changes, so each monster carries a
    // distinct phase signature for its lifetime.
    const m = monster as Monster & {
      airborneStartTime?: number;
      homingScale?: number;
      homingOffset?: number;
    };
    // Pause-adjusted clock: the homing ramp must not complete while the game
    // is paused or the monster is frozen (raw Date.now() would keep ticking).
    if (m.airborneStartTime == null) m.airborneStartTime = currentTime;
    if (m.homingScale == null) m.homingScale = 0.7 + Math.random() * 0.6; // 0.7–1.3
    if (m.homingOffset == null) m.homingOffset = (Math.random() - 0.5) * 30; // ±15 px

    switch (monster.type) {
      case "ROBOT":
        this.updateRobot(monster, player, frameMult, currentTime);
        break;
      case "CONSULTANT":
        this.updateConsultant(monster, player, frameMult, currentTime);
        break;
    }
  }

  /**
   * Predicate: would the monster overlap any platform at (newX, newY)?
   * Reused by all three updaters for axis-separated collision-aware motion.
   * Cheap — AABB tests against the level's platforms list. Canvas-bottom
   * bouncing is handled directly in stepAxisWithBounce.
   */
  private collidesWithObstacle(
    monster: Monster,
    newX: number,
    newY: number,
    platforms: Platform[]
  ): boolean {
    const probe = { ...monster, x: newX, y: newY };
    for (const p of platforms) {
      if (MovementUtils.checkMonsterPlatformCollision(probe, p)) return true;
    }
    return false;
  }

  /**
   * Apply a single axis update with edge-bounce and obstacle-bounce.
   * Used by both Robot and Consultant on each axis. The bounce reverses the
   * matching velocity component when something is hit, keeping kinetic
   * energy and producing the chaotic ricochet feel.
   */
  private stepAxisWithBounce(
    monster: Monster,
    axis: "x" | "y",
    frameMult: number,
    platforms: Platform[]
  ): void {
    const v = (axis === "x" ? monster.velocityX : monster.velocityY) ?? 0;
    // Facing direction for the bump animation suffix: derived from the
    // current horizontal velocity so vertical bumps still pick a sensible
    // L/R sprite. Falls back to monster.direction when stationary on X.
    const vx = monster.velocityX ?? 0;
    const facing: -1 | 1 = vx < 0 ? -1 : vx > 0 ? 1 : monster.direction < 0 ? -1 : 1;
    const bumped = (kind: "horizontal" | "vertical") => {
      monster.bumpAxis = kind;
      monster.bumpDirection = facing;
      monster.bumpedAt = Date.now();
    };
    if (axis === "x") {
      const newX = monster.x + v * frameMult;
      if (newX <= 0) {
        monster.x = 0;
        monster.velocityX = Math.abs(v);
        bumped("horizontal");
      } else if (newX + monster.width >= GAME_CONFIG.CANVAS_WIDTH) {
        monster.x = GAME_CONFIG.CANVAS_WIDTH - monster.width;
        monster.velocityX = -Math.abs(v);
        bumped("horizontal");
      } else if (
        this.collidesWithObstacle(monster, newX, monster.y, platforms)
      ) {
        monster.velocityX = -v;
        bumped("horizontal");
      } else {
        monster.x = newX;
      }
    } else {
      const newY = monster.y + v * frameMult;
      if (newY <= 0) {
        monster.y = 0;
        monster.velocityY = Math.abs(v);
        bumped("vertical");
      } else if (newY + monster.height >= PLAYFIELD_BOTTOM) {
        monster.y = PLAYFIELD_BOTTOM - monster.height;
        monster.velocityY = -Math.abs(v);
        bumped("vertical");
      } else if (
        this.collidesWithObstacle(monster, monster.x, newY, platforms)
      ) {
        monster.velocityY = -v;
        bumped("vertical");
      } else {
        monster.y = newY;
      }
    }
  }

  /**
   * ROBOT — 2D bouncing ball. X bounces freely (free axis); Y is
   * spring-coupled to Jack's row (constrained axis): a Hooke's-law force
   * pulls the robot's Y back toward Jack's row, but no damping is applied —
   * so the robot oscillates above-and-below Jack with amplitude that gets
   * amplified by every wall/platform bounce. Both axes get a random
   * starting kick, so the constrained axis is bouncy from frame one.
   *
   * `ROBOT_HOMING_RATIO` / `CONSULTANT_HOMING_RATIO` controls the spring
   * constant: higher = stronger pull = tighter oscillation. 0 = no homing.
   */
  private updateRobot(
    monster: Monster,
    player: { x: number; y: number },
    frameMult: number,
    currentTime: number
  ): void {
    this.updateAxisMirror(
      monster,
      player,
      frameMult,
      currentTime,
      "x",
      "ROBOT_HOMING_RATIO",
      "ROBOT_HOMING_RAMP_MS",
      "ROBOT_VELOCITY_CAP_MULT",
      "ROBOT_FREE_KICK_MULT",
      "ROBOT_CONSTRAINED_KICK_MULT"
    );
  }

  /**
   * CONSULTANT — mirror of ROBOT. Y is the free axis (with the upward starting
   * kick from the bureaucrat transform), X is spring-coupled to Jack's column.
   */
  private updateConsultant(
    monster: Monster,
    player: { x: number; y: number },
    frameMult: number,
    currentTime: number
  ): void {
    this.updateAxisMirror(
      monster,
      player,
      frameMult,
      currentTime,
      "y",
      "CONSULTANT_HOMING_RATIO",
      "CONSULTANT_HOMING_RAMP_MS",
      "CONSULTANT_VELOCITY_CAP_MULT",
      "CONSULTANT_FREE_KICK_MULT",
      "CONSULTANT_CONSTRAINED_KICK_MULT"
    );
  }

  /**
   * Shared body for Robot (free=X) and Consultant (free=Y). The free axis gets a
   * ±speed bouncing initial kick; the constrained axis gets a smaller
   * (±1.5×speed) starting kick plus a Hooke's-law spring force toward
   * Jack's lane each frame. Both axes bounce off canvas edges, platforms,
   * and the ground. SPRING_K_SCALE shapes the homing-ratio tuning into a
   * spring constant; FREE_AXIS_KICK / CONSTRAINED_AXIS_KICK and
   * VELOCITY_CAP_MULT are local feel constants.
   */
  private updateAxisMirror(
    monster: Monster,
    player: { x: number; y: number },
    frameMult: number,
    currentTime: number,
    freeAxis: "x" | "y",
    homingRatioKey: "ROBOT_HOMING_RATIO" | "CONSULTANT_HOMING_RATIO",
    homingRampKey: "ROBOT_HOMING_RAMP_MS" | "CONSULTANT_HOMING_RAMP_MS",
    velocityCapKey: "ROBOT_VELOCITY_CAP_MULT" | "CONSULTANT_VELOCITY_CAP_MULT",
    freeKickKey: "ROBOT_FREE_KICK_MULT" | "CONSULTANT_FREE_KICK_MULT",
    constrainedKickKey:
      | "ROBOT_CONSTRAINED_KICK_MULT"
      | "CONSULTANT_CONSTRAINED_KICK_MULT"
  ): void {
    const FREE_AXIS_KICK = getTuned(freeKickKey);
    const CONSTRAINED_AXIS_KICK = getTuned(constrainedKickKey);
    const SPRING_K_SCALE = 0.02;
    const VELOCITY_CAP_MULT = getTuned(velocityCapKey);

    const constrainedAxis: "x" | "y" = freeAxis === "x" ? "y" : "x";
    const freeVKey = freeAxis === "x" ? "velocityX" : "velocityY";
    const constrVKey = freeAxis === "x" ? "velocityY" : "velocityX";
    const constrPKey = freeAxis === "x" ? "y" : "x";

    if (!monster[freeVKey]) {
      // Consultant's free axis (Y) defaults UPWARD because bureaucrat-transformed
      // consultants spawn at ground level — no random sign there.
      monster[freeVKey] =
        freeAxis === "y" && constrainedAxis === "x"
          ? -monster.speed
          : monster.speed * FREE_AXIS_KICK * (Math.random() < 0.5 ? -1 : 1);
    }
    if (!monster[constrVKey]) {
      monster[constrVKey] =
        monster.speed * CONSTRAINED_AXIS_KICK * (Math.random() < 0.5 ? -1 : 1);
    }

    const levelState = useLevelStore.getState();
    const platforms = levelState.platforms || [];

    // Hooke's law spring on the constrained axis only. Pull strength ramps
    // linearly from 0 → configured ratio over `homingRampKey` ms after the
    // monster became airborne, so consultants/robots feel free-bouncing at first
    // and only gradually start tracking Jack. Per-monster `homingScale` +
    // `homingOffset` (stamped at airborne-start) give each monster its own
    // spring period and target lane, preventing identical-physics monsters
    // from synchronizing after a few bounces.
    const jitter = monster as Monster & {
      airborneStartTime?: number;
      homingScale?: number;
      homingOffset?: number;
    };
    const airborneStart = jitter.airborneStartTime ?? currentTime;
    const rampMs = getTuned(homingRampKey);
    const rampFactor =
      rampMs <= 0 ? 1 : Math.min(1, (currentTime - airborneStart) / rampMs);
    const k =
      getTuned(homingRatioKey) *
      SPRING_K_SCALE *
      rampFactor *
      (jitter.homingScale ?? 1);
    const displacement =
      player[constrPKey] + (jitter.homingOffset ?? 0) - monster[constrPKey];
    monster[constrVKey]! += k * displacement * frameMult;
    const cap = monster.speed * VELOCITY_CAP_MULT;
    if (Math.abs(monster[constrVKey]!) > cap) {
      monster[constrVKey] = Math.sign(monster[constrVKey]!) * cap;
    }

    this.stepAxisWithBounce(monster, "x", frameMult, platforms);
    this.stepAxisWithBounce(monster, "y", frameMult, platforms);
  }

}
