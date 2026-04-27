import React from "react";
import { Button } from "@/components/ui/button";
import { useStateStore } from "../../../stores/gameStore";
import { ArrowRight, Home } from "lucide-react";

const TutorialResultMenu: React.FC = () => {
  const tutorialResult = useStateStore((s) => s.tutorialResult);
  const { gameStateManager } = useStateStore.getState();

  if (!tutorialResult) return null;

  const reasonText =
    tutorialResult.reason === "complete" ? "Fullført!" : "Hoppet over";

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 max-w-md text-center">
      <h1 className="text-3xl font-pixel text-foreground tracking-wide mb-2">
        {reasonText}
      </h1>

      {tutorialResult.stats && (
        <div className="flex flex-col gap-2 my-4 text-sm font-mono text-[var(--foreground-dim)]">
          {Object.entries(tutorialResult.stats).map(([k, v]) => (
            <div key={k} className="flex items-center justify-between gap-6">
              <span className="uppercase">{k.replace(/_/g, " ")}</span>
              <span className="text-foreground">{v}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-3 mt-4">
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
