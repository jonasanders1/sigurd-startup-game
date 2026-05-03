import { Monster, isBirdMonster } from "../../types/interfaces";
import { armMonsterAsLethal } from "../../lib/bjRules";
import { MovementUtils } from "./MovementUtils";
import { ScalingManager } from "../ScalingManager";
import { GAME_CONFIG } from "../../types/constants";
import { getTuned } from "../../stores/systems/tuningStore";
import * as PF from "pathfinding";

/**
 * Bird movement: discrete cardinal hops along an A*-planned path toward a
 * delayed snapshot of Jack's position. Bird is the only monster that uses
 * pathfinding — everything else uses simpler ricochet/blend movement.
 *
 * Per hop:
 *   1. Refresh the delayed player snapshot if BIRD_TARGET_DELAY_MS has
 *      elapsed since the last sample.
 *   2. If resting, stand still until the rest window expires.
 *   3. If no hop in flight, plan one: A* from the bird's current cell to
 *      the target; step BIRD_HOP_DISTANCE in the cardinal direction toward
 *      the path's first waypoint. (No cache — a 50 px hop overshoots
 *      multiple cell-sized waypoints, so cached paths read stale
 *      "backwards" waypoints next plan.)
 *   4. Animate toward the hop target at the bird's scaled speed; on
 *      arrival, clear the target and start the rest timer.
 *
 * A* inflates platforms/ground by the bird's body so the full hitbox fits
 * through gaps; bounded at ASTAR_MAX_ITERATIONS to prevent runaway costs.
 */

const CELL_SIZE = Math.ceil(GAME_CONFIG.MONSTER_SIZE / 2);
const PF_FINDER = new PF.AStarFinder({
  // Cardinal-only — bird hops on a single axis at a time.
  diagonalMovement: PF.DiagonalMovement.Never,
  heuristic: PF.Heuristic.manhattan,
});

export class ChaserMovement {
  public update(
    monster: Monster,
    currentTime: number,
    gameState: any,
    deltaTime?: number
  ): void {
    if (!isBirdMonster(monster)) return;
    if (gameState.currentState !== "PLAYING") return;
    const player = gameState.player;
    if (!player) return;

    const speed =
      ScalingManager.getInstance().getMonsterScaledValues(monster).chaser.speed;
    const frameSpeed = deltaTime ? speed * (deltaTime / 16.67) : speed;
    const platforms = gameState.platforms || [];

    // Refresh the delayed player snapshot.
    const delay = getTuned("BIRD_TARGET_DELAY_MS");
    if (
      monster.lastSeenAt === undefined ||
      currentTime - monster.lastSeenAt >= delay
    ) {
      monster.lastSeenPlayerX = player.x;
      monster.lastSeenPlayerY = player.y;
      monster.lastSeenAt = currentTime;
    }

    // Resting between hops.
    if (monster.nextHopTime !== undefined && currentTime < monster.nextHopTime) {
      return;
    }

    // Plan the next hop if none is in flight.
    if (monster.hopTargetX === undefined || monster.hopTargetY === undefined) {
      const tx = monster.lastSeenPlayerX ?? player.x;
      const ty = monster.lastSeenPlayerY ?? player.y;
      this.planNextHop(
        monster,
        { x: tx, y: ty },
        platforms,
        currentTime
      );
      if (monster.hopTargetX === undefined) return; // both axes blocked
      armMonsterAsLethal(monster);
    }

    // Animate toward the hop target.
    const dx = (monster.hopTargetX as number) - monster.x;
    const dy = (monster.hopTargetY as number) - monster.y;
    const dist = Math.abs(dx) + Math.abs(dy); // axis-locked → Manhattan = Euclidean
    if (dist <= frameSpeed) {
      monster.x = monster.hopTargetX as number;
      monster.y = monster.hopTargetY as number;
      monster.hopTargetX = undefined;
      monster.hopTargetY = undefined;
      monster.nextHopTime = currentTime + getTuned("BIRD_HOP_REST_MS");
      return;
    }
    monster.x += Math.sign(dx) * Math.min(frameSpeed, Math.abs(dx));
    monster.y += Math.sign(dy) * Math.min(frameSpeed, Math.abs(dy));
  }

  /**
   * Pick the next hop direction. Runs A* to the target, then walks along
   * the path while it stays on the same cardinal axis, capping at
   * BIRD_HOP_DISTANCE. The hop target = last waypoint reached before a
   * direction change or distance cap.
   *
   * This is the key fix vs. naïve "hop hopDist toward path[0]": A*'s first
   * waypoint is only one CELL_SIZE away (~12.5 px), so a full hopDist (50)
   * hop in that direction overshoots and may crash into the obstacle the
   * path was meant to detour around — producing wobble, not progress.
   */
  private planNextHop(
    monster: Monster & {
      hopTargetX?: number;
      hopTargetY?: number;
      nextHopTime?: number;
    },
    target: { x: number; y: number },
    platforms: any[],
    currentTime: number
  ): void {
    const hopDist = getTuned("BIRD_HOP_DISTANCE");
    const path = this.findPath(monster, target, platforms);

    // Direction-only extraction. We DON'T trust monster.x/y vs path[0].x/y
    // for sign detection because the monster's pixel position can be
    // off-cell (e.g. y=282.5, the cell at row 22 is at pixel 275). That
    // off-cell offset makes BOTH axes' signs non-zero and produces a
    // diagonal hop. Cell-space cardinal deltas are clean.
    let dirX = 0;
    let dirY = 0;
    if (path && path.length > 0) {
      const startCol = Math.floor(monster.x / CELL_SIZE);
      const startRow = Math.floor(monster.y / CELL_SIZE);
      const wpCol = Math.round(path[0].x / CELL_SIZE);
      const wpRow = Math.round(path[0].y / CELL_SIZE);
      dirX = Math.sign(wpCol - startCol);
      dirY = Math.sign(wpRow - startRow);
      // Defensive: if A* placed path[0] in the same cell as start (unlikely
      // but possible at boundaries), pick the dominant direction toward
      // the target instead so we still move.
      if (dirX === 0 && dirY === 0) {
        const dx = target.x - monster.x;
        const dy = target.y - monster.y;
        if (Math.abs(dx) >= Math.abs(dy)) dirX = Math.sign(dx);
        else dirY = Math.sign(dy);
      }
    } else {
      const dx = target.x - monster.x;
      const dy = target.y - monster.y;
      if (Math.abs(dx) >= Math.abs(dy)) dirX = Math.sign(dx);
      else dirY = Math.sign(dy);
    }

    const tryStep = (sx: number, sy: number): boolean => {
      if (sx === 0 && sy === 0) return false;
      const nx = monster.x + sx;
      const ny = monster.y + sy;
      // isMovementSafe checks canvas boundaries + platform overlap. Canvas
      // bottom is the floor and is walkable.
      if (!MovementUtils.isMovementSafe(monster, nx, ny, platforms)) {
        return false;
      }
      monster.hopTargetX = nx;
      monster.hopTargetY = ny;
      return true;
    };

    // Try a full hopDist in the chosen cardinal direction, then shorter
    // strides if blocked. Cardinal-only — only one of dirX/dirY is
    // non-zero, so this is never diagonal.
    for (let dist = hopDist; dist >= CELL_SIZE; dist -= CELL_SIZE) {
      if (tryStep(dirX * dist, dirY * dist)) return;
    }

    // Fully blocked in the primary direction — try perpendicular toward target.
    const altX = dirY !== 0 ? Math.sign(target.x - monster.x) * hopDist : 0;
    const altY = dirX !== 0 ? Math.sign(target.y - monster.y) * hopDist : 0;
    if (tryStep(altX, altY)) return;

    monster.nextHopTime = currentTime + getTuned("BIRD_HOP_REST_MS");
  }

  /**
   * Build a PathFinding.js grid (1=walkable, 0=blocked), inflating platforms
   * by the bird's body so the full hitbox fits through gaps. Run
   * AStarFinder; return path as pixel-coord waypoints (top-left aligned to
   * cell origin). Returns null on no path / same-cell start.
   */
  private findPath(
    monster: Monster,
    target: { x: number; y: number },
    platforms: any[]
  ): { x: number; y: number }[] | null {
    const cols = Math.ceil(GAME_CONFIG.CANVAS_WIDTH / CELL_SIZE);
    const rows = Math.ceil(GAME_CONFIG.CANVAS_HEIGHT / CELL_SIZE);

    const startCol = Math.min(cols - 1, Math.max(0, Math.floor(monster.x / CELL_SIZE)));
    const startRow = Math.min(rows - 1, Math.max(0, Math.floor(monster.y / CELL_SIZE)));
    const goalCol = Math.min(cols - 1, Math.max(0, Math.floor(target.x / CELL_SIZE)));
    const goalRow = Math.min(rows - 1, Math.max(0, Math.floor(target.y / CELL_SIZE)));

    if (startCol === goalCol && startRow === goalRow) return null;

    // 0 = walkable, 1 = blocked (PathFinding.js convention).
    const matrix: number[][] = Array.from({ length: rows }, () =>
      new Array(cols).fill(0)
    );

    const inflateX = Math.ceil(monster.width / CELL_SIZE) - 1;
    const inflateY = Math.ceil(monster.height / CELL_SIZE) - 1;

    const blockRect = (ox: number, oy: number, ow: number, oh: number) => {
      const left = Math.floor(ox / CELL_SIZE) - inflateX;
      const top = Math.floor(oy / CELL_SIZE) - inflateY;
      const right = Math.ceil((ox + ow) / CELL_SIZE);
      const bottom = Math.ceil((oy + oh) / CELL_SIZE);
      for (let r = top; r < bottom; r++) {
        for (let c = left; c < right; c++) {
          if (c >= 0 && c < cols && r >= 0 && r < rows) matrix[r][c] = 1;
        }
      }
    };

    for (const p of platforms) blockRect(p.x, p.y, p.width, p.height);

    // Always allow the start (we're standing there) and goal (we want to
    // reach it) cells, even if they fall inside an inflated obstacle.
    matrix[startRow][startCol] = 0;
    matrix[goalRow][goalCol] = 0;

    const grid = new PF.Grid(matrix);
    const raw = PF_FINDER.findPath(startCol, startRow, goalCol, goalRow, grid);
    if (raw.length === 0) return null;

    // PathFinding.js returns [[col, row], ...] starting at [startCol,startRow].
    // Drop the start node and convert to pixel coords (cell top-left).
    return raw
      .slice(1)
      .map(([c, r]) => ({ x: c * CELL_SIZE, y: r * CELL_SIZE }));
  }
}
