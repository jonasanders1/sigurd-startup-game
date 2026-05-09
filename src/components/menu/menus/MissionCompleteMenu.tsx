import React from "react";
import { Button } from "@/components/ui/button";
import { useStateStore } from "../../../stores/gameStore";
import { ArrowLeft, ArrowRight, Home } from "lucide-react";
import { TutorialMissionId } from "../../../types/enums";
import {
  TUTORIAL_MISSIONS,
  TUTORIAL_MISSION_ORDER,
} from "../../../tutorials/missions";

const flavorFor = (
  reason: "complete" | "skipped",
  missionId: TutorialMissionId | undefined,
  stats: Record<string, number | string> | undefined
): string => {
  if (reason === "skipped") return "Greit. Du gjør det på din måte.";
  switch (missionId) {
    case TutorialMissionId.MOVEMENTS:
      return "Du beveger deg som en konsulent på timepris.";
    case TutorialMissionId.FOUNDINGS:
      return "Skattefunn-godkjent — eller i det minste innsendt.";
    case TutorialMissionId.SURVIVE:
      return "Byråkratene stoppet for kaffepause. Lykke til neste gang.";
    case TutorialMissionId.KILL: {
      const ryggvind = stats?.["ryggvind"];
      return ryggvind
        ? `${ryggvind} gikk ut. Tilbake til søknadsskjemaet.`
        : "Effekten gikk ut. Tilbake til søknadsskjemaet.";
    }
    default:
      return "";
  }
};

const MissionCompleteMenu: React.FC = () => {
  const tutorialResult = useStateStore((s) => s.tutorialResult);
  const { gameStateManager } = useStateStore.getState();

  if (!tutorialResult) return null;
  const { reason, missionId, stats } = tutorialResult;
  const mission = missionId ? TUTORIAL_MISSIONS[missionId] : undefined;
  const flavor = flavorFor(reason, missionId, stats);
  const statusLabel = reason === "complete" ? "Fullført!" : "Hoppet over";

  const idx = missionId ? TUTORIAL_MISSION_ORDER.indexOf(missionId) : -1;
  const hasPrev = idx > 0;
  const hasNext = idx >= 0 && idx < TUTORIAL_MISSION_ORDER.length - 1;

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 max-w-md text-center">
      {mission && (
        <h1 className="text-3xl font-pixel text-foreground tracking-wide mb-1 leading-tight">
          {mission.title}
        </h1>
      )}
      <div
        className={`text-sm font-pixel uppercase tracking-[0.2em] mb-4 ${
          reason === "complete" ? "text-primary" : "text-[var(--foreground-dim)]"
        }`}
      >
        {statusLabel}
      </div>
      {flavor && (
        <p className="text-xs font-mono text-[var(--foreground-dim)] mb-4 italic text-balance max-w-[320px]">
          {flavor}
        </p>
      )}

      {stats && Object.keys(stats).length > 0 && (
        <div className="flex flex-col gap-1.5 my-2 text-sm font-mono w-full max-w-[260px]">
          {Object.entries(stats).map(([k, v], i, arr) => (
            <div
              key={k}
              className={`flex items-center justify-between gap-6 py-1 ${
                i < arr.length - 1
                  ? "border-b border-dashed border-[var(--surface-line)]"
                  : ""
              }`}
            >
              <span className="uppercase text-[var(--foreground-dim)] text-xs tracking-wide">
                {k}
              </span>
              <span className="text-foreground">{v}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-3 mt-5 flex-wrap justify-center">
        <Button
          onClick={() => gameStateManager?.goToPreviousTutorialMission?.()}
          variant="secondary"
          disabled={!hasPrev}
          className="uppercase text-sm"
        >
          <ArrowLeft size={16} />
          Tilbake
        </Button>
        <Button
          onClick={() => gameStateManager?.goToNextTutorialMission?.()}
          disabled={!hasNext}
          className="uppercase text-sm"
        >
          Neste
          <ArrowRight size={16} />
        </Button>
        <Button
          onClick={() => gameStateManager?.quitToMenu?.()}
          variant="secondary"
          className="uppercase text-sm"
        >
          <Home size={16} />
          Hovedmeny
        </Button>
      </div>
    </div>
  );
};

export default MissionCompleteMenu;
