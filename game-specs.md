# Bomb Jack — Modern JavaScript Reimplementation Spec

**Target:** A web-based reimplementation of the 1984 Tehkan arcade game *Bomb Jack*, faithful to the original gameplay mechanics, runnable in any modern browser.
**Reference implementation:** Tehkan arcade ROM (1984), as documented by the MAME `bombjack.cpp` driver, the floooh/chips emulator dissection, and the speedrun community's reverse-engineered behavior.
**Audience:** A developer who is building this from scratch with no prior Bomb Jack knowledge.

---

## 0. How to read this document

Every section ends with **Acceptance criteria** in checkbox form. If all boxes can be ticked by playtesting against a reference (MAME, openMSX with Kralizec ROM, or the floooh WebAssembly emulator at https://floooh.github.io/tiny8bit/bombjack.html), the implementation is complete.

Where the original arcade behavior is undocumented at the bit level, this spec uses **(EMPIRICAL)** to flag that the value must be tuned by feel against the reference. Where a value is published in disassembly or community RE work, it is given as a hard number.

---

## 1. Tech stack recommendation

This is a recommendation, not a requirement.

- **Renderer:** HTML5 Canvas 2D is sufficient. WebGL/PixiJS only if you want shader effects (CRT scanlines, etc.). The game has at most ~30 sprites on screen at 256×256 logical resolution — Canvas 2D will run at 60 fps trivially.
- **Game loop:** Fixed timestep at 60 Hz with interpolated rendering. The original game logic runs once per VBLANK (60 Hz on NTSC), so 60 Hz is the canonical rate. Use `performance.now()` accumulator pattern, not `requestAnimationFrame` deltas directly.
- **Asset pipeline:** Single sprite atlas PNG (power-of-two, e.g. 512×512), one for tiles, one for sprites. JSON metadata for sprite frames.
- **Audio:** Web Audio API. Use OGG or short MP3 clips. PSG-style chiptune synthesis is overkill unless you want it for authenticity.
- **State management:** Plain object/class-based state machine, no framework needed. The game has ~6 top-level states.
- **No physics engine.** All movement is integer/fixed-point pixel arithmetic. A physics library would be wrong for this — Bomb Jack uses look-up tables, not real physics.

---

## 2. Display, coordinates, and frame timing

### 2.1 Logical resolution

- Internal playfield: **256 × 256 logical pixels.**
- The arcade was portrait-oriented (CRT rotated 90° in the cabinet). For a modern landscape browser display, render the playfield centered with score/lives HUD on the sides (or above/below if you prefer the portrait original — make this configurable).
- Recommend integer-scale upscaling (×2, ×3, ×4) with `image-rendering: pixelated` to preserve the 8-bit look.

### 2.2 Coordinate system

- Origin (0, 0) at top-left.
- X increases right, Y increases down.
- All entity positions are stored in pixels (or sub-pixel fixed-point — see Section 4.1).

### 2.3 Frame timing

- **Game logic tick: 60 Hz (16.667 ms).** All AI, physics, collision, scoring, and animation advance once per tick.
- Rendering can run at display refresh rate with interpolation, or locked to logic ticks.
- There is no sub-tick physics — collisions and movement are atomic per-frame.

### 2.4 Acceptance criteria

- [ ] Game runs at exactly 60 logic ticks per second on any monitor refresh rate.
- [ ] Pixel art is crisp (no bilinear filtering on upscale).
- [ ] Resizing the browser window does not break aspect ratio.

---

## 3. Display layers and rendering order

The arcade composites the screen from three layers (back to front). Replicate this layering — it makes asset organization much easier and matches how levels are authored.

### 3.1 Background layer

- One of **5 background images** per level (Sphinx/pyramid, Greek temple/Acropolis, castle/Neuschwanstein, modern city skyline, futuristic city skyline). The 5th level cycle has no platforms.
- Backgrounds are static decoration only — no collision, no interaction.
- Implementation: a single 256×256 PNG per background, drawn once per frame at z=0.

### 3.2 Foreground layer

- Static, level-specific elements **with collision**: floor, platforms, bombs.
- Tile-based, **8×8 pixel tiles**, 32×32 tile grid for the playfield.
- Collision is per-tile (axis-aligned). A tile is either solid or non-solid — no slopes.
- Bombs are part of this layer (they're not sprites in the arcade, though in your JS impl you can implement them however is convenient).

### 3.3 Sprite layer

Everything that moves: Jack, all enemies, the powerball, the coins (P/B/E/S), the floating score numbers when you collect bombs.

- Sprites are 16×16 (most things) or 32×32 (some animations).
- Z-order within the sprite layer doesn't really matter — sprites should never overlap meaningfully in normal play. If they do, render Jack on top.

### 3.4 Acceptance criteria

- [ ] All 5 background screens render correctly.
- [ ] Platforms are solid; Jack and enemies collide with them correctly.
- [ ] Bombs render as part of the static layer, not as sprites.

---

## 4. Jack — the player character

### 4.1 Physics model

Jack uses a **sub-pixel fixed-point movement** model. This is the classic 8-bit technique: store each axis position as a 16-bit value where the high byte is the integer pixel and the low byte is the sub-pixel fraction. Each frame, add a velocity to position; render at the integer part.

```javascript
// Suggested representation
class Jack {
  x = 128 << 8;     // sub-pixel fixed-point, integer part = pixel column
  y = 64 << 8;
  vx = 0;           // pixels per frame, fixed-point (1.0 = 256)
  vy = 0;
  gravityIndex = 0; // index into gravity LUT, 0–127
  state = 'falling';
}
```

### 4.2 Horizontal movement

- **Speed:** approximately 1.5 pixels/frame (EMPIRICAL — derived from the analogous Mighty Bomb Jack NES disassembly, where the sub-X velocity is constant 1.5 px/f producing alternating 1px and 2px frames). This corresponds to `vx = 0x180` in 8.8 fixed-point.
- **No acceleration, no friction.** Press left/right → velocity is set directly. Release → velocity is zero on the next frame.
- **Full air control:** horizontal velocity is independent of vertical state. Jack can change direction freely while jumping, falling, or floating. This is one of the game's defining mechanics.
- **Collision:** if the next horizontal position would put Jack inside a solid platform tile, clamp to the platform edge. No wall-sliding bonus, no wall-jumping.

### 4.3 Vertical movement (gravity LUT)

This is the trickiest part to get right. Jack does **not** use real gravity (constant acceleration). He uses a look-up table indexed by a "gravity counter" (`gravityIndex`, 0–127).

The table maps `gravityIndex → vy` where:
- `gravityIndex = 0`: maximum upward velocity (jump just initiated)
- `gravityIndex ≈ 64`: zero vertical velocity (apex / hover)
- `gravityIndex = 127`: maximum downward velocity (terminal)

Each frame, `gravityIndex` increments; the table provides the current `vy`. The result is a smooth jump arc that asymmetrically slows at apex and accelerates on descent.

**Suggested LUT (EMPIRICAL — tune by feel):**

```javascript
// Sample shape — not the actual arcade values, but the right curve
const GRAVITY_LUT = [
  -0x300, -0x2E0, -0x2C0, -0x2A0, // index 0–3: strong upward
  // ... smoothly decreasing ...
  0x000,                          // index 64: hover
  // ... smoothly increasing ...
  0x380, 0x380, 0x380             // index 127: terminal velocity, ~3.5 px/f
];
```

Per the MBJ NES disassembly, the **vertical terminal velocity caps at 3.5 px/f**.

### 4.4 Jump types

There are three jump heights, controlled by holding a direction during jump initiation:

| Input | Effect | Initial gravityIndex |
|---|---|---|
| Jump only | Normal jump (~3/4 screen height) | 0 |
| Up + Jump | High jump (full screen height) | 0, with reduced increment rate |
| Down + Jump | Short jump (~1/2 screen height) | ~16 (starts partway through the LUT) |

The "hold direction for variable jump height" works by feeding different starting offsets into the gravity counter on jump initiation, OR by varying how fast `gravityIndex` advances. The MBJ disassembly shows the latter: the rate of change comes from a look-up table that depends on whether up/neutral/down is held.

### 4.5 Float / glide (the signature mechanic)

- **Trigger:** While Jack is falling (vy > 0), tapping the jump button.
- **Effect:** Snap `gravityIndex` back to 64 (the hover index). Jack will briefly stop, then begin falling again from the apex of the gravity LUT.
- **Repeated taps** produce a controlled flutter that lets the player stay airborne almost indefinitely.
- This is what makes Bomb Jack feel like Bomb Jack. Get this right.

### 4.6 Spawn behavior

- At level start, Jack appears at **(128, 64)** in screen coordinates (center, upper third).
- He falls under gravity to the nearest platform.
- The first bomb he touches becomes the start of the lit-fuse sequence (see Section 7.3).

### 4.7 Death

- Triggered by collision with any active enemy (see Section 5.4 for the invulnerability windows that make this NOT instant in some cases).
- Death animation: Jack flips and falls to the nearest floor below, landing on his head. ~60 frames (1 second).
- After death animation, decrement lives. If lives > 0, respawn at (128, 64) with the level state preserved (collected bombs stay collected, enemies stay where they are).
- If lives = 0, transition to game over.

### 4.8 Per-jump scoring bonus

Each jump (and possibly each wall bounce) awards a tiny bonus that scales with the multiplier:
- Base value: **10 points per jump**.
- With 4+ B coins collected (multiplier 5x): **80 points per jump**.
- This is what speedrunners exploit by "flapping against barriers" to maximize end-of-level score.

### 4.9 Acceptance criteria

- [ ] Jack moves left/right at exactly the same horizontal speed in air and on ground.
- [ ] Normal jump arc reaches ~3/4 of screen height.
- [ ] High jump (Up + Jump) reaches the ceiling.
- [ ] Down + Jump produces a short hop.
- [ ] Float (tap Jump while falling) noticeably slows descent and can be repeated.
- [ ] Jack respawns at center-top and falls naturally on level start.
- [ ] Jumping awards 10 points per jump at 1x multiplier, 80 at 5x.

---

## 5. Enemies

### 5.1 Enemy types and AI

The arcade has **3 base enemy classes** that morph into airborne variants. There are at most **6 active enemies** on screen at any time, plus the always-present mechanical bird (so 7 total threats max).

#### 5.1.1 Mechanical Bird

- **Always exactly 1 on screen, persistent throughout the level.**
- Spawns at one of 4 corners at level start.
- **Spawn corner is influenced by player input:** if the player holds a direction when the level begins, the bird spawns in the *opposite* corner. (E.g. holding Up+Right → bird spawns top-left.) Implement this by reading the joystick state on the level-init frame.
- **AI:** Manhattan-distance homing on Jack. Each frame, move toward Jack on whichever axis has the larger gap. Speed: ~1 pixel/frame (EMPIRICAL, slower than Jack so beatable).
- **Cannot move diagonally** — the bird's velocity vector is always (±speed, 0) or (0, ±speed), never both.
- **Speed is configurable via difficulty (see Section 9).**

#### 5.1.2 Mummy (the patrolling ground enemy)

- **Spawns at top of screen** and falls onto a platform.
- **Walks back and forth** on its current platform at ~0.75 pixels/frame (EMPIRICAL).
- **At platform edges:** has a per-platform-visit chance to drop off (descend to the platform below or to the floor). Use a "drop timer" that counts down each frame; when the mummy reaches an edge after the timer expires, it drops.
- **At the bottom of the screen:** transforms into an airborne enemy variant (see 5.1.3). The transform animation lasts ~30 frames during which the mummy CANNOT damage Jack (this is the "transform invulnerability" exploited by speedrunners).
- After transformation, the slot is occupied by an airborne enemy until killed (via P coin) or the level ends.

#### 5.1.3 Airborne forms (post-transformation)

When a mummy reaches the bottom and morphs, it becomes one of these. Pick the type randomly (or cycle deterministically — the arcade behavior here is not fully documented):

- **Saucer (UFO):** Free 2D motion. Slowly homes on Jack on both axes, but **accelerates as it approaches Jack**. Most dangerous.
- **Orb:** Aligns to Jack's Y coordinate, then bobs unpredictably while moving toward him on X. Slow but persistent.
- **Sphere:** Hovers, periodically seeks Jack's Y elevation. Slowest of the three.

Implementation suggestion: each airborne type is just a different velocity-update function. The state machine is shared.

### 5.2 Enemy spawning

- At level start, **0 enemies** active. The bird spawns immediately. Mummies begin spawning shortly after.
- A new mummy spawns from the top of the screen approximately every **N frames** (EMPIRICAL — starts at ~180 frames / 3 seconds at level 1, decreases at higher levels).
- Spawning continues until 6 total enemies are active. If an enemy is killed (P coin), the count drops and a new mummy spawns to refill.
- **Spawn-invulnerability window:** When an enemy first spawns, it's not lethal until it has "turned around for the first time" (i.e., made its first AI decision after spawn). This creates a brief safe window for Jack to pass through the spawn point.

### 5.3 Difficulty scaling

| Level | Enemy count | Bird speed | Mummy speed | Spawn rate |
|---|---|---|---|---|
| 1–5 | up to 4 | slow | slow | slow |
| 6–10 | up to 5 | medium | medium | medium |
| 11–15 | up to 6 | fast | fast | fast |
| 16+ | up to 6 | very fast | very fast | very fast |

(Exact scaling values are EMPIRICAL — tune by reference play.)

The arcade also has dipswitches for difficulty:
- Bird speed: 4 settings
- Enemy count and speed: 4 settings

In a modern impl, expose these as a difficulty selector (Easy / Normal / Hard / Insane).

### 5.4 Invulnerability windows (CRITICAL — do not skip)

Three different invulnerability conditions exist. Each is a brief period during which collision between Jack and an enemy does NOT kill Jack:

1. **Spawn invulnerability:** Newly spawned enemy is harmless until its first AI direction change.
2. **Transform invulnerability:** When a mummy reaches the bottom and morphs into an airborne form, it's harmless for the duration of the morph animation (~30 frames).
3. **Powerball-revert invulnerability:** When the P coin freeze ends and frozen enemies revert from "tokens" back to their normal form, they're harmless during the reversion animation (~30 frames).

Implementation: each enemy has an `isLethal` boolean that's false during these animations.

### 5.5 Enemy collision with platforms

- Mummies use platform collision (they walk on top, can drop off edges).
- The bird and airborne forms **ignore platforms entirely.** They fly through them.

### 5.6 Acceptance criteria

- [ ] Exactly one bird is on screen for the entire level.
- [ ] Bird spawn corner can be controlled by holding a direction at level start.
- [ ] Bird moves only horizontally or vertically, never diagonally.
- [ ] Mummies spawn from top, walk on platforms, and eventually drop to bottom.
- [ ] Mummies morph at the bottom and the transform animation has a no-damage window.
- [ ] Maximum 6 active enemies + 1 bird.
- [ ] Enemy speed visibly increases at level 6 and beyond.

---

## 6. Bombs

### 6.1 Layout

- **Exactly 24 bombs per level**, at fixed predefined positions per level.
- Bomb position set varies for the first 20 levels, then begins to repeat.
- Bombs are static; they do not move or animate position. They do animate visually (the lit one has a flashing fuse).

### 6.2 Lit fuse mechanic

- At level start, **no bomb is lit.** The first bomb Jack collects becomes the anchor for the chain.
- After the first collection, the **next bomb in a predefined sequence** lights up.
- When the lit bomb is collected, the next bomb in the sequence lights up. And so on.
- **Only one bomb is lit at a time**, ever.
- The sequence is predefined per level (the arcade ships with the sequence baked into ROM tables). For your impl, store each level as `{ bombPositions: [...24 coords...], sequence: [...23 indices...] }`.
- The starting point of the chain depends on which bomb the player collects first — but the **order** of the chain is fixed. So the chain is a circular linked list, and the first collection determines where on the list you begin traversing.

### 6.3 Bomb scoring

| Action | Points |
|---|---|
| Collect unlit bomb | 100 |
| Collect lit bomb | 200 × current multiplier (max 1000 at 5x) |
| Collect 20 lit bombs in sequence (end of level) | +10,000 bonus |
| Collect 21 lit bombs in sequence | +20,000 bonus |
| Collect 22 lit bombs in sequence | +30,000 bonus |
| Collect 23 lit bombs in sequence (PERFECT) | +50,000 bonus |

Note: 24 lit bombs is impossible because the last bomb collected cannot have "the next bomb in the chain" lit at the moment of its collection — the chain has no Nth+1 element.

### 6.4 Visual feedback

- Lit bomb: animated flashing/sparking fuse, brighter color.
- Unlit bomb: static, dimmer.
- On collection: brief sparkle effect, floating point value rises and fades.

### 6.5 Level completion

- Triggered when all 24 bombs are collected.
- Award end-of-level bonuses (lit-bomb count, etc.).
- Brief celebration animation (~3 seconds).
- Advance to next level.

### 6.6 Acceptance criteria

- [ ] Each level has exactly 24 bombs at fixed positions.
- [ ] Exactly one bomb is lit at any time after the first collection.
- [ ] Collecting the lit bomb advances the chain to the next predefined bomb.
- [ ] Collecting in correct sequence yields end-of-level bonuses at the documented thresholds.
- [ ] Level advances when bomb #24 is collected.

---

## 7. Power-ups (Coins)

There are **4 coin types**, each with distinct spawn rules, behaviors, and effects.

### 7.1 P (Powerball)

- **Spawn rule:** A "powerball meter" tracks bomb collection progress. Lit bomb collection adds 1 to the meter; unlit adds 0.5. When the meter reaches 10, a P coin spawns. This is equivalent to "spawn after 10 lit bombs OR 20 unlit bombs OR a mix totaling 10 weighted points."
- **Meter pause:** The meter does NOT advance while a P coin is currently active on the playfield, OR while the freeze period from a previously-collected P is still in effect. This prevents stacking.
- **Maximum 2 P coins per level.**
- **Movement:** Spawns at the top of the screen, bounces diagonally around the playfield. Bounces off all four edges.
- **Color cycling:** The P coin starts **blue** and cycles color each time Jack jumps OR collides with a wall. The color sequence and point values:

| Color | Points (when collected) |
|---|---|
| Blue | 100 |
| Red | 200 |
| Purple | 300 |
| Green | 500 |
| Turquoise | 800 |
| Yellow | 1,000 |
| Grey/Silver | 2,000 |

- The cycle continues looping while the P coin is active. Skilled players manipulate it to silver before grabbing.

- **Effect on collection:**
  1. Award the color-based point value above.
  2. Freeze all active enemies for **~5 seconds (300 frames)** — they become static "smile" tokens.
  3. While frozen, Jack can collect tokens by touching them. Token scoring ramps:

| Token # collected this freeze | Points |
|---|---|
| 1st | 100 |
| 2nd | 200 |
| 3rd | 300 |
| 4th | 400 |
| 5th | 500 |
| 6th and beyond | 600 |

  4. After the freeze ends, any remaining tokens revert to their original enemy form, with the transform-revert invulnerability window (Section 5.4).

### 7.2 B (Bonus)

- **Spawn rule:** Spawns when the player's score crosses a multiple of 5,000 — but **only if the threshold was crossed by means OTHER than collecting a B coin itself.** This prevents the chain reaction "B coin → score crosses next 5k → another B coin spawns." Implementation:

```javascript
function onScoreChange(scoreDelta, source) {
  const oldScore = score - scoreDelta;
  const newScore = score;
  const oldThreshold = Math.floor(oldScore / 5000);
  const newThreshold = Math.floor(newScore / 5000);
  if (newThreshold > oldThreshold && source !== 'B_COIN') {
    spawnBCoin();
  }
}
```

- **Maximum 5 B coins per level.**
- **Movement:** Falls from top to bottom in a slow drift, possibly weaving. Lasts on screen for ~10 seconds before disappearing if uncollected.
- **Effect on collection:**
  - Award **500 points** (note: this can itself cross a 5k threshold but does NOT trigger another B coin per the rule above).
  - Increment score multiplier by 1, capped at **5x**.
- The current multiplier is shown in the HUD (large number at top of screen).
- Multiplier resets to 1x at the start of each level (TBD — verify against reference).

### 7.3 E (Extra life)

- **Spawn rule:** Approximately every 8 B coins collected (cumulative across levels). The threshold is **lower** if the player has lost lives (the game is more generous to struggling players).
  - Suggested implementation: track a counter `eCoinProgress` that increments by 1 per B coin and by 2 per B coin if the player has died this game. Spawn E coin when counter reaches 8.
- **Movement:** Falls from top to bottom, similar to B coin but slower. May briefly land on platforms before continuing down.
- **Effect on collection:** +1 life. Maximum lives cap at 9 (or whatever your HUD can display).

### 7.4 S (Special)

- **Spawn rule:** Rare, timer-based, pseudo-random. Trigger fires when an internal frame counter matches a specific bitmask (community RE suggests `timer & 0xAA == 0`, but this is unverified).
- **Effect in arcade:** +1 free credit AND immediate level skip.
- **For a modern web port, reinterpret as:** large bonus (e.g. 5,000 points) and possibly skip to next level. Or omit entirely. Document your choice.

### 7.5 Acceptance criteria

- [ ] P coin spawns after the equivalent of 10 lit bombs collected, max 2 per level.
- [ ] P coin cycles color on every Jack jump or wall hit.
- [ ] P coin point value matches color (100 → 2000).
- [ ] Collecting P freezes enemies for ~5 seconds; tokens are collectable with ramping scores.
- [ ] B coin spawns at every 5k threshold crossed, but NOT when a B coin itself caused the crossing.
- [ ] B coin caps at 5 per level and 5x multiplier.
- [ ] E coin spawns approximately every 8 B coins (more frequently if player has died).

---

## 8. Scoring summary

Consolidated reference table for all scoring sources:

| Source | Points |
|---|---|
| Unlit bomb | 100 |
| Lit bomb | 200 × multiplier (200 / 400 / 600 / 800 / 1000) |
| 20 lit bombs in sequence (level end) | +10,000 |
| 21 lit bombs in sequence | +20,000 |
| 22 lit bombs in sequence | +30,000 |
| 23 lit bombs in sequence (PERFECT) | +50,000 |
| B coin collection | +500, +1 multiplier |
| P coin collection (color-dependent) | 100 / 200 / 300 / 500 / 800 / 1000 / 2000 |
| Frozen enemy token (1st–6th+) | 100 / 200 / 300 / 400 / 500 / 600 |
| E coin | (no points, +1 life) |
| Jump / wall bounce bonus | 10 (at 1x) → 80 (at 5x) |

Score wraps at **99,999,990** (the arcade's maximum displayable score). Some ports wrap earlier — your call.

---

## 9. Levels and progression

### 9.1 Level structure

- **5 background screens** that cycle.
- **Platform layouts** vary across the first 16 levels, except every 5th level (5, 10, 15) has **no platforms at all** (just floor — much harder, no places to perch).
- **Bomb positions** vary across the first 20 levels.
- After level 20, layouts and bomb positions begin to repeat with progressively faster enemies.
- Total: theoretically infinite levels, capped only by score wrap or player death.

### 9.2 Level data format (suggested JSON)

```json
{
  "levelNumber": 1,
  "background": "sphinx",
  "platforms": [
    { "x": 32, "y": 96, "width": 64 },
    { "x": 160, "y": 96, "width": 64 },
    { "x": 96, "y": 160, "width": 64 }
  ],
  "bombs": [
    { "x": 16, "y": 224 },
    { "x": 32, "y": 224 },
    // ... 22 more
  ],
  "bombSequence": [3, 7, 12, 5, 18, /* ... 23 indices total ... */],
  "difficulty": {
    "maxEnemies": 4,
    "birdSpeed": 0.75,
    "mummySpeed": 0.5,
    "spawnIntervalFrames": 180
  }
}
```

### 9.3 Level transitions

- On level complete: brief "PERFECT!" or "BONUS X" overlay if applicable, then fade to the next level's background.
- On level start: brief level-number splash, then Jack appears at (128, 64), bird spawns, gameplay begins.

### 9.4 Acceptance criteria

- [ ] All 5 backgrounds appear correctly across levels 1–5.
- [ ] Level 5 (and 10, 15) has no platforms — only the floor.
- [ ] Level layouts cycle correctly past level 16.
- [ ] Difficulty visibly increases at higher levels.

---

## 10. Game state machine

States and transitions:

```
[BOOT] → [TITLE/ATTRACT] ⇄ [HIGH_SCORE_DISPLAY]
                ↓ (player presses start)
            [LEVEL_INTRO] (1.5s, shows "ROUND N")
                ↓
            [PLAYING]
              ↓                          ↓                     ↓
   (all bombs collected)        (Jack hit, lives > 0)   (Jack hit, lives = 0)
              ↓                          ↓                     ↓
       [LEVEL_COMPLETE]          [DEATH_ANIMATION]      [DEATH_ANIMATION]
              ↓                          ↓                     ↓
       [LEVEL_INTRO]               [PLAYING]            [GAME_OVER]
                                                                ↓
                                                  [HIGH_SCORE_ENTRY] (if qualified)
                                                                ↓
                                                       [TITLE/ATTRACT]
```

Each state owns its own update() and render() functions. Keep the state machine flat and explicit — no nested states.

### 10.1 Attract mode

- Shows the title screen, then auto-plays a brief demo of level 1 (a scripted recording of Jack collecting a few bombs and dying), then shows the high score table, then loops.
- Transitions to gameplay on any input.

### 10.2 Acceptance criteria

- [ ] Game boots into title/attract loop.
- [ ] Pressing start begins gameplay at level 1 with 3 lives.
- [ ] Game over after losing all lives, with optional high-score entry.

---

## 11. Lives and game over

- Player starts with **3 lives** (configurable in arcade dipswitches: 2/3/4/5).
- Lives shown as Jack icons in the HUD.
- Death triggers death animation, life decrement, and either respawn or game over.
- Maximum lives: 9 (HUD constraint).

---

## 12. Audio

### 12.1 Music

The arcade uses several tracks, some of which are **licensed third-party music** that you should NOT directly reproduce in a public release without clearance:

- Round 1 theme: "Kittens of the Apple Forest" (Mrs. Pepperpot ED) — licensed
- Round 2 theme: "Lady Madonna" (The Beatles) — licensed
- Round 3 theme: original
- Title screen, game over, level complete: original short jingles

**Recommendation:** Compose original chiptune-style music in similar style, OR use royalty-free chiptune music. Document the music substitution clearly.

### 12.2 Sound effects (minimum set)

| Event | SFX |
|---|---|
| Jump | Short bleep |
| Bomb collected (unlit) | Short pop |
| Bomb collected (lit) | Higher pop, ascending |
| Jack hit | Death sound |
| P coin collected | Power-up sound |
| Freeze active (loop) | Brief jingle |
| B coin collected | Coin-pickup sound |
| E coin collected | 1-up sound |
| Level complete | Fanfare |

### 12.3 Audio architecture

- Web Audio API.
- Single `AudioContext` initialized on first user interaction (browsers require this).
- Pre-decode all SFX at boot.
- Music as looping `AudioBufferSourceNode` per track.

---

## 13. Controls

### 13.1 Default keyboard mapping

| Key | Action |
|---|---|
| Arrow Left / A | Move left |
| Arrow Right / D | Move right |
| Arrow Up / W | Modifier: high jump (when held with jump) |
| Arrow Down / S | Modifier: short jump / fast fall |
| Space / Z | Jump (hold from ground) / Float (tap in air) |
| Enter | Start / Continue |
| P | Pause |
| M | Mute |

### 13.2 Gamepad

Standard Gamepad API. Map jump to A button, direction to d-pad/left-stick, start to Start button.

### 13.3 Touch (optional, mobile)

On-screen d-pad + jump button. Note: Bomb Jack's precision-jump-required gameplay is not great on touch — consider gating mobile support behind a "best with keyboard" warning.

### 13.4 Acceptance criteria

- [ ] Keyboard controls feel responsive (no input lag > 1 frame).
- [ ] Held-key state is read each frame, not edge-triggered (to allow continuous movement).
- [ ] Jump button distinguishes "press" (initial jump) from "hold" (sustain) from "tap in air" (float).

---

## 14. HUD

The HUD shows:
- **Score** (player 1, always)
- **High score** (top of screen)
- **Lives remaining** (Jack icons)
- **Multiplier** (1x–5x, large display, prominent)
- **Round number**

In landscape orientation, place HUD on the side margins. In portrait, place above/below.

---

## 15. Persistence

- High score table: top 10 scores. Persist via `localStorage`.
- Settings (volume, controls): `localStorage`.
- No account system needed.

---

## 16. Suggested file structure

```
/src
  /core
    GameLoop.js          # fixed timestep loop
    StateMachine.js      # game state management
    Input.js             # keyboard/gamepad abstraction
  /entities
    Jack.js              # player character + physics
    Bird.js              # mechanical bird AI
    Mummy.js             # ground-walking enemy
    AirborneEnemy.js     # post-transform forms
    Bomb.js              # bombs and lit-fuse chain
    Coin.js              # P, B, E, S coin behavior
  /world
    Level.js             # level data loading
    Platform.js          # platform collision
    Background.js        # background renderer
  /render
    Sprite.js            # sprite rendering
    Hud.js               # HUD layout
    ScreenManager.js     # canvas setup, scaling
  /audio
    AudioManager.js
    Music.js
    Sfx.js
  /data
    levels.json          # all level definitions
    sprites.json         # sprite atlas metadata
  main.js                # entry point
/assets
  sprites.png
  background-1-sphinx.png
  background-2-temple.png
  ... etc
  music/
  sfx/
```

---

## 17. Testing strategy

Manual playtest against reference implementation (MAME with `bombjack.zip` ROM, or floooh's WebAssembly emulator). Side-by-side comparison for:

1. Jump arc shape and height.
2. Float/glide feel.
3. Horizontal speed.
4. Bird homing behavior.
5. Mummy patrol and drop behavior.
6. P coin color cycling.
7. Score values for each event.
8. End-of-level bonus thresholds.

For automated tests:
- Unit tests for scoring math (B coin threshold logic, multiplier cap, end-of-level bonuses).
- Unit tests for the bomb-chain sequence (correct next-bomb selection).
- Unit tests for the powerball meter.

---

## 18. Stretch goals (not required for v1)

- **Two-player alternating mode** (Player 1 / Player 2 take turns on death).
- **Difficulty selector** (Easy / Normal / Hard / Insane mapping to dipswitch settings).
- **CRT shader** (scanlines, curvature, bloom).
- **Cabinet rotation toggle** (portrait original orientation vs. landscape adapted).
- **Replay system** (record inputs, play back deterministically).
- **Online leaderboard.**

---

## 19. Known unknowns

These values are NOT publicly documented and must be tuned by ear/feel against reference play:

- Exact horizontal pixel velocity for Jack (estimate: 1.5 px/f).
- Exact gravity look-up table values.
- Exact mummy patrol speed.
- Exact mummy drop-timer base values per level.
- Exact enemy spawn intervals per level.
- Exact freeze duration after P coin (~5s estimate).
- Exact P coin bounce velocity.
- Exact B and E coin fall speeds.
- S coin spawn rule (community-suggested but not verified).
- Bomb sequence tables for each level (extract from arcade ROM if needed).

For all of these, **the gameplay loop is more important than exact pixel-perfect replication.** Get within 10–20% of the reference feel and you're done.

---

## 20. Reference materials

Primary sources for technical accuracy:

- **MAME source:** `src/mame/drivers/bombjack.cpp` and `src/mame/video/bombjack.cpp` in the MAME repository.
- **Hardware schematics:** floooh/emu-info repo on GitHub.
- **Floooh dissection:** https://floooh.github.io/2018/10/06/bombjack.html
- **Floooh WebAssembly emulator (great visual reference):** https://floooh.github.io/tiny8bit/bombjack.html
- **Speedrun.com Bomb Jack arcade guides:** for empirical mechanic details (P/B/E coin spawn rules, bird positioning trick).
- **Arcade-history.com Bomb Jack page:** for scoring tables and tips.
- **Mighty Bomb Jack NES disassembly (SDA Knowledge Base):** for the closest documented analog of Jack's physics, since arcade physics aren't published at the same level of detail.

---

**End of spec. Estimated implementation time: 2–4 weeks for a single developer working at a steady pace.**
