import React from "react";
import { Button } from "@/components/ui/button";
import { useStateStore } from "../../../stores/gameStore";
import {
  TUTORIAL_MISSIONS,
  TUTORIAL_MISSION_ORDER,
} from "../../../tutorials/missions";
import { ArrowLeft, Play, Target } from "lucide-react";

const MissionBriefMenu: React.FC = () => {
  const pending = useStateStore((s) => s.pendingTutorialMission);
  const { gameStateManager } = useStateStore.getState();

  if (!pending) return null;
  const mission = TUTORIAL_MISSIONS[pending];
  const idx = TUTORIAL_MISSION_ORDER.indexOf(pending);

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 max-w-lg w-full text-center">
      <div className="text-[10px] font-mono text-[var(--foreground-dim)] uppercase tracking-[0.2em] mb-2">
        Oppdrag {idx + 1} av {TUTORIAL_MISSION_ORDER.length}
      </div>
      <h1 className="text-3xl font-pixel text-foreground tracking-wide mb-5">
        {mission.title}
      </h1>

      <div className="w-full max-w-[340px] bg-[var(--surface-raised)] border-2 border-[var(--surface-line)] rounded-sm px-4 py-3 mb-4 shadow-[0_3px_0_0_rgba(0,0,0,0.3)]">
        <div className="flex items-center gap-2 justify-center mb-1.5">
          <Target size={12} className="text-primary" />
          <span className="text-[10px] font-mono text-primary uppercase tracking-[0.2em]">
            Mål
          </span>
        </div>
        <p className="font-pixel text-sm text-foreground leading-snug tracking-wide">
          {mission.goal}
        </p>
      </div>

      <p className="text-xs font-mono text-[var(--foreground-dim)] italic leading-relaxed text-balance max-w-[340px] mb-6">
        {mission.description}
      </p>

      <div className="flex gap-3">
        <Button
          onClick={() => gameStateManager?.openTutorialSelect?.()}
          variant="secondary"
          className="uppercase text-sm"
        >
          <ArrowLeft size={16} />
          Tilbake
        </Button>
        <Button
          onClick={() => gameStateManager?.startTutorialMission?.(pending)}
          className="uppercase text-sm"
        >
          <Play size={16} />
          Start
        </Button>
      </div>
    </div>
  );
};

export default MissionBriefMenu;
