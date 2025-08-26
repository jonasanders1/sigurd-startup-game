import { useState, useEffect } from 'react';
import { GAME_CONFIG } from '../types/constants';
import { useFullscreen } from './useFullscreen';

export interface CanvasDimensions {
  width: number;
  height: number;
  scale: number;
  isFullscreen: boolean;
}

export const useCanvasDimensions = (): CanvasDimensions => {
  const { isFullscreen } = useFullscreen();
  const [dimensions, setDimensions] = useState<CanvasDimensions>(() => ({
    width: GAME_CONFIG.CANVAS_WIDTH,
    height: GAME_CONFIG.CANVAS_HEIGHT,
    scale: 1,
    isFullscreen: false,
  }));

  useEffect(() => {
    const calculateDimensions = () => {
      if (!isFullscreen) {
        // Normal mode - use default canvas dimensions
        setDimensions({
          width: GAME_CONFIG.CANVAS_WIDTH,
          height: GAME_CONFIG.CANVAS_HEIGHT,
          scale: 1,
          isFullscreen: false,
        });
        return;
      }

      // Fullscreen mode - calculate responsive dimensions
      const aspectRatio = GAME_CONFIG.CANVAS_WIDTH / GAME_CONFIG.CANVAS_HEIGHT; // 4:3
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      const windowAspectRatio = windowWidth / windowHeight;

      let width, height, scale;

      if (windowAspectRatio > aspectRatio) {
        // Window is wider than game aspect ratio
        height = windowHeight * 0.9; // Use 90% of window height
        width = height * aspectRatio;
      } else {
        // Window is taller than game aspect ratio
        width = windowWidth * 0.9; // Use 90% of window width
        height = width / aspectRatio;
      }

      // Calculate scale factor for UI elements
      scale = Math.min(
        width / GAME_CONFIG.CANVAS_WIDTH,
        height / GAME_CONFIG.CANVAS_HEIGHT
      );

      setDimensions({
        width,
        height,
        scale,
        isFullscreen: true,
      });
    };

    calculateDimensions();
    window.addEventListener('resize', calculateDimensions);

    return () => {
      window.removeEventListener('resize', calculateDimensions);
    };
  }, [isFullscreen]);

  return dimensions;
};

// Hook for responsive font sizes
export const useResponsiveFontSize = (baseSize: number): string => {
  const { scale, isFullscreen } = useCanvasDimensions();
  
  if (!isFullscreen) return `${baseSize}px`;
  
  // Scale font size based on canvas scale
  const scaledSize = Math.round(baseSize * scale);
  return `${scaledSize}px`;
};

// Hook for responsive spacing/padding
export const useResponsiveSpacing = (baseSpacing: number): number => {
  const { scale, isFullscreen } = useCanvasDimensions();
  
  if (!isFullscreen) return baseSpacing;
  
  // Scale spacing based on canvas scale
  return Math.round(baseSpacing * scale);
};