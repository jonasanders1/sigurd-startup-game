import { SpriteInstance } from "../lib/SpriteInstance";
import { ASSET_PATHS } from "../config/assets";
import { GAME_CONFIG } from "../types/constants";

// Helper function to load images from public folder
const loadImage = (path: string): HTMLImageElement => {
  const img = new Image();
  img.src = `${ASSET_PATHS.images}/${path}`;
  return img;
};

const unlitBombFrame2 = [loadImage("bomb/bomb1.png")];

const litBombFrame2 = [
  loadImage("bomb/bomb1.png"),
  loadImage("bomb/bomb2.png"),
];

const bombAnimations = [
  {
    name: "unlit",
    frames: unlitBombFrame2,
    frameDuration: 100,
    loop: false,
  },
  {
    name: "lit",
    frames: litBombFrame2,
    frameDuration: 100, // Faster blinking for more noticeable effect
    loop: true,
  },

  // Add more animations as needed
];

// Create a custom bomb sprite instance with proper drawing
export class BombSpriteInstance extends SpriteInstance {
  draw(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number = 1) {
    const img = this.currentAnimation.frames[this.currentFrameIndex];
    if (img.complete) {
      const drawWidth = GAME_CONFIG.BOMB_SIZE * scale;
      const drawHeight = GAME_CONFIG.BOMB_SIZE * scale;

      // Draw the bomb sprite centered on the bomb's position
      ctx.drawImage(img, x, y, drawWidth, drawHeight);
    }
  }
}

export const bombSprite = new BombSpriteInstance(bombAnimations, "unlit");
