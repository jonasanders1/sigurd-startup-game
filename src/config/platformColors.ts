/**
 * Named platform color palette. Use these instead of hardcoded hexes when
 * authoring maps. The Platform `color` field accepts any CSS color, so callers
 * are free to ignore the palette — but staying inside the set keeps the
 * games' look consistent across levels.
 *
 * Tile sprites are still supported via `Platform.tileTheme` (see
 * `platformTiles.ts`). When a platform has no `tileTheme`, RenderManager and
 * EditorCanvas render a solid color rect using `Platform.color` instead.
 */

export type PlatformColorName =
  | "green"
  | "gray"
  | "brown"
  | "blue-green"
  | "yellow"
  | "green-dark"
  | "blue"
  | "sand";

export const PLATFORM_COLORS: Record<PlatformColorName, string> = {
  "green": "#84bf4d",
  "gray": "#a2a2a2",
  "brown": "#bd9853",
  "blue-green": "#249c8e",
  "yellow": "#fcc233",
  "green-dark": "#059f60",
  "blue": "#304e85",
  "sand": "#fdd58e",
};

export const PLATFORM_COLOR_NAMES: PlatformColorName[] = Object.keys(
  PLATFORM_COLORS
) as PlatformColorName[];

/**
 * Size (in px) of the chamfered (45° cut) platform corner. Per-corner
 * toggles live on the Platform entity (`roundedCorners` — kept under that
 * name for serialization compat). Each enabled corner removes a triangle
 * of this many pixels.
 *
 * Visual only — runtime collision stays AABB.
 */
export const PLATFORM_CHAMFER_SIZE = 4;

/**
 * Per-row inset for the chamfered corner. Each row removes one fewer pixel
 * than the previous, producing a clean 45° diagonal cut — the classic
 * NES/arcade pixel-art rounded-corner look. Length must match
 * PLATFORM_CHAMFER_SIZE.
 */
export const PLATFORM_CHAMFER_INSET: readonly number[] = [3, 2, 1, 0];

/**
 * Inner chamfer used to draw a 1-px border around the chamfered shape:
 * fill the outer chamfer in border color, then fill the inner chamfer
 * (one pixel less rounding, shifted +1px on every side) in platform color.
 * The result is a clean 1-px border on all four straight edges AND on the
 * diagonal — proven by pixel-by-pixel walk: at every row, outer fills two
 * more pixels than inner (one on each side), so the leftover border is
 * exactly 1 px wide everywhere.
 */
export const PLATFORM_CHAMFER_INNER_SIZE = 3;
export const PLATFORM_CHAMFER_INNER_INSET: readonly number[] = [2, 1, 0];
