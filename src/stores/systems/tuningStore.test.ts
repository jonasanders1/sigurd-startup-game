import { describe, it, expect, beforeEach } from "vitest";
import { useTuningStore, getTuned, getTuningVersion } from "./tuningStore";

beforeEach(() => {
  // Fresh store state per test.
  useTuningStore.getState().resetAll();
});

describe("tuningStore", () => {
  it("returns the default when no override exists", () => {
    expect(getTuned("PLAYER_MOVE_SPEED")).toBe(4);
  });

  it("returns the override when set", () => {
    useTuningStore.getState().set("PLAYER_MOVE_SPEED", 8);
    expect(getTuned("PLAYER_MOVE_SPEED")).toBe(8);
  });

  it("falls back to default after resetKey", () => {
    useTuningStore.getState().set("PLAYER_MOVE_SPEED", 8);
    useTuningStore.getState().resetKey("PLAYER_MOVE_SPEED");
    expect(getTuned("PLAYER_MOVE_SPEED")).toBe(4);
  });

  it("resetSection clears all keys in a section", () => {
    const t = useTuningStore.getState();
    t.set("BUREAUCRAT_BASE_SPEED", 5);
    t.set("BUREAUCRAT_MAX_SPEED", 12);
    t.set("WISP_BASE_SPEED", 5); // different section
    t.resetSection("Bureaucrat");
    expect(getTuned("BUREAUCRAT_BASE_SPEED")).toBe(1);   // default
    expect(getTuned("BUREAUCRAT_MAX_SPEED")).toBe(4.5);  // default
    expect(getTuned("WISP_BASE_SPEED")).toBe(5);    // untouched
  });

  it("resetAll wipes every override", () => {
    const t = useTuningStore.getState();
    t.set("PLAYER_MOVE_SPEED", 9);
    t.set("BUREAUCRAT_BASE_SPEED", 9);
    t.resetAll();
    expect(getTuned("PLAYER_MOVE_SPEED")).toBe(4);
    expect(getTuned("BUREAUCRAT_BASE_SPEED")).toBe(1);
  });

  it("bumps version on every change", () => {
    const v0 = getTuningVersion();
    useTuningStore.getState().set("PLAYER_MOVE_SPEED", 5);
    expect(getTuningVersion()).toBe(v0 + 1);
    useTuningStore.getState().resetKey("PLAYER_MOVE_SPEED");
    expect(getTuningVersion()).toBe(v0 + 2);
  });

  it("warns and returns 0 for unknown key (defensive)", () => {
    expect(getTuned("DOES_NOT_EXIST_KEY")).toBe(0);
  });
});
