import { loadFrameRange } from "../lib/spriteFrames";

const SPAWN_FRAMES: HTMLImageElement[] = loadFrameRange(
  "spritesV2/Monster-spawn",
  "Spawn",
  0,
  4,
);

/** Total countdown window (ms) the spawn animation plays across. */
export const SPAWN_INDICATOR_DURATION_MS = 500;

/**
 * Draw the spawn animation centered on the upcoming monster's bounds.
 * `timeRemaining` (ms until spawn) selects the frame so the animation
 * progresses from "forming" → "appearing" as the spawn moment approaches.
 */
export const drawSpawnIndicator = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  timeRemaining: number,
): void => {
  const progress = 1 - timeRemaining / SPAWN_INDICATOR_DURATION_MS;
  const clamped = Math.max(0, Math.min(1, progress));
  const frameIndex = Math.min(
    SPAWN_FRAMES.length - 1,
    Math.floor(clamped * SPAWN_FRAMES.length),
  );
  const img = SPAWN_FRAMES[frameIndex];
  if (!img.complete || img.naturalWidth === 0) return;

  // Render the 64×64 source slightly larger than the monster bounds so the
  // burst reads as visual flair around the spawn footprint.
  const cell = Math.max(width, height) * 1.6;
  const drawX = x + width / 2 - cell / 2;
  const drawY = y + height / 2 - cell / 2;

  const prevSmoothing = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, drawX, drawY, cell, cell);
  ctx.imageSmoothingEnabled = prevSmoothing;
};
