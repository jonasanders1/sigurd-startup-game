import { loadFrameRange } from "../lib/spriteFrames";

const base = "sprites/regel-roboten";

const idleFront = loadFrameRange(`${base}/idle`, "idle-front", 0, 4);
const idleLeft = loadFrameRange(`${base}/idle`, "idle-left", 5, 7);
const idleRight = loadFrameRange(`${base}/idle`, "idle-right", 8, 11);

const runFront = loadFrameRange(`${base}/run`, "run-front", 0, 2);
const runLeft = loadFrameRange(`${base}/run`, "run-left", 6, 8);
const runRight = loadFrameRange(`${base}/run`, "run-right", 12, 14);

const attackFront = loadFrameRange(`${base}/attack`, "attack-front", 3, 5);
const attackLeft = loadFrameRange(`${base}/attack`, "attack-left", 9, 11);
const attackRight = loadFrameRange(`${base}/attack`, "attack-right", 15, 17);

const freezeFront = loadFrameRange(`${base}/freeze`, "freeze-front", 0, 3);
const freezeLeft = loadFrameRange(`${base}/freeze`, "freeze-left", 4, 7);
const freezeRight = loadFrameRange(`${base}/freeze`, "freeze-right", 8, 11);

const deathFront = loadFrameRange(`${base}/death`, "death-front", 0, 7);
const deathLeft = loadFrameRange(`${base}/death`, "death-left", 8, 15);
const deathRight = loadFrameRange(`${base}/death`, "death-right", 16, 23);

type AnimKey =
  | "idle-front"
  | "idle-left"
  | "idle-right"
  | "run-front"
  | "run-left"
  | "run-right"
  | "attack-front"
  | "attack-left"
  | "attack-right"
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
  "run-front": { frames: runFront, frameDuration: 100, loop: true },
  "run-left": { frames: runLeft, frameDuration: 100, loop: true },
  "run-right": { frames: runRight, frameDuration: 100, loop: true },
  "attack-front": { frames: attackFront, frameDuration: 80, loop: true },
  "attack-left": { frames: attackLeft, frameDuration: 80, loop: true },
  "attack-right": { frames: attackRight, frameDuration: 80, loop: true },
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

export const dirNameRegel = (d: number): "front" | "left" | "right" =>
  d < 0 ? "left" : d > 0 ? "right" : "front";

export class RegelRobotenSprite {
  private currentAnim: AnimKey = "idle-front";
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

  getAnimation(): string {
    return this.currentAnim;
  }

  getFrame(): number {
    return this.frameIndex;
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
    const SCALE = 1.2;
    const canvasRatio = 64 / 20;
    const drawW = width * SCALE * canvasRatio;
    const drawH = height * SCALE * canvasRatio;
    const drawX = x + width / 2 - drawW / 2;
    const drawY = y + height / 2 - drawH / 2;

    ctx.drawImage(img, drawX, drawY, drawW, drawH);
  }
}
