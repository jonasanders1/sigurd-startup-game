import { Monster, Platform, isChaserMonster } from "../../types/interfaces";
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

// A* grid cell size — matches monster size for accurate collision mapping
const CELL_SIZE = GAME_CONFIG.MONSTER_SIZE;

interface GridNode {
  x: number;
  y: number;
  g: number; // Cost from start
  h: number; // Heuristic (Manhattan distance to goal)
  f: number; // g + h
  parent: GridNode | null;
}

export class ChaserMovement {
  // Cache the path so we don't re-run A* every frame
  private pathCache: Map<number, { path: { x: number; y: number }[]; timestamp: number }> = new Map();
  private static PATH_RECALC_INTERVAL = 500; // Recalculate path every 500ms

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

      // Store randomization multipliers to preserve difficulty scaling
      (monster as any).updateIntervalMultiplier = 0.8 + Math.random() * 0.4;
      (monster as any).directnessMultiplier = 0.85 + Math.random() * 0.3;
      (monster as any).speedMultiplier = 0.9 + Math.random() * 0.2;

      const targetOffsetX = (Math.random() - 0.5) * 50;
      const targetOffsetY = (Math.random() - 0.5) * 50;
      monster.chaseTargetX = player.x + targetOffsetX;
      monster.chaseTargetY = player.y + targetOffsetY;

      monster.lastDirectionChange =
        currentTime + Math.random() * valuesToUse.chaser.updateInterval;
    }

    const platforms = gameState.platforms || [];
    const directness =
      valuesToUse.chaser.directness *
      ((monster as any).directnessMultiplier || 1);
    const updateInterval =
      valuesToUse.chaser.updateInterval *
      ((monster as any).updateIntervalMultiplier || 1);

    // Update chase target periodically (creates "drifting" effect)
    const timeSinceLastUpdate =
      currentTime - (monster.lastDirectionChange || currentTime);
    if (timeSinceLastUpdate > updateInterval) {
      const currentTargetX = monster.chaseTargetX || monster.x;
      const currentTargetY = monster.chaseTargetY || monster.y;

      const shouldAddOffset = Math.random() < 0.3;
      const randomOffsetX = shouldAddOffset
        ? (Math.random() - 0.5) * 15
        : 0;
      const randomOffsetY = shouldAddOffset
        ? (Math.random() - 0.5) * 15
        : 0;

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

    if (distance <= 5) return; // Close enough, don't jitter

    const individualSpeed =
      valuesToUse.chaser.speed * ((monster as any).speedMultiplier || 1);
    const speedScale = distance > 20 ? 1 : 0.5;
    const frameSpeed = deltaTime
      ? individualSpeed * speedScale * (deltaTime / 16.67)
      : individualSpeed * speedScale;

    // Try direct cardinal movement first (fast path)
    const moved = this.tryCardinalMove(
      monster,
      dx,
      dy,
      frameSpeed,
      platforms,
      gameState.ground
    );

    if (!moved) {
      // Blocked — use A* pathfinding to navigate around the obstacle
      this.followPath(
        monster,
        targetX,
        targetY,
        frameSpeed,
        platforms,
        gameState.ground,
        currentTime
      );
    }
  }

  /**
   * Try to move in the best cardinal direction toward the target.
   * Returns true if the monster actually moved.
   */
  private tryCardinalMove(
    monster: Monster,
    dx: number,
    dy: number,
    speed: number,
    platforms: any[],
    ground: any
  ): boolean {
    // Primary axis: whichever gap is larger
    // Secondary axis: the other one (fallback if primary is blocked)
    const primary =
      Math.abs(dx) >= Math.abs(dy)
        ? { x: Math.sign(dx) * speed, y: 0 }
        : { x: 0, y: Math.sign(dy) * speed };

    const secondary =
      Math.abs(dx) >= Math.abs(dy)
        ? { x: 0, y: Math.sign(dy) * speed }
        : { x: Math.sign(dx) * speed, y: 0 };

    // Try primary direction
    if (this.applyCardinalMove(monster, primary.x, primary.y, platforms, ground)) {
      return true;
    }

    // Primary blocked — try secondary direction
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
   * Use A* pathfinding to navigate around obstacles, then follow the path with cardinal moves.
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
    // Use a unique ID per monster (or fallback to position hash)
    const monsterId = (monster as any).id ?? Math.round(monster.x * 1000 + monster.y);

    const cached = this.pathCache.get(monsterId);
    let path: { x: number; y: number }[] | null = null;

    if (cached && currentTime - cached.timestamp < ChaserMovement.PATH_RECALC_INTERVAL && cached.path.length > 0) {
      path = cached.path;
    } else {
      path = this.findPath(monster, targetX, targetY, platforms);
      this.pathCache.set(monsterId, { path: path || [], timestamp: currentTime });
    }

    if (!path || path.length === 0) return;

    // Find the next waypoint we haven't reached yet
    const nextWaypoint = path[0];
    const wpDx = nextWaypoint.x - monster.x;
    const wpDy = nextWaypoint.y - monster.y;
    const wpDist = Math.abs(wpDx) + Math.abs(wpDy);

    // If we've reached this waypoint, advance to the next
    if (wpDist < CELL_SIZE / 2) {
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
    // Pick dominant cardinal direction
    let moveX = 0;
    let moveY = 0;

    if (Math.abs(dx) >= Math.abs(dy)) {
      moveX = Math.sign(dx) * speed;
    } else {
      moveY = Math.sign(dy) * speed;
    }

    if (!this.applyCardinalMove(monster, moveX, moveY, platforms, ground)) {
      // If blocked, try the other axis
      if (moveX !== 0 && dy !== 0) {
        this.applyCardinalMove(monster, 0, Math.sign(dy) * speed, platforms, ground);
      } else if (moveY !== 0 && dx !== 0) {
        this.applyCardinalMove(monster, Math.sign(dx) * speed, 0, platforms, ground);
      }
    }
  }

  /**
   * A* pathfinding on a grid. Returns an array of waypoints (pixel coords) or null.
   * Uses Manhattan distance heuristic — only cardinal neighbors.
   */
  private findPath(
    monster: Monster,
    targetX: number,
    targetY: number,
    platforms: any[]
  ): { x: number; y: number }[] | null {
    const cols = Math.ceil(GAME_CONFIG.CANVAS_WIDTH / CELL_SIZE);
    const rows = Math.ceil(GAME_CONFIG.CANVAS_HEIGHT / CELL_SIZE);

    // Convert pixel coords to grid coords
    const startCol = Math.floor(monster.x / CELL_SIZE);
    const startRow = Math.floor(monster.y / CELL_SIZE);
    const goalCol = Math.min(cols - 1, Math.max(0, Math.floor(targetX / CELL_SIZE)));
    const goalRow = Math.min(rows - 1, Math.max(0, Math.floor(targetY / CELL_SIZE)));

    if (startCol === goalCol && startRow === goalRow) return null;

    // Build blocked set (cells that overlap platforms)
    const blocked = new Set<string>();
    for (const platform of platforms) {
      const pLeft = Math.floor(platform.x / CELL_SIZE);
      const pTop = Math.floor(platform.y / CELL_SIZE);
      const pRight = Math.ceil((platform.x + platform.width) / CELL_SIZE);
      const pBottom = Math.ceil((platform.y + platform.height) / CELL_SIZE);

      for (let r = pTop; r < pBottom; r++) {
        for (let c = pLeft; c < pRight; c++) {
          blocked.add(`${c},${r}`);
        }
      }
    }

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

    // Limit iterations to avoid frame drops
    const MAX_ITERATIONS = 200;
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
        // Reconstruct path as pixel coords (center of each cell)
        const path: { x: number; y: number }[] = [];
        let node: GridNode | null = current;
        while (node && node.parent) {
          path.unshift({
            x: node.x * CELL_SIZE + CELL_SIZE / 2 - monster.width / 2,
            y: node.y * CELL_SIZE + CELL_SIZE / 2 - monster.height / 2,
          });
          node = node.parent;
        }
        return path;
      }

      closed.add(key(current.x, current.y));

      // Expand cardinal neighbors
      for (const dir of CARDINAL_DIRS) {
        const nx = current.x + dir.x;
        const ny = current.y + dir.y;

        if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) continue;
        if (blocked.has(key(nx, ny))) continue;
        if (closed.has(key(nx, ny))) continue;

        const g = current.g + 1;
        const h = manhattan(nx, ny);

        // Check if already in open with a better cost
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

    // No path found (or too complex) — return null
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
