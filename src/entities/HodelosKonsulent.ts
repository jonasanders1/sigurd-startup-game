import { loadFrameRange } from "../lib/spriteFrames";

const base = "sprites/hodeløs-konsulent";

const idleFront = loadFrameRange(`${base}/idle`, "idle-front", 0, 5);
const idleLeft = loadFrameRange(`${base}/idle`, "idle-left", 6, 11);
const idleRight = loadFrameRange(`${base}/idle`, "idle-right", 12, 17);

// No walk-front frames in hodeløs-konsulent (only side facings)
const walkLeft = loadFrameRange(`${base}/walk`, "walk-left", 0, 7);
const walkRight = loadFrameRange(`${base}/walk`, "walk-right", 8, 15);

const freezeFront = loadFrameRange(`${base}/freeze`, "freeze-front", 0, 4);
const freezeLeft = loadFrameRange(`${base}/freeze`, "freeze-left", 5, 9);
const freezeRight = loadFrameRange(`${base}/freeze`, "freeze-right", 10, 14);

const deathFront = loadFrameRange(`${base}/death`, "death-front", 0, 9);
const deathLeft = loadFrameRange(`${base}/death`, "death-left", 10, 19);
const deathRight = loadFrameRange(`${base}/death`, "death-right", 20, 29);

type AnimKey =
  | "idle-front"
  | "idle-left"
  | "idle-right"
  | "walk-left"
  | "walk-right"
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
  "idle-front": { frames: idleFront, frameDuration: 150, loop: true },
  "idle-left": { frames: idleLeft, frameDuration: 150, loop: true },
  "idle-right": { frames: idleRight, frameDuration: 150, loop: true },
  "walk-left": { frames: walkLeft, frameDuration: 100, loop: true },
  "walk-right": { frames: walkRight, frameDuration: 100, loop: true },
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

export const dirNameHodelos = (d: number): "front" | "left" | "right" =>
  d < 0 ? "left" : d > 0 ? "right" : "front";

export class HodelosKonsulentSprite {
  private currentAnim: AnimKey = "walk-right";
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

    // Same canvas convention as the other monsters: 64×64 with ~20×20 character.
    // Floater drifts in air — center-anchored.
    const SCALE = 1.2;
    const canvasRatio = 64 / 20;
    const drawW = width * SCALE * canvasRatio;
    const drawH = height * SCALE * canvasRatio;
    const drawX = x + width / 2 - drawW / 2;
    const drawY = y + height / 2 - drawH / 2;

    ctx.drawImage(img, drawX, drawY, drawW, drawH);
  }
}
