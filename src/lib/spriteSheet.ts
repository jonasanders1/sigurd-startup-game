import { loadSpriteImage } from "../config/assets";

export interface SlicedSheet {
  readonly image: HTMLImageElement;
  /** Returns a per-frame canvas. Painted lazily once the source image loads. */
  frame(col: number, row: number): HTMLCanvasElement;
  /** Returns frames from a single row, columns startCol..startCol+count-1. */
  rowFrames(row: number, count: number, startCol?: number): HTMLCanvasElement[];
  ready(): boolean;
}

/**
 * Load a sprite sheet and slice it into a grid of per-frame canvases. Frames
 * are returned immediately as empty canvases; they're painted asynchronously
 * once the source image finishes loading. Drawing an unpainted frame is a
 * transparent no-op, so callers don't need to gate on readiness.
 */
export const sliceSheet = (
  path: string,
  cellW: number,
  cellH: number
): SlicedSheet => {
  const image = loadSpriteImage(path);
  const cache = new Map<string, HTMLCanvasElement>();
  let isReady = false;

  const paint = (col: number, row: number, canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, cellW, cellH);
    ctx.drawImage(
      image,
      col * cellW,
      row * cellH,
      cellW,
      cellH,
      0,
      0,
      cellW,
      cellH
    );
  };

  const finalize = () => {
    isReady = true;
    cache.forEach((canvas, key) => {
      const [c, r] = key.split(",").map(Number);
      paint(c, r, canvas);
    });
  };

  if (image.complete && image.naturalWidth > 0) {
    finalize();
  } else {
    image.addEventListener("load", finalize, { once: true });
  }

  const frame = (col: number, row: number): HTMLCanvasElement => {
    const key = `${col},${row}`;
    let canvas = cache.get(key);
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.width = cellW;
      canvas.height = cellH;
      cache.set(key, canvas);
      if (isReady) paint(col, row, canvas);
    }
    return canvas;
  };

  const rowFrames = (
    row: number,
    count: number,
    startCol = 0
  ): HTMLCanvasElement[] =>
    Array.from({ length: count }, (_, i) => frame(startCol + i, row));

  return {
    image,
    frame,
    rowFrames,
    ready: () => isReady,
  };
};
