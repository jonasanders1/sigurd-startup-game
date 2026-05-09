import { loadFrameRange } from "../lib/spriteFrames";
import type { LethalHitbox } from "../config/entities";
import type { MonsterBoundsConfig } from "../config/monsterBounds";

// Floater bounds + hitboxes — one per monster so each can be tuned
// independently. Bounds = physics envelope; hitbox = smaller lethal rect.

/** WISP (Wisp) physics envelope — center-anchored. */
export const WISP_BOUNDS: MonsterBoundsConfig = {
  shape: "rect",
  default: { width: 30, height: 52 },
};
/** WISP lethal hitbox — smaller than bounds. */
export const WISP_HITBOX: LethalHitbox = { width: 22, height: 42 };

/** FOUNDER (Founder) physics envelope — center-anchored. */
export const FOUNDER_BOUNDS: MonsterBoundsConfig = {
  shape: "rect",
  default: { width: 30, height: 40 },
};
export const FOUNDER_HITBOX: LethalHitbox = { width: 22, height: 32 };

/** ROBOT (Robot) physics envelope — center-anchored. */
export const ROBOT_BOUNDS: MonsterBoundsConfig = {
  shape: "rect",
  default: { width: 30, height: 40 },
};
export const ROBOT_HITBOX: LethalHitbox = { width: 22, height: 32 };

/** CONSULTANT (Consultant) physics envelope — center-anchored. */
export const CONSULTANT_BOUNDS: MonsterBoundsConfig = {
  shape: "rect",
  default: { width: 30, height: 30 },
};
export const CONSULTANT_HITBOX: LethalHitbox = { width: 22, height: 24 };

export type FloaterAnim =
  | "float-left"
  | "float-right"
  | "bump-horizontal-left"
  | "bump-horizontal-right"
  | "bump-vertical-left"
  | "bump-vertical-right";

export interface FloaterFrameRange {
  start: number;
  end: number;
}

export interface FloaterOptions {
  /**
   * Sprite display size in screen pixels. Independent of bounds/hitbox —
   * tune visual scale here without touching collision. Default 96.
   */
  spriteCell?: number;
  /**
   * Per-monster sprite pivot offset in source pixels (0-63 across the 64×64
   * cell). Negative shifts the drawn sprite up / left relative to the bounds
   * center; positive shifts down / right. Use to compensate when the
   * character isn't centered in its source cell. Default 0.
   */
  spriteOffsetX?: number;
  spriteOffsetY?: number;
}

/**
 * Six-animation airborne sprite shared by Wisp, Founder, Robot and Consultant.
 * - `float-{l,r}`: looping idle/move pose.
 * - `bump-horizontal-{l,r}`, `bump-vertical-{l,r}`: one-shot bump reaction.
 *
 * Construct one per monster type with the folder name + Bureaucrat-style
 * `{Prefix}_NN.png` ranges for each animation.
 */
export class FloaterSprite {
  private currentAnim: FloaterAnim = "float-right";
  private frameIndex = 0;
  private timer = 0;
  private readonly frames: Record<FloaterAnim, HTMLImageElement[]>;
  private readonly spriteCell: number;
  private readonly spriteOffsetX: number;
  private readonly spriteOffsetY: number;

  constructor(
    folder: string,
    prefix: string,
    ranges: Record<FloaterAnim, FloaterFrameRange>,
    options: FloaterOptions = {},
  ) {
    const base = `spritesV2/${folder}`;
    const load = (sub: string, range: FloaterFrameRange) =>
      loadFrameRange(`${base}/${sub}`, prefix, range.start, range.end);
    this.frames = {
      "float-left": load("float-left", ranges["float-left"]),
      "float-right": load("float-right", ranges["float-right"]),
      "bump-horizontal-left": load(
        "bump-horizontal-left",
        ranges["bump-horizontal-left"],
      ),
      "bump-horizontal-right": load(
        "bump-horizontal-right",
        ranges["bump-horizontal-right"],
      ),
      "bump-vertical-left": load(
        "bump-vertical-left",
        ranges["bump-vertical-left"],
      ),
      "bump-vertical-right": load(
        "bump-vertical-right",
        ranges["bump-vertical-right"],
      ),
    };
    this.spriteCell = options.spriteCell ?? 96;
    this.spriteOffsetX = options.spriteOffsetX ?? 0;
    this.spriteOffsetY = options.spriteOffsetY ?? 0;
  }

  setAnimation(name: FloaterAnim): void {
    if (this.currentAnim === name) return;
    this.currentAnim = name;
    this.frameIndex = 0;
    this.timer = 0;
  }

  /** True once the current bump animation has reached its last frame. */
  isBumpComplete(): boolean {
    if (!this.currentAnim.startsWith("bump-")) return false;
    return this.frameIndex >= this.frames[this.currentAnim].length - 1;
  }

  update(dt: number): void {
    const isBump = this.currentAnim.startsWith("bump-");
    const meta = isBump
      ? { frameDuration: 70, loop: false }
      : { frameDuration: 140, loop: true };
    const seq = this.frames[this.currentAnim];
    this.timer += dt;
    if (this.timer > meta.frameDuration) {
      this.timer = 0;
      this.frameIndex++;
      if (this.frameIndex >= seq.length) {
        this.frameIndex = meta.loop ? 0 : seq.length - 1;
      }
    }
  }

  /** Center-anchored draw: pass the world position where the bounds center
   *  is (typically the monster's center). Sprite display size is fixed
   *  (spriteCell); bounds and hitbox don't affect visual scale. */
  draw(ctx: CanvasRenderingContext2D, centerX: number, centerY: number): void {
    const seq = this.frames[this.currentAnim];
    const img = seq[this.frameIndex];
    if (!img.complete || img.naturalWidth === 0) return;

    const cell = this.spriteCell;
    const sourceToScreen = cell / 64;
    const drawX = centerX - cell / 2 - this.spriteOffsetX * sourceToScreen;
    const drawY = centerY - cell / 2 - this.spriteOffsetY * sourceToScreen;
    ctx.drawImage(img, drawX, drawY, cell, cell);
  }
}

/** Default cell size for the floaters that share Sigurd/Bureaucrat's display
 *  scale. Consultant (Consultant) opts out and stays at the FloaterSprite
 *  default — see createConsultantSprite. */
const FLOATER_SPRITE_CELL = 88;

/** Factory presets matching the file layout in src/assets/spritesV2/. */
export const createWispSprite = (): FloaterSprite =>
  new FloaterSprite(
    "Wisp",
    "Wisp",
    {
      "float-left": { start: 0, end: 5 },
      "float-right": { start: 6, end: 11 },
      "bump-horizontal-left": { start: 12, end: 14 },
      "bump-horizontal-right": { start: 15, end: 17 },
      "bump-vertical-left": { start: 18, end: 20 },
      "bump-vertical-right": { start: 21, end: 23 },
    },
    { spriteCell: FLOATER_SPRITE_CELL },
  );

export const createFounderSprite = (): FloaterSprite =>
  new FloaterSprite(
    "Founder",
    "Founder",
    {
      "float-left": { start: 0, end: 5 },
      "float-right": { start: 6, end: 11 },
      "bump-horizontal-left": { start: 12, end: 14 },
      "bump-horizontal-right": { start: 15, end: 17 },
      "bump-vertical-left": { start: 18, end: 20 },
      "bump-vertical-right": { start: 21, end: 23 },
    },
    { spriteCell: FLOATER_SPRITE_CELL },
  );

export const createRobotSprite = (): FloaterSprite =>
  new FloaterSprite(
    "Robot",
    "Robot",
    {
      "float-left": { start: 0, end: 5 },
      "float-right": { start: 6, end: 11 },
      "bump-horizontal-left": { start: 12, end: 15 },
      "bump-horizontal-right": { start: 16, end: 19 },
      "bump-vertical-left": { start: 20, end: 23 },
      "bump-vertical-right": { start: 24, end: 27 },
    },
    { spriteCell: FLOATER_SPRITE_CELL },
  );

export const createConsultantSprite = (): FloaterSprite =>
  new FloaterSprite(
    "Consultant",
    "Consultant",
    {
      // Consultant numbering: float-right starts at 00, then float-left at 05.
      "float-right": { start: 0, end: 4 },
      "float-left": { start: 5, end: 9 },
      "bump-horizontal-right": { start: 10, end: 13 },
      "bump-horizontal-left": { start: 14, end: 17 },
      "bump-vertical-right": { start: 18, end: 21 },
      "bump-vertical-left": { start: 22, end: 25 },
    },
    // Consultant character sits below the cell center; lift partially so
    // it lands roughly on the bounds center.
    { spriteOffsetY: 8 },
  );
