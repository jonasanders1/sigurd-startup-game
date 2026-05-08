/**
 * Entity dimensions.
 *
 * Two-box model for player + monsters:
 *   - bounds: physics envelope (walls, platforms, floor, ceiling).
 *   - hitbox: smaller lethal-collision rect (player-vs-monster damage).
 *
 * Bombs and coins are collected on overlap and don't have wall physics, so a
 * single rect is enough.
 *
 * Monster bounds + hitbox live next to each monster's sprite class under
 * src/entities/ so per-monster tuning stays in one place.
 */

export type Box = { width: number; height: number };

/**
 * Lethal hitbox positioned relative to the bounds center.
 *  - shape: "rect" (default, with slightly rounded corners visually) or
 *    "ellipse" (uses width/2 + height/2 as semi-axes — set width === height
 *    for a circle).
 *  - offsetX/Y: optional shift from the bounds center (default 0).
 */
export type LethalHitbox = Box & {
  shape?: "rect" | "ellipse";
  offsetX?: number;
  offsetY?: number;
};

/** Visual corner radius (px) used when drawing rect lethal hitboxes in debug overlay. */
export const HITBOX_VISUAL_CORNER_RADIUS = 4;

export const ENTITY_SIZES = {
  PLAYER: { bounds: { width: 25, height: 43 } as Box },
  BOMB: { width: 25, height: 25 } as Box,
  COIN: { width: 25, height: 25 } as Box,
  PLATFORM_HEIGHT: 25,
} as const;

/**
 * Resolve a lethal hitbox to an absolute world-space rect, centered on the
 * given bounds rect (with the hitbox's optional offsets applied).
 */
export const resolveHitboxRect = (
  bounds: { x: number; y: number; width: number; height: number },
  hitbox: LethalHitbox,
): { x: number; y: number; width: number; height: number } => {
  const cx = bounds.x + bounds.width / 2;
  const cy = bounds.y + bounds.height / 2;
  return {
    x: cx - hitbox.width / 2 + (hitbox.offsetX ?? 0),
    y: cy - hitbox.height / 2 + (hitbox.offsetY ?? 0),
    width: hitbox.width,
    height: hitbox.height,
  };
};
