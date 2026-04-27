/**
 * Drives tutorial mission state: tracks sub-task progress, watches for the
 * mission's completion condition, and reports results back to the state store.
 *
 * Each frame the GameManager calls update(deltaTime); the manager checks
 * mission-specific conditions and may finish the mission. Skip is exposed via
 * UI and routes through finish(reason: "skipped").
 */

import { TutorialMissionId } from "../types/enums";
import { TUTORIAL_MISSIONS, TutorialMission } from "../tutorials/missions";
import { useStateStore } from "../stores/game/stateStore";
import { useCoinStore } from "../stores/entities/coinStore";
import { useMonsterStore } from "../stores/entities/monsterStore";

type SubTaskId = "moveLeft" | "moveRight" | "jump" | "superJump" | "float";

export class TutorialManager {
  private currentMission: TutorialMission | null = null;
  private missionStartTime = 0;
  private monsterCountAtStart = 0;
  private powerModeWasActive = false;

  public startMission(id: TutorialMissionId): void {
    this.currentMission = TUTORIAL_MISSIONS[id];
    this.missionStartTime = Date.now();
    this.powerModeWasActive = false;
    const stateStore = useStateStore.getState();
    stateStore.setTutorialMission(id);
    stateStore.setTutorialResult(null);
  }

  public exitMission(): void {
    this.currentMission = null;
    const stateStore = useStateStore.getState();
    stateStore.setTutorialMission(null);
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
          this.finish("complete", { sub_tasks: `${done}/${total}` });
        }
        break;
      }

      case TutorialMissionId.BOMBS: {
        // All bombs collected (regardless of order) → done. Stats: correct/total.
        const { bombs, correctOrderCount } = useStateStore.getState();
        const collected = bombs.filter((b) => b.isCollected).length;
        if (mission.totalBombs && collected >= mission.totalBombs) {
          this.finish("complete", {
            correct_order: `${correctOrderCount}/${mission.totalBombs}`,
          });
        }
        break;
      }

      case TutorialMissionId.SURVIVE: {
        const elapsed = Date.now() - this.missionStartTime;
        if (mission.surviveDurationMs && elapsed >= mission.surviveDurationMs) {
          this.finish("complete", {
            survived: `${Math.floor(elapsed / 1000)}s`,
          });
        }
        break;
      }

      case TutorialMissionId.KILL: {
        // Mission completes when power mode ENDS (was on, now off).
        const powerActive =
          useCoinStore.getState().activeEffects?.powerMode === true;
        if (this.powerModeWasActive && !powerActive) {
          const monsters = useMonsterStore.getState().monsters;
          const dead = monsters.filter((m) => m.isDead).length;
          this.finish("complete", {
            killed: `${dead}/${mission.totalMonsters ?? monsters.length}`,
          });
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
    stateStore.setTutorialResult({ reason, stats });
    this.currentMission = null;
    stateStore.setTutorialMission(null);
  }
}
