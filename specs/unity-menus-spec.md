# Sigurd Startup — Menus & UI Spec (Unity Port)

A 1:1 implementation reference for every menu and UI screen in the game. Pair with `specs/unity-port-spec.md` (game logic), `specs/unity-sprites-spec.md` (visuals), and `exports/maps/` (level data).

This document is structured so a Unity LLM (or a human engineer) can implement each menu without needing to inspect the original React/TypeScript code. Every label, button, conditional render rule, and styling token is captured here.

The original UI is React + Tailwind CSS + Radix UI. In Unity, **UI Toolkit (UXML + USS)** is the closest equivalent and the strongly recommended target — its CSS-like styling, document-tree authoring, and runtime data binding map almost directly to the React + Tailwind originals. uGUI is acceptable but will require more manual layout work. The spec below is engine-agnostic; per-screen sections describe content, structure, and behavior rather than React JSX.

---

## Table of Contents

1. [Unity UI Stack Recommendation](#1-unity-ui-stack-recommendation)
2. [State Model & Dispatch](#2-state-model--dispatch)
3. [Design System: Colors, Fonts, Tokens](#3-design-system-colors-fonts-tokens)
4. [Shared Primitives](#4-shared-primitives)
5. [Menu Screens](#5-menu-screens)
   - [5.1 Start Menu](#51-start-menu)
   - [5.2 Pause Menu](#52-pause-menu)
   - [5.3 Settings Menu](#53-settings-menu)
   - [5.4 Controls Menu](#54-controls-menu)
   - [5.5 Countdown Overlay](#55-countdown-overlay)
   - [5.6 Bonus Screen](#56-bonus-screen)
   - [5.7 Game Over Screen](#57-game-over-screen)
   - [5.8 Victory Menu](#58-victory-menu)
   - [5.9 Loading Menu](#59-loading-menu)
   - [5.10 In-Game HUD](#510-in-game-hud)
   - [5.11 Tutorial Select](#511-tutorial-select)
   - [5.12 Mission Brief](#512-mission-brief)
   - [5.13 Mission Complete](#513-mission-complete)
   - [5.14 Tutorial HUD](#514-tutorial-hud)
   - [5.15 Tutorial Overlay](#515-tutorial-overlay)
6. [Animations & Transitions](#6-animations--transitions)
7. [Bridge Integration](#7-bridge-integration)
8. [Keyboard Shortcuts Summary](#8-keyboard-shortcuts-summary)
9. [Implementation Order](#9-implementation-order)

---

## 1. Unity UI Stack Recommendation

**UI Toolkit (UXML + USS + C#) is the right choice.** Reasons:

- The original UI is web-stack (React + CSS-in-Tailwind). UI Toolkit's USS is functionally identical to CSS, so styling translates directly.
- All menus are document-tree shaped (headings, paragraphs, button rows, table rows). UI Toolkit's `VisualElement` tree matches this.
- Live binding to game state via `UnityEngine.UIElements.DataBinding` is cleaner than the manual setter pattern of uGUI.
- One global stylesheet (`game-theme.uss`) can define all the color tokens, fonts, and reusable button styles below. Each menu UXML then references these classes.

If your team is more comfortable with **uGUI**, build a single `Theme.cs` ScriptableObject that holds the design tokens, plus prefab variants for each button/card style. Either way, the screen-by-screen specifications below apply.

**Top-level architecture:**

```
GameScene
├── Canvas (Screen Space - Overlay)
│   ├── HUD (always present during PLAYING/PAUSED)
│   └── MenuRoot (one UI Document or Canvas group; swaps content based on state)
└── Game world (camera, level scene, etc.)
```

A single `MenuDispatcher.cs` listens to `GameState` and `MenuType` changes and shows the matching menu UXML / panel. Only one menu is ever active at a time; the HUD is independent and always present during PLAYING/PAUSED.

---

## 2. State Model & Dispatch

Two enums drive the entire UI: `GameState` and `MenuType` (see `specs/unity-port-spec.md` §4 for the full state machine).

| GameState | MenuType (shown) | What renders |
|---|---|---|
| `MENU` | `START` | Start menu |
| `MENU` | `SETTINGS` | Audio/settings menu (nested) |
| `MENU` | `CONTROLS` | Controls reference (nested) |
| `MENU` | `TUTORIAL_SELECT` | Mission picker |
| `MENU` | `TUTORIAL_BRIEF` | Mission brief |
| `MENU` | `TUTORIAL_RESULT` | Mission complete |
| `COUNTDOWN` | `COUNTDOWN` | 3-2-1 overlay + HUD beneath |
| `PLAYING` | `IN_GAME` | HUD only |
| `PAUSED` | `PAUSE` | Pause modal + HUD beneath |
| `MAP_CLEARED` | (HUD only, briefly) | HUD; transitional state, ~5s |
| `BONUS` | `BONUS` | Bonus reveal screen |
| `VICTORY` | `VICTORY` | Final victory screen |
| `GAME_OVER` | `GAME_OVER` | Game over screen |
| (any) | (loading) | Loading screen — replaces everything before MENU |

The dispatcher checks `currentState + currentMenu` each frame (or on change events) and activates the correct UI panel. **Only one full-screen menu shows at a time.** The HUD is rendered as a separate, persistent top bar during PLAYING/PAUSED.

A nested-menu pattern exists: from Start or Pause, the user can open Settings/Controls/Tutorial. The state stays `MENU`/`PAUSED`, only the `MenuType` changes. A "back" button or `Escape` returns to the parent menu (`closeNestedMenu()` in the Canvas code).

---

## 3. Design System: Colors, Fonts, Tokens

Define these as global USS variables (`game-theme.uss`) at the root:

### Colors

```css
:root {
  /* Primary palette (lime accent) */
  --primary: #abdd64;
  --primary-light: #c2eb83;
  --primary-dark: #7fb33d;
  --primary-foreground: rgb(10, 18, 4);  /* near-black ink for text on lime */

  /* Background layers */
  --background-deep: #20252e;            /* deepest, e.g. shell, game frame */
  --background: #2a303c;                 /* main canvas background */
  --surface: #242933;                    /* cards, panels, sliders */
  --surface-raised: #2f3543;             /* hovered surfaces, key caps */
  --surface-line: #3a4150;               /* hairlines / borders */

  /* Text */
  --foreground: #ffffff;                 /* primary text */
  --foreground-muted: #b2ccd6;           /* body text */
  --foreground-dim: #91a6b0;             /* captions / labels */

  /* Semantic */
  --destructive: #e05555;                /* red, error/danger */
  --ok: #abdd64;                         /* mirrors primary */
  --coin-yellow: #eab308;                /* bonus / gold */

  /* Multiplier tier accents */
  --accent-cyan: #22d3ee;                /* multiplier x2 */
  --accent-yellow: #eab308;              /* multiplier x3 */
  --accent-peach: #f2ae99;               /* multiplier x4 */
  --accent-pink: #ee90cb;                /* multiplier x5 */
  --accent-purple: #8465ec;              /* x5 gradient endpoint */
}
```

### Shadows (apply as box-shadow or simulated drop)

```css
--shadow-lg: 0 4px 8px rgba(0,0,0,0.65), inset 0 0 0 1px var(--surface-line);
--glow-primary: 0 0 0 2px rgba(171,221,100,0.25), 0 0 16px rgba(171,221,100,0.35);
--button-shadow-default: 0 4px 0 0 var(--primary-dark), 0 0 16px rgba(171,221,100,0.3);
--button-shadow-secondary: 0 4px 0 0 var(--foreground-muted);
--button-shadow-destructive: 0 4px 0 0 rgba(0,0,0,0.4);
```

### Fonts

| Token | Family | Use |
|---|---|---|
| `--font-pixel` | **Pixelify Sans** | Headings, button labels, score numbers, key caps |
| `--font-mono` | **JetBrains Mono** | Body text, labels, captions |
| `--font-lcd` | **VT323** | (rarely used) LCD-style numerics |

All three are free fonts — import the `.ttf` files into Unity as Font Assets (TextMeshPro). Set fallback chain in USS / Font Asset Fallbacks.

### Spacing

Tailwind defaults — `gap-1` = 4px, `gap-2` = 8px, `gap-3` = 12px, `gap-4` = 16px, `gap-6` = 24px, etc.

Card padding: typically `p-3` (12px) or `p-4` (16px). Card border radius: `rounded-sm` (4px) — sharp pixel-art feel, no soft rounding.

---

## 4. Shared Primitives

### 4.1 Button

The arcade-style press-down button. Every menu uses this. Build it as a UI Toolkit `Button` subclass or a uGUI prefab.

**Variants (pick one per instance):**

| Variant | Background | Border | Text color | Shadow |
|---|---|---|---|---|
| `default` (primary) | `--primary` | 2px solid `--primary-dark` | `--primary-foreground` | `--button-shadow-default` |
| `secondary` | `--foreground` (#fff) | 2px solid `--foreground-muted` | `--background` (dark) | `--button-shadow-secondary` |
| `destructive` | `--destructive` | 2px solid `--destructive` | white | `--button-shadow-destructive` |
| `outline` | `--surface` | 1px solid `--surface-line` | `--foreground` | none |
| `ghost` | transparent | none | `--foreground-dim` (`--foreground` on hover) | none |
| `link` | transparent | none | `--primary` (underline on hover) | none |

**Sizes:**

| Size | Height | Padding-X | Font size |
|---|---|---|---|
| `default` | 44 px | 24 px | 16 px (text-base) |
| `sm` | 36 px | 16 px | 14 px (text-sm) |
| `lg` | 48 px | 32 px | 18 px (text-lg) |
| `icon` | 40 px | (square 40×40) | — |

**Layout inside the button:** flex row, items centered, gap of 8 px (`gap-2`). Icon optional, always 16 px (24 px for larger sizes). Icons come from `lucide-react` in the original — find the same icons in a Lucide Unity package or pre-render them as 16×16 white SVGs/PNGs.

**Press animation:**
- On active/press: `transform: translateY(3px)`, `box-shadow: none`. This makes the button visually "depress" into its shadow.
- Restore on release. Duration: instant (no easing). The visual effect is the whole point — keep the animation snappy.

**Hover:** background brightens slightly (e.g., primary → primary-light at 80% opacity), cursor pointer.

**Disabled:** opacity 50%, pointer-events none.

**Tooltip (optional):** wrap with the Tooltip primitive (§4.3). Used on HUD icon buttons.

### 4.2 PixelBezel

Card with retro corner brackets. Used for goal boxes, slider rows, mission cards, score tables.

**Anatomy:**

- A rectangular container with:
  - Background: `--surface` (or `--surface-raised` for nested cards)
  - Border: 1 px solid `--surface-line`
  - Shadow: `--shadow-lg`
  - Optional glow when `glow={true}`: add `--glow-primary` to the box-shadow
  - Border radius: 0 (sharp) or `rounded-sm` (4 px) — sharp preferred
- **Four SVG corner brackets** absolutely positioned at the corners, each overhanging slightly (offset by -1 px from the card edge).

**Each corner bracket:**
- SVG, 12 × 12 px
- Two filled rectangles forming an L:
  - **Top-left:** horizontal rect `(x=0, y=0, w=12, h=3)` + vertical rect `(x=0, y=0, w=3, h=12)`
  - **Top-right:** horizontal `(x=0, y=0, w=12, h=3)` + vertical `(x=9, y=0, w=3, h=12)`
  - **Bottom-left:** horizontal `(x=0, y=9, w=12, h=3)` + vertical `(x=0, y=0, w=3, h=12)`
  - **Bottom-right:** horizontal `(x=0, y=9, w=12, h=3)` + vertical `(x=9, y=0, w=3, h=12)`
- Fill color: `accent` prop (defaults to `--primary`)
- Pixel-perfect rendering — `shape-rendering: crispEdges` in SVG; in Unity, use a sprite or render at exact pixel resolution.

Unity implementation: pre-render the four corner sprites as 12×12 PNGs (one per corner), or use a 9-slice sprite for the whole card with corners baked in.

### 4.3 Tooltip

Wraps a trigger element; shows a small text bubble on hover.

- **Trigger:** any element (typically a HUD icon button).
- **Content:**
  - Background: dark (`--surface`), `rounded-md` (6 px), 1 px border `--surface-line`
  - Padding: 6 px × 12 px (`py-1.5 px-3`)
  - Text: 14 px (`text-sm`), `--foreground`
  - z-index: 1000 (above everything)
- **Animation:** fade-in + zoom-in (subtle, ~150 ms) on show; fade-out + zoom-out on hide. Slide-in from opposite of placement direction (e.g., bottom-anchored tooltip slides from top).

Used in: HUD pause/fullscreen buttons.

### 4.4 Kbd (Keyboard Key Display)

Small visual representation of a keyboard key. Used in Controls menu and Tutorial Overlay (MOVEMENTS mission).

- **Container:** inline-block, font-mono
- **Padding:** 4 px × 8 px (`px-2 py-1`)
- **Background:** `--surface-raised` (inactive) or `--primary` (active/pressed)
- **Border:** 1 px solid `--surface-line` (inactive) or `--primary` (active)
- **Bottom border:** 3 px thick (creates a beveled / chiseled feel — the key looks 3D)
- **Border radius:** `rounded-sm` (4 px)
- **Text:** font-pixel, 14 px (`text-sm`), tracking-wide, centered
- **Min-width:** 30 px (single key) or 42 px (wide keys: SPACE, SHIFT)
- **Color:** `--foreground` inactive, `--primary-foreground` (dark) when active

**Active state** (used in tutorial when the player is currently holding the key): switches to primary background with dark text. Transitions: `transition-colors duration-150`.

---

## 5. Menu Screens

Each section below describes one screen exhaustively: when it shows, what's in it, what data it pulls from state, and what each interaction does. All Norwegian text is verbatim — keep it as-is unless localizing.

---

### 5.1 Start Menu

**Shows when:** `GameState = MENU`, `MenuType = START`. Initial post-loading screen.

**Layout:**
- Full-screen centered (flex column, center, full height).
- Content container: 50% of canvas width (~400 px on 800 px canvas).

**Content (top to bottom):**

1. **Title block**
   - Two-line title in `font-pixel` at 60 px (text-6xl), zero margin between lines:
     - Line 1: `SIGURD` — color `--foreground` (white), text-shadow `3px 1px 0 var(--primary-dark)` (lime drop)
     - Line 2: `STARTUP` — color `--primary` (lime), same shadow
   - Optional `.flicker` animation class (subtle pulsing brightness; replicate with a USS animation or an Animator on the text element).
   - Subtitle (8 px below title): `Samle så mye finansiering som mulig!` — font-mono, 14 px (`text-sm`), color `--foreground-dim`.
   - **Balance row** (8 px below subtitle, only shown if `hasBridge && balance != null`):
     - Lightbulb icon (16 px, color `--primary`)
     - Text: `{balance} forretningsidé(er)` — font-mono, 12 px (`text-xs`), color `--foreground-dim`

2. **Button stack** (vertical, `gap-3` = 12 px between buttons, each button is full-width):

   | # | Variant | Icon | Label | Disabled when | onClick |
   |---|---|---|---|---|---|
   | 1 | default | Play (20 px) | `Spill` (or `Kjøp IDÉER` if `insufficientFunds && hasBridge`, or `Venter...` if `isDeducting`, or `Press Start` if no bridge) | `isDeducting` | `startGame()` — if bridge: await `deductCredits(1)`; if success, fire `gameStateManager.startNewGame()`. If insufficient funds, call `openPurchasePage()` instead. |
   | 2 | secondary | Settings (20 px) | `Innstillinger` | — | `gameStateManager.openSettings()` |
   | 3 | secondary | Joystick (20 px) | `Kontroller` | — | `gameStateManager.openControls()` |
   | 4 | secondary | Box (20 px) | `Sandkassa` | — | `gameStateManager.openTutorialSelect()` |

3. **Footer**
   - 32 px below button stack
   - Text: `Sigurd Startup {VERSION_STRING}` — font-mono, 10 px, color `--foreground-dim`, letter-spacing wide

**Bridge data pulled:** `balance`, `hasBridge`, `isDeducting` (local during deduction), `insufficientFunds`.

---

### 5.2 Pause Menu

**Shows when:** `GameState = PAUSED`, `MenuType = PAUSE`. Triggered by `P` key or HUD pause button during PLAYING.

**Layout:** identical to Start Menu — 50% width, vertical center.

**Content:**

1. **Header**
   - Title: `PAUSE` — font-pixel, 48 px (`text-5xl`), color `--foreground`, letter-spacing wide
   - Subtitle: `Trykk P for å fortsette` — font-mono, 14 px, color `--foreground-dim`, margin-top 8 px

2. **Button stack:**

   | # | Variant | Icon | Label | Disabled when | onClick |
   |---|---|---|---|---|---|
   | 1 | default | Play (20 px) | `Fortsett` | — | `gameStateManager.resumeGame()` |
   | 2 | secondary | Settings (20 px) | `Innstillinger` | — | `gameStateManager.openSettings()` |
   | 3 | secondary | RotateCcw (20 px) | `Start på nytt (1 forretningsidé)` if bridge else `Start på nytt`. Show `Kjøp FORRETNINGSIDÉER` if `insufficientFunds && hasBridge`. Show `Venter...` if `isDeducting`. | `isDeducting` | Restart: await `deductCredits(1)`, then `gameStateManager.restartGame()`. Insufficient → `openPurchasePage()`. |
   | 4 | (plain text button) | — | `Avslutt til hovedmeny` | — | `gameStateManager.quitToMenu()` |

3. **Quit link** styling (not a Button — a plain link):
   - Full-width centered
   - Text: 14 px font-mono, color `--foreground-dim`, underline with offset, hover color `--primary`.

**Keyboard:** `P` resumes (handled at the input layer, not the menu).

---

### 5.3 Settings Menu

**Shows when:** `MenuType = SETTINGS`. Nested from Start or Pause.

**Layout:**
- Centered, 80% canvas width.
- Vertical flex column.

**Content:**

1. **Header row** (flex, items centered, gap 12 px):
   - Back button: `outline` variant, `icon` size, ArrowLeft icon (20 px). On click: save changes if dirty, then `gameStateManager.closeNestedMenu()`.
   - Title: `Innstillinger` — font-pixel, 24 px (`text-2xl`), uppercase, letter-spacing wide

2. **Three volume sliders, each in its own PixelBezel** (vertical stack, `space-y-2` = 8 px between):

   Each slider row:
   - PixelBezel card, padding 16 px
   - **Top row** (flex, space-between):
     - Left: label (font-mono, 14 px, color `--foreground-muted`):
       - Master: `Master volum`
       - Music: `Musikk volum`
       - SFX: `Lyd effekter`
     - Right: **mute toggle button** (clickable):
       - When **muted**: background `--destructive`, text "MUTED" (font-pixel, 14 px)
       - When **active**: background `--surface-raised`, text `{volume}%` (font-pixel, 14 px)
       - Border 1 px matching background, padding 4 × 12 px, `rounded-sm`
       - onClick: toggle `masterMuted` / `musicMuted` / `sfxMuted`
   - **Slider** (full-width range input):
     - Min 0, Max 100, Step 1
     - Track: `--surface`, thumb: `--primary`
     - Value: `masterMuted ? 0 : masterVolume` (visual feedback: shows 0 while muted)
     - Disabled when muted
     - onChange: update audio settings store

3. **Info text** (centered, 12 px font-mono, color `--foreground-dim`):
   - `Trykk på tallene for å mute lyd`

4. **Action buttons** (horizontal flex, `gap-3`, both `flex-1` to share width):
   - **Reset** — `secondary` variant. Label `Tilbakestill`. On click: reset audio settings to defaults.
   - **Save** — `default` variant. Label `Oppdater lyd` (or `Oppdaterer...` with spinner when `isUpdating`). Disabled when `!hasChanges || isUpdating`. On click: call bridge `sendAudioSettings(...)`, set `isUpdating = true` for 800 ms.

**Default volumes:** Master 80%, Music 70%, SFX 90%. All mute flags false.

**Bridge call:** `sendAudioSettings({ masterVolume, musicVolume, sfxVolume, masterMuted, musicMuted, sfxMuted })`.

---

### 5.4 Controls Menu

**Shows when:** `MenuType = CONTROLS`. Nested from Start.

**Layout:**
- Centered, 80% canvas width.
- Vertical flex column.

**Content:**

1. **Header** (same pattern as Settings):
   - Back button (outline, icon, ArrowLeft)
   - Title: `Kontroller` — font-pixel, 24 px, uppercase

2. **Controls grid** — 2 columns, gap 12 px, full-width:

   Each cell is a **PixelBezel** card containing:
   - **Description** (top, centered, font-mono, 14 px, color `--foreground`, margin-bottom)
   - **Key display row** (flex, items centered, gap 12 px):
     - Primary key(s) as Kbd component(s)
     - Separator: `eller` (Norwegian "or") — font-mono, 9 px, color `--foreground-dim` — only if alternate keys present
     - Alternate key(s) as Kbd component(s)

   **The 5 cells:**

   | # | Description | Primary keys | Alt keys |
   |---|---|---|---|
   | 1 | `Beveg deg sidelengs` | `←` `→` | `A` `D` |
   | 2 | `Hopp` | `↑` | `W` |
   | 3 | `Flytemodus (Hold)` | `SPACE` | — |
   | 4 | `Super hopp` | `↑` `+` `SHIFT` | `W` `+` `SHIFT` |
   | 5 | `Rask fall` | `↓` | `S` |

Display-only — no interactive elements other than the back button. Keys are rendered using the Kbd primitive (§4.4) — `+` separators are plain text between Kbd elements.

---

### 5.5 Countdown Overlay

**Shows when:** `GameState = COUNTDOWN`, `MenuType = COUNTDOWN`. Plays before PLAYING begins (initial start or after resume from pause).

**Layout:** centered text only, fully transparent background. Game world is visible behind.

**Content:**

1. **Countdown number** — single large digit:
   - Initial value: 3
   - Decrements every 1000 ms: 3 → 2 → 1 → 0
   - When 0 is reached, the overlay disappears (and state transitions to PLAYING).
   - Styling: font-pixel, 128 px (`text-8xl`), color `--primary`, text-shadow `0 0 24px rgba(171,221,100,0.4)` (green glow)

2. **Level name** (below countdown, flex row, gap 12 px, items centered):
   - **Pulse dot** (left): 8 × 8 px circle, background `--primary`, `animate-pulse` (continuous fade in/out)
   - **Level name text**: pulled from `currentMap.name` (e.g., `garasjen`, `INNOVASJON NORGE`). font-pixel, 36 px (`text-4xl`), color `--foreground`, capitalize, letter-spacing wide, text-shadow `0 0 16px rgba(171,221,100,0.45)`.
   - **Pulse dot** (right): mirror of left

**Animation:**
- Countdown numbers cleanly swap (no animation per number; they just change).
- Pulse dots pulse continuously.

**Dev mode bypass:** if dev-mode is enabled, the countdown is skipped entirely (zero-duration). In normal mode, the full 3-second countdown plays.

---

### 5.6 Bonus Screen

**Shows when:** `GameState = BONUS`, `MenuType = BONUS`. After MAP_CLEARED completes its 5-second Victory.wav hold.

**Layout:** centered, full canvas width, text-aligned center.

**Content:**

1. **Completion heading** (font-pixel, 48 px, letter-spacing wide, whitespace nowrap):
   - Text: `{currentMap.name} FULLFØRT` (e.g., `INNOVASJON NORGE FULLFØRT`)
   - The map name uses default foreground color. The word `FULLFØRT` is colored `--primary`.
   - Text-shadow: `3px 1px 0 var(--primary-dark)`
   - Apply the `.flicker` animation if you implemented one.

2. **Flavor fact** (italic, small, color `--foreground-dim`):
   - A randomly selected fact from a `byrokratiData.facts[]` array (Norwegian-language jokes about bureaucracy). Pick one when the screen mounts and hold it.

3. **Bonus section** (only shown if `bonusPoints > 0`):
   - **Founding count** (font-pixel, 20 px, color `--foreground-muted`):
     - `Du samlet {correctOrderCount} av 23 finansieringer!` — the number is colored `--primary`.
   - **Animated bonus counter** (font-pixel, 48 px, color `--primary`, `animate-pulse`):
     - Starts at 0 after a 200 ms delay
     - Eases up to `bonusPoints` over **6000 ms** with a "gentle ease-out" easing curve
     - 120 steps (so ~50 ms per increment)
     - Format: `{value.toLocaleString()} kr` (e.g., `12,540 kr`)
     - Text-shadow: `0 0 12px rgba(171,221,100,0.5)`
   - **Next level hint** (font-mono, 14 px, color `--foreground-dim`, only if not last level and not dev mode):
     - `Fortsetter til {nextLevelName}...`

**Auto-transition:** when the counter animation completes, set `bonusAnimationComplete = true`. After an additional 2000 ms delay (handled by the state machine), transition to COUNTDOWN for the next level (or VICTORY if last).

**Keyboard:** none — auto-transition only.

---

### 5.7 Game Over Screen

**Shows when:** `GameState = GAME_OVER`, `MenuType = GAME_OVER`. Last life lost.

**Layout:** centered, max-width ~672 px (`max-w-2xl`), text-aligned center.

**Content:**

1. **Header:**
   - Title: `KAPITALEN TØRKET UT` — font-pixel, ~28 px (`text-3xl`), color `--foreground`, letter-spacing wide
   - Subtitle: a random flavor message from `gameOverData.gameOverMessages[]` (Norwegian-language sympathy/jokes). Italic, color `--foreground-dim`.

2. **Level results table** (only if `levelResults.length > 0`), in a **PixelBezel** card:
   - Padding 0 (table fills the card), bottom margin 24 px.
   - **Header row** (border-bottom, color `--primary`, 12 px text, letter-spacing widest):
     - Col 1: ✓ icon (Check)
     - Col 2: `Bane` (level name)
     - Col 3: `Finansiering` (right-aligned, score)
     - Col 4: `Bonus` (right-aligned, bonus)
   - **Body rows** (one per completed level):
     - Col 1: small checkbox indicator:
       - If completed (not partial): square 16 × 16, background `--primary`, border `--primary-dark`, white check icon (12 px) centered
       - If partial (died mid-level): square 16 × 16, background `--destructive`, white X icon centered
     - Col 2: `{capitalize(mapName)} (Nivå {level})` — font-mono
     - Col 3: `{score.toLocaleString()} kr` — font-pixel, right-aligned, tabular numerics
     - Col 4: if `bonus > 0`: `{bonus.toLocaleString()} kr` in color `--coin-yellow`, semibold. Else `-` in `--foreground-dim`.
     - Row separator: bottom border `--surface-line` at 30% opacity (dashed acceptable)
   - **Footer row** (top border 2 px solid `--primary`):
     - Cols 1-2: `TOTAL` — font-pixel, color `--primary`, letter-spacing wide
     - Cols 3-4 combined: `{totalFinancing + totalBonus} kr` — font-pixel, 20 px (`text-xl`), tabular numerics, right-aligned

3. **Save indicator** (only while `isSaving`):
   - Spinner icon (Loader2, 16 px, spinning)
   - Text: `Lagrer spillet...` — font-mono, 14 px, color `--foreground-dim`

4. **Button row** (flex, gap 12 px, flex-wrap, justify-center):

   | # | Variant | Icon | Label | Disabled when | onClick |
   |---|---|---|---|---|---|
   | 1 | default | — | `Prøv igjen` (or `Kjøp IDÉER` if `insufficientFunds && hasBridge`, or `Venter...` if `isDeducting`) | `isSaving || isDeducting` | Restart: await `deductCredits(1)`, then `gameStateManager.restartGame()` |
   | 2 | secondary | Trophy (18 px) | `Toppliste` | — | `openLeaderboard()` (bridge call) |

**Bridge calls:**
- `waitForGameSaveConfirmation()` async (sets `isSaving` true → false)
- `deductCredits(1)` on retry
- `openPurchase()` on insufficient funds
- `openLeaderboard()` on Trophy button

**Important — fullscreen handoff:** `openLeaderboard()` and `openPurchase()` must **exit fullscreen first** before navigating away. The host page can't display behind fullscreen.

---

### 5.8 Victory Menu

**Shows when:** `GameState = VICTORY`, `MenuType = VICTORY`. All 9 levels beaten.

**Layout:** identical to Game Over Screen.

**Content:**

1. **Header:**
   - Title: `UNICORN FOUNDER!` — font-pixel, ~28 px (`text-3xl`), color `--primary`, letter-spacing wide
   - Subtitle: `Du har bygget en billion-dollar idé` — font-mono, 12 px, color `--foreground-dim`

2. **Results table** (same PixelBezel pattern, slightly tighter padding — `py-1` per row instead of default):
   - Header columns: `Bane`, `Finansiering` (right), `Bonus` (right)
   - Body rows: Check icon + map name + score + bonus
   - Footer:
     - Row 1: `TOTALT` (left) | total financing (right, color `--primary`)
     - Row 2: total bonus (right, color `--coin-yellow` if > 0)
     - Row 3: `TOTAL FINANSIERING` (left) | grand total (right, color `--foreground`, 18 px / `text-lg`)

3. **Save indicator** (same as Game Over).

4. **Buttons:**

   | # | Variant | Label | onClick |
   |---|---|---|---|
   | 1 | default | `Spill igjen` (with monetization variants) | Restart with deduction |
   | 2 | secondary | `Toppliste` (Trophy icon) | `openLeaderboard()` |

Behavior identical to Game Over — only header text and slight footer-layout differs.

---

### 5.9 Loading Menu

**Shows when:** game start, before any other UI. Replaces everything until assets are loaded.

**Layout:**
- Centered, max-width 512 px (`max-w-lg`).
- Vertical flex column, padding 32 px.

**Content:**

1. **Header:**
   - Title: `SIGURD STARTUP` — font-pixel, 36 px (`text-4xl`), color `--foreground`, letter-spacing wide, margin-bottom 32 px.
   - Subtitle: `Frobotereder din gründerreise` — font-mono, 14 px, color `--foreground-dim`.

2. **Progress spinner** (centered):
   - **Normal state:**
     - Outer ring: 96 × 96 px (Tailwind `w-24 h-24`), border 4 px, color `--primary/20` (20% opacity lime)
     - Spinning border: same size, border 4 px, only top edge colored `--primary`, `animate-spin` (continuous rotation, 1 second period)
     - Inner pulsing circle (inset 16 px): rounded full, background `--primary/20`, `animate-pulse`
     - Center percentage text: font-pixel, 18 px (`text-lg`), color `--foreground`, tabular numerics, e.g., `42%`
   - **Error state:**
     - 96 × 96 px rounded full, background `--destructive/20`
     - Filled circle with X icon centered, 48 px (`w-12 h-12`), color `--destructive`

3. **Progress bar** (horizontal, full container width, ~24 px below spinner):
   - Track: height 6 px (`h-1.5`), background `--surface`, 1 px border `--surface-line`, `rounded-sm`, overflow hidden.
   - Fill width: `{progress}%` (0–100)
   - Fill color depends on progress:
     - Error: `--destructive`
     - 100%: `--primary`
     - 67–99%: `--primary-light`
     - 34–66%: `--primary`
     - 1–33%: `--primary-dark`
   - Transition: `transition-all duration-300 ease-out`

4. **Status text** (centered, below progress bar):
   - **Main message** (font-mono, 16 px, color `--foreground`):
     - `{progress.currentMessage}` + animated dots (cycle through `.`, `..`, `...` every 500 ms while loading)
   - **Step description** (font-mono, 14 px, color `--foreground-dim`, margin-top 4 px, only if step is in progress and no error):
     - Map step ID → description (Norwegian):
       - `host-communication` → `Etablerer frobotindelse`
       - `background-images` → `Klargjør spillverdener`
       - `player-sprites` → `Vekker Sigurd til live`
       - `monster-sprites` → `Frobotereder utfordringer`
       - `ui-sprites` → `Bygger grensesnitt`
       - `audio-files` → `Tuner inn lydlandskap`
       - `map-data` → `Kartlegger reisen`
       - `finalization` → `Siste froboteredelser`
       - `complete` → `Alt klart!`

5. **Error display** (only if `error`):
   - Padded card: 16 px padding, background `--destructive/10`, border `--destructive/30`, `rounded-sm`, margin-top 16 px.
   - Error message (color `--destructive`, 14 px font-mono): `Feilmelding: {error}`
   - Reload button (destructive bg, white text, font-pixel, arcade-press style): label `LAST PÅ NYTT`. On click: reload the application.

---

### 5.10 In-Game HUD

**Shows when:** `GameState = PLAYING` or `PAUSED` (always present during gameplay; menus overlay on top). `MenuType = IN_GAME`.

This is the most complex single UI element. It's the persistent top bar.

**Layout:**
- Full canvas width
- Horizontal flex row, items centered, gap 12 px, padding 12 px × 6 px
- Background `--background-deep`, border-bottom 1 px `--surface-line`, top-rounded corners (`rounded-t-lg`)
- Min height 40 px

**Content (left to right):**

1. **Balance section** (only if `hasBridge && balance != null`):
   - Lightbulb icon (12 px, color `--primary`)
   - Balance number (font-mono, 12 px, color `--foreground`, tabular numerics)
   - Vertical divider after: 1 × 20 px, color `--surface-line`

2. **Tutorial vs. regular HUD branch:**

   **If `tutorialMission != null`:** render the Tutorial HUD (§5.14) here instead of the regular content. The Tutorial HUD takes the full remaining width.

   **Else (regular):**
   
   **Left cluster:**
   - `Lvl {currentLevel}` — uppercase, font-mono, 12 px, color `--foreground-dim`, letter-spacing wide
   - Divider (1 × 20 px, `--surface-line`)
   - **Animated score** (font, 14 px / `text-sm`, tabular numerics, min-width 90 px):
     - Color when animating: `--primary-light` + text-shadow `0 0 8px rgba(171,221,100,0.5)`
     - Color when idle: `--primary`
     - Score smoothly eases to new value using an animation factor of 0.14 (i.e., each frame, animatedScore += (target - animatedScore) * 0.14)
     - Format: `{value.toLocaleString()}` (e.g., `1,234,567`)

   **Centered cluster** (absolutely positioned, centered on the HUD center):
   - **Lives display:**
     - Flex row, gap 4 px
     - Renders up to 3 coffee cup icons (20 × 20 px, pixelated rendering)
     - If `lives > 3`, append `+{lives - 3}` in font-pixel, 12 px, color `--accent-pink`
   - Divider (1 × 20 px, `--surface-line`)
   - **Multiplier display:**
     - Text `x{multiplier}{isMax ? ' MAX' : ''}` (e.g., `x3`, `x5 MAX`) — font-pixel, 14 px, color `--foreground`, tabular numerics
     - Text-shadow color depends on multiplier (see `MULT_GLOW` map below)
   - **B-coin progress bar** (160 × 12 px, `rounded-full`, overflow hidden, 80% opacity):
     - Track: background `--surface`, 1 px border `--surface-line`
     - Fill: 0–100% based on `(foundingAndMonsterPoints % BONUS_COIN_SPAWN_INTERVAL) / BONUS_COIN_SPAWN_INTERVAL`
     - Fill gradient depends on multiplier tier (see `MULT_GRADIENT` below)
     - Inner shadow + glow: `box-shadow: 0 0 8px {multGlow}, inset 0 1px 0 rgba(255,255,255,0.2)`
     - Transition: `transition-all duration-500 ease-out`

   **Right cluster** — `flex-1` spacer pushes the action buttons to the far right.

3. **Action buttons** (flex, gap 4 px):
   - **Play/Pause toggle** (only during PLAYING/PAUSED): ghost variant, icon size (28 × 28 px), color `--foreground-dim` (hover `--primary`).
     - Icon: `Play` if paused, `Pause` if playing (15 px)
     - Tooltip: `Resume (P)` or `Pause (P)`
     - onClick: `pauseGame()` or `resumeGame()`
   - **Fullscreen toggle** (always present): ghost icon button, same sizing.
     - Icon: `Minimize` if fullscreen, `Maximize` otherwise
     - Tooltip: `Exit fullscreen (F)` or `Fullscreen (F)`
     - onClick: toggle fullscreen on the game canvas / root

**Multiplier glow / gradient tables:**

```
multGlow[1] = rgba(171,221,100,0.35)    // lime
multGlow[2] = rgba(34,211,238,0.35)     // cyan
multGlow[3] = rgba(234,179,8,0.40)      // yellow
multGlow[4] = rgba(242,174,153,0.40)    // peach
multGlow[5] = rgba(238,144,203,0.45)    // pink

multGradient[1] = linear-gradient(90deg, #7fb33d, #abdd64, #c2eb83)         // green
multGradient[2] = linear-gradient(90deg, #0e9fb8, #22d3ee, #67e8f9)         // cyan
multGradient[3] = linear-gradient(90deg, #ca8a04, #eab308, #fde047)         // yellow
multGradient[4] = linear-gradient(90deg, #e8856e, #f2ae99, #fcd5c8)         // peach
multGradient[5] = linear-gradient(90deg, #d56aaf, #ee90cb, #8465ec)         // pink → purple
```

---

### 5.11 Tutorial Select Menu

**Shows when:** `MenuType = TUTORIAL_SELECT`. From Start menu.

**Layout:**
- Centered, max-width 672 px (`max-w-2xl`), padding 16 px × 24 px.
- Vertical flex column.

**Content:**

1. **Header** (flex row, gap 12 px, items centered):
   - Box icon (28 px, color `--primary`)
   - Title: `Sandkassa` — font-pixel, 28 px (`text-3xl`), color `--foreground`, letter-spacing wide

2. **Mission grid** (2 columns, gap 12 px, full width, margin-bottom 24 px):
   - For each of 4 missions in display order:
     - **Card** (button element, left-aligned text):
       - Background `--surface`, hover `--surface-raised`
       - 2 px border `--surface-line`
       - `rounded-sm`, padding 16 px
       - Transition: `transition-colors`
       - Cursor pointer
     - **Inside the card** (vertical layout):
       - `Oppdrag {idx + 1}` (idx is 0-based) — font-mono, 12 px, color `--foreground-dim`, margin-bottom
       - `{mission.title}` — font-pixel, 16 px, color `--foreground`, letter-spacing wider, margin-bottom
       - `{mission.description}` — font-mono, 12 px, color `--foreground-dim`, line-height snug
     - On click: `gameStateManager.openTutorialBrief(missionId)`

3. **Back button** (secondary, uppercase, text-sm, with ArrowLeft 16 px icon):
   - Label: `Tilbake`
   - onClick: `gameStateManager.quitToMenu()`

**Mission data** — four missions in fixed order:

| idx | id | title | description |
|---|---|---|---|
| 0 | `MOVEMENTS` | `Bevegelse 101` | (Norwegian flavor describing moving controls) |
| 1 | `FOUNDINGS` | `Finansieringer` | (text about collecting in order) |
| 2 | `SURVIVE` | `Overlev byråkratiet` | (text about surviving) |
| 3 | `KILL` | `Politisk Ryggvind` | (text about P-coin and killing bureaucrats) |

(Get the exact description strings from `src/tutorials/missions.ts` if porting verbatim.)

---

### 5.12 Mission Brief

**Shows when:** `MenuType = TUTORIAL_BRIEF`. From Tutorial Select.

**Layout:**
- Centered, max-width 512 px (`max-w-lg`), padding 24 px × 16 px, text-aligned center.

**Content:**

1. **Mission progress label** (top, 10 px font-mono, color `--foreground-dim`, uppercase, letter-spacing widest, margin-bottom 8 px):
   - `Oppdrag {idx + 1} av {TUTORIAL_MISSION_ORDER.length}` (e.g., `Oppdrag 2 av 4`)

2. **Mission title** (font-pixel, 28 px / `text-3xl`, color `--foreground`, letter-spacing wide, margin-bottom 20 px):
   - `{mission.title}`

3. **Goal box** — **PixelBezel** card (padding 16 px × 12 px):
   - Background `--surface-raised`, 2 px border `--surface-line`, drop-shadow `0 3px 0 0 rgba(0,0,0,0.3)` (3D effect).
   - **Top row** (icon + label):
     - Target icon (12 px, color `--primary`)
     - Label `MÅL` — font-mono, 10 px, color `--primary`, uppercase, letter-spacing widest
   - **Goal text** (below):
     - `{mission.goal}` — font-pixel, 14 px, color `--foreground`, line-height snug, letter-spacing wide

4. **Description text** (font-mono, 12 px, color `--foreground-dim`, italic, line-height relaxed, max-width 340 px, margin-bottom 24 px):
   - `{mission.description}`

5. **Button row** (flex, gap 12 px, centered):
   - **Back** — secondary, uppercase, text-sm, ArrowLeft icon (16 px). Label `Tilbake`. onClick: `openTutorialSelect()`.
   - **Start** — default, uppercase, text-sm, Play icon (16 px). Label `Start`. onClick: `startTutorialMission(pending)`.

---

### 5.13 Mission Complete

**Shows when:** `MenuType = TUTORIAL_RESULT`. After a tutorial mission ends (complete or skipped).

**Layout:**
- Centered, max-width 448 px (`max-w-md`), padding 24 px × 24 px, text-aligned center.

**Content:**

1. **Mission title** (font-pixel, 28 px, color `--foreground`, letter-spacing wide, margin-bottom 4 px, leading tight):
   - `{mission.title}`

2. **Status label** (font-pixel, uppercase, letter-spacing wide):
   - If `reason === 'complete'`: `Fullført!` (color `--primary`)
   - Else (skipped): `Hoppet over` (color `--foreground-dim`)

3. **Flavor message** (font-mono, 12 px, color `--foreground-dim`, italic, max-width 320 px, margin-bottom 16 px):
   - Mission-specific message chosen by `flavorFor(reason, missionId, stats)`. Examples:
     - MOVEMENTS complete: `Du beveger deg som en konsulent på timepris.`
     - FOUNDINGS complete: `Skattefunn-godkjent — eller i det minste innsendt.`
     - SURVIVE complete: `Byråkratene stoppet for kaffepause. Lykke til neste gang.`
     - KILL complete: `{stats.ryggvind} gikk ut. Tilbake til søknadsskjemaet.`
     - Skipped (any): `Greit. Du gjør det på din måte.`

4. **Stats table** (only if `stats && Object.keys(stats).length > 0`):
   - Vertical flex, gap 6 px, font-mono, 14 px (`text-sm`), max-width 260 px.
   - Each row: flex, space-between, gap 24 px, padding-y 4 px.
   - Row separator: bottom-border dashed `--surface-line` (except last row).
   - Left: label (uppercase, 12 px, color `--foreground-dim`, letter-spacing wide).
   - Right: value (color `--foreground`).

5. **Button row** (flex, gap 12 px, margin-top 20 px, wrap, centered):
   - **Previous** — secondary, uppercase, text-sm, ArrowLeft. Label `Tilbake`. Disabled if `idx === 0`. onClick: `goToPreviousTutorialMission()`.
   - **Next** — default, uppercase, text-sm, ArrowRight (16 px). Label `Neste`. Disabled if last mission. onClick: `goToNextTutorialMission()`.
   - **Home** — secondary, uppercase, text-sm, Home (16 px). Label `Hovedmeny`. onClick: `quitToMenu()`.

---

### 5.14 Tutorial HUD

**Shows when:** `GameState = PLAYING` or `PAUSED` AND `tutorialMission != null`. Renders inside the regular HUD position (replaces the score / multiplier section).

**Layout:**
- Horizontal flex, items centered, gap 12 px, full width.

**Content:**

1. **Mission number** (12 px, font-mono, color `--foreground-dim`, uppercase, letter-spacing wide):
   - `Oppdrag {idx + 1}`

2. **Divider** (1 × 20 px, `--surface-line`)

3. **Mission title** (font-pixel, 14 px / `text-sm`, color `--foreground`, letter-spacing wider, truncate with ellipsis):
   - `{mission.title}`

4. **Skip link** (margin-left auto so it floats right):
   - Plain link styling — 12 px, font-mono, color `--foreground-dim`, underline (offset 2 px), hover color `--primary`.
   - Label: `Hopp over`
   - onClick: `skipTutorialMission()` — exits the mission with `reason = 'skipped'`.

---

### 5.15 Tutorial Overlay

**Shows when:** `GameState = PLAYING` AND `tutorialMission != null`. Top-right corner of game canvas.

**Layout:**
- Absolutely positioned: top 12 px, right 12 px (`top-3 right-3`), z-index 30
- Card: background `--surface` (50% opacity over backdrop blur if desired), `rounded-sm`, padding 16 px × 12 px
- Max-width 280 px, min-width 220 px

**Content:**

1. **Mission title** (font-pixel, 12 px, uppercase, letter-spacing wider, color `--primary`, margin-bottom 8 px, leading none):
   - `{mission.overlayTitle ?? mission.title}`

2. **Mission-specific body** (one of four variants based on `tutorialMission`):

   **A. MOVEMENTS:**
   - Vertical list of 6 sub-task rows (one per movement).
   - Each row (flex, space-between, items-center, padding-y 8 px):
     - Left: description text (font-mono, 11 px). Color depends on state:
       - **Done:** color `--primary`, line-through
       - **Pending:** color `--foreground`
       - **Upcoming** (after the next-expected one): same color, but parent row has opacity 30%
     - Right: keys + status (flex, gap 4 px):
       - One or two Kbd elements (with active highlight if currently pressed)
       - If two alternatives, separator `/` (color `--foreground-dim`, 9 px) between them
       - Trailing check icon (color `--primary`, 12 px) if done
   - Row separator: dashed `--surface-line` border-bottom (except last row).
   - **Active key tracking:** highlight the Kbd in primary color while the corresponding input is held (real-time).

   The 6 controls and their sub-task IDs (must match `PlayerManager` tracking):
   | Sub-task | Description | Keys |
   |---|---|---|
   | `moveLeft` | `Beveg deg til venstre` | ← / A |
   | `moveRight` | `Beveg deg til høyre` | → / D |
   | `jump` | `Hopp opp` | ↑ / W |
   | `superJump` | `Super hopp` | ↑ + SHIFT / W + SHIFT |
   | `float` | `Flyt i lufta` (held 250 ms airborne) | SPACE |
   | `fastFall` | `Fall raskt ned` (held 250 ms then ground touch) | ↓ / S |

   **B. FOUNDINGS:**
   - Vertical layout, gap 8 px (`space-y-2`).
   - **Hint text** (font-mono, 11 px, color `--foreground`):
     - If `collected === 0`: `Plukk hvilken som helst finansiering`
     - Else: `Følg den blinkende finansieringen`
   - **Stats section** (top-border dashed `--surface-line`, padding-top 4 px):
     - Row 1 (font-mono, 11 px): `PLUKKET: {collected}/{total}` — label color `--foreground-dim`, count color `--foreground`
     - Row 2: `RIKTIG REKKEFØLGE: {correct}/{total}` — count color `--primary`

   **C. SURVIVE:**
   - Centered, vertical gap 4 px.
   - **Timer** (font-pixel, 30 px / `text-3xl`, color `--primary`, tabular numerics, letter-spacing wide):
     - `{seconds}s` (e.g., `29.5s`)
     - Updates every 100 ms.
     - Counts down from 30 to 0.
   - **Message** (font-mono, 10 px, color `--foreground-dim`, line-height snug):
     - `Hold deg unna byråkratene.\nLykke til.`

   **D. KILL:**
   - Vertical layout, gap 6 px.
   - **Hint** (font-mono, 10 px, color `--foreground-dim`, line-height snug, margin-bottom 4 px):
     - `Mynten skifter farge — vent på den verdifulle.`
   - **Coin rows** (one per P-coin tier; tier 0 = blue, tier 6 = gray):
     - Flex row, 11 px font-mono, padding 2 × 6 px, `rounded-sm`.
     - If this row is the currently active coin tier: background `--primary/15`, ring 1 px `--primary/60`.
     - Left: **colored dot** (10 × 10 px, rounded full, border, inline-block, color = coin tier color).
     - Middle: label (e.g., `Blå`, `Rosa`, `Lilla`, `Grønn`, `Cyan`, `Gul`, `Grå`); semibold + color `--primary` if active, else color `--foreground`.
     - Right: duration (e.g., `3.0s` to `10.0s`); color `--primary` if active, else `--foreground-dim`.

---

## 6. Animations & Transitions

| Animation | Used by | Description |
|---|---|---|
| `animate-spin` | Loading spinner, save spinner | Continuous 360° rotation, 1 s period |
| `animate-pulse` | Glow dots, bonus counter, pulsing UI | Opacity oscillation (1.0 → 0.5 → 1.0) over ~2 s |
| `.flicker` | Title text on Start / Bonus screens | Subtle brightness flicker (custom keyframes) |
| `transition-colors duration-150` | Buttons, links, kbd active state | Smooth color/bg interpolation |
| `transition-all duration-300/500 ease-out` | Progress bars, score counter | Smooth value transitions |
| `useAnimatedCounter` (Bonus) | Bonus counter | 6000 ms gentle-ease-out from 0 to target |
| `useAnimatedScore` (HUD) | HUD score | Per-frame ease toward target, factor 0.14 |

Implement easing in Unity with `Mathf.Lerp` (per-frame factor) or DOTween / LeanTween for keyframed counters.

---

## 7. Bridge Integration

Menus call into the host bridge (`IHostBridge` in Unity) for these actions. All bridge calls should be **awaited where applicable**; on failure or insufficient funds, show appropriate UI state.

| Bridge method | Called from | Purpose |
|---|---|---|
| `GetBalance()` | All money-aware menus | Show current balance in HUD / start menu |
| `DeductCredits(1)` | Start, Pause (restart), Game Over, Victory | Charge 1 credit to start/restart a run |
| `RefreshBalance()` | After deduction failures | Re-sync balance display |
| `OpenPurchase()` | Any money-aware button when `insufficientFunds` | Take user to purchase flow |
| `OpenLeaderboard()` | Game Over, Victory | Open leaderboard page |
| `SendAudioSettings({...})` | Settings menu save | Persist audio config per-user |
| `WaitForGameSaveConfirmation()` | Game Over, Victory | Block restart until save is confirmed |
| `GrantBusinessIdea(1)` | F-coin pickup (game logic, not UI) | Award real-world credit |
| `SendGameCompletion({...})` | On transition to VICTORY/GAME_OVER | Submit final score for leaderboard |

**Fullscreen handling:** before calling `OpenPurchase()` or `OpenLeaderboard()`, exit fullscreen first. In Unity, call `Screen.fullScreen = false` (or platform-specific equivalent), then dispatch the bridge call. Otherwise the host page is invisible behind the fullscreen.

**Standalone mode** (no bridge available): all bridge methods are stubbed to return success / no-op. Don't show the balance row. Don't show monetization variants on buttons. Play is free.

---

## 8. Keyboard Shortcuts Summary

These are handled at the input layer (not per-menu), but several menus respond to them:

| Key | Action | Active when |
|---|---|---|
| `P` | Pause / Resume | PLAYING (pauses) / PAUSED (resumes) |
| `F` / `F11` | Toggle fullscreen | Always |
| `Escape` | Back / close nested menu | Settings, Controls, Tutorial menus |
| `Enter` | Confirm primary action | (optional) menus with a clear primary button |
| (no shortcut) | Bonus screen auto-advances after animation | — |
| (no shortcut) | Countdown auto-advances at 0 | — |

---

## 9. Implementation Order

Build the menus in this order. Each can be ship-tested independently — wire up state hooks once, then iterate per menu.

1. **Loading Menu** (no dependencies; just shows progress) — proves the UI Toolkit pipeline.
2. **Start Menu** — adds Button + balance + bridge stub. Once Play works, you have a "fake play loop" entry.
3. **Settings Menu + Controls Menu** — nested menu pattern + PixelBezel + Kbd primitive. Pure visual; no game logic.
4. **Countdown Overlay** — first transparent overlay. Validates state-driven swap.
5. **Pause Menu** — same patterns as Start. Validates the P-key shortcut.
6. **In-Game HUD** — most complex. Score easing, multiplier glow, B-coin progress, lives. Build this last among "main game" UIs.
7. **Bonus Screen** — animated counter (validates easing utility).
8. **Game Over Screen + Victory Menu** — score history table. They share ~90% structure.
9. **Tutorial Select + Mission Brief + Mission Complete** — tutorial-only flow.
10. **Tutorial HUD + Tutorial Overlay** — the most data-bound UIs (live input feedback in MOVEMENTS, real-time timer in SURVIVE). Build last because they require Player input state to be already wired.

After step 6, you have a fully usable main-game UI. Steps 7–10 polish the secondary flows.

---

## Quick reference: every menu in one table

| Menu | When | Layout | Primary action |
|---|---|---|---|
| Start | `MENU + START` | 50% width center | Spill |
| Pause | `PAUSED + PAUSE` | 50% width center | Fortsett |
| Settings | `MENU + SETTINGS` (nested) | 80% width center | Oppdater lyd |
| Controls | `MENU + CONTROLS` (nested) | 80% width 2-col grid | (back only) |
| Countdown | `COUNTDOWN` | Centered overlay | (auto) |
| Bonus | `BONUS` | Full-width center | (auto) |
| Game Over | `GAME_OVER` | max-w-2xl center | Prøv igjen |
| Victory | `VICTORY` | max-w-2xl center | Spill igjen |
| Loading | (pre-MENU) | max-w-lg center | (auto) |
| HUD | `PLAYING / PAUSED` | Full-width top bar | (icon buttons) |
| Tutorial Select | `MENU + TUTORIAL_SELECT` | max-w-2xl center | (select card) |
| Mission Brief | `MENU + TUTORIAL_BRIEF` | max-w-lg center | Start |
| Mission Complete | `MENU + TUTORIAL_RESULT` | max-w-md center | Neste |
| Tutorial HUD | `PLAYING + tutorialMission != null` | (inside main HUD) | (skip link) |
| Tutorial Overlay | `PLAYING + tutorialMission != null` | top-right card | (read-only) |

---

## Final notes

- **Norwegian text is intentional.** Every label above is verbatim. If you want English, do a one-time localization pass — but the original ships in Norwegian.
- **The flicker effect** on the title and bonus text is small but distinctive. Implement it as a 1-second keyframe animation with random opacity dips (around 0.85–1.0).
- **The "arcade press" button feel** (`translateY(3px)` on active, shadow disappears) is the single most-felt detail of the design system. Don't skip it.
- **Pixel-art rendering:** all UI sprites (corner brackets, key caps, coin icons) need point/nearest-neighbor filtering. Set `Pixel Perfect: true` on the UI Toolkit Panel Settings or on individual `<Image>` components in uGUI.

This document plus `specs/unity-port-spec.md`, `specs/unity-sprites-spec.md`, and `exports/maps/` is sufficient for a Unity team (or LLM) to recreate the entire UI from scratch with no reference to the React source.
