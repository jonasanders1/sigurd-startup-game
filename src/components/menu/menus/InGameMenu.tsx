import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useGameStore } from "../../../stores/gameStore";
import { GameState } from "../../../types/enums";
import { Play, Pause, Maximize, Minimize, Zap, CircleDollarSign, Map, Coffee } from "lucide-react";
import { calculateMultiplierProgress } from "../../../lib/scoringUtils";

const InGameMenu: React.FC = () => {
  const { score, lives, currentLevel, setState, isPaused, multiplier, multiplierScore } = useGameStore();

  const [isFullscreen, setIsFullscreen] = useState(false); // TODO: Implement fullscreen toggle


  const togglePause = () => {
    setState(isPaused ? GameState.PLAYING : GameState.PAUSED);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  }; // TODO: Implement fullscreen toggle

  // Calculate multiplier progress
  const progress = calculateMultiplierProgress(multiplierScore, multiplier);

  return (
    <div className="flex justify-between items-center w-full h-full">
      {/* SCOREBOARD */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-background/50 text-foreground px-4 py-2 rounded-lg  backdrop-blur-sm pointer-events-auto">
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
          <div className="min-w-20 flex justify-center border border-[#81B64C] p-1 rounded-lg relative overflow-hidden">
            {/* Progress bar background */}
            <div 
              className="absolute inset-0 bg-[#81B64C]/20 transition-all duration-300 ease-out"
              style={{ width: `${progress * 100}%` }}
            />
            <div className="text-[#81B64C] text-center font-bold flex items-center gap-1 relative z-10">
              <Zap size={16} />
              x{multiplier}
            </div>
            {/* <div className="text-xs text-muted-foreground">MULTIPLIER</div> */}
          </div>
        </div>
      </div>

      {/* MENU BUTTONS */}
      <div className="flex items-center space-x-4 absolute right-4 top-4">
        <Button
          onClick={togglePause}
          variant="outline"
          className="bg-background/50 text-foreground backdrop-blur-sm border-none hover:bg-[#81b64c] hover:text-black h-10 w-10"
        >
          {isPaused ? (
            <Play className="text-white hover:text-[#81b64c]" size={24} />
          ) : (
            <Pause className="text-foreground hover:text-[#81b64c]" size={24} />
          )}
        </Button>
        <Button
          onClick={toggleFullscreen}
          variant="outline"
          className="bg-background/50 text-foreground backdrop-blur-sm border-none hover:bg-[#81b64c] hover:text-black h-10 w-10"
        >
          {isFullscreen ? (
            <Maximize className="text-accent hover:text-foreground hover:text-[#81b64c]" size={24} />
          ) : (
            <Minimize className="text-foreground hover:text-[#81b64c]" size={24} />
          )}
        </Button>
      </div>

      {/* Lives */}
      <div className="absolute left-3 bottom-2">
        <div className="text-xl font-bold text-red-400 flex items-center gap-1">
          {Array.from({ length: 3 }).map((_, index) => (
            <Coffee 
              color="#81B64C"
              size={24}
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
