# CLAUDE.md — Sigurd Startup

You are working on **Sigurd Startup**, a 2D arcade platformer shipped as an npm package and embedded in a React landing page with Stripe + Firebase. This document is the contract for how you operate in this repo. Read it every session.

---

## 1. Project overview

- **Game:** 2D arcade platformer, 800×600 fixed resolution, 60 FPS, 8 levels
- **Genre mechanics:** bomb collection in sequence + coin power-ups + monster avoidance
- **Engine:** Phaser 3 (3.80+), Arcade Physics
- **Language:** TypeScript, strict mode
- **Distribution:** published as an npm package, consumed by a separate React landing page
- **Host integration:** landing page provides `window.sigurdGame` bridge (balance, credits, Stripe, Firebase)
- **Authoritative design source:** `specs/game-spec.md` — this file is the source of truth for all mechanics, constants, timings, and behaviors

## 2. Before you write code

**Always, in this order:**

1. Read `specs/game-spec.md` (or the relevant section) before implementing any gameplay system. If the spec is ambiguous, **ask me** — do not guess.
2. Check `specs/` for a topic-specific doc (e.g., `specs/monster-ai.md`, `specs/coin-system.md`). If one exists, read it.
3. Check `DECISIONS.md` for architectural choices already made. Do not re-litigate them.
4. Propose a plan before writing code for any task that touches more than two files. Wait for approval.
5. When implementing, reference the spec section by number in commit messages (e.g., "implement coin spawn conditions per spec §7").

If you find yourself guessing at a constant, a timing, or a behavior, stop and check the spec.

## 3. Repo layout
src/
scenes/           # Phaser Scene classes — one per game state
BootScene.ts
PreloadScene.ts
GameScene.ts    # main gameplay
HudScene.ts     # overlay (score, lives, multiplier)
entities/         # game objects (Player, Bomb, Coin, Monster subclasses)
managers/         # cross-entity coordinators (BombManager, CoinManager, ScalingManager, SpawnManager, AudioManager)
systems/          # pure logic (scoring, multiplier, A* pathfinding)
data/             # map definitions, coin color cycle, monster configs
bridge/           # window.sigurdGame adapter + standalone fallback
ui/               # React components (menus, HUD overlays outside Phaser)
index.ts          # package entry point — exports <SigurdGame /> React component
specs/              # design specs (READ THESE)
DECISIONS.md        # architectural log
CLAUDE.md           # this file

- **Phaser renders the playfield only.** Menus, HUD chrome, settings, countdown, bonus screen are React components positioned over the canvas.
- **Game logic lives in managers and systems, not scenes.** Scenes orchestrate; managers own state; systems are pure functions.

## 4. Naming and style rules

- Files: `kebab-case.ts` (e.g., `chaser-monster.ts`)
- Classes: `PascalCase`
- Methods/variables: `camelCase`
- Constants: `UPPER_SNAKE_CASE`, grouped in `src/data/constants.ts`
- Event names: past tense, snake_case (`bomb_collected`, `player_died`, `power_mode_started`)
- Scene keys: PascalCase string matching class name (`'GameScene'`)
- One class per file. No default exports — always named exports.

**TypeScript:**
- `strict: true` is non-negotiable. No `any`. No `@ts-ignore` without a comment explaining why.
- Prefer `readonly` and `const` by default.
- Use discriminated unions for state (e.g., monster behavior state).
- Public APIs get JSDoc. Internals don't need it.

## 5. Architecture rules

- **Communication between managers: events only.** Use `scene.events` or a dedicated `EventBus` singleton. Never reach across managers via direct references.
- **Managers are instantiated in `GameScene.create()`** and passed the scene reference. No global singletons except `EventBus` and `BridgeAdapter`.
- **Entities do not contain business logic.** A `Bomb` knows how to render and report collisions; `BombManager` decides what collecting it means.
- **Pure systems stay pure.** Anything in `src/systems/` takes inputs, returns outputs, has no side effects. Makes them trivial to test.
- **State lives in one place per concern.** Score in `ScoreManager`, coin spawn counters in `CoinManager`, etc. No duplicated state.

## 6. Do NOT do these things without asking

- Add new npm dependencies (especially game-related libs)
- Modify `package.json` exports, the package entry point, or the build config
- Change the `window.sigurdGame` bridge contract
- Introduce a global singleton beyond what's already listed
- Change scene structure or add new top-level scenes
- Modify any value in `specs/game-spec.md` — that's a design decision, not a code decision
- Use Matter.js physics (we use Arcade Physics only)
- Add analytics, telemetry, or third-party SDKs
- Touch anything in `src/ui/` when the task is gameplay-only, or vice versa

## 7. Physics rules (critical)

Per spec §3, all physics values are **per-frame at 60 FPS**. Phaser delivers a `delta` in ms.

- Multiply all per-frame values by `(delta / 16.67)` to get frame-rate-independent motion.
- **Do not use Phaser's built-in gravity on the player.** We apply custom gravity per spec §3.2 (three values: normal, floating, fast-fall). Set `body.allowGravity = false` on the player and apply gravity manually in `update()`.
- Use Phaser Arcade Physics collision for detection, but resolve collisions per spec §4.2 (smallest penetration, check all platforms, pick smallest).
- Boundary collision: left/right/top clamp, bottom = player death (spec §4.3).
- Coin physics are per-type (spec §3.6). P-coin reflects; B/M-coin gravity-only with edge-fall; standard coin bounces. These go in `entities/coins/` subclasses.

## 8. Testing

- Framework: Vitest for units, Playwright for a single end-to-end smoke test.
- **Test pure systems, not rendering.** Good candidates: scoring math, multiplier thresholds, bomb-sequence validation, coin spawn conditions, difficulty scaling formulas, A* pathfinding.
- Do NOT write tests that boot Phaser. Too slow, too flaky.
- Run tests: `npm test`
- Always run tests before declaring a task complete. If you added logic in `src/systems/` or `src/managers/`, add tests.

## 9. Running the game

- Dev server: `npm run dev` — serves a standalone harness at `http://localhost:5173`
- Build package: `npm run build`
- Typecheck: `npm run typecheck`
- Lint: `npm run lint`

The standalone harness simulates the bridge for local development. Check `src/bridge/standalone.ts`.

## 10. The bridge (`window.sigurdGame`)

Contract per spec §16. **Do not change this API without my approval.**

```ts
interface SigurdBridge {
  ready: boolean;
  getBalance(): number;
  deductCredits(amount: number): Promise<{ success: boolean; newBalance: number; error?: string }>;
  refreshBalance(): Promise<number>;
  onBalanceChanged(cb: (balance: number) => void): () => void;
  sendGameCompletion(data: GameCompletionPayload): void;
  sendAudioSettings(settings: AudioSettings): void;
}
```

All bridge interaction goes through `src/bridge/bridge-adapter.ts`. Never call `window.sigurdGame` directly from a scene or manager. The adapter handles the 3000ms detection timeout and standalone fallback (spec §16.3).

Credit deductions (spec §16.2): always `await` the result, block the round start on failure.

## 11. Assets

- Sprites live in `assets/sprites/` and are atlased at build time.
- Audio: background music as `.mp3`, SFX synthesized at runtime per spec §11.2 (keep the WebAudio synth code — don't replace with files).
- Two exceptions that are files: `Victory.wav` and `gameover.wav` (spec §11.3).
- When adding new art, use existing pixel dimensions (player 25×35, bomb/coin/monster 25×25). Don't rescale.

## 12. Workflow expectations

- **Plan mode for anything non-trivial.** Use Shift+Tab to plan before editing.
- **Commit after every working feature**, not at the end of a session. Commit message format: `<area>: <what> (spec §X)`. Example: `coins: implement P-coin color cycle (spec §7.1)`.
- **Ask before broad refactors.** If you see code you want to restructure, propose it as a separate task — don't bundle with a feature.
- **Paste errors back.** If the game throws at runtime, give me the stack and I'll paste it to you, or check `npm run dev` output yourself.
- **Stop at uncertainty.** If the spec is ambiguous on a detail (e.g., "what happens if two P-coins are spawning at the same frame"), ask. Don't pick a direction silently.

## 13. Common anti-patterns — do not do these

- Hardcoding numbers that exist in the spec. Use `src/data/constants.ts`.
- Mixing React state and Phaser state. React owns menu/HUD chrome; Phaser owns the playfield. They sync via the `EventBus` and props.
- Putting gameplay logic inside React components.
- Using `setTimeout`/`setInterval` in scenes. Use `scene.time.addEvent`, which respects pause/resume.
- Forgetting that power mode (spec §9.4) pauses difficulty scaling. Any time-based system needs to check pause state.
- Creating new monsters by copying existing classes. Use the `Monster` base class and override behavior.
- Referencing scenes by direct object reference across modules. Use scene keys and `this.scene.get('GameScene')`.

## 14. When in doubt

Ask. A 30-second question saves a 30-minute revert.

---

*Last updated: [date]. Update this file when architectural decisions change.*
