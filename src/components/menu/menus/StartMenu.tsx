import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import { useGameStore } from "../../../stores/gameStore";

import { Maximize, Minimize, Play, Settings } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useFullscreen } from "../../../hooks/useFullscreen";

const StartMenu: React.FC = () => {
  const { gameStateManager } = useGameStore();
  const { isFullscreen, toggleFullscreen } = useFullscreen();
  const gameContainerRef = useRef<HTMLDivElement>(null);

  const startGame = () => {
    // Use centralized state transition
    gameStateManager?.startNewGame();
  };

  const openSettings = () => {
    // Use centralized settings transition
    gameStateManager?.openSettings();
  };

  const handleFullscreenToggle = () => {
    // Find the game container element (the shadow root host)
    const gameElement = gameContainerRef.current?.closest(
      "sigurd-startup"
    ) as HTMLElement;
    if (gameElement) {
      toggleFullscreen(gameElement);
    } else {
      // Fallback to document element if game element not found
      toggleFullscreen();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full rounded-lg">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={handleFullscreenToggle}
              variant="outline"
              className="absolute top-4 right-4 bg-background-80 text-foreground backdrop-blur-sm border-none hover:bg-primary hover:text-black h-10 w-10"
            >
              {isFullscreen ? (
                <Minimize
                  className="text-foreground hover:text-primary"
                  size={24}
                />
              ) : (
                <Maximize
                  className="text-foreground hover:text-primary"
                  size={24}
                />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isFullscreen
              ? "Avslutt fullskjerm (F11 eller F)"
              : "Fullskjerm (F11 eller F)"}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-2 font-pixel">
          Sigurd Startup
        </h1>
        <p className="text-muted-foreground">
          Samle så mye finansiering som mulig!
        </p>
      </div>

      <div className="space-y-4 w-[70%]">
        <Button
          onClick={startGame}
          className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 text-lg transition-all duration-200 uppercase flex items-center justify-center gap-2"
        >
          <Play size={20} />
          Start
        </Button>

        <Button
          onClick={openSettings}
          variant="outline"
          className="w-full border-secondary text-muted-foreground hover:bg-secondary hover:text-white font-bold py-3 text-lg transition-all duration-200 uppercase flex items-center justify-center gap-2"
        >
          <Settings size={20} />
          Innstillinger
        </Button>
      </div>
    </div>
  );
};

export default StartMenu;
