import { loadSpriteImage } from "../config/assets";

// Tailwind files are single-digit (Tailwind_0.png ... Tailwind_5.png), so we
// can't reuse loadFrameRange (which zero-pads to 2 digits).
const tailwindFrames: HTMLImageElement[] = Array.from({ length: 6 }, (_, i) =>
  loadSpriteImage(`spritesV2/Tailwind/Tailwind_${i}.png`),
);

const FRAME_DURATION_MS = 130;
/** Tailwind sprite display size in screen pixels — independent of bounds. */
export const TAILWIND_SPRITE_CELL = 64;
/** Where the chip-bag's "feet" sit within the 64×64 source cell (bureaucrat anchor). */
const FEET_RATIO = 50 / 64;

/**
 * Replacement sprite drawn over every monster while P-coin power mode is
 * active. One animation, six frames, looped — the same visual regardless
 * of the underlying monster type. State (frame index, timer) is shared so
 * all on-screen tailwind chip-bags animate in lockstep, which is cheap and
 * keeps the visual coherent.
 */
class TailwindSpriteImpl {
  private frameIndex = 0;
  private timer = 0;

  update(dt: number): void {
    this.timer += dt;
    if (this.timer > FRAME_DURATION_MS) {
      this.timer = 0;
      this.frameIndex = (this.frameIndex + 1) % tailwindFrames.length;
    }
  }

  /**
   * Pass the world anchor in screen space (feet line or bounds center) and
   * the anchor type. Sprite display size is fixed (TAILWIND_SPRITE_CELL).
   */
  draw(
    ctx: CanvasRenderingContext2D,
    anchorX: number,
    anchorY: number,
    anchor: "feet" | "center",
  ): void {
    const img = tailwindFrames[this.frameIndex];
    if (!img.complete || img.naturalWidth === 0) return;

    const cell = TAILWIND_SPRITE_CELL;
    const drawX = anchorX - cell / 2;
    const drawY =
      anchor === "feet" ? anchorY - cell * FEET_RATIO : anchorY - cell / 2;

    const prevSmoothing = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, drawX, drawY, cell, cell);
    ctx.imageSmoothingEnabled = prevSmoothing;
  }
}

/** Single shared instance — every monster on screen draws from the same timer. */
export const tailwindSprite = new TailwindSpriteImpl();
