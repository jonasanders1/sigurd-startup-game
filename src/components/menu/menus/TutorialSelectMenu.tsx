import React from "react";
import { Button } from "@/components/ui/button";
import { useStateStore } from "../../../stores/gameStore";
import { ArrowLeft, GraduationCap } from "lucide-react";
import {
  TUTORIAL_MISSIONS,
  TUTORIAL_MISSION_ORDER,
} from "../../../tutorials/missions";
import { TutorialMissionId } from "../../../types/enums";

const TutorialSelectMenu: React.FC = () => {
  const { gameStateManager } = useStateStore.getState();

  const start = (id: TutorialMissionId) => {
    gameStateManager?.startTutorialMission?.(id);
  };

  const back = () => {
    gameStateManager?.quitToMenu?.();
  };

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-4 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <GraduationCap size={28} className="text-primary" />
        <h1 className="text-3xl font-pixel text-foreground tracking-wide">
          Tutorial
        </h1>
      </div>

      <div className="grid grid-cols-2 gap-3 w-full mb-6">
        {TUTORIAL_MISSION_ORDER.map((id, idx) => {
          const m = TUTORIAL_MISSIONS[id];
          return (
            <button
              key={id}
              onClick={() => start(id)}
              className="text-left bg-[var(--surface)] hover:bg-[var(--surface-raised)] border-2 border-[var(--surface-line)] rounded-sm p-4 transition-colors cursor-pointer"
            >
              <div className="text-xs font-mono text-[var(--foreground-dim)] mb-1">
                Oppdrag {idx + 1}
              </div>
              <div className="font-pixel text-base text-foreground tracking-wider mb-1">
                {m.title}
              </div>
              <div className="text-xs text-[var(--foreground-dim)] font-mono leading-snug">
                {m.description}
              </div>
            </button>
          );
        })}
      </div>

      <Button onClick={back} variant="secondary" className="uppercase text-sm">
        <ArrowLeft size={16} />
        Tilbake
      </Button>
    </div>
  );
};

export default TutorialSelectMenu;
