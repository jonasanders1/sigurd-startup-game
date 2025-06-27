import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useGameStore } from "../../../stores/gameStore";
import { GameState } from "../../../types/enums";
import { Play, Pause, Maximize, Minimize, Heart } from "lucide-react";

const InGameMenu: React.FC = () => {
  const { score, lives, currentLevel, setState, isPaused } = useGameStore();

  const [isFullscreen, setIsFullscreen] = useState(false); // TODO: Implement fullscreen toggle

  const togglePause = () => {
    setState(isPaused ? GameState.PLAYING : GameState.PAUSED);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  }; // TODO: Implement fullscreen toggle

  return (
    <div className="flex justify-between items-center w-full h-full">
      {/* SCOREBOARD */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-background/80 text-foreground px-4 py-2 rounded-lg  backdrop-blur-sm pointer-events-auto">
        <div className="flex items-center gap-4 text-sm font-mono">
          <div className="text-center">
            <div className="text-primary font-bold">
              {score.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">SCORE</div>
          </div>
          <div className="w-px h-8 bg-border"></div>
          <div className="text-center">
            <div className="text-primary font-bold">{currentLevel.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">LEVEL</div>
          </div>
        </div>
      </div>

      {/* MENU BUTTONS */}
      <div className="flex items-center space-x-4 absolute right-4 top-4">
        <Button
          onClick={togglePause}
          variant="outline"
          className="bg-background/80 text-foreground backdrop-blur-sm border-none hover:bg-[#81b64c] hover:text-black h-10 w-10"
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
          className="bg-background/80 text-foreground backdrop-blur-sm border-none hover:bg-[#81b64c] hover:text-black h-10 w-10"
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
        <div className="text-xl font-bold text-red-400 flex items-center gap-2">
          {Array.from({ length: lives }).map((_, index) => (
            <Heart
              className="text-red-400"
              color="#81b64c"
              size={24}
              key={index}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default InGameMenu;
