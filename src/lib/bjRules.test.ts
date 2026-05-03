/**
 * Bomb Jack rule tests.
 *
 * Each block locks in one canonical 1984 BJ mechanic. If a test name reads
 * like a sentence about the original arcade, that's the spec — change the
 * code, not the test, unless the rule itself is being revised.
 */

import { describe, it, expect } from "vitest";
import {
  armMonsterAsLethal,
  bCoinBasePoints,
  bCoinMilestonesCrossed,
  bCoinPerLevelCap,
  bombBasePoints,
  bombScore,
  bumpMultiplier,
  clampLives,
  eCoinBasePoints,
  endOfLevelBonus,
  isCollisionLethal,
  isInSpawnInvuln,
  isThresholdablePointSource,
  mCoinEffective,
  mCoinMilestone,
  mCoinSpawnDecision,
  monsterKillBasePoints,
  monsterKillScore,
  newWallEdgeFrame,
  padBombsTo,
  pCoinPerLevelCap,
  pCoinSpawnsAt,
  pCoinTokensForBomb,
  registerWallContact,
  sCoinBasePoints,
  SPAWN_INVULN_MS,
  tokensAddedOnBomb,
  trampolineBasePoints,
  type WallEdgeState,
} from "./bjRules";

// ─── Bombs ───────────────────────────────────────────────────────────────────

describe("bomb scoring", () => {
  it("awards 200 base for a firebomb (in-sequence)", () => {
    expect(bombBasePoints(true)).toBe(200);
  });

  it("awards 100 base for a normal/out-of-sequence bomb", () => {
    expect(bombBasePoints(false)).toBe(100);
  });

  it("multiplies by current multiplier", () => {
    expect(bombScore(true, 1)).toBe(200);
    expect(bombScore(true, 5)).toBe(1000);
    expect(bombScore(false, 3)).toBe(300);
  });
});

describe("padBombsTo (24-bombs-per-level rule)", () => {
  type B = { order: number; group: number; x: number; y: number };
  const make = (order: number, group: number): B => ({ order, group, x: 0, y: 0 });

  it("returns the input unchanged when already at target", () => {
    const bombs: B[] = Array.from({ length: 24 }, (_, i) =>
      make(i + 1, Math.floor(i / 3) + 1)
    );
    expect(padBombsTo(bombs, 24, make)).toEqual(bombs);
  });

  it("returns the input unchanged when already over target", () => {
    const bombs: B[] = Array.from({ length: 26 }, (_, i) => make(i + 1, 1));
    expect(padBombsTo(bombs, 24, make)).toEqual(bombs);
  });

  it("appends a single placeholder when one short of target", () => {
    const bombs: B[] = Array.from({ length: 23 }, (_, i) =>
      make(i + 1, Math.min(Math.floor(i / 3) + 1, 8))
    );
    const out = padBombsTo(bombs, 24, make);
    expect(out).toHaveLength(24);
    // Placeholder lives in a NEW group so it doesn't disrupt existing sequence.
    const lastGroup = bombs.reduce((m, b) => Math.max(m, b.group), 0);
    expect(out[23].group).toBeGreaterThan(lastGroup);
    expect(out[23].x).toBe(0);
    expect(out[23].y).toBe(0);
  });

  it("appends multiple placeholders when several short, all in same new group", () => {
    const bombs: B[] = [make(1, 1), make(2, 1)];
    const out = padBombsTo(bombs, 5, make);
    expect(out).toHaveLength(5);
    expect(out[2].group).toBe(2);
    expect(out[3].group).toBe(2);
    expect(out[4].group).toBe(2);
    // Orders are unique and ascending past the existing max.
    expect(out[2].order).toBe(3);
    expect(out[3].order).toBe(4);
    expect(out[4].order).toBe(5);
  });
});

// ─── End-of-level bonus ──────────────────────────────────────────────────────

describe("end-of-level bonus", () => {
  it("awards 50,000 for a perfect 23-firebomb run", () => {
    expect(endOfLevelBonus(23)).toBe(50_000);
  });

  it("awards 30,000 / 20,000 / 10,000 for 22 / 21 / 20", () => {
    expect(endOfLevelBonus(22)).toBe(30_000);
    expect(endOfLevelBonus(21)).toBe(20_000);
    expect(endOfLevelBonus(20)).toBe(10_000);
  });

  it("awards 0 below 20", () => {
    expect(endOfLevelBonus(19)).toBe(0);
    expect(endOfLevelBonus(0)).toBe(0);
  });

  // Regression for the Sigurd-specific "lives lost" penalty we removed:
  // the bonus is purely on correct-order count now, with no death deduction.
  it("does NOT take a livesLost penalty (BJ canonical)", () => {
    // Function only takes correctOrderCount — there's no place to apply a
    // penalty. A perfect run with N deaths still scores the perfect bonus.
    expect(endOfLevelBonus(23)).toBe(50_000);
  });
});

// ─── Multiplier ──────────────────────────────────────────────────────────────

describe("multiplier", () => {
  it("only advances by 1 per call (B-coin pickup)", () => {
    expect(bumpMultiplier(1)).toBe(2);
    expect(bumpMultiplier(2)).toBe(3);
    expect(bumpMultiplier(3)).toBe(4);
    expect(bumpMultiplier(4)).toBe(5);
  });

  it("caps at 5×", () => {
    expect(bumpMultiplier(5)).toBe(5);
    expect(bumpMultiplier(6)).toBe(5); // shouldn't happen in practice but defensive
  });
});

// ─── Monster kill escalation ─────────────────────────────────────────────────

describe("monster kill escalation during power mode", () => {
  // game-specs §7.1: 1st-6th frozen-token award is 100/200/300/400/500/600,
  // capped at 600 thereafter. This is much flatter than the alt
  // 100/200/300/500/800/1200/2000 table from non-canonical hint sheets.
  it("follows the BJ canonical sequence 100/200/300/400/500/600", () => {
    expect(monsterKillBasePoints(1)).toBe(100);
    expect(monsterKillBasePoints(2)).toBe(200);
    expect(monsterKillBasePoints(3)).toBe(300);
    expect(monsterKillBasePoints(4)).toBe(400);
    expect(monsterKillBasePoints(5)).toBe(500);
    expect(monsterKillBasePoints(6)).toBe(600);
  });

  it("caps at 600 for the 7th and beyond", () => {
    expect(monsterKillBasePoints(7)).toBe(600);
    expect(monsterKillBasePoints(20)).toBe(600);
  });

  it("awards 0 for an invalid (zero or negative) kill ordinal", () => {
    expect(monsterKillBasePoints(0)).toBe(0);
    expect(monsterKillBasePoints(-1)).toBe(0);
  });

  it("multiplies by current multiplier", () => {
    expect(monsterKillScore(1, 5)).toBe(500);
    expect(monsterKillScore(6, 5)).toBe(3_000); // BJ ceiling: 600 × 5
    expect(monsterKillScore(20, 5)).toBe(3_000); // still capped
  });
});

// ─── P-coin tokens ───────────────────────────────────────────────────────────

describe("P-coin token weighting", () => {
  it("counts a firebomb as 2 tokens, normal bomb as 1", () => {
    expect(pCoinTokensForBomb(true)).toBe(2);
    expect(pCoinTokensForBomb(false)).toBe(1);
  });

  it("does not spawn until threshold reached (default 18)", () => {
    expect(pCoinSpawnsAt(0).spawns).toBe(0);
    expect(pCoinSpawnsAt(17).spawns).toBe(0);
  });

  it("spawns one P-coin at exactly the threshold", () => {
    const r = pCoinSpawnsAt(18);
    expect(r.spawns).toBe(1);
    expect(r.remainingTokens).toBe(0);
  });

  // BJ canonical: "every 9 firebombs" → 9×2 = 18 tokens. The interval is
  // sized for this; the test is what makes that intent explicit.
  it("converts 9 firebombs alone to exactly 1 P-coin", () => {
    const tokens = 9 * pCoinTokensForBomb(true);
    expect(pCoinSpawnsAt(tokens).spawns).toBe(1);
  });

  // BJ tip sheet: "twice as many P-coins for firebombs only" — i.e., 18
  // normal bombs = 1 P-coin, half the rate of firebombs.
  it("converts 18 normal bombs alone to exactly 1 P-coin", () => {
    const tokens = 18 * pCoinTokensForBomb(false);
    expect(pCoinSpawnsAt(tokens).spawns).toBe(1);
  });

  // 23 firebombs in a level (the BJ map size). With weighted tokens this
  // gives floor(46/18) = 2 P-coins per level if they're all collected
  // — matches BJ's "around 2-3 P-coins per level" baseline.
  it("yields 2 P-coins for a perfect 23-firebomb level", () => {
    const tokens = 23 * pCoinTokensForBomb(true);
    expect(pCoinSpawnsAt(tokens).spawns).toBe(2);
  });

  // game-specs §7.1: max 2 P-coins per level. With the 23-firebomb level
  // budget yielding exactly 2 spawns and the cap also being 2, the cap
  // matches the natural-token rate.
  it("level cap matches the natural P-coin yield (both = 2)", () => {
    const tokens = 23 * pCoinTokensForBomb(true);
    expect(pCoinSpawnsAt(tokens).spawns).toBeLessThanOrEqual(2);
  });

  it("per-level cap is 2", () => {
    expect(pCoinPerLevelCap()).toBe(2);
  });

  it("carries surplus tokens forward (not modulo'd to zero)", () => {
    // 20 tokens → 1 spawn, 2 left over toward the next P
    expect(pCoinSpawnsAt(20)).toEqual({ spawns: 1, remainingTokens: 2 });
  });
});

// ─── B-coin (Bonus Multiplier) ───────────────────────────────────────────────

describe("B-coin", () => {
  // game-specs §7.2: "Award 500 points." NOT multiplied.
  it("awards a FLAT 500 points (NOT multiplied)", () => {
    expect(bCoinBasePoints()).toBe(500);
  });

  it("caps at 5 spawns per level (BJ rule)", () => {
    expect(bCoinPerLevelCap()).toBe(5);
  });

  describe("milestone math", () => {
    it("returns no milestones if score didn't move past one", () => {
      expect(bCoinMilestonesCrossed(0, 4_999)).toEqual([]);
      expect(bCoinMilestonesCrossed(5_001, 5_999)).toEqual([]);
    });

    it("returns a single milestone when score crosses it once", () => {
      expect(bCoinMilestonesCrossed(4_900, 5_100)).toEqual([5_000]);
      expect(bCoinMilestonesCrossed(9_500, 10_300)).toEqual([10_000]);
    });

    it("returns multiple milestones if score jumps over several", () => {
      expect(bCoinMilestonesCrossed(0, 12_000)).toEqual([5_000, 10_000]);
      expect(bCoinMilestonesCrossed(4_999, 25_000)).toEqual([
        5_000,
        10_000,
        15_000,
        20_000,
        25_000,
      ]);
    });

    it("treats lateral / decreasing score as a no-op", () => {
      expect(bCoinMilestonesCrossed(7_000, 7_000)).toEqual([]);
      expect(bCoinMilestonesCrossed(7_000, 6_000)).toEqual([]);
    });
  });

  // game-specs §7.2: B-coin reward must NOT cross a threshold by itself.
  // With flat 500 + the no-coin-contribution rule, this is doubly-locked:
  // the reward is small AND it doesn't write to the threshold counter.
  it("does NOT chain-spawn (anti-money-glitch invariant)", () => {
    const scoreBefore = 24_999;
    const reward = bCoinBasePoints(); // 500 flat, no multiplier
    const scoreAfter = scoreBefore + reward;
    const crossed = bCoinMilestonesCrossed(scoreBefore, scoreAfter);
    expect(crossed.length).toBeLessThanOrEqual(1);
  });
});

// ─── M-coin (Extra Life) ─────────────────────────────────────────────────────

describe("M-coin death-generosity", () => {
  it("effective count = bonusCoins + 2 × livesLost", () => {
    expect(mCoinEffective(0, 0)).toBe(0);
    expect(mCoinEffective(4, 0)).toBe(4);
    expect(mCoinEffective(4, 2)).toBe(8); // forum example: 4 B + 2 deaths → E
  });

  it("uses default ratio of 8 B-coins per E-coin", () => {
    expect(mCoinMilestone(7)).toBe(0);
    expect(mCoinMilestone(8)).toBe(8);
    expect(mCoinMilestone(15)).toBe(8);
    expect(mCoinMilestone(16)).toBe(16);
  });

  it("does not spawn before the first 8-effective milestone", () => {
    expect(mCoinSpawnDecision(0, 0, new Set())).toBeNull();
    expect(mCoinSpawnDecision(7, 0, new Set())).toBeNull();
    expect(mCoinSpawnDecision(3, 1, new Set())).toBeNull(); // 3 + 2 = 5
  });

  it("spawns once milestone 8 is reached (forum example)", () => {
    // 4 B-coins + lose 2 lives → effective 8 → spawn
    expect(mCoinSpawnDecision(4, 2, new Set())).toEqual({ milestone: 8 });
  });

  it("does not re-spawn the same milestone (dedup via triggered set)", () => {
    const triggered = new Set<number>([8]);
    expect(mCoinSpawnDecision(8, 0, triggered)).toBeNull(); // 8 already fired
    // bonus jumps to 16 → next milestone fires
    expect(mCoinSpawnDecision(16, 0, triggered)).toEqual({ milestone: 16 });
  });

  it("handles effective count jumping over a milestone (non-modulo)", () => {
    // No spawn yet at 7. Then big jump (e.g., 4 B + 2 deaths in quick succession)
    // takes effective from 7 → 9 — milestone is 8, must still fire.
    expect(mCoinSpawnDecision(5, 2, new Set())).toEqual({ milestone: 8 }); // 5+4=9 → milestone 8
  });
});

// ─── E / S coin scoring ──────────────────────────────────────────────────────

// ─── Spawn invulnerability + collision lethality ────────────────────────────

describe("spawn invulnerability (BJ §5.4 #1)", () => {
  it("is true while now is within invulnMs of spawnTime", () => {
    const spawn = 1000;
    expect(isInSpawnInvuln(spawn, 1000)).toBe(true);
    expect(isInSpawnInvuln(spawn, 1499)).toBe(true);
    expect(isInSpawnInvuln(spawn, 1499, SPAWN_INVULN_MS)).toBe(true);
  });

  it("is false once invuln window has elapsed", () => {
    expect(isInSpawnInvuln(1000, 1500)).toBe(false);
    expect(isInSpawnInvuln(1000, 5000)).toBe(false);
  });

  it("is false when no spawn time recorded (undefined)", () => {
    expect(isInSpawnInvuln(undefined, 1000)).toBe(false);
  });

  it("uses default 500ms when invulnMs not passed", () => {
    expect(SPAWN_INVULN_MS).toBe(500);
  });
});

describe("isCollisionLethal (BJ §5.4 — three invuln conditions)", () => {
  // Baseline: monster with no flags set, just spawned long ago, lethal.
  const NORMAL = { individualSpawnTime: 0 };
  const NOW = 10_000;

  it("is lethal for a normal active monster", () => {
    expect(isCollisionLethal(NORMAL, NOW)).toBe(true);
  });

  // Condition 1: spawn invuln
  it("is NOT lethal for a freshly spawned monster (spawn invuln)", () => {
    expect(isCollisionLethal({ individualSpawnTime: NOW }, NOW)).toBe(false);
    expect(isCollisionLethal({ individualSpawnTime: NOW - 200 }, NOW)).toBe(false);
  });

  it("becomes lethal after the spawn invuln window expires", () => {
    expect(isCollisionLethal({ individualSpawnTime: NOW - 600 }, NOW)).toBe(true);
  });

  // Condition 2: mutation pass-through (post-unfreeze)
  it("is NOT lethal during mutation pass-through window", () => {
    expect(
      isCollisionLethal(
        { ...NORMAL, mutationEndTime: NOW + 200 },
        NOW
      )
    ).toBe(false);
  });

  it("becomes lethal once mutation window passes", () => {
    expect(
      isCollisionLethal(
        { ...NORMAL, mutationEndTime: NOW - 1 },
        NOW
      )
    ).toBe(true);
  });

  // Condition 3 surrogate: frozen monsters are NOT lethal-to-player (they're
  // killable tokens — caller handles the kill-monster case).
  it("is NOT lethal when monster is frozen (caller kills the monster)", () => {
    expect(isCollisionLethal({ ...NORMAL, isFrozen: true }, NOW)).toBe(false);
  });

  it("falls back to spawnTime when individualSpawnTime is missing", () => {
    expect(isCollisionLethal({ spawnTime: NOW }, NOW)).toBe(false);
    expect(isCollisionLethal({ spawnTime: NOW - 600 }, NOW)).toBe(true);
  });

  // Event-based spawn invuln (game-specs §5.4 — "until first direction change")
  it("is NOT lethal when isLethal is explicitly false (event-based invuln)", () => {
    expect(
      isCollisionLethal({ ...NORMAL, isLethal: false }, NOW)
    ).toBe(false);
  });

  it("IS lethal when isLethal is true even mid spawn-timer (event arms early)", () => {
    expect(
      isCollisionLethal({ individualSpawnTime: NOW, isLethal: true }, NOW)
    ).toBe(true);
  });

  it("treats undefined isLethal as lethal (default for monsters that bypass movement classes)", () => {
    expect(isCollisionLethal({ ...NORMAL }, NOW)).toBe(true);
  });
});

describe("armMonsterAsLethal (event-based invuln helper)", () => {
  it("flips false → true", () => {
    const m: { isLethal?: boolean } = { isLethal: false };
    armMonsterAsLethal(m);
    expect(m.isLethal).toBe(true);
  });

  it("is idempotent (already-true stays true)", () => {
    const m: { isLethal?: boolean } = { isLethal: true };
    armMonsterAsLethal(m);
    expect(m.isLethal).toBe(true);
  });

  it("flips undefined → true (defensive)", () => {
    const m: { isLethal?: boolean } = {};
    armMonsterAsLethal(m);
    expect(m.isLethal).toBe(true);
  });
});

describe("lives cap (BJ HUD constraint)", () => {
  // game-specs §11: max 9 lives — Jack icons must fit on screen.
  it("caps proposed lives at 9 by default", () => {
    expect(clampLives(10)).toBe(9);
    expect(clampLives(100)).toBe(9);
  });

  it("passes through values within range", () => {
    expect(clampLives(0)).toBe(0);
    expect(clampLives(3)).toBe(3);
    expect(clampLives(9)).toBe(9);
  });

  it("never returns negative (defensive)", () => {
    expect(clampLives(-1)).toBe(0);
    expect(clampLives(-100)).toBe(0);
  });
});

describe("E/S coin awards", () => {
  it("E-coin (extra life) awards 1000 base + 1 life", () => {
    expect(eCoinBasePoints()).toBe(1000);
  });

  // game-specs §7.4: flat 5000 (not multiplied) + immediate level skip.
  it("S-coin (special) awards a FLAT 5000 + skip level (not multiplied)", () => {
    expect(sCoinBasePoints()).toBe(5000);
  });
});

// ─── P-coin token pause while P alive ────────────────────────────────────────

describe("P-coin token pause-while-alive rule", () => {
  it("a firebomb adds 2 tokens when no P is on screen", () => {
    expect(tokensAddedOnBomb(true, false)).toBe(2);
  });

  it("a normal bomb adds 1 token when no P is on screen", () => {
    expect(tokensAddedOnBomb(false, false)).toBe(1);
  });

  // BJ tip-sheet rule: "While a P is floating around you don't get credited
  // with bomb tokens" — the firebomb that triggered the P doesn't keep
  // accruing toward the next one until the current P is collected/expired.
  it("adds zero tokens while a P-coin is already alive (firebomb)", () => {
    expect(tokensAddedOnBomb(true, true)).toBe(0);
  });

  it("adds zero tokens while a P-coin is already alive (normal bomb)", () => {
    expect(tokensAddedOnBomb(false, true)).toBe(0);
  });
});

// ─── Trampoline / wall-edge gate ─────────────────────────────────────────────

describe("trampoline scoring", () => {
  it("awards 10 base points per discrete jump/wall/falloff event", () => {
    expect(trampolineBasePoints()).toBe(10);
  });
});

// ─── B-coin threshold "no coin contribution" rule ────────────────────────────

describe("B-coin threshold source filtering (BJ no-coin-contribution rule)", () => {
  it("counts bomb / kill / trampoline points toward the 5K threshold", () => {
    expect(isThresholdablePointSource("bomb")).toBe(true);
    expect(isThresholdablePointSource("kill")).toBe(true);
    expect(isThresholdablePointSource("trampoline")).toBe(true);
  });

  it("does NOT count B-coin / E-coin / S-coin / P-coin pickup rewards", () => {
    expect(isThresholdablePointSource("bcoin")).toBe(false);
    expect(isThresholdablePointSource("ecoin")).toBe(false);
    expect(isThresholdablePointSource("scoin")).toBe(false);
    expect(isThresholdablePointSource("pcoin")).toBe(false);
  });

  it("does NOT count end-of-level firebomb bonus", () => {
    expect(isThresholdablePointSource("bonus")).toBe(false);
  });

  // Concrete scenario: at mult 5, picking up a B-coin awards 5,000 score
  // points but those don't count toward the threshold — so the next B
  // doesn't cascade-spawn. The pure milestone helper is unchanged; the
  // discipline lives at the call sites (only thresholdable sources call
  // onPointsEarned with isBonus=false).
  it("scenario: at mult 5, a B-coin reward of 5000 score points produces ZERO new milestones if ignored", () => {
    const thresholdScoreBefore = 12_345; // some in-play accumulation
    const thresholdScoreAfter = thresholdScoreBefore; // coin pickup doesn't move it
    expect(bCoinMilestonesCrossed(thresholdScoreBefore, thresholdScoreAfter)).toEqual([]);
  });
});

describe("wall-hit edge gate (anti-wall-hold-glitch)", () => {
  const fresh: WallEdgeState = { lastFrame: false, thisFrame: false };

  it("fires on first contact in a fresh frame", () => {
    const r = registerWallContact(fresh);
    expect(r.fire).toBe(true);
    expect(r.next.thisFrame).toBe(true);
  });

  it("does NOT fire a second time within the same frame", () => {
    const r1 = registerWallContact(fresh);
    const r2 = registerWallContact(r1.next);
    expect(r1.fire).toBe(true);
    expect(r2.fire).toBe(false);
  });

  // The original "money glitch" — holding the joystick into a wall fired
  // ~12 events/sec. With this gate, holding contact across many frames
  // counts as ONE event total (until the player releases and re-presses).
  it("does NOT fire across consecutive frames while pressed against a wall", () => {
    let state = fresh;
    let firedCount = 0;
    for (let frame = 0; frame < 60; frame++) {
      state = newWallEdgeFrame(state);
      const r = registerWallContact(state);
      if (r.fire) firedCount++;
      state = r.next;
    }
    expect(firedCount).toBe(1); // only the first frame's contact fires
  });

  it("re-arms after a no-contact gap, firing again on the next press", () => {
    // Frame 0: contact (fire)
    let state = newWallEdgeFrame(fresh);
    let r = registerWallContact(state);
    expect(r.fire).toBe(true);
    state = r.next;

    // Frame 1: still pressed (no fire)
    state = newWallEdgeFrame(state);
    r = registerWallContact(state);
    expect(r.fire).toBe(false);
    state = r.next;

    // Frame 2: released — no register call
    state = newWallEdgeFrame(state);

    // Frame 3: re-pressed → must fire (edge re-armed)
    state = newWallEdgeFrame(state);
    r = registerWallContact(state);
    expect(r.fire).toBe(true);
  });
});
