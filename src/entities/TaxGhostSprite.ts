import { loadFrameRange } from "../lib/spriteFrames";
import type { LethalHitbox } from "../config/entities";
import type { MonsterBoundsConfig } from "../config/monsterBounds";

const BASE = "spritesV2/TaxGhost";
const PREFIX = "TaxGhost";

/** TAXGHOST physics envelope — center-anchored. */
export const TAXGHOST_BOUNDS: MonsterBoundsConfig = {
  shape: "rect",
  default: { width: 38, height: 36 },
};

/** TAXGHOST lethal hitbox — smaller than bounds, centered. */
export const TAXGHOST_HITBOX: LethalHitbox = {
  width: 28,
  height: 28,
};

/** TAXGHOST sprite display size in screen pixels — independent of bounds. */
export const TAXGHOST_SPRITE_CELL = 88;

const frames = {
  floatLeft: loadFrameRange(`${BASE}/float-left`, PREFIX, 0, 5),
  floatRight: loadFrameRange(`${BASE}/float-right`, PREFIX, 6, 11),
  chargeLeft: loadFrameRange(`${BASE}/charge-left`, PREFIX, 12, 16),
  chargeRight: loadFrameRange(`${BASE}/charge-right`, PREFIX, 17, 21),
};

type AnimKey = "float-left" | "float-right" | "charge-left" | "charge-right";

const animMeta: Record<AnimKey, { frameDuration: number; loop: boolean }> = {
  "float-left": { frameDuration: 140, loop: true },
  "float-right": { frameDuration: 140, loop: true },
  "charge-left": { frameDuration: 80, loop: true },
  "charge-right": { frameDuration: 80, loop: true },
};

export class TaxGhostSprite {
  private currentAnim: AnimKey = "float-right";
  private frameIndex = 0;
  private timer = 0;

  private framesFor(anim: AnimKey): HTMLImageElement[] {
    switch (anim) {
      case "float-left":
        return frames.floatLeft;
      case "float-right":
        return frames.floatRight;
      case "charge-left":
        return frames.chargeLeft;
      case "charge-right":
        return frames.chargeRight;
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
    const seq = this.framesFor(this.currentAnim);
    this.timer += dt;
    if (this.timer > meta.frameDuration) {
      this.timer = 0;
      this.frameIndex++;
      if (this.frameIndex >= seq.length) {
        this.frameIndex = meta.loop ? 0 : seq.length - 1;
      }
    }
  }

  /** Center-anchored draw: pass the world position where the bounds center is. */
  draw(ctx: CanvasRenderingContext2D, centerX: number, centerY: number): void {
    const seq = this.framesFor(this.currentAnim);
    const img = seq[this.frameIndex];
    if (!img.complete || img.naturalWidth === 0) return;

    const cell = TAXGHOST_SPRITE_CELL;
    const drawX = centerX - cell / 2;
    const drawY = centerY - cell / 2;

    ctx.drawImage(img, drawX, drawY, cell, cell);
  }
}
