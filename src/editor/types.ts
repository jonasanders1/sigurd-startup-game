import { MonsterType, CoinType } from "../types/enums";
import type { PlatformTheme } from "../config/platformTiles";
import type { GroundTheme } from "../config/groundTiles";

export type EntityKind =
  | "platform"
  | "ground"
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
}

export interface GroundEntity {
  id: string;
  kind: "ground";
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  tileTheme?: GroundTheme;
  tileNoise?: number;
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
  // HORIZONTAL_PATROL
  platformX?: number;
  platformY?: number;
  platformWidth?: number;
  spawnSide?: "left" | "right";
  walkLengths?: number;
  direction?: number;
  variant?: "green" | "black";
  // VERTICAL_PATROL
  patrolHeight?: number;
  side?: "left" | "right";
  // FLOATER
  startAngle?: number;
  // CHASER
  directness?: number;
  updateInterval?: number;
  // AMBUSHER
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
  | GroundEntity
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
}

export type Tool =
  | { kind: "select" }
  | { kind: "place"; entity: EntityKind; subType?: string };
