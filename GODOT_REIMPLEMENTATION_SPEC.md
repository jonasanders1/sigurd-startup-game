# Sigurd Startup — Godot Reimplementation Specification

**Source game:** Sigurd Startup v4.6.0 (TypeScript / Canvas 2D / React)
**Target:** Godot 4.x reimplementation, faithful to current behavior
**Authoring date:** 2026-05-05
**Inspiration / design lineage:** 1984 Tehkan *Bomb Jack* (see `game-specs.md`); this game adapts BJ to a Norwegian-startup satire theme.

> **Read order:** §1 → §2 (architecture) → §3–§12 (mechanics) → §13–§17 (content/UI/assets). Every numeric constant has a source-file reference. Where the original game uses live runtime tuning (`getTuned("…")`), the value listed is the canonical default from `src/config/tuningDefaults.ts` and `src/config/*`.

---

## Table of contents

1. Overview & target frame
2. Architecture & state machine
3. Display, coordinates, frame timing
4. Input
5. Player physics (movement, gravity LUT, jumps, float, fast-fall)
6. Collision & resolution
7. Bombs (sequence, scoring, end-of-level bonus)
8. Coins (P, B, M, F) — spawn rules, physics, effects
9. Power mode (P-coin freeze)
10. Multiplier system
11. Monsters (types, AI, spawning, respawn, scaling)
12. Difficulty scaling (ScalingManager)
13. Audio
14. UI / Menus / HUD
15. Tutorials & missions
16. Maps / levels
17. Bridge integration (`window.sigurdGame`)
18. Asset inventory
19. Suggested Godot scene & node layout
20. Acceptance criteria checklist
21. Appendix A — full constants dump

---

## 1. Overview & target

- **Genre:** 2-D arcade platformer (single screen, fixed camera).
- **Loop:** Collect 23 "financing" bombs in correct sequence per map; avoid/freeze "bureaucrat" enemies; chase coin power-ups for points and survival; clear 9 maps to win.
- **Theme:** Norwegian startup-bureaucracy satire. Player = Sigurd (founder). Enemies = bureaucrats, ghosts, robots, consultants. Bombs = funding rounds. Coins = political tailwinds, business ideas, etc.
- **Resolution:** 800 × 600 logical pixels, fixed; 4:3 aspect; pixel-art; integer scaling preferred.
- **Tick rate:** 60 Hz logic baseline; all per-frame deltas normalized as `delta_ms / 16.67` (so 120 Hz halves the step).
- **Bombs per level:** 23 (game-specific reduction from BJ's 24; missing bombs padded at load time).
- **Lives:** start 3, cap at 9 (HUD constraint).
- **Total levels:** 9 (`level1`–`level9`, see §16).

---

## 2. Architecture & state machine

### 2.1 High-level pattern

Original game uses a manager-bus pattern with Zustand stores. For Godot, recommended translation:

| TS concept            | Godot translation                                           |
| --------------------- | ----------------------------------------------------------- |
| `GameManager`         | A `GameRoot` autoload (Singleton) that owns world & UI tree |
| `GameStateManager`    | Autoload `GameState` with state enum + signals              |
| `GameLoopManager`     | `_physics_process(delta)` on a `GameWorld` node             |
| `Zustand stores`      | Resource-based singletons with signals                      |
| `RenderManager`       | Native node rendering — delete this layer                   |
| `EventBus` (implicit) | Godot signals on autoloads                                  |
| `BridgeAdapter`       | Autoload `Bridge` with `JavaScriptBridge` binding (web export) or stub |
| `pauseClock`          | Custom autoload `PauseClock` with `paused_ms` accumulator   |

### 2.2 Game state enum

```
GameState: MENU, COUNTDOWN, PLAYING, PAUSED, BONUS, VICTORY, GAME_OVER, MAP_CLEARED
```

### 2.3 State transition table

| From         | Trigger                                       | To              | Notes                                                   |
| ------------ | --------------------------------------------- | --------------- | ------------------------------------------------------- |
| `MENU`       | `start_new_game()` (after credit deduct OK)   | `COUNTDOWN`     | 3 s timer fires `→ PLAYING`                             |
| `COUNTDOWN`  | timer elapsed                                 | `PLAYING`       |                                                         |
| `PLAYING`    | all 23 bombs collected                        | `MAP_CLEARED`   | LevelManager.checkWinCondition                          |
| `MAP_CLEARED`| auto                                          | `BONUS`         | shows bonus screen                                      |
| `BONUS`      | bonus counter animation done (`~6 s`) + 2 s   | `COUNTDOWN`/`VICTORY` | Next map or, if last map cleared, victory         |
| `PLAYING`    | monster collision (no power, no god, not invuln) | `GAME_OVER` (lives = 0) or back to `PLAYING` (life lost) |                                                |
| `PLAYING`    | pause input (`P`)                             | `PAUSED`        |                                                         |
| `PAUSED`     | resume                                        | `COUNTDOWN`     | 3 s relead-in                                           |
| `(any)`      | quit-to-menu                                  | `MENU`          |                                                         |
| `GAME_OVER`  | restart (after credit deduct OK)              | `COUNTDOWN`     |                                                         |

### 2.4 Pause clock semantics

`PauseClock` stores `is_paused`, `pause_start_time`, `total_paused_time`. The "adjusted now" used by all time-based subsystems is:

```
adjusted_now = wall_clock_now - total_paused_time - (is_paused ? now - pause_start_time : 0)
```

Critical: monster scaling, spawn timers, respawn queue, P-coin freeze duration ALL read this clock — not raw `Time.get_ticks_msec()`. Without this, spawn/freeze timers explode after a long pause.

### 2.5 Multi-reason pause (`PauseReason`)

Three independent reasons compose via a Set; "paused" means *any* reason present:

```
PauseReason: Default (menus, transitions), PowerMode (P-coin active), MonsterScaling (internal)
```

Resume only when *all* reasons cleared. Use `Dictionary[PauseReason, bool]` or `Array[PauseReason]` with set-style add/remove.

---

## 3. Display, coordinates, frame timing

- **Logical canvas:** 800 × 600 px (`CANVAS_CONFIG.WIDTH/HEIGHT`).
- **Origin:** top-left, +X right, +Y down (Godot default).
- **Y = 600 is the floor** (no floor entity; canvas bottom acts as ground; player clamps; bombs/coins land on it).
- **Scaling:** Godot project → `display/window/stretch/mode = "viewport"`, `aspect = "keep"`. Render mode pixel-perfect; disable filtering.
- **Logical render order (z-index):**
  1. Background image (one PNG per map, stretched to 800×600)
  2. Platforms (rectangles or tile sprites)
  3. Bombs (static sprites)
  4. Coins (animated sprites)
  5. Monsters
  6. Player
  7. Floating texts (score popups)
  8. Hitbox debug overlay (toggle via `DEV_CONFIG.SHOW_HITBOXES`)

- **Frame timing:** Use `_physics_process(delta)` at 60 fps. For the LUT-based physics, internally compute `delta_ms = delta * 1000.0` and use `delta_ms / 16.67` everywhere a per-frame value is multiplied.

- **No interpolation** between physics frames is required for parity. The original renders directly off logic state.

---

## 4. Input

### 4.1 Keyboard mapping (default)

| Action       | Keys                              | Held vs. edge                  |
| ------------ | --------------------------------- | ------------------------------ |
| Move left    | `A` or `Left`                     | Held                           |
| Move right   | `D` or `Right`                    | Held                           |
| Jump         | `W` or `Up`                       | Held — *also* a modifier       |
| Fast fall / short-jump modifier | `S` or `Down`        | Held — modifier when pressed   |
| Super jump (high-jump) modifier | `Shift`              | Held — modifier when pressed   |
| Float / glide | `Space` or `Z`                   | Held                           |
| Pause        | `P`                               | Edge                           |
| Mute         | `M`                               | Edge                           |
| Confirm      | `Enter`                           | Edge                           |
| Back         | `Escape`                          | Edge                           |

### 4.2 Input semantics

- All movement/jump/float inputs are **held** state — read fresh each tick.
- **Jump** triggers on the **rising edge** of `jump_pressed AND is_grounded AND NOT is_jumping`.
- **Float** is active only while `Space` is *currently held* AND player is airborne.
- Modifier resolution at jump-press time:
  - `Down` held → short jump (Down wins)
  - `Shift` held (no Down) → high jump
  - else → normal jump
- **Late-Shift upgrade window (80 ms):** if `Shift` is registered up to 80 ms after a normal jump started, AND the player is still ascending AND `Down` is not held, swap the ascend rate to high-jump's. Compensates for keydown ordering races. Source: `PlayerManager.ts:277`.
- **Window blur** clears all held input.

### 4.3 Gamepad / touch

- Out of scope for v1 in original; if added, map: A=Jump, B=Float, dpad/left-stick=move, Start=pause.
- Touch is explicitly *not recommended* for this gameplay.

---

## 5. Player physics

### 5.1 Dimensions, spawn

- Hitbox: **25 × 35** px (`ENTITY_SIZES.PLAYER.WIDTH / HEIGHT`).
- Sprite: **32 × 32** source, drawn at **1.25× = 40 × 40**, anchored bottom-center on the hitbox.
- Spawn position (default; map can override): `(CANVAS_WIDTH/2, CANVAS_HEIGHT-100) = (400, 500)`. Each map may declare its own `playerStart`.
- Initial state: `vx=0, vy=0, isGrounded=false, isFloating=false, isJumping=false, gravityIndex=64 (apex)`.

### 5.2 Horizontal movement

- **Speed:** `MOVE_SPEED = 4` px/frame at 60 Hz (`PHYSICS_CONFIG.MOVE_SPEED`).
- **No acceleration, no friction.** Velocity is set instantly from input (`-speed`, `0`, `+speed`).
- **Full air control.** Horizontal velocity is independent of vertical state.
- **Both held →** Right wins (LEFT processed first then overwritten by RIGHT — `PlayerManager.ts:236-237`).
- **Movement application:** `x += vx * (delta_ms / 16.67)` — frame-rate independent.
- **Boundary clamp:** hard clamp at `x ∈ [0, 800-width]`.

### 5.3 Vertical motion — gravity LUT

This is the most distinctive mechanic and **must** be replicated exactly. The original derives this from BJ §4.3.

```
GRAVITY_LUT_SIZE     = 128
GRAVITY_APEX_INDEX   = 64
GRAVITY_TERMINAL_INDEX = 127
GRAVITY_INITIAL_UP_VY = 11   (px/frame at 60 Hz, magnitude)
GRAVITY_TERMINAL_VY   = 8    (px/frame at 60 Hz, magnitude)
```

LUT shape:
- For `i ∈ [0, 64]`: `vy[i] = -INITIAL_UP_VY * (1 - i/64)²`  (quadratic ease-out, upward)
- For `i ∈ (64, 127]`: `vy[i] = +TERMINAL_VY * ((i-64)/63)²` (quadratic ease-in, downward)

So at index 0, vy = -11; at 64, vy = 0; at 127, vy = +8.

**Per-frame update:**
1. Determine ascend-rate this frame:
   - If descending (`gravityIndex >= 64`): rate = `1.0`.
   - Else (ascending): rate = `jumpAdvanceRate` (set per jump type at press; see §5.4).
2. `gravityIndex = min(gravityIndex + (delta_ms / 16.67) * rate, 127)`
3. `vy = LUT[floor(gravityIndex)]`
4. `y += vy * (delta_ms / 16.67)`

**On grounded:** snap `gravityIndex = 64`, `vy = 0` (prevents sub-pixel bob).

### 5.4 Jump types

Three jumps; same LUT, different starts and ascent rates.

| Type   | Trigger                   | `startIdx` | `ascendAdvanceRate` (default) | Peak height |
| ------ | ------------------------- | ---------- | ------------------------------ | ----------- |
| Normal | Jump only                 | 0          | 1.0 (`JUMP_NORMAL_RATE`)       | ~3/4 screen |
| High   | Jump + Shift              | 0          | 0.45 (`JUMP_HIGH_RATE`)        | full screen |
| Short  | Jump + Down               | 35 (`JUMP_SHORT_START_IDX`) | 1.0           | ~½ screen   |

On jump press:
- Set `isJumping = true`, `jumpStartTime = now`, `isGrounded = false`.
- `gravityIndex = startIdx`
- `jumpAdvanceRate = ascendAdvanceRate`
- `vy = LUT[startIdx]`
- Fire `PLAYER_JUMP` SFX.
- Award **+10 trampoline points** × multiplier (BJ §4.8 jump bonus). Also advance every live P-coin's color index (see §8/§9).

When `gravityIndex` crosses 64 while descending, set `isJumping = false` (gates fast-fall input).

### 5.5 Float / glide

While airborne:
- If `Space` held → `isFloating = true`, snap `gravityIndex = GRAVITY_FLOAT_INDEX = 76`.
- While floating, **do not advance** `gravityIndex`. Use `vy = LUT[76]` (~+0.13 px/frame, very slow descent).
- Release `Space` → `isFloating = false`; index resumes advancing.
- Can be re-engaged any number of times; this is the trademark hover-flutter.
- Cleared on landing.

### 5.6 Fast fall

- Trigger: `Down` held while airborne **after apex** (`!isJumping`).
- Effect: snap `gravityIndex = GRAVITY_FAST_FALL_INDEX = 100` (well past apex, near-terminal).
- Cleared on landing.

### 5.7 Trampoline-point events (BJ §4.8 — extended)

Every event below awards **10 base × current multiplier**:

1. **Jump start** (rising edge, grounded, jump pressed)
2. **Wall hit on canvas boundary** (player x clamps and the wall-contact edge gate fires)
3. **Wall hit on platform side** (collision normal.x ≠ 0, fresh contact)
4. **Fall off platform** (`wasGroundedLastFrame && !isGrounded && !isJumping`)

**Edge gate (anti-glitch):** wall-hit events can fire only on a *fresh* frame (not while continuously held). Track `wallContactedLastFrame` and `wallContactedThisFrame`; fire only if `!wasContact && !wallContactedLastFrame`. Source: `bjRules.ts:354-360`, `PlayerManager.ts:87-96`.

**Side effect:** every trampoline event also advances the live P-coins' color indices (§8.1).

### 5.8 Animation states

Single sprite-state machine driven by physics flags:

```
if isFloating:
    if moveX > 0: float-right  else if moveX < 0: float-left  else: float-stationary
elif !isGrounded:
    verb = isFalling ? "fall" : "jump"
    pick {verb}-{lastDirection or current input}
elif isMoving (vx != 0):
    walk-{direction}
else:
    idle-{lastDirection}
```

Frame counts and durations (source: `Player.ts`, `SpriteInstance.ts`):

| Animation         | Frames | Frame duration | Loop |
| ----------------- | ------ | -------------- | ---- |
| idle-left/right   | 11     | 130 ms         | yes  |
| walk-left/right   | 12     | 50 ms          | yes  |
| jump-left/right   | 1      | 100 ms         | no   |
| fall-left/right   | 1      | 100 ms         | no   |
| float-stationary/left/right | 5 | 120 ms      | yes  |

Float frames are mirrored opposite to other anims (source frames face opposite, so flip rule inverts).

---

## 6. Collision & resolution

### 6.1 Shapes

- Player ↔ Platform: AABB ↔ AABB
- Player ↔ Bomb: ellipse-vs-AABB (bomb hitbox = 25 px ellipse)
- Player ↔ Coin: AABB ↔ AABB
- Player ↔ Monster: shape-dependent (see `monsterHitboxes.ts`):
  - Most monsters: **ellipse** of 25 × 25
  - Rotated rect for charging Ambusher (UFO during burst)
  - Plain 25 × 25 rect for Sphere/Orb airborne forms

### 6.2 Player ↔ platform resolution

Up to **4 iterations per frame**, picking the smallest non-zero penetration each pass:

1. Compute next-frame position.
2. For each platform, compute X and Y overlap.
3. Pick entry axis: previous-frame overlap on one axis → enter on the other; corner → smaller overlap wins (ties → Y/landing bias).
4. Apply resolution by collision normal:
   - **`normal.y = -1` (landed on top):** `y -= pen`, `vy = 0`, `isGrounded = true`, `isFloating = false`, `isJumping = false`, `gravityIndex = 64`, `jumpAdvanceRate = 1.0`.
   - **`normal.y = +1` (head-bumped):** `y += pen`, `vy = 0`, `gravityIndex = 64`.
   - **`normal.x = ±1` (side):** push out, `vx = 0`, fire trampoline if fresh wall contact.

**Resting-contact tolerance:** with strict `>` penetration tests, a player exactly snapped to a surface reads as non-colliding next frame, causing `isGrounded` flicker. Solution: 1.0 px tolerance probe — if `bottom` is within ±1 px of any platform top *and* horizontally overlapping, treat as grounded. Same probe checks canvas bottom (y = 600).

### 6.3 Boundaries

- Left/right/top: clamp position; on actual clamp event, fire trampoline (with edge-gate).
- Bottom: clamp; for the player this is the ground (no death from floor unlike BJ).

### 6.4 Player ↔ monster

Skip a monster from the collision check if **any** of these are true:
- `!monster.isActive`
- `!monster.isLethal && !monster.isFrozen` (spawn-invulnerable; see §11.4)
- `monster.mutationEndTime > now` (transform pass-through window)

Frozen monsters do **not** kill — touching them in power mode kills *them* (§9).

---

## 7. Bombs

### 7.1 Layout & data shape

- Each map declares **23 bombs** (`GAME_RULES.TOTAL_BOMBS = 23`). At load time, if the map declares fewer, pad with placeholder bombs in a fresh group so the level stays clearable. Source: `bjRules.ts:41-57`.
- Bomb fields: `{x, y, width=25, height=25, group:int, order:int, isCollected, isBlinking}`.
- Bombs are **organized into groups** with an explicit `groupSequence` (e.g., `[1,2,3,4,5,6]`).

### 7.2 Lit-bomb chain

- The "lit" (next-correct) bomb is the lowest `order` in the **active group**.
- **Active group:** `null` until the player collects their first bomb. That bomb's group becomes active. Once *all* bombs of the active group are collected, the next group in `groupSequence` becomes active.
- "Lit" visualization: the lit bomb pulses / has the firebomb sprite (`funding/funding_*.png` set with brighter glow). All others are unlit.
- `correctOrderCount` increments only when the lit bomb is collected. Out-of-order bombs are still removed from the field but score less.

### 7.3 Scoring

| Action                              | Points                          |
| ----------------------------------- | ------------------------------- |
| Collect non-lit (out-of-order) bomb | **100 × multiplier**            |
| Collect lit bomb                    | **200 × multiplier** (firebomb) |

End-of-level bonus, applied raw (no multiplier), based on `correctOrderCount`:

| Correct lit collects | Bonus      |
| -------------------- | ---------- |
| 23 (perfect)         | 50,000     |
| 22                   | 30,000     |
| 21                   | 20,000     |
| 20                   | 10,000     |
| < 20                 | 0          |

Bonus is **NOT thresholdable** for B-coin spawning (§8.2).

### 7.4 Win condition

`collectedBombs.length == map.bombs.length` → `MAP_CLEARED`.

---

## 8. Coins

Five coin types. All sprites 25 × 25 px.

### 8.1 P-coin (Powerball / Politisk Ryggvind)

| Tier | Color           | Hex       | Points (base × mult) | Power-mode duration |
| ---- | --------------- | --------- | -------------------- | ------------------- |
| 0    | Blue            | `#8fb7ff` | 100                  | 3 s                 |
| 1    | Pink            | `#ee90cb` | 200                  | 4 s                 |
| 2    | Purple          | `#8465ec` | 300                  | 5 s                 |
| 3    | Lime            | `#abdd64` | 500                  | 6 s                 |
| 4    | Cyan            | `#22d3ee` | 800                  | 7 s                 |
| 5    | Yellow          | `#eab308` | 1000                 | 8 s                 |
| 6    | Gray/Silver     | `#91a6b0` | 2000                 | 10 s                |

**Spawn rule (token bucket):**
- Every collected bomb adds tokens to the P-bucket: firebomb (lit) = **+2 tokens**, normal = **+1 token**.
- When `tokens >= 18` (`POWER_COIN_SPAWN_INTERVAL`), spawn 1 P-coin and subtract 18.
- **Bucket pauses** while a P-coin is on screen *or* a P-coin freeze is active (no stacking).
- Hard cap **2 per level**.
- Tutorials skip P-coin spawning entirely.

**Spawn point:** picked from the map's `POWER`-typed `coinSpawnPoints`; falls back to a random on-screen location if none.

**Movement (reflective bounce):**
- Velocity magnitude = `COIN_BOUNCE_SPEED = 3` px/frame.
- Initial angle: random 0–360° (or `spawnAngle` from spawn point).
- No gravity. Reflects off platforms (compute reflection via normal: `v' = v - 2(v·n)n`) and off canvas edges (axis flip). No damping; perpetual bounce until collected or freeze starts.

**Color advancement:**
- Starts at index 0 (Blue).
- Index advances by **+1** (mod 7) on **every trampoline event** (jump start, wall hit, fall-off — same set as §5.7).
- *NOT time-based.* Skilled players manipulate by jumping into walls to reach Yellow/Gray.

**On collection:** award `tier.points × multiplier`, start freeze for `tier.duration` (see §9), fire `POWER_COIN_ACTIVATE` SFX, start `POWER_COIN_AMBIENT_START` loop.

### 8.2 B-coin (Bonus multiplier)

- Color: `#eab308` (yellow).
- **Spawn condition:** every time the *thresholdable* score crosses a multiple of **5,000**. Only **bombs + monster-power-kills + trampoline events** are thresholdable. Coin pickups, level-end bonuses, and B-coin pickups themselves do **NOT** count (prevents cascade).
  - Implementation: track `bombAndMonsterPoints`; on add, compute crossed `5_000` boundaries; for each crossing, attempt spawn.
- Cap **5 per level**, **only 1 alive at a time**. Missed thresholds are *consumed* (not queued).
- **Score on pickup:** **1000 × multiplier**.
- **Effect:** multiplier += 1, capped at 5.
- **Multiplier persists across levels** (only resets on game over).
- **Movement (gravity-only / "edge-fall"):** falls from spawn at `vy = 2` px/frame; on landing on a platform (within 4 px), snaps to the platform top, picks a random direction (±1) and walks at `2` px/frame; bounces off canvas walls; falls off platform edges; lands on canvas floor (y = 600), bounces (random dir), walks forever until collected.

### 8.3 M-coin / E-coin (Extra Life)

- Color: `#ee90cb` (pink).
- **Spawn condition (death-generosity):** spawn when `effective = bonusCoinsCollected + 2*livesLost` crosses a new multiple of **8** (`EXTRA_LIFE_COIN_RATIO = 8`, `EXTRA_LIFE_DEATH_GENEROSITY = 2`). Each unique milestone fires once (deduped via `triggeredSpawnConditions`).
- No per-level cap; counters persist across levels until game over.
- **Score on pickup:** **1000 × multiplier**.
- **Effect:** lives += 1, cap at `MAX_LIVES = 9`.
- Movement: same gravity-only / edge-fall as B-coin.

### 8.4 F-coin (Founder Mode / FAFO / Forretningsidé)

- Color: `#f97316` (Tailwind orange-500).
- **Spawn rule (run-level + bomb-trigger):**
  1. At game start: roll once. With **5%** probability (`F_COIN_RUN_CHANCE`), pick a random target level in `[2, 8]` (level 1 excluded — rookie gate; max bound is `F_COIN_MAX_LEVEL = 8`). Pick random target bomb count in `[1, 23]`.
  2. When the player collects that many bombs on the target level, spawn 1 F-coin.
- Per-run cap: **2** (`F_COIN_RUN_CAP`).
- Spawn from `FOUNDER_MODE` spawn points if available, else from `BONUS_MULTIPLIER` points, else fallback.
- Movement: gravity-only / edge-fall like B-coin.
- **Score on pickup:** **0** in-game.
- **Effect:** call `bridge.grantBusinessIdea(1)` — fire-and-forget call to the host page that increments the player's real-world balance ("Forretningsideer"). Fires `F_COIN_COLLECT` SFX, big visual feedback ("FAFO"). Idempotent server-side rate limiting assumed.

### 8.5 MONSTER_FREEZE coin

- Enum exists; not actively spawned in current build. Treat as deprecated; do not implement unless porting later changes.

### 8.6 Visual feedback (all coins)

On collection, spawn a floating point-text that rises ~30 px and fades over ~700 ms.

---

## 9. Power mode

Triggered exclusively by P-coin pickup. Duration = the picked P-coin's color-tier duration (3–10 s).

While active:
1. **All monsters frozen:** `isFrozen = true`, set `frozenAt = now`. Movement classes skip `update()` for frozen monsters.
2. **Touching a monster KILLS it.** Each kill awards an escalating score:

| Kill # in this freeze | Points (× multiplier) |
| --------------------- | --------------------- |
| 1                     | 100                   |
| 2                     | 200                   |
| 3                     | 300                   |
| 4                     | 400                   |
| 5                     | 500                   |
| 6+                    | 600 (capped)          |

   Reset kill count at every freeze start.
3. **Difficulty scaling paused** (`ScalingManager.pauseForPowerMode()`).
4. **Spawn & respawn managers paused** (no new monsters, no respawns until freeze ends).
5. **Audio:**
   - Background music ducked / paused.
   - Start `POWER_COIN_AMBIENT_START` looped buffer (volume = SFX × 1.4).
   - Start synthesized "power-up melody": square wave, motif `[A5 880 Hz, C6 1046.5, B5 987.77, D6 1174.66]`, 0.15 s/note, looped for the freeze duration.
6. **Blinking warning:** when `timeLeft <= 2 s`, set `monster.isBlinking = true`.

**On freeze end:**
- All surviving monsters unfrozen. Set `mutationEndTime = now + MUTATION_PASSTHROUGH_MS` (default ~500 ms) — collision treats them as non-lethal during this window. Required so the player isn't insta-killed by overlap on resume.
- **Wall-clock timestamp shift:** any AI fields holding raw wall-clocks (`lastSeenAt`, `nextHopTime`, `lastDirectionChange`, etc.) are bumped forward by the freeze duration so movement classes don't think 7 s of "gap" just elapsed.
- ScalingManager and SpawnManager resume.
- Audio: stop ambient loop, stop power-up melody, resume BGM.

**Pause/resume robustness:** when the *user* pauses during power mode, store each effect's `remainingDuration = endTime - now`. On resume, restore `endTime = now + remainingDuration` and **restart the synthesized melody** with that duration. On `GAME_OVER`, force-stop power mode (drop the effect, resume ScalingManager/GameStateManager without going through normal `remove()` to ensure the ambient loop doesn't outlive the run).

---

## 10. Multiplier system

- Tracked in `ScoreStore` as `multiplier ∈ {1,2,3,4,5}` and `multiplierScore` (progress).
- **Sole source of advancement: B-coin pickup → multiplier += 1, capped at 5.** No score-threshold-based progression in current build (the `MULTIPLIER_SYSTEM.THRESHOLDS = {1:0, 2:1800, ...}` table exists in code but is unused; B-coin is the only path).
- **Persists across levels.** Resets only on game-over / new run.

### 10.1 HUD presentation

- Multiplier label `xN MAX` (or `xN`) in pixel font at top-center.
- Per-tier color (HUD glow + B-coin progress-bar gradient):

| Tier | Gradient stops                          | Theme   |
| ---- | --------------------------------------- | ------- |
| x1   | `#7fb33d → #abdd64 → #c2eb83`           | green   |
| x2   | `#0e9fb8 → #22d3ee → #67e8f9`           | cyan    |
| x3   | `#ca8a04 → #eab308 → #fde047`           | yellow  |
| x4   | `#e8856e → #f2ae99 → #fcd5c8`           | salmon  |
| x5   | `#d56aaf → #ee90cb → #8465ec`           | magenta |

- **B-coin progress bar:** 160 × 3 px, fills `((bombAndMonsterPoints) % 5000) / 5000` from left to right; tier-colored.

---

## 11. Monsters

### 11.1 Types

| Enum                  | Norwegian name        | Color    | Movement class       | Notes                                  |
| --------------------- | --------------------- | -------- | -------------------- | -------------------------------------- |
| `MUMMY`               | Byråkrat              | green/black | Patrol (horizontal)+falling | Walks platform; transforms to Sphere/Orb at floor |
| `VERTICAL_PATROL`     | Vertikal-byråkrat     | red `#FF6B6B` | Patrol (vertical)  | Patrols a vertical wall, side-aware    |
| `BIRD`                | Skatte-spøkelset      | yellow `#FFD93D` | Chaser (A*)     | Persistent; one per level; corner spawn|
| `UFO`                 | Hodeløs Konsulent     | orange `#FF8800` | Ambusher         | Wanders, periodic burst toward player  |
| `HORN`                | Regel-roboten         | cyan `#4ECDC4` | Floater (bouncer) | Bounces; periodic homing surprise burst|
| `SPHERE`              | (airborne form)       | green→sphere color | Airborne (column-aligning) | Mummy transforms to this at floor |
| `ORB`                 | (airborne form)       | green→orb color | Airborne (row-aligning) | Mummy transforms to this at floor |

Sprite folders: `byråkrat/{green,black}/`, `vertikal-byråkrat/`, `skatte-spøkelset/`, `hodeløs-konsulent/`, `regel-roboten/`. Each has subfolders `walk/`, `idle/`, `freeze/`, `death/` (and `attack/` / `run/` variants for some). Frame durations are typically 100 ms walk, 80 ms death, 90–180 ms idle, 1000 ms freeze-still, 100 ms freeze-blink.

### 11.2 Movement classes (detailed AI)

#### Patrol (Mummy / Vertikal)
- Patrols within `[patrolStartX, patrolEndX]` (or Y for vertical). Speed scales live via ScalingManager.
- `walkLengths` field: deterministic count of edge-touches before the mummy "drops" off.
- **Falling phase:** scoots past patrol bound, then enters gravity descent (`MUMMY_FALL_GRAVITY` tunable); swept landing detection finds the next platform/floor.
- On reaching the floor, transform to `SPHERE` or `ORB` (based on per-mummy `transformTarget`, can also be `"NONE"` → die instead). Snapshot pre-transform shape so respawn restores Mummy.
- Mutation pass-through window: `mutationEndTime = now + MUTATION_PASSTHROUGH_MS` set on transform; player cannot be killed by the new airborne form during the window.

#### Chaser (Bird)
- One per level, persistent.
- Spawns at one of 4 corners (25 px padding). **Spawn corner is opposite the direction the player holds at level start** (e.g. holding Right+Down → bird spawns top-left). With ambiguous axis input (left+right), fall back to a default corner. Source: `birdSpawn.ts`, tested by `birdSpawn.test.ts`.
- Corner positions for 800 × 600 with 25 px padding:
  - top-left = (25, 25); top-right = (750, 25); bottom-left = (25, 550); bottom-right = (750, 550).
- **AI:** A*-pathfinding on a coarse grid (cell ≈ ⌈25/2⌉ ≈ 12.5 px), Manhattan heuristic, cardinal moves only (no diagonals). Target = a *delayed snapshot* of the player position, refreshed every `BIRD_TARGET_DELAY_MS`. Hop a fixed `BIRD_HOP_DISTANCE` (~50 px) along the path, then rest `BIRD_HOP_REST_MS` before the next hop. Iterations per pathfind clamped via `ASTAR_MAX_ITERATIONS`.
- Speed scaled by ScalingManager (`BIRD_BASE_SPEED`, `BIRD_SPEED_SCALING`, `BIRD_MAX_SPEED`).

#### Ambusher (UFO)
- Two states: `wandering`, `ambushing`.
- **Wandering:** pick a random direction from 8 (cardinal+diagonal), move toward a random point at `[50, 150]` px distance. Re-pick direction every `[2, 4] s`, or on a wall/platform hit (billiard-ball ricochet). Speed varies with distance to player: `speed = base * 0.5 * (near + (far - near) * proximity)`, where `proximity = min(distToPlayer / UFO_DIST_RAMP_PX, 1)`. Tunables: `UFO_DIST_FACTOR_NEAR`, `UFO_DIST_FACTOR_FAR`, `UFO_DIST_RAMP_PX`.
- **Ambushing:** triggers when `ambushCooldown >= AMBUSH_INTERVAL`. Speed × **3.0**. Heads straight to a snapshot of the player's position at burst start. On obstacle, switch back to wander.

#### Floater (Horn)
- Velocity vector initialized from `startAngle°`. Every frame, magnitude is rescaled to the current scaled speed (so scaling changes apply live). Frame-rate independent.
- Bounces:
  - Platform: `v' = v - 2(v·n)n` reflection.
  - Boundary: flip the relevant axis.
  - Add a small random angle variance `(rand-0.5) * bounceAngle` on each bounce.
- **Surprise burst:** every `[HORN_SURPRISE_INTERVAL_MIN, MAX]` (staggered per instance), redirect velocity straight toward the player at `speed * HORN_SURPRISE_BOOST` for `HORN_SURPRISE_DURATION` ms.

#### Airborne (Sphere / Orb)
- Created at Mummy's floor position when transform fires.
- **Per-monster jitter** stamped at transform time:
  - `homingScale ∈ [0.7, 1.3]` (multiplicative)
  - `homingOffset ∈ ±15` px (lane offset)
- **Constrained axis (the one being aligned to player):**
  - Sphere → X (column)
  - Orb → Y (row)
- **Free axis:** initial kick of `±speed` (sphere goes upward at -speed from ground; orb gets random sign × `CONSTRAINED_KICK_MULT`).
- **Homing spring (Hooke's law) on constrained axis:**
  - `k = SPHERE_HOMING_RATIO * 0.02 * rampFactor * homingScale`
  - `displacement = player[axis] + homingOffset - monster[axis]`
  - Velocity capped at `speed * VELOCITY_CAP_MULT`.
  - `rampFactor` ramps 0 → 1 over `SPHERE_HOMING_RAMP_MS` after spawn.
- **Axis-separated collision:** step X then Y independently, bouncing off platforms (slightly inflated) and canvas edges.

### 11.3 Spawning (`OptimizedSpawnManager`)

Each map declares `monsterSpawnPoints[]`:

```
{
  spawnDelay: int (ms from level start, on adjusted clock),
  createMonster: factory returning Monster,
  respawnInterval?: int (ms; >0 = continuous),
  maxSpawns?: int (hard cap on fires),
  color?: optional override,
}
```

Each frame the manager iterates scheduled spawns: any whose `scheduledTime <= adjustedNow` fires. Continuous (interval > 0) spawns reschedule by `scheduledTime += interval`; if the tab was backgrounded, snap to `adjustedNow + interval` instead of catching up. Hard cap reached → mark `executed`.

### 11.4 Invulnerability windows

Three distinct cases — collision treats monster as non-lethal in any:
1. **Spawn invuln:** newly spawned monsters set `isLethal = false` for up to 500 ms; movement classes call `armMonsterAsLethal()` after first AI decision (or the 500 ms safety net).
2. **Mutation pass-through:** `mutationEndTime > now`. Set on Mummy → Sphere/Orb transform AND on every monster after a power-mode unfreeze.
3. **Frozen:** during P-coin power mode, `isFrozen = true` — touching is a kill, not a death.

### 11.5 Respawn (`OptimizedRespawnManager`)

- `killMonster(monster)`:
  - `isDead = true`, `deathTime = now`
  - `respawnTime = adjustedNow + getRespawnDelay(type)` where delay ranges read from tuning store: `RESPAWN_MUMMY_MS`, `RESPAWN_BIRD_MS`, `RESPAWN_HORN_MS`, `RESPAWN_UFO_MS`.
  - Insert into a min-heap-style sorted list.
  - **Tutorial Mission 4 (KILL):** skip respawn (gauntlet ends naturally on freeze end).
- Throttled update at 50 ms intervals.
- On respawn:
  - Restore pre-transform shape if `originalType` recorded.
  - Reset position to `originalSpawnPoint`.
  - Clear all motion + AI state; reset all wall-clock timestamps to current adjusted time (avoid past-life timestamps poisoning the new instance).
  - Reset per-monster scaling.

---

## 12. Difficulty scaling (`ScalingManager`)

- Scales monsters **based on age** (per-monster `individualSpawnTime`) and **global map age** (`globalStartTime`).
- All time accounting uses `PauseClock`-adjusted time (skipping paused durations).
- Bucket size: every **5 seconds elapsed** = 1 scaling step; clamped between min/max per type.

Per-type tunable triplet (read live; defaults shown):

| Type     | Base                            | Per-step delta        | Cap                 |
| -------- | ------------------------------- | --------------------- | ------------------- |
| MUMMY    | `MUMMY_BASE_SPEED = 1.5`        | `+0.05`               | `MUMMY_MAX_SPEED = 3.5` |
| BIRD     | `BIRD_BASE_SPEED = 2.5`         | `+0.08`               | `BIRD_MAX_SPEED = 5.0`  |
| HORN     | `HORN_BASE_SPEED = 2.0`         | `+0.06`               | `HORN_MAX_SPEED = 4.0`  |
| UFO      | `UFO_BASE_SPEED` (varies)       | `UFO_SPEED_SCALING`   | `UFO_MAX_SPEED`     |
| UFO      | `AMBUSH_INTERVAL = 6500 ms`     | `−100 ms` per step    | floor `3000 ms`     |

Cache result per monster for 1 s; invalidate on tuning version bump.

---

## 13. Audio

### 13.1 Files (in `src/assets/audio/`, load all at boot)

| File                          | Use                                  |
| ----------------------------- | ------------------------------------ |
| `background-music.mp3` (.wav) | Looped game-music                    |
| `sigurd-theme-song.mp3`       | Title/menu theme                     |
| `Victory.wav`                 | Victory state                        |
| `gameover.wav`                | Game-over state                      |
| `mission-complete.wav`        | Tutorial mission completed           |
| `power-mode.wav`              | P-coin ambient loop                  |
| `monster-kill.wav`            | Power-mode kill SFX                  |
| `player-death.wav`            | Lose-life SFX                        |
| `jump.wav`                    | Jump SFX (volume reduced ~0.55× SFX) |
| `coin-catch.wav`              | Bomb collect SFX                     |
| `bonus-coin-colect.wav`       | B-coin pickup SFX (sic spelling)     |

### 13.2 Buses

- **Master** (controls everything)
- **Music** (background-music looped)
- **SFX** (one-shots)
- **Power-coin ambient** (looped buffer, +1.4× over SFX bus)
- **Power-up melody** (synthesized, see §9 — square wave A5/C6/B5/D6, 0.15 s/note)

Each bus has separate volume and mute toggles. Settings persisted via host (`bridge.sendAudioSettings`) and loaded back on startup (`bridge.loadUserAudioSettings`).

### 13.3 Audio events (enum)

```
GAME_START, LEVEL_COMPLETE, PLAYER_DEATH, GAME_OVER, BONUS_SCREEN,
BOMB_COLLECT, MAP_CLEARED, BACKGROUND_MUSIC, MONSTER_HIT, MONSTER_KILL,
COIN_COLLECT, F_COIN_COLLECT, POWER_COIN_ACTIVATE, PLAYER_JUMP,
POWER_COIN_AMBIENT_START, POWER_COIN_AMBIENT_STOP, TUTORIAL_SUBTASK_COMPLETE
```

### 13.4 Pause/resume hook

When `GameStateManager.pause()` fires, audio also pauses BGM, ambient loop, and synthesized melody — capturing remaining duration of the synthesized melody. On resume, restart melody with the remaining time.

On `GAME_OVER`, **force-stop** the ambient loop and melody (commit `212b201` — "stop P-coin ambient loop on game-over").

---

## 14. UI / Menus / HUD

### 14.1 Top-level menu graph

```
START ─┬─→ SETTINGS (nested)
       ├─→ CONTROLS (nested)
       ├─→ TUTORIAL_SELECT ─→ TUTORIAL_BRIEF ─→ (mission play) ─→ TUTORIAL_RESULT
       └─→ Play (deduct 1 credit) ─→ LOADING ─→ COUNTDOWN ─→ IN_GAME
                                                          ├─→ PAUSE (P) ─→ Resume / Settings / Restart / Quit
                                                          └─→ MAP_CLEARED ─→ BONUS ─→ COUNTDOWN (next) or VICTORY
                                                          (or)             GAME_OVER
```

### 14.2 HUD layout (during PLAYING / PAUSED)

**Top bar (~40 px tall):**
```
[Balance N💡] | [Lvl X] | [Score]  [xN MAX | B-coin progress bar]  [⏸] [⛶]
```
- Balance shown only if `bridge.ready`.
- Score animated via easing (`useAnimatedScore` 14 % per frame interpolation).
- Multiplier label centered absolute; B-coin bar = 160 × 3 px gradient by tier.
- Pause/Fullscreen icons (15 px) with tooltips.

**Bottom bar (~56 px tall):**
```
[☕☕☕ +N] ……………… [Sigurd Startup VERSION]
```
- Lives = coffee-cup icons (28 × 28 px), max 3 visible; overflow as "+N".

### 14.3 Screens (text in Norwegian — keep verbatim for parity)

| Screen          | Title                          | Key content                                                      |
| --------------- | ------------------------------ | ---------------------------------------------------------------- |
| START           | "SIGURD STARTUP"               | "Samle så mye finansiering som mulig!" + Play / Innstillinger / Kontroller / Sandkassa |
| LOADING         | "SIGURD STARTUP"               | Spinner + % + step-specific Norwegian message (see §14.4)        |
| COUNTDOWN       | (3 → 2 → 1)                    | Map name in 4xl pixel font under count                           |
| PAUSE           | "PAUSE"                        | "Trykk P for å fortsette" + Fortsett / Innstillinger / Start på nytt / Avslutt til hovedmeny |
| SETTINGS        | "INNSTILLINGER"                | 3 sliders: Master, Musikk, Lyd-effekter (each with mute toggle)  |
| CONTROLS        | "KONTROLLER"                   | 5 keybind rows: Beveg deg, Hopp, Flytemodus, Super hopp, Rask fall |
| TUTORIAL_SELECT | "Sandkassa"                    | 4 cards: Bevegelse 101, Finansieringer, Overlev byråkratiet, Politisk Ryggvind |
| TUTORIAL_BRIEF  | mission title                  | "MÅL" box + description + Tilbake / Start                        |
| TUTORIAL_RESULT | mission title                  | "Fullført!" / "Hoppet over" + flavor + stats table + Prev / Next / Hovedmeny |
| BONUS           | "{MAP_NAME} FULLFØRT"          | Random fact from `byrokrati.json`; "{correctOrderCount} av 23"; animated `{bonus} kr` over 6 s |
| VICTORY         | "UNICORN FOUNDER!"             | "Du har bygget en billion-dollar idé"; per-level results table; total; "Spill igjen" |
| GAME_OVER       | "KAPITALEN TØRKET UT"          | Random message from `gameover.json`; results table with status icons; "Prøv igjen" |

### 14.4 Loading-step Norwegian copy

| Step                  | Message                          |
| --------------------- | -------------------------------- |
| host-communication    | "Etablerer forbindelse"          |
| background-images     | "Klargjør spillverdener"         |
| player-sprites        | "Vekker Sigurd til live"         |
| monster-sprites       | "Forbereder utfordringer"        |
| ui-sprites            | "Bygger grensesnitt"             |
| audio-files           | "Tuner inn lydlandskap"          |
| map-data              | "Kartlegger reisen"              |
| finalization          | "Siste forberedelser"            |

Loading weights (sum to 100 %): host=15, bg=20, player=15, monster=10, ui=10, audio=15, map=10, final=5.

### 14.5 Animated counter

`useAnimatedCounter(target, { duration: 6000, steps: 120, easing: 'gentle-ease-out', delay: 200 })` — a count-up tween used by the bonus screen. Easing: `1 - (1-p)^1.5`. Fires `onComplete` (which triggers menu advance) even when target is 0.

---

## 15. Tutorials & missions

Defined in `src/tutorials/missions.ts`. Four ordered tutorials, accessible from "Sandkassa".

| Order | ID         | Title              | Goal                                            | Map        | Bombs | Monsters | Survive | Completion criterion                              |
| ----- | ---------- | ------------------ | ----------------------------------------------- | ---------- | ----- | -------- | ------- | ------------------------------------------------- |
| 1     | MOVEMENTS  | Bevegelse 101      | Lær å bevege Sigurd                             | movementsMap | 0   | 0        | —       | All 6 sub-tasks completed (left/right/jump/superJump/float/fall) |
| 2     | BOMBS      | Finansieringer     | Samle alle finansieringene                      | bombsMap   | 14    | 0        | —       | All 14 bombs collected                            |
| 3     | SURVIVE    | Overlev byråkratiet| Overlev                                         | surviveMap | 0     | 5 mixed  | 30 s    | Survive timer expires (resets on death)           |
| 4     | KILL       | Politisk Ryggvind  | Drep monstrene under effekten                   | killMap    | 0     | 5 + 1 P-coin | —   | Power mode active → freeze ends; tier achieved   |

Mission overlay (top-right, 220–280 px wide, `bg-menu backdrop-blur-sm`) shows:
- Mission 1: 6-row table of moves with completion ticks.
- Mission 2: "Plukket: X/Y" + "Riktig rekkefølge: X/Y".
- Mission 3: Large countdown ("Xs") with "Hold deg unna byråkratene. Lykke til."
- Mission 4: P-coin tier table with the active row highlighted (pink ring); on completion, ryggvind tier label:
  1. Lokal støtte
  2. Ordførergodkjenning
  3. Startup-plan
  4. Fritak fra dokumentasjon
  5. Aksjeopsjoner
  6. Skattelette
  7. EU-støtte

Tutorials skip the normal P-coin token bucket (no auto-spawning).

---

## 16. Maps / levels

9 campaign maps, played in order. All 800 × 600.

| #  | id         | name             | Background image (`maps-bg-images/`) |
| -- | ---------- | ---------------- | ------------------------------------ |
| 1  | level1     | soverommet       | `soverommet.png`                     |
| 2  | level2     | garasjen         | `garasjen.png`                       |
| 3  | level3     | startup lab      | `startup-lab.png`                    |
| 4  | level4     | innovasjon norge | `innovasjon-norge.png`               |
| 5  | level5     | skatteetaten     | `skatteetaten.png`                   |
| 6  | level6     | nav              | `nav.png`                            |
| 7  | level7     | kommunehuset     | `kommunehuset.png`                   |
| 8  | level8     | alltinn norge    | `alltinn.png`                        |
| 9  | level9     | silicone vally   | `silicone-vally.png`                 |

### 16.1 Map data shape

```
MapDefinition {
  id: string,
  name: string,
  background: string,
  width: 800, height: 600,
  playerStart: {x, y},
  platforms: [
    { x, y, width, height: 25, color, borderColor, theme: "plastic" | ..., }
  ],
  bombs: [
    { x, y, group: int, order: int }   // 23 entries; padded if fewer
  ],
  groupSequence: [int],                 // e.g. [1,2,3,4,5,6]
  monsterSpawnPoints: [
    {
      type: MonsterType, x, y,
      patrolStart, patrolEnd, speed,
      color?, subtype?, walkLengths?, transformTarget?,
      spawnDelay: ms, respawnInterval?: ms, maxSpawns?: int,
    }
  ],
  coinSpawnPoints: [
    { type: "POWER" | "BONUS_MULTIPLIER" | "EXTRA_LIFE" | "FOUNDER_MODE",
      x, y, spawnAngle?: degrees }
  ]
}
```

### 16.2 Sample (Level 1 — soverommet)

- Player start `(387.5, 282.5)`.
- 8 platforms (sample): `(500,400, 200×25)`, `(100,400, 200×25)`, `(550,175, 150×25)`, `(100,175, 150×25)`, `(750,275, 50×25)`, `(0,275, 50×25)`. Color `#2f3543`, border `#000`, theme `"plastic"`.
- 23 bombs across 6 groups; `groupSequence = [1,2,3,4,5,6]`.
- 4 mummy spawn points with patrols and respawn intervals 8.5–14 s, max 1–2 each. One has `subtype: "ORB"`.

(Levels 2–9 follow the same structure; load full data from `mapDefinitions.ts` at port time.)

---

## 17. Bridge integration (`window.sigurdGame`)

The game ships as a web component embedded in a host page (Next.js + Stripe + Firebase). For Godot web export, use `JavaScriptBridge` to read `window.sigurdGame`. For desktop builds, stub the bridge.

### 17.1 Methods consumed

```ts
interface SigurdGameBridge {
  ready: boolean
  getBalance(): number
  deductCredits(amount): Promise<{ success, newBalance, error? }>
  refreshBalance(): Promise<number>
  onBalanceChanged(cb: (BalanceInfo) => void): () => void   // unsubscribe fn
  grantBusinessIdea(amount: number): void                    // fire-and-forget
  openPurchase?(): void
  sendGameCompletion(data): void
  sendAudioSettings(settings): void
  loadUserAudioSettings(userId): Promise<void>
}
```

`BalanceInfo = { currentBalance, reason: "initial"|"game-deduct"|"purchase"|"reward"|"refund"|"sync" }`

### 17.2 Bridge detection

- Bus event `sigurdGame:bridge-ready` (or 3000 ms timeout) → fall back to standalone mode.
- Standalone: `getBalance()` returns from `MOCK_BALANCE` (default 10 in `dev.ts`); deductions always succeed; no real grant on F-coin (logs warning).

### 17.3 Game → host events (CustomEvent on `window`)

| Event                          | Detail summary                                                          |
| ------------------------------ | ----------------------------------------------------------------------- |
| `game:ready`                   | `{ timestamp }`                                                         |
| `game:state-updated`           | `{ state, map?, timestamp }`                                            |
| `game:level-started`           | `{ level, mapName, timestamp }`                                         |
| `game:score-updated`           | `{ score, map, level?, lives?, multiplier?, timestamp }`                |
| `game:level-failed`            | `{ level, mapName, score, ..., lives, multiplier, timestamp }`          |
| `game:map-completed`           | `{ mapName, level, correctOrderCount, totalBombs, score, bonus, hasBonus, lives, multiplier, completionTime?, coinsCollected?, powerModeActivations?, pCoinTierCollections?, founderCoinsCollected?, timestamp }` |
| `game:completed`               | full session-end payload incl. `levelHistory[]`, totals, sessionId, user info |
| `game:audio-settings-updated`  | `{ masterVolume, musicVolume, sfxVolume, masterMuted, musicMuted, sfxMuted, timestamp }` |

### 17.4 Host → game events

| Event                    | Detail                                  |
| ------------------------ | --------------------------------------- |
| `game:run-saved`         | (signal — release "Lagrer spillet…" wait, max 30 s) |
| `game:load-audio-settings` | `{ masterVolume, ... }`               |
| `sigurdGame:bridge-ready`  | (sentinel)                            |

---

## 18. Asset inventory (verbatim file list)

### Backgrounds (`src/assets/maps-bg-images/`)
`alltinn.png, garasjen.png, innovasjon-norge.png, kommunehuset.png, nav.png, silicone-vally.png, skatteetaten.png, soverommet.png, startup-lab.png`
(plus `*-old.png` and `image copy 5.png` — legacy / unused)

### Audio (`src/assets/audio/`)
`Victory.wav, background-music.mp3 (and .wav), bonus-coin-colect.wav, coin-catch.wav, gameover.wav, jump.wav, mission-complete.wav, monster-kill.wav, player-death.wav, power-mode.wav, sigurd-theme-song.mp3`

### Sprites (`src/assets/sprites/`)
- `sigurdV2/` — player (idle, walk, jump, fall, float, attack, dead) with directional variants
- `byråkrat/{green,black}/` — Mummy enemy
- `vertikal-byråkrat/` — Vertical patrol enemy
- `skatte-spøkelset/` — Bird/Chaser enemy
- `hodeløs-konsulent/` — UFO/Ambusher enemy
- `regel-roboten/` — Horn/Floater enemy
- `coffee/` — single icon `sprite_0.png` for HUD lives
- `funding/` — bomb sprites (lit/unlit variants)

### Bombs (`src/assets/bomb/`)
`bomb1.png, bomb2.png, colors_and_type.css`

### Tiles (`src/assets/Tiles/`)
Platform tile pieces (left/middle/right per theme).

### Font (`src/assets/Font/`)
Pixel font used for all titles, numbers, menu text. Use Godot's `FontFile` import.

### Text data
- `src/data/byrokrati.json`: `{ "facts": ["..."] }` — 37 satirical Norwegian "did you know" lines about startup bureaucracy. Shown randomly on the bonus screen.
- `src/data/gameover.json`: `{ "gameOverMessages": ["..."] }` — 37 satirical game-over flavor strings. Shown randomly on the game-over screen.

---

## 19. Suggested Godot scene & node layout

```
res://
  autoload/
    GameState.gd          (state enum + signals)
    PauseClock.gd         (adjusted-now + pause reasons)
    Bridge.gd             (window.sigurdGame adapter / stub)
    Audio.gd              (event router + buses)
    Tuning.gd             (live-tunable defaults; runtime override)
    Score.gd              (score, multiplier, multiplierScore)
    LevelData.gd          (loads MapDefinitions resource list)
  scenes/
    Boot.tscn             (preload, show LoadingMenu)
    Main.tscn             (Game root, swaps screens)
    ui/
      StartMenu.tscn
      LoadingMenu.tscn
      CountdownOverlay.tscn
      InGameHUD.tscn
      PauseMenu.tscn
      SettingsMenu.tscn
      ControlsMenu.tscn
      TutorialSelectMenu.tscn
      TutorialBriefMenu.tscn
      TutorialResultMenu.tscn
      TutorialOverlay.tscn
      BonusScreen.tscn
      VictoryScreen.tscn
      GameOverScreen.tscn
    world/
      GameWorld.tscn      (the 800x600 playfield container)
        Background        (Sprite2D)
        Platforms         (Node2D — instantiates Platform.tscn per map)
        Bombs             (Node2D)
        Coins             (Node2D)
        Monsters          (Node2D)
        Player.tscn
        FloatingTexts     (Node2D)
    entities/
      Player.tscn         (CharacterBody2D w/ AnimatedSprite2D)
      Bomb.tscn
      Coin.tscn           (parameterized by CoinType)
      Monster.tscn        (parameterized by MonsterType + MovementClass)
      Platform.tscn
  scripts/
    physics/
      gravity_lut.gd      (build-and-cache LUT)
      jump_types.gd       (decideJumpType, jumpInitParams)
    rules/
      bj_rules.gd         (pCoinSpawnsAt, bumpMultiplier, endOfLevelBonus, ...)
    managers/
      level_manager.gd
      bomb_manager.gd
      coin_manager.gd
      monster_factory.gd
      spawn_manager.gd
      respawn_manager.gd
      scaling_manager.gd
      monster_behavior_manager.gd
      tutorial_manager.gd
    movement/
      patrol.gd
      chaser.gd
      ambusher.gd
      floater.gd
      airborne.gd
  resources/
    maps/
      level1.tres ... level9.tres   (MapDefinition Resource)
      tutorial_*.tres
    coin_tiers.tres                  (P-coin colors/points/durations)
  data/
    byrokrati.json
    gameover.json
```

### 19.1 Player node

`CharacterBody2D` is acceptable but **disable Godot's gravity** (`gravity_scale = 0`); apply LUT velocity manually in `_physics_process`. Use `move_and_slide` for collision; query `is_on_floor()` to set `isGrounded` (and merge with the 1-px tolerance probe for parity).

### 19.2 Monster node

A single `Monster.tscn` (CharacterBody2D + AnimatedSprite2D) with a `MovementStrategy` resource swapped in per type. Each strategy script implements `update(monster, delta_ms, player_pos, platforms)`.

### 19.3 Coin node

Single `Coin.tscn` with a `CoinType` enum and a `physics_mode` enum (`REFLECT`, `GRAVITY_ONLY`, `STANDARD`). Visual differs by tier index (P-coin) or fixed sprite (others).

---

## 20. Acceptance criteria checklist

Match these against the running web build (`npm run dev`).

### Player
- [ ] `vx = 4` px/frame at 60 Hz, instant; air control identical to ground.
- [ ] Normal jump arc reaches ~3/4 screen; high jump touches ceiling; short jump = ½.
- [ ] Tapping float in midair noticeably slows descent; releasing resumes.
- [ ] 80 ms late-Shift window upgrades a normal jump to high mid-flight.
- [ ] Down held in air after apex snaps to fast-fall.
- [ ] Trampoline points (10 × multiplier) on jump start, wall hit (boundary or platform), and walk-off.
- [ ] All trampoline events advance live P-coins' colors.

### Bombs
- [ ] Each map has 23 bombs (padded if declared fewer).
- [ ] First bomb collected sets the active group; "lit" bomb is the lowest-order in the active group.
- [ ] Lit-bomb collection scores 200 × multiplier; unlit 100 × multiplier.
- [ ] End-of-level bonus thresholds: 50k/30k/20k/10k for 23/22/21/20.

### Coins
- [ ] P-coin spawns after 18 weighted tokens (firebomb=2, normal=1), max 2/level.
- [ ] P-coin reflects perfectly off platforms and edges; no damping.
- [ ] P-coin color cycles on every trampoline event.
- [ ] B-coin spawns at every 5,000-pt threshold of *bombs+kills+trampolines* only; max 5/level; only 1 alive.
- [ ] B-coin yields 1000 × multiplier and +1 multiplier (cap 5).
- [ ] M-coin spawns at every 8 of `bonusCoins + 2 × livesLost`; +1 life, cap 9.
- [ ] F-coin: 5 % per-run roll, target level 2–8, target bomb 1–23, cap 2/run; pickup calls `bridge.grantBusinessIdea(1)`.
- [ ] Gravity-only coins fall, walk, fall off edges, bounce on canvas walls, persist on canvas floor.

### Power mode
- [ ] Touching a frozen monster kills it for 100/200/.../600 (capped) × multiplier.
- [ ] Power mode duration matches the picked tier (3–10 s).
- [ ] ScalingManager + spawn + respawn all paused for the duration.
- [ ] Mutation pass-through window after unfreeze (~500 ms).
- [ ] Pausing during power mode preserves remaining duration; resume restores melody.
- [ ] GAME_OVER force-stops ambient loop + melody.

### Monsters
- [ ] Bird is 1/level; corner-spawn opposite to held direction at level start; A* pathfinding to *delayed* player snapshot; cardinal hops only.
- [ ] Mummy patrols, drops after `walkLengths` edge touches, transforms to Sphere/Orb at floor (or dies if `transformTarget = NONE`).
- [ ] UFO wanders with random direction every 2–4 s; ambush burst at 3× speed.
- [ ] Horn velocity-bounces with random angle variance; periodic surprise-burst toward player.
- [ ] Sphere aligns to player X column; Orb to Y row; per-instance jitter.
- [ ] Spawn invuln (≤500 ms), mutation pass-through, freeze-revert pass-through all behave.

### UI
- [ ] All screens & flow per §14.
- [ ] Multiplier badge & B-coin progress bar gradient match per-tier color.
- [ ] Bonus-screen counter animates 0 → bonus over 6 s; advances on complete.
- [ ] Game-over and victory tables list every level with status icons & per-level bonus.

### Bridge
- [ ] Bridge detected within 3 s, else falls back to standalone.
- [ ] `deductCredits(1)` called and awaited at: Start, Restart (Pause menu), Retry (game-over), Play again (victory).
- [ ] `grantBusinessIdea(1)` called on F-coin pickup.
- [ ] All `game:*` events emitted with the documented payloads.

---

## 21. Appendix A — full constants dump

(Verified against `src/types/constants.ts`, `src/types/enums.ts`, `src/lib/gravityLUT.ts`, `src/config/*`, `src/maps/mapDefinitions.ts`.)

```
Canvas
  CANVAS_WIDTH = 800
  CANVAS_HEIGHT = 600

Entity sizes
  PLAYER_WIDTH = 25
  PLAYER_HEIGHT = 35
  BOMB_SIZE = 25
  MONSTER_SIZE = 25
  COIN_SIZE = 25
  PLATFORM_HEIGHT = 25
  SPRITE_SOURCE_SIZE = 32×32, drawn at 1.25× = 40×40

Physics (defaults; live-tunable in original)
  MOVE_SPEED = 4
  JUMP_POWER = 7              (legacy, pre-LUT)
  SUPER_JUMP_POWER = 12       (legacy, pre-LUT)
  GRAVITY = 0.2               (legacy, pre-LUT)
  FLOAT_GRAVITY = 0.005       (legacy)
  FAST_FALL_GRAVITY_MULTIPLIER = 2  (legacy)
  MIN_JUMP_DURATION = 50 ms
  MAX_JUMP_DURATION = 300 ms

Gravity LUT
  GRAVITY_LUT_SIZE = 128
  GRAVITY_APEX_INDEX = 64
  GRAVITY_TERMINAL_INDEX = 127
  GRAVITY_INITIAL_UP_VY = 11
  GRAVITY_TERMINAL_VY = 8
  GRAVITY_FLOAT_INDEX = 76
  GRAVITY_FAST_FALL_INDEX = 100
  JUMP_NORMAL_RATE = 1.0
  JUMP_HIGH_RATE = 0.45
  JUMP_SHORT_START_IDX = 35
  LATE_SHIFT_UPGRADE_WINDOW_MS = 80
  COLLISION_RESOLVE_MAX_ITERS = 4
  RESTING_CONTACT_TOLERANCE = 1.0

Game rules
  TOTAL_BOMBS = 23
  STARTING_LIVES = 3
  MAX_LIVES = 9

Coin physics
  COIN_BOUNCE_SPEED = 3
  COIN_BOUNCE_DAMPING = 0.8
  COIN_GRAVITY = 0.1
  COIN_GRAVITY_ONLY_FALL_SPEED = 2
  COIN_GRAVITY_ONLY_HORIZONTAL_SPEED = 2
  COIN_GRAVITY_ONLY_LANDING_TOLERANCE_PX = 4

Coin spawning
  POWER_COIN_SPAWN_INTERVAL = 18 (token threshold)
  P_COIN_TOKEN_FIREBOMB = 2
  P_COIN_TOKEN_NORMAL   = 1
  POWER_COIN_MAX_PER_LEVEL = 2
  BONUS_COIN_SPAWN_INTERVAL = 5000 (points)
  BONUS_COIN_MAX_PER_LEVEL = 5
  EXTRA_LIFE_COIN_RATIO = 8
  EXTRA_LIFE_DEATH_GENEROSITY = 2
  F_COIN_RUN_CHANCE = 0.05
  F_COIN_MIN_LEVEL = 2
  F_COIN_MAX_LEVEL = 8
  F_COIN_RUN_CAP = 2
  F_COIN_TRIGGER_MIN_BOMB = 1
  F_COIN_TRIGGER_MAX_BOMB = 23

Coin effects
  POWER_COIN_DURATION (varies per tier; see §8.1)
  POWER_COIN_POINTS = 2000   (legacy fallback; real value comes from tier)
  MONSTER_KILL_POINTS = 100  (1st kill base; ramps 100/200/300/400/500/600)
  BONUS_MULTIPLIER_COIN_POINTS = 1000
  EXTRA_LIFE_COIN_POINTS = 1000

Scoring
  BOMB_POINTS.NORMAL = 100
  BOMB_POINTS.FIREBOMB = 200
  MULTIPLIER_THRESHOLDS = {1:0, 2:1800, 3:3600, 4:5400, 5:7200}  (UNUSED in current build)
  MAX_MULTIPLIER = 5
  POINTS_PER_LEVEL = 1800
  BONUS_POINTS = {23:50000, 22:30000, 21:20000, 20:10000}
  TRAMPOLINE_BASE_POINTS = 10
  MUTATION_PASSTHROUGH_MS ≈ 500

Difficulty scaling (defaults)
  Bucket = 5 s elapsed
  MUMMY_BASE_SPEED = 1.5; MUMMY_SPEED_SCALING = 0.05; MUMMY_MAX_SPEED = 3.5
  BIRD_BASE_SPEED  = 2.5; BIRD_SPEED_SCALING  = 0.08; BIRD_MAX_SPEED  = 5.0
  HORN_BASE_SPEED  = 2.0; HORN_SPEED_SCALING  = 0.06; HORN_MAX_SPEED  = 4.0
  UFO_AMBUSH_INTERVAL_BASE = 6500 ms; per-step −100 ms; floor 3000 ms

Audio
  POWER_COIN_AMBIENT_GAIN = SFX × 1.4
  JUMP_SFX_GAIN = SFX × 0.55
  POWER_UP_MELODY = square wave [880, 1046.5, 987.77, 1174.66] Hz; 0.15 s/note

Dev/debug
  SHOW_HITBOXES = false
  MOCK_BALANCE = 10  (null = no balance UI)
  DEV_CONFIG.ENABLED = false  (skip countdown)
  DEV_CONFIG.GOD_MODE = false
  DEV_CONFIG.TARGET_STATE = "GAME_OVER"  (when ENABLED)
  DEV_CONFIG.TARGET_LEVEL ∈ [1, 7]

Enums
  GameState         : MENU, COUNTDOWN, PLAYING, PAUSED, BONUS, VICTORY, GAME_OVER, MAP_CLEARED
  MenuType          : START, COUNTDOWN, IN_GAME, PAUSE, SETTINGS, BONUS, VICTORY, GAME_OVER,
                      AUDIO_SETTINGS, CONTROLS, TUTORIAL_SELECT, TUTORIAL_BRIEF, TUTORIAL_RESULT
  TutorialMissionId : MOVEMENTS, BOMBS, SURVIVE, KILL
  MonsterType       : MUMMY, VERTICAL_PATROL, BIRD, UFO, HORN, SPHERE, ORB
  CoinType          : POWER, BONUS_MULTIPLIER, EXTRA_LIFE, MONSTER_FREEZE (deprecated), FOUNDER_MODE
  PauseReason       : Default, PowerMode, MonsterScaling
  CollisionType     : PLATFORM, BOMB, MONSTER, BOUNDARY, COIN
```

---

**End of spec.** Where this document and the running game disagree, the running game wins — verify against `npm run dev` and update the spec. The "feel" — jump arc, float flutter, color-cycle timing, freeze cadence — is the actual product; numbers are tools to reach it.
