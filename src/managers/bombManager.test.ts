/**
 * Bomb-sequence validation tests.
 *
 * Pins the core "collect bombs in order" rule (game-specs §5, bomb order):
 *  - the first bomb clicked starts the run and is always counted correct;
 *  - after that, only the lowest uncollected order in the active group is
 *    "correct"; clicking out of order still collects the bomb but scores it
 *    as incorrect and does not advance the target;
 *  - finishing a group advances to the next group by ascending group number;
 *  - the run completes once every bomb is collected.
 *
 * BombManager owns this state (per CLAUDE.md §5 "state lives in one place"),
 * so it is exercised through its public API only.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { BombManager } from "./bombManager";
import type { Bomb } from "../types/interfaces";

const makeBomb = (group: number, order: number): Bomb => ({
  x: 0,
  y: 0,
  width: 25,
  height: 25,
  group,
  order,
  isCollected: false,
  isBlinking: false,
});

// Two groups: group 1 has orders 1..3, group 2 has orders 1..2.
const buildBombs = (): Bomb[] => [
  makeBomb(1, 1),
  makeBomb(1, 2),
  makeBomb(1, 3),
  makeBomb(2, 1),
  makeBomb(2, 2),
];

describe("BombManager - starting a run", () => {
  let mgr: BombManager;
  beforeEach(() => {
    mgr = new BombManager(buildBombs());
  });

  it("is not started before the first click", () => {
    expect(mgr.isGameStarted()).toBe(false);
    expect(mgr.getActiveGroup()).toBeNull();
  });

  it("counts the first click as correct regardless of order", () => {
    const res = mgr.handleBombClick(1, 3); // start on order 3, not 1
    expect(res).toEqual({ isValid: true, isCorrect: true, gameCompleted: false });
    expect(mgr.isGameStarted()).toBe(true);
    expect(mgr.getActiveGroup()).toBe(1);
    // Next target is the lowest still-uncollected order in the group.
    expect(mgr.getNextBombOrder()).toBe(1);
    expect(mgr.getCorrectOrderCount()).toBe(1);
  });
});

describe("BombManager - in-order collection", () => {
  let mgr: BombManager;
  beforeEach(() => {
    mgr = new BombManager(buildBombs());
  });

  it("accepts the full ascending sequence as correct", () => {
    expect(mgr.handleBombClick(1, 1).isCorrect).toBe(true);
    expect(mgr.getNextBombOrder()).toBe(2);
    expect(mgr.handleBombClick(1, 2).isCorrect).toBe(true);
    expect(mgr.getNextBombOrder()).toBe(3);
    expect(mgr.handleBombClick(1, 3).isCorrect).toBe(true);
  });

  it("advances to the next group by ascending group number", () => {
    mgr.handleBombClick(1, 1);
    mgr.handleBombClick(1, 2);
    mgr.handleBombClick(1, 3); // completes group 1
    expect(mgr.getActiveGroup()).toBe(2);
    expect(mgr.getNextBombOrder()).toBe(1);
  });

  it("reports gameCompleted only after the final bomb", () => {
    mgr.handleBombClick(1, 1);
    mgr.handleBombClick(1, 2);
    mgr.handleBombClick(1, 3);
    mgr.handleBombClick(2, 1);
    const last = mgr.handleBombClick(2, 2);
    expect(last.gameCompleted).toBe(true);
    expect(mgr.getActiveGroup()).toBeNull();
    expect(mgr.getNextBombOrder()).toBeNull();
  });
});

describe("BombManager - out-of-order collection", () => {
  let mgr: BombManager;
  beforeEach(() => {
    mgr = new BombManager(buildBombs());
    mgr.handleBombClick(1, 1); // start; next target is order 2
  });

  it("collects a wrong-order bomb but scores it incorrect", () => {
    const res = mgr.handleBombClick(1, 3); // skips order 2
    expect(res.isValid).toBe(true);
    expect(res.isCorrect).toBe(false);
    // Target is unchanged — order 2 is still expected.
    expect(mgr.getNextBombOrder()).toBe(2);
    // It is still marked collected, just not "correct".
    expect(mgr.getCollectedBombs().has("1-3")).toBe(true);
    expect(mgr.getCorrectBombs().has("1-3")).toBe(false);
  });

  it("does not increase the correct-order count on a wrong click", () => {
    const before = mgr.getCorrectOrderCount();
    mgr.handleBombClick(1, 3);
    expect(mgr.getCorrectOrderCount()).toBe(before);
  });

  it("rejects a second click on an already-collected bomb", () => {
    mgr.handleBombClick(1, 3);
    const again = mgr.handleBombClick(1, 3);
    expect(again).toEqual({
      isValid: false,
      isCorrect: false,
      gameCompleted: false,
    });
  });

  it("still recognizes the correct bomb after a wrong detour", () => {
    mgr.handleBombClick(1, 3); // wrong
    const res = mgr.handleBombClick(1, 2); // back on target
    expect(res.isCorrect).toBe(true);
    // Group 1 now fully collected (1, 3, 2) -> advance to group 2.
    expect(mgr.getActiveGroup()).toBe(2);
  });
});

describe("BombManager - reset", () => {
  it("clears all progress and sequence tracking", () => {
    const mgr = new BombManager(buildBombs());
    mgr.handleBombClick(1, 1);
    mgr.handleBombClick(1, 2);
    mgr.reset();

    expect(mgr.isGameStarted()).toBe(false);
    expect(mgr.getActiveGroup()).toBeNull();
    expect(mgr.getNextBombOrder()).toBeNull();
    expect(mgr.getCollectedBombs().size).toBe(0);
    expect(mgr.getCorrectOrderCount()).toBe(0);
  });
});
