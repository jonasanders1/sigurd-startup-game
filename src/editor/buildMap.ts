import { MapDefinition, Bomb, Platform, Monster } from "../types/interfaces";
import { MonsterType, CoinType } from "../types/enums";
import { GAME_CONFIG } from "../types/constants";
import {
  createHorizontalPatrolMonster,
  createVerticalPatrolMonster,
  createFloaterMonster,
  createChaserMonster,
  createAmbusherMonster,
} from "../managers/MonsterFactory";
import {
  EditorEntity,
  MonsterEntity,
  PlatformEntity,
  BombEntity,
  CoinSpawnEntity,
  GroundEntity,
  PlayerStartEntity,
  MapMeta,
} from "./types";

const buildBomb = (b: BombEntity): Bomb => ({
  x: b.x,
  y: b.y,
  width: GAME_CONFIG.BOMB_SIZE,
  height: GAME_CONFIG.BOMB_SIZE,
  order: b.order,
  group: b.group,
  isCollected: false,
  isBlinking: false,
});

const buildPlatform = (p: PlatformEntity): Platform => ({
  x: p.x,
  y: p.y,
  width: p.width,
  height: p.height,
  color: p.color,
  borderColor: p.borderColor,
  isVertical: p.isVertical,
});

const buildMonster = (m: MonsterEntity): Monster => {
  switch (m.monsterType) {
    case MonsterType.HORIZONTAL_PATROL:
      return createHorizontalPatrolMonster(
        m.platformX ?? m.x,
        m.platformY ?? m.y + GAME_CONFIG.MONSTER_SIZE,
        m.platformWidth ?? 150,
        m.spawnSide ?? "left",
        m.walkLengths ?? 1,
        m.speed,
        m.direction,
        m.spawnDelay,
        m.variant ?? "green"
      );
    case MonsterType.VERTICAL_PATROL:
      return createVerticalPatrolMonster(
        m.platformX ?? m.x,
        m.y,
        m.patrolHeight ?? 200,
        m.side ?? "left",
        m.speed,
        m.direction ?? 1,
        m.spawnDelay
      );
    case MonsterType.FLOATER:
      return createFloaterMonster(
        m.x,
        m.y,
        m.startAngle ?? 45,
        m.speed,
        m.spawnDelay
      );
    case MonsterType.CHASER:
      return createChaserMonster(
        m.x,
        m.y,
        m.speed,
        m.directness ?? 0.2,
        m.updateInterval ?? 500,
        m.spawnDelay
      );
    case MonsterType.AMBUSHER:
      return createAmbusherMonster(
        m.x,
        m.y,
        m.speed,
        m.ambushInterval ?? 8000,
        m.spawnDelay
      );
  }
};

/**
 * Convert editor state into a runnable MapDefinition.
 * Filters out invalid entities, deduplicates the player spawn,
 * and applies sane fallbacks so the game can boot even on partial maps.
 */
export const buildMapFromEditor = (
  entities: EditorEntity[],
  meta: MapMeta
): MapDefinition => {
  const grounds = entities.filter((e): e is GroundEntity => e.kind === "ground");
  const platforms = entities.filter((e): e is PlatformEntity => e.kind === "platform");
  const bombs = entities
    .filter((e): e is BombEntity => e.kind === "bomb")
    .sort((a, b) => a.order - b.order);
  const monsters = entities.filter((e): e is MonsterEntity => e.kind === "monster");
  const coins = entities.filter((e): e is CoinSpawnEntity => e.kind === "coinSpawn");
  const playerStarts = entities.filter(
    (e): e is PlayerStartEntity => e.kind === "playerStart"
  );

  const ground = grounds[0] ?? {
    x: 0,
    y: GAME_CONFIG.CANVAS_HEIGHT - 40,
    width: GAME_CONFIG.CANVAS_WIDTH,
    height: 40,
    color: "#4c6986",
  };

  const playerStart = playerStarts[0]
    ? { x: playerStarts[0].x, y: playerStarts[0].y }
    : {
        x: (GAME_CONFIG.CANVAS_WIDTH - GAME_CONFIG.PLAYER_WIDTH) / 2,
        y: (GAME_CONFIG.CANVAS_HEIGHT - GAME_CONFIG.PLAYER_HEIGHT) / 2,
      };

  const staticMonsters = monsters.filter((m) => !m.delayed).map(buildMonster);
  const delayedMonsters = monsters
    .filter((m) => m.delayed)
    .map((m) => ({
      spawnDelay: m.spawnDelay,
      createMonster: () => buildMonster(m),
    }));

  return {
    id: meta.id,
    name: meta.name,
    width: GAME_CONFIG.CANVAS_WIDTH,
    height: GAME_CONFIG.CANVAS_HEIGHT,
    background: meta.background,
    playerStart,
    spawnIndicatorColor: meta.spawnIndicatorColor,
    groupSequence: meta.groupSequence.length > 0 ? meta.groupSequence : [1],
    ground: {
      x: ground.x,
      y: ground.y,
      width: ground.width,
      height: ground.height,
      color: ground.color,
    },
    platforms: platforms.map(buildPlatform),
    bombs: bombs.map(buildBomb),
    monsters: staticMonsters,
    monsterSpawnPoints: delayedMonsters,
    coinSpawnPoints: coins.map((c) => ({
      x: c.x,
      y: c.y,
      type: c.coinType as CoinType,
      spawnAngle: c.spawnAngle,
    })),
  };
};
