# Sigurd Startup — Complete Game Specification for Godot Reimplementation

This document describes every mechanic, constant, behavior, and system in the game. It is the single source of truth for reimplementing the game from scratch in Godot.

---

## 1. OVERVIEW

**Genre:** 2D arcade platformer with bomb-collection mechanics
**Canvas:** 800×600 pixels (fixed resolution)
**Target:** 60 FPS
**Levels:** 8 maps (garasjen, startup lab, innovasjon norge, skatteetaten, nav, kommunehuset, alltinn norge, silicone valley)
**Objective:** Collect 23 bombs per level in the correct sequence while avoiding monsters. Collect coins for power-ups, multiplier boosts, and extra lives.

---

## 2. ENTITY DIMENSIONS (pixels)

| Entity | Width | Height |
|--------|-------|--------|
| Player | 25 | 35 |
| Bomb | 25 | 25 |
| Monster | 25 | 25 |
| Coin | 25 | 25 |
| Platform | variable | 25 |
| Wall | 15 | variable |

---

## 3. PHYSICS

All physics values are per-frame at 60fps. Multiply by `(delta / 16.67ms)` for frame-rate independence.

### 3.1 Player Movement
- **Horizontal speed:** 4 units/frame (constant, no acceleration)
- **Input:** Left (A/←), Right (D/→)
- **Air control:** Full horizontal control while airborne

### 3.2 Gravity
| State | Gravity | Notes |
|-------|---------|-------|
| Normal | 0.2 | Default falling |
| Floating (SPACE held, airborne) | 0.005 | Ultra-slow descent |
| Fast fall (DOWN held, airborne) | 0.4 | 2× normal gravity |

- Applied as: `velocityY += gravity * (delta / 16.67)`
- Position: `y += velocityY * (delta / 16.67)`

### 3.3 Jump Mechanics (Variable Height)
- **Normal jump power:** 7
- **Super jump power (SHIFT+UP):** 12
- **Trigger:** UP key + grounded + not already jumping
- **Initial velocity:** `-jumpPower × 0.6` (60% of max)
- **Hold-to-increase:** Holding UP increases velocity from 60% → 100% over 300ms
- **Formula:** `targetVelocity = -jumpPower × (0.6 + 0.4 × holdRatio)`
- **Max hold duration:** 300ms
- **Min jump duration:** 50ms
- **End condition:** Key released OR 300ms reached → `isJumping = false`

### 3.4 Floating
- **Trigger:** SPACE key + airborne
- **On start:** Kills upward momentum (`velocityY = 0`)
- **During:** Uses float gravity (0.005)
- **End:** Key release OR landing
- **Cannot float while grounded**

### 3.5 Fast Fall
- **Trigger:** DOWN key + airborne
- **Effect:** Kills upward momentum if ascending, then applies 2× gravity
- **End:** Key release OR landing

### 3.6 Coin Physics

| Type | Gravity | Bounces | Reflects | Notes |
|------|---------|---------|----------|-------|
| Standard | Yes (0.1) | Yes (damping 0.8) | No | Bounce speed: 3 |
| Power (P-coin) | No | No | Yes | Free-floating, reflects off platforms/walls |
| Gravity-only (B/M-coin) | Custom | No | No | Falls at 2px/frame, lands on platforms, walks at 1px/frame, falls off edges |

**Gravity-only coin behavior (B-coin, M-coin):**
1. Falls straight down at 2px/frame
2. On platform/ground landing (4px tolerance): stops falling, picks random horizontal direction
3. Walks horizontally at 1px/frame
4. At platform edge (0px tolerance): falls off, resumes falling
5. On ground: walks horizontally until collected

---

## 4. COLLISION SYSTEM

### 4.1 Detection: AABB (Axis-Aligned Bounding Box)
```
collision = (a.x < b.x + b.width) && (a.x + a.width > b.x) &&
            (a.y < b.y + b.height) && (a.y + a.height > b.y)
```

### 4.2 Platform/Ground Resolution
- Calculate penetration on both X and Y axes
- Resolve on the axis with **smallest penetration** (prevents tunneling)
- Check ALL platforms and pick the collision with smallest penetration (not just first hit)
- **Normal directions:**
  - `y = -1`: Landing on top → set `velocityY = 0`, `isGrounded = true`
  - `y = +1`: Hit from below → set `velocityY = 0`
  - `x = ±1`: Side collision → set `velocityX = 0`

### 4.3 Boundary Collision
- Left (x < 0): Clamp, stop horizontal velocity
- Right (x + width > 800): Clamp, stop horizontal velocity
- Top (y < 0): Clamp, stop vertical velocity
- **Bottom (y + height > 600): PLAYER DEATH** (fell off screen)

### 4.4 Entity Collisions
- **Player-Bomb:** If bomb not collected and overlapping → collect bomb
- **Player-Coin:** If coin not collected and overlapping → collect coin
- **Player-Monster:** If monster active and overlapping → monster collision handler

### 4.5 Grounded State
- Reset `isGrounded = false` every frame BEFORE collision detection
- Platform/ground collision sets it back to `true` if landing on top
- This ensures walking off a platform edge correctly loses grounded status

---

## 5. BOMB SYSTEM

### 5.1 Structure
- **23 bombs per level**
- Bombs have: `x, y, width, height, order, group, isCollected, isBlinking, isCorrect`
- Bombs are organized into **groups** with a defined **sequence**
- Each map defines a `groupSequence` array specifying collection order

### 5.2 Collection Logic
1. Player overlaps uncollected bomb → `collectBomb(order)` called
2. BombManager checks if bomb is the **next correct one** (firebomb)
3. If correct:
   - `isCorrect = true`, `isCollected = true`
   - Award 200 points × multiplier
   - Increment `firebombCount` (for P-coin spawning)
   - Add points to `firebombPoints` (for B-coin spawning)
   - Track `correctOrderCount`
4. If incorrect:
   - `isCorrect = false`, `isCollected = true`
   - Award 100 points × multiplier
5. Update next bomb indicator (blinking)
6. Check win condition: if `collectedBombs.length === 23`

### 5.3 Blinking Indicator
- Only the next correct bomb in sequence has `isBlinking = true`
- Visual: bomb sprite alternates between "lit" and "unlit" animations
- Updates after every bomb collection

### 5.4 Win Condition
- All 23 bombs collected → transition to MAP_CLEARED state
- 5-second delay (Victory.wav plays) → proceed to bonus/next level

---

## 6. SCORING

### 6.1 Point Sources

| Source | Base Points | Multiplied? | Counts for B-coin? |
|--------|------------|-------------|-------------------|
| Correct bomb (firebomb) | 200 | Yes | Yes |
| Incorrect bomb | 100 | Yes | Yes |
| P-coin collection | Varies by color (100-2000) | No | No |
| B-coin collection | 1000 | Yes | No |
| M-coin collection | 1000 | Yes | No |
| Monster kill (power mode) | 100 | No | No |
| End-of-level bonus | See table | No | No |

### 6.2 Multiplier System

| Level | Points Required (cumulative) |
|-------|-----|
| 1× | 0 (default) |
| 2× | 1,800 |
| 3× | 3,600 |
| 4× | 5,400 |
| 5× (max) | 7,200 |

- **Progression:** 1,800 points per level
- **Reset on:** Player death, game restart
- **B-coin effect:** Instantly bumps multiplier to next level

### 6.3 End-of-Level Bonus

| Effective Bombs | Bonus Points |
|-----------------|-------------|
| 23 (perfect) | 50,000 |
| 22 | 30,000 |
| 21 | 20,000 |
| 20 | 10,000 |
| < 20 | 0 |

- **Effective count** = `max(0, correctOrderCount - livesLost)`
- Lives lost = `STARTING_LIVES (3) - currentLives`

### 6.4 Floating Text
- Appears at entity position on score events
- Duration: 1000ms
- Floats upward 50px while fading out
- Font: pixel font, 15px

---

## 7. COIN SYSTEM

### 7.1 P-Coin (Power Coin)

**Spawn:** Every 9 firebombs collected (`firebombCount % 9 === 0`)
**Max active:** 1
**Physics:** Reflects off platforms/walls/boundaries (like Pong ball)

**Color Cycle (advances each P-coin spawn):**

| Index | Color | Hex | Points | Duration |
|-------|-------|-----|--------|----------|
| 0 | Blue | #2463d0 | 100 | 3,000ms |
| 1 | Red | #c43030 | 200 | 4,000ms |
| 2 | Purple | #7c3aed | 300 | 5,000ms |
| 3 | Green | #3f8a23 | 500 | 6,000ms |
| 4 | Cyan | #0891b2 | 800 | 7,000ms |
| 5 | Yellow | #b8860b | 1,200 | 8,000ms |
| 6 | Gray | #4b5563 | 2,000 | 10,000ms |

- Color index persists across levels, resets on game over

**Power Mode (on collection):**
1. All monsters freeze (`isFrozen = true`, render as blue)
2. Player can kill frozen monsters (100 pts each, not multiplied)
3. Difficulty scaling pauses
4. Power-up melody plays for duration
5. Background music pauses
6. After duration: monsters unfreeze, scaling resumes, melody stops, BG music resumes

### 7.2 B-Coin (Bonus Multiplier)

**Spawn:** Every 5,000 firebomb points (`firebombPoints` crosses threshold)
**Max active:** 1
**Physics:** Falls, lands on platforms, walks horizontally, falls off edges
**Effect:** Awards 1000 × multiplier points, bumps multiplier to next level

### 7.3 M-Coin (Extra Life)

**Spawn:** Every 4 B-coins collected (`totalBonusMultiplierCoinsCollected % 4 === 0`)
**Max active:** 1
**Physics:** Same as B-coin (gravity-only)
**Effect:** Awards 1000 × multiplier points, grants +1 life

### 7.4 Spawn Point Persistence
- `firebombCount`, `firebombPoints`, `totalBonusMultiplierCoinsCollected` persist across levels
- Full reset on game over/restart
- `triggeredSpawnConditions` (set of spawn keys) prevents duplicate spawns

### 7.5 Pixel-Art Rendering
- Coins rendered as pixel octagon shape (no anti-aliasing)
- Built from horizontal `fillRect` strips with indented corners (symmetric top/bottom)
- Shadow (1px offset), depth border, specular highlight pixels
- Letter centered in pixel font (P, B, M, C)
- Subtle pulse animation: `scale = sin(time / 200) * 0.06 + 1`

---

## 8. MONSTER SYSTEM

### 8.1 Types

#### Horizontal Patrol
- Moves back-and-forth between `patrolStartX` and `patrolEndX`
- Speed: base 1, scales with difficulty
- Stays on platform surface (`y = platform.y - monster.height`)
- Reverses direction at patrol bounds

#### Vertical Patrol
- Moves up-and-down between `patrolStartY` and `patrolEndY`
- Speed: base 1, scales with difficulty
- Positioned beside vertical walls (8px spacing)
- Reverses direction at patrol bounds

#### Chaser
- **Movement:** Cardinal directions only (N/S/E/W, never diagonal)
- **Target tracking:** Recalculates target every ~200ms (with variance)
- **Directness:** 0.3 base (blends current target with player position)
- **Per-monster randomization:** speed ×0.9-1.1, interval ×0.8-1.2, directness ×0.85-1.15
- **When blocked:** A* pathfinding on grid (cell size = monster_size / 2)
  - Grid includes platforms AND ground as obstacles
  - Obstacles inflated by monster body size
  - Cardinal-only neighbors (no diagonal paths)
  - Max 300 iterations per search
  - Path cached 400ms per monster
- **Speed:** base 1, scales with difficulty

#### Floater
- Moves in straight line at configurable starting angle
- Reflects/bounces off platforms, ground, and boundaries
- Speed: base 2, scales with difficulty
- Bounce angle randomness: ±0.2 radians (scales with difficulty)
- Velocity: `vx = cos(angle) * speed`, `vy = sin(angle) * speed`

#### Ambusher
- Wanders randomly, then rushes toward player periodically
- Speed: base 2, scales with difficulty
- Ambush interval: 5,000ms base (scales down to 500ms minimum)

### 8.2 Monster Properties (shared)
```
x, y, width (25), height (25), color, speed, direction,
isActive, isFrozen, isBlinking, isDead, deathTime, respawnTime,
originalSpawnPoint, individualSpawnTime, behaviorState
```

### 8.3 Frozen State (during power mode)
- `isFrozen = true`
- Render color: blue (#4444FF)
- Cannot move
- Player collision = monster death (100 pts)
- Blinking warning before unfreeze

### 8.4 Respawn System
| Type | Respawn Time |
|------|-------------|
| Patrol | 8 seconds |
| Chaser | 7 seconds |
| Floater | 15 seconds |
| Ambusher | 10 seconds |

- Respawns at `originalSpawnPoint`
- Visual indicator: pulsating ghost at spawn point during final 3 seconds
- Individual scaling resets on respawn

### 8.5 Dynamic Spawning
- Maps define `monsterSpawnPoints` with `spawnDelay` (ms) and `createMonster()` factory
- Spawn manager tracks scheduled spawns, pauses during non-PLAYING states
- Spawn indicators shown during final 3 seconds before spawn

---

## 9. DIFFICULTY SCALING

### 9.1 Base Values (at level start)

| Metric | Patrol | Chaser | Floater | Ambusher |
|--------|--------|--------|---------|----------|
| Speed | 1 | 1 | 2 | 2 |
| Directness | — | 0.3 | — | — |
| Update interval | — | 200ms | — | — |
| Bounce angle | — | — | 0.2 rad | — |
| Ambush interval | — | — | — | 5000ms |

### 9.2 Scaling Rates (per second of level time)

| Metric | Patrol | Chaser | Floater | Ambusher |
|--------|--------|--------|---------|----------|
| Speed | +0.2/s | +0.2/s | +0.5/s | +0.08/s |
| Directness | — | +0.08/s | — | — |
| Update interval | — | -8ms/s | — | — |
| Bounce angle | — | — | +0.008/s | — |
| Ambush interval | — | — | — | -500ms/s |

### 9.3 Maximum Values

| Metric | Patrol | Chaser | Floater | Ambusher |
|--------|--------|--------|---------|----------|
| Speed | 5.0 | 5.0 | 5.0 | 10.0 |
| Directness | — | 1.0 | — | — |
| Update interval | — | 100ms | — | — |
| Bounce angle | — | — | 0.5 rad | — |
| Ambush interval | — | — | — | 500ms |

### 9.4 Scaling Pauses
- Power mode activated → scaling pauses (all monsters)
- Power mode ended → scaling resumes
- Player death → scaling resets to 0 seconds elapsed
- Individual monster scaling tracks per-monster spawn time

---

## 10. GAME STATE MACHINE

### 10.1 States
`MENU → COUNTDOWN → PLAYING → PAUSED → BONUS → VICTORY → GAME_OVER → MAP_CLEARED`

### 10.2 Transitions

| From | To | Trigger | Duration | Effects |
|------|-----|---------|----------|---------|
| MENU | COUNTDOWN | "Start" button | 3000ms countdown | Reset game, load level 1 |
| COUNTDOWN | PLAYING | Auto (timer) | Immediate | Resume all managers, start music |
| PLAYING | PAUSED | P key or pause button | Until resume | Pause all managers, stop music |
| PAUSED | COUNTDOWN | "Resume" button | 3000ms countdown | — |
| PLAYING | MAP_CLEARED | All 23 bombs collected | 5000ms | Stop music, play Victory.wav |
| MAP_CLEARED | BONUS | Auto (timer) | Until animation done + 2000ms | Show bonus points |
| BONUS | COUNTDOWN | Auto (after delay) | 3000ms countdown | Load next level |
| PLAYING | GAME_OVER | Lives reach 0 | Immediate | Play gameover.wav, stop music |
| Last level BONUS | VICTORY | No more levels | Immediate | Show final stats |
| Any | MENU | "Quit to menu" | Immediate | Full reset |
| GAME_OVER/VICTORY | COUNTDOWN | "Restart" button | 3000ms | Full reset, deduct 1 credit |

### 10.3 Manager Pause/Resume Order
- **Pause order:** CoinManager → ScalingManager → SpawnManagers (prevents race conditions)
- **Resume order:** SpawnManagers → ScalingManager → CoinManager

---

## 11. AUDIO

### 11.1 Music
- **Background:** `sigurd-theme-song.mp3` (loops during PLAYING state)
- **Power-up melody:** Synthesized square wave motif (A5, C6, B5, D6) at 150ms/note, plays for power duration
- Music pauses during power-up melody, resumes after

### 11.2 Sound Effects (synthesized)

| Event | Waveform | Frequency | Duration |
|-------|----------|-----------|----------|
| Bomb collect | Square | 800→1200 Hz | 200ms |
| Monster hit (death) | Sawtooth | 200→50 Hz | 300ms |
| Coin collect | Sine | 1000→1500 Hz | 150ms |
| Power coin activate | Square+Sine | 200→400 + 800→1200 Hz | 500ms |
| Bonus screen | Square | 880↔987.77 Hz alternating | 6000ms |

### 11.3 Sound Effect Files (preloaded)
- `Victory.wav` — plays on MAP_CLEARED (last bomb collected)
- `gameover.wav` — plays on GAME_OVER (last life lost)

### 11.4 Volume System
- Master volume: 0-100%
- Music volume: 0-100% (compounded with master)
- SFX volume: 0-100% (compounded with master)
- Mute toggles: masterMuted, musicMuted, sfxMuted

---

## 12. PLAYER ANIMATIONS

| State | Animation | Frame Duration | Loop |
|-------|-----------|---------------|------|
| Idle (grounded, no input) | idle-right / idle-left | 1000ms | Yes |
| Walking (grounded + horizontal input) | walk-right / walk-left | 60ms | Yes |
| Jumping (airborne, not floating) | jump-right / jump-left | 100ms | No |
| Landing (just grounded after airborne) | land-right / land-left | 500ms | No |
| Floating stationary (SPACE, no horizontal) | float-stationary | 100ms | Yes |
| Floating directional (SPACE + horizontal) | float-right / float-left | 100ms | Yes/No |
| Map cleared (grounded) | ghost-complete | 100ms | No |

- Left-facing animations are horizontally flipped versions of right-facing
- Direction memory: last movement direction used for idle/jump when no input
- Sprite drawn at 4× collision box size (sprites have transparent padding)
- Sprite anchored at feet (extends upward from collision box)

---

## 13. RENDERING

### 13.1 Draw Order (back to front)
1. Parallax background (per-map city image)
2. Ground
3. Platforms (rounded rectangles with border)
4. Bombs (sprite or colored rectangle with order number)
5. Coins (pixel octagon with letter)
6. Monsters (rounded rectangles with eyes, eyebrows, mouth)
7. Player (sprite)
8. Floating text (score popups)
9. Spawn/respawn indicators (pulsating ghost outlines)

### 13.2 Performance
- Cache `Date.now()` once per render frame (used for pulse/blink effects)
- `imageSmoothingEnabled = false` during coin rendering
- Bomb sprites: lazy-created per bomb, stored in Map by order

### 13.3 Monster Rendering
- Rounded rectangle body with monster color
- White eye circles (4px radius) at 30% and 70% width
- Dark pupils (2.5px radius)
- Angry eyebrows (2px lines angled inward)
- Small curved mouth
- Frozen: render in blue (#4444FF)
- Blinking (pre-unfreeze): alternate between frozen blue and normal color at 300ms interval

### 13.4 Respawn/Spawn Indicators
- Shown during final 3 seconds before spawn/respawn
- Pulsating filled rounded rectangle in monster's color with alpha
- Countdown number (3, 2, 1) centered in white

---

## 14. MAP STRUCTURE

Each map defines:
```
{
  id: string,
  name: string,             // Display name (e.g., "garasjen")
  width: 800,
  height: 600,
  playerStart: { x, y },    // Starting position
  platforms: Platform[],     // { x, y, width, height, color, borderColor }
  ground: Ground,            // { x, y, width, height, color }
  bombs: Bomb[],             // 23 bombs with positions, orders, groups
  monsters: Monster[],       // Static monsters with positions and types
  coinSpawnPoints: [],       // Positions where coins can spawn
  monsterSpawnPoints: [],    // Timed dynamic monster spawns
  groupSequence: number[],   // Order of bomb groups
  background: string,        // Background image name
}
```

**8 maps total:** garasjen, startup lab, innovasjon norge, skatteetaten, nav, kommunehuset, alltinn norge, silicone valley

---

## 15. UI MENUS

### 15.1 Design System (Newsprint Arcade)
- **Background:** Vintage cream (#f2ead5)
- **Surface (cards):** #fbf5e3
- **Foreground (text):** Near-black ink (#1a1d2e)
- **Primary (buttons, accents):** Sky blue (#3d7fe8)
- **Destructive:** Red (#d93a3a)
- **Fonts:** Pixelify Sans (pixel headings), JetBrains Mono (body), VT323 (LCD numbers)
- **Buttons:** Pixel font, 2px border, 4px hard drop shadow, press-down animation
- **Cards:** PixelBezel component with SVG corner brackets in primary color
- **Border radius:** 2-4px (pixel-sharp)

### 15.2 Menu Screens

| Screen | Content |
|--------|---------|
| **Start** | Title "SIGURD STARTUP", balance display, Play button (costs 1 credit), Settings, Controls |
| **Countdown** | Large "3...2...1" with map name, blue glow |
| **In-Game HUD** | Score, Level, Multiplier (with progress bar), Pause button, Fullscreen toggle, Lives (hearts), Balance |
| **Pause** | "PAUSE" title, Resume, Settings, Restart (1 credit), Quit link |
| **Bonus** | Map name + "Fullført!", animated point counter (6s), next level info |
| **Game Over** | "KAPITALEN TØRKET UT", level results table in PixelBezel card, Retry button (1 credit) |
| **Victory** | "UNICORN FOUNDER!", full level history table, Play again button |
| **Settings** | Master/Music/SFX volume sliders with mute toggles in PixelBezel cards |
| **Controls** | 2-column grid of control cards with keyboard key display (WASD/Arrows) |
| **Loading** | Title, spinning loader with percentage, progress bar, step descriptions |

### 15.3 "Out of Credits" State
- When balance = 0 and bridge is active, show red "IKKE NOK MYNTER" box
- Replace Play/Restart buttons with this message
- Game still works without bridge (standalone/free-play mode)

---

## 16. HOST BRIDGE (Balance Integration)

### 16.1 Interface
```
window.sigurdGame = {
  ready: boolean,
  getBalance(): number,
  deductCredits(amount): Promise<{ success, newBalance, error? }>,
  refreshBalance(): Promise<number>,
  onBalanceChanged(callback): () => void,  // returns unsubscribe
  sendGameCompletion(data): void,
  sendAudioSettings(settings): void,
}
```

### 16.2 Credit Deduction Points
- Game start: 1 credit
- Restart after game over: 1 credit
- Restart from pause: 1 credit
- Replay after victory: 1 credit
- **Always await result before starting round**
- **Block round if deduction fails**

### 16.3 Graceful Degradation
- If no bridge (standalone mode): free play, no balance UI, no deductions
- Bridge detection timeout: 3000ms

---

## 17. INPUT MAPPING

| Action | Keys |
|--------|------|
| Move left | A, ← |
| Move right | D, → |
| Jump | W, ↑ |
| Super jump | W+SHIFT, ↑+SHIFT |
| Fast fall | S, ↓ |
| Float | SPACE (hold) |
| Pause | P |
| Fullscreen | F, F11 |

---

## 18. KEY TIMING CONSTANTS

| Constant | Value |
|----------|-------|
| Countdown duration | 3000ms |
| MAP_CLEARED delay (Victory sound) | 5000ms |
| Bonus animation duration | 6000ms |
| Bonus-to-next-level delay | 2000ms |
| Game over sound duration | ~1500ms |
| Respawn countdown display | Final 3 seconds |
| Spawn indicator display | Final 3 seconds |
| A* path cache lifetime | 400ms |
| Bridge detection timeout | 3000ms |
| Loading complete display | 500ms |

---

## 19. DEATH & RESPAWN FLOW

### 19.1 Monster Collision (lives > 1)
1. `deathInProgress` flag set (prevents re-entry)
2. Stop power-up effects
3. Stop background music
4. Play MONSTER_HIT sound
5. `loseLife()` → decrement lives, reset multiplier
6. Respawn player at `map.playerStart`
7. Reset monsters to starting positions
8. Reset spawn manager for current map
9. Reset difficulty scaling
10. Show COUNTDOWN (3s) → resume PLAYING
11. Clear `deathInProgress` flag

### 19.2 Monster Collision (lives = 1, game over)
1. `deathInProgress` flag set
2. Stop power-up effects
3. Stop background music
4. Play GAME_OVER sound (NOT monster hit sound)
5. Record level data as partial
6. `loseLife()` → lives = 0 → state = GAME_OVER
7. Clear `deathInProgress` flag

### 19.3 Fall Off Screen
- Same as monster collision flow (routed through same `handlePlayerDeath()`)

### 19.4 Restart After Game Over
1. UI calls `deductCredits(1)` (if bridge available)
2. If success: `restartGame()` → `resetGame()` + `loadCurrentLevel()` callback
3. Full state reset: stores, coin manager, spawn manager
4. Load level 1 map data + initialize spawn manager for level 1
5. COUNTDOWN → PLAYING

---

## 20. LEVEL TRANSITION FLOW

1. Last bomb collected → MAP_CLEARED state
2. Stop background music, play Victory.wav
3. 5000ms delay (player falls with gravity if airborne)
4. `proceedAfterMapCleared()`:
   - Calculate bonus points (based on effective bomb count)
   - Record level result
   - If bonus > 0: show BONUS screen with animated counter
   - If no bonus: skip to next level
5. Bonus animation completes (6s) → 2000ms delay
6. `proceedToNextLevel()`:
   - Increment level
   - Soft-reset coins (preserve spawn counters)
   - Load next map
   - COUNTDOWN → PLAYING
7. If last level completed: VICTORY state
