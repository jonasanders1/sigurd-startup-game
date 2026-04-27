import React from "react";
import { Button } from "@/components/ui/button";
import { useStateStore } from "../../../stores/gameStore";
import { ArrowRight, Home, Trophy, Flag } from "lucide-react";
import { TutorialMissionId } from "../../../types/enums";

const headlineFor = (
  reason: "complete" | "skipped",
  missionId: TutorialMissionId | undefined,
  stats: Record<string, number | string> | undefined
): { title: string; flavor: string } => {
  if (reason === "skipped") {
    return {
      title: "Hoppet over",
      flavor: "Greit. Du gjør det på din måte.",
    };
  }

  switch (missionId) {
    case TutorialMissionId.MOVEMENTS:
      return {
        title: "Bevegelse mestret",
        flavor: "Du beveger deg som en konsulent på timepris.",
      };
    case TutorialMissionId.BOMBS:
      return {
        title: "Skjemajungelen klar",
        flavor: "Skattefunn-godkjent — eller i det minste innsendt.",
      };
    case TutorialMissionId.SURVIVE:
      return {
        title: "Du overlevde",
        flavor: "Byråkratene stoppet for kaffepause. Lykke til neste gang.",
      };
    case TutorialMissionId.KILL: {
      const ryggvind = stats?.["ryggvind"];
      const flavor = ryggvind
        ? `${ryggvind} gikk ut. Tilbake til søknadsskjemaet.`
        : "Effekten gikk ut. Tilbake til søknadsskjemaet.";
      return { title: "Politisk Ryggvind aktivert", flavor };
    }
    default:
      return { title: "Fullført", flavor: "" };
  }
};

const TutorialResultMenu: React.FC = () => {
  const tutorialResult = useStateStore((s) => s.tutorialResult);
  const { gameStateManager } = useStateStore.getState();

  if (!tutorialResult) return null;
  const { reason, missionId, stats } = tutorialResult;
  const { title, flavor } = headlineFor(reason, missionId, stats);
  const Icon = reason === "complete" ? Trophy : Flag;

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 max-w-md text-center">
      <Icon
        size={36}
        className={`mb-3 ${
          reason === "complete" ? "text-primary" : "text-[var(--foreground-dim)]"
        }`}
      />
      <h1 className="text-3xl font-pixel text-foreground tracking-wide mb-1">
        {title}
      </h1>
      {flavor && (
        <p className="text-xs font-mono text-[var(--foreground-dim)] mb-4 italic">
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

      <div className="flex gap-3 mt-5">
        <Button
          onClick={() => gameStateManager?.openTutorialSelect?.()}
          className="uppercase text-sm"
        >
          <ArrowRight size={16} />
          Velg oppdrag
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

export default TutorialResultMenu;
