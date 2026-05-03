/**
 * BJ Bird spawn-corner logic (game-specs §5.1.1).
 *
 * "If the player holds a direction when the level begins, the bird spawns
 * in the OPPOSITE corner. (E.g. holding Up+Right → bird spawns top-left.)"
 *
 * Pure helpers — caller (LevelManager) reads input state, passes a plain
 * record. Two-step:
 *   1. decideBirdSpawnCorner(input, fallback) → SpawnCorner
 *   2. cornerToBirdSpawnPosition(corner, bounds) → { x, y }
 */

export type SpawnCorner =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

export interface DirectionalInput {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
}

/**
 * Bird spawns in the corner OPPOSITE the direction held. Each axis flips
 * independently:
 *   - DOWN held → spawn top side  (UP held → bottom side)
 *   - LEFT held → spawn right side (RIGHT held → left side)
 * Conflicting axes (both up+down OR both left+right) defer to fallback.
 */
export const decideBirdSpawnCorner = (
  input: DirectionalInput,
  fallback: SpawnCorner = "top-left"
): SpawnCorner => {
  let vertical: "top" | "bottom";
  if (input.down && !input.up) vertical = "top";
  else if (input.up && !input.down) vertical = "bottom";
  else vertical = fallback.startsWith("top") ? "top" : "bottom";

  let horizontal: "left" | "right";
  if (input.right && !input.left) horizontal = "left";
  else if (input.left && !input.right) horizontal = "right";
  else horizontal = fallback.endsWith("left") ? "left" : "right";

  return `${vertical}-${horizontal}` as SpawnCorner;
};

export interface BirdSpawnBounds {
  width: number;
  height: number;
  monsterSize: number;
  /** Padding from the edge so the bird isn't clipped against the boundary. */
  padding?: number;
}

export const cornerToBirdSpawnPosition = (
  corner: SpawnCorner,
  bounds: BirdSpawnBounds
): { x: number; y: number } => {
  const pad = bounds.padding ?? 25;
  const left = pad;
  const right = bounds.width - bounds.monsterSize - pad;
  const top = pad;
  const bottom = bounds.height - bounds.monsterSize - pad;

  switch (corner) {
    case "top-left":
      return { x: left, y: top };
    case "top-right":
      return { x: right, y: top };
    case "bottom-left":
      return { x: left, y: bottom };
    case "bottom-right":
      return { x: right, y: bottom };
  }
};
