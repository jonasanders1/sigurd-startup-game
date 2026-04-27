import React from "react";
import { useStateStore } from "../../../stores/gameStore";
import {
  TUTORIAL_MISSIONS,
  TUTORIAL_MISSION_ORDER,
} from "../../../tutorials/missions";
import { Check } from "lucide-react";

/**
 * Replaces the score/multiplier area in InGameMenu when a tutorial mission is
 * active. Shows the mission goal (or sub-task checklist for Mission 1) and a
 * Skip button.
 */
const TutorialHUD: React.FC = () => {
  const tutorialMission = useStateStore((s) => s.tutorialMission);
  const tutorialSubTasks = useStateStore((s) => s.tutorialSubTasks);
  const { gameStateManager } = useStateStore.getState();

  if (!tutorialMission) return null;
  const mission = TUTORIAL_MISSIONS[tutorialMission];

  const skip = () => gameStateManager?.skipTutorialMission?.();
  const idx = TUTORIAL_MISSION_ORDER.indexOf(tutorialMission);

  return (
    <div className="flex items-center gap-4 px-4 py-1">
      <div className="text-xs font-mono text-[var(--foreground-dim)] whitespace-nowrap">
        Oppdrag {idx + 1}
      </div>

      {mission.subTasks ? (
        <div className="flex items-center gap-3 flex-wrap">
          {mission.subTasks.map((task) => {
            const done = tutorialSubTasks.includes(task.id);
            return (
              <div
                key={task.id}
                className={`flex items-center gap-1 text-xs font-mono ${
                  done
                    ? "text-primary line-through"
                    : "text-[var(--foreground-dim)]"
                }`}
              >
                {done ? (
                  <Check size={12} />
                ) : (
                  <span className="inline-block w-3 h-3 border border-current rounded-full" />
                )}
                {task.label}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-sm font-pixel text-foreground tracking-wider">
          {mission.goal}
        </div>
      )}

      <button
        onClick={skip}
        className="ml-auto text-xs font-mono text-[var(--foreground-dim)] underline underline-offset-2 hover:text-primary cursor-pointer whitespace-nowrap"
      >
        Hopp over
      </button>
    </div>
  );
};

export default TutorialHUD;
