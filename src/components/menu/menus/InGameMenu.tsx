import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  useScoreStore,
  useStateStore,
} from "../../../stores/gameStore";
import { useBalanceStore } from "../../../stores/systems/balanceStore";

import {
  Pause,
  Maximize,
  Minimize,
  Zap,
  CircleDollarSign,
  Map,
  Heart,
  Coins,
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
  const { currentLevel, gameStateManager, isPaused, lives } = useStateStore();
  const { score, multiplier, multiplierScore } = useScoreStore();
  const { balance, hasBridge } = useBalanceStore();

  const gameContainerRef = useRef<HTMLDivElement>(null);
  const { isFullscreen, toggleFullscreen } = useFullscreen();

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

  const progress = calculateMultiplierProgress(multiplierScore, multiplier);

  return (
    <div
      ref={gameContainerRef}
      className="flex justify-between items-center w-full h-full"
    >
      {/* SCOREBOARD */}
      <div className="absolute top-3 left-1/2 transform -translate-x-1/2 z-10 pointer-events-auto">
        <div
          className="flex items-center gap-3 text-sm font-mono px-4 py-2 bg-[var(--surface-raised)] border-2 border-[var(--foreground)] rounded-sm"
          style={{ boxShadow: "var(--shadow-lg)" }}
        >
          <div className="text-center">
            <div className="text-primary font-pixel flex items-center gap-1 text-base">
              <CircleDollarSign size={14} />
              {score.toLocaleString()}
            </div>
          </div>
          <div className="w-px h-6 bg-[var(--surface-line)]" />
          <div className="text-center">
            <div className="text-foreground font-pixel flex items-center gap-1 text-base">
              <Map size={14} />
              {currentLevel}
            </div>
          </div>
          <div className="w-px h-6 bg-[var(--surface-line)]" />
          <div className="min-w-16 flex justify-center border border-primary p-1 rounded-sm relative overflow-hidden">
            <div
              className="absolute inset-0 bg-primary-20 transition-all duration-300 ease-out"
              style={{ width: `${progress * 100}%` }}
            />
            <div className="text-primary text-center font-pixel flex items-center gap-1 relative z-10 text-base">
              <Zap size={14} />x{multiplier}
            </div>
          </div>
        </div>
      </div>

      {/* MENU BUTTONS */}
      <div className="flex items-center space-x-2 absolute right-3 top-3">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => gameStateManager?.pauseGame()}
                variant="ghost"
                size="icon"
                className="text-[var(--foreground-muted)] hover:text-primary h-8 w-8"
              >
                <Pause size={18} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Pause (P)</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={handleFullscreenToggle}
                variant="ghost"
                size="icon"
                className="text-[var(--foreground-muted)] hover:text-primary h-8 w-8"
              >
                {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isFullscreen ? "Avslutt fullskjerm (F)" : "Fullskjerm (F)"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Lives */}
      <div
        className={`absolute left-3 ${
          isFullscreen ? "bottom-4" : "bottom-2"
        }`}
      >
        <div className="flex items-center gap-1">
          {Array.from({ length: 3 }).map((_, index) => (
            <Heart
              color="#d93a3a"
              size={isFullscreen ? 22 : 18}
              key={index}
              fill={index < lives ? "#d93a3a" : "none"}
            />
          ))}
          {lives > 3 && (
            <span className="text-primary font-pixel text-sm ml-1">+{lives - 3}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default InGameMenu;
