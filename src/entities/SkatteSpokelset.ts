import { loadFrameRange } from "../lib/spriteFrames";

const base = "sprites/skatte-spøkelset";

const idleFront = loadFrameRange(`${base}/idle`, "idle-front", 0, 5);
const idleLeft = loadFrameRange(`${base}/idle`, "idle-left", 6, 10);
const idleRight = loadFrameRange(`${base}/idle`, "idle-right", 11, 16);

const walkFront = loadFrameRange(`${base}/walk`, "walk-front", 0, 7);
const walkLeft = loadFrameRange(`${base}/walk`, "walk-left", 8, 15);
const walkRight = loadFrameRange(`${base}/walk`, "walk-right", 16, 23);

const freezeFront = loadFrameRange(`${base}/freeze`, "freeze-front", 0, 4);
const freezeLeft = loadFrameRange(`${base}/freeze`, "freeze-left", 5, 9);
const freezeRight = loadFrameRange(`${base}/freeze`, "freeze-right", 10, 14);

const deathFront = loadFrameRange(`${base}/death`, "death-front", 0, 7);
const deathLeft = loadFrameRange(`${base}/death`, "death-left", 8, 15);
const deathRight = loadFrameRange(`${base}/death`, "death-right", 16, 23);

type AnimKey =
  | "walk-front"
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

const animMeta: Record<
  AnimKey,
  { frames: HTMLImageElement[]; frameDuration: number; loop: boolean }
> = {
  "walk-front": { frames: walkFront, frameDuration: 100, loop: true },
  "walk-left": { frames: walkLeft, frameDuration: 100, loop: true },
  "walk-right": { frames: walkRight, frameDuration: 100, loop: true },
  "idle-front": { frames: idleFront, frameDuration: 90, loop: true },
  "idle-left": { frames: idleLeft, frameDuration: 90, loop: true },
  "idle-right": { frames: idleRight, frameDuration: 90, loop: true },
  "freeze-still-front": {
    frames: [freezeFront[1]],
    frameDuration: 1000,
    loop: true,
  },
  "freeze-still-left": {
    frames: [freezeLeft[1]],
    frameDuration: 1000,
    loop: true,
  },
  "freeze-still-right": {
    frames: [freezeRight[1]],
    frameDuration: 1000,
    loop: true,
  },
  "freeze-blink-front": { frames: freezeFront, frameDuration: 100, loop: true },
  "freeze-blink-left": { frames: freezeLeft, frameDuration: 100, loop: true },
  "freeze-blink-right": { frames: freezeRight, frameDuration: 100, loop: true },
  "death-front": { frames: deathFront, frameDuration: 80, loop: false },
  "death-left": { frames: deathLeft, frameDuration: 80, loop: false },
  "death-right": { frames: deathRight, frameDuration: 80, loop: false },
};

export const dirNameSkatte = (d: number): "front" | "left" | "right" =>
  d < 0 ? "left" : d > 0 ? "right" : "front";

export class SkatteSpokelsetSprite {
  private currentAnim: AnimKey = "walk-front";
  private frameIndex = 0;
  private timer = 0;

  setAnimation(name: AnimKey): void {
    if (this.currentAnim === name) return;
    this.currentAnim = name;
    this.frameIndex = 0;
    this.timer = 0;
  }

  update(dt: number): void {
    const meta = animMeta[this.currentAnim];
    this.timer += dt;
    if (this.timer > meta.frameDuration) {
      this.timer = 0;
      this.frameIndex++;
      if (this.frameIndex >= meta.frames.length) {
        this.frameIndex = meta.loop ? 0 : meta.frames.length - 1;
      }
    }
  }

  isDeathAnimComplete(): boolean {
    if (!this.currentAnim.startsWith("death")) return false;
    return this.frameIndex >= animMeta[this.currentAnim].frames.length - 1;
  }

  draw(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number
  ): void {
    const frames = animMeta[this.currentAnim].frames;
    const img = frames[this.frameIndex];
    if (!img.complete || img.naturalWidth === 0) return;

    // Same canvas convention as the others: 64×64 with ~20×20 character centered.
    // Chaser is a ghost — center-anchored (no fixed feet position).
    const SCALE = 1.2;
    const canvasRatio = 64 / 20;
    const drawW = width * SCALE * canvasRatio;
    const drawH = height * SCALE * canvasRatio;
    const drawX = x + width / 2 - drawW / 2;
    const drawY = y + height / 2 - drawH / 2;

    ctx.drawImage(img, drawX, drawY, drawW, drawH);
  }
}
