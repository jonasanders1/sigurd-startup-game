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
        const preservedFrame = Math.min(this.currentFrameIndex, newAnimation.frames.length - 1);
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
    if (img.complete) {
      const drawWidth = GAME_CONFIG.PLAYER_WIDTH * 2.5; // Make sprite 1.7x wider
      const drawHeight = GAME_CONFIG.PLAYER_HEIGHT * scale;
      
      // Center the sprite horizontally
      const spriteX = x - (drawWidth - GAME_CONFIG.PLAYER_WIDTH) / 2.3;
      
      // Check if this is a left-facing animation
      const isLeftFacing = this.currentAnimation.name.includes('-left');
      
      if (isLeftFacing) {
        // For left-facing sprites, flip around the sprite's center
        ctx.save();
        ctx.scale(-1, 1);
        // Calculate the center point of the sprite for proper flipping
        const centerX = spriteX + drawWidth / 2.14;
        ctx.translate(-centerX * 2, 0);
        ctx.drawImage(img, spriteX, y, drawWidth, drawHeight);
        ctx.restore();
      } else {
        // For right-facing sprites, draw normally
        ctx.drawImage(img, spriteX, y, drawWidth, drawHeight);
      }
      
      // Draw hitbox border that matches the actual collision box (narrower)
      ctx.save();
      // ctx.strokeStyle = "red";
      // ctx.lineWidth = 2;
      // ctx.strokeRect(x, y, GAME_CONFIG.PLAYER_WIDTH, drawHeight);
      ctx.restore();
    }
  }
}
