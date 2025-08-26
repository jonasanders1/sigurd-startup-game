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
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      const windowAspectRatio = windowWidth / windowHeight;

      let width, height;

      if (windowAspectRatio > aspectRatio) {
        // Window is wider than game aspect ratio
        height = windowHeight * 0.9; // Use 90% of window height
        width = height * aspectRatio;
      } else {
        // Window is taller than game aspect ratio
        width = windowWidth * 0.9; // Use 90% of window width
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
        className={`shadow-black/10 shadow-lg rounded-lg ${className}`}
      style={canvasStyle}
    />
      {/* Loading overlay while waiting for audio settings */}
      {isWaitingForAudioSettings && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 rounded-lg">
          <div className="text-white text-center">
            <div className="text-lg font-bold mb-2">Laster lydinnstillinger...</div>
            <div className="text-sm text-gray-300">
              Vennligst vent mens spillet lastes inn
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameCanvas;
