/**
 * ScalingManager pause-state tests.
 *
 * Pins the fix for "difficulty rises while paused": startMap()/resetOnDeath()
 * used to replace the pause state with a fresh UNPAUSED one, silently
 * resuming the difficulty clock during map-cleared/bonus/countdown screens
 * (which hold a pause reason the whole time).
 */

import { describe, it, expect, beforeEach } from "vitest";
import { ScalingManager } from "./ScalingManager";
import { PauseReason } from "../types/enums";

describe("ScalingManager - pause reasons survive clock resets", () => {
  const mgr = ScalingManager.getInstance();

  beforeEach(() => {
    mgr.cleanup(); // fresh pause state + caches
  });

  it("startMap preserves an active pause reason", () => {
    mgr.pause(PauseReason.Default);
    mgr.startMap();
    expect(mgr.isPaused()).toBe(true);
    expect(mgr.getPauseReasons()).toContain(PauseReason.Default);
    // ...and the preserved reason still resumes normally.
    mgr.resume(PauseReason.Default);
    expect(mgr.isPaused()).toBe(false);
  });

  it("resetOnDeath preserves the power-mode pause", () => {
    mgr.pauseForPowerMode();
    mgr.resetOnDeath();
    expect(mgr.isCurrentlyPausedByPowerMode()).toBe(true);
    mgr.resumeFromPowerMode();
    expect(mgr.isPaused()).toBe(false);
  });

  it("stays unpaused when no reasons were active at reset", () => {
    mgr.startMap();
    expect(mgr.isPaused()).toBe(false);
    expect(mgr.getPauseReasons()).toHaveLength(0);
  });

  it("preserves multiple stacked reasons through a reset", () => {
    mgr.pause(PauseReason.Default);
    mgr.pause(PauseReason.PowerMode);
    mgr.startMap();
    expect(mgr.getPauseReasons()).toHaveLength(2);
    // Removing one reason keeps the other holding the pause.
    mgr.resume(PauseReason.PowerMode);
    expect(mgr.isPaused()).toBe(true);
    mgr.resume(PauseReason.Default);
    expect(mgr.isPaused()).toBe(false);
  });
});
