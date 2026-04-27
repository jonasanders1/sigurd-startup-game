import { loadFrameRange } from "../lib/spriteFrames";

const base = "sprites/vertikal-byråkrat";

const walkFrames = loadFrameRange(`${base}/walk`, "walk-front", 0, 5);
const idleFrames = loadFrameRange(`${base}/idle`, "idle-front", 0, 5);
const freezeFrames = loadFrameRange(`${base}/freeze`, "freeze-front", 0, 4);
const deathFrames = loadFrameRange(`${base}/death`, "death-front", 0, 9);

type AnimKey = "walk" | "idle" | "freeze-still" | "freeze-blink" | "death";

const animMeta: Record<
  AnimKey,
  { frames: HTMLImageElement[]; frameDuration: number; loop: boolean }
> = {
  walk: { frames: walkFrames, frameDuration: 100, loop: true },
  idle: { frames: idleFrames, frameDuration: 180, loop: true },
  "freeze-still": {
    frames: [freezeFrames[1]],
    frameDuration: 1000,
    loop: true,
  },
  "freeze-blink": { frames: freezeFrames, frameDuration: 100, loop: true },
  death: { frames: deathFrames, frameDuration: 80, loop: false },
};

export class VertikalByrakratSprite {
  private currentAnim: AnimKey = "walk";
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
    if (this.currentAnim !== "death") return false;
    return this.frameIndex >= animMeta.death.frames.length - 1;
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

    // Sprites are 64×64 canvas with ~20×20 character centered; feet at ~65.6%
    // from canvas top. SCALE controls character size relative to hitbox.
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
