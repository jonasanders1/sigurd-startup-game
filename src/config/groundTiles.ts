/**
 * Ground tilesets. A ground is a 2D grid of cells:
 *
 *   [ surface | surface | surface | ... ]   <- top row, walkable
 *   [ ground  | ground  | ground  | ... ]   <- repeats below to ground.height
 *
 * Each theme can declare multiple surface and ground variants. Variants are
 * picked deterministically by cell coordinate so the pattern stays stable
 * across frames.
 */

import { getSpriteImagePath, loadSpriteImage } from "./assets";

export type GroundTheme =
  | "construction"
  | "dungeon"
  | "stone-gray"
  | "store-redish"
  | "desert";

interface GroundTileFiles {
  surface: readonly string[];
  ground: readonly string[];
}

const TILE_FILES: Record<GroundTheme, GroundTileFiles> = {
  construction: {
    surface: ["Tiles/grounds/construction/surface/01.png"],
    ground: [
      "Tiles/grounds/construction/ground/02.png",
      "Tiles/grounds/construction/ground/02b-broken.png",
    ],
  },
  dungeon: {
    surface: [
      "Tiles/grounds/dungeon/surface/ground-01.png",
      "Tiles/grounds/dungeon/surface/ground-02.png",
    ],
    ground: ["Tiles/grounds/dungeon/ground/ground-03.png"],
  },
  "stone-gray": {
    surface: ["Tiles/grounds/stone-gray/surface/01.png"],
    ground: [
      "Tiles/grounds/stone-gray/ground/02.png",
      "Tiles/grounds/stone-gray/ground/02-broken.png",
    ],
  },
  "store-redish": {
    surface: ["Tiles/grounds/store-redish/surface/01alt.png"],
    ground: [
      "Tiles/grounds/store-redish/ground/02-alt.png",
      "Tiles/grounds/store-redish/ground/02-broken-alt.png",
    ],
  },
  desert: {
    surface: ["Tiles/desert/surface/ground-02.png"],
    ground: ["Tiles/desert/ground/ground-03.png"],
  },
};

export const DEFAULT_GROUND_THEME: GroundTheme = "stone-gray";

/** Game-px per ground block. 40px default ground = 2 rows. */
export const GROUND_BLOCK_SIZE = 20;

/**
 * Default fraction of cells that pick a non-default variant. 0 = always the
 * clean default tile, 1 = every cell picks an alternate. Themes with a single
 * variant on a layer ignore this.
 */
export const DEFAULT_GROUND_NOISE = 0.3;

/** Deterministic [0,1) hash from two integers + salt. Stable across frames. */
function hash01(x: number, y: number, salt: number): number {
  const s = Math.sin(x * 12.9898 + y * 78.233 + salt * 37.719) * 43758.5453;
  return s - Math.floor(s);
}

interface LoadedGroundTileSet {
  surface: HTMLImageElement[];
  ground: HTMLImageElement[];
}

const loadedCache = new Map<GroundTheme, LoadedGroundTileSet>();

export function getGroundTileSet(theme: GroundTheme): LoadedGroundTileSet {
  const cached = loadedCache.get(theme);
  if (cached) return cached;

  const files = TILE_FILES[theme];
  const set: LoadedGroundTileSet = {
    surface: files.surface.map((p) => loadSpriteImage(p)),
    ground: files.ground.map((p) => loadSpriteImage(p)),
  };
  loadedCache.set(theme, set);
  return set;
}

/** URLs for surface/ground tiles — for use in <img> tags (e.g. editor). */
export function getGroundTileUrls(theme: GroundTheme): {
  surface: string[];
  ground: string[];
} {
  const files = TILE_FILES[theme];
  return {
    surface: files.surface.map((p) => getSpriteImagePath(p)),
    ground: files.ground.map((p) => getSpriteImagePath(p)),
  };
}

export function getAllGroundTilePaths(): string[] {
  return Object.values(TILE_FILES).flatMap((f) => [...f.surface, ...f.ground]);
}

export const GROUND_THEMES: GroundTheme[] = Object.keys(TILE_FILES) as GroundTheme[];

/**
 * Compute the layout of a tiled ground: for each cell, returns its position,
 * size, and whether it should be a surface (top row) or ground (other rows)
 * tile. Deterministic variant index = (col + row) % variantCount.
 */
export interface GroundCell {
  col: number;
  row: number;
  x: number;
  y: number;
  width: number;
  height: number;
  /** "surface" for the top row, "ground" for everything below. */
  layer: "surface" | "ground";
  /** Index into the chosen layer's variants array. */
  variantIndex: number;
}

export function layoutGroundCells(
  x: number,
  y: number,
  width: number,
  height: number,
  theme: GroundTheme,
  noise: number = DEFAULT_GROUND_NOISE,
  cellSize: number = GROUND_BLOCK_SIZE
): GroundCell[] {
  // Each tile is rendered at exactly cellSize × cellSize — no stretching. If
  // width/height aren't multiples of cellSize, the rightmost/bottom tiles
  // overflow and get clipped by the consumer (ctx.clip / overflow:hidden).
  const numCols = Math.max(1, Math.ceil(width / cellSize));
  const numRows = Math.max(1, Math.ceil(height / cellSize));
  const files = TILE_FILES[theme];
  const surfaceCount = Math.max(1, files.surface.length);
  const groundCount = Math.max(1, files.ground.length);
  const clampedNoise = Math.max(0, Math.min(1, noise));

  const cells: GroundCell[] = [];
  for (let r = 0; r < numRows; r++) {
    for (let c = 0; c < numCols; c++) {
      const layer: GroundCell["layer"] = r === 0 ? "surface" : "ground";
      const variantCount = layer === "surface" ? surfaceCount : groundCount;

      // noise = 0 → always default (variant 0).
      // noise = 1 → every cell picks a non-default variant.
      // In between → that fraction of cells gets a non-default.
      let variantIndex = 0;
      if (variantCount > 1) {
        const pickAlt = hash01(c, r, 0) < clampedNoise;
        if (pickAlt) {
          const altPick = Math.floor(hash01(c, r, 1) * (variantCount - 1));
          variantIndex = 1 + Math.min(altPick, variantCount - 2);
        }
      }

      cells.push({
        col: c,
        row: r,
        x: x + c * cellSize,
        y: y + r * cellSize,
        width: cellSize,
        height: cellSize,
        layer,
        variantIndex,
      });
    }
  }
  return cells;
}
