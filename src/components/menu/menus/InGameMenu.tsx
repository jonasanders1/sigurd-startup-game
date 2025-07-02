import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import { useGameStore } from "../../../stores/gameStore";
import { GameState, MenuType } from "../../../types/enums";
import {
  Play,
  Pause,
  Maximize,
  Minimize,
  Zap,
  CircleDollarSign,
  Map,
  Coffee,
} from "lucide-react";
import { calculateMultiplierProgress } from "../../../lib/scoringUtils";
import { useFullscreen } from "../../../hooks/useFullscreen";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TooltipProvider } from "@radix-ui/react-tooltip";

const InGameMenu: React.FC = () => {
  const {
    score,
    lives,
    currentLevel,
    setState,
    setMenuType,
    isPaused,
    multiplier,
    multiplierScore,
  } = useGameStore();
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const { isFullscreen, toggleFullscreen } = useFullscreen();

  const togglePause = () => {
    if (isPaused) {
      setState(GameState.PLAYING);
    } else {
      setState(GameState.PAUSED);
      setMenuType(MenuType.PAUSE);
    }
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

  // Calculate multiplier progress
  const progress = calculateMultiplierProgress(multiplierScore, multiplier);

  return (
    <div
      ref={gameContainerRef}
      className="flex justify-between items-center w-full h-full"
    >
      {/* SCOREBOARD */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-background-80 text-foreground px-4 py-2 rounded-lg backdrop-blur-sm pointer-events-auto">
        <div className="flex items-center gap-4 text-sm font-mono">
          <div className="text-center">
            <div className="text-primary font-bold flex items-center gap-1">
              <CircleDollarSign size={16} />
              {score.toLocaleString()}
            </div>
            {/* <div className="text-xs text-muted-foreground">SCORE</div> */}
          </div>
          <div className="w-px h-8 bg-border"></div>
          <div className="text-center">
            <div className="text-primary font-bold flex items-center gap-1">
              <Map size={16} />
              {currentLevel.toLocaleString()}
            </div>
            {/* <div className="text-xs text-muted-foreground">LEVEL</div> */}
          </div>
          <div className="w-px h-8 bg-border"></div>
          <div className="min-w-20 flex justify-center border border-primary p-1 rounded-lg relative overflow-hidden">
            {/* Progress bar background */}
            <div
              className="absolute inset-0 bg-primary-20 transition-all duration-300 ease-out"
              style={{ width: `${progress * 100}%` }}
            />
            <div className="text-primary text-center font-bold flex items-center gap-1 relative z-10">
              <Zap size={16} />x{multiplier}
            </div>
            {/* <div className="text-xs text-muted-foreground">MULTIPLIER</div> */}
          </div>
        </div>
      </div>

      {/* MENU BUTTONS */}
      <div className="flex items-center space-x-4 absolute right-4 top-4">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={togglePause}
                variant="outline"
                className="bg-background-80 text-foreground backdrop-blur-sm border-none hover:bg-primary hover:text-black h-10 w-10"
              >
                {isPaused ? (
                  <Play className="text-white hover:text-primary" size={24} />
                ) : (
                  <Pause
                    className="text-foreground hover:text-primary"
                    size={24}
                  />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{"Pause Spill (P)"}</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={handleFullscreenToggle}
                variant="outline"
                className="bg-background-80 text-foreground backdrop-blur-sm border-none hover:bg-primary hover:text-black h-10 w-10"
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
      </div>

      {/* Lives */}
      <div className="absolute left-3 bottom-2">
        <div className="text-xl font-bold text-red-400 flex items-center gap-1">
          {Array.from({ length: 3 }).map((_, index) => (
            <Coffee
              color="#81B64C"
              size={20}
              key={index}
              fill={index < lives ? "#81B64C" : "none"}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default InGameMenu;
