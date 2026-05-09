import { MonsterType, CoinType } from "../types/enums";
import { GAME_CONFIG, COLORS } from "../types/constants";
import {
  EditorEntity,
  MonsterEntity,
  PlatformEntity,
  FoundingEntity,
  CoinSpawnEntity,
  PlayerStartEntity,
  MapMeta,
} from "./types";

let idCounter = 0;
export const newId = (prefix: string = "e"): string => {
  idCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${idCounter}`;
};

export const DEFAULT_PLATFORM_COLOR = COLORS.PLATFORM ?? "#ebb185";
export const DEFAULT_BG = "soverommet";

export const defaultPlatform = (x: number, y: number): PlatformEntity => ({
  id: newId("plat"),
  kind: "platform",
  x,
  y,
  width: 150,
  height: 25,
  color: DEFAULT_PLATFORM_COLOR,
  borderColor: "#000",
});

export const defaultVerticalWall = (x: number, y: number): PlatformEntity => ({
  id: newId("wall"),
  kind: "platform",
  x,
  y,
  width: 25,
  height: 150,
  color: DEFAULT_PLATFORM_COLOR,
  borderColor: "#000",
  isVertical: true,
});

export const defaultFounding = (x: number, y: number): FoundingEntity => ({
  id: newId("founding"),
  kind: "founding",
  x,
  y,
  order: 1,
  group: 1,
});

export const defaultPlayerStart = (x: number, y: number): PlayerStartEntity => ({
  id: newId("spawn"),
  kind: "playerStart",
  x,
  y,
});

export const defaultMonster = (
  monsterType: MonsterType,
  x: number,
  y: number
): MonsterEntity => {
  const base: MonsterEntity = {
    id: newId("mon"),
    kind: "monster",
    monsterType,
    x,
    y,
    speed: 1,
    spawnDelay: 0,
    delayed: false,
  };
  switch (monsterType) {
    case MonsterType.BUREAUCRAT:
      // Bottom-anchored: click point becomes the feet line (= platformY).
      return {
        ...base,
        platformX: x,
        platformY: y,
        platformWidth: 150,
        spawnSide: "left",
        walkLengths: 1,
      };
    case MonsterType.FOUNDER:
      return { ...base, startAngle: 45 };
    case MonsterType.WISP:
      return {
        ...base,
        speed: 0.8,
        directness: 0.2,
        updateInterval: 500,
      };
    case MonsterType.TAXGHOST:
      return {
        ...base,
        speed: 0.8,
        ambushInterval: 8000,
      };
    // BJ airborne forms (Monster-Movments.md). Just need x/y/speed —
    // wobble fields are factory defaults.
    case MonsterType.CONSULTANT:
      return { ...base, speed: 1.2 };
    case MonsterType.ROBOT:
      return { ...base, speed: 1.4 };
  }
};

export const defaultCoinSpawn = (
  coinType: CoinType,
  x: number,
  y: number
): CoinSpawnEntity => ({
  id: newId("coin"),
  kind: "coinSpawn",
  coinType,
  x,
  y,
  spawnAngle: coinType === CoinType.POWER ? 65 : undefined,
});

export const defaultMapMeta = (): MapMeta => ({
  id: "newLevel",
  name: "new level",
  background: DEFAULT_BG,
  spawnIndicatorColor: "#ff9ff3",
  groupSequence: [1, 2, 3, 4, 5, 6, 7, 8],
});

export const blankMapEntities = (): EditorEntity[] => [
  defaultPlayerStart(
    (GAME_CONFIG.CANVAS_WIDTH - GAME_CONFIG.PLAYER_WIDTH) / 2,
    (GAME_CONFIG.CANVAS_HEIGHT - GAME_CONFIG.PLAYER_HEIGHT) / 2
  ),
];
