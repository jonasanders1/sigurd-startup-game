# Sigurd Startup — Unity Port Specification

A comprehensive, implementation-ready specification of the **Sigurd Startup** game, written for a developer recreating it in **Unity**. This document describes every system, mechanic, constant, and behavior in the shipping Canvas 2D version. Custom 2D physics math is intentionally omitted because Unity's built-in physics (`Rigidbody2D`, `Collider2D`, `Physics2D.Raycast`) will replace it; the document focuses on *behavior, intent, parameters, and content*.

The codebase is at `/Users/jonasandersen/Utvikling/sigurd-startup-game`. Where a section references a file, the path is given relative to `src/` so a Unity engineer can cross-check anything ambiguous.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Canvas, Resolution & World Scale](#2-canvas-resolution--world-scale)
3. [Core Game Rules & Constants](#3-core-game-rules--constants)
4. [Game State Machine](#4-game-state-machine)
5. [Input Mapping](#5-input-mapping)
6. [Player Character](#6-player-character)
7. [Foundings (Collection Logic)](#7-foundings-collection-logic)
8. [Monster System](#8-monster-system)
9. [Difficulty Scaling](#9-difficulty-scaling)
10. [Power Mode & Frozen State](#10-power-mode--frozen-state)
11. [Coin System](#11-coin-system)
12. [Scoring & Multipliers](#12-scoring--multipliers)
13. [Lives, Death & Respawn](#13-lives-death--respawn)
14. [Maps & Level Content](#14-maps--level-content)
15. [Tutorial System](#15-tutorial-system)
16. [UI, Menus & HUD](#16-ui-menus--hud)
17. [Visual Design System](#17-visual-design-system)
18. [Rendering Pipeline](#18-rendering-pipeline)
19. [Audio System](#19-audio-system)
20. [Loading & Asset Preload](#20-loading--asset-preload)
21. [Host Bridge Integration](#21-host-bridge-integration)
22. [Dev Mode & Editor](#22-dev-mode--editor)
23. [Asset Inventory](#23-asset-inventory)
24. [Suggested Unity Architecture](#24-suggested-unity-architecture)
25. [Appendix: Constants Reference](#25-appendix-constants-reference)

---

## 1. Project Overview

### What the game is

Sigurd Startup is a fixed-screen 2D arcade platformer about a Norwegian founder ("Sigurd") collecting **Foundings** (Forretningsideer / business ideas) in a specific order across nine themed levels representing the Norwegian startup ecosystem (bedroom → garage → startup lab → Innovation Norway → Tax Office → NAV → Bank → Altinn → Silicon Valley). Each level has 23 Foundings organized into ordered groups; collecting them in the correct sequence ("firefoundings") earns more points than out-of-sequence collection. The player must avoid Norwegian bureaucracy monsters (bureaucrats, tax ghosts, regulation robots, consultants, founders, wisps). Coins drop based on Founding pickups and score milestones, granting power mode (freeze enemies), multiplier boosts, extra lives, or a real-world business-idea credit on the host platform.

### Genre tag

2D arcade platformer with collectathon sequencing, bullet-hell-lite enemy density, and Pac-Man-style power-pellet sub-mechanic.

### Shipping target

- Distributed as an **npm package**, embedded inside a React landing page that owns Stripe payments, Firebase auth, and a leaderboard. The package draws to an HTML `<canvas>` and communicates with the host through a `window.sigurdGame` bridge.
- For the Unity port, treat the bridge as a thin "external service" abstraction (`IHostBridge`) you can stub for standalone testing.

### Architectural principles to preserve

Even though the engine changes, the following decisions in the Canvas codebase exist for good reasons and should survive the port:

- **Managers own state. Entities are dumb.** A `Founding` MonoBehaviour just renders and reports collisions; `FoundingManager` owns the sequence logic. A `Monster` knows how to draw and report a hitbox; `MonsterBehaviorManager` decides what it does each frame.
- **Pure systems are pure.** Scoring, multiplier calculation, A* pathfinding, and the founding-sequence finite-state machine should be testable without instantiating any GameObject.
- **Event-driven communication.** Managers don't reach across each other; they raise events on a central `EventBus` (Unity: a `ScriptableObject`-based event channel works well, or a plain `static` C# event bus).
- **One pause clock.** Every time-based system (monster spawning, difficulty scaling, coin timers, respawn timers) consults a shared "effective paused milliseconds" function so pausing the game pauses *everything* consistently. In Unity, `Time.timeScale = 0` plus a custom unscaled-time clock will do most of this for free.
- **The bridge is mockable.** Always provide a "standalone" implementation that returns deterministic balances/grants so developers can run without the host.

---

## 2. Canvas, Resolution & World Scale

| Property | Value |
|---|---|
| Logical resolution | **800 × 600 px** |
| Target frame rate | 60 FPS |
| Origin | Top-left (Canvas convention) — Unity will use bottom-left, so flip Y |
| Playfield bottom | `y = 575` (canvas height − 25 px floor strip) |
| Aspect | 4:3 (letterbox on widescreen displays) |

The game is **fixed-resolution**. There is no scrolling camera, no parallax (the per-map background is a single static image filling 800×600). In Unity, use an orthographic camera with a fixed orthographic size that makes the world space match the design — e.g., 1 world unit = 1 pixel, camera size 300, camera at `(400, 300, -10)`.

### Entity sizes (all in pixels)

| Entity | Bounds (W × H) | Lethal hitbox (W × H) | Notes |
|---|---|---|---|
| Player | 25 × 43 | 24 × 42 | Sprite drawn at ~4× collision box; collision box anchored at feet |
| Founding | 25 × 25 | 25 × 25 | Static, no physics |
| Coin | 25 × 25 | 25 × 25 | All 4 coin types share size |
| Platform | variable × 25 | full bounds | 25 px thick is the canon |
| Wall (vertical) | 15 × variable | full bounds | Rare; only some maps |
| Bureaucrat | 25 × 39 | 18 × 32 | Patrols on platforms, transforms on landing |
| Wisp | 30 × 52 | 22 × 42 | Floating cardinal hopper |
| TaxGhost | 38 × 36 | 28 × 28 | Wanderer / ambusher |
| Founder | 30 × 40 | 22 × 32 | Bouncy floater with homing bursts |
| Consultant | 30 × 30 | 22 × 24 | Vertical-column chaser |
| Robot | 30 × 40 | 22 × 32 | Horizontal-row chaser |

The sprite frame is larger than the collision box — sprites have transparent padding that visually exceeds the hitbox. In Unity, create two child objects: a `SpriteRenderer` for visuals and a smaller `BoxCollider2D` for collision.

---

## 3. Core Game Rules & Constants

From `src/config/game.ts`:

| Constant | Value | Meaning |
|---|---|---|
| `TOTAL_FOUNDINGS` | 23 | Foundings per map |
| `STARTING_LIVES` | 3 | Lives at game start |
| `MAX_LIVES` | 9 | Cap for extra-life pickups (HUD constraint — heart icons must fit) |

Physics constants exist (`GRAVITY = 0.2`, `FLOAT_GRAVITY = 0.005`, `FAST_FALL_GRAVITY_MULTIPLIER = 2`, `MOVE_SPEED = 4`, `JUMP_POWER = 7`, `SUPER_JUMP_POWER = 12`, `MIN_JUMP_DURATION = 50 ms`, `MAX_JUMP_DURATION = 300 ms`) — these are conceptually relevant (e.g., float gravity is ~40× weaker than normal gravity, which sets the feel) but the numeric values are Canvas-tuned. Re-tune in Unity with `Rigidbody2D.gravityScale` and custom multipliers.

---

## 4. Game State Machine

Source: `src/managers/GameStateManager.ts`, `src/types/enums.ts`.

### States

| State | Purpose |
|---|---|
| `MENU` | Start screen, settings, tutorial select |
| `COUNTDOWN` | 3-second pre-play count-in (shows "3 → 2 → 1 → GO") |
| `PLAYING` | Active gameplay; everything updates |
| `PAUSED` | Game suspended; all managers paused |
| `MAP_CLEARED` | Final Founding collected; 5-second pause for Victory sound |
| `BONUS` | Animated bonus-points reveal screen |
| `VICTORY` | All 9 maps complete; shows final stats |
| `GAME_OVER` | Lives reached zero; shows level history |

### Canonical flow

```
MENU ──Play──▶ COUNTDOWN ──3s──▶ PLAYING ──Founding 23──▶ MAP_CLEARED
                  ▲                  │                          │
                  │                  ├─Pause──▶ PAUSED ─Resume──┤
                  │                  │                          ▼
                  │                  │                       BONUS
                  │                  │                          │
                  │                  │              ┌───────────┤
                  │                  │              ▼           ▼
                  └──── COUNTDOWN ◀──┴──Restart── (next level)  VICTORY (after last)
                                                                  │
                                     GAME_OVER ◀── lives = 0      │
                                        │                         │
                                        └────Restart──────────────┘
```

### Transition details

| From | To | Trigger | Duration | Effects |
|---|---|---|---|---|
| MENU | COUNTDOWN | Play button | 3000 ms | Deduct 1 credit, reset game state, load level 1 |
| COUNTDOWN | PLAYING | Auto (timer) | instant | Resume all managers; start BG music; if fresh start, reset spawn timing |
| PLAYING | PAUSED | P key or pause button | until resume | Pause coin → scaling → spawn managers (in that order); stop BG music; mute P-coin ambient loop |
| PAUSED | COUNTDOWN | Resume button | 3000 ms | Re-show countdown overlay; preserve all monster/coin state |
| PLAYING | MAP_CLEARED | 23rd Founding collected | 5000 ms | Stop BG music; play `Victory.wav` |
| MAP_CLEARED | BONUS | Auto | until animation done + 2000 ms | Show animated bonus counter |
| BONUS | COUNTDOWN | Auto | 3000 ms | Increment level; soft-reset coins (preserve spawn tokens); load next map |
| BONUS (last level) | VICTORY | Auto | — | Send `sendGameCompletion(...)` to host |
| PLAYING | GAME_OVER | Lives = 0 | instant | Stop BG music; play `gameover.wav` |
| GAME_OVER / VICTORY | COUNTDOWN | Restart button | 3000 ms | Deduct 1 credit; full reset; load level 1 |
| any | MENU | Quit-to-menu | instant | Clear all timers; reset state; exit tutorial if active |

### Pause/resume ordering (critical)

Order matters because of cross-manager event dependencies:

- **Pause order:** `coinManager → scalingManager → spawnManager` & `respawnManager`. Pause the coin manager first so its tick can't fire spawn events during the pause cascade.
- **Resume order:** `spawnManager → respawnManager → scalingManager → coinManager`. Resume the spawn manager first so when scaling unfreezes, monsters exist to scale.

### Resume-from-pause vs. fresh start

The flow `PAUSED → COUNTDOWN → PLAYING` and `MENU → COUNTDOWN → PLAYING` both go through `COUNTDOWN`. They look identical at the state-transition level but must be distinguished:

- **Fresh start (from MENU, GAME_OVER, BONUS):** spawn timer must reset; monsters re-spawn from schedule.
- **Resume from pause (from PAUSED):** spawn timer must NOT reset; the pause clock already accounts for paused time. Resetting would double-fire already-executed spawns.

The current code tracks `stateBeforeCountdown` on entering COUNTDOWN and skips `resetSpawnTiming()` on the PLAYING transition when that prior state was PAUSED. Preserve this distinction in Unity.

Additionally, during a **resume countdown**, the live monsters from before pause are frozen mid-position; the renderer hides them (they'd otherwise look "stale") and renders only the previews of as-yet-unfired spawn points.

---

## 5. Input Mapping

| Action | Default Keys | Notes |
|---|---|---|
| Move left | `A`, `←` | Constant speed (no acceleration) |
| Move right | `D`, `→` | Constant speed |
| Jump | `W`, `↑` | Hold to increase height (variable jump) |
| Super jump | `W`+`Shift`, `↑`+`Shift` | Higher peak |
| Fast fall | `S`, `↓` | Airborne only |
| Float | `Space` (hold) | Airborne only; ultra-slow descent |
| Pause | `P` | Only valid in PLAYING |
| Fullscreen | `F`, `F11` | Toggles canvas fullscreen |
| Confirm / Enter | `Enter` | UI navigation |
| Cancel / Escape | `Esc` | UI navigation |

All inputs use **edge detection** (key down / key up) where appropriate — for instance, a single jump fires on key-down, then the hold modifier extends it until release. In Unity, prefer the new Input System with action assets; map A/D, Arrow keys, W/S, Up/Down, Space, Shift, P, F, F11, Enter, Escape.

The Canvas version supports a mobile/touch overlay (not fully fleshed out in current code) — out of scope for the Unity port.

---

## 6. Player Character

### Identity

- **Sprite folder:** `assets/spritesV2/Sigurd` (default skin), `assets/spritesV2/SigurdPower` (power-mode skin)
- **Bounds:** 25 × 43 px
- **Lethal hitbox:** 24 × 42 px, centered
- **Anchor:** feet (sprite extends upward from the collision box)

### Movement (conceptual; Unity will handle the math)

- Horizontal velocity is constant magnitude; no acceleration. Holding left or right snaps to ±4 px/frame; releasing snaps to 0. There is no air-control penalty — the player moves equally well airborne.
- Vertical motion uses three gravity values:
  - **Normal** (default falling)
  - **Float** (~40× weaker; activated by holding Space while airborne; kills upward momentum on activation)
  - **Fast fall** (2× normal; activated by holding Down while airborne; also kills upward momentum if ascending)
- The player cannot float while grounded.

### Jump (variable-height, must replicate feel)

This is the most "feel-critical" mechanic.

- On jump-key-down while grounded: initial velocity = `-jumpPower * 0.6` (60% of full strength).
- While the key is **held**, velocity increases linearly toward `-jumpPower * 1.0` over a 300 ms window. The longer you hold (up to 300 ms), the higher you go.
- Releasing before 50 ms is treated as a 50 ms hold (a "minimum jump").
- Releasing the key, reaching 300 ms, or reaching the apex ends the jump-control window; gravity takes over.
- `SHIFT + jump` swaps `jumpPower = 7` for `jumpPower = 12` (super jump).
- An edge-latch prevents auto-re-jumping if the player lands while still holding the jump key.

Unity implementation: a coroutine or `Update`-driven state machine on a custom `PlayerController`. Don't use `Rigidbody2D.gravityScale` swaps mid-jump unless you handle the edge cases above explicitly.

### Float

- Activation: hold `Space` while airborne.
- On activation: any upward velocity is zeroed (`velocityY = 0`).
- While held: gravity multiplier ≈ `0.025` (i.e., 0.005 / 0.2). Feels like Sigurd is gliding/swimming downward.
- Release or landing exits float.

### Fast fall

- Activation: hold `Down` while airborne.
- On activation: any upward velocity is zeroed.
- While held: gravity multiplier = 2× normal.
- Release or landing exits fast fall.

### Power skin (cosmetic)

When a P-coin is collected and power mode begins, the player's sprite atlas is hot-swapped to the `SigurdPower` variant. All animations have a Power equivalent (same frame counts, same timings). When power mode ends, swap back to default. No mechanical difference — purely psychological feedback that the player has the upper hand.

### Animation states

| State | Trigger | Frames | Frame duration | Loop |
|---|---|---|---|---|
| `idle-left` / `idle-right` | grounded, no horizontal input | 6 | 130 ms | yes |
| `run-left` / `run-right` | grounded, horizontal input | 6 | 55 ms | yes |
| `jump-left` / `jump-right` | airborne, ascending, not floating | 3 | 100 ms | no |
| `fall-left` / `fall-right` | airborne, descending, not floating | 3 | 100 ms | no |
| `land-left` / `land-right` | one-shot on landing after airborne | 3 | 80 ms | no |
| `float-left` / `float-right` / `float-down` | Space held airborne | 6 | 120 ms | yes |
| `air-move-left` / `air-move-right` | airborne with horizontal input (recent change uses a single frozen run frame) | 1 | 120 ms | yes |
| `victory-left` / `victory-right` | MAP_CLEARED | 4 | 140 ms | yes |

Left-facing animations are mirrored right-facing versions. The "direction memory" is sticky: with no input, the player keeps the last horizontal facing for idle and jump.

### Death conditions

1. **Monster collision:** lethal hitbox overlaps an active monster's lethal hitbox in normal mode (any contact during power mode is harmless; the monster dies instead).
2. **Fall off screen:** `y > 575` (the bottom of the playfield).
3. **No other death sources.** No fall damage; no hazardous platforms.

A `deathInProgress` flag prevents re-entry while the death routine is running.

### Spawn / respawn indicator

When the player respawns, a 5-frame pulsating-ghost indicator plays at the respawn point for ~500 ms before the player sprite appears. The same indicator pattern is used for monsters about to spawn. In Unity, this is a separate sprite prefab with a short Animator that auto-destroys.

---

## 7. Foundings (Collection Logic)

Source: `src/managers/foundingManager.ts`, `src/types/interfaces.ts` (`Founding` interface).

Foundings are the level's primary collectibles — 23 per map. Each has:

```typescript
interface Founding {
  x: number;
  y: number;
  width: number;          // 25
  height: number;         // 25
  order: number;          // 1..N (unique within the level)
  group: number;          // 1..6 (multiple groups per level)
  isCollected: boolean;
  isBlinking: boolean;    // true if it's the next-correct one
  isCorrect?: boolean;    // set on collection
}
```

### Sequence logic

Each map defines `groupSequence: number[]` — an ordered list of group IDs. Within a group, Foundings are collected in **ascending order**. Between groups, the player must finish all Foundings in the current group before the next group becomes "active" (next-correct).

Example for level 1 (6 groups, 23 foundings):
- groupSequence = `[1, 2, 3, 4, 5, 6]`
- Group 1: foundings 1, 2, 3 (collected in order 1 → 2 → 3)
- Group 2: foundings 4, 5, 6, 7
- Group 3: foundings 8, 9, 10, 11
- … etc.

The "next correct" Founding is always the lowest uncollected `order` within the active group.

### Collection rules

When the player overlaps a non-collected Founding:

1. **If it's the next-correct one (firefounding):**
   - `isCorrect = true`, `isCollected = true`
   - Award **200 points × current multiplier**
   - Add **2 P-coin tokens** (drives P-coin spawning, see §11)
   - Add 200 multiplied points to the "founding & monster" thresholdable score pool (drives B-coin spawning)
   - Increment "correct order count" (used for end-of-level bonus)
   - Advance `nextFoundingOrder` (within group, or to next group)
2. **If it's out-of-sequence (normal founding):**
   - `isCorrect = false`, `isCollected = true`
   - Award **100 points × current multiplier**
   - Add **1 P-coin token**
   - Add 100 multiplied points to the thresholdable pool

### Visual indicator

Only the next-correct Founding has `isBlinking = true`. The renderer alternates its sprite between a "lit" and "unlit" variant (or applies a glow) so the player knows which one to chase. After each collection, the blinking flag is moved to the new next-correct Founding.

### Win condition

When `collectedFoundings.length === 23`, the FoundingManager raises a `gameCompleted` event. The state machine transitions PLAYING → MAP_CLEARED → BONUS.

### End-of-level bonus (flat, unmultiplied)

| Correct-order count | Bonus points |
|---|---|
| 23 (perfect) | **50,000** |
| 22 | 30,000 |
| 21 | 20,000 |
| 20 | 10,000 |
| < 20 | 0 |

The bonus is **not** multiplied by the multiplier, and does **not** count toward the B-coin / multiplier thresholds (would be a self-inflating loop).

### Floating-text feedback

On Founding pickup, a floating "+200" or "+100" text appears at the pickup position (color: white, font: pixel, size: ~15 pt, duration: 1000 ms, drifts upward and fades). If the multiplier is > 1, the text shows the formula: e.g., `"200 × 3"`.

### What the rename means

The Canvas codebase recently renamed "Bombs" → "Foundings" everywhere. The original concept came from Bomb Jack — "Bombs" was a holdover. The narrative is now: Sigurd collects business ideas / Forretningsideer that gather like sparks across the level. If you see old references to `BombManager`, `bombSpawnPoints`, `firebombCount`, etc. in older docs (e.g., `specs/game-spec.md.md`), they're all the same thing as `FoundingManager`, `foundingSpawnPoints`, `firefoundingCount`.

---

## 8. Monster System

There are **six monster types** currently in the game. Three are spawned directly into the world (Bureaucrat, Wisp, TaxGhost), one is spawned directly but rare (Founder), and two only exist as transformation results of a Bureaucrat hitting the floor (Consultant, Robot). All inherit a common base interface; type-specific fields live in subtypes.

Common monster fields (`src/types/interfaces.ts`):

```typescript
interface MonsterBase {
  x, y, width, height: number;
  color: string;
  speed: number;
  direction: -1 | 1;                 // facing
  isActive: boolean;
  isFrozen: boolean;                 // during power mode
  isBlinking: boolean;               // pre-unfreeze warning
  isDead: boolean;
  deathTime: number;
  respawnTime: number;
  originalSpawnPoint: { x, y };
  individualSpawnTime: number;       // for per-monster scaling
  isLethal: boolean;                 // spawn invulnerability
  mutationEndTime?: number;          // post-power-mode pass-through window
}
```

Each monster type is implemented as one of five **movement classes** in `src/managers/monster-movements/`. The `MonsterBehaviorManager` is a dispatcher: each frame it loops through active monsters and calls the corresponding movement class's `update()`. Frozen and inactive monsters are skipped. After all movements, `MovementUtils.clampToBoundaries()` keeps everything in-bounds as a safety net.

### 8.1 Bureaucrat (`BUREAUCRAT`) — Horizontal patroller

- **Sprite:** `spritesV2/Bureaucrat`. Color: dark blue / bureaucrat blue.
- **Bounds:** 25 × 39 (feet anchor). Hitbox: 18 × 32.
- **Base speed:** 1.0 px/frame. Max ~2.5. Scaling: +0.05/sec.
- **Movement (`PatrolMovement.ts`):** Walks left-right on its host platform between `patrolStartX` and `patrolEndX`. After traversing the platform `walkLengths` times (default 1), it stops patrolling and falls — clearing the platform footprint horizontally, then gravity-falling until it hits a platform below or the canvas bottom.
- **Transform mechanic:** When it lands at the canvas bottom (or after the configured number of patrols), it plays a ~560 ms transition animation (`isTransitioning = true`) and morphs into its `transformTarget` (default `CONSULTANT`; can be `WISP`, `TAXGHOST`, `FOUNDER`, `ROBOT`, or `NONE` for "die instead of morph"). The morphed monster then runs its own behavior class.
- **Spawn invulnerability:** `isLethal = false` until the first direction change (so a Bureaucrat spawning right under the player doesn't instakill).
- **Respawn:** owned by its spawn point's `respawnInterval`, NOT by the global respawn manager. Bureaucrats killed during power mode re-spawn on their next scheduled tick.

### 8.2 Wisp (`WISP`) — Cardinal-hopping chaser

- **Sprite:** `spritesV2/Wisp`. Color: cyan / spectral light.
- **Bounds:** 30 × 52. Hitbox: 22 × 42.
- **Base speed:** 1.5 px/frame, scaling +0.05/sec.
- **Spawn:** auto-injected by `LevelManager` once per level (not authored in maps). Spawns in one of four corners; per-level speed scales linearly from 0.7× at level 1 to 1.1× at level 9.
- **Movement (`ChaserMovement.ts`):** The wisp tracks a **delayed snapshot** of the player position (refreshed every ~500 ms). It rests between hops (no motion), then plans the next hop using **A* on a coarse grid** (cell size ≈ wisp.width / 2) with platforms and ground as obstacles, cardinal-only neighbors, Manhattan heuristic, capped at ~300 iterations. The wisp walks the first few waypoints (up to 50 px), then idles until the next rest expires. The combined "tiebreak across first 4 waypoints" logic prevents jitter when A* picks slightly different first cells frame-to-frame.
- **Bumps:** four bump-direction animations play once on collision with an obstacle.
- **No cached paths** — wisp hops can cover multiple cells in a single decision, so cached A* paths become "backwards" within a few frames.

### 8.3 TaxGhost (`TAXGHOST`) — Wanderer + ambusher

- **Sprite:** `spritesV2/TaxGhost`. Color: ghostly gray.
- **Bounds:** 38 × 36. Hitbox: 28 × 28.
- **Base speed:** 2.5 px/frame. Max ~4.0. Scaling: +0.1/sec.
- **Movement (`AmbusherMovement.ts`):** Two-state machine:
  - **Wandering:** picks random 2D targets, changes direction every 2–4 seconds. Speed is proximity-modulated: slow when close to the player (factor near), fast when far (factor far), interpolated over a configurable distance ramp. The intuition: "feels like it's stalking when you're close, hunting when you're far."
  - **Ambushing:** every ~8000 ms (scales down to ~500 ms with difficulty), it snapshots the player's current position, charges straight at it at 3× speed, and reverts to wandering when it reaches the target (distance < 5) or hits an obstacle.
- **No pathfinding.** Validates each move against platforms/boundaries with `MovementUtils.isMovementSafe`. On a wander collision, it immediately picks a new direction (billiard-ball ricochet).

### 8.4 Founder (`FOUNDER`) — Inertial bouncer with surprise homing

- **Sprite:** `spritesV2/Founder`. Color: bright yellow / gold. Theme: "the founder who keeps coming back."
- **Bounds:** 30 × 40. Hitbox: 22 × 32.
- **Base speed:** 3.0 px/frame. Max ~4.5. Scaling: +0.1/sec.
- **Movement (`FloaterMovement.ts`):** Inertial straight-line motion. Each frame it moves by its velocity; on collision with any platform/wall/boundary, it reflects the appropriate velocity component elastically. Bump animations play one-shot on collision.
- **Surprise bursts:** periodically (`nextSurpriseTime` with random jitter), the Founder redirects its velocity directly at the player at boosted magnitude for a short window (`FOUNDER_SURPRISE_DURATION`). After the window, it goes back to inertial bouncing and schedules the next burst.
- The combined effect: feels like a chaotic ball that occasionally remembers it has a target.

### 8.5 Consultant (`CONSULTANT`) — Vertical-column chaser

- **Sprite:** `spritesV2/Consultant`. Color: purple / dark violet.
- **Bounds:** 30 × 30. Hitbox: 22 × 24.
- **Base speed:** 1.2 px/frame.
- **Spawn:** never directly — only as the transformation result of a Bureaucrat hitting the floor.
- **Movement (`AirborneMovement.ts`):** Spring-like homing on the player's X axis (bounded to canvas width), with edge-to-edge Y bouncing. Each axis updates independently. Homing strength ramps from 0 → full over a per-type duration to avoid an instant snap. Each instance gets a one-shot per-monster jitter (random scale 0.7–1.3 on the spring constant, ±15 px lane offset) so multiple Consultants don't oscillate in sync.

### 8.6 Robot (`ROBOT`) — Horizontal-row chaser

- **Sprite:** `spritesV2/Robot`. Color: red-orange.
- **Bounds:** 30 × 40. Hitbox: 22 × 32.
- **Base speed:** 1.4 px/frame.
- **Spawn:** never directly — only as a Bureaucrat transformation target (when a map's spawn point specifies `transformTarget: 'ROBOT'`).
- **Movement (`AirborneMovement.ts`):** Mirror of Consultant — homing on player Y axis (bounded to canvas height), edge-to-edge X bouncing. Same jitter mechanic.

### 8.7 Removed: Vertical Patrol

Old code and assets exist for a "vertical patroller" Bureaucrat variant — sprite folder `assets/sprites/vertikal-byråkrat`, movement class `HorizontalPatrolMovement.ts` (the naming is historical). It is **not wired** into the current dispatcher. Skip it for the Unity port. The current Bureaucrat behavior (horizontal patrol + gravity drop + transformation) supersedes it.

### 8.8 Spawn invulnerability ("isLethal" gate)

Newly spawned monsters have `isLethal = false`. They become lethal once their movement class performs its first state change (e.g., a Bureaucrat hitting a patrol bound, a Wisp completing its first hop, etc.) — this is what `armMonsterAsLethal` does. The reason: spawn animations play at the spawn point, and if a Bureaucrat happens to materialize underneath the player, you don't want an unavoidable death.

### 8.9 Bumps and bump animations

Wisp, Founder, Consultant, Robot all play one-shot `bump-{horizontal|vertical}-{left|right}` animations on collision. The animation is rendered for one frame's worth of progress, then the bounds/sprite resets. Facing for the bump sprite is derived from the velocity at collision (or `monster.direction` if velocity X is near zero).

---

## 9. Difficulty Scaling

Source: `src/managers/ScalingManager.ts`.

Every monster's relevant stats (speed, ambush interval, bounce angle, etc.) scale linearly with **time elapsed since the level started**, capped at a per-stat maximum. Scaling is paused during:

- COUNTDOWN, PAUSED, BONUS, MAP_CLEARED, VICTORY, GAME_OVER, MENU
- Power mode (when a P-coin has been collected)
- Tutorial missions (typically; some missions allow scaling)

### Per-stat scaling formula

For a stat with `base`, `scaling` (per second), and `max`:

```
elapsedSeconds = (now − levelStartTime − totalPausedMs) / 1000
scaledValue    = min(base + scaling * elapsedSeconds, max)
```

### Per-monster vs. global

Each monster carries `individualSpawnTime` — the wall-clock moment it actually entered play. Its "age" is computed as `(now − totalPausedMs − individualSpawnTime) / 1000`, so a fresh monster mid-level starts at base difficulty even if the level has been running for 60 seconds. Implementation: `ScalingManager.getMonsterScaledValues(monster)`.

### Pause reasons (composable)

The pause uses a `Set<PauseReason>` so multiple independent reasons (e.g., manual pause + power mode) can pause simultaneously. The manager only unfreezes when the last reason is removed.

| Reason | Used by |
|---|---|
| `Default` | Manual pause, state transitions |
| `PowerMode` | P-coin collection freezes scaling |
| `MonsterScaling` | (legacy; rarely used) |

### Approximate scaling targets

| Stat | Patrol | Wisp/Chaser | Founder/Floater | TaxGhost/Ambusher | Consultant | Robot |
|---|---|---|---|---|---|---|
| Speed base | 1.0 | 1.5 | 3.0 | 2.5 | 1.2 | 1.4 |
| Speed max | ~2.5 | ~2.0 | ~4.5 | ~4.0 | ~2.0 | ~2.2 |
| Speed scaling /sec | +0.05 | +0.05 | +0.1 | +0.1 | +0.05 | +0.05 |
| Ambush interval base/max | — | — | — | 8000 ms → 500 ms | — | — |
| Surprise interval | — | — | random within range | — | — | — |

All values are live-tunable through the in-game tuning panel (see §22). The numbers above are current defaults; treat them as starting points and re-tune in Unity to match the Canvas feel.

---

## 10. Power Mode & Frozen State

When a P-coin is collected, "power mode" begins for a duration that depends on the coin's color tier (3–10 seconds). During power mode:

1. Every active monster gets `isFrozen = true`. Movement classes skip frozen monsters.
2. All monsters render in their frozen visual state (typically tinted blue or with a freeze overlay).
3. The player can kill any monster on contact. Kills earn an escalating point bounty (see §12).
4. `ScalingManager` pauses with reason `PowerMode`.
5. `OptimizedRespawnManager` also pauses with reason `PowerMode` so dead monsters' respawn timers don't tick during the power window.
6. Background music stops; a synthesized power-up melody plays for the duration; a low-volume "ambient" power-coin loop plays under it.
7. The player sprite swaps to the Power skin.
8. Approximately 2 seconds before power mode ends, monsters start blinking (`isBlinking = true`) as a warning.

When power mode ends:

- All monsters' `isFrozen` and `isBlinking` go false.
- Each monster's `mutationEndTime` is set to `now + MUTATION_PASSTHROUGH_MS` (a few hundred ms). During that window, player-monster collision is **ignored**. This is critical because a Bureaucrat that transformed into a Consultant during power mode will morph back on unfreeze — without the pass-through, the player would instantly die from a Consultant materializing on them.
- Movement-class time-based fields (`nextHopTime`, `lastSeenAt`, `nextSurpriseTime`, etc.) are shifted forward by the freeze duration so they don't think a huge chunk of time elapsed.
- Background music resumes; power-up melody and ambient loop stop.
- Player skin swaps back to default.
- `ScalingManager` and `OptimizedRespawnManager` resume.

### Frozen visual

- Render color: blue (`#4444FF`) overlay, or the monster's "frozen" sprite variant if it has one.
- Pre-unfreeze blink: alternate between frozen blue and normal color at ~300 ms intervals during the final 2 seconds.

---

## 11. Coin System

Source: `src/managers/coinManager.ts`, `src/config/coinTypes.ts`, `src/config/coins.ts`, `src/lib/bjRules.ts`.

There are **four coin types**: P (power), B (bonus multiplier), M (extra life), F (Founder Mode / business idea). All four are 25 × 25 px and rendered as pixel-octagons with a centered letter (P, B, M, F).

### 11.1 P-Coin (Power Coin)

**Spawn condition (token system):**

Each Founding pickup adds tokens to a `pCoinTokens` counter:
- Firefounding (correct order): **+2 tokens**
- Normal founding (wrong order): **+1 token**

When `pCoinTokens >= POWER_COIN_SPAWN_INTERVAL` (default **18**), a P-coin spawns and `pCoinTokens` decrements by 18. Tokens do NOT accrue while a P-coin is alive on screen (prevents stacking).

**Per-level cap:** **2** P-coins per level.

**Physics:** "Reflective" — bounces elastically off platforms, walls, and boundaries like a Pong ball. Spawns with an angle (configurable per spawn point), travels in a straight line, never falls.

**Color cycle:** The P-coin advances through 7 color tiers, with color advancing on **player actions** (jump start, wall hit, fall-off-platform), not over time. Each tier has its own base points and power-mode duration:

| Index | Name | Hex | Base points | Duration |
|---|---|---|---|---|
| 0 | Blue | `#8fb7ff` | 100 | 3000 ms |
| 1 | Pink | `#ee90cb` | 200 | 4000 ms |
| 2 | Purple | `#8465ec` | 300 | 5000 ms |
| 3 | Lime | `#abdd64` | 500 | 6000 ms |
| 4 | Cyan | `#22d3ee` | 800 | 7000 ms |
| 5 | Yellow | `#eab308` | 1000 | 8000 ms |
| 6 | Gray | `#91a6b0` | 2000 | 10000 ms |

After index 6, the color wraps back to 0. The color index **persists across levels** and only resets on game-over.

**On collection:**

1. Award `basePoints * currentMultiplier` (multiplied).
2. Begin power mode for the color's duration.
3. Floating text: e.g. `"500 × 3"`.
4. Stop ambient loop; start power-up melody.

### 11.2 B-Coin (Bonus Multiplier)

**Spawn condition:** Every **5000 thresholdable points**. Thresholdable sources are:
- Founding pickups (multiplied)
- Monster kills during power mode (multiplied)
- Trampoline events: 10 base × multiplier per jump-start / wall-hit / fall-off

NOT thresholdable (don't count toward this milestone): coin pickups, end-of-level bonus.

**Per-level cap:** **5** B-coins.

**Physics:** "Gravity-only" — falls straight down at a fixed speed, lands on platforms (within ~4 px tolerance), then walks along the platform at a slower speed (1 px/frame). When it reaches a platform edge, it falls off and resumes falling. On the ground, it walks back and forth.

**On collection:**

1. Award **500 flat points** (NOT multiplied — prevents a "money glitch" where each B-coin's multiplier scales the next B-coin).
2. **Bump multiplier by 1**, capped at 5×. This is the *only* source that advances the multiplier without going through the score-threshold gate.
3. Floating text: `"1000 × {mult}"` (visual; the actual points were 500 flat).

### 11.3 M-Coin (Extra Life)

**Spawn condition:** Every **8 B-coins collected**, with a "death generosity" head-start: each life lost grants up to `2` virtual credits toward the next M-coin, capped at the actual B-coin count.

Formula:
```
effective = bonusCoinsCollected + min(2 * livesLost, bonusCoinsCollected)
spawn when floor(effective / 8) > previousMilestone
```

This means a player who dies a lot can still earn M-coins faster, but never *only* from dying (the cap prevents `0 B-coins + 5 deaths` from spawning anything).

**Physics:** Same gravity-only behavior as B-coin.

**On collection:**

1. Award **1000 base × multiplier** points.
2. Grant **+1 life** (`stateStore.addLife()`), capped at `MAX_LIVES = 9`.
3. Floating text: `"1000 × {mult}"`.

### 11.4 F-Coin (Founder Mode / FAFO)

**The high-stakes wildcard.** Theme: "Send it." Sigurd rolls the dice on a wild idea.

**Spawn condition (per-run lottery):**

1. **Once at game start:** roll a 5% chance (`F_COIN_RUN_CHANCE = 0.05`) that this run will get F-coins at all.
2. If the roll hits, randomly pick a **target level** in `[F_COIN_MIN_LEVEL = 2, F_COIN_MAX_LEVEL = 8]` (level 1 excluded as a rookie gate).
3. When the player enters the target level, randomly pick a **Founding count trigger** in `[F_COIN_TRIGGER_MIN_FOUNDING = 1, F_COIN_TRIGGER_MAX_FOUNDING = 23]`.
4. When that many Foundings have been collected in this level, spawn the F-coin from a BONUS-type spawn point (preferred) or a fallback random mid-canvas position.

**Per-run cap:** **2** F-coins (defense in depth; rarely hit at 5% rate).

**Color:** Orange `#f97316`. Letter: `F`. Physics: gravity-only (same as B/M).

**On collection:**

1. **Award no score.** The reward is external.
2. Call `window.sigurdGame.grantBusinessIdea(1)` via the bridge — fire-and-forget. The host's backend awards the player +1 Forretningsidé credit (real-world currency).
3. Floating text: `"+1 💡"` (orange, larger font 18 pt, 1500 ms duration — distinctly different from coin pickups).
4. Play a unique rising-arpeggio synthesized SFX (different from the standard coin chime).

**CRITICAL — host responsibility:**

Because the F-coin call mints paid currency, the landing-page backend MUST validate server-side:
- Signed game-session token
- Per-run cap mirror (`F_COIN_RUN_CAP`)
- Rate limit
- `amount === 1` (reject anything else)

Without these checks, browser devtools = free credits. The Unity port should preserve this contract: never trust the client to determine when the grant happens.

### 11.5 Persistence

| State | Resets on level transition? | Resets on game over? |
|---|---|---|
| `firefoundingCount` (P-coin token pool drives this) | NO | YES |
| `foundingAndMonsterPoints` (B-coin threshold) | NO | YES |
| `pCoinTokens` | NO | YES |
| `pCoinColorIndex` | NO | NO (persists as a "franchise stat") |
| `triggeredSpawnConditions` (milestone dedup) | NO | YES |
| `bCoinSpawnsThisLevel`, `pCoinSpawnsThisLevel` (caps) | YES | YES |
| F-coin run state (`fCoinTargetLevel`, `fCoinSpawnsThisRun`) | NO | YES |
| `firefoundingCount` for P-coin tokens | Resets on player death (extra survival incentive) | YES |
| Active coins on screen | YES (cleared on level transition) | YES |

---

## 12. Scoring & Multipliers

Source: `src/lib/bjRules.ts`, `src/stores/game/scoreStore.ts`, `src/config/scoring.ts`.

### Base points

| Source | Base | × multiplier? | Counts toward thresholds? |
|---|---|---|---|
| Firefounding (correct order) | 200 | YES | YES |
| Normal founding (wrong order) | 100 | YES | YES |
| Monster kill during power mode | 100 / 200 / 300 / 400 / 500 / 600 (escalating per kill in session) | YES | YES |
| P-coin pickup | 100 – 2000 (by color tier) | YES | NO |
| B-coin pickup | 500 | NO (flat) | NO |
| M-coin pickup | 1000 | YES | NO |
| F-coin pickup | 0 | — | NO (grants Forretningsidé instead) |
| Trampoline event (jump / wall-hit / fall-off) | 10 | YES | YES |
| End-of-level bonus | per table (§7) | NO (flat) | NO |

### Multiplier system

| Level | Cumulative threshold (thresholdable score) |
|---|---|
| 1× (default) | 0 |
| 2× | 1,800 |
| 3× | 3,600 |
| 4× | 5,400 |
| 5× (max) | 7,200 |

- Progression: every **1800 thresholdable points** advances the multiplier by 1, up to 5×.
- The progression counter (`multiplierScore`) resets to 0 at each tier-up (so the next-level progress bar starts empty).
- **B-coin bypasses the gate:** each B-coin directly bumps multiplier by +1 (capped at 5×), independent of `multiplierScore`.
- **Reset:** multiplier resets to 1 on player death and on game over. Persists across level transitions otherwise.

### Monster kill escalation (during power mode)

Within a single power-mode session, consecutive kills earn increasing base points:

| Kill # | Base |
|---|---|
| 1 | 100 |
| 2 | 200 |
| 3 | 300 |
| 4 | 400 |
| 5 | 500 |
| 6+ | 600 (capped) |

The counter resets when power mode starts (so each P-coin gives a fresh kill ladder). All kills are multiplied by the current multiplier.

### Two score-addition paths

- `addScore(points)` — multiplies by current multiplier, adds to total and to `levelScore`.
- `addRawScore(points)` — adds without multiplication. Used for B-coin flat 500.

### Floating-text formats

| Event | Text | Color | Duration | Font size |
|---|---|---|---|---|
| Firefounding | `200` or `200 × N` | white | 1000 ms | 15 |
| Normal founding | `100` or `100 × N` | white | 1000 ms | 15 |
| P-coin | `{base} × {mult}` | white | 1000 ms | 15 |
| B-coin | `1000 × {mult}` (shown as 1000 even though flat 500) | white | 1000 ms | 15 |
| M-coin | `1000 × {mult}` | white | 1000 ms | 15 |
| F-coin | `+1 💡` | orange `#f97316` | 1500 ms | 18 |
| Monster kill | raw points | white | 1000 ms | 15 |

All floating texts drift upward ~50 px while fading out.

---

## 13. Lives, Death & Respawn

### Starting state

- Player starts with **3 lives**.
- Each level reload uses the map's `playerStart` position.

### Death (when lives > 1)

1. Set `deathInProgress` flag (prevents re-entry into death handler).
2. Stop power-up effects, ambient loop, background music.
3. Play `MONSTER_HIT` sound.
4. Decrement lives. Reset multiplier to 1.
5. Capture "killer info" (monster type and its original type if transformed) for analytics.
6. Reset player to `map.playerStart`.
7. Reset all monsters to their original spawn points (clears `isDead`, `isFrozen`, etc.).
8. Reset spawn manager schedule for the current map (re-arm spawns).
9. Reset difficulty scaling (zero out elapsed time).
10. Reset `firefoundingCount` to 0 (forces re-earning of next P-coin).
11. Transition PLAYING → COUNTDOWN → PLAYING (3-second countdown).
12. Clear `deathInProgress`.

### Death (when lives == 1)

1. Set `deathInProgress`.
2. Stop all audio. Play `GAME_OVER` sound (not the monster-hit sound).
3. Record partial level data (foundings collected, etc.) for the level-history table.
4. Decrement lives to 0. State → GAME_OVER.
5. Clear `deathInProgress`.

### Falling off-screen

Same flow as monster death — routed through the same `handlePlayerDeath()` entrypoint.

### Monster respawn

Source: `src/managers/OptimizedRespawnManager.ts`.

- Non-Bureaucrat monsters that die are queued for respawn at a per-type delay (default ~5000 ms for all types).
- Bureaucrats are **not** queued — their respawn cadence is driven by their spawn point's `respawnInterval`.
- During the final ~3 seconds before respawn, a pulsating ghost indicator shows at the spawn point.
- When the timer elapses, the monster is restored to `originalSpawnPoint` with reset fields (clear frozen/blink/death/velocity; restore `originalType` if it was transformed; reset patrol bounds for Bureaucrats; reset per-monster scaling).
- The respawn timer is wall-clock based but subtracts `totalPausedMs`, so pausing doesn't accidentally speed up or stall respawns.
- During tutorial KILL mission, respawn is skipped — the player has a finite number of monsters to kill.

### Restart flows

| Source | Action |
|---|---|
| Pause menu → Restart | Deduct 1 credit; full reset; load level 1; COUNTDOWN |
| GAME_OVER → Retry | Deduct 1 credit; full reset; load level 1; COUNTDOWN |
| VICTORY → Play again | Deduct 1 credit; full reset; load level 1; COUNTDOWN |
| Tutorial → Restart | No credit; re-run current tutorial mission |
| Quit to menu | No credit; exit tutorial if active; reset to MENU |

---

## 14. Maps & Level Content

Source: `src/maps/mapDefinitions.ts` (1596 lines). Each map is a static TypeScript object exported as an array.

### The nine campaign levels

| Level | id | Display name | Theme / location | Floor | Background |
|---|---|---|---|---|---|
| 1 | `level1` | soverommet | "the bedroom" — where it all starts | yellow-clean | `soverommet.png` |
| 2 | `level2` | garasjen | "the garage" | gray-striped | `garasjen.png` |
| 3 | `level3` | startup lab | accelerator co-working space | gray-clean | `startup-lab.png` |
| 4 | `level4` | innovasjon norge | Innovation Norway gov funding | gray-striped | `innovasjon-norge.png` |
| 5 | `level5` | skatteetaten | Norwegian tax authority | blue-striped | `skatteetaten.png` |
| 6 | `level6` | nav | Norwegian welfare admin | orange-striped | `nav.png` |
| 7 | `level7` | banken | the bank | purple-striped | `banken.png` |
| 8 | `level8` | alltinn norge | Altinn (gov digital services) | green-striped | `altinn.png` |
| 9 | `level9` | silicone vally | Silicon Valley | red-striped | `silicone-valley.png` |

All maps are 800 × 600. All player starts are around `(387.5, 282.5)` (mid-canvas, slightly above center).

### MapDefinition structure

```typescript
interface MapDefinition {
  id: string;
  name: string;                          // display name
  width: 800;
  height: 600;
  background: string;                    // asset key
  floor: FloorType;                      // tile-theme key
  playerStart: { x: number, y: number };
  spawnIndicatorColor: string;           // hex
  groupSequence: number[];               // ordered group IDs
  platforms: Platform[];
  foundings: Founding[];                 // 23 of them
  monsters: Monster[];                   // initial spawns
  monsterSpawnPoints: MonsterSpawnPoint[];
  coinSpawnPoints: CoinSpawnPoint[];
}
```

### Platform definition

```typescript
interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;                        // typically 25
  color: string;                         // fill
  strokeColor: string;                   // border (typically "#000")
  tileTheme?: string;                    // e.g. "platform-green", "platform-gray"
  roundedCorners?: { tl, tr, bl, br: boolean };  // chamfered corners
  isVertical?: boolean;                  // wall (rare)
}
```

- Standard platforms are horizontal rectangles, 25 px thick. Pixel-art chamfered corners are an aesthetic touch — corners can be "cut" diagonally per the `roundedCorners` flag.
- Vertical platforms (walls) are 15 px wide and variable height. Used sparingly.
- The optional `tileTheme` swaps the solid color for a tiled texture (green / blue / beige variants exist in `assets/horizontal-platforms/` and `assets/vertical-platforms/`).

### Floor (decorative)

The canvas bottom 25 px is a striped or clean tile strip (visual only; physics floor is at `y = 575`). Floor variants per map:

- Striped: yellow-striped, gray-striped, blue-striped, orange-striped, purple-striped, green-striped, red-striped
- Clean: yellow-clean, gray-clean

Each is a 32×32 source tile rendered horizontally across 800 px (~25 tiles).

### Founding layout

23 Foundings per map, distributed across 5–6 groups. Group sizes vary (e.g., 3 in group 1, 4 in group 2, etc.). The `groupSequence` array defines the order groups become active. Within a group, foundings collect in ascending `order`.

### Monster spawn points

```typescript
interface MonsterSpawnPoint {
  spawnDelay: number;          // ms after level start
  createMonster: () => Monster; // factory function returning a new instance
  color?: string;              // optional override
  respawnInterval?: number;    // 0 = one-shot; > 0 = repeat every N ms
  maxSpawns?: number;          // 0 = unlimited; cap total spawns
}
```

The spawn manager pre-sorts these by `spawnDelay`. On each tick, it checks if any scheduled spawn's time has come, calls `createMonster()`, adds the result to the world, and (for continuous spawns) bumps `scheduledTime` forward by `respawnInterval` until either the cap is hit or the level ends.

**Catch-up guard:** if the tab is backgrounded long enough that the new `scheduledTime` is still in the past, snap it forward to "one interval from now" so the player doesn't get a burst of owed spawns when refocusing.

### Coin spawn points

Each map authors specific points where P, B, M, F coins can spawn (with angles for P-coins). The coin manager picks an appropriate spawn point when conditions are met.

```typescript
interface CoinSpawnPoint {
  x: number;
  y: number;
  type: 'POWER' | 'BONUS_MULTIPLIER' | 'EXTRA_LIFE' | 'FOUNDER_MODE';
  spawnAngle?: number;     // degrees, for P-coin trajectory
}
```

### Wisp auto-spawn

Each level gets one wisp spawned by `LevelManager` (not authored in the map). The wisp picks a random corner of the canvas, with its speed scaling linearly from 0.7× at level 1 to 1.1× at level 9.

### Per-map music?

Currently the same background music loops across all levels. Some end-state events (MAP_CLEARED, GAME_OVER) play one-shot WAVs. Per-map music could be added but isn't current.

---

## 15. Tutorial System

Source: `src/tutorials/missions.ts`, `src/managers/TutorialManager.ts`.

There are **4 tutorial missions**, accessible from the main menu via TutorialSelect. Each uses a small custom map and ends as soon as its objective is met.

| ID | Title (Norwegian) | English | Map | Objective | Time/cond. |
|---|---|---|---|---|---|
| `MOVEMENTS` | Bevegelse 101 | "Movement 101" | movementsMap | Complete 6 sub-tasks: moveLeft, moveRight, jump, superJump, float, fastFall | No time limit |
| `FOUNDINGS` | Finansieringer | "Foundings" | foundingsMap | Collect all 14 foundings (subset of full 23) | Track correct-order count |
| `SURVIVE` | Overlev byråkratiet | "Survive bureaucracy" | surviveMap | Survive 30 seconds of monster swarming | 30000 ms |
| `KILL` | Politisk Ryggvind | "Political tailwind" | killMap | Activate P-coin, kill 4 initial Bureaucrats before power mode expires | bounded by P-coin duration |

### Tutorial differences from main game

- **No credit deduction.** Tutorials are free.
- **No score recorded.** Bypasses the scoring system.
- **No background music.** Silent for focus.
- **No difficulty scaling.** Each mission ships with its tuned monster set.
- **Isolated maps.** Tutorial maps don't reuse the campaign maps.
- **Result UI is mission-specific.** Each mission shows different stats (sub-tasks complete, foundings collected, survival time, monsters killed).

### Mission 1: MOVEMENTS

Six sub-tasks tracked independently. The `PlayerManager` raises a `markTutorialSubTask(key)` event when each is performed:

- `moveLeft` — first time A or Left is pressed.
- `moveRight` — first time D or Right is pressed.
- `jump` — first time W or Up triggers a jump.
- `superJump` — first time Shift+jump triggers a super jump.
- `float` — Space held for 250 ms airborne.
- `fastFall` — Down held for 250 ms airborne followed by a ground touch.

Mission completes when all 6 are marked. Result text: "6/6 oppgaver" + elapsed time.

### Mission 2: FOUNDINGS

`foundingsMap` has 14 foundings (fewer than a full map) arranged in groups. The player must collect them all. The result shows both `plukket: "14/14"` (total picked up) and `riktig rekkefølge: "X/14"` (collected in correct order).

### Mission 3: SURVIVE

`surviveMap` is loaded with a denser-than-usual monster set. The mission ends when the player has survived 30000 ms. If they die first, the mission ends as "failed" with their actual survival time recorded.

### Mission 4: KILL

This is the most scripted mission.

- `killMap` has:
  - 4 Bureaucrats placed at `(100, 175)`, `(525, 175)`, `(125, 400)`, `(525, 400)` with patrol distance 150 px, alternating initial directions.
  - All 4 Bureaucrats have `transformTarget: 'CONSULTANT'` (so if they hit the floor, they become Consultants).
  - 1 Founder at `(575, 500)`.
  - 1 Wisp at `(200, 50)` with 5000 ms initial delay and 5000 ms respawn interval.
  - **A single P-coin** at `(50, 225)` with a 53° spawn angle.
- After 100 ms of mission start, the P-coin is force-spawned (`scheduleKillPcoinSpawn`).
- On player death during the mission, the P-coin is re-spawned to give another attempt (this is what the recent commit "Mission 4 P-coin respawn" added).
- The mission **completes** when power mode ends (the player triggered the P-coin and rode the timer down). The result records `byråkrater nedlagt: "X/4"` (bureaucrats killed) and the title "Politisk Ryggvind."
- Note: the mission doesn't require the player to kill all 4; it completes regardless of kill count, scoring "X/4". The point is to teach the P-coin loop.

### Tutorial flow

1. From MENU, the user opens `TUTORIAL_SELECT` and sees the four missions as cards.
2. Clicking a card opens `TUTORIAL_BRIEF` with the mission title, description (Norwegian flavor text), goal text, and Start/Skip/Cancel.
3. Start → load the mission's custom map, COUNTDOWN, PLAYING.
4. Mission ends → `TUTORIAL_RESULT` menu shows stats + Next Mission / Back to Select.
5. `goToNextTutorialMission` walks the `TUTORIAL_MISSION_ORDER` array (so the player can complete them sequentially or in any order).

---

## 16. UI, Menus & HUD

The UI layer is React (in the Canvas codebase). For Unity, use Unity's UI Toolkit (UIElements) or uGUI — the structure below is engine-agnostic.

### Menus

| Screen | Content |
|---|---|
| **Start** (MENU+START) | Title "SIGURD STARTUP", balance display (if bridge), Play button (costs 1 credit), Settings, Controls, Tutorial |
| **Tutorial Select** | Grid of 4 mission cards with thumbnails and titles |
| **Tutorial Brief** | Mission title, description, goal, Start, Skip, Back |
| **Tutorial Result** | Mission-specific stats, Next Mission, Back to Select |
| **Countdown** (COUNTDOWN) | Large "3 → 2 → 1 → GO" with map name, blue glow |
| **In-Game HUD** (PLAYING+IN_GAME) | Score, Level, Multiplier bar, Pause button, Fullscreen toggle, Lives (hearts), Balance |
| **Pause** (PAUSED+PAUSE) | "PAUSE" title, Resume, Settings, Restart (1 credit), Quit-to-menu |
| **Settings** | Audio submenu, Controls submenu |
| **Audio Settings** | Master / Music / SFX volume sliders + mute toggles in PixelBezel cards |
| **Controls** | 2-column grid of control cards with keyboard key display (arrow keys + WASD) |
| **Bonus** (BONUS+BONUS) | Map name + "Fullført!", animated point counter (~6 s), next-level preview |
| **Map Cleared** (MAP_CLEARED) | "Map Cleared" overlay during the 5-second Victory.wav window |
| **Game Over** (GAME_OVER) | "KAPITALEN TØRKET UT" ("CAPITAL DRIED UP"), level-results table in PixelBezel card, Retry button (1 credit), Quit |
| **Victory** (VICTORY) | "UNICORN FOUNDER!", full level-history table, Play again button (1 credit) |
| **Loading** | Title, spinning loader with percentage, progress bar, step description (in Norwegian) |
| **Out of credits** | When balance = 0, red "IKKE NOK MYNTER" ("NOT ENOUGH COINS") box replaces Play/Restart buttons |

### HUD layout

The in-game HUD overlays the top of the canvas:

- **Left:** Score (animated counter with ~0.14 s easing on changes)
- **Center:** Level number (1–9)
- **Right:** Lives (heart icons, max 9), Balance (coffee-cup icon + number, if bridge is connected), Pause button, Fullscreen toggle
- **Below center:** Multiplier progress bar with tier-colored gradient

### Multiplier bar colors

| Tier | Gradient |
|---|---|
| 1× | green: `#7fb33d → #abdd64` |
| 2× | cyan: `#0e9fb8 → #22d3ee` |
| 3× | yellow: `#ca8a04 → #eab308` |
| 4× | coral: `#e8856e → #f2ae99` |
| 5× | purple/pink: `#d56aaf → #ee90cb` |

The bar shows progress toward the next tier (0% at tier-start, 100% just before tier-up). At 5×, the bar is full.

### Out-of-credits state

When the host bridge reports a balance of 0:
- Play, Restart, and Retry buttons are replaced by a red `IKKE NOK MYNTER` box.
- The user must add credits via the host (purchase page).
- Without a bridge (standalone mode), this state is never shown — the game plays free.

### Killer info

When the player dies in normal mode, the system captures `KillerInfo { type, originalType? }` recording which monster killed them. This is sent in the game-completion payload for analytics. There's also a UI element on the GAME_OVER screen that shows "Killed by: {type}" with a small monster icon.

### Leaderboard and Purchase pages

The pause menu and game-over screen can open leaderboard or purchase pages via the host bridge (`openLeaderboard()`, `openPurchase()`). Before opening, the game **exits fullscreen** (recent commit `c3f5352` fixed this — see §21).

---

## 17. Visual Design System

The game's aesthetic is "Newsprint Arcade" — vintage cream backgrounds, dark ink text, pixel fonts, hand-drawn arcade vibe.

### Colors

| Token | Hex | Use |
|---|---|---|
| `--background` | `#f2ead5` | Vintage cream page background |
| `--card` | `#fbf5e3` | Surface for cards / panels |
| `--foreground` | `#1a1d2e` | Near-black ink text |
| `--foreground-dim` | (muted gray) | Secondary text |
| `--primary` | `#3d7fe8` | Sky blue for buttons and accents |
| `--destructive` | `#d93a3a` | Red for "out of credits" and destructive actions |
| `--surface-line` | (light line color) | Card borders / divider lines |

### Fonts

- **Pixelify Sans** — pixel headings, button labels, score numbers
- **JetBrains Mono** — body text and stats
- **VT323** — LCD-style numerics (timer, balance)

All three are loaded as web fonts. In Unity, package them as `.ttf` and assign to TextMeshPro.

### Components

- **Button:** pixel font, 2 px border, 4 px hard drop shadow, press-down animation (shadow goes to 0 on active). Variants: `outline`, `ghost`, `primary`, `destructive`.
- **PixelBezel:** the signature card component. Rounded card body with SVG corner brackets in the primary color, creating an "arcade bezel" feel. Used for menu groupings, stat tables, settings panes.
- **Kbd:** keyboard-key display element. Rendered as a `<kbd>` with a 3 px bottom border for a beveled look. Used in the Controls menu.
- **Slider:** classic horizontal slider with a 1× to 2× thumb and a value display alongside. Used for volume.
- **Spinner / Progress bar:** used in the Loading screen.

### Border radius

Pixel-sharp throughout — 2 to 4 px max. No soft rounded corners except where the design explicitly calls for them (e.g., heart icons).

### Iconography

Icons come from `lucide-react`: Maximize, Minimize, Volume, VolumeX, Pause, Play, Settings, Trophy, Heart, Coffee (for balance). In Unity, find equivalent free icon sets or extract these SVGs.

---

## 18. Rendering Pipeline

Source: `src/managers/RenderManager.ts`.

The Canvas implementation is a single-pass, back-to-front draw. In Unity, use a sorting-layer scheme to enforce the same draw order.

### Draw order (back → front)

1. **Background image** — per-map full-canvas image.
2. **Floor strip** — decorative striped/clean tile band at the bottom.
3. **Platforms** — solid-color rounded rectangles with optional chamfered corners and tile-theme overlays.
4. **Foundings** — sprite, with blink overlay when next-correct.
5. **Coins** — pixel octagon with letter overlay (P, B, M, F).
6. **Spawn / respawn indicators** — pulsating ghost outlines during the final ~3 s before spawn.
7. **Monsters** — per-type sprite. During power mode, all active monsters render as the shared Tailwind chip-bag sprite (a meta visual joke — Tailwind = "the wind at your back").
8. **Player** — sprite with skin swap for power mode.
9. **Floating text** — score popups.
10. **HUD** — overlaid as a separate React layer (in Unity: a Screen Space - Overlay canvas).

### Per-frame caching

- `Date.now()` is cached once per render frame and reused for all pulse/blink/animation calculations (consistency within a frame).
- `imageSmoothingEnabled = false` is set during pixel-art sprite passes (coins, monsters, player) so scaling stays sharp. In Unity, set sprite filter mode to Point.

### Platform rendering

Platforms use a two-pass fill:
1. Inset-corner pixel-octagon fill: each enabled chamfered corner removes a 45° triangle of pixels using a lookup table.
2. Optional tile-theme overlay: the platform's center is filled with a repeating tile texture, leaving the corners as solid color.

The result is a chunky pixel-art platform with optional chamfered corners and themed surface texture.

### Floor rendering

The floor tile (32×25) is repeated horizontally across the bottom of the canvas. Striped variants have a diagonal cap; clean variants are flat color. The floor is **visual only** — the physics ground is at `y = 575` (top of the floor strip).

### Coin rendering

Each coin is drawn as a **pixel octagon** using horizontal `fillRect` strips with symmetric top/bottom indented corners. A 1 px shadow offset adds depth. A pixel-font letter (P, B, M, F) is centered. A subtle pulse animation scales the coin: `scale = sin(time / 200) * 0.06 + 1`.

In Unity: pre-render each coin variant as a sprite atlas, or use a shader for the pulse. The pixel-octagon shape is simple enough to author as a single sprite per color.

### Monster rendering

Each monster type has its own sprite class:
- `BureaucratSprite` — multi-direction walk/fall/transition.
- `TaxGhostSprite` — float/charge variants.
- `FloaterSprite` — shared by Wisp, Founder, Consultant, Robot (each with its own color/sheet).
- `TailwindSprite` — the chip-bag overlay during power mode.

Death/transition animations play for a defined duration before the monster despawns or morphs. Frozen monsters render in their type's frozen variant or with a blue tint.

### Spawn / respawn indicators

A 5-frame animation (Spawn_00.png – Spawn_04.png, 500 ms total) renders at the upcoming spawn position. Scale: 1.6× the target monster's bounds. The frame index advances based on time remaining: `progress = 1 - (timeRemaining / 500)`, `frame = floor(progress * 5)`.

### Floating text

Each FloatingText carries `{ id, text, x, y, startTime, duration, color, fontSize }`. Each frame, expired texts are removed. Active texts render at `(x, y - drift)` where `drift = elapsed * 0.05` (rough px/ms), with alpha = `1 - (elapsed / duration)`.

### Killer info display

Currently captured as data only (sent in the game-completion payload). The GAME_OVER screen could surface it visually ("You died to: Robot"); the current implementation does so via the level-history table.

---

## 19. Audio System

Source: `src/managers/AudioManager.ts`, `src/config/audio.ts`.

The audio mixer is a custom Web Audio API setup with three buses: master, music, SFX.

### Audio buses

| Bus | Default volume | Multiplier | Purpose |
|---|---|---|---|
| Master | 40% (live-tunable 0–100) | 1.0 | Final output |
| Music | 30% (live-tunable) | × 2.5 (`MUSIC_BUS_BOOST`) | Background music + power-up melody |
| SFX | 20% (live-tunable) | × 0.45 (`SFX_BUS_TRIM`) | All effects and ambient loops |

Mute flags exist per bus: `masterMuted`, `musicMuted`, `sfxMuted`. Defaults are biased low (40/30/20) because the host page often has its own ambient sound — the player can crank them in the settings menu.

### Background music

- **File:** `sigurd-game-loop.wav` (loaded as an AudioBuffer)
- **Loop:** yes
- **Plays during:** PLAYING state
- **Stops on:** PAUSED, BONUS, MAP_CLEARED, VICTORY, GAME_OVER, MENU, power mode (resumes after power mode), tutorial missions (silent)

### Power-up melody (synthesized)

A short repeating melody synthesized live with Web Audio oscillators. Plays for the duration of the active P-coin (3–10 s depending on color). When playing:
- BG music is paused.
- A low-volume P-coin ambient loop plays underneath.

Use a sample file in Unity if you don't want to recreate the synth — the melody is a 4-note square-wave motif (A5, C6, B5, D6 at ~150 ms per note).

### P-coin ambient loop

- **File:** `power-mode.wav` (loaded as buffer)
- **Behavior:** starts when a P-coin spawns; muted (gain = 0) until the player enters PLAYING; unmuted on enter; faded out and stopped when the P-coin is collected or expires.
- **Volume:** sfxVolume × 1.4 (`POWER_COIN_AMBIENT_VOLUME_MULT`).

### SFX list

| Event | Type | File or notes |
|---|---|---|
| `FOUNDING_COLLECT` | synth | Square wave 800 → 1200 Hz, 200 ms |
| `MONSTER_HIT` | sample | Player loses a life (not power-mode kill) |
| `MONSTER_KILL` | sample | Player kills monster in power mode |
| `MAP_CLEARED` | sample (`Victory.wav`) | Level completed |
| `GAME_OVER` | sample (`gameover.wav`) | Last life lost |
| `BONUS_SCREEN` | synth | Bonus animation alternating 880 ↔ 988 Hz for ~6 s |
| `COIN_COLLECT` | sample (`bonus-coin-collect.wav`) | B-coin pickup |
| `F_COIN_COLLECT` | synth | Unique rising-arpeggio (different from standard coin) |
| `POWER_COIN_ACTIVATE` | synth | Square + sine, 200→400 + 800→1200 Hz, 500 ms |
| `PLAYER_JUMP` | sample (`jump.wav`, 55% volume) | Jump executed |
| `TUTORIAL_SUBTASK_COMPLETE` | sample (`mission-complete.wav`) | Tutorial sub-task done |

In Unity, prefer sample files for all of these — pre-render the synth voices as WAVs and play via `AudioSource`. Use `AudioMixerGroup`s to implement the three buses.

### Mute / pause behavior

- Pausing the game (PAUSED state) stops BG music and mutes the P-coin ambient.
- Resuming (back to PLAYING) restarts BG music and unmutes the ambient — same playhead is preserved for the ambient loop so it doesn't cut mid-cycle.

---

## 20. Loading & Asset Preload

Source: `src/managers/LoadingManager.ts`.

A loading screen runs before the main menu. It preloads assets in weighted steps so the progress bar moves smoothly. Total weight = 100; each step contributes its weight to the percentage.

| Step | Weight | Norwegian message | What it loads |
|---|---|---|---|
| `host-communication` | 15 | "Kobler til vertssystem..." | `waitForAudioSettings()` from bridge |
| `background-images` | 20 | "Laster spillbakgrunner..." | 9 map backgrounds |
| `player-sprites` | 15 | "Laster Sigurd-animasjoner..." | ~45+ player sprite frames |
| `monster-sprites` | 10 | "Laster byråkrater og hindringer..." | All monster sprite sheets |
| `ui-sprites` | 10 | "Laster brukergrensesnitt..." | Founding sprites, platform tiles, floor tiles, fonts |
| `audio-files` | 15 | "Laster lydeffekter og musikk..." | All WAVs/MP3s |
| `map-data` | 10 | "Forbereder spillbaner..." | Validates all 9 map definitions |
| `finalization` | 5 | "Gjør klar for spilling..." | 200 ms artificial delay for visual feedback |

The loading UI shows:
- Title "Sigurd Startup"
- Spinning loader
- Progress bar (0–100%)
- Current step's message
- Optional dynamic message variant (e.g., "Laster Banken bakgrunn..." when loading that specific map)

In Unity, use `Addressables` or `Resources.LoadAsync` for the actual preload; the UI structure can be ported directly.

---

## 21. Host Bridge Integration

Source: `src/lib/gameBridge.ts`, `src/lib/communicationUtils.ts`.

The game communicates with the host (the React landing page that embeds it) through a global object `window.sigurdGame`. The Unity port should treat this as an abstract `IHostBridge` interface and provide both a "real" implementation (e.g., via Unity's WebGL JS interop or a native platform plugin) and a "standalone" stub for development.

### Bridge interface

```typescript
interface SigurdGameBridge {
  // Status
  ready: boolean;

  // Balance
  getBalance(): number;
  deductCredits(amount: number): Promise<{ success: boolean; newBalance: number; error?: string }>;
  refreshBalance(): Promise<number>;
  onBalanceChanged(cb: (info: BalanceInfo) => void): () => void;  // returns unsubscribe

  // Game events
  sendGameCompletion(data: GameCompletionData): void;
  sendAudioSettings(settings: AudioSettings): void;
  loadUserAudioSettings(userId: string): Promise<void>;

  // Founder Mode (FAFO)
  grantBusinessIdea(amount: number): void;

  // Optional navigation
  openPurchase?(): void;
  openLeaderboard?(): void;
}
```

### Bridge detection

- On startup, the game waits for a `sigurdGame:bridge-ready` event on `window`.
- Timeout: **3000 ms**. If the bridge doesn't appear in time, fall back to standalone mode.
- Synchronous check: `hasBridge()` returns `!!window.sigurdGame?.ready`.

### Standalone fallback

When no bridge is present:
- Balance: a `MOCK_BALANCE` of 10 (dev only) or null (true standalone — no balance UI shown).
- `deductCredits()`: always resolves `{ success: true, newBalance: -1 }`.
- `grantBusinessIdea()`: logs a console warning, no-op.
- F-coin visual feedback still happens (text, audio) even though the grant is fake.

### Credit deduction points

| Trigger | Amount |
|---|---|
| Game start (Play from MENU) | 1 |
| Restart from pause menu | 1 |
| Retry from GAME_OVER | 1 |
| Play again from VICTORY | 1 |
| Resume from pause | 0 (already paid) |
| Level transition | 0 |
| Tutorial mission start | 0 (always free) |

The flow is: UI button calls `bridge.deductCredits(1)`, `await`s the promise, and **only proceeds if `success === true`**. On failure, show an error toast and stay in the menu.

### Game completion payload (sent to host)

```typescript
interface GameCompletionData {
  finalScore: number;
  totalLevels: number;
  completedLevels: number;
  timestamp: number;
  lives: number;
  multiplier: number;
  levelHistory: LevelHistoryEntry[];
  totalCoinsCollected: number;
  totalPowerModeActivations: number;
  totalFoundings: number;
  totalCorrectOrders: number;
  averageCompletionTime: number;
  gameEndReason: 'completed' | 'failed';
  sessionId: string;
  startTime: number;
  endTime: number;
  userDisplayName?: string;
  userEmail?: string;
  userId?: string;
  totalPCoinTierCollections?: Record<PCoinColorName, number>;
  totalFounderCoinsCollected?: number;
}
```

Sent on transition to VICTORY (success) or GAME_OVER (failure). The host uses this for the leaderboard and stats dashboard.

### Audio settings sync

When the user changes a volume slider or mute toggle in the in-game Settings menu, the game calls `bridge.sendAudioSettings({ master, music, sfx, masterMuted, musicMuted, sfxMuted })`. The host persists these per-user. On the next game start, `bridge.loadUserAudioSettings(userId)` restores them.

### Fullscreen and external pages

The game can be played fullscreen (toggled via the F key or HUD button). When the user clicks "Open leaderboard" or "Open purchase page" from a menu, the game **must exit fullscreen first** — otherwise the link opens behind the fullscreen and is invisible. The bridge calls `openLeaderboard()` / `openPurchase()`; the game wraps these in `exitFullscreenIfActive()` before delegating.

---

## 22. Dev Mode & Editor

### Dev mode

Source: `src/config/dev.ts`.

A static toggle (`DEV_CONFIG.ENABLED = false` in production) unlocks fast iteration:

| Option | Effect |
|---|---|
| `ENABLED` | Master toggle |
| `TARGET_STATE` | Skip MENU, start directly in PLAYING / COUNTDOWN / BONUS / GAME_OVER / VICTORY |
| `TARGET_LEVEL` | Jump to a specific level (1–9) |
| `GOD_MODE` | Invincible to monsters |
| `SKIP_AUDIO_SETTINGS_WAIT` | Don't block on bridge audio handshake |
| `MOCK_DATA` | Fake score, level history, multiplier, lives — for testing end-game screens |

### Tuning panel & editor

A live tuning UI (`src/editor/`) lets developers adjust virtually every numeric parameter (physics, monster speeds, scaling rates, coin spawn rules, founding bonus tables, etc.) without reloading the page. Backed by a `TUNING_FIELDS` array in `src/config/tuningDefaults.ts`, the panel groups fields into sections: Player, Gravity, Coins, Bureaucrat, Wisp, TaxGhost, Founder, Consultant, Robot, Respawn, Rules.

Most fields apply mid-game (live reload via `getTuned(key)` lookups). Some are flagged "restart required" (e.g., `TOTAL_FOUNDINGS`, `STARTING_LIVES`) because they affect level structure.

The panel can serialize current overrides as a TypeScript file you commit to bake them into the production build.

### Properties Panel

A separate `PropertiesPanel.tsx` lets the developer edit individual entities (platforms, monsters, foundings, coins, map metadata) live. Fields include position, size, color, speed, transform target, patrol bounds, spawn delay. Used for map authoring.

In Unity, this maps cleanly to the Inspector for ScriptableObject-based level data. The tuning panel might warrant a custom EditorWindow.

---

## 23. Asset Inventory

### Sprites (V2 — current)

- `spritesV2/Sigurd/` — player (idle, run, jump, fall, land, float, victory, in -left and -right variants)
- `spritesV2/SigurdPower/` — power skin (same animations)
- `spritesV2/Bureaucrat/` — walk, fall, transition (left/right)
- `spritesV2/Wisp/` — float, bump (horizontal/vertical, left/right)
- `spritesV2/TaxGhost/` — float, charge (left/right)
- `spritesV2/Founder/` — float, bump (h/v, l/r)
- `spritesV2/Consultant/` — float, bump (h/v, l/r)
- `spritesV2/Robot/` — float, bump (h/v, l/r)
- `spritesV2/Monster-spawn/` — Spawn_00.png – Spawn_04.png (respawn indicator)
- `spritesV2/Tailwind/` — power-mode monster overlay (chip-bag joke)

### Platform & floor tiles

- `assets/horizontal-platforms/` — platform-beige, platform-blue, platform-green (each with corner + center tiles)
- `assets/vertical-platforms/` — same three colors, vertical orientations
- `assets/Tiles/grounds/` — construction, dungeon, stone-gray, store-redish (each with `ground/` and `surface/` subfolders)
- `assets/sprites/floor/` — clean and striped floor tiles in multiple colors

### Foundings & coins

- `assets/sprites/funding/` — founding sprites (8 variants per group color)
- (Coins are rendered procedurally, not from sprite files)

### Audio

- `assets/audio/sigurd-game-loop.wav` — BG music
- `assets/audio/sigurd-theme-song.mp3` — alternate theme (referenced but BG loop is canonical)
- `assets/audio/power-mode.wav` — ambient power-coin loop
- `assets/audio/Victory.wav` — map cleared
- `assets/audio/gameover.wav` — last life
- `assets/audio/jump.wav` — player jump
- `assets/audio/bonus-coin-collect.wav` — B-coin pickup
- `assets/audio/mission-complete.wav` — tutorial sub-task
- Synthesized at runtime: founding collect, power-up melody, F-coin chime, bonus screen, monster hit/kill

### Backgrounds

`assets/maps-bg-images/`:
- `soverommet.png`, `garasjen.png`, `startup-lab.png`, `innovasjon-norge.png`, `skatteetaten.png`, `nav.png`, `banken.png`, `altinn.png`, `silicone-valley.png`

### Fonts

- Pixelify Sans
- JetBrains Mono
- VT323

(All as `.ttf` files in `assets/Font/` and `assets/score-font/`.)

---

## 24. Suggested Unity Architecture

### Project setup

- **Unity version:** any recent LTS (e.g., 2022.3 or newer).
- **Render pipeline:** Built-in or URP 2D — both work fine. URP gives easier post-processing if you want CRT scanlines later.
- **Coordinate system:** orthographic camera, 1 world unit = 1 pixel, camera size 300, camera at `(400, 300, -10)`. Set canvas to `Screen Space - Camera` and reference this camera.
- **Pixel-perfect:** add the Pixel Perfect Camera package (com.unity.2d.pixel-perfect) and set ref resolution 800×600.
- **Physics:** `Physics2D`. `Rigidbody2D` for player and monsters. `BoxCollider2D` for hitboxes (separate from sprite bounds).
- **Time:** use `Time.deltaTime` for frame motion, `Time.unscaledTime` for paused-game timers (e.g., countdown UI), `Time.timeScale = 0` to pause.

### Folder layout

```
Assets/
  Art/
    Sprites/
      Player/
      Monsters/Bureaucrat, Wisp, TaxGhost, Founder, Consultant, Robot
      Coins/
      Foundings/
      Platforms/
      Floor/
      Backgrounds/
      UI/
    Fonts/
  Audio/
    Music/
    SFX/
  Scenes/
    Bootstrap.unity
    MainMenu.unity
    Game.unity
  Prefabs/
    Player/
    Monsters/
    Coins/
    Foundings/
    Platforms/
    UI/
  ScriptableObjects/
    Maps/         # one SO per level
    TuningDefaults.asset
  Scripts/
    Core/         # GameStateManager, GameLoop, EventBus
    Managers/     # FoundingManager, CoinManager, MonsterManager, etc.
    Entities/     # Player.cs, Monster.cs, Coin.cs, Founding.cs, Platform.cs
    Movement/     # PatrolMovement.cs, ChaserMovement.cs, etc.
    Systems/      # Scoring, A*, MultiplierMath (pure)
    UI/           # Menus, HUD, LoadingScreen
    Bridge/       # IHostBridge.cs, StandaloneBridge.cs, WebGLBridge.cs
    Editor/       # custom editors, tuning window
```

### Recommended patterns

- **ScriptableObject for maps:** one `MapDefinition` SO per level holds platforms, foundings, monsters, spawn points. Author them in the Inspector or via a custom Editor window. At runtime, `LevelManager` instantiates prefabs from the SO.
- **ScriptableObject for tuning:** `TuningDefaults.asset` is your single source of truth for all numeric parameters. Wire a custom EditorWindow to live-edit during play mode.
- **State machine:** a simple enum-based state machine on a `GameStateManager` MonoBehaviour. Use `UnityEvent`s or a static event bus for state-change notifications.
- **Object pooling:** pool coins, foundings, monsters, floating-text instances. Spawning/de-spawning every Founding pickup is hot.
- **A* for Wisp:** port the existing logic to a pure C# class. Use a small grid (~50×40 cells at 16 px per cell). A* with Manhattan heuristic. Cap iterations at 300.
- **Animation:** Animator controllers per monster type with state transitions on `direction` and `behaviorState` parameters. Player gets a `skin` enum parameter for the Power swap.
- **Sprite atlases:** pack each character's animations into a single atlas for performance.
- **Audio mixer:** `AudioMixer` asset with Master / Music / SFX groups. Bind to UI sliders via `mixer.SetFloat("MasterVolume", ...)`.

### Pause clock

Replace the Canvas `getEffectivePausedMs` pattern with `Time.timeScale = 0` for "hard" pauses and `Time.unscaledDeltaTime` for any UI that needs to keep animating (countdown, menus). For the resume-from-pause distinction (§4), track `previousState` in `GameStateManager` and feed it into the COUNTDOWN → PLAYING transition.

### Bridge

```csharp
public interface IHostBridge {
  bool Ready { get; }
  int GetBalance();
  Task<DeductResult> DeductCreditsAsync(int amount);
  Task<int> RefreshBalanceAsync();
  event Action<BalanceInfo> BalanceChanged;
  void SendGameCompletion(GameCompletionData data);
  void SendAudioSettings(AudioSettings settings);
  Task LoadUserAudioSettingsAsync(string userId);
  void GrantBusinessIdea(int amount);
  void OpenPurchase();
  void OpenLeaderboard();
}
```

Implement `StandaloneBridge` for editor / dev builds, `WebGLBridge` for browser (calls into JavaScript via `[DllImport("__Internal")]`).

---

## 25. Appendix: Constants Reference

### Game rules

| Constant | Value | Source |
|---|---|---|
| Canvas width | 800 | `src/config/game.ts` |
| Canvas height | 600 | `src/config/game.ts` |
| Playfield bottom | 575 | derived |
| Total foundings per level | 23 | `GAME_RULES.TOTAL_FOUNDINGS` |
| Starting lives | 3 | `GAME_RULES.STARTING_LIVES` |
| Max lives | 9 | `GAME_RULES.MAX_LIVES` |
| Total levels (main campaign) | 9 | `mapDefinitions.length` |
| Tutorial missions | 4 | `TUTORIAL_MISSION_ORDER.length` |
| Countdown duration | 3000 ms | hardcoded in `GameStateManager.resumeGame()` |
| MAP_CLEARED hold (Victory sound) | 5000 ms | |
| Bonus screen counter | 6000 ms | |
| Bonus → next level delay | 2000 ms | |
| Bridge detection timeout | 3000 ms | `BRIDGE_TIMEOUT_MS` |

### Player

| Constant | Value |
|---|---|
| Move speed | 4 px/frame |
| Jump power | 7 |
| Super jump power | 12 |
| Min jump duration | 50 ms |
| Max jump duration | 300 ms |
| Float gravity multiplier | ~0.025 (vs normal 1.0) |
| Fast fall gravity multiplier | 2.0 |
| Player bounds | 25 × 43 |
| Player lethal hitbox | 24 × 42 |
| Spawn indicator duration | 500 ms |

### Foundings

| Constant | Value |
|---|---|
| Bounds | 25 × 25 |
| Firefounding base | 200 |
| Normal founding base | 100 |
| Bonus 23 / 22 / 21 / 20 / <20 | 50k / 30k / 20k / 10k / 0 |

### Coins

| Constant | Value |
|---|---|
| `POWER_COIN_SPAWN_INTERVAL` | 18 tokens |
| `P_COIN_TOKEN_FIREFOUNDING` | 2 |
| `P_COIN_TOKEN_NORMAL` | 1 |
| `POWER_COIN_MAX_PER_LEVEL` | 2 |
| `BONUS_COIN_SPAWN_INTERVAL` | 5000 points |
| `BONUS_COIN_MAX_PER_LEVEL` | 5 |
| `EXTRA_LIFE_COIN_RATIO` | 8 B-coins |
| `EXTRA_LIFE_DEATH_GENEROSITY` | 2 |
| `F_COIN_RUN_CHANCE` | 0.05 |
| `F_COIN_MIN_LEVEL` | 2 |
| `F_COIN_MAX_LEVEL` | 8 |
| `F_COIN_TRIGGER_MIN_FOUNDING` | 1 |
| `F_COIN_TRIGGER_MAX_FOUNDING` | 23 |
| `F_COIN_RUN_CAP` | 2 |
| B-coin base (flat) | 500 |
| M-coin base | 1000 |

### Multiplier

| Tier | Cumulative threshold |
|---|---|
| 1× | 0 |
| 2× | 1,800 |
| 3× | 3,600 |
| 4× | 5,400 |
| 5× | 7,200 |

### Monster kill ladder (during power mode)

| Kill # | Base |
|---|---|
| 1 | 100 |
| 2 | 200 |
| 3 | 300 |
| 4 | 400 |
| 5 | 500 |
| 6+ | 600 |

### Monster scaling (approx defaults)

| Monster | Base speed | Max speed | Speed scaling /sec |
|---|---|---|---|
| Bureaucrat | 1.0 | 2.5 | +0.05 |
| Wisp | 1.5 | ~2.0 | +0.05 |
| TaxGhost | 2.5 | ~4.0 | +0.10 |
| Founder | 3.0 | ~4.5 | +0.10 |
| Consultant | 1.2 | ~2.0 | +0.05 |
| Robot | 1.4 | ~2.2 | +0.05 |

### Respawn delays

| Monster | Delay |
|---|---|
| Bureaucrat | (per spawn point's `respawnInterval`) |
| Wisp | 5000 ms |
| TaxGhost | 5000 ms |
| Founder | 5000 ms |
| Consultant | 5000 ms (after Bureaucrat transform back) |
| Robot | 5000 ms (after Bureaucrat transform back) |

### Audio defaults

| Setting | Default |
|---|---|
| Master | 40% |
| Music | 30% (× 2.5 bus boost) |
| SFX | 20% (× 0.45 bus trim) |
| All mute flags | false |

---

## Final Notes for the Unity Engineer

1. **Start with the state machine and a stub menu.** Get the MENU → COUNTDOWN → PLAYING → PAUSED loop running with a static map before adding any monsters or coins.
2. **Author one level (level 1, `soverommet`) end-to-end** before doing all 9. Once the pipeline (platforms, foundings, monsters, spawn points, coin spawn points) is proven, the others are pure data.
3. **Bureaucrat first, then Wisp.** Bureaucrats exercise the full transformation pipeline (Patrol → Fall → Consultant/Robot/Founder/etc.) and the most complex spawn-respawn interaction. Wisp exercises A*. The others are simpler variations.
4. **P-coin loop is the heart of the game.** Once power mode works, the rest of the coin types are mechanical.
5. **Skip the bridge initially.** Use `StandaloneBridge` returning fixed values. Only wire the real (WebGL JS interop) bridge when you're ready for a browser build.
6. **Keep the tuning panel.** Even a rough Inspector-based version saves hours of recompile time. The Canvas codebase's tuning panel is a major productivity multiplier.
7. **Test pure logic without scenes.** Scoring, multiplier math, founding sequence FSM, A*, and end-of-level bonus calc should all have NUnit tests independent of Unity.
8. **Don't over-fit physics.** Unity's `Rigidbody2D` will give you slightly different feel than Canvas. Re-tune `JUMP_POWER`, `GRAVITY`, `MOVE_SPEED` until the game *feels* right rather than chasing exact pixel parity.

---

*End of specification. For questions about any system, cross-reference the file path noted in each section. The authoritative behavior is the current shipping Canvas code — this document captures it as of 2026-05-15.*
