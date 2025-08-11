import React, { useEffect, useRef } from 'react';
import { GameElement } from '../game-wrapper';

interface SigurdGameReactProps {
  className?: string;
  style?: React.CSSProperties;
  onGameLoad?: () => void;
  onGameError?: (error: Error) => void;
}

/**
 * React component wrapper for the Sigurd Startup Game
 * This component renders the game as a web component within React
 */
export const SigurdGameReact: React.FC<SigurdGameReactProps> = ({
  className,
  style,
  onGameLoad,
  onGameError
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<GameElement | null>(null);

  useEffect(() => {
    if (containerRef.current && !gameRef.current) {
      try {
        // Create the game element
        const gameElement = document.createElement('sigurd-startup') as GameElement;
        containerRef.current.appendChild(gameElement);
        gameRef.current = gameElement;
        
        // Game is loaded and ready
        onGameLoad?.();
      } catch (error) {
        onGameError?.(error as Error);
      }
    }

    // Cleanup
    return () => {
      if (gameRef.current && containerRef.current) {
        containerRef.current.removeChild(gameRef.current);
        gameRef.current = null;
      }
    };
  }, [onGameLoad, onGameError]);

  return (
    <div 
      ref={containerRef}
      className={className} 
      style={style}
    />
  );
};

export default SigurdGameReact; 