/**
 * Platform tilesets. Each theme has three pieces — left, middle, right — that
 * get composed into a strip to fill any platform.
 *
 * Themes can also provide native vertical tiles (top, middle, bottom) for
 * vertical platforms. Themes without native vertical tiles fall back to
 * rotating the horizontal tiles 90° clockwise at draw time.
 */

import { getSpriteImagePath, loadSpriteImage } from "./assets";

export type PlatformTheme =
  | "platform-beige"
  | "platform-blue"
  | "platform-green";

export interface PlatformTileSet {
  left: HTMLImageElement;
  middle: HTMLImageElement;
  right: HTMLImageElement;
}

const TILE_FILES: Record<PlatformTheme, readonly [string, string, string]> = {
  "platform-beige": [
    "horizontal-platforms/platform-beige/platform-beige_0.png",
    "horizontal-platforms/platform-beige/platform-beige_1.png",
    "horizontal-platforms/platform-beige/platform-beige_2.png",
  ],
  "platform-blue": [
    "horizontal-platforms/platform-blue/platform-blue_0.png",
    "horizontal-platforms/platform-blue/platform-blue_1.png",
    "horizontal-platforms/platform-blue/platform-blue_2.png",
  ],
  "platform-green": [
    "horizontal-platforms/platform-green/platform-green_0.png",
    "horizontal-platforms/platform-green/platform-green_1.png",
    "horizontal-platforms/platform-green/platform-green_2.png",
  ],
};

/**
 * Optional native vertical tiles per theme. If absent, vertical platforms
 * fall back to rotating the horizontal tiles. Order: [top, middle, bottom].
 */
const VERTICAL_TILE_FILES: Partial<
  Record<PlatformTheme, readonly [string, string, string]>
> = {
  "platform-beige": [
    "vertical-platforms/platform-beige/platform_0.png",
    "vertical-platforms/platform-beige/platform_1.png",
    "vertical-platforms/platform-beige/platform_2.png",
  ],
  "platform-blue": [
    "vertical-platforms/platform-blue/platform_0.png",
    "vertical-platforms/platform-blue/platform_1.png",
    "vertical-platforms/platform-blue/platform_2.png",
  ],
  "platform-green": [
    "vertical-platforms/platform-green/platform_0.png",
    "vertical-platforms/platform-green/platform_1.png",
    "vertical-platforms/platform-green/platform_2.png",
  ],
};

export const DEFAULT_PLATFORM_THEME: PlatformTheme = "platform-beige";

export function hasVerticalTiles(theme: PlatformTheme): boolean {
  return VERTICAL_TILE_FILES[theme] !== undefined;
}

const tileSetCache = new Map<string, PlatformTileSet>();

export function getPlatformTileSet(
  theme: PlatformTheme,
  isVertical: boolean = false,
): PlatformTileSet {
  const useVertical = isVertical && VERTICAL_TILE_FILES[theme] !== undefined;
  const cacheKey = useVertical ? `${theme}|v` : theme;
  const cached = tileSetCache.get(cacheKey);
  if (cached) return cached;

  const paths = useVertical ? VERTICAL_TILE_FILES[theme]! : TILE_FILES[theme];
  const set: PlatformTileSet = {
    left: loadSpriteImage(paths[0]),
    middle: loadSpriteImage(paths[1]),
    right: loadSpriteImage(paths[2]),
  };
  tileSetCache.set(cacheKey, set);
  return set;
}

export function getAllPlatformTilePaths(): string[] {
  return [
    ...Object.values(TILE_FILES).flatMap((paths) => paths),
    ...Object.values(VERTICAL_TILE_FILES).flatMap((paths) => paths ?? []),
  ];
}

/** URLs for the three pieces — for use in <img> tags (e.g. editor). */
export function getPlatformTileUrls(
  theme: PlatformTheme,
  isVertical: boolean = false,
): {
  left: string;
  middle: string;
  right: string;
} {
  const useVertical = isVertical && VERTICAL_TILE_FILES[theme] !== undefined;
  const paths = useVertical ? VERTICAL_TILE_FILES[theme]! : TILE_FILES[theme];
  return {
    left: getSpriteImagePath(paths[0]),
    middle: getSpriteImagePath(paths[1]),
    right: getSpriteImagePath(paths[2]),
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
