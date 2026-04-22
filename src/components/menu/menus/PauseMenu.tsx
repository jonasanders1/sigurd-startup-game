import React from "react";
import { Button } from "@/components/ui/button";
import { useStateStore } from "../../../stores/gameStore";

import { Play, Settings, Home, RotateCcw } from "lucide-react";

const PauseMenu: React.FC = () => {
  const { gameStateManager } = useStateStore.getState();

  const resumeGame = () => {
    gameStateManager?.resumeGame();
  };

  const openSettings = () => {
    gameStateManager?.openSettings();
  };

  const quitToMenu = () => {
    gameStateManager?.quitToMenu();
  };

  const restartGame = () => {
    gameStateManager?.restartGame();
  };

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="text-center mb-6">
        <h1 className="text-5xl font-pixel text-foreground tracking-wide">PAUSE</h1>
        <p className="text-sm text-[var(--foreground-dim)] mt-2">Trykk P for å fortsette</p>
      </div>

      <div className="space-y-3 w-64">
        <Button onClick={resumeGame} className="w-full uppercase">
          <Play size={20} />
          Fortsett
        </Button>

        <Button onClick={openSettings} variant="secondary" className="w-full uppercase">
          <Settings size={20} />
          Innstillinger
        </Button>

        <Button onClick={restartGame} variant="secondary" className="w-full uppercase">
          <RotateCcw size={20} />
          Start på nytt
        </Button>

        <button
          onClick={quitToMenu}
          className="w-full text-[var(--foreground-dim)] text-sm font-mono underline underline-offset-4 hover:text-primary py-2 cursor-pointer"
        >
          Avslutt til hovedmeny
        </button>
      </div>
    </div>
  );
};

export default PauseMenu;
