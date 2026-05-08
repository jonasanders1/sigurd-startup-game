import { SpriteInstance } from "../lib/SpriteInstance";
import { loadFrameRange } from "../lib/spriteFrames";
import { resolveHitboxRect, type LethalHitbox } from "../config/entities";

/** Player lethal hitbox — smaller than the bounds, centered on the bounds. */
export const PLAYER_HITBOX: LethalHitbox = {
  width: 24,
  height: 42,
};

/** Resolve the player's lethal hitbox to an absolute world-space rect. */
export const getPlayerHitboxRect = (player: {
  x: number;
  y: number;
  width: number;
  height: number;
}) => resolveHitboxRect(player, PLAYER_HITBOX);

interface AnimDef {
  name: string;
  start: number;
  end: number;
  frameDuration: number;
  loop: boolean;
}

const ANIM_DEFS: AnimDef[] = [
  { name: "idle-left", start: 0, end: 5, frameDuration: 130, loop: true },
  { name: "idle-right", start: 6, end: 11, frameDuration: 130, loop: true },
  { name: "run-left", start: 12, end: 17, frameDuration: 55, loop: true },
  { name: "run-right", start: 18, end: 23, frameDuration: 55, loop: true },
  { name: "jump-left", start: 24, end: 26, frameDuration: 100, loop: false },
  { name: "jump-right", start: 27, end: 29, frameDuration: 100, loop: false },
  // Float uses a single frame from the run animation (run-left frame 13 / run-right frame 19).
  { name: "float-left", start: 13, end: 13, frameDuration: 120, loop: true },
  { name: "float-right", start: 19, end: 19, frameDuration: 120, loop: true },
  { name: "float-down", start: 36, end: 38, frameDuration: 120, loop: true },
  { name: "fall-left", start: 39, end: 41, frameDuration: 100, loop: false },
  { name: "fall-right", start: 42, end: 44, frameDuration: 100, loop: false },
  { name: "land-left", start: 45, end: 47, frameDuration: 80, loop: false },
  { name: "land-right", start: 48, end: 50, frameDuration: 80, loop: false },
  { name: "victory-left", start: 51, end: 54, frameDuration: 140, loop: true },
  { name: "victory-right", start: 55, end: 58, frameDuration: 140, loop: true },
];

const FRAME_FOLDER_OVERRIDES: Record<string, string> = {
  "float-left": "run-left",
  "float-right": "run-right",
};

const buildFrameMap = (
  folder: string,
  prefix: string,
): Record<string, HTMLImageElement[]> => {
  const base = `spritesV2/${folder}`;
  const out: Record<string, HTMLImageElement[]> = {};
  for (const def of ANIM_DEFS) {
    const subfolder = FRAME_FOLDER_OVERRIDES[def.name] ?? def.name;
    out[def.name] = loadFrameRange(`${base}/${subfolder}`, prefix, def.start, def.end);
  }
  return out;
};

// Two independent frame maps. `playerSprite.animations[name].frames` is
// re-pointed at one or the other when the skin swaps.
const defaultFrames = buildFrameMap("Sigurd", "Sigurd");
const powerFrames = buildFrameMap("SigurdPower", "SigurdPower");

// Initial animation list seeded with the default skin's frames.
const initialAnimations = ANIM_DEFS.map((def) => ({
  name: def.name,
  frames: defaultFrames[def.name],
  frameDuration: def.frameDuration,
  loop: def.loop,
}));

export type PlayerSkin = "default" | "power";

export const playerSprite = new SpriteInstance(initialAnimations, "idle-left");

let activeSkin: PlayerSkin = "default";

/**
 * Hot-swap the player sprite frames in place. Animation state (current
 * animation name, frame index, timer) is preserved — only the underlying
 * HTMLImageElement[] is repointed at the chosen skin's frame map.
 */
export const setPlayerSkin = (skin: PlayerSkin): void => {
  if (skin === activeSkin) return;
  const source = skin === "power" ? powerFrames : defaultFrames;
  for (const name of Object.keys(source)) {
    const target = playerSprite.animations[name];
    if (target) target.frames = source[name];
  }
  activeSkin = skin;
};
