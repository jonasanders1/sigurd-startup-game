/**
 * Reason-set pause-clock helpers used by the three managers that share the
 * same shape (ScalingManager, OptimizedSpawnManager, OptimizedRespawnManager).
 *
 * The bug this helper solves: `totalPausedTime` is only bumped on resume,
 * so during an active pause it under-counts the real elapsed pause by the
 * in-progress duration. Any consumer reading "adjusted time" during the
 * pause (the spawn/respawn countdown indicators, monster age for scaling)
 * would otherwise keep advancing while gameplay is halted. The helper
 * always reports the effective paused duration including the live window.
 */

export interface PauseClockState {
  isPaused: boolean;
  pauseStartTime: number;
  totalPausedTime: number;
}

/**
 * Returns the effective total paused duration: completed pauses plus the
 * still-running pause window (if any).
 */
export const getEffectivePausedMs = (
  state: PauseClockState,
  now: number = Date.now()
): number =>
  state.totalPausedTime +
  (state.isPaused ? now - state.pauseStartTime : 0);
