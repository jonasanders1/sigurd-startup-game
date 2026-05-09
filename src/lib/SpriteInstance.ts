/** Player sprite display size in screen pixels — independent of bounds. */
export const PLAYER_SPRITE_CELL = 88;
/** Where Sigurd's feet sit within the 64×64 source cell (0-1). Smaller =
 *  sprite drops further (visible feet sit lower relative to the bounds bottom). */
const FEET_RATIO = 48 / 64;

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

  /** Feet-anchored draw: pass the world position where the player's feet
   *  should land. Sprite display size is fixed (PLAYER_SPRITE_CELL); bounds
   *  and hitbox don't affect visual scale. */
  draw(ctx: CanvasRenderingContext2D, feetX: number, feetY: number) {
    const img = this.currentAnimation.frames[this.currentFrameIndex];
    if (!img.complete || img.naturalWidth === 0) return;

    const cell = PLAYER_SPRITE_CELL;
    const drawX = feetX - cell / 2;
    const drawY = feetY - cell * FEET_RATIO;

    const prevSmoothing = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, drawX, drawY, cell, cell);
    ctx.imageSmoothingEnabled = prevSmoothing;
  }
}
