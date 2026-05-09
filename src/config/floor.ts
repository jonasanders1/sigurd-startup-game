/**
 * Decorative floor strip rendered along the bottom edge of every map.
 *
 * Visual only — the canvas bottom (y = CANVAS_HEIGHT) remains the player's
 * effective ground. The strip is drawn between the background and the
 * platform layer so foundings/coins resting near the floor sit visually on top
 * of it.
 *
 * Each variant is a single 32×32 tile, repeated horizontally across the
 * full 800-px canvas (25 tiles).
 */

import { getSpriteImagePath, loadSpriteImage } from "./assets";
import { CANVAS_CONFIG } from "./game";

export type FloorVariant =
  // Striped style (diagonal cap on top edge).
  | "green"
  | "gray"
  | "brown"
  | "blue-green"
  | "yellow"
  | "yellow-light"
  | "green-white"
  | "blue-purple"
  | "sand-pink"
  // Clean style (flat solid colors).
  | "green-clean"
  | "gray-clean"
  | "brown-clean"
  | "blue-green-clean"
  | "yellow-clean"
  | "yellow-light-clean"
  | "green-white-clean"
  | "blue-purple-clean"
  | "sand-pink-clean";

export type FloorStyle = "striped" | "clean";

export const FLOOR_TILE_WIDTH = 32;
/**
 * Rendered (and collision) height of the floor strip. The source PNG is
 * 32×64 — we crop to the top 25 px so the diagonal/striped cap stays intact
 * and only the solid-color bottom is hidden.
 */
export const FLOOR_TILE_HEIGHT = 25;
/** Natural height of the source PNG. Used by the renderer for top-crop. */
export const FLOOR_SPRITE_SOURCE_HEIGHT = 64;

/**
 * Y-coordinate of the floor sprite's top edge — also the bottom of the
 * playable area. Entities (player, monsters, gravity-coins) clamp here so
 * the floor strip is restricted ground, not walkable space.
 */
export const PLAYFIELD_BOTTOM = CANVAS_CONFIG.HEIGHT - FLOOR_TILE_HEIGHT;

const FLOOR_FILES: Record<FloorVariant, string> = {
  "green": "sprites/floor/striped/floor_01.png",
  "gray": "sprites/floor/striped/floor_02.png",
  "brown": "sprites/floor/striped/floor_03.png",
  "blue-green": "sprites/floor/striped/floor_04.png",
  "yellow": "sprites/floor/striped/floor_05.png",
  "yellow-light": "sprites/floor/striped/floor_06.png",
  "green-white": "sprites/floor/striped/floor_07.png",
  "blue-purple": "sprites/floor/striped/floor_08.png",
  "sand-pink": "sprites/floor/striped/floor_09.png",
  "green-clean": "sprites/floor/clean/floor_01.png",
  "gray-clean": "sprites/floor/clean/floor_02.png",
  "brown-clean": "sprites/floor/clean/floor_03.png",
  "blue-green-clean": "sprites/floor/clean/floor_04.png",
  "yellow-clean": "sprites/floor/clean/floor_05.png",
  "yellow-light-clean": "sprites/floor/clean/floor_06.png",
  "green-white-clean": "sprites/floor/clean/floor_07.png",
  "blue-purple-clean": "sprites/floor/clean/floor_08.png",
  "sand-pink-clean": "sprites/floor/clean/floor_09.png",
};

/** Variants grouped by style — useful for grouped dropdowns. */
export const FLOOR_VARIANTS_BY_STYLE: Record<FloorStyle, FloorVariant[]> = {
  striped: [
    "green", "gray", "brown", "blue-green", "yellow",
    "yellow-light", "green-white", "blue-purple", "sand-pink",
  ],
  clean: [
    "green-clean", "gray-clean", "brown-clean", "blue-green-clean", "yellow-clean",
    "yellow-light-clean", "green-white-clean", "blue-purple-clean", "sand-pink-clean",
  ],
};

const floorImageCache = new Map<FloorVariant, HTMLImageElement>();

export const FLOOR_VARIANTS: FloorVariant[] = Object.keys(
  FLOOR_FILES
) as FloorVariant[];

export function getFloorImage(variant: FloorVariant): HTMLImageElement {
  const cached = floorImageCache.get(variant);
  if (cached) return cached;
  const img = loadSpriteImage(FLOOR_FILES[variant]);
  floorImageCache.set(variant, img);
  return img;
}

export function getFloorImageUrl(variant: FloorVariant): string {
  return getSpriteImagePath(FLOOR_FILES[variant]);
}

export function getAllFloorTilePaths(): string[] {
  return Object.values(FLOOR_FILES);
}
