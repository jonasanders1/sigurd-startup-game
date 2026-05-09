import { Monster } from "../types/interfaces";
import { GAME_CONFIG, COLORS } from "../types/constants";
import { PLAYFIELD_BOTTOM } from "../config/floor";
import { MonsterType } from "../types/enums";
import { getDefaultBounds } from "../config/monsterBounds";
import {
  cornerToWispSpawnPosition,
  type SpawnCorner,
} from "../lib/wispSpawn";

/**
 * Monster Factory - Centralized monster creation functions
 * All monster creation logic is contained here for better organization
 */

// Get the appropriate color for a monster type
const getMonsterColor = (type: MonsterType): string => {
  switch (type) {
    case MonsterType.BUREAUCRAT:
      return COLORS.MONSTER_TYPES.BUREAUCRAT;
    case MonsterType.WISP:
      return COLORS.MONSTER_TYPES.WISP;
    case MonsterType.TAXGHOST:
      return COLORS.MONSTER_TYPES.TAXGHOST;
    case MonsterType.FOUNDER:
      return COLORS.MONSTER_TYPES.FOUNDER;
    case MonsterType.CONSULTANT:
      return COLORS.MONSTER_TYPES.CONSULTANT;
    case MonsterType.ROBOT:
      return COLORS.MONSTER_TYPES.ROBOT;
    default:
      return COLORS.MONSTER;
  }
};

// Base monster properties that all monsters share. Default bounds come from
// each monster's entity file (src/entities/*.ts) via getDefaultBounds.
const createBaseMonster = (
  x: number,
  y: number,
  type: MonsterType,
  speed: number = 1,
  spawnDelay: number = 0
): Partial<Monster> => {
  const defaultHitbox = getDefaultBounds(type);
  return {
    x,
    y,
    width: defaultHitbox.width,
    height: defaultHitbox.height,
    color: getMonsterColor(type),
    type,
    speed,
    direction: 1,
    isActive: true,
    spawnDelay,
    // BJ §5.4 spawn-invuln baseline. ScalingManager.recordSpawn overwrites
    // individualSpawnTime when the monster actually enters the playfield
    // (after spawnDelay), so the 500ms safe window starts at the right moment.
    spawnTime: Date.now(),
    // Event-based spawn invuln (game-specs §5.4): newly spawned enemy isn't
    // lethal until its movement class flips this on its first AI decision.
    // The 500ms timer in `isCollisionLethal` acts as a safety net so a
    // monster that never moves can't stay invuln forever.
    isLethal: false,
  };
};

/**
 * Creates a horizontal patrol monster that moves back and forth on a platform
 * @param platformX - X position of the platform
 * @param platformY - Y position of the platform  
 * @param platformWidth - Width of the platform
 * @param spawnSide - Which side of the platform to spawn on ("left" or "right")
 * @param walkLengths - Number of walks before falling (legacy parameter, kept for compatibility)
 * @param speed - Movement speed
 * @param direction - Initial direction (optional, auto-determined by spawn side)
 * @param spawnDelay - When this monster should spawn (in milliseconds, optional)
 */
export const createBureaucratMonster = (
  platformX: number,
  platformY: number,
  platformWidth: number,
  spawnSide: "left" | "right" = "left",
  walkLengths: number = 1,
  speed: number = 1,
  direction?: number,
  spawnDelay: number = 0,
  transformTarget: "CONSULTANT" | "ROBOT" | "NONE" = "CONSULTANT"
): Monster => {
  // Read dims from the BUREAUCRAT hitbox so entity-file edits propagate here
  // automatically (see src/entities/Bureaucrat.ts).
  const hitbox = getDefaultBounds(MonsterType.BUREAUCRAT);
  const x =
    spawnSide === "left"
      ? platformX
      : platformX + platformWidth - hitbox.width;
  // Spawn with feet on platformY: createBaseMonster initializes width/height
  // from the same hitbox, so y must subtract hitbox.height to keep the
  // bottom edge flush with platformY.
  const y = platformY - hitbox.height;
  const initialDirection = direction || (spawnSide === "left" ? 1 : -1);

  return {
    ...createBaseMonster(x, y, MonsterType.BUREAUCRAT, speed, spawnDelay),
    patrolStartX: platformX,
    patrolEndX: platformX + platformWidth,
    originalPatrolStartX: platformX,
    originalPatrolEndX: platformX + platformWidth,
    direction: initialDirection,
    walkLengths,
    transformTarget,
  } as Monster;
};

/**
 * Creates a floater monster that moves in straight lines and bounces off walls/platforms
 * @param startX - Starting X position
 * @param startY - Starting Y position
 * @param startAngle - Starting angle in degrees (0-360)
 * @param speed - Movement speed
 * @param spawnDelay - When this monster should spawn (in milliseconds, optional)
 */
export const createFounderMonster = (
  startX: number,
  startY: number,
  startAngle: number = 45,
  speed: number = 1,
  spawnDelay: number = 0
): Monster => {
  return {
    ...createBaseMonster(startX, startY, MonsterType.FOUNDER, speed, spawnDelay),
    startAngle,
    spawnTime: Date.now(),
  } as Monster;
};

/**
 * Creates a chaser monster that follows the player
 * @param startX - Starting X position
 * @param startY - Starting Y position
 * @param speed - Movement speed
 * @param directness - How directly it follows the player (0.0-1.0)
 * @param updateInterval - How often to update the chase target (ms)
 * @param spawnDelay - When this monster should spawn (in milliseconds, optional)
 */
export const createWispMonster = (
  startX: number,
  startY: number,
  speed: number = 0.8, // Reduced from 1
  directness: number = 0.2, // Reduced from 1
  updateInterval: number = 500,
  spawnDelay: number = 0
): Monster => {
  // Spec §5.1.1: wisps always spawn in one of the four corners. Snap the
  // requested (x, y) to the closest corner via quadrant test — fixes
  // map authors that pass arbitrary coords (e.g. tutorial killMap), and
  // is idempotent for callers that already pre-resolved corner coords
  // (createLevelWisp, LevelManager).
  const isLeft = startX < GAME_CONFIG.CANVAS_WIDTH / 2;
  const isTop = startY < PLAYFIELD_BOTTOM / 2;
  const corner: SpawnCorner = isTop
    ? isLeft
      ? "top-left"
      : "top-right"
    : isLeft
      ? "bottom-left"
      : "bottom-right";
  const pos = cornerToWispSpawnPosition(corner, {
    width: GAME_CONFIG.CANVAS_WIDTH,
    height: PLAYFIELD_BOTTOM,
    monsterSize: getDefaultBounds(MonsterType.WISP).width,
  });
  return {
    ...createBaseMonster(pos.x, pos.y, MonsterType.WISP, speed, spawnDelay),
    direction: 0, // Wisp doesn't use direction property
    directness,
    chaseUpdateInterval: updateInterval,
  } as Monster;
};

/**
 * Spec §5.1.1: every level has exactly one mechanical wisp, persistent
 * through the level. Picks a random corner at spawn (LevelManager will
 * reposition based on player input via applyWispCornerSpawn) and scales
 * speed linearly with level number. Use this from LevelManager — wisps
 * should NOT be authored per-level in mapDefinitions.ts.
 */
const ALL_CORNERS: SpawnCorner[] = [
  "top-left",
  "top-right",
  "bottom-left",
  "bottom-right",
];
export const createLevelWisp = (level: number): Monster => {
  const corner = ALL_CORNERS[Math.floor(Math.random() * ALL_CORNERS.length)];
  const pos = cornerToWispSpawnPosition(corner, {
    width: GAME_CONFIG.CANVAS_WIDTH,
    // Use playfield bottom (top of the floor strip) so bottom corners
    // spawn above the restricted ground, not inside it.
    height: PLAYFIELD_BOTTOM,
    monsterSize: getDefaultBounds(MonsterType.WISP).width,
  });
  // 0.7 at L1 → 1.1 at L9 (linear). Clamps gracefully past L9 if maps grow.
  const speed = 0.7 + Math.min(level - 1, 8) * 0.05;
  return createWispMonster(pos.x, pos.y, speed, 0.2, 500, 2500);
};

/**
 * Creates an ambusher monster that wanders freely and periodically ambushes
 * @param startX - Starting X position
 * @param startY - Starting Y position
 * @param speed - Movement speed
 * @param ambushInterval - Time between ambushes (ms)
 * @param spawnDelay - When this monster should spawn (in milliseconds, optional)
 */
export const createTaxGhostMonster = (
  startX: number,
  startY: number,
  speed: number = 0.8, // Reduced from 1
  ambushInterval: number = 8000, // Increased from 5000
  spawnDelay: number = 0
): Monster => {
  return {
    ...createBaseMonster(startX, startY, MonsterType.TAXGHOST, speed, spawnDelay),
    ambushCooldown: 0, // Initialize ambush cooldown
  } as Monster;
};

// ─── BJ airborne forms (game-specs §5.1.3 / Monster-Movments.md) ────────────

/**
 * CONSULTANT — vertical-column chase. Tracks Jack's X (homing), bobs Y edge to
 * edge bouncing off top/bottom boundaries. Bureaucrat's transform target.
 * `speed` drives both the bounce velocity and the homing rate.
 */
export const createConsultantMonster = (
  startX: number,
  startY: number,
  speed: number = 1.2,
  spawnDelay: number = 0
): Monster => ({
  ...createBaseMonster(startX, startY, MonsterType.CONSULTANT, speed, spawnDelay),
  direction: 1,
} as Monster);

/**
 * ROBOT — horizontal-row chase. Tracks Jack's Y (homing), bobs X edge to edge
 * bouncing off left/right boundaries.
 */
export const createRobotMonster = (
  startX: number,
  startY: number,
  speed: number = 1.4,
  spawnDelay: number = 0
): Monster => ({
  ...createBaseMonster(startX, startY, MonsterType.ROBOT, speed, spawnDelay),
  direction: 1,
} as Monster);

/**
 * Utility function to create a monster from a spawn point configuration
 * This is useful for dynamic monster spawning during gameplay
 */
export const createMonsterFromSpawnPoint = (spawnPoint: any): Monster => {
  const { x, y, type, speed = 1, ...config } = spawnPoint;

  switch (type) {
    case MonsterType.BUREAUCRAT:
      return createBureaucratMonster(
        config.patrolStartX || x,
        y + getDefaultBounds(MonsterType.BUREAUCRAT).height,
        (config.patrolEndX || x + 200) - (config.patrolStartX || x),
        config.spawnSide || "left",
        config.walkLengths || 1,
        speed
      );

    case MonsterType.FOUNDER:
      return createFounderMonster(
        x,
        y,
        config.startAngle || 45,
        speed
      );

    case MonsterType.WISP:
      return createWispMonster(
        x,
        y,
        speed,
        config.directness || 0.3,
        config.updateInterval || 200
      );

    case MonsterType.TAXGHOST:
      return createTaxGhostMonster(
        x,
        y,
        speed,
        config.ambushInterval || 8000
      );

    default:
      throw new Error(`Unknown monster type: ${type}`);
  }
}; 