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

    // Initialize game manager
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
    <canvas
      ref={canvasRef}
      className={`shadow-black/10 shadow-lg ${className}`}
      style={canvasStyle}
    />
  );
};

export default GameCanvas;
