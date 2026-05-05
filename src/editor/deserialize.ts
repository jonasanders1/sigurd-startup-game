import { MapDefinition, Monster } from "../types/interfaces";
import { MonsterType } from "../types/enums";
import {
  EditorEntity,
  MonsterEntity,
  MapMeta,
} from "./types";
import { newId } from "./defaults";
import { GAME_CONFIG } from "../types/constants";

const monsterToEntity = (m: Monster, delayed: boolean): MonsterEntity => {
  const base: MonsterEntity = {
    id: newId("mon"),
    kind: "monster",
    monsterType: m.type as MonsterType,
    x: m.x,
    y: m.y,
    speed: m.speed ?? 1,
    spawnDelay: m.spawnDelay ?? 0,
    delayed,
  };

  switch (m.type) {
    case MonsterType.MUMMY: {
      const platformWidth = (m.patrolEndX ?? m.x) - (m.patrolStartX ?? m.x);
      return {
        ...base,
        platformX: m.patrolStartX ?? m.x,
        platformY: m.y + GAME_CONFIG.MONSTER_SIZE,
        platformWidth,
        spawnSide: m.direction >= 0 ? "left" : "right",
        walkLengths: m.walkLengths ?? 1,
        direction: m.direction,
        variant: m.variant ?? "green",
        transformTarget: m.transformTarget ?? "SPHERE",
      };
    }
    case MonsterType.VERTICAL_PATROL: {
      const patrolHeight = (m.patrolEndY ?? m.y) - (m.patrolStartY ?? m.y);
      return {
        ...base,
        platformX: m.targetPlatformX ?? m.x,
        patrolHeight,
        side: m.patrolSide ?? "left",
        direction: m.direction ?? 1,
      };
    }
    case MonsterType.HORN:
      return { ...base, startAngle: m.startAngle ?? 45 };
    case MonsterType.BIRD:
      return {
        ...base,
        directness: m.directness ?? 0.2,
        updateInterval: m.chaseUpdateInterval ?? 500,
      };
    case MonsterType.UFO:
      return {
        ...base,
        ambushInterval: 8000,
      };
    case MonsterType.SPHERE:
    case MonsterType.ORB:
      return base;
  }
};

export const mapToEditor = (
  map: MapDefinition
): { entities: EditorEntity[]; meta: MapMeta } => {
  const entities: EditorEntity[] = [];

  entities.push({
    id: newId("spawn"),
    kind: "playerStart",
    x: map.playerStart.x,
    y: map.playerStart.y,
  });

  for (const p of map.platforms) {
    entities.push({
      id: newId("plat"),
      kind: "platform",
      x: p.x,
      y: p.y,
      width: p.width,
      height: p.height,
      color: p.color,
      borderColor: p.borderColor,
      isVertical: p.isVertical,
      tileTheme: p.tileTheme,
      roundedCorners: p.roundedCorners,
    });
  }

  for (const b of map.bombs) {
    entities.push({
      id: newId("bomb"),
      kind: "bomb",
      x: b.x,
      y: b.y,
      order: b.order,
      group: b.group,
    });
  }

  for (const m of map.monsters) {
    entities.push(monsterToEntity(m, false));
  }

  if (map.monsterSpawnPoints) {
    for (const sp of map.monsterSpawnPoints) {
      try {
        const m = sp.createMonster();
        const ent = monsterToEntity(m, true);
        ent.spawnDelay = sp.spawnDelay;
        if (sp.respawnInterval && sp.respawnInterval > 0) {
          ent.respawnInterval = sp.respawnInterval;
          if (sp.maxSpawns && sp.maxSpawns > 0) {
            ent.maxSpawns = sp.maxSpawns;
          }
        }
        entities.push(ent);
      } catch {
        // skip malformed factory
      }
    }
  }

  if (map.coinSpawnPoints) {
    for (const c of map.coinSpawnPoints) {
      entities.push({
        id: newId("coin"),
        kind: "coinSpawn",
        coinType: c.type as never,
        x: c.x,
        y: c.y,
        spawnAngle: c.spawnAngle,
      });
    }
  }

  const meta: MapMeta = {
    id: map.id,
    name: map.name,
    background: map.background ?? "soverommet",
    spawnIndicatorColor: map.spawnIndicatorColor ?? "#ff9ff3",
    groupSequence: [...map.groupSequence],
    floor: map.floor,
  };

  return { entities, meta };
};
