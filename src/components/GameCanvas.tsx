import React, { useRef, useEffect } from "react";
import { GameManager } from "../managers/GameManager";
import { GAME_CONFIG } from "../types/constants";

interface GameCanvasProps {
  className?: string;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ className = "" }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameManagerRef = useRef<GameManager | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size
    canvas.width = GAME_CONFIG.CANVAS_WIDTH;
    canvas.height = GAME_CONFIG.CANVAS_HEIGHT;

    // Initialize game manager
    gameManagerRef.current = new GameManager(canvas);
    gameManagerRef.current.start();

    return () => {
      if (gameManagerRef.current) {
        gameManagerRef.current.cleanup();
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`shadow-black/10 shadow-lg ${className}`}
      style={{
        imageRendering: "pixelated",
      }}
    />
  );
};

export default GameCanvas;
