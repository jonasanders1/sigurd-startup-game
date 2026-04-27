import { loadSpriteImage } from "../config/assets";
import { loadFrameRange, pad2 } from "../lib/spriteFrames";

export type ByrakratVariant = "green" | "black";

type VariantFrames = ReturnType<typeof loadGreenFrames>;

const loadGreenFrames = () => {
  const base = `sprites/byråkrat/green`;
  return {
    walkLeft: loadFrameRange(`${base}/walk`, "walk-left", 0, 7),
    walkRight: loadFrameRange(`${base}/walk`, "walk-right", 8, 15),
    idleFront: loadFrameRange(`${base}/idle`, "idle-front", 0, 5),
    idleLeft: loadFrameRange(`${base}/idle`, "idle-left", 6, 11),
    idleRight: loadFrameRange(`${base}/idle`, "idle-right", 12, 17),
    freezeFront: loadFrameRange(`${base}/freeze`, "freeze-front", 0, 4),
    freezeLeft: loadFrameRange(`${base}/freeze`, "freeze-left", 5, 9),
    freezeRight: loadFrameRange(`${base}/freeze`, "freeze-right", 10, 14),
    deathFront: loadFrameRange(`${base}/death`, "death-front", 0, 9),
    deathLeft: loadFrameRange(`${base}/death`, "death-left", 10, 19),
    deathRight: loadFrameRange(`${base}/death`, "death-right", 20, 29),
  };
};

// Black variant has different frame counts and a couple of gaps in the walk
// numbering (walk-left skips _09; walk-front_08 absent — likely a labeling
// quirk). Death is 8 frames per direction instead of 10.
const loadBlackFrames = (): VariantFrames => {
  const base = `sprites/byråkrat/black`;
  return {
    walkLeft: [8, 10, 11, 12, 13, 14, 15].map((i) =>
      loadSpriteImage(`${base}/walk/walk-left_${pad2(i)}.png`)
    ),
    walkRight: loadFrameRange(`${base}/walk`, "walk-right", 16, 23),
    idleFront: loadFrameRange(`${base}/idle`, "idle-front", 0, 5),
    idleLeft: loadFrameRange(`${base}/idle`, "idle-left", 6, 11),
    idleRight: loadFrameRange(`${base}/idle`, "idle-right", 12, 17),
    freezeFront: loadFrameRange(`${base}/freeze`, "freeze-front", 0, 4),
    freezeLeft: loadFrameRange(`${base}/freeze`, "freeze-left", 5, 9),
    freezeRight: loadFrameRange(`${base}/freeze`, "freeze-right", 10, 14),
    deathFront: loadFrameRange(`${base}/death`, "death-front", 0, 7),
    deathLeft: loadFrameRange(`${base}/death`, "death-left", 8, 15),
    deathRight: loadFrameRange(`${base}/death`, "death-right", 16, 23),
  };
};

const variantFrames: Record<ByrakratVariant, VariantFrames> = {
  green: loadGreenFrames(),
  black: loadBlackFrames(),
};

type AnimKey =
  | "walk-left"
  | "walk-right"
  | "idle-front"
  | "idle-left"
  | "idle-right"
  | "freeze-still-front"
  | "freeze-still-left"
  | "freeze-still-right"
  | "freeze-blink-front"
  | "freeze-blink-left"
  | "freeze-blink-right"
  | "death-front"
  | "death-left"
  | "death-right";

const animMeta: Record<AnimKey, { frameDuration: number; loop: boolean }> = {
  "walk-left": { frameDuration: 100, loop: true },
  "walk-right": { frameDuration: 100, loop: true },
  "idle-front": { frameDuration: 180, loop: true },
  "idle-left": { frameDuration: 180, loop: true },
  "idle-right": { frameDuration: 180, loop: true },
  "freeze-still-front": { frameDuration: 1000, loop: true },
  "freeze-still-left": { frameDuration: 1000, loop: true },
  "freeze-still-right": { frameDuration: 1000, loop: true },
  "freeze-blink-front": { frameDuration: 100, loop: true },
  "freeze-blink-left": { frameDuration: 100, loop: true },
  "freeze-blink-right": { frameDuration: 100, loop: true },
  "death-front": { frameDuration: 80, loop: false },
  "death-left": { frameDuration: 80, loop: false },
  "death-right": { frameDuration: 80, loop: false },
};

// Hitbox config moved to src/config/monsterHitboxes.ts — tune dims + offsets there.

export const dirName = (d: number): "front" | "left" | "right" =>
  d < 0 ? "left" : d > 0 ? "right" : "front";

export class ByrakratSprite {
  private variant: ByrakratVariant;
  private currentAnim: AnimKey = "walk-right";
  private frameIndex = 0;
  private timer = 0;

  constructor(variant: ByrakratVariant) {
    this.variant = variant;
  }

  private framesFor(anim: AnimKey): HTMLImageElement[] {
    const v = variantFrames[this.variant];
    switch (anim) {
      case "walk-left":
        return v.walkLeft;
      case "walk-right":
        return v.walkRight;
      case "idle-front":
        return v.idleFront;
      case "idle-left":
        return v.idleLeft;
      case "idle-right":
        return v.idleRight;
      case "freeze-still-front":
        return [v.freezeFront[1]]; // freeze-front_01
      case "freeze-still-left":
        return [v.freezeLeft[1]]; // freeze-left_06
      case "freeze-still-right":
        return [v.freezeRight[1]]; // freeze-right_11
      case "freeze-blink-front":
        return v.freezeFront;
      case "freeze-blink-left":
        return v.freezeLeft;
      case "freeze-blink-right":
        return v.freezeRight;
      case "death-front":
        return v.deathFront;
      case "death-left":
        return v.deathLeft;
      case "death-right":
        return v.deathRight;
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

  isDeathAnimComplete(): boolean {
    if (!this.currentAnim.startsWith("death")) return false;
    return this.frameIndex >= this.framesFor(this.currentAnim).length - 1;
  }

  draw(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number
  ): void {
    const frames = this.framesFor(this.currentAnim);
    const img = frames[this.frameIndex];
    if (!img.complete || img.naturalWidth === 0) return;

    // SCALE is how big the character appears relative to the hitbox. All
    // sprites are 64×64 canvas with ~20×20 character centered; feet sit at
    // ~65.6% from canvas top.
    const SCALE = 1.2;
    const canvasRatio = 64 / 20;
    const feetRatio = 42 / 64;
    const drawW = width * SCALE * canvasRatio;
    const drawH = height * SCALE * canvasRatio;
    const drawX = x + width / 2 - drawW / 2;
    const drawY = y + height - drawH * feetRatio;

    ctx.drawImage(img, drawX, drawY, drawW, drawH);
  }
}
