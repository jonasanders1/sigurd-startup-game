/**
 * Pure helpers for Bomb Jack–style rule math.
 *
 * Single source of truth for: bomb/coin/kill scoring, P-coin token weighting,
 * B-coin milestone math, M-coin death-generosity, end-of-level bonus.
 *
 * Everything in here is a pure function — no globals, no state, no side
 * effects — so it's directly unit-testable and reusable from managers/stores.
 */

import { COIN_SPAWNING } from "../config/coins";
import { BOMB_POINTS, BONUS_POINTS, MULTIPLIER_SYSTEM } from "../config/scoring";
import { getTuned } from "../stores/systems/tuningStore";

// ─── Bombs ───────────────────────────────────────────────────────────────────

/** BJ: firebomb (in-sequence) = 200, normal bomb = 100. Multiplier applied. */
export const bombBasePoints = (isFirebomb: boolean): number =>
  isFirebomb ? BOMB_POINTS.FIREBOMB : BOMB_POINTS.NORMAL;

export const bombScore = (isFirebomb: boolean, multiplier: number): number =>
  bombBasePoints(isFirebomb) * multiplier;

/**
 * Pad a bomb array up to `target` count by appending placeholder bombs in a
 * new last group (so the existing collection sequence is not disrupted —
 * BombManager iterates groups by ascending number and finishes the
 * map-defined groups before reaching the appended one).
 *
 * Sigurd's canonical is 23 bombs/level (BJ shipped 24; we reverted). Older
 * maps that ship with fewer than the configured target get topped up at
 * runtime so designers don't have to bulk-edit map files when the target
 * changes.
 */
export interface BombShape {
  order: number;
  group: number;
  x: number;
  y: number;
}
export const padBombsTo = <T extends BombShape>(
  bombs: T[],
  target: number,
  factory: (order: number, group: number) => T
): T[] => {
  if (bombs.length >= target) return bombs;
  const out = [...bombs];
  const maxGroup = bombs.reduce((m, b) => Math.max(m, b.group), 0);
  const maxOrder = bombs.reduce((m, b) => Math.max(m, b.order), 0);
  const newGroup = maxGroup + 1;
  let nextOrder = maxOrder + 1;
  while (out.length < target) {
    out.push(factory(nextOrder, newGroup));
    nextOrder++;
  }
  return out;
};

// ─── End-of-level bonus ──────────────────────────────────────────────────────

/**
 * BJ: 23 firebombs (correct order) = 50k, 22 = 30k, 21 = 20k, 20 = 10k,
 * <20 = 0. NOT multiplied. NOT reduced by lives lost (we removed Sigurd's
 * livesLost penalty to match BJ canonical).
 */
export const endOfLevelBonus = (correctOrderCount: number): number => {
  const table = BONUS_POINTS as Record<number, number>;
  return table[correctOrderCount] ?? 0;
};

// ─── Multiplier ──────────────────────────────────────────────────────────────

/**
 * BJ: multiplier advances ONLY via B-coin pickup. Capped at 5×.
 * Returns the new multiplier value after a B-coin is collected.
 */
export const bumpMultiplier = (current: number): number =>
  Math.min(current + 1, MULTIPLIER_SYSTEM.MAX_MULTIPLIER);

// ─── Monster kill escalation ─────────────────────────────────────────────────

/**
 * BJ kill table during power mode (game-specs §7.1, §8): 1st=100, 2nd=200,
 * 3rd=300, 4th=400, 5th=500, 6th+ = 600 (caps at 600). Multiplier applied.
 *
 * Note: this is the canonical Tehkan arcade table. An alternate table
 * (100/200/300/500/800/1200/2000) circulates in some hint sheets but does
 * not match the published references — game-specs is authoritative here.
 */
const KILL_TABLE = [100, 200, 300, 400, 500, 600] as const;

export const monsterKillBasePoints = (killOrdinal: number): number => {
  if (killOrdinal < 1) return 0;
  const idx = Math.min(killOrdinal - 1, KILL_TABLE.length - 1);
  return KILL_TABLE[idx];
};

export const monsterKillScore = (killOrdinal: number, multiplier: number): number =>
  monsterKillBasePoints(killOrdinal) * multiplier;

// ─── P-coin tokens ───────────────────────────────────────────────────────────

/**
 * BJ: each firebomb collected = 2 tokens, each normal bomb = 1 token.
 * P-coin spawns when token count reaches POWER_COIN_SPAWN_INTERVAL.
 *
 * The interval is sized so that 9 firebombs alone = 1 P-coin (matching
 * the canonical "every 9 firebombs"); 18 normal bombs = 1 P-coin (the
 * "twice as many for firebombs only" rule from the BJ tip sheet).
 */
export const pCoinTokensForBomb = (isFirebomb: boolean): number =>
  isFirebomb
    ? getTuned("P_COIN_TOKEN_FIREBOMB")
    : getTuned("P_COIN_TOKEN_NORMAL");

/**
 * BJ: tokens don't accrue while a P-coin is already on screen. This is the
 * "no double-up" rule from the tip sheet ("not worth collecting more bombs
 * until [the P] runs out"). Returns the tokens that should be added for a
 * given bomb event.
 */
export const tokensAddedOnBomb = (
  isFirebomb: boolean,
  pCoinAlive: boolean
): number => (pCoinAlive ? 0 : pCoinTokensForBomb(isFirebomb));

/**
 * Returns the number of P-coins to spawn given current accumulated tokens
 * and the threshold, plus the new remaining tokens. Pure: caller decides
 * whether a P-coin is already on screen (tokens shouldn't accrue while alive
 * — that's enforced upstream).
 */
export const pCoinSpawnsAt = (
  tokens: number,
  threshold: number = getTuned("POWER_COIN_SPAWN_INTERVAL")
): { spawns: number; remainingTokens: number } => {
  if (tokens < threshold) return { spawns: 0, remainingTokens: tokens };
  const spawns = Math.floor(tokens / threshold);
  return { spawns, remainingTokens: tokens % threshold };
};

// ─── B-coin (Bonus Multiplier) ───────────────────────────────────────────────

/**
 * BJ: B-coin awards a FLAT 500 points (NOT multiplied), and bumps the
 * multiplier by 1 (capped at 5×). Per game-specs §7.2 and §8.
 *
 * Caller must use a non-multiplying score path (e.g. addRawScore) — passing
 * this through addScore would re-multiply and reintroduce the money glitch.
 */
export const bCoinBasePoints = (): number => 500;

/**
 * Which point sources count toward the B-coin 5K threshold.
 *
 * BJ canonical (per arcade and Kralizec MSX2 docs): "every 5,000 points
 * crossed cleanly WITHOUT B-coin contribution." So:
 *
 *  - Bombs (firebomb + normal): YES
 *  - Monster kills during power mode: YES
 *  - Trampoline (jump / wall-hit / fall-off): YES
 *  - B-coin pickup reward: NO
 *  - E-coin / P-coin pickup reward: NO (F-coin grants Forretningsidee, no score)
 *  - End-of-level firebomb bonus: NO
 *
 * This rule is what prevents the "money glitch" cascade entirely — the
 * B-coin reward feeds the player's score but never bumps the spawn threshold.
 * Implemented in CoinManager via `bombAndMonsterPoints` (only bomb / kill /
 * trampoline writes to it).
 */
export type ThresholdablePointSource = "bomb" | "kill" | "trampoline";
export const isThresholdablePointSource = (
  source: ThresholdablePointSource | string
): source is ThresholdablePointSource =>
  source === "bomb" || source === "kill" || source === "trampoline";

/**
 * Milestones (multiples of `interval`) crossed when score moves from
 * `prev` to `current`. BJ uses 5,000-point intervals starting at 5k.
 * Empty array if no new milestone was crossed.
 */
export const bCoinMilestonesCrossed = (
  prev: number,
  current: number,
  interval: number = getTuned("BONUS_COIN_SPAWN_INTERVAL")
): number[] => {
  if (current <= prev) return [];
  const prevMilestone = Math.floor(prev / interval) * interval;
  const currentMilestone = Math.floor(current / interval) * interval;
  if (currentMilestone <= prevMilestone || currentMilestone < interval) return [];
  const out: number[] = [];
  for (let m = prevMilestone + interval; m <= currentMilestone; m += interval) {
    out.push(m);
  }
  return out;
};

/** BJ: max 5 B-coins per level. Live-tunable. */
export const bCoinPerLevelCap = (): number =>
  getTuned("BONUS_COIN_MAX_PER_LEVEL");

/** BJ: max 2 P-coins per level (game-specs §7.1). Live-tunable. */
export const pCoinPerLevelCap = (): number =>
  getTuned("POWER_COIN_MAX_PER_LEVEL");

// ─── M-coin (Extra Life) ─────────────────────────────────────────────────────

/**
 * BJ: M-coin appears every 8 B-coins collected, with each life lost adding
 * 2 credits toward the next milestone (death-generosity). Counter persists
 * across levels; resets only on game over.
 */
export const mCoinEffective = (
  bonusCoinsCollected: number,
  livesLost: number,
  generosity: number = getTuned("EXTRA_LIFE_DEATH_GENEROSITY")
): number => bonusCoinsCollected + generosity * livesLost;

export const mCoinMilestone = (
  effective: number,
  ratio: number = getTuned("EXTRA_LIFE_COIN_RATIO")
): number => Math.floor(effective / ratio) * ratio;

/**
 * Whether an M-coin should spawn given current state. Returns the milestone
 * number (use as dedup key) or null if no spawn is due.
 */
export const mCoinSpawnDecision = (
  bonusCoinsCollected: number,
  livesLost: number,
  alreadyTriggered: ReadonlySet<number>,
  generosity: number = getTuned("EXTRA_LIFE_DEATH_GENEROSITY"),
  ratio: number = getTuned("EXTRA_LIFE_COIN_RATIO")
): { milestone: number } | null => {
  const effective = mCoinEffective(bonusCoinsCollected, livesLost, generosity);
  if (effective < ratio) return null;
  const milestone = mCoinMilestone(effective, ratio);
  if (alreadyTriggered.has(milestone)) return null;
  return { milestone };
};

/** E/M-coin awards 1000 base × current multiplier (same shape as B-coin). */
export const eCoinBasePoints = (): number => 1000;

// ─── Spawn invulnerability ───────────────────────────────────────────────────

/**
 * BJ spawn invulnerability (game-specs §5.4): newly spawned enemy is harmless
 * for a brief window — the spec describes it as "until first AI direction
 * change", we approximate as a fixed 500 ms timer keyed off the monster's
 * spawn timestamp. Same window as the unfreeze "mutation" pass-through, so
 * the player has predictable safe windows around all enemy state changes.
 */
export const SPAWN_INVULN_MS = 500;
/** Live-tuning override of SPAWN_INVULN_MS via the panel. Used as the default
 *  invulnMs for `isInSpawnInvuln` and `isCollisionLethal`. */
const tunedSpawnInvulnMs = (): number => getTuned("SPAWN_INVULN_MS");

export const isInSpawnInvuln = (
  spawnTime: number | undefined,
  now: number,
  invulnMs: number = tunedSpawnInvulnMs()
): boolean => {
  if (spawnTime === undefined) return false;
  return now - spawnTime < invulnMs;
};

/**
 * Combines all conditions that decide whether a player–monster contact should
 * KILL THE PLAYER (true) or be ignored / handled differently (false).
 *
 * Returns false when ANY of:
 *  - monster is frozen (caller handles the kill-monster case)
 *  - monster is in its post-mutation pass-through window (§5.4 #3)
 *  - monster is explicitly !isLethal (event-based spawn invuln, §5.4 #1)
 *  - monster is still in the time-based spawn invuln window (safety net)
 *
 * Pure: caller passes `now` so this is fully deterministic for testing.
 */
export interface CollisionStateMonster {
  isFrozen?: boolean;
  mutationEndTime?: number;
  individualSpawnTime?: number;
  spawnTime?: number;
  /** Event-based spawn invuln. `false` = not yet armed by movement class.
   *  Undefined treated as true (lethal). */
  isLethal?: boolean;
}
export const isCollisionLethal = (
  monster: CollisionStateMonster,
  now: number,
  invulnMs: number = tunedSpawnInvulnMs()
): boolean => {
  if (monster.isFrozen) return false;
  if (monster.mutationEndTime !== undefined && now < monster.mutationEndTime) {
    return false;
  }
  // Event-based spawn invuln (canonical): explicitly false → not lethal,
  // explicitly true → lethal (skip the timer fallback so a monster that
  // armed itself early via first AI decision IS hostile, even within the
  // 500ms safety net window).
  if (monster.isLethal === false) return false;
  if (monster.isLethal === true) return true;
  // isLethal undefined → fall back to time-based safety net (catches
  // monsters that bypass the movement-class wiring).
  const spawn = monster.individualSpawnTime ?? monster.spawnTime;
  if (isInSpawnInvuln(spawn, now, invulnMs)) return false;
  return true;
};

/**
 * Arm a monster as lethal. Idempotent — safe to call every frame from a
 * movement class once the monster's first AI decision has happened.
 */
export const armMonsterAsLethal = (monster: { isLethal?: boolean }): void => {
  if (monster.isLethal !== true) monster.isLethal = true;
};

// ─── Lives ───────────────────────────────────────────────────────────────────

/**
 * BJ HUD constraint (game-specs §11): lives display caps at 9 — Jack icons
 * must fit on screen. E-coin grants +1 but never pushes past this.
 */
export const clampLives = (
  proposed: number,
  max: number = getTuned("MAX_LIVES")
): number => Math.max(0, Math.min(proposed, max));

// ─── Trampoline / wall-hit edge gate ─────────────────────────────────────────

/**
 * BJ trampoline awards 10 BASE × multiplier per jump, wall-hit, or fall-off.
 * The "wall-hit" edge needs gating across frames so that holding into a wall
 * doesn't fire 60 events per second (the original Sigurd "wall-hold money
 * glitch"). This pure helper models the per-frame wall-contact state machine
 * used by PlayerManager.
 */
export interface WallEdgeState {
  lastFrame: boolean;
  thisFrame: boolean;
}

export const newWallEdgeFrame = (s: WallEdgeState): WallEdgeState => ({
  lastFrame: s.thisFrame,
  thisFrame: false,
});

/**
 * Register a wall-contact event within the current frame. Returns whether
 * the trampoline should fire (true only on a fresh edge — first contact in
 * this frame and not contacted in the previous frame).
 */
export const registerWallContact = (
  s: WallEdgeState
): { fire: boolean; next: WallEdgeState } => {
  const next = { ...s, thisFrame: true };
  if (s.thisFrame || s.lastFrame) return { fire: false, next };
  return { fire: true, next };
};

/** BJ trampoline base points per discrete event. */
export const trampolineBasePoints = (): number => 10;
