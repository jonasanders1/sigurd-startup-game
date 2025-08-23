import React from "react";
import { Button } from "@/components/ui/button";
import { useGameStore } from "../../../stores/gameStore";

import { Play, Settings, Home, RotateCcw } from "lucide-react";

const PauseMenu: React.FC = () => {
  const { gameStateManager } = useGameStore();

  const resumeGame = () => {
    // Use centralized resume transition
    gameStateManager?.resumeGame();
  };

  const openSettings = () => {
    // Use centralized settings transition
    gameStateManager?.openSettings();
  };

  const quitToMenu = () => {
    // Use centralized quit to menu transition
    gameStateManager?.quitToMenu();
  };

  const restartGame = () => {
    // Use centralized restart transition
    gameStateManager?.restartGame();
  };

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="space-y-4">
        <Button
          onClick={resumeGame}
          className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 text-md transition-all duration-200 uppercase flex items-center justify-center gap-2"
        >
          <Play size={20} />
          Fortsett
        </Button>

        <Button
          onClick={openSettings}
          variant="outline"
          className="w-full border-secondary text-muted-foreground bg-secondary hover:text-white font-bold py-3 text-md transition-all duration-200 uppercase flex items-center justify-center gap-2"
        >
          <Settings size={20} />
          Innstillinger
        </Button>

        <Button
          onClick={restartGame}
          variant="outline"
          className="w-full border-secondary text-muted-foreground bg-secondary hover:text-white font-bold py-3 text-md transition-all duration-200 uppercase flex items-center justify-center gap-2"
        >
          <RotateCcw size={20} />
          Start på nytt
        </Button>

        <Button
          onClick={quitToMenu}
          variant="default"
          className="w-full bg-destructive text-white font-bold py-3 text-md transition-all duration-200 uppercase flex items-center justify-center gap-2"
        >
          <Home size={20} />
          hovedmeny
        </Button>
      </div>
    </div>
  );
};

export default PauseMenu;
