import { Founding } from "../types/interfaces";
import { GAME_CONFIG, COLORS } from "../types/constants";
import { DEFAULT_PLATFORM_THEME } from "../config/platformTiles";

export const createPlatform = (
  x: number,
  y: number,
  dimensions: { width: number; height: number },
  color: string = COLORS.PLATFORM,
  borderColor: string = "#000",
) => ({
  x,
  y,
  width: dimensions.width,
  height: dimensions.height,
  borderColor,
  color,
  tileTheme: DEFAULT_PLATFORM_THEME,
});

// 25px wall thickness matches the cell grid; tutorials and campaign maps share
// this so editor TS exports paste cleanly into either.
export const createVerticalPlatform = (
  x: number,
  y: number,
  height: number,
  color: string = COLORS.PLATFORM,
  borderColor: string = "#000",
) => ({
  x,
  y,
  width: 25,
  height,
  borderColor,
  color,
  isVertical: true,
  tileTheme: DEFAULT_PLATFORM_THEME,
});

export const createFounding = (
  x: number,
  y: number,
  order: number,
  group: number,
): Founding => ({
  x,
  y,
  width: GAME_CONFIG.FOUNDING_SIZE,
  height: GAME_CONFIG.FOUNDING_SIZE,
  order,
  group,
  isCollected: false,
  isBlinking: false,
});

export const centerPoint = (offsetWidth: number, offsetHeight: number) => ({
  x: (GAME_CONFIG.CANVAS_WIDTH - offsetWidth) / 2,
  y: (GAME_CONFIG.CANVAS_HEIGHT - offsetHeight) / 2,
});
