import { describe, it, vi } from "vitest";
import { writeFileSync, mkdirSync } from "fs";
import { resolve } from "path";

// Hoisted: runs BEFORE module imports below. The asset-loader code calls
// `new Image()` at module-load time, which crashes in Node. We stub the
// globals it touches; the stubs are never actually exercised because map
// factories don't trigger image loads.
vi.hoisted(() => {
  (globalThis as any).Image = class {
    src = "";
    onload: any = null;
    onerror: any = null;
  };
  (globalThis as any).HTMLImageElement = (globalThis as any).Image;
  if (typeof (globalThis as any).window === "undefined")
    (globalThis as any).window = {};
  if (typeof (globalThis as any).document === "undefined")
    (globalThis as any).document = {};
});

import {
  level1Map,
  level2Map,
  level3Map,
  level4Map,
  level5Map,
  level6Map,
  level7Map,
  level8Map,
  level9Map,
} from "../src/maps/mapDefinitions";

import {
  movementsMap,
  foundingsMap,
  surviveMap,
  killMap,
} from "../src/tutorials/missions";

const ALL_MAPS = [
  level1Map,
  level2Map,
  level3Map,
  level4Map,
  level5Map,
  level6Map,
  level7Map,
  level8Map,
  level9Map,
  movementsMap,
  foundingsMap,
  surviveMap,
  killMap,
];

const stripRuntimeFields = (m: any) => {
  // Drop non-portable runtime fields. Keep what a level designer needs:
  // type, position, dimensions, behavior parameters, transformation target.
  const out: any = {};
  for (const key of Object.keys(m)) {
    if (key === "spawnTime" || key === "individualSpawnTime") continue;
    if (key === "deathTime" || key === "respawnTime") continue;
    if (key === "originalSpawnPoint") continue;
    if (key === "ambushCooldown") continue;
    if (key === "isActive" || key === "isFrozen" || key === "isBlinking") continue;
    if (key === "isDead") continue;
    if (key === "isLethal") continue;
    out[key] = m[key];
  }
  return out;
};

const exportMap = (map: any) => {
  return {
    id: map.id,
    name: map.name,
    width: map.width,
    height: map.height,
    background: map.background,
    floor: map.floor,
    playerStart: map.playerStart,
    spawnIndicatorColor: map.spawnIndicatorColor,
    groupSequence: map.groupSequence,
    platforms: (map.platforms ?? []).map((p: any) => ({
      x: p.x,
      y: p.y,
      width: p.width,
      height: p.height,
      color: p.color,
      strokeColor: p.strokeColor,
      tileTheme: p.tileTheme,
      roundedCorners: p.roundedCorners,
      isVertical: p.isVertical ?? false,
    })),
    foundings: (map.foundings ?? []).map((f: any) => ({
      x: f.x,
      y: f.y,
      width: f.width,
      height: f.height,
      order: f.order,
      group: f.group,
    })),
    initialMonsters: (map.monsters ?? []).map((m: any) => stripRuntimeFields(m)),
    monsterSpawnPoints: (map.monsterSpawnPoints ?? []).map((sp: any) => {
      const m = sp.createMonster();
      return {
        spawnDelay: sp.spawnDelay,
        respawnInterval: sp.respawnInterval ?? 0,
        maxSpawns: sp.maxSpawns ?? 0,
        color: sp.color,
        monster: stripRuntimeFields(m),
      };
    }),
    coinSpawnPoints: (map.coinSpawnPoints ?? []).map((cs: any) => ({
      x: cs.x,
      y: cs.y,
      type: cs.type,
      spawnAngle: cs.spawnAngle,
    })),
  };
};

describe("export maps", () => {
  it("writes each map to exports/<id>.json and a combined exports/all-maps.json", () => {
    const outDir = resolve(__dirname, "..", "exports", "maps");
    mkdirSync(outDir, { recursive: true });

    const all: any[] = [];
    for (const map of ALL_MAPS) {
      const exported = exportMap(map);
      writeFileSync(
        resolve(outDir, `${exported.id}.json`),
        JSON.stringify(exported, null, 2),
      );
      all.push(exported);
    }
    writeFileSync(
      resolve(outDir, "all-maps.json"),
      JSON.stringify(all, null, 2),
    );

    // eslint-disable-next-line no-console
    console.log(`Exported ${all.length} maps to ${outDir}`);
  });
});
