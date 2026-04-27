import { GAME_CONFIG } from "../types/constants";
type Animation = {
  name: string;
  frames: HTMLImageElement[];
  frameDuration: number; // ms per frame
  loop: boolean;
};

export class SpriteInstance {
  animations: Record<string, Animation>;
  currentAnimation: Animation;
  currentFrameIndex: number = 0;
  frameTimer: number = 0;

  constructor(animations: Animation[], initial: string) {
    this.animations = Object.fromEntries(animations.map((a) => [a.name, a]));
    this.currentAnimation = this.animations[initial];
  }

  setAnimation(name: string) {
    if (this.currentAnimation.name !== name) {
      this.currentAnimation = this.animations[name];
      this.currentFrameIndex = 0;
      this.frameTimer = 0;
    }
  }

  setAnimationPreserveFrame(name: string) {
    if (this.currentAnimation.name !== name) {
      const newAnimation = this.animations[name];
      if (newAnimation) {
        // Preserve the current frame position, but clamp to new animation's frame count
        const preservedFrame = Math.min(
          this.currentFrameIndex,
          newAnimation.frames.length - 1,
        );
        this.currentAnimation = newAnimation;
        this.currentFrameIndex = preservedFrame;
        // Keep the same frame timer to maintain timing
      }
    }
  }

  update(dt: number) {
    this.frameTimer += dt;
    if (this.frameTimer > this.currentAnimation.frameDuration) {
      this.frameTimer = 0;
      this.currentFrameIndex++;
      if (this.currentFrameIndex >= this.currentAnimation.frames.length) {
        this.currentFrameIndex = this.currentAnimation.loop
          ? 0
          : this.currentAnimation.frames.length - 1;
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number = 1) {
    const img = this.currentAnimation.frames[this.currentFrameIndex];
    if (!img.complete) return;

    // SigurdV2 sprites are 32×32 (square). Integer scaling keeps pixel art crisp
    // with imageSmoothingEnabled = false. Bump SPRITE_SCALE for chunkier Sigurd.
    const SOURCE_SIZE = 32;
    const SPRITE_SCALE = 1.25;
    const drawSize = SOURCE_SIZE * SPRITE_SCALE;

    // Center horizontally on hitbox; anchor sprite bottom to hitbox bottom
    const spriteX = x + GAME_CONFIG.PLAYER_WIDTH / 2 - drawSize / 2;
    const spriteY = y + GAME_CONFIG.PLAYER_HEIGHT * scale - drawSize;

    // Most sprites face right in source; flip for "-left" animations.
    // Float source frames face the opposite direction — invert the rule for them.
    // float-stationary uses the same source as the directional floats, so it
    // needs the same swap to default to the same facing as float-right.
    const animName = this.currentAnimation.name;
    const isFloat = animName.startsWith("float");
    const isLeftFacing = isFloat
      ? animName === "float-right" || animName === "float-stationary"
      : animName.includes("-left");

    const prevSmoothing = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;

    if (isLeftFacing) {
      ctx.save();
      ctx.scale(-1, 1);
      ctx.drawImage(img, -spriteX - drawSize, spriteY, drawSize, drawSize);
      ctx.restore();
    } else {
      ctx.drawImage(img, spriteX, spriteY, drawSize, drawSize);
    }

    ctx.imageSmoothingEnabled = prevSmoothing;
  }
}
