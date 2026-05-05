import React, { useRef, useEffect, useState } from "react";
import { GameManager } from "../managers/GameManager";
import { GAME_CONFIG } from "../types/constants";
import { useFullscreen } from "../hooks/useFullscreen";

interface GameCanvasProps {
  className?: string;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ className = "" }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameManagerRef = useRef<GameManager | null>(null);
  const { isFullscreen } = useFullscreen();
  const [canvasStyle, setCanvasStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size
    canvas.width = GAME_CONFIG.CANVAS_WIDTH;
    canvas.height = GAME_CONFIG.CANVAS_HEIGHT;

    // Initialize game manager and start
    // Note: All loading is now handled by LoadingManager before this component is rendered
    gameManagerRef.current = new GameManager(canvas);
    gameManagerRef.current.start();

    return () => {
      if (gameManagerRef.current) {
        gameManagerRef.current.cleanup();
      }
    };
  }, []);

  // Handle responsive sizing for fullscreen
  useEffect(() => {
    const updateCanvasSize = () => {
      if (!isFullscreen) {
        setCanvasStyle({
          imageRendering: "crisp-edges",
        });
        return;
      }

      const aspectRatio = GAME_CONFIG.CANVAS_WIDTH / GAME_CONFIG.CANVAS_HEIGHT; // 4:3
      // Reserve room for the top HUD strip (InGameMenu, ~40px at fullscreen).
      // FloorHUD overlays the canvas so no bottom reservation needed.
      const TOP_HUD_RESERVED = 40;
      const PADDING = 24;
      const availableWidth = window.innerWidth - PADDING;
      const availableHeight = window.innerHeight - TOP_HUD_RESERVED - PADDING;
      const availableAspectRatio = availableWidth / availableHeight;

      let width, height;

      if (availableAspectRatio > aspectRatio) {
        // Available area is wider than game aspect ratio — fit to height
        height = availableHeight;
        width = height * aspectRatio;
      } else {
        // Available area is taller than game aspect ratio — fit to width
        width = availableWidth;
        height = width / aspectRatio;
      }

      setCanvasStyle({
        width: `${width}px`,
        height: `${height}px`,
        imageRendering: "crisp-edges",
      });
    };

    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);

    return () => {
      window.removeEventListener("resize", updateCanvasSize);
    };
  }, [isFullscreen]);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        className={`block ${className}`}
        style={canvasStyle}
      />
      {/* Loading overlay while waiting for audio settings */}
      {/* {isWaitingForAudioSettings && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 rounded-lg">
          <div className="text-white text-center">
            <div className="text-lg font-bold mb-2">Laster lydinnstillinger...</div>
            <div className="text-sm text-gray-300">
              Vennligst vent mens spillet lastes inn
            </div>
          </div>
        </div>
      )} */}
    </div>
  );
};

export default GameCanvas;
