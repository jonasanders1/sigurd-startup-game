/**
 * Founding-sequence validation tests.
 *
 * Pins the core "collect foundings in order" rule (game-specs §5):
 *  - the first founding clicked starts the run and is always counted correct;
 *  - after that, only the lowest uncollected order in the active group is
 *    "correct"; clicking out of order still collects the founding but scores
 *    it as incorrect and does not advance the target;
 *  - finishing a group advances to the next group by ascending group number;
 *  - the run completes once every founding is collected.
 *
 * FoundingManager owns this state (per CLAUDE.md §5 "state lives in one
 * place"), so it is exercised through its public API only.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { FoundingManager } from "./foundingManager";
import type { Founding } from "../types/interfaces";

const makeFounding = (group: number, order: number): Founding => ({
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
const buildFoundings = (): Founding[] => [
  makeFounding(1, 1),
  makeFounding(1, 2),
  makeFounding(1, 3),
  makeFounding(2, 1),
  makeFounding(2, 2),
];

describe("FoundingManager - starting a run", () => {
  let mgr: FoundingManager;
  beforeEach(() => {
    mgr = new FoundingManager(buildFoundings());
  });

  it("is not started before the first click", () => {
    expect(mgr.isGameStarted()).toBe(false);
    expect(mgr.getActiveGroup()).toBeNull();
  });

  it("counts the first click as correct regardless of order", () => {
    const res = mgr.handleFoundingClick(1, 3); // start on order 3, not 1
    expect(res).toEqual({
      isValid: true,
      isCorrect: true,
      gameCompleted: false,
    });
    expect(mgr.isGameStarted()).toBe(true);
    expect(mgr.getActiveGroup()).toBe(1);
    // Next target is the lowest still-uncollected order in the group.
    expect(mgr.getNextFoundingOrder()).toBe(1);
    expect(mgr.getCorrectOrderCount()).toBe(1);
  });
});

describe("FoundingManager - in-order collection", () => {
  let mgr: FoundingManager;
  beforeEach(() => {
    mgr = new FoundingManager(buildFoundings());
  });

  it("accepts the full ascending sequence as correct", () => {
    expect(mgr.handleFoundingClick(1, 1).isCorrect).toBe(true);
    expect(mgr.getNextFoundingOrder()).toBe(2);
    expect(mgr.handleFoundingClick(1, 2).isCorrect).toBe(true);
    expect(mgr.getNextFoundingOrder()).toBe(3);
    expect(mgr.handleFoundingClick(1, 3).isCorrect).toBe(true);
  });

  it("advances to the next group by ascending group number", () => {
    mgr.handleFoundingClick(1, 1);
    mgr.handleFoundingClick(1, 2);
    mgr.handleFoundingClick(1, 3); // completes group 1
    expect(mgr.getActiveGroup()).toBe(2);
    expect(mgr.getNextFoundingOrder()).toBe(1);
  });

  it("reports gameCompleted only after the final founding", () => {
    mgr.handleFoundingClick(1, 1);
    mgr.handleFoundingClick(1, 2);
    mgr.handleFoundingClick(1, 3);
    mgr.handleFoundingClick(2, 1);
    const last = mgr.handleFoundingClick(2, 2);
    expect(last.gameCompleted).toBe(true);
    expect(mgr.getActiveGroup()).toBeNull();
    expect(mgr.getNextFoundingOrder()).toBeNull();
  });
});

describe("FoundingManager - out-of-order collection", () => {
  let mgr: FoundingManager;
  beforeEach(() => {
    mgr = new FoundingManager(buildFoundings());
    mgr.handleFoundingClick(1, 1); // start; next target is order 2
  });

  it("collects a wrong-order founding but scores it incorrect", () => {
    const res = mgr.handleFoundingClick(1, 3); // skips order 2
    expect(res.isValid).toBe(true);
    expect(res.isCorrect).toBe(false);
    // Target is unchanged — order 2 is still expected.
    expect(mgr.getNextFoundingOrder()).toBe(2);
    // It is still marked collected, just not "correct".
    expect(mgr.getCollectedFoundings().has("1-3")).toBe(true);
    expect(mgr.getCorrectFoundings().has("1-3")).toBe(false);
  });

  it("does not increase the correct-order count on a wrong click", () => {
    const before = mgr.getCorrectOrderCount();
    mgr.handleFoundingClick(1, 3);
    expect(mgr.getCorrectOrderCount()).toBe(before);
  });

  it("rejects a second click on an already-collected founding", () => {
    mgr.handleFoundingClick(1, 3);
    const again = mgr.handleFoundingClick(1, 3);
    expect(again).toEqual({
      isValid: false,
      isCorrect: false,
      gameCompleted: false,
    });
  });

  it("still recognizes the correct founding after a wrong detour", () => {
    mgr.handleFoundingClick(1, 3); // wrong
    const res = mgr.handleFoundingClick(1, 2); // back on target
    expect(res.isCorrect).toBe(true);
    // Group 1 now fully collected (1, 3, 2) -> advance to group 2.
    expect(mgr.getActiveGroup()).toBe(2);
  });
});

describe("FoundingManager - reset", () => {
  it("clears all progress and sequence tracking", () => {
    const mgr = new FoundingManager(buildFoundings());
    mgr.handleFoundingClick(1, 1);
    mgr.handleFoundingClick(1, 2);
    mgr.reset();

    expect(mgr.isGameStarted()).toBe(false);
    expect(mgr.getActiveGroup()).toBeNull();
    expect(mgr.getNextFoundingOrder()).toBeNull();
    expect(mgr.getCollectedFoundings().size).toBe(0);
    expect(mgr.getCorrectOrderCount()).toBe(0);
  });
});
