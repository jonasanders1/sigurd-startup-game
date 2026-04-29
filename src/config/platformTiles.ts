/**
 * Platform tilesets. Each theme has three 16×16 pieces — left, middle, right —
 * that get composed into a strip to fill any platform.
 *
 * Vertical platforms use the same three tiles, rotated 90° clockwise: the
 * "left" tile becomes the top end, "right" becomes the bottom end.
 */

import { getSpriteImagePath, loadSpriteImage } from "./assets";

export type PlatformTheme =
  | "metal"
  | "plastic"
  | "industry"
  | "construction"
  | "grass-light"
  | "grass-dark";

export interface PlatformTileSet {
  left: HTMLImageElement;
  middle: HTMLImageElement;
  right: HTMLImageElement;
}

const TILE_FILES: Record<PlatformTheme, readonly [string, string, string]> = {
  metal: [
    "Tiles/metal/Tile_11.png",
    "Tiles/metal/Tile_12.png",
    "Tiles/metal/Tile_13.png",
  ],
  plastic: [
    "Tiles/plastic/Tile_53.png",
    "Tiles/plastic/Tile_54.png",
    "Tiles/plastic/Tile_55.png",
  ],
  industry: [
    "Tiles/industry/Tile_90.png",
    "Tiles/industry/Tile_91.png",
    "Tiles/industry/Tile_92.png",
  ],
  construction: [
    "Tiles/construction/Tile_85.png",
    "Tiles/construction/Tile_86.png",
    "Tiles/construction/Tile_87.png",
  ],
  "grass-light": [
    "Tiles/grass-light/Tile_01.png",
    "Tiles/grass-light/Tile_02.png",
    "Tiles/grass-light/Tile_03.png",
  ],
  "grass-dark": [
    "Tiles/grass-dark/Tile_06.png",
    "Tiles/grass-dark/Tile_07.png",
    "Tiles/grass-dark/Tile_08.png",
  ],
};

export const DEFAULT_PLATFORM_THEME: PlatformTheme = "metal";

const tileSetCache = new Map<PlatformTheme, PlatformTileSet>();

export function getPlatformTileSet(theme: PlatformTheme): PlatformTileSet {
  const cached = tileSetCache.get(theme);
  if (cached) return cached;

  const [leftPath, middlePath, rightPath] = TILE_FILES[theme];
  const set: PlatformTileSet = {
    left: loadSpriteImage(leftPath),
    middle: loadSpriteImage(middlePath),
    right: loadSpriteImage(rightPath),
  };
  tileSetCache.set(theme, set);
  return set;
}

export function getAllPlatformTilePaths(): string[] {
  return Object.values(TILE_FILES).flatMap((paths) => paths);
}

/** URLs for the three pieces — for use in <img> tags (e.g. editor). */
export function getPlatformTileUrls(theme: PlatformTheme): {
  left: string;
  middle: string;
  right: string;
} {
  const [left, middle, right] = TILE_FILES[theme];
  return {
    left: getSpriteImagePath(left),
    middle: getSpriteImagePath(middle),
    right: getSpriteImagePath(right),
  };
}

export const PLATFORM_THEMES: PlatformTheme[] = Object.keys(TILE_FILES) as PlatformTheme[];

/**
 * Layout for a horizontal platform tile strip. Returns one entry per tile
 * with its index (0 = left cap, last = right cap, others = middle).
 */
export interface PlatformTileSlot {
  index: number;
  total: number;
  /** "left" | "middle" | "right" — which of the three pieces this slot uses. */
  piece: "left" | "middle" | "right";
  /** Top-left of the tile in entity-local coordinates (relative to platform.x/y). */
  localX: number;
  localY: number;
  width: number;
  height: number;
}

export function layoutPlatformTiles(
  width: number,
  height: number,
  isVertical: boolean
): PlatformTileSlot[] {
  if (isVertical) {
    const tileSize = width;
    const numTiles = Math.max(2, Math.round(height / tileSize));
    const tileHeight = height / numTiles;
    return Array.from({ length: numTiles }, (_, i) => ({
      index: i,
      total: numTiles,
      piece: i === 0 ? "left" : i === numTiles - 1 ? "right" : "middle",
      localX: 0,
      localY: i * tileHeight,
      width,
      height: tileHeight,
    }));
  }
  const tileSize = height;
  const numTiles = Math.max(2, Math.round(width / tileSize));
  const tileWidth = width / numTiles;
  return Array.from({ length: numTiles }, (_, i) => ({
    index: i,
    total: numTiles,
    piece: i === 0 ? "left" : i === numTiles - 1 ? "right" : "middle",
    localX: i * tileWidth,
    localY: 0,
    width: tileWidth,
    height,
  }));
}
