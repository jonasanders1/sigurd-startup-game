/**
 * Drives tutorial mission state: tracks sub-task progress, watches for the
 * mission's completion condition, and reports results back to the state store.
 *
 * Each frame the GameManager calls update(deltaTime); the manager checks
 * mission-specific conditions and may finish the mission. Skip is exposed via
 * UI and routes through finish(reason: "skipped").
 */

import { TutorialMissionId, CoinType } from "../types/enums";
import {
  TUTORIAL_MISSIONS,
  TutorialMission,
  P_COIN_TUTORIAL_INFO,
} from "../tutorials/missions";
import { P_COIN_COLORS } from "../config/coinTypes";
import { useStateStore } from "../stores/game/stateStore";
import { useCoinStore } from "../stores/entities/coinStore";
import { useMonsterStore } from "../stores/entities/monsterStore";

export type SubTaskId =
  | "moveLeft"
  | "moveRight"
  | "jump"
  | "superJump"
  | "float"
  | "fall";

const closestPcoinIndexByDuration = (durationMs: number): number => {
  let bestIndex = 0;
  let bestDelta = Infinity;
  for (let i = 0; i < P_COIN_COLORS.length; i++) {
    const delta = Math.abs(P_COIN_COLORS[i].duration - durationMs);
    if (delta < bestDelta) {
      bestDelta = delta;
      bestIndex = i;
    }
  }
  return bestIndex;
};

export class TutorialManager {
  private currentMission: TutorialMission | null = null;
  private missionStartTime = 0;
  private monsterCountAtStart = 0;
  private powerModeWasActive = false;
  private activePcoinIndex: number | null = null;

  public startMission(id: TutorialMissionId): void {
    this.currentMission = TUTORIAL_MISSIONS[id];
    this.missionStartTime = Date.now();
    this.powerModeWasActive = false;
    this.activePcoinIndex = null;
    const stateStore = useStateStore.getState();
    stateStore.setTutorialMission(id);
    stateStore.setTutorialResult(null);

    // Mission 4 needs a P-coin available immediately — the regular spawn rule
    // (every N firebombs) doesn't fire here since there are no firebombs.
    if (id === TutorialMissionId.KILL) {
      // Defer until after the level loader has installed the new CoinManager.
      setTimeout(() => {
        const coinManager = useCoinStore.getState().coinManager;
        const map = TUTORIAL_MISSIONS[id].map;
        const sp = map.coinSpawnPoints?.[0];
        if (coinManager && sp) {
          coinManager.spawnCoin(CoinType.POWER, sp.x, sp.y, sp.spawnAngle);
        }
      }, 100);
    }
  }

  public exitMission(): void {
    this.currentMission = null;
    this.activePcoinIndex = null;
    const stateStore = useStateStore.getState();
    stateStore.setTutorialMission(null);
    stateStore.setTutorialActivePcoinIndex(null);
  }

  public isActive(): boolean {
    return this.currentMission !== null;
  }

  public getCurrentMission(): TutorialMission | null {
    return this.currentMission;
  }

  public markSubTask(id: SubTaskId): void {
    if (!this.currentMission) return;
    if (this.currentMission.id !== TutorialMissionId.MOVEMENTS) return;
    useStateStore.getState().markTutorialSubTask(id);
  }

  /**
   * Per-frame check. Each branch is the completion condition for its mission.
   */
  public update(): void {
    if (!this.currentMission) return;
    const mission = this.currentMission;

    switch (mission.id) {
      case TutorialMissionId.MOVEMENTS: {
        const total = mission.subTasks?.length ?? 0;
        const done = useStateStore.getState().tutorialSubTasks.length;
        if (total > 0 && done >= total) {
          const elapsed = ((Date.now() - this.missionStartTime) / 1000).toFixed(1);
          this.finish("complete", {
            øvelser: `${done}/${total}`,
            tid: `${elapsed}s`,
          });
        }
        break;
      }

      case TutorialMissionId.BOMBS: {
        const { bombs, correctOrderCount } = useStateStore.getState();
        const collected = bombs.filter((b) => b.isCollected).length;
        if (mission.totalBombs && collected >= mission.totalBombs) {
          this.finish("complete", {
            plukket: `${collected}/${mission.totalBombs}`,
            "riktig rekkefølge": `${correctOrderCount}/${mission.totalBombs}`,
          });
        }
        break;
      }

      case TutorialMissionId.SURVIVE: {
        const elapsed = Date.now() - this.missionStartTime;
        if (mission.surviveDurationMs && elapsed >= mission.surviveDurationMs) {
          this.finish("complete", {
            overlevde: `${Math.floor(elapsed / 1000)}s`,
            mål: `${Math.floor(mission.surviveDurationMs / 1000)}s`,
          });
        }
        break;
      }

      case TutorialMissionId.KILL: {
        // Mission completes when power mode ENDS (was on, now off).
        const coinState = useCoinStore.getState();
        const powerActive = coinState.activeEffects?.powerMode === true;

        // Rising edge: identify which P-coin tier the player just activated by
        // matching the live remaining duration against P_COIN_COLORS.
        if (powerActive && !this.powerModeWasActive) {
          const endTime = coinState.activeEffects?.powerModeEndTime ?? 0;
          const totalDuration = endTime - Date.now();
          this.activePcoinIndex = closestPcoinIndexByDuration(totalDuration);
          useStateStore
            .getState()
            .setTutorialActivePcoinIndex(this.activePcoinIndex);
        }

        if (this.powerModeWasActive && !powerActive) {
          const monsters = useMonsterStore.getState().monsters;
          const dead = monsters.filter((m) => m.isDead).length;
          const total = mission.totalMonsters ?? monsters.length;
          const stats: Record<string, number | string> = {
            "byråkrater nedlagt": `${dead}/${total}`,
          };
          if (this.activePcoinIndex !== null) {
            stats["ryggvind"] =
              P_COIN_TUTORIAL_INFO[this.activePcoinIndex]?.label ?? "";
          }
          this.finish("complete", stats);
          return;
        }
        this.powerModeWasActive = powerActive;
        break;
      }
    }
  }

  /**
   * Called by external code when the player dies (loses a life). For Survive
   * mission, death = retry; for Kill mission, death = mission ends with stats.
   */
  public onPlayerDeath(): void {
    if (!this.currentMission) return;
    if (this.currentMission.id === TutorialMissionId.SURVIVE) {
      // Restart timer + sub-tasks; map will respawn player via the existing
      // life-loss flow.
      this.missionStartTime = Date.now();
    }
  }

  public skipMission(): void {
    this.finish("skipped");
  }

  private finish(
    reason: "complete" | "skipped",
    stats?: Record<string, number | string>
  ): void {
    const stateStore = useStateStore.getState();
    const missionId = this.currentMission?.id;
    stateStore.setTutorialResult({ missionId, reason, stats });
    stateStore.setTutorialActivePcoinIndex(null);
    this.currentMission = null;
    this.activePcoinIndex = null;
    stateStore.setTutorialMission(null);
  }
}
