import { Monster, isChaserMonster } from "../../types/interfaces";
import { logger } from "../../lib/logger";
import { MovementUtils } from "./MovementUtils";
import { ScalingManager } from "../ScalingManager";
import { GAME_CONFIG } from "../../types/constants";

// Cardinal directions only (N, S, E, W)
const CARDINAL_DIRS = [
  { x: 1, y: 0 },  // East
  { x: -1, y: 0 }, // West
  { x: 0, y: 1 },  // South
  { x: 0, y: -1 }, // North
];

// A* grid cell size — half the monster size for smoother navigation
const CELL_SIZE = Math.ceil(GAME_CONFIG.MONSTER_SIZE / 2);

interface GridNode {
  x: number;
  y: number;
  g: number;
  h: number;
  f: number;
  parent: GridNode | null;
}

// Unique ID counter for chasers (stable across frames)
let nextChaserId = 0;

export class ChaserMovement {
  private pathCache: Map<number, { path: { x: number; y: number }[]; targetX: number; targetY: number; timestamp: number }> = new Map();
  private static PATH_RECALC_INTERVAL = 400;
  private static PATH_TARGET_DRIFT = 40; // Recalc if target moved more than this

  public update(monster: Monster, currentTime: number, gameState: any, deltaTime?: number): void {
    if (!isChaserMonster(monster)) return;
    if (gameState.currentState !== "PLAYING") return;

    const player = gameState.player;
    if (!player) return;

    const scalingManager = ScalingManager.getInstance();
    const valuesToUse = scalingManager.getMonsterScaledValues(monster);
    const monsterAge = scalingManager.getMonsterAge(monster);

    if (monsterAge < 2) {
      logger.debug(
        `Chaser scaling - Age: ${monsterAge.toFixed(1)}s, Speed: ${valuesToUse.chaser.speed.toFixed(2)}`
      );
    }

    // Initialize chaser state if not set
    if (!monster.behaviorState) {
      monster.behaviorState = "chasing";
      monster.lastDirectionChange = currentTime;
      monster.chaseTargetX = player.x;
      monster.chaseTargetY = player.y;

      (monster as any).updateIntervalMultiplier = 0.8 + Math.random() * 0.4;
      (monster as any).directnessMultiplier = 0.85 + Math.random() * 0.3;
      (monster as any).speedMultiplier = 0.9 + Math.random() * 0.2;
      // Assign a stable ID for path caching
      (monster as any)._chaserId = nextChaserId++;

      const targetOffsetX = (Math.random() - 0.5) * 50;
      const targetOffsetY = (Math.random() - 0.5) * 50;
      monster.chaseTargetX = player.x + targetOffsetX;
      monster.chaseTargetY = player.y + targetOffsetY;

      monster.lastDirectionChange =
        currentTime + Math.random() * valuesToUse.chaser.updateInterval;
    }

    const platforms = gameState.platforms || [];
    const ground = gameState.ground;
    const directness =
      valuesToUse.chaser.directness *
      ((monster as any).directnessMultiplier || 1);
    const updateInterval =
      valuesToUse.chaser.updateInterval *
      ((monster as any).updateIntervalMultiplier || 1);

    // Update chase target periodically
    const timeSinceLastUpdate =
      currentTime - (monster.lastDirectionChange || currentTime);
    if (timeSinceLastUpdate > updateInterval) {
      const currentTargetX = monster.chaseTargetX || monster.x;
      const currentTargetY = monster.chaseTargetY || monster.y;

      const shouldAddOffset = Math.random() < 0.3;
      const randomOffsetX = shouldAddOffset ? (Math.random() - 0.5) * 15 : 0;
      const randomOffsetY = shouldAddOffset ? (Math.random() - 0.5) * 15 : 0;

      monster.chaseTargetX =
        currentTargetX +
        (player.x + randomOffsetX - currentTargetX) * directness;
      monster.chaseTargetY =
        currentTargetY +
        (player.y + randomOffsetY - currentTargetY) * directness;

      monster.lastDirectionChange = currentTime;
    }

    const targetX = monster.chaseTargetX || monster.x;
    const targetY = monster.chaseTargetY || monster.y;
    const dx = targetX - monster.x;
    const dy = targetY - monster.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance <= 5) return;

    const individualSpeed =
      valuesToUse.chaser.speed * ((monster as any).speedMultiplier || 1);
    const speedScale = distance > 20 ? 1 : 0.5;
    const frameSpeed = deltaTime
      ? individualSpeed * speedScale * (deltaTime / 16.67)
      : individualSpeed * speedScale;

    // Try direct cardinal movement first (fast path)
    const moved = this.tryCardinalMove(monster, dx, dy, frameSpeed, platforms, ground);

    if (!moved) {
      // Blocked — use A* pathfinding to navigate around the obstacle
      this.followPath(monster, targetX, targetY, frameSpeed, platforms, ground, currentTime);
    }
  }

  /**
   * Try primary then secondary cardinal direction.
   */
  private tryCardinalMove(
    monster: Monster,
    dx: number,
    dy: number,
    speed: number,
    platforms: any[],
    ground: any
  ): boolean {
    const primary =
      Math.abs(dx) >= Math.abs(dy)
        ? { x: Math.sign(dx) * speed, y: 0 }
        : { x: 0, y: Math.sign(dy) * speed };

    const secondary =
      Math.abs(dx) >= Math.abs(dy)
        ? { x: 0, y: Math.sign(dy) * speed }
        : { x: Math.sign(dx) * speed, y: 0 };

    if (this.applyCardinalMove(monster, primary.x, primary.y, platforms, ground)) {
      return true;
    }

    if (
      (secondary.x !== 0 || secondary.y !== 0) &&
      this.applyCardinalMove(monster, secondary.x, secondary.y, platforms, ground)
    ) {
      return true;
    }

    return false;
  }

  /**
   * Apply a single cardinal move. Returns true if the move succeeded.
   */
  private applyCardinalMove(
    monster: Monster,
    moveX: number,
    moveY: number,
    platforms: any[],
    ground: any
  ): boolean {
    const newX = monster.x + moveX;
    const newY = monster.y + moveY;

    if (MovementUtils.isMovementSafe(monster, newX, newY, platforms)) {
      monster.x = newX;
      monster.y = newY;
      this.handleGroundCollision(monster, ground);
      return true;
    }
    return false;
  }

  /**
   * Use A* pathfinding to navigate around obstacles.
   */
  private followPath(
    monster: Monster,
    targetX: number,
    targetY: number,
    speed: number,
    platforms: any[],
    ground: any,
    currentTime: number
  ): void {
    const monsterId: number = (monster as any)._chaserId ?? 0;

    const cached = this.pathCache.get(monsterId);
    let path: { x: number; y: number }[] | null = null;

    // Reuse cached path if recent and target hasn't drifted too far
    const cacheValid =
      cached &&
      cached.path.length > 0 &&
      currentTime - cached.timestamp < ChaserMovement.PATH_RECALC_INTERVAL &&
      Math.abs(cached.targetX - targetX) < ChaserMovement.PATH_TARGET_DRIFT &&
      Math.abs(cached.targetY - targetY) < ChaserMovement.PATH_TARGET_DRIFT;

    if (cacheValid) {
      path = cached!.path;
    } else {
      path = this.findPath(monster, targetX, targetY, platforms, ground);
      this.pathCache.set(monsterId, {
        path: path || [],
        targetX,
        targetY,
        timestamp: currentTime,
      });
    }

    if (!path || path.length === 0) return;

    // Follow the first waypoint
    const wp = path[0];
    const wpDx = wp.x - monster.x;
    const wpDy = wp.y - monster.y;
    const wpDist = Math.abs(wpDx) + Math.abs(wpDy);

    if (wpDist < CELL_SIZE) {
      path.shift();
      if (path.length === 0) return;
      const next = path[0];
      this.moveToward(monster, next.x - monster.x, next.y - monster.y, speed, platforms, ground);
    } else {
      this.moveToward(monster, wpDx, wpDy, speed, platforms, ground);
    }
  }

  /**
   * Move toward a direction using strict cardinal movement.
   */
  private moveToward(
    monster: Monster,
    dx: number,
    dy: number,
    speed: number,
    platforms: any[],
    ground: any
  ): void {
    let moveX = 0;
    let moveY = 0;

    if (Math.abs(dx) >= Math.abs(dy)) {
      moveX = Math.sign(dx) * speed;
    } else {
      moveY = Math.sign(dy) * speed;
    }

    if (!this.applyCardinalMove(monster, moveX, moveY, platforms, ground)) {
      if (moveX !== 0 && dy !== 0) {
        this.applyCardinalMove(monster, 0, Math.sign(dy) * speed, platforms, ground);
      } else if (moveY !== 0 && dx !== 0) {
        this.applyCardinalMove(monster, Math.sign(dx) * speed, 0, platforms, ground);
      }
    }
  }

  /**
   * A* pathfinding on a grid with cardinal-only neighbors.
   * Inflates obstacles by the monster's size so the full body fits through gaps.
   * Includes ground as an obstacle.
   */
  private findPath(
    monster: Monster,
    targetX: number,
    targetY: number,
    platforms: any[],
    ground: any
  ): { x: number; y: number }[] | null {
    const cols = Math.ceil(GAME_CONFIG.CANVAS_WIDTH / CELL_SIZE);
    const rows = Math.ceil(GAME_CONFIG.CANVAS_HEIGHT / CELL_SIZE);

    const startCol = Math.floor(monster.x / CELL_SIZE);
    const startRow = Math.floor(monster.y / CELL_SIZE);
    const goalCol = Math.min(cols - 1, Math.max(0, Math.floor(targetX / CELL_SIZE)));
    const goalRow = Math.min(rows - 1, Math.max(0, Math.floor(targetY / CELL_SIZE)));

    if (startCol === goalCol && startRow === goalRow) return null;

    // How many extra cells the monster body extends beyond a single cell
    const inflateX = Math.ceil(monster.width / CELL_SIZE) - 1;
    const inflateY = Math.ceil(monster.height / CELL_SIZE) - 1;

    // Build blocked set — inflate each obstacle by the monster's body size
    const blocked = new Set<string>();

    const blockRect = (ox: number, oy: number, ow: number, oh: number) => {
      const left = Math.floor(ox / CELL_SIZE) - inflateX;
      const top = Math.floor(oy / CELL_SIZE) - inflateY;
      const right = Math.ceil((ox + ow) / CELL_SIZE);
      const bottom = Math.ceil((oy + oh) / CELL_SIZE);

      for (let r = top; r < bottom; r++) {
        for (let c = left; c < right; c++) {
          if (c >= 0 && c < cols && r >= 0 && r < rows) {
            blocked.add(`${c},${r}`);
          }
        }
      }
    };

    for (const platform of platforms) {
      blockRect(platform.x, platform.y, platform.width, platform.height);
    }

    // Include ground as an obstacle
    if (ground) {
      blockRect(ground.x, ground.y, ground.width, ground.height);
    }

    // Ensure start and goal are never blocked (monster is already there / needs to reach there)
    const startKey = `${startCol},${startRow}`;
    const goalKey = `${goalCol},${goalRow}`;
    blocked.delete(startKey);
    blocked.delete(goalKey);

    const key = (c: number, r: number) => `${c},${r}`;
    const manhattan = (c: number, r: number) =>
      Math.abs(c - goalCol) + Math.abs(r - goalRow);

    const start: GridNode = {
      x: startCol,
      y: startRow,
      g: 0,
      h: manhattan(startCol, startRow),
      f: manhattan(startCol, startRow),
      parent: null,
    };

    const open: GridNode[] = [start];
    const closed = new Set<string>();

    const MAX_ITERATIONS = 300;
    let iterations = 0;

    while (open.length > 0 && iterations < MAX_ITERATIONS) {
      iterations++;

      // Find node with lowest f
      let bestIdx = 0;
      for (let i = 1; i < open.length; i++) {
        if (open[i].f < open[bestIdx].f) bestIdx = i;
      }
      const current = open[bestIdx];
      open.splice(bestIdx, 1);

      if (current.x === goalCol && current.y === goalRow) {
        // Reconstruct path as pixel coords (top-left aligned to match monster position)
        const path: { x: number; y: number }[] = [];
        let node: GridNode | null = current;
        while (node && node.parent) {
          path.unshift({
            x: node.x * CELL_SIZE,
            y: node.y * CELL_SIZE,
          });
          node = node.parent;
        }
        return path;
      }

      closed.add(key(current.x, current.y));

      for (const dir of CARDINAL_DIRS) {
        const nx = current.x + dir.x;
        const ny = current.y + dir.y;

        if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) continue;
        if (blocked.has(key(nx, ny))) continue;
        if (closed.has(key(nx, ny))) continue;

        const g = current.g + 1;
        const h = manhattan(nx, ny);

        const existing = open.find((n) => n.x === nx && n.y === ny);
        if (existing) {
          if (g < existing.g) {
            existing.g = g;
            existing.f = g + h;
            existing.parent = current;
          }
          continue;
        }

        open.push({ x: nx, y: ny, g, h, f: g + h, parent: current });
      }
    }

    return null;
  }

  private handleGroundCollision(monster: Monster, ground: any): void {
    if (!ground) return;

    const isColliding =
      monster.x < ground.x + ground.width &&
      monster.x + monster.width > ground.x &&
      monster.y < ground.y + ground.height &&
      monster.y + monster.height > ground.y;

    if (isColliding) {
      monster.y = ground.y - monster.height;
      monster.velocityY = 0;
      monster.isGrounded = true;
    }
  }
}
