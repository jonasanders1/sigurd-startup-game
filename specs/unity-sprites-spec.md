# Sigurd Startup — Sprites & Animation Spec (Unity Port)

A 1:1 reference for every sprite, animation, frame count, frame duration, transition rule, and special rendering state in the Canvas version of Sigurd Startup. Pair this with `specs/unity-port-spec.md` (the master spec); this document covers *only the visual layer*.

The exact PNG files live in `src/assets/spritesV2/` (player + monsters), `src/assets/sprites/funding/` (foundings), `src/assets/sprites/floor/` (floor tiles), and `src/assets/horizontal-platforms/` + `src/assets/vertical-platforms/` (platform tiles). Copy those into Unity as-is.

---

## Table of Contents

1. [Unity Import Settings (do this first)](#1-unity-import-settings-do-this-first)
2. [Animation Vocabulary](#2-animation-vocabulary)
3. [Player (Sigurd & SigurdPower)](#3-player-sigurd--sigurdpower)
4. [Bureaucrat](#4-bureaucrat)
5. [Wisp](#5-wisp)
6. [TaxGhost](#6-taxghost)
7. [Founder](#7-founder)
8. [Consultant](#8-consultant)
9. [Robot](#9-robot)
10. [Tailwind (Power-Mode Overlay)](#10-tailwind-power-mode-overlay)
11. [Monster Spawn Indicator](#11-monster-spawn-indicator)
12. [Founding (Collectible)](#12-founding-collectible)
13. [Coins (Procedural)](#13-coins-procedural)
14. [Floor (Tiles)](#14-floor-tiles)
15. [Platforms (Tiles + Chamfer)](#15-platforms-tiles--chamfer)
16. [Floating Text](#16-floating-text)
17. [Power-Mode & Frozen Rendering Rules](#17-power-mode--frozen-rendering-rules)
18. [Render Order](#18-render-order)
19. [Appendix: Animation Tables in One Place](#19-appendix-animation-tables-in-one-place)

---

## 1. Unity Import Settings (do this first)

Before importing a single PNG, set these defaults in Unity:

- **Texture Type:** Sprite (2D and UI)
- **Sprite Mode:** Single (or Multiple if you bundle frames into an atlas later)
- **Pixels Per Unit:** **1** — match the Canvas's 1 px = 1 world unit convention. Camera orthographic size = 300 (half of 600 px canvas height).
- **Filter Mode:** **Point (no filter)** — pixel art, nearest-neighbor. Do not let Unity smooth scale these.
- **Compression:** None (RGBA32) for development; you can switch to compressed at ship time.
- **Wrap Mode:** Clamp
- **Generate Mip Maps:** off
- **Pivot:** Custom — set per entity. Most sprites are "Center"; player and Bureaucrat are "Bottom" (feet anchor). See per-entity sections.

Add the **Pixel Perfect Camera** package (com.unity.2d.pixel-perfect) and set:
- Reference resolution: 800 × 600
- Pixel Snapping: enabled
- Upscale Render Texture: enabled (for sharp output on non-integer scales)

Animator note: Unity's Animator is overkill for the simple "play these N frames at this rate" pattern most of this game uses. A custom `SpriteRenderer` driver + a small enum-based state machine on each entity will be lighter and easier to debug. The descriptions below assume you'll write a tiny `SpriteAnimator` MonoBehaviour that holds a list of `(frames, frameDurationMs, loop)` and ticks an index forward per frame. If you'd rather use Animator + animation clips, the timings translate directly (clip length = frames × frameDurationMs / 1000).

---

## 2. Animation Vocabulary

Terms used throughout this document:

- **Frame count** — number of PNG images in the animation cycle.
- **Frame duration** — milliseconds per frame. Each frame is held for this long before advancing.
- **Loop** — yes (animation cycles indefinitely) or no (animation plays once, holds last frame until state changes).
- **Pivot / anchor** — where the sprite's origin sits relative to its physics bounds. "Feet" = bottom-center of the bounds rect; "center" = center of the bounds rect.
- **Bounds** — the entity's logical rectangle (positions and velocities reference this rect's top-left corner in Canvas; in Unity you'll use the rigidbody's transform position and a child collider).
- **Hitbox (lethal rect)** — the smaller rectangle that registers collisions with the player. Almost always smaller than bounds; configured per-entity, sometimes per-animation-frame.
- **Sprite cell** — the source image dimensions on disk (almost always 64×64 or 88×88 or 96×96). The sprite's visible content occupies only part of this cell with transparent padding, so the sprite renders bigger than the collision box.

Frame source files are named by a consistent pattern per folder, e.g. `idle-right/Sigurd_06.png`, `idle-right/Sigurd_07.png`, … The naming is sequential within a folder; you do not need to globally cross-reference numbers because each folder is self-contained.

---

## 3. Player (Sigurd & SigurdPower)

**Two skins, identical animation set.** The default skin lives in `src/assets/spritesV2/Sigurd/`. The power skin lives in `src/assets/spritesV2/SigurdPower/`. When P-coin power mode is active, swap the sprite atlas; the animation state and frame index are preserved across the swap (so a running player stays at the same frame, only the visual changes).

**Bounds:** 25 × 43 px. **Hitbox (lethal):** 24 × 42 px, centered on bounds. **Pivot:** bottom-center (feet).

**Sprite cell:** 64 × 64 with transparent padding. The visible character is roughly the size of the hitbox, but the sprite cell is larger. To draw, position the sprite cell so its bottom-center aligns with the bounds' bottom-center: `drawX = playerCenterX - 64/2`, `drawY = playerFeetY - 64`.

### Animation states

| State | Folder | Frames | Duration | Loop | Notes |
|---|---|---|---|---|---|
| idle-left | `idle-left/` | 6 | 130 ms | yes | grounded, no horizontal input, facing left |
| idle-right | `idle-right/` | 6 | 130 ms | yes | grounded, no horizontal input, facing right |
| run-left | `run-left/` | 6 | 55 ms | yes | grounded, horizontal input left |
| run-right | `run-right/` | 6 | 55 ms | yes | grounded, horizontal input right |
| jump-left | `jump-left/` | 3 | 100 ms | no | airborne, ascending, facing left |
| jump-right | `jump-right/` | 3 | 100 ms | no | airborne, ascending, facing right |
| fall-left | `fall-left/` | 3 | 100 ms | no | airborne, descending, facing left |
| fall-right | `fall-right/` | 3 | 100 ms | no | airborne, descending, facing right |
| land-left | `land-left/` | 3 | 80 ms | no | one-shot on landing, facing left |
| land-right | `land-right/` | 3 | 80 ms | no | one-shot on landing, facing right |
| air-move-left | (reuses `run-left/` frame 2) | 1 | 120 ms | yes | airborne with horizontal input, frozen mid-run pose |
| air-move-right | (reuses `run-right/` frame 2) | 1 | 120 ms | yes | airborne with horizontal input, frozen mid-run pose |
| float-left | `float-left/` | 6 | 120 ms | yes | Space held, ascending or hovering, facing left |
| float-right | `float-right/` | 6 | 120 ms | yes | Space held, hovering, facing right |
| float-down | `float-down/` | 6 | 120 ms | yes | Space held but no horizontal input — gentle drift |
| victory-left | `victory-left/` | 4 | 140 ms | yes | MAP_CLEARED state, facing left |
| victory-right | `victory-right/` | 4 | 140 ms | yes | MAP_CLEARED state, facing right |

### Animation state machine (Player)

The player's facing direction is "sticky" — when no horizontal input is given, it retains the last facing.

```
GROUNDED states:
  (no horizontal input) → idle-<lastFacing>
  (left input)          → run-left, lastFacing = left
  (right input)         → run-right, lastFacing = right

GROUNDED → AIR transitions (on jump or walking off platform):
  if velocity.y < 0 (ascending) → jump-<lastFacing>
  if velocity.y >= 0 (descending) → fall-<lastFacing>

AIR states:
  Space held, velocity.y near 0 or rising:
    if horizontal input → float-<facing>
    else                → float-down

  No Space, velocity.y < 0 (ascending):
    if horizontal input → air-move-<facing> (single-frame frozen run pose)
    else                → jump-<lastFacing>

  No Space, velocity.y >= 0 (descending):
    if horizontal input → air-move-<facing>
    else                → fall-<lastFacing>

AIR → GROUNDED transitions (on landing):
  play land-<lastFacing> one-shot (240 ms total: 3 frames × 80 ms)
  after land completes:
    if horizontal input → run-<facing>
    else                → idle-<lastFacing>

MAP_CLEARED state:
  victory-<lastFacing> (loops until level transition begins)
```

**Critical notes for Unity implementation:**

- **Direction memory ("sticky facing"):** when input releases, the player keeps facing the last direction held. Implement as a `lastFacingDir : int (-1 or 1)` field that only updates when an input arrives.
- **Air vs. ground distinction:** the player has separate `jump` (ascending, no input) and `air-move` (ascending or descending, with input) states. Both are "in air" but the visual differs.
- **Land animation is interruptible by input:** if the player lands and immediately starts running, the land animation can cut early (most natural UX). Most implementations let `land` play to completion (240 ms), but the original tolerates either.
- **Float overrides gravity-state animations:** Space held airborne always wins over jump/fall, even mid-ascent or mid-descent.

### Power skin swap

When P-coin power mode begins:

```
currentSkin = "power"          // hot-swap atlas
spriteAtlas = SigurdPowerFrames
// Animation state and frame index unchanged
```

When power mode ends, swap back: `currentSkin = "default"`. The folder structure of `SigurdPower/` mirrors `Sigurd/` exactly (same animation names, same frame counts, same frame durations), so the swap is purely a sprite source change.

**Unity tip:** keep two `SerializeField` arrays per animation — one for the default skin, one for the power skin. The animator picks from `defaultFrames` or `powerFrames` based on a single `bool isPowerSkin` flag.

---

## 4. Bureaucrat

The Bureaucrat is the only ground-walking monster, and the only one with a "transition" (morphing) animation that plays on landing from a fall.

**Bounds:** 25 × 39 px. **Hitbox (lethal):** 18 × 32 px, centered. **Pivot:** bottom-center (feet).

**Sprite cell:** 88 × 88. Visible content sits near the bottom of the cell with significant transparent padding above. To draw, position the cell so the **feet** (at ~50/64 of cell height = ~78% down the cell) align with the bounds' bottom-center: `drawX = monsterCenterX - 88/2`, `drawY = monsterFeetY - 88 * 0.78`.

### Animation states

| State | Folder | Frames | Duration | Loop | Trigger |
|---|---|---|---|---|---|
| walk-left | `walk-left/` | 6 | 100 ms | yes | patrolling left |
| walk-right | `walk-right/` | 6 | 100 ms | yes | patrolling right |
| idle-left | (frame 0 of walk-left) | 1 | 180 ms | yes | stopped on platform, facing left |
| idle-right | (frame 0 of walk-right) | 1 | 180 ms | yes | stopped, facing right |
| fall-left | `fall-left/` | 3 | 120 ms | yes | gravity-falling, facing left |
| fall-right | `fall-right/` | 3 | 120 ms | yes | gravity-falling, facing right |
| transition-left | `transition-left/` | 8 | 70 ms | **no** | morphing on ground impact, facing left (560 ms total) |
| transition-right | `transition-right/` | 8 | 70 ms | **no** | morphing on ground impact, facing right |

Front-facing (`direction = 0`) aliases to the right-facing variant.

### Animation state machine (Bureaucrat)

```
PATROL phase:
  velocity.x < 0 → walk-left
  velocity.x > 0 → walk-right
  velocity.x = 0 → idle-<lastFacing>

PATROL → FALL transition:
  walk-<dir> → fall-<dir>  (when walkLengths exhausted or pushed off platform)

FALL phase:
  fall-<dir> until landing on platform below or canvas bottom

FALL → TRANSITION:
  on ground impact at canvas bottom:
    set isTransitioning = true
    play transition-<dir> one-shot

TRANSITION → MORPH:
  after 8 frames × 70 ms = 560 ms:
    spawn the configured transformTarget (Consultant / Robot / Founder / etc.)
    despawn the Bureaucrat

If transformTarget = "NONE":
  after transition completes, the Bureaucrat is destroyed (silent death)

Power mode (isFrozen = true):
  freeze current frame; render the Tailwind overlay on top instead
  (Bureaucrat sprite still occupies its bounds for collision purposes,
   but the chip-bag overlay is what the player sees)
```

**Critical notes:**

- Bureaucrats spawn with `isLethal = false` and become lethal only after their first direction change (so a Bureaucrat materializing under the player can't instakill).
- Bureaucrats do **not** use the global respawn queue. They respawn via their `MonsterSpawnPoint.respawnInterval` instead.
- The transition animation is the *only* one-shot animation in the entire monster system that drives a gameplay event (morphing). It is critical that the morph happens **exactly** when the animation completes, not before.

---

## 5. Wisp

Floating cardinal hopper. One Wisp per level, auto-spawned by `LevelManager` at a random corner.

**Bounds:** 30 × 52 px. **Hitbox:** 22 × 42 px, centered. **Pivot:** center.

**Sprite cell:** 88 × 88. Draw: `drawX = centerX - 88/2`, `drawY = centerY - 88/2`.

### Animation states

| State | Folder | Frames | Duration | Loop | Trigger |
|---|---|---|---|---|---|
| float-left | `float-left/` | 6 | 140 ms | yes | hopping or resting, facing left |
| float-right | `float-right/` | 6 | 140 ms | yes | hopping or resting, facing right |
| bump-horizontal-left | `bump-horizontal-left/` | 3 | 70 ms | no | collided with right side of an obstacle, recoiling left (210 ms total) |
| bump-horizontal-right | `bump-horizontal-right/` | 3 | 70 ms | no | collided with left side of obstacle, recoiling right |
| bump-vertical-left | `bump-vertical-left/` | 3 | 70 ms | no | collided with floor/ceiling while facing left |
| bump-vertical-right | `bump-vertical-right/` | 3 | 70 ms | no | collided with floor/ceiling while facing right |

### Animation state machine (Wisp + all floaters)

This same state machine applies to Wisp, Founder, Consultant, and Robot (the four "floater" monsters):

```
FLOAT phase (default):
  velocity.x ≥ 0 → float-right
  velocity.x < 0 → float-left
  velocity.x = 0 → preserve last facing

COLLISION → BUMP:
  on collision with platform or boundary:
    set bumpAxis = "horizontal" or "vertical" (whichever axis the collision was on)
    set bumpDirection = -1 or +1 (recoil direction)
    play bump-<axis>-<dir> one-shot

BUMP → FLOAT:
  after 3 frames × 70 ms = 210 ms (4 frames for Robot/Consultant):
    clear bumpAxis, bumpDirection
    resume float-<facing>

Power mode (isFrozen = true):
  freeze current frame; render Tailwind overlay on top
```

**Determining `bumpDirection`:** look at the velocity component on the collision axis just before the collision. If `velocityX > 0` and you hit a wall (horizontal collision), `bumpDirection = +1` (you were moving right). Choose the bump variant matching `bumpDirection`.

---

## 6. TaxGhost

Wandering monster with periodic ambush charges. No bump animations (it phases through walls visually).

**Bounds:** 38 × 36 px. **Hitbox:** 28 × 28 px, centered. **Pivot:** center.

**Sprite cell:** 88 × 88.

### Animation states

| State | Folder | Frames | Duration | Loop | Trigger |
|---|---|---|---|---|---|
| float-left | `float-left/` | 6 | 140 ms | yes | wandering, facing left |
| float-right | `float-right/` | 6 | 140 ms | yes | wandering, facing right |
| charge-left | `charge-left/` | 5 | 80 ms | yes | ambushing, facing left |
| charge-right | `charge-right/` | 5 | 80 ms | yes | ambushing, facing right |

### Animation state machine (TaxGhost)

```
WANDER phase (behaviorState == "wandering"):
  → float-<facing>

AMBUSH phase (behaviorState == "ambushing"):
  → charge-<facing>

facing is determined from velocity.x sign

Power mode (isFrozen):
  freeze current frame; Tailwind overlay on top
```

The charge animation cycles faster (80 ms/frame) than float (140 ms/frame), giving the visual "rushing" feel during ambush.

---

## 7. Founder

Inertial bouncer with periodic surprise homing bursts. Standard floater bump system.

**Bounds:** 30 × 40 px. **Hitbox:** 22 × 32 px, centered. **Pivot:** center.

**Sprite cell:** 88 × 88.

### Animation states

| State | Folder | Frames | Duration | Loop |
|---|---|---|---|---|
| float-left | `float-left/` | 6 | 140 ms | yes |
| float-right | `float-right/` | 6 | 140 ms | yes |
| bump-horizontal-left | `bump-horizontal-left/` | 3 | 70 ms | no |
| bump-horizontal-right | `bump-horizontal-right/` | 3 | 70 ms | no |
| bump-vertical-left | `bump-vertical-left/` | 3 | 70 ms | no |
| bump-vertical-right | `bump-vertical-right/` | 3 | 70 ms | no |

**Animation state machine:** identical to Wisp (§5).

The "surprise" homing bursts change velocity but **do not change the animation** — the Founder visually keeps floating regardless of whether it's bouncing inertially or homing. The visual cue is purely speed (the sprite moves faster during a burst).

---

## 8. Consultant

Vertical-column chaser. Spawned only as a Bureaucrat transformation target. Slightly different frame counts than other floaters.

**Bounds:** 30 × 30 px. **Hitbox:** 22 × 24 px, centered. **Pivot:** center.

**Sprite cell:** 96 × 96 (larger than other floaters). Visible content sits below center within the cell, so there's an additional Y offset: `drawY = centerY - 96/2 + 8` (8 px down from the cell center).

### Animation states

| State | Folder | Frames | Duration | Loop |
|---|---|---|---|---|
| float-right | `float-right/` | **5** | 140 ms | yes |
| float-left | `float-left/` | **5** | 140 ms | yes |
| bump-horizontal-right | `bump-horizontal-right/` | **4** | 70 ms | no |
| bump-horizontal-left | `bump-horizontal-left/` | **4** | 70 ms | no |
| bump-vertical-right | `bump-vertical-right/` | **4** | 70 ms | no |
| bump-vertical-left | `bump-vertical-left/` | **4** | 70 ms | no |

**State machine:** identical to other floaters.

**Note on folder numbering:** Consultant's frame numbering in the source files follows right-first ordering (00–04 = float-right, 05–09 = float-left, then bumps). The folder structure on disk is what matters — just import each folder as a sprite group.

---

## 9. Robot

Horizontal-row chaser. Spawned only as a Bureaucrat transformation target. Bumps are slightly longer (4 frames instead of 3).

**Bounds:** 30 × 40 px. **Hitbox:** 22 × 32 px, centered. **Pivot:** center.

**Sprite cell:** 88 × 88.

### Animation states

| State | Folder | Frames | Duration | Loop |
|---|---|---|---|---|
| float-left | `float-left/` | 6 | 140 ms | yes |
| float-right | `float-right/` | 6 | 140 ms | yes |
| bump-horizontal-left | `bump-horizontal-left/` | **4** | 70 ms | no |
| bump-horizontal-right | `bump-horizontal-right/` | **4** | 70 ms | no |
| bump-vertical-left | `bump-vertical-left/` | **4** | 70 ms | no |
| bump-vertical-right | `bump-vertical-right/` | **4** | 70 ms | no |

Robot bumps run 4 × 70 = 280 ms (vs. 210 ms for Wisp/Founder).

**State machine:** identical to other floaters.

---

## 10. Tailwind (Power-Mode Overlay)

Source folder: `src/assets/spritesV2/Tailwind/` (6 frames: `Tailwind_0.png` – `Tailwind_5.png`).

This is a **shared global sprite** that visually replaces every active monster during P-coin power mode. The theme: Tailwind = "wind at your back", a meme-y chip-bag that signals "you've got the upper hand."

### Animation

- **Frames:** 6
- **Duration per frame:** 130 ms
- **Loop:** yes (780 ms cycle)
- **Single shared instance:** all monsters on screen draw from the *same* animation timer/index. They all show the same Tailwind frame at the same time. No per-monster offsets.

### Drawing the Tailwind overlay

Cell size: 64 × 64.

- **For Bureaucrat-type monsters (feet anchor):** draw the Tailwind cell so its bottom aligns with the monster's feet. `drawX = centerX - 64/2`, `drawY = feetY - 64 * 0.78` (same FEET_RATIO as Bureaucrat).
- **For everything else (center anchor):** `drawX = centerX - 64/2`, `drawY = centerY - 64/2`.

### When to render Tailwind

Replace the monster's normal sprite with Tailwind when:

- `isPowerModeActive() == true`, **AND**
- `monster.isActive == true` (dead monsters render nothing during power mode — no death animation, no chip-bag)

When power mode ends, swap back to the monster's normal animation. The frame index of the underlying sprite is preserved (or reset to 0 — the game doesn't care, since the visual was hidden during power mode).

---

## 11. Monster Spawn Indicator

Source folder: `src/assets/spritesV2/Monster-spawn/` (5 frames: `Spawn_00.png` – `Spawn_04.png`).

A short pulsating "ghost" animation that previews where a monster is about to spawn. Used both for fresh spawns (during a level) and respawns (after a kill).

### Animation

- **Frames:** 5
- **Total duration:** 500 ms (one full play)
- **Loop:** no — plays once, then despawns
- **Frame index:** computed from time remaining until spawn:
  ```
  progress = 1.0 - (timeRemaining / 500)
  frame = clamp(floor(progress * 5), 0, 4)
  ```

### Drawing the indicator

Cell size: `max(monsterWidth, monsterHeight) * 1.6` — bigger than the monster it represents, so it's visually distinct.

Position: centered on the upcoming monster's spawn point.

Render with **point filtering** (nearest-neighbor) — pixel-art scaling. Set `imageSmoothingEnabled = false` in Canvas; in Unity, use Point filter mode on the texture.

### When to render

Only during the final 500 ms (or 3 seconds depending on the spawn-indicator gating constant) before the monster spawns. Hide during non-PLAYING states (countdown, pause, menu, bonus).

The player's respawn indicator uses the same sprite at the player spawn point with ~500 ms duration.

---

## 12. Founding (Collectible)

Source folder: `src/assets/sprites/funding/` (legacy folder name from when these were called "fundings"; rendered the same as "Foundings"). Frames are numbered `funding_0.png` through `funding_7.png` (8 frames total for the "lit" cycle).

**Bounds & hitbox:** 25 × 25 px (no hitbox distinction — collected on simple overlap). **Pivot:** top-left.

**Sprite cell:** 32 × 32 with transparent padding. The visible artwork occupies roughly half the cell. To make it look the right size in the world, scale the sprite up by ~1.9× when drawing.

### Animation states

| State | Frames | Duration | Loop | Trigger |
|---|---|---|---|---|
| unlit | 1 (`funding_0.png`) | — | no | default state — not the next-in-sequence |
| lit | 8 (`funding_0.png` – `funding_7.png`) | 100 ms | yes | when `founding.isBlinking == true` (this is the next-correct Founding) |

### State machine

```
default state: unlit (static, single frame)

When this Founding becomes the next-correct one in sequence:
  set isBlinking = true → switch to lit animation (8-frame loop)

When collected:
  remove from world (no death animation)
```

Only **one Founding is blinking at any time** — the next-correct one in the active group's sequence. After it's collected, the FoundingManager sets `isBlinking = true` on the new next-correct one.

### Render math

```
hitboxSize = 25 px
drawSize = hitboxSize * 1.9 = ~47.5 px
offset = (hitboxSize - drawSize) / 2.2 ≈ -10 px
drawX = founding.x + offset
drawY = founding.y + offset
```

The asymmetric `/ 2.2` divisor (instead of `/ 2`) compensates for the asymmetric placement of the artwork within the source PNG. Eyeball-tune in Unity if it looks off.

---

## 13. Coins (Procedural)

**Coins are NOT sprite-based.** They're drawn each frame using primitives (rectangles, text). You can either:

1. **Recreate the procedural draw in Unity** with a custom shader or DrawProcedural — exact same look, no asset files needed.
2. **Pre-render the 4 coin types as sprites** for each P-coin color tier (7 colors × 4 types = ~10 unique sprites) and let Unity's animation system handle the pulse via a scale curve. This is simpler and probably what you want.

If you pre-render, replicate this draw recipe per coin:

### Coin shape (pixel octagon)

A 25 × 25 axis-aligned octagon. Build it as horizontal strips with the corner pixels removed:

```
Row 0–3:   inset 4 px on each side  (top chamfer)
Row 4–20:  full width
Row 21–24: inset 4 px on each side  (bottom chamfer)
```

The corners are symmetrically cut, top and bottom.

### Layers (back to front)

1. **Shadow** — a copy of the octagon offset by `(0, +1)` in dark semi-transparent black (~25% alpha). Adds depth.
2. **Main body** — solid color (see "Coin colors" below).
3. **Inner border** — a 1 px inset darker shade of the main color along the octagon's perimeter. Gives a "depth ring" look.
4. **Specular highlight** — a few bright-white pixels in the top-left, suggesting a glint.
5. **Letter** — the coin's identifying letter (`P`, `B`, `M`, or `F`), centered. Font: Pixelify Sans, weight bold, size ~55% of coin size. Color: white.

### Pulse animation

```
scale = sin(time_ms / 200) * 0.06 + 1
```

Amplitude ±6%, period ~628 ms. Apply uniformly (both X and Y) around the coin's center.

### Coin colors

| Type | Color | Letter |
|---|---|---|
| **P** (Power) — 7 tiers | varies (see below) | `P` |
| **B** (Bonus Multiplier) | yellow `#eab308` | `B` |
| **M** (Extra Life) | pink (various — match the existing spec) | `M` |
| **F** (Founder Mode) | orange `#f97316` | `F` |

P-coin color cycles through 7 tiers (advances on player jump/wall-hit/fall-off):

| Tier | Name | Hex |
|---|---|---|
| 0 | Blue | `#8fb7ff` |
| 1 | Pink | `#ee90cb` |
| 2 | Purple | `#8465ec` |
| 3 | Lime | `#abdd64` |
| 4 | Cyan | `#22d3ee` |
| 5 | Yellow | `#eab308` |
| 6 | Gray | `#91a6b0` |

### Coin physics (visual side-effect)

- **P-coin:** moves in a straight line; reflects off platforms/walls elastically. No gravity.
- **B/M/F coins (gravity-only):**
  1. Fall straight down at constant speed (~2 px/frame).
  2. On landing on a platform (within 4 px tolerance), stop falling and pick a random horizontal direction.
  3. Walk along the platform at slower speed (~1 px/frame).
  4. At the platform edge (0 px tolerance), fall off and resume falling.
  5. On the ground (canvas bottom), walk wall-to-wall.

In Unity, all of this is straightforward — give the coin a `Rigidbody2D`, use Continuous collision detection, and write a small AI script for the walk-on-platform-and-fall-off behavior.

---

## 14. Floor (Tiles)

Source folder: `src/assets/sprites/floor/` with two sub-folders: `striped/` and `clean/`. Each contains 9 color variants.

### Variants

| Color | Files |
|---|---|
| yellow-clean, gray-clean | `clean/floor_NN.png` |
| yellow-striped, gray-striped, blue-striped, orange-striped, purple-striped, green-striped, red-striped | `striped/floor_NN.png` |

Each map specifies one floor variant via its `floor` field.

### Source tile dimensions

- **Source:** 32 × 32 PNG.
- **Render:** top 25 rows used (keeps the diagonal striped cap); bottom 7 rows discarded.
- **Layout:** tiled horizontally across the full canvas width. `800 / 32 = 25` tiles per row.
- **Position:** the floor strip occupies `y = 575` to `y = 600` (the bottom 25 px of the playfield).

### Collision

The floor is **visual only**. The effective ground is `y = 575` (top of the floor strip). Don't add colliders to floor tiles — the game treats this as a hard floor in code.

### Unity setup

Import each floor PNG with Point filter mode, Pivot = Bottom-Left. Place them in a row at the bottom of the world. Or pack into a sprite atlas and use a single `SpriteRenderer` with a custom tiled-draw mode.

---

## 15. Platforms (Tiles + Chamfer)

Platforms are also procedurally drawn (with optional tile-theme overlays). They have two layers:

### Layer 1: solid color fill

For a platform `{ x, y, width, 25, color, strokeColor, roundedCorners }`:

- Fill the rectangle with `color` (default `#888888`).
- If `roundedCorners` flags are set per corner (`{ tl: true, tr: false, bl: true, br: false }` etc.), chamfer those corners with a 45° pixel-cut. Chamfer size: 6 px outer, 5 px inner if there's a 1 px border.
- Draw a 1 px border in `strokeColor` (default `#000`) around the outside, also chamfered if the corners are chamfered.

### Layer 2: tile-theme overlay (optional)

If `platform.tileTheme` is set (e.g., `"platform-green"`, `"platform-blue"`, `"platform-beige"`), overlay a tiled texture on the platform body. Source folders:

- `src/assets/horizontal-platforms/platform-green/` (and beige, blue) — left cap, middle (repeatable), right cap.
- `src/assets/vertical-platforms/platform-green/` etc. — top cap, middle, bottom cap.

The tile system has three pieces per direction:

```
Horizontal: [left-cap][middle][middle]...[middle][right-cap]
Vertical:   [top-cap]
            [middle]
            [middle]
            ...
            [bottom-cap]
```

Tile dimensions are roughly 25 × 25 (matches platform thickness). The middle tile repeats to fill the body; the caps go at the ends.

For platforms without native vertical tiles (some themes only have horizontal art), rotate the horizontal tiles 90° CW around their center to fake a vertical platform.

### Unity setup

Simplest: use Unity's Tilemap with a Rule Tile for each platform theme. The Rule Tile picks left-cap / middle / right-cap based on neighbors. Alternatively, write a procedural script that takes a `PlatformDefinition` ScriptableObject and instantiates tile sprites in a row.

For the chamfered corner, either:

- Pre-render the chamfered shape as a sprite (one per chamfer combination — there are 2⁴ = 16, but only ~4 are common).
- Use a shader that masks the corners based on `roundedCorners` flags.
- Just skip chamfering and use straight rectangles (the game still looks fine — the chamfer is a nice touch but not essential).

---

## 16. Floating Text

Source: no sprites — pure text rendering.

Each floating text has:

```
text       : string  // e.g. "200", "200 × 3", "+1 💡"
x, y       : world position (drift up over time)
startTime  : ms
duration   : ms (typically 1000, F-coin is 1500)
color      : string (typically "#FFFFFF", F-coin is "#f97316")
fontSize   : number (15 for normal, 18 for F-coin)
```

### Animation

```
elapsed = currentTime - startTime
progress = elapsed / duration   // 0.0 → 1.0

y_offset = -elapsed * 0.05      // drifts upward ~50 px over 1000 ms
alpha    = 1.0 - progress        // fades out linearly

drawX = x
drawY = y + y_offset
opacity = alpha
```

When `elapsed > duration`, the floating text is removed.

### Font

- Family: Pixelify Sans
- Size: 15 px (most) or 18 px (F-coin)
- Color: white default, orange `#f97316` for F-coin
- Weight: bold

### Unity setup

Use TextMeshPro with the Pixelify Sans font asset. Spawn each floating text as a short-lived prefab with a coroutine that drives upward motion and alpha fade.

---

## 17. Power-Mode & Frozen Rendering Rules

This is the most-asked-about visual subsystem. The rules:

### When P-coin power mode is active

1. **All active monsters** get `isFrozen = true`. Their animations *pause* — the current frame is held.
2. **All active monsters** render as the Tailwind overlay (instead of their normal sprite). Tailwind animates globally (single shared timer); all monsters show the same Tailwind frame.
3. **Dead monsters** (`isActive = false`) render nothing during power mode. There's no chip-bag death animation; they just disappear.
4. **The player swaps to the Power skin** (Sigurd → SigurdPower). Animation state and frame index unchanged.
5. **Difficulty scaling pauses** (no visual effect, but the ScalingManager freezes).
6. **Background music stops; power-up melody plays.**

### Approximately 2 seconds before power mode ends

- Set `monster.isBlinking = true` on all active monsters.
- The blink effect: alternate between the monster's "frozen" tint color (`#4444FF` or similar) and its normal color at ~300 ms intervals. In Unity: use a `Color.Lerp` with a square-wave time function.
- For the Tailwind overlay, this means: alternate between drawing the Tailwind frame normally vs. tinted blue. Simplest: tint the SpriteRenderer's color via `Color.Lerp(Color.white, blueTint, blinkPulse)` where `blinkPulse = (time / 300) % 1 < 0.5 ? 0 : 1`.

### When power mode ends

1. Clear `isFrozen` and `isBlinking` on all monsters. Resume their animations from the current frame.
2. Set each monster's `mutationEndTime = now + ~300 ms` (pass-through window). During this window, player-monster collision is *ignored* — visually nothing changes, but the player can't die yet. This protects against a Bureaucrat-that-morphed-to-Consultant landing on the player the instant power mode ends.
3. Swap player back to default Sigurd skin.
4. Resume scaling and respawn timers.
5. Resume background music.

### Frozen visual details

For monsters rendering with the Tailwind overlay during power mode, you don't really see the "frozen" color — Tailwind covers everything. The blinking effect at the end of power mode therefore appears as the Tailwind chip-bag blinking blue.

For sprites where you *do* see the frozen state (none currently — every monster gets Tailwind overlay), the convention is a blue tint at `#4444FF` overlaid on the sprite.

---

## 18. Render Order

Strict back-to-front order (set this up as a Unity sorting layer hierarchy):

1. **Background image** — per-map static PNG, fills 800 × 600.
2. **Floor strip** — decorative tiles at the canvas bottom.
3. **Platforms** — solid + tile-theme overlay + chamfered corners.
4. **Respawn / spawn indicators** — pulsating ghosts (where monsters will appear next).
5. **Foundings** — pickups with unlit/lit states.
6. **Coins** — P/B/M/F with pulse animation.
7. **Monsters** — all monster types. During power mode, all replaced with Tailwind overlay.
8. **Player** — Sigurd or SigurdPower skin.
9. **Floating text** — score popups, "+1 💡" notifications.
10. **HUD overlay** — separate screen-space canvas (above everything in world space).

In Unity, define Sorting Layers in this order. Each entity's SpriteRenderer goes on the matching layer. The HUD lives on a separate Canvas with Screen Space - Overlay.

---

## 19. Appendix: Animation Tables in One Place

For quick reference during implementation, here is every animation timing in one table.

| Entity | Animation | Frames | ms/frame | Total ms | Loop |
|---|---|---|---|---|---|
| **Player** | idle-left/right | 6 | 130 | 780 | yes |
| | run-left/right | 6 | 55 | 330 | yes |
| | jump-left/right | 3 | 100 | 300 | no |
| | fall-left/right | 3 | 100 | 300 | no |
| | land-left/right | 3 | 80 | 240 | no |
| | air-move-left/right | 1 | 120 | — | yes (single frame) |
| | float-left/right/down | 6 | 120 | 720 | yes |
| | victory-left/right | 4 | 140 | 560 | yes |
| **Bureaucrat** | walk-left/right | 6 | 100 | 600 | yes |
| | idle-left/right | 1 | 180 | — | yes |
| | fall-left/right | 3 | 120 | 360 | yes |
| | transition-left/right | 8 | 70 | 560 | no |
| **Wisp** | float-left/right | 6 | 140 | 840 | yes |
| | bump-h-left/right, bump-v-left/right | 3 | 70 | 210 | no |
| **TaxGhost** | float-left/right | 6 | 140 | 840 | yes |
| | charge-left/right | 5 | 80 | 400 | yes |
| **Founder** | float-left/right | 6 | 140 | 840 | yes |
| | bump-h-left/right, bump-v-left/right | 3 | 70 | 210 | no |
| **Consultant** | float-left/right | 5 | 140 | 700 | yes |
| | bump-h-left/right, bump-v-left/right | 4 | 70 | 280 | no |
| **Robot** | float-left/right | 6 | 140 | 840 | yes |
| | bump-h-left/right, bump-v-left/right | 4 | 70 | 280 | no |
| **Tailwind** | (single loop) | 6 | 130 | 780 | yes |
| **Spawn indicator** | (single play) | 5 | 100 | 500 | no |
| **Founding** | unlit | 1 | — | — | n/a |
| | lit | 8 | 100 | 800 | yes |
| **Coin pulse** | sin wave | — | — | ~628 (period) | yes |

### Pivot / cell-size summary

| Entity | Pivot | Sprite cell | Bounds | Hitbox |
|---|---|---|---|---|
| Player | bottom-center (feet) | 64×64 | 25×43 | 24×42 |
| Bureaucrat | bottom-center (feet, 78% down cell) | 88×88 | 25×39 | 18×32 |
| Wisp | center | 88×88 | 30×52 | 22×42 |
| TaxGhost | center | 88×88 | 38×36 | 28×28 |
| Founder | center | 88×88 | 30×40 | 22×32 |
| Consultant | center (offset +8 px) | 96×96 | 30×30 | 22×24 |
| Robot | center | 88×88 | 30×40 | 22×32 |
| Tailwind | feet for Bureaucrat, center otherwise | 64×64 | (varies) | — |
| Spawn indicator | center, scale ×1.6 | (varies) | (max of monster) | — |
| Founding | top-left, scale ×1.9 | 32×32 | 25×25 | 25×25 |

---

## Implementation Order Suggestion

If your friend wants to get visual parity quickly, build in this order:

1. **Player Sigurd default skin first.** All ~17 animation states with the full state machine. Get jump → fall → land working correctly with the LUT (see master spec §6). This is the hardest single piece; everything else is simpler.
2. **Player SigurdPower skin.** Verify the hot-swap works.
3. **Bureaucrat with transition animation.** This validates the one-shot animation → gameplay-event coupling.
4. **Wisp.** Validates the floater bump system.
5. **The other three floaters** (Founder, Consultant, Robot) — they all share Wisp's pattern, mostly different sprite folders and slightly different frame counts.
6. **TaxGhost.** Simpler than the floaters (no bumps).
7. **Tailwind overlay.** Power-mode visual swap.
8. **Spawn indicator.** Easy 5-frame one-shot.
9. **Founding.** Easy two-state pickup.
10. **Coins.** Pre-render as sprites with a scale-pulse animation.
11. **Floor and platforms.** Tile-based, mostly mechanical.
12. **Floating text.** Last; cosmetic.

Each step independently testable in a scratch Unity scene — no need to wait for game logic.

---

*This document is exhaustive for the visual layer. For game logic, scoring, state machine, monster AI, coin spawn formulas, and host bridge, see `specs/unity-port-spec.md` in this same folder.*
