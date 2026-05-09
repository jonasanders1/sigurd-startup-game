/**
 * Monster bounds + lethal hitbox registry.
 *
 * Two boxes per monster, both owned by the entity file under src/entities/:
 *
 *   - <TYPE>_BOUNDS: physics envelope used for wall/platform/floor collision.
 *     Larger; the visible sprite is anchored to it.
 *   - <TYPE>_HITBOX: smaller lethal/interaction rect. Player-vs-monster damage
 *     reads this; everything else reads bounds.
 *
 * This file just assembles the per-entity exports into lookups keyed by
 * MonsterType, and exposes geometry helpers (collision tests, anchor
 * tracking) used across the codebase.
 */

import { MonsterType } from "../types/enums";
import { resolveHitboxRect, type LethalHitbox } from "./entities";
import { BUREAUCRAT_BOUNDS, BUREAUCRAT_HITBOX } from "../entities/Bureaucrat";
import { TAXGHOST_BOUNDS, TAXGHOST_HITBOX } from "../entities/TaxGhostSprite";
import {
  WISP_BOUNDS,
  WISP_HITBOX,
  FOUNDER_BOUNDS,
  FOUNDER_HITBOX,
  ROBOT_BOUNDS,
  ROBOT_HITBOX,
  CONSULTANT_BOUNDS,
  CONSULTANT_HITBOX,
} from "../entities/FloaterSprite";

export type FrameBounds = {
  width: number;
  height: number;
  /** Horizontal shift from natural anchor. Default 0. */
  offsetX?: number;
  /** Vertical shift from natural anchor. Negative lifts the box. Default 0. */
  offsetY?: number;
  /** Rotation in degrees around the bounds center. Rect shapes only. Default 0. */
  rotation?: number;
};

export type MonsterBoundsConfig = {
  /** Collision shape. "ellipse" treats width/height as axes (set equal for a circle). Default "rect". */
  shape?: "rect" | "ellipse";
  /** Default bounds applied when no per-frame override matches. */
  default: FrameBounds;
  /** Optional per-animation, per-frame bounds overrides. */
  perFrame?: Record<string, Record<number, FrameBounds>>;
};

export const MONSTER_BOUNDS: Record<MonsterType, MonsterBoundsConfig> = {
  [MonsterType.BUREAUCRAT]: BUREAUCRAT_BOUNDS,
  [MonsterType.WISP]: WISP_BOUNDS,
  [MonsterType.TAXGHOST]: TAXGHOST_BOUNDS,
  [MonsterType.FOUNDER]: FOUNDER_BOUNDS,
  [MonsterType.CONSULTANT]: CONSULTANT_BOUNDS,
  [MonsterType.ROBOT]: ROBOT_BOUNDS,
};

export const MONSTER_HITBOXES: Record<MonsterType, LethalHitbox> = {
  [MonsterType.BUREAUCRAT]: BUREAUCRAT_HITBOX,
  [MonsterType.WISP]: WISP_HITBOX,
  [MonsterType.TAXGHOST]: TAXGHOST_HITBOX,
  [MonsterType.FOUNDER]: FOUNDER_HITBOX,
  [MonsterType.CONSULTANT]: CONSULTANT_HITBOX,
  [MonsterType.ROBOT]: ROBOT_HITBOX,
};

const FALLBACK_BOUNDS: FrameBounds = { width: 25, height: 25 };
const FALLBACK_HITBOX: LethalHitbox = { width: 25, height: 25 };

// monster.type is a string-literal union with the same values as the enum but
// TS treats them as distinct; relax the param type to avoid casts at every
// call site without losing runtime safety (lookup falls back).
type MonsterTypeKey = MonsterType | string;

export const getDefaultBounds = (type: MonsterTypeKey): FrameBounds =>
  MONSTER_BOUNDS[type as MonsterType]?.default ?? FALLBACK_BOUNDS;

export const getMonsterShape = (type: MonsterTypeKey): "rect" | "ellipse" =>
  MONSTER_BOUNDS[type as MonsterType]?.shape ?? "rect";

export const getBoundsForFrame = (
  type: MonsterTypeKey,
  animName: string,
  frameIndex: number,
): FrameBounds => {
  const cfg = MONSTER_BOUNDS[type as MonsterType];
  if (!cfg) return FALLBACK_BOUNDS;
  return cfg.perFrame?.[animName]?.[frameIndex] ?? cfg.default;
};

/** Resolve a monster's lethal hitbox to an absolute world-space rect. */
export const getMonsterHitboxRect = (
  monster: MonsterLike,
  type: MonsterTypeKey,
): { x: number; y: number; width: number; height: number } =>
  resolveHitboxRect(monster, MONSTER_HITBOXES[type as MonsterType] ?? FALLBACK_HITBOX);

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
  monster._boundsRotation ?? 0;

/**
 * Ellipse-vs-rect collision. The ellipse fills `ellipseBox` (rx = width/2,
 * ry = height/2). Works for circles too — set width === height.
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

  const tx = (rect.x - cx) / rx;
  const ty = (rect.y - cy) / ry;
  const tw = rect.width / rx;
  const th = rect.height / ry;

  const closestX = Math.max(tx, Math.min(0, tx + tw));
  const closestY = Math.max(ty, Math.min(0, ty + th));
  return closestX * closestX + closestY * closestY < 1;
};

/**
 * Ellipse-vs-ellipse collision (axis-aligned, Minkowski-sum approximation).
 * Treats the combined region as an ellipse with the sum of each side's
 * semi-axes — exact for circles, slightly forgiving at the corners for
 * non-uniform ovals (acceptable for gameplay collision).
 */
export const ellipseEllipseColliding = (
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
): boolean => {
  const dx = b.x + b.width / 2 - (a.x + a.width / 2);
  const dy = b.y + b.height / 2 - (a.y + a.height / 2);
  const rx = a.width / 2 + b.width / 2;
  const ry = a.height / 2 + b.height / 2;
  if (rx <= 0 || ry <= 0) return false;
  return (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) < 1;
};

/**
 * "feet" — bottom-center is the stable anchor (good for ground walkers).
 * "center" — geometric center is the stable anchor (good for floating monsters).
 */
export type AnchorType = "feet" | "center";

// Underscore-prefixed fields are written by applyBoundsToMonster and read
// back later. All optional so callers can pass a real Monster (which doesn't
// carry these by default but does after applyBoundsToMonster has run on it).
export type MonsterLike = {
  x: number;
  y: number;
  width: number;
  height: number;
  _boundsOffsetX?: number;
  _boundsOffsetY?: number;
  _boundsRotation?: number;
};

/**
 * Mutates monster.x, y, width, height to match the per-frame bounds while
 * keeping the natural anchor stable across calls. Previous offsets are
 * tracked on the monster (`_boundsOffsetX/Y`) so subsequent applications
 * don't drift.
 */
export const applyBoundsToMonster = (
  monster: MonsterLike,
  bounds: FrameBounds,
  anchor: AnchorType = "feet",
): void => {
  const offsetX = bounds.offsetX ?? 0;
  const offsetY = bounds.offsetY ?? 0;
  const prevOffsetX = monster._boundsOffsetX ?? 0;
  const prevOffsetY = monster._boundsOffsetY ?? 0;

  const prevCenterX = monster.x + monster.width / 2;
  const naturalAnchorX = prevCenterX - prevOffsetX;

  const naturalAnchorY =
    anchor === "feet"
      ? monster.y + monster.height - prevOffsetY
      : monster.y + monster.height / 2 - prevOffsetY;

  monster.width = bounds.width;
  monster.height = bounds.height;
  monster.x = naturalAnchorX + offsetX - bounds.width / 2;
  monster.y =
    anchor === "feet"
      ? naturalAnchorY + offsetY - bounds.height
      : naturalAnchorY + offsetY - bounds.height / 2;
  monster._boundsOffsetX = offsetX;
  monster._boundsOffsetY = offsetY;
  monster._boundsRotation = bounds.rotation ?? 0;
};

/**
 * Recover the natural anchor position (the stable reference point in screen
 * space) for sprite drawing, regardless of any per-frame bounds shifts.
 */
export const getNaturalAnchor = (
  monster: MonsterLike,
  anchor: AnchorType,
): { x: number; y: number } => {
  const prevOffsetX = monster._boundsOffsetX ?? 0;
  const prevOffsetY = monster._boundsOffsetY ?? 0;
  const x = monster.x + monster.width / 2 - prevOffsetX;
  const y =
    anchor === "feet"
      ? monster.y + monster.height - prevOffsetY
      : monster.y + monster.height / 2 - prevOffsetY;
  return { x, y };
};
