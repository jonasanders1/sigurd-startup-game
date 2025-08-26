import { GAME_CONFIG } from "../types/constants";
import { MonsterAnimation } from "../config/monsterAnimations";

export class MonsterSpriteInstance {
  animations: Record<string, MonsterAnimation>;
  currentAnimation: MonsterAnimation;
  currentFrameIndex: number = 0;
  frameTimer: number = 0;

  constructor(animations: MonsterAnimation[], initial: string = "idle") {
    this.animations = Object.fromEntries(animations.map((a) => [a.name, a]));
    this.currentAnimation = this.animations[initial] || animations[0];
  }

  setAnimation(name: string) {
    if (this.currentAnimation.name !== name && this.animations[name]) {
      this.currentAnimation = this.animations[name];
      this.currentFrameIndex = 0;
      this.frameTimer = 0;
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

  draw(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    flipHorizontal: boolean = false
  ) {
    const img = this.currentAnimation.frames[this.currentFrameIndex];
    if (img.complete) {
      ctx.save();
      
      if (flipHorizontal) {
        // Flip horizontally for left-facing animations
        ctx.scale(-1, 1);
        ctx.translate(-x * 2 - width, 0);
      }
      
      // Draw the monster sprite scaled to fit the monster's dimensions
      ctx.drawImage(img, x, y, width, height);
      
      ctx.restore();
    }
  }

  // Get the current animation name
  getCurrentAnimationName(): string {
    return this.currentAnimation.name;
  }

  // Check if the current animation has finished (for non-looping animations)
  isAnimationFinished(): boolean {
    return !this.currentAnimation.loop && 
           this.currentFrameIndex >= this.currentAnimation.frames.length - 1;
  }

  // Reset the current animation
  resetAnimation() {
    this.currentFrameIndex = 0;
    this.frameTimer = 0;
  }
}