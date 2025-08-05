import { Monster } from "../types/interfaces";
import { GAME_CONFIG, COLORS } from "../types/constants";
import { MonsterType } from "../types/enums";

/**
 * Monster Factory - Centralized monster creation functions
 * All monster creation logic is contained here for better organization
 */

// Get the appropriate color for a monster type
const getMonsterColor = (type: MonsterType): string => {
  switch (type) {
    case MonsterType.HORIZONTAL_PATROL:
      return COLORS.MONSTER_HORIZONTAL_PATROL;
    case MonsterType.VERTICAL_PATROL:
      return COLORS.MONSTER_VERTICAL_PATROL;
    case MonsterType.CHASER:
      return COLORS.MONSTER_CHASER;
    case MonsterType.AMBUSHER:
      return COLORS.MONSTER_AMBUSHER;
    case MonsterType.FLOATER:
      return COLORS.MONSTER_FLOATER;
    default:
      return COLORS.MONSTER;
  }
};

// Base monster properties that all monsters share
const createBaseMonster = (
  x: number,
  y: number,
  type: MonsterType,
  speed: number = 1
): Partial<Monster> => ({
  x,
  y,
  width: GAME_CONFIG.MONSTER_SIZE,
  height: GAME_CONFIG.MONSTER_SIZE,
  color: getMonsterColor(type),
  type,
  speed,
  direction: 1,
  isActive: true,
});

/**
 * Creates a horizontal patrol monster that moves back and forth on a platform
 * @param platformX - X position of the platform
 * @param platformY - Y position of the platform  
 * @param platformWidth - Width of the platform
 * @param spawnSide - Which side of the platform to spawn on ("left" or "right")
 * @param walkLengths - Number of walks before falling (legacy parameter, kept for compatibility)
 * @param speed - Movement speed
 * @param direction - Initial direction (optional, auto-determined by spawn side)
 */
export const createHorizontalPatrolMonster = (
  platformX: number,
  platformY: number,
  platformWidth: number,
  spawnSide: "left" | "right" = "left",
  walkLengths: number = 1,
  speed: number = 1,
  direction?: number
): Monster => {
  const x =
    spawnSide === "left"
      ? platformX
      : platformX + platformWidth - GAME_CONFIG.MONSTER_SIZE;
  const y = platformY - GAME_CONFIG.MONSTER_SIZE;
  const initialDirection = direction || (spawnSide === "left" ? 1 : -1);

  return {
    ...createBaseMonster(x, y, MonsterType.HORIZONTAL_PATROL, speed),
    patrolStartX: platformX,
    patrolEndX: platformX + platformWidth,
    direction: initialDirection,
    walkLengths,
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
 */
export const createVerticalPatrolMonster = (
  platformX: number,
  startY: number,
  patrolHeight: number,
  side: "left" | "right" = "left",
  speed: number = 1,
  direction: number = 1
): Monster => {
  // Calculate monster X position based on side
  const x = side === "left" 
    ? platformX - GAME_CONFIG.MONSTER_SIZE  // Left side of platform
    : platformX + GAME_CONFIG.MONSTER_SIZE;                            // Right side of platform

  return {
    ...createBaseMonster(x, startY, MonsterType.VERTICAL_PATROL, speed),
    patrolStartY: startY,
    patrolEndY: startY + patrolHeight,
    direction,
    patrolSide: side, // Store which side to patrol on
  } as Monster;
};

/**
 * Creates a floater monster that moves in straight lines and bounces off walls/platforms
 * @param startX - Starting X position
 * @param startY - Starting Y position
 * @param startAngle - Starting angle in degrees (0-360)
 * @param speed - Movement speed
 */
export const createFloaterMonster = (
  startX: number,
  startY: number,
  startAngle: number = 45,
  speed: number = 1
): Monster => {
  return {
    ...createBaseMonster(startX, startY, MonsterType.FLOATER, speed),
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
 */
export const createChaserMonster = (
  startX: number,
  startY: number,
  speed: number = 1,
  directness: number = 1,
  updateInterval: number = 500
): Monster => {
  return {
    ...createBaseMonster(startX, startY, MonsterType.CHASER, speed),
    direction: 0, // Chaser doesn't use direction property
    directness,
    chaseUpdateInterval: updateInterval,
  } as Monster;
};

/**
 * Creates an ambusher monster that wanders and periodically ambushes
 * @param startX - Starting X position
 * @param startY - Starting Y position
 * @param patrolWidth - Width of the patrol area
 * @param patrolHeight - Height of the patrol area
 * @param speed - Movement speed
 * @param ambushInterval - Time between ambushes (ms)
 */
export const createAmbusherMonster = (
  startX: number,
  startY: number,
  patrolWidth: number,
  patrolHeight: number = 100,
  speed: number = 1,
  ambushInterval: number = 5000
): Monster => {
  return {
    ...createBaseMonster(startX, startY, MonsterType.AMBUSHER, speed),
    patrolStartX: startX,
    patrolEndX: startX + patrolWidth,
    patrolStartY: startY,
    patrolEndY: startY + patrolHeight,
    ambushCooldown: 0, // Initialize ambush cooldown
  } as Monster;
};

/**
 * Utility function to create a monster from a spawn point configuration
 * This is useful for dynamic monster spawning during gameplay
 */
export const createMonsterFromSpawnPoint = (spawnPoint: any): Monster => {
  const { x, y, type, speed = 1, ...config } = spawnPoint;

  switch (type) {
    case MonsterType.HORIZONTAL_PATROL:
      return createHorizontalPatrolMonster(
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

    case MonsterType.FLOATER:
      return createFloaterMonster(
        x,
        y,
        config.startAngle || 45,
        speed
      );

    case MonsterType.CHASER:
      return createChaserMonster(
        x,
        y,
        speed,
        config.directness || 0.3,
        config.updateInterval || 500
      );

    case MonsterType.AMBUSHER:
      return createAmbusherMonster(
        x,
        y,
        config.patrolWidth || 200,
        config.patrolHeight || 100,
        speed,
        config.ambushInterval || 5000
      );

    default:
      throw new Error(`Unknown monster type: ${type}`);
  }
}; 