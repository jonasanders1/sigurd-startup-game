import { MonsterType, CoinType } from "../types/enums";
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

const num = (n: number): string => {
  return Number.isInteger(n) ? `${n}` : `${Number(n.toFixed(2))}`;
};

const str = (s: string): string => `"${s.replace(/"/g, '\\"')}"`;

const platformLine = (p: PlatformEntity): string => {
  const factory = p.isVertical
    ? `createVerticalPlatform(${num(p.x)}, ${num(p.y)}, ${num(p.height)}, ${str(p.color)}${p.borderColor ? `, ${str(p.borderColor)}` : ""})`
    : `createPlatform(${num(p.x)}, ${num(p.y)}, { width: ${num(p.width)}, height: ${num(p.height)} }, ${str(p.color)}${p.borderColor ? `, ${str(p.borderColor)}` : ""})`;
  if (p.tileTheme) {
    return `  { ...${factory}, tileTheme: ${str(p.tileTheme)} },`;
  }
  return `  ${factory},`;
};

const bombLine = (b: BombEntity): string =>
  `  createBomb(${num(b.x)}, ${num(b.y)}, ${b.order}, ${b.group}),`;

const monsterCall = (m: MonsterEntity): string => {
  switch (m.monsterType) {
    case MonsterType.HORIZONTAL_PATROL:
      return `createHorizontalPatrolMonster(${num(m.platformX ?? m.x)}, ${num(m.platformY ?? m.y)}, ${num(m.platformWidth ?? 150)}, ${str(m.spawnSide ?? "left")}, ${m.walkLengths ?? 1}, ${num(m.speed)}, ${m.direction === undefined ? "undefined" : m.direction}, ${m.spawnDelay}, ${str(m.variant ?? "green")})`;
    case MonsterType.VERTICAL_PATROL:
      return `createVerticalPatrolMonster(${num(m.platformX ?? m.x)}, ${num(m.y)}, ${num(m.patrolHeight ?? 200)}, ${str(m.side ?? "left")}, ${num(m.speed)}, ${m.direction ?? 1}, ${m.spawnDelay})`;
    case MonsterType.FLOATER:
      return `createFloaterMonster(${num(m.x)}, ${num(m.y)}, ${m.startAngle ?? 45}, ${num(m.speed)}, ${m.spawnDelay})`;
    case MonsterType.CHASER:
      return `createChaserMonster(${num(m.x)}, ${num(m.y)}, ${num(m.speed)}, ${m.directness ?? 0.2}, ${m.updateInterval ?? 500}, ${m.spawnDelay})`;
    case MonsterType.AMBUSHER:
      return `createAmbusherMonster(${num(m.x)}, ${num(m.y)}, ${num(m.speed)}, ${m.ambushInterval ?? 8000}, ${m.spawnDelay})`;
  }
};

const coinTypeRef = (t: CoinType): string => {
  switch (t) {
    case CoinType.POWER: return "CoinType.POWER";
    case CoinType.BONUS_MULTIPLIER: return "CoinType.BONUS_MULTIPLIER";
    case CoinType.EXTRA_LIFE: return "CoinType.EXTRA_LIFE";
    case CoinType.MONSTER_FREEZE: return "CoinType.MONSTER_FREEZE";
  }
};

const coinSpawnLine = (c: CoinSpawnEntity): string => {
  const lines = [
    `    {`,
    `      x: ${num(c.x)},`,
    `      y: ${num(c.y)},`,
    `      type: ${coinTypeRef(c.coinType)},`,
  ];
  if (c.spawnAngle !== undefined) {
    lines.push(`      spawnAngle: ${c.spawnAngle},`);
  }
  lines.push(`    },`);
  return lines.join("\n");
};

export interface SerializeResult {
  code: string;
  warnings: string[];
}

export const serializeMap = (
  entities: EditorEntity[],
  meta: MapMeta
): SerializeResult => {
  const warnings: string[] = [];

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

  if (grounds.length === 0) warnings.push("No ground defined.");
  if (grounds.length > 1) warnings.push(`${grounds.length} grounds — only first used.`);
  if (playerStarts.length === 0) warnings.push("No player spawn defined.");
  if (playerStarts.length > 1) warnings.push("Multiple player spawns — first used.");
  if (bombs.length !== 23) {
    warnings.push(`Expected 23 bombs, got ${bombs.length}.`);
  }
  const orders = bombs.map((b) => b.order);
  const orderDupes = orders.filter((o, i) => orders.indexOf(o) !== i);
  if (orderDupes.length > 0) {
    warnings.push(`Duplicate bomb orders: ${[...new Set(orderDupes)].join(", ")}`);
  }

  const ground = grounds[0];
  const spawn = playerStarts[0];

  const staticMonsters = monsters.filter((m) => !m.delayed);
  const delayedMonsters = monsters.filter((m) => m.delayed);

  const lines: string[] = [];
  lines.push(`export const ${meta.id}Map: MapDefinition = {`);
  lines.push(`  id: ${str(meta.id)},`);
  lines.push(`  name: ${str(meta.name)},`);
  lines.push(`  width: GAME_CONFIG.CANVAS_WIDTH,`);
  lines.push(`  height: GAME_CONFIG.CANVAS_HEIGHT,`);
  lines.push(`  background: ${str(meta.background)},`);
  if (spawn) {
    lines.push(`  playerStart: { x: ${num(spawn.x)}, y: ${num(spawn.y)} },`);
  } else {
    lines.push(`  playerStart: { x: 400, y: 300 },`);
  }
  lines.push(`  spawnIndicatorColor: ${str(meta.spawnIndicatorColor)},`);
  lines.push(``);
  lines.push(`  groupSequence: [${meta.groupSequence.join(", ")}],`);
  lines.push(``);

  if (ground) {
    lines.push(`  ground: {`);
    lines.push(`    x: ${num(ground.x)},`);
    lines.push(`    y: ${num(ground.y)},`);
    lines.push(`    width: ${num(ground.width)},`);
    lines.push(`    height: ${num(ground.height)},`);
    lines.push(`    color: ${str(ground.color)},`);
    if (ground.tileTheme) {
      lines.push(`    tileTheme: ${str(ground.tileTheme)},`);
    }
    if (ground.tileNoise !== undefined) {
      lines.push(`    tileNoise: ${num(ground.tileNoise)},`);
    }
    lines.push(`  },`);
    lines.push(``);
  }

  lines.push(`  platforms: [`);
  for (const p of platforms) lines.push(platformLine(p));
  lines.push(`  ],`);
  lines.push(``);

  lines.push(`  bombs: [`);
  for (const b of bombs) lines.push(bombLine(b));
  lines.push(`  ],`);
  lines.push(``);

  lines.push(`  monsters: [`);
  for (const m of staticMonsters) lines.push(`    ${monsterCall(m)},`);
  lines.push(`  ],`);

  if (delayedMonsters.length > 0) {
    lines.push(``);
    lines.push(`  monsterSpawnPoints: [`);
    for (const m of delayedMonsters) {
      lines.push(`    {`);
      lines.push(`      spawnDelay: ${m.spawnDelay},`);
      lines.push(`      createMonster: () => ${monsterCall(m)},`);
      lines.push(`    },`);
    }
    lines.push(`  ],`);
  }

  if (coins.length > 0) {
    lines.push(``);
    lines.push(`  coinSpawnPoints: [`);
    for (const c of coins) lines.push(coinSpawnLine(c));
    lines.push(`  ],`);
  }

  lines.push(`};`);

  return { code: lines.join("\n"), warnings };
};
