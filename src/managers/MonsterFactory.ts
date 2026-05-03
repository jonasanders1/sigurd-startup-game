import { Monster } from "../types/interfaces";
import { GAME_CONFIG, COLORS } from "../types/constants";
import { MonsterType } from "../types/enums";
import { getDefaultHitbox } from "../config/monsterHitboxes";

/**
 * Monster Factory - Centralized monster creation functions
 * All monster creation logic is contained here for better organization
 */

// Get the appropriate color for a monster type
const getMonsterColor = (type: MonsterType): string => {
  switch (type) {
    case MonsterType.MUMMY:
      return COLORS.MONSTER_TYPES.MUMMY;
    case MonsterType.VERTICAL_PATROL:
      return COLORS.MONSTER_TYPES.VERTICAL_PATROL;
    case MonsterType.BIRD:
      return COLORS.MONSTER_TYPES.BIRD;
    case MonsterType.UFO:
      return COLORS.MONSTER_TYPES.UFO;
    case MonsterType.HORN:
      return COLORS.MONSTER_TYPES.HORN;
    case MonsterType.SPHERE:
      return COLORS.MONSTER_TYPES.SPHERE;
    case MonsterType.ORB:
      return COLORS.MONSTER_TYPES.ORB;
    default:
      return COLORS.MONSTER;
  }
};

// Base monster properties that all monsters share. Default hitbox dims come
// from src/config/monsterHitboxes.ts so per-monster sizes (e.g. ambusher 1:2)
// stay configurable in one place.
const createBaseMonster = (
  x: number,
  y: number,
  type: MonsterType,
  speed: number = 1,
  spawnDelay: number = 0
): Partial<Monster> => {
  const defaultHitbox = getDefaultHitbox(type);
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
export const createMummyMonster = (
  platformX: number,
  platformY: number,
  platformWidth: number,
  spawnSide: "left" | "right" = "left",
  walkLengths: number = 1,
  speed: number = 1,
  direction?: number,
  spawnDelay: number = 0,
  variant: "green" | "black" = "green",
  transformTarget: "SPHERE" | "ORB" | "NONE" = "SPHERE"
): Monster => {
  const x =
    spawnSide === "left"
      ? platformX
      : platformX + platformWidth - GAME_CONFIG.MONSTER_SIZE;
  const y = platformY - GAME_CONFIG.MONSTER_SIZE;
  const initialDirection = direction || (spawnSide === "left" ? 1 : -1);

  return {
    ...createBaseMonster(x, y, MonsterType.MUMMY, speed, spawnDelay),
    patrolStartX: platformX,
    patrolEndX: platformX + platformWidth,
    direction: initialDirection,
    walkLengths,
    variant,
    transformTarget,
  } as Monster;
};

/**
 * Creates a vertical patrol monster that moves up and down along a vertical platform
 * @param platformX - X position of the vertical platform
 * @param startY - Starting Y position
 * @param patrolHeight - Height of the patrol area
 * @param side - Which side of the platform to patrol on ("left" or "right")
 * @param speed - Movement speed
 * @param direction - Initial direction (1 = down, -1 = up)
 * @param spawnDelay - When this monster should spawn (in milliseconds, optional)
 */
export const createVerticalPatrolMonster = (
  platformX: number,
  startY: number,
  patrolHeight: number,
  side: "left" | "right" = "left",
  speed: number = 1,
  direction: number = 1,
  spawnDelay: number = 0
): Monster => {
  // Calculate monster X position based on side
  const x = side === "left" 
    ? platformX - GAME_CONFIG.MONSTER_SIZE  // Left side of platform
    : platformX + 15; // Right side of platform (15 is the standard wall thickness)

  return {
    ...createBaseMonster(x, startY, MonsterType.VERTICAL_PATROL, speed, spawnDelay),
    patrolStartY: startY,
    patrolEndY: startY + patrolHeight,
    direction,
    patrolSide: side, // Store which side to patrol on
    targetPlatformX: platformX, // Store the target platform X position
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
export const createHornMonster = (
  startX: number,
  startY: number,
  startAngle: number = 45,
  speed: number = 1,
  spawnDelay: number = 0
): Monster => {
  return {
    ...createBaseMonster(startX, startY, MonsterType.HORN, speed, spawnDelay),
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
export const createBirdMonster = (
  startX: number,
  startY: number,
  speed: number = 0.8, // Reduced from 1
  directness: number = 0.2, // Reduced from 1
  updateInterval: number = 500,
  spawnDelay: number = 0
): Monster => {
  return {
    ...createBaseMonster(startX, startY, MonsterType.BIRD, speed, spawnDelay),
    direction: 0, // Bird doesn't use direction property
    directness,
    chaseUpdateInterval: updateInterval,
  } as Monster;
};

/**
 * Creates an ambusher monster that wanders freely and periodically ambushes
 * @param startX - Starting X position
 * @param startY - Starting Y position
 * @param speed - Movement speed
 * @param ambushInterval - Time between ambushes (ms)
 * @param spawnDelay - When this monster should spawn (in milliseconds, optional)
 */
export const createUfoMonster = (
  startX: number,
  startY: number,
  speed: number = 0.8, // Reduced from 1
  ambushInterval: number = 8000, // Increased from 5000
  spawnDelay: number = 0
): Monster => {
  return {
    ...createBaseMonster(startX, startY, MonsterType.UFO, speed, spawnDelay),
    ambushCooldown: 0, // Initialize ambush cooldown
  } as Monster;
};

// ─── BJ airborne forms (game-specs §5.1.3 / Monster-Movments.md) ────────────

/**
 * SPHERE — vertical-column chase. Tracks Jack's X (homing), bobs Y edge to
 * edge bouncing off top/bottom boundaries. Mummy's transform target.
 * `speed` drives both the bounce velocity and the homing rate.
 */
export const createSphereMonster = (
  startX: number,
  startY: number,
  speed: number = 1.2,
  spawnDelay: number = 0
): Monster => ({
  ...createBaseMonster(startX, startY, MonsterType.SPHERE, speed, spawnDelay),
  direction: 1,
} as Monster);

/**
 * ORB — horizontal-row chase. Tracks Jack's Y (homing), bobs X edge to edge
 * bouncing off left/right boundaries.
 */
export const createOrbMonster = (
  startX: number,
  startY: number,
  speed: number = 1.4,
  spawnDelay: number = 0
): Monster => ({
  ...createBaseMonster(startX, startY, MonsterType.ORB, speed, spawnDelay),
  direction: 1,
} as Monster);

/**
 * Utility function to create a monster from a spawn point configuration
 * This is useful for dynamic monster spawning during gameplay
 */
export const createMonsterFromSpawnPoint = (spawnPoint: any): Monster => {
  const { x, y, type, speed = 1, ...config } = spawnPoint;

  switch (type) {
    case MonsterType.MUMMY:
      return createMummyMonster(
        config.patrolStartX || x,
        y + GAME_CONFIG.MONSTER_SIZE,
        (config.patrolEndX || x + 200) - (config.patrolStartX || x),
        config.spawnSide || "left",
        config.walkLengths || 1,
        speed
      );

    case MonsterType.VERTICAL_PATROL:
      return createVerticalPatrolMonster(
        x,
        config.patrolStartY || y,
        config.patrolHeight || 200,
        speed,
        config.direction || 1
      );

    case MonsterType.HORN:
      return createHornMonster(
        x,
        y,
        config.startAngle || 45,
        speed
      );

    case MonsterType.BIRD:
      return createBirdMonster(
        x,
        y,
        speed,
        config.directness || 0.3,
        config.updateInterval || 200
      );

    case MonsterType.UFO:
      return createUfoMonster(
        x,
        y,
        speed,
        config.ambushInterval || 8000
      );

    default:
      throw new Error(`Unknown monster type: ${type}`);
  }
}; 