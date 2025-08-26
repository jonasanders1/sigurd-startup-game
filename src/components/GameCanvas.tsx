import React, { useRef, useEffect, useState } from "react";
import { GameManager } from "../managers/GameManager";
import { GAME_CONFIG } from "../types/constants";

interface GameCanvasProps {
  className?: string;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ className = "" }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameManagerRef = useRef<GameManager | null>(null);
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

  // Canvas should fill the container - container handles scaling
  useEffect(() => {
    setCanvasStyle({
      width: '100%',
      height: '100%',
      display: 'block',
      imageRendering: 'crisp-edges',
    });
  }, []);

  return (
    <div className="absolute inset-0">
      <canvas
        ref={canvasRef}
        className={`w-full h-full ${className}`}
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
