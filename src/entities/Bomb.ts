import { SpriteInstance } from "../lib/SpriteInstance";
import { loadSpriteImage } from "../config/assets";
import { GAME_CONFIG } from "../types/constants";

const fundingFrames = [
  loadSpriteImage("funding/funding_0.png"),
  loadSpriteImage("funding/funding_1.png"),
  loadSpriteImage("funding/funding_2.png"),
  loadSpriteImage("funding/funding_3.png"),
  loadSpriteImage("funding/funding_4.png"),
  loadSpriteImage("funding/funding_5.png"),
  loadSpriteImage("funding/funding_6.png"),
  loadSpriteImage("funding/funding_7.png"),
];

const bombAnimations = [
  {
    name: "unlit",
    frames: [fundingFrames[0]],
    frameDuration: 100,
    loop: false,
  },
  {
    name: "lit",
    frames: fundingFrames,
    frameDuration: 100,
    loop: true,
  },
];

// The PNG canvas (32×32) has transparent padding around the actual artwork,
// which only fills ~half the canvas. Scale the draw size up so the visible
// content roughly fills the BOMB_SIZE hitbox; padding overflows transparently.
const SPRITE_OVERSCALE = 1.9;

export class BombSpriteInstance extends SpriteInstance {
  draw(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number = 1) {
    const img = this.currentAnimation.frames[this.currentFrameIndex];
    if (!img.complete || img.naturalWidth === 0) return;

    const hitboxSize = GAME_CONFIG.BOMB_SIZE * scale;
    const drawSize = hitboxSize * SPRITE_OVERSCALE;
    const offset = (hitboxSize - drawSize) / 2.2;
    ctx.drawImage(img, x + offset, y + offset, drawSize, drawSize);
  }
}

export const bombSprite = new BombSpriteInstance(bombAnimations, "unlit");
