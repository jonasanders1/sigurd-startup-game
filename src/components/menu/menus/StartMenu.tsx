import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import { PixelBezel } from "@/components/ui/pixel-bezel";
import { useStateStore } from "../../../stores/gameStore";

import { Joystick, Maximize, Minimize, Play, Settings } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useFullscreen } from "../../../hooks/useFullscreen";

const StartMenu: React.FC = () => {
  const { gameStateManager } = useStateStore.getState();
  const { isFullscreen, toggleFullscreen } = useFullscreen();
  const gameContainerRef = useRef<HTMLDivElement>(null);

  const startGame = () => {
    gameStateManager?.startNewGame();
  };

  const openSettings = () => {
    gameStateManager?.openSettings();
  };

  const openControls = () => {
    gameStateManager?.openControls();
  };

  const handleFullscreenToggle = () => {
    const gameElement = gameContainerRef.current?.closest(
      "sigurd-startup"
    ) as HTMLElement;
    if (gameElement) {
      toggleFullscreen(gameElement);
    } else {
      toggleFullscreen();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={handleFullscreenToggle}
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 text-foreground hover:text-primary"
            >
              {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
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
        <h1 className="text-4xl font-pixel text-foreground tracking-wide mb-2">
          SIGURD STARTUP
        </h1>
        <p className="text-sm text-[var(--foreground-dim)]">
          Samle så mye finansiering som mulig!
        </p>
      </div>

      <div className="space-y-3 w-[70%]">
        <Button onClick={startGame} className="w-full uppercase text-lg">
          <Play size={20} />
          Press Start
        </Button>

        <Button onClick={openSettings} variant="secondary" className="w-full uppercase">
          <Settings size={20} />
          Innstillinger
        </Button>

        <Button onClick={openControls} variant="secondary" className="w-full uppercase">
          <Joystick size={20} />
          Kontroller
        </Button>
      </div>
    </div>
  );
};

export default StartMenu;
