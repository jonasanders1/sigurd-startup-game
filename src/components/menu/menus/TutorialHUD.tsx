import React from "react";
import { useStateStore } from "../../../stores/gameStore";
import {
  TUTORIAL_MISSIONS,
  TUTORIAL_MISSION_ORDER,
} from "../../../tutorials/missions";

/**
 * Top bar replacement when a tutorial mission is active. Just the mission name
 * + a skip link — sub-tasks / timers / hints live in TutorialOverlay.
 */
const TutorialHUD: React.FC = () => {
  const tutorialMission = useStateStore((s) => s.tutorialMission);
  const { gameStateManager } = useStateStore.getState();

  if (!tutorialMission) return null;
  const mission = TUTORIAL_MISSIONS[tutorialMission];
  const idx = TUTORIAL_MISSION_ORDER.indexOf(tutorialMission);

  return (
    <div className="flex items-center gap-3 w-full">
      <div className="text-xs font-mono text-[var(--foreground-dim)] uppercase tracking-wide whitespace-nowrap">
        Oppdrag <span className="text-foreground font-pixel">{idx + 1}</span>
      </div>
      <div className="w-px h-5 bg-[var(--surface-line)] shrink-0" />
      <div className="font-pixel text-sm text-foreground tracking-wider truncate">
        {mission.title}
      </div>
      <button
        onClick={() => gameStateManager?.skipTutorialMission?.()}
        className="ml-auto text-xs font-mono text-[var(--foreground-dim)] underline underline-offset-2 hover:text-primary cursor-pointer whitespace-nowrap"
      >
        Hopp over
      </button>
    </div>
  );
};

export default TutorialHUD;
