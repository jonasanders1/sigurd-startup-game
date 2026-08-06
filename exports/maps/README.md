# Map Data Export — for Unity Port

Machine-readable export of every map in the game. Feed `all-maps.json` (or any individual `*.json`) to a Unity-side loader to recreate the levels with exact coordinates.

## Files

- `all-maps.json` — array of all 13 maps in one file
- `level1.json` … `level9.json` — individual campaign maps
- `tutorial-movements.json`, `tutorial-foundings.json`, `tutorial-survive.json`, `tutorial-kill.json` — tutorial maps

## Coordinate convention

All coordinates are **Canvas-style**: origin top-left, Y increases downward, units = pixels. Playfield is 800 × 600.

For Unity (default Y-up), flip Y per entity:

```
unityY = 600 - canvasY
```

…or, if the entity has a height and you want its top edge at `canvasY`, the Unity position of its center becomes `(canvasX + width/2, 600 - canvasY - height/2)`.

For a Unity Tilemap covering the floor, place the tilemap's bottom at world Y=0 and the level content occupies world Y=0..600.

## Top-level schema

```ts
{
  id: string;                     // "level1", "tutorial-movements", etc.
  name: string;                   // human-readable map name ("soverommet", "garasjen")
  width: 800;
  height: 600;
  background: string;             // asset key, e.g. "soverommet" → src/assets/maps-bg-images/soverommet.png
  floor: string;                  // floor variant: "yellow-clean", "gray-striped", "blue-striped", etc.
  playerStart: { x: number; y: number };
  spawnIndicatorColor: string;    // hex color for the player respawn indicator
  groupSequence: number[];        // order in which founding groups become active

  platforms: Platform[];
  foundings: Founding[];
  initialMonsters: Monster[];     // monsters spawned at level load (usually empty)
  monsterSpawnPoints: SpawnPoint[];
  coinSpawnPoints: CoinSpawnPoint[];
}
```

## Platform

```ts
{
  x: number;                      // top-left corner in Canvas coords
  y: number;
  width: number;
  height: number;                 // almost always 25
  color: string;                  // fill color, hex
  strokeColor?: string;           // border color (often omitted = "#000")
  tileTheme?: "platform-green" | "platform-blue" | "platform-beige";
  roundedCorners?: { tl?: bool; tr?: bool; bl?: bool; br?: bool };
  isVertical: bool;               // true if it's a wall (15 px wide, variable height)
}
```

The `roundedCorners` flags indicate which corners should be **chamfered** (45° pixel-cut, not soft round). Missing flags mean square corner.

## Founding

```ts
{
  x: number;                      // top-left, Canvas coords
  y: number;
  width: 25;
  height: 25;
  order: number;                  // unique within the level (1..N)
  group: number;                  // group ID (1..6 typically)
}
```

Foundings are collected in the order specified by `groupSequence`. Within each group, the founding with the lowest `order` is the next-correct one.

## Initial monsters

Monsters present at level load. Most maps leave this empty (`[]`) and use `monsterSpawnPoints` instead. Schema is the same as a `monsterSpawnPoints[].monster` object (see below).

## Spawn point

```ts
{
  spawnDelay: number;             // ms after level start when this spawn first fires
  respawnInterval: number;        // ms between subsequent spawns; 0 = one-shot
  maxSpawns: number;              // hard cap on total firings; 0 = unlimited
  color?: string;                 // optional override of the monster's color
  monster: Monster;               // see below
}
```

The spawn manager fires this spawn at `t = spawnDelay`, then re-fires every `respawnInterval` ms (if > 0) until `maxSpawns` is reached.

## Monster (inside a spawn point)

```ts
{
  type: "BUREAUCRAT" | "WISP" | "TAXGHOST" | "FOUNDER" | "CONSULTANT" | "ROBOT";
  x: number;                      // resolved spawn x (top-left, Canvas)
  y: number;                      // resolved spawn y (top-left)
  width: number;                  // bounds width (varies by type)
  height: number;                 // bounds height
  color: string;
  speed: number;                  // base speed
  direction: number;              // -1 left, +1 right, 0 stationary
  spawnDelay: number;             // mirrors the parent spawn point

  // Bureaucrat-specific:
  patrolStartX?: number;
  patrolEndX?: number;
  originalPatrolStartX?: number;
  originalPatrolEndX?: number;
  walkLengths?: number;           // platform traversals before falling
  transformTarget?: "CONSULTANT" | "ROBOT" | "WISP" | "TAXGHOST" | "FOUNDER" | "NONE";

  // Founder-specific:
  startAngle?: number;            // initial trajectory angle in degrees
}
```

Per-type bounds and lethal hitboxes are documented in `specs/unity-sprites-spec.md` — the bounds in the JSON give you the bounding rectangle, but the lethal hitbox is **smaller** (centered) and must be configured per type in Unity.

### Bureaucrat resolved positions

A Bureaucrat's `x, y` is already resolved from the constructor args. For instance, a Bureaucrat on platform `(100, 175, w=150)` spawning on the "left" side appears at `x = 100`, `y = 175 - 39 = 136` (feet-anchored on the platform top edge). You don't need to recompute this — just use the `x, y` directly.

## Coin spawn point

```ts
{
  x: number;                      // top-left, Canvas
  y: number;
  type: "POWER" | "BONUS_MULTIPLIER" | "EXTRA_LIFE" | "FOUNDER_MODE";
  spawnAngle?: number;            // degrees, only for POWER coins (trajectory direction)
}
```

These define **where coins can spawn**, not where they always are. The CoinManager picks the appropriate spawn point at runtime when conditions are met (see master spec §11).

## What's NOT in the JSON

- **Wisp spawn:** auto-injected by LevelManager at a random corner per level, NOT authored in maps. Speed scales: `0.7 + (level - 1) * 0.05`, clamped at level 9.
- **Monster sprite paths & animation timings:** see `specs/unity-sprites-spec.md`.
- **Runtime state fields** (`isActive`, `isFrozen`, `isBlinking`, `isDead`, `deathTime`, `respawnTime`, `originalSpawnPoint`, etc.) — these are zeroed/reset on spawn anyway.

## Re-running the export

If you change `src/maps/mapDefinitions.ts` or `src/tutorials/missions.ts` and want a fresh export:

```
npx vitest run src/exportMaps.test.ts
```

This regenerates every JSON in this folder. Commit the changes if you want them tracked.
