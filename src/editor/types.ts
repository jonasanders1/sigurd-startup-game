import { MonsterType, CoinType } from "../types/enums";
import type { PlatformTheme } from "../config/platformTiles";
import type { FloorVariant } from "../config/floor";
import type { RoundedCorners } from "../types/interfaces";

export type EntityKind =
  | "platform"
  | "bomb"
  | "playerStart"
  | "monster"
  | "coinSpawn";

export interface PlatformEntity {
  id: string;
  kind: "platform";
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  borderColor?: string;
  isVertical?: boolean;
  tileTheme?: PlatformTheme;
  roundedCorners?: RoundedCorners;
}

export interface BombEntity {
  id: string;
  kind: "bomb";
  x: number;
  y: number;
  order: number;
  group: number;
}

export interface PlayerStartEntity {
  id: string;
  kind: "playerStart";
  x: number;
  y: number;
}

export interface MonsterEntity {
  id: string;
  kind: "monster";
  monsterType: MonsterType;
  x: number;
  y: number;
  speed: number;
  spawnDelay: number;
  delayed: boolean;
  // MUMMY
  platformX?: number;
  platformY?: number;
  platformWidth?: number;
  spawnSide?: "left" | "right";
  walkLengths?: number;
  direction?: number;
  variant?: "green" | "black";
  /** What this mummy turns into on hitting the ground (BJ §5.1.2). Default
   *  "SPHERE" matches canonical BJ. "NONE" = die on impact. */
  transformTarget?: "SPHERE" | "ORB" | "NONE";
  /** ms between repeat spawns (only for delayed/spawn-point monsters).
   *  0 / undefined = one-shot (legacy). >0 = continuous respawn after the
   *  initial delay. */
  respawnInterval?: number;
  /** Hard cap on how many times this spawn point fires. 0 / undefined =
   *  unlimited (only meaningful when respawnInterval > 0). */
  maxSpawns?: number;
  // VERTICAL_PATROL
  patrolHeight?: number;
  side?: "left" | "right";
  // HORN
  startAngle?: number;
  // CHASER
  directness?: number;
  updateInterval?: number;
  // UFO
  ambushInterval?: number;
}

export interface CoinSpawnEntity {
  id: string;
  kind: "coinSpawn";
  coinType: CoinType;
  x: number;
  y: number;
  spawnAngle?: number;
}

export type EditorEntity =
  | PlatformEntity
  | BombEntity
  | PlayerStartEntity
  | MonsterEntity
  | CoinSpawnEntity;

export interface MapMeta {
  id: string;
  name: string;
  background: string;
  spawnIndicatorColor: string;
  groupSequence: number[];
  floor?: FloorVariant;
}

export type Tool =
  | { kind: "select" }
  | { kind: "place"; entity: EntityKind; subType?: string };
