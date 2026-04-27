import { loadSpriteImage } from "../config/assets";

export const range = (start: number, end: number): number[] => {
  const out: number[] = [];
  for (let i = start; i <= end; i++) out.push(i);
  return out;
};

export const pad2 = (n: number): string => n.toString().padStart(2, "0");

export const loadFrameRange = (
  base: string,
  prefix: string,
  start: number,
  end: number
): HTMLImageElement[] =>
  range(start, end).map((i) => loadSpriteImage(`${base}/${prefix}_${pad2(i)}.png`));
