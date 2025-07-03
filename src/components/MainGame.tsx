import React from "react";
import GameCanvas from "./GameCanvas";
import Menu from "./menu/Menu";
import { DEV_CONFIG } from "@/types/constants";
import { Circle } from "lucide-react";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";
import { useFullscreen } from "../hooks/useFullscreen";
import { VERSION_STRING, getVersion } from "../version";

const MainGame: React.FC = () => {
  const gameContainerRef = React.useRef<HTMLDivElement>(null);
  const { toggleFullscreen } = useFullscreen();

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

  // Set up keyboard shortcuts
  useKeyboardShortcuts(handleFullscreenToggle);

  return (
    <div
      ref={gameContainerRef}
      className="relative rounded-lg"
    >
      <GameCanvas />

      {DEV_CONFIG.ENABLED && (
        <div className="text-white text-2xl absolute top-1 left-1 bg-red-500 rounded-full p-1 flex items-center justify-center gap-1 z-50">
          <span className="text-xs font-bold uppercase">Dev</span>
          <Circle className="w-4 h-4" fill="white" />
        </div>
      )}

      {/* Version display */}
      <div className="absolute bottom-3 right-3 text-xs text-muted-foreground z-40">
        v{VERSION_STRING} (Build {getVersion().build})
      </div>

      {/* Unified menu system */}
      <Menu />
    </div>
  );
};

export default MainGame;
