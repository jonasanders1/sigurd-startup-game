/**
 * Map-authoring helpers.
 *
 * Factory functions used by `mapDefinitions.ts`, the tutorial missions
 * (`tutorials/missions.ts`), and the level editor's serializer
 * (`editor/serialize.ts`) to build maps declaratively. Each returns a plain
 * game-object literal so call sites can object-spread extra fields on top,
 * e.g. `{ ...createPlatform(...), roundedCorners: { tl: true } }`.
 *
 * These originated as inline helpers inside `mapDefinitions.ts` and were
 * extracted here during the map refactor; the contract is unchanged.
 */

import { Bomb, Platform } from "../types/interfaces";
import { GAME_CONFIG, COLORS } from "../types/constants";

/** Create a bomb at (x, y) with its collection order and group. */
export const createBomb = (
  x: number,
  y: number,
  order: number,
  group: number,
): Bomb => ({
  x,
  y,
  width: GAME_CONFIG.BOMB_SIZE,
  height: GAME_CONFIG.BOMB_SIZE,
  order,
  group,
  isCollected: false,
  isBlinking: false,
});

/** Create a horizontal platform. Defaults: platform color, black border. */
export const createPlatform = (
  x: number,
  y: number,
  dimensions: { width: number; height: number },
  color: string = COLORS.PLATFORM,
  borderColor: string = "#000",
): Platform => ({
  x,
  y,
  width: dimensions.width,
  height: dimensions.height,
  borderColor,
  color,
});

/** Create a vertical platform (wall) of standard thickness. */
export const createVerticalPlatform = (
  x: number,
  y: number,
  height: number,
  color: string = COLORS.PLATFORM,
  borderColor: string = "#000",
): Platform => ({
  x,
  y,
  width: 15, // Standard wall thickness
  height,
  borderColor,
  color,
  isVertical: true,
});

const centerX = (offsetWidth: number): number =>
  (GAME_CONFIG.CANVAS_WIDTH - offsetWidth) / 2;
const centerY = (offsetHeight: number): number =>
  (GAME_CONFIG.CANVAS_HEIGHT - offsetHeight) / 2;

/** Centered position for an object of the given width/height on the playfield. */
export const centerPoint = (
  offsetWidth: number,
  offsetHeight: number,
): { x: number; y: number } => ({
  x: centerX(offsetWidth),
  y: centerY(offsetHeight),
});
