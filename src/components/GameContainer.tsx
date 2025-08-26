import React, { useEffect, useState, useRef, forwardRef } from "react";
import { GAME_CONFIG } from "../types/constants";
import { useFullscreen } from "../hooks/useFullscreen";

interface GameContainerProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * GameContainer maintains consistent 800x600 dimensions for both game canvas and menus.
 * It handles scaling in fullscreen mode while preserving aspect ratio.
 */
const GameContainer = forwardRef<HTMLDivElement, GameContainerProps>(
  ({ children, className = "" }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const elementRef = ref || containerRef;
  const { isFullscreen } = useFullscreen();
  const [containerStyle, setContainerStyle] = useState<React.CSSProperties>({
    width: `${GAME_CONFIG.CANVAS_WIDTH}px`,
    height: `${GAME_CONFIG.CANVAS_HEIGHT}px`,
    position: 'relative',
  });

  useEffect(() => {
    const updateContainerSize = () => {
      if (!isFullscreen) {
        // Normal mode - use exact canvas dimensions
        setContainerStyle({
          width: `${GAME_CONFIG.CANVAS_WIDTH}px`,
          height: `${GAME_CONFIG.CANVAS_HEIGHT}px`,
          position: 'relative',
        });
        return;
      }

      // Fullscreen mode - scale container while maintaining aspect ratio
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

      setContainerStyle({
        width: `${width}px`,
        height: `${height}px`,
        position: 'relative',
      });
    };

    updateContainerSize();
    window.addEventListener("resize", updateContainerSize);

    return () => {
      window.removeEventListener("resize", updateContainerSize);
    };
  }, [isFullscreen]);

  return (
    <div 
      ref={elementRef}
      className={`rounded-lg shadow-lg ${className}`}
      style={containerStyle}
    >
      {children}
    </div>
  );
});

GameContainer.displayName = 'GameContainer';

export default GameContainer;