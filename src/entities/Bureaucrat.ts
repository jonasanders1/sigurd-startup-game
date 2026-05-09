import { loadFrameRange } from "../lib/spriteFrames";
import type { LethalHitbox } from "../config/entities";
import type { MonsterBoundsConfig } from "../config/monsterBounds";

const BASE = "spritesV2/Bureaucrat";
const PREFIX = "Bureaucrat";

/** Bureaucrat physics envelope — feet-anchored at runtime via applyBoundsToMonster. */
export const BUREAUCRAT_BOUNDS: MonsterBoundsConfig = {
  shape: "rect",
  default: { width: 25, height: 39 },
};

/** Bureaucrat lethal hitbox — smaller than bounds, centered. */
export const BUREAUCRAT_HITBOX: LethalHitbox = {
  width: 18,
  height: 32,
};

/**
 * Bureaucrat sprite display size in screen pixels. Independent of bounds/hitbox —
 * tune visual scale here without touching collision.
 */
export const BUREAUCRAT_SPRITE_CELL = 88;
/** Where the character's feet sit within the 64×64 source cell (0-1). */
const FEET_RATIO = 50 / 64;

const frames = {
  walkLeft: loadFrameRange(`${BASE}/walk-left`, PREFIX, 0, 5),
  walkRight: loadFrameRange(`${BASE}/walk-right`, PREFIX, 6, 11),
  fallLeft: loadFrameRange(`${BASE}/fall-left`, PREFIX, 12, 14),
  fallRight: loadFrameRange(`${BASE}/fall-right`, PREFIX, 15, 17),
  transitionLeft: loadFrameRange(`${BASE}/transition-left`, PREFIX, 18, 25),
  transitionRight: loadFrameRange(`${BASE}/transition-right`, PREFIX, 26, 33),
};

type Frame = HTMLImageElement;

type AnimKey =
  | "walk-left"
  | "walk-right"
  | "idle-front"
  | "idle-left"
  | "idle-right"
  | "fall-front"
  | "fall-left"
  | "fall-right"
  | "transition-front"
  | "transition-left"
  | "transition-right";

const animMeta: Record<AnimKey, { frameDuration: number; loop: boolean }> = {
  "walk-left": { frameDuration: 100, loop: true },
  "walk-right": { frameDuration: 100, loop: true },
  "idle-front": { frameDuration: 180, loop: true },
  "idle-left": { frameDuration: 180, loop: true },
  "idle-right": { frameDuration: 180, loop: true },
  "fall-front": { frameDuration: 120, loop: true },
  "fall-left": { frameDuration: 120, loop: true },
  "fall-right": { frameDuration: 120, loop: true },
  "transition-front": { frameDuration: 70, loop: false },
  "transition-left": { frameDuration: 70, loop: false },
  "transition-right": { frameDuration: 70, loop: false },
};

/** Total ms a transition animation plays from frame 0 to last frame. */
export const BYRAKRAT_TRANSITION_DURATION_MS =
  frames.transitionRight.length * animMeta["transition-right"].frameDuration;

export const dirName = (d: number): "front" | "left" | "right" =>
  d < 0 ? "left" : d > 0 ? "right" : "front";

export class BureaucratSprite {
  private currentAnim: AnimKey = "walk-right";
  private frameIndex = 0;
  private timer = 0;

  private framesFor(anim: AnimKey): Frame[] {
    switch (anim) {
      case "walk-left":
        return frames.walkLeft;
      case "walk-right":
        return frames.walkRight;
      // No dedicated idle in this sheet — fall back to first walk frame.
      // Front-facing aliases to right.
      case "idle-front":
      case "idle-right":
        return [frames.walkRight[0]];
      case "idle-left":
        return [frames.walkLeft[0]];
      case "fall-front":
      case "fall-right":
        return frames.fallRight;
      case "fall-left":
        return frames.fallLeft;
      case "transition-front":
      case "transition-right":
        return frames.transitionRight;
      case "transition-left":
        return frames.transitionLeft;
    }
  }

  setAnimation(name: AnimKey): void {
    if (this.currentAnim === name) return;
    this.currentAnim = name;
    this.frameIndex = 0;
    this.timer = 0;
  }

  update(dt: number): void {
    const meta = animMeta[this.currentAnim];
    const frames = this.framesFor(this.currentAnim);
    this.timer += dt;
    if (this.timer > meta.frameDuration) {
      this.timer = 0;
      this.frameIndex++;
      if (this.frameIndex >= frames.length) {
        this.frameIndex = meta.loop ? 0 : frames.length - 1;
      }
    }
  }

  getAnimation(): string {
    return this.currentAnim;
  }

  getFrame(): number {
    return this.frameIndex;
  }

  isTransitionAnimComplete(): boolean {
    if (!this.currentAnim.startsWith("transition")) return false;
    return this.frameIndex >= this.framesFor(this.currentAnim).length - 1;
  }

  /** Feet-anchored draw: pass the world position where the character's feet
   *  should land. Sprite display size is fixed (BUREAUCRAT_SPRITE_CELL); bounds
   *  and hitbox don't affect visual scale. */
  draw(ctx: CanvasRenderingContext2D, feetX: number, feetY: number): void {
    const frames = this.framesFor(this.currentAnim);
    const img = frames[this.frameIndex];
    if (!img.complete || img.naturalWidth === 0) return;

    const cell = BUREAUCRAT_SPRITE_CELL;
    const drawX = feetX - cell / 2;
    const drawY = feetY - cell * FEET_RATIO;
    ctx.drawImage(img, drawX, drawY, cell, cell);
  }
}
