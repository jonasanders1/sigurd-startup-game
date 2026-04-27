/**
 * Per-monster, per-animation, per-frame hitbox configuration.
 *
 * Each entry can override:
 *  - width, height: collision rect dimensions
 *  - offsetX: horizontal shift from the natural center (positive = right)
 *  - offsetY: vertical shift from the natural feet line (negative = up)
 *
 * The "natural feet" (= bottom-center of the default hitbox) is the stable
 * anchor preserved across frames. With zero offsets, the hitbox is centered
 * horizontally over feetX and bottom-aligned to feetY. Non-zero offsets shift
 * the hitbox relative to that anchor without affecting the sprite draw.
 *
 * Tune values here without touching render code.
 */

import { MonsterType } from "../types/enums";

export type FrameHitbox = {
  width: number;
  height: number;
  /** Horizontal shift from natural center. Default 0. */
  offsetX?: number;
  /** Vertical shift from natural feet (bottom). Negative lifts the hitbox. Default 0. */
  offsetY?: number;
  /**
   * Rotation in degrees around the hitbox center. Only applies to rect shapes.
   * Positive = clockwise. Default 0.
   */
  rotation?: number;
};

type MonsterHitboxConfig = {
  /** Collision shape. "ellipse" uses width/2 (rx) and height/2 (ry) — set width=height for a circle. Default "rect". */
  shape?: "rect" | "ellipse";
  /** Hitbox used when no per-frame override matches */
  default: FrameHitbox;
  /** Optional per-animation, per-frame overrides */
  perFrame?: Record<string, Record<number, FrameHitbox>>;
};

const STRIDE: FrameHitbox = { width: 32, height: 18 };

export const MONSTER_HITBOXES: Record<MonsterType, MonsterHitboxConfig> = {
  [MonsterType.HORIZONTAL_PATROL]: {
    shape: "ellipse",
    default: { width: 25, height: 25 },
    perFrame: {
      "walk-left": { 4: STRIDE, 5: STRIDE, 6: STRIDE, 7: STRIDE },
      "walk-right": { 4: STRIDE, 5: STRIDE, 6: STRIDE, 7: STRIDE },
    },
  },
  [MonsterType.VERTICAL_PATROL]: {
    shape: "ellipse",
    default: { width: 25, height: 25 },
  },
  [MonsterType.CHASER]: {
    shape: "ellipse",
    default: { width: 25, height: 25 },
  },
  [MonsterType.AMBUSHER]: {
    shape: "rect",
    default: { width: 20, height: 40, offsetY: -10 }, // 1:2 ratio (taller than wide)
    perFrame: {
      // Lean into the dash — hitbox tilts with the charge direction.
      "attack-left": {
        0: { width: 20, height: 40, offsetY: -10, offsetX: -10, rotation: -40 },
        1: { width: 20, height: 40, offsetY: -10, offsetX: -10, rotation: -40 },
        2: { width: 20, height: 40, offsetY: -10, offsetX: -10, rotation: -40 },
      },
      "attack-right": {
        0: { width: 20, height: 40, offsetY: -10, offsetX: 10, rotation: 40 },
        1: { width: 20, height: 40, offsetY: -10, offsetX: 10, rotation: 40 },
        2: { width: 20, height: 40, offsetY: -10, offsetX: 10, rotation: 40 },
      },
    },
  },
  [MonsterType.FLOATER]: {
    shape: "ellipse",
    default: { width: 25, height: 25 },
  },
};

const FALLBACK: FrameHitbox = { width: 25, height: 25 };

export const getDefaultHitbox = (type: MonsterType): FrameHitbox =>
  MONSTER_HITBOXES[type]?.default ?? FALLBACK;

export const getMonsterShape = (type: MonsterType): "rect" | "ellipse" =>
  MONSTER_HITBOXES[type]?.shape ?? "rect";

/**
 * SAT collision between a (possibly-rotated) rect and an axis-aligned rect.
 * Pass rotation in degrees; 0 falls through to standard AABB.
 */
export const rotatedRectAabbColliding = (
  rect: { x: number; y: number; width: number; height: number },
  rotation: number,
  aabb: { x: number; y: number; width: number; height: number },
): boolean => {
  if (!rotation) {
    return (
      rect.x < aabb.x + aabb.width &&
      rect.x + rect.width > aabb.x &&
      rect.y < aabb.y + aabb.height &&
      rect.y + rect.height > aabb.y
    );
  }

  const angle = (rotation * Math.PI) / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const cx = rect.x + rect.width / 2;
  const cy = rect.y + rect.height / 2;
  const hw = rect.width / 2;
  const hh = rect.height / 2;

  // Rotated rect corners (unrolled — avoids per-call array allocations).
  const r0x = cx + -hw * cos - -hh * sin;
  const r0y = cy + -hw * sin + -hh * cos;
  const r1x = cx + hw * cos - -hh * sin;
  const r1y = cy + hw * sin + -hh * cos;
  const r2x = cx + hw * cos - hh * sin;
  const r2y = cy + hw * sin + hh * cos;
  const r3x = cx + -hw * cos - hh * sin;
  const r3y = cy + -hw * sin + hh * cos;

  const ax0 = aabb.x;
  const ax1 = aabb.x + aabb.width;
  const ay0 = aabb.y;
  const ay1 = aabb.y + aabb.height;

  // SAT axis test inlined for the 4 separating axes (2 AABB + 2 rotated rect).
  const sep = (axx: number, axy: number): boolean => {
    const p0 = r0x * axx + r0y * axy;
    const p1 = r1x * axx + r1y * axy;
    const p2 = r2x * axx + r2y * axy;
    const p3 = r3x * axx + r3y * axy;
    const minA = Math.min(p0, p1, p2, p3);
    const maxA = Math.max(p0, p1, p2, p3);

    const q0 = ax0 * axx + ay0 * axy;
    const q1 = ax1 * axx + ay0 * axy;
    const q2 = ax1 * axx + ay1 * axy;
    const q3 = ax0 * axx + ay1 * axy;
    const minB = Math.min(q0, q1, q2, q3);
    const maxB = Math.max(q0, q1, q2, q3);

    return maxA < minB || maxB < minA;
  };

  if (sep(1, 0)) return false;
  if (sep(0, 1)) return false;
  if (sep(cos, sin)) return false;
  if (sep(-sin, cos)) return false;
  return true;
};

export const getMonsterRotation = (monster: MonsterLike): number =>
  (monster._hitboxRotation as number | undefined) ?? 0;

/**
 * Ellipse-vs-rect collision. The ellipse fills `ellipseBox` (rx = width/2,
 * ry = height/2). Works for circles too — just set width === height.
 *
 * Math: transform the rect into ellipse-space (where the ellipse becomes a unit
 * circle at the origin), then do unit-circle-vs-rect.
 */
export const ellipseRectColliding = (
  ellipseBox: { x: number; y: number; width: number; height: number },
  rect: { x: number; y: number; width: number; height: number },
): boolean => {
  const rx = ellipseBox.width / 2;
  const ry = ellipseBox.height / 2;
  if (rx <= 0 || ry <= 0) return false;
  const cx = ellipseBox.x + rx;
  const cy = ellipseBox.y + ry;

  // Rect coords in ellipse-space (origin at ellipse center, axes scaled by rx/ry)
  const tx = (rect.x - cx) / rx;
  const ty = (rect.y - cy) / ry;
  const tw = rect.width / rx;
  const th = rect.height / ry;

  // Closest point on transformed rect to origin
  const closestX = Math.max(tx, Math.min(0, tx + tw));
  const closestY = Math.max(ty, Math.min(0, ty + th));
  return closestX * closestX + closestY * closestY < 1;
};

export const getHitboxForFrame = (
  type: MonsterType,
  animName: string,
  frameIndex: number,
): FrameHitbox => {
  const cfg = MONSTER_HITBOXES[type];
  if (!cfg) return FALLBACK;
  return cfg.perFrame?.[animName]?.[frameIndex] ?? cfg.default;
};

/**
 * "feet" — bottom-center is the stable anchor (good for ground walkers).
 * "center" — geometric center is the stable anchor (good for floating monsters).
 */
export type AnchorType = "feet" | "center";

type MonsterLike = {
  x: number;
  y: number;
  width: number;
  height: number;
  [key: string]: unknown;
};

/**
 * Mutates monster.x, y, width, height to match the hitbox while keeping the
 * natural anchor stable across calls. Previous offsets are tracked on the
 * monster (`_hitboxOffsetX/Y`) so subsequent applications don't drift.
 */
export const applyHitboxToMonster = (
  monster: MonsterLike,
  hitbox: FrameHitbox,
  anchor: AnchorType = "feet",
): void => {
  const offsetX = hitbox.offsetX ?? 0;
  const offsetY = hitbox.offsetY ?? 0;
  const prevOffsetX = (monster._hitboxOffsetX as number | undefined) ?? 0;
  const prevOffsetY = (monster._hitboxOffsetY as number | undefined) ?? 0;

  const prevCenterX = monster.x + monster.width / 2;
  const naturalAnchorX = prevCenterX - prevOffsetX;

  let naturalAnchorY: number;
  if (anchor === "feet") {
    naturalAnchorY = monster.y + monster.height - prevOffsetY;
  } else {
    naturalAnchorY = monster.y + monster.height / 2 - prevOffsetY;
  }

  monster.width = hitbox.width;
  monster.height = hitbox.height;
  monster.x = naturalAnchorX + offsetX - hitbox.width / 2;
  if (anchor === "feet") {
    monster.y = naturalAnchorY + offsetY - hitbox.height;
  } else {
    monster.y = naturalAnchorY + offsetY - hitbox.height / 2;
  }
  monster._hitboxOffsetX = offsetX;
  monster._hitboxOffsetY = offsetY;
  monster._hitboxRotation = hitbox.rotation ?? 0;
};

/**
 * Recover the natural anchor position (the stable reference point in screen
 * space) for sprite drawing, regardless of any per-frame hitbox shifts.
 */
export const getNaturalAnchor = (
  monster: MonsterLike,
  anchor: AnchorType,
): { x: number; y: number } => {
  const prevOffsetX = (monster._hitboxOffsetX as number | undefined) ?? 0;
  const prevOffsetY = (monster._hitboxOffsetY as number | undefined) ?? 0;
  const x = monster.x + monster.width / 2 - prevOffsetX;
  const y =
    anchor === "feet"
      ? monster.y + monster.height - prevOffsetY
      : monster.y + monster.height / 2 - prevOffsetY;
  return { x, y };
};
