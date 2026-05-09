import { MapDefinition, Founding, Platform, Monster } from "../types/interfaces";
import { MonsterType, CoinType } from "../types/enums";
import { GAME_CONFIG } from "../types/constants";
import {
  createBureaucratMonster,
  createFounderMonster,
  createWispMonster,
  createTaxGhostMonster,
  createConsultantMonster,
  createRobotMonster,
} from "../managers/MonsterFactory";
import {
  EditorEntity,
  MonsterEntity,
  PlatformEntity,
  FoundingEntity,
  CoinSpawnEntity,
  PlayerStartEntity,
  MapMeta,
} from "./types";
import { isRecurring } from "./spawnUtils";

const buildFounding = (b: FoundingEntity): Founding => ({
  x: b.x,
  y: b.y,
  width: GAME_CONFIG.FOUNDING_SIZE,
  height: GAME_CONFIG.FOUNDING_SIZE,
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
  tileTheme: p.tileTheme,
});

const buildMonster = (m: MonsterEntity): Monster => {
  switch (m.monsterType) {
    case MonsterType.BUREAUCRAT:
      return createBureaucratMonster(
        m.platformX ?? m.x,
        // BUREAUCRAT is bottom-anchored: m.y is the feet line / platformY.
        m.platformY ?? m.y,
        m.platformWidth ?? 150,
        m.spawnSide ?? "left",
        m.walkLengths ?? 1,
        m.speed,
        m.direction,
        m.spawnDelay,
        m.transformTarget ?? "CONSULTANT"
      );
    case MonsterType.FOUNDER:
      return createFounderMonster(
        m.x,
        m.y,
        m.startAngle ?? 45,
        m.speed,
        m.spawnDelay
      );
    case MonsterType.WISP:
      return createWispMonster(
        m.x,
        m.y,
        m.speed,
        m.directness ?? 0.2,
        m.updateInterval ?? 500,
        m.spawnDelay
      );
    case MonsterType.TAXGHOST:
      return createTaxGhostMonster(
        m.x,
        m.y,
        m.speed,
        m.ambushInterval ?? 8000,
        m.spawnDelay
      );
    case MonsterType.CONSULTANT:
      return createConsultantMonster(m.x, m.y, m.speed, m.spawnDelay);
    case MonsterType.ROBOT:
      return createRobotMonster(m.x, m.y, m.speed, m.spawnDelay);
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
  const platforms = entities.filter((e): e is PlatformEntity => e.kind === "platform");
  const foundings = entities
    .filter((e): e is FoundingEntity => e.kind === "founding")
    .sort((a, b) => a.order - b.order);
  const monsters = entities.filter((e): e is MonsterEntity => e.kind === "monster");
  const coins = entities.filter((e): e is CoinSpawnEntity => e.kind === "coinSpawn");
  const playerStarts = entities.filter(
    (e): e is PlayerStartEntity => e.kind === "playerStart"
  );

  const playerStart = playerStarts[0]
    ? { x: playerStarts[0].x, y: playerStarts[0].y }
    : {
        x: (GAME_CONFIG.CANVAS_WIDTH - GAME_CONFIG.PLAYER_WIDTH) / 2,
        y: (GAME_CONFIG.CANVAS_HEIGHT - GAME_CONFIG.PLAYER_HEIGHT) / 2,
      };

  const staticMonsters = monsters
    .filter((m) => !m.delayed && !isRecurring(m))
    .map(buildMonster);

  const spawnPointMonsters = monsters
    .filter((m) => m.delayed || isRecurring(m))
    .map((m) => ({
      spawnDelay: m.delayed ? m.spawnDelay : 0,
      createMonster: () => buildMonster(m),
      respawnInterval: isRecurring(m) ? m.respawnInterval : undefined,
      maxSpawns:
        isRecurring(m) && m.maxSpawns && m.maxSpawns > 0
          ? m.maxSpawns
          : undefined,
    }));

  return {
    id: meta.id,
    name: meta.name,
    width: GAME_CONFIG.CANVAS_WIDTH,
    height: GAME_CONFIG.CANVAS_HEIGHT,
    background: meta.background,
    floor: meta.floor,
    playerStart,
    spawnIndicatorColor: meta.spawnIndicatorColor,
    groupSequence: meta.groupSequence.length > 0 ? meta.groupSequence : [1],
    platforms: platforms.map(buildPlatform),
    foundings: foundings.map(buildFounding),
    monsters: staticMonsters,
    monsterSpawnPoints: spawnPointMonsters,
    coinSpawnPoints: coins.map((c) => ({
      x: c.x,
      y: c.y,
      type: c.coinType as CoinType,
      spawnAngle: c.spawnAngle,
    })),
  };
};
