import { useState, useEffect } from 'react';
import { GAME_CONFIG } from '../types/constants';
import { useFullscreen } from './useFullscreen';

export interface CanvasDimensions {
  width: number;
  height: number;
  scale: number;
  isFullscreen: boolean;
  containerWidth: number;
  containerHeight: number;
}

/**
 * Hook to get the current dimensions of the game container.
 * The container maintains 800x600 aspect ratio and scales in fullscreen.
 */
export const useCanvasDimensions = (): CanvasDimensions => {
  const { isFullscreen } = useFullscreen();
  const [dimensions, setDimensions] = useState<CanvasDimensions>(() => ({
    width: GAME_CONFIG.CANVAS_WIDTH,
    height: GAME_CONFIG.CANVAS_HEIGHT,
    containerWidth: GAME_CONFIG.CANVAS_WIDTH,
    containerHeight: GAME_CONFIG.CANVAS_HEIGHT,
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
          containerWidth: GAME_CONFIG.CANVAS_WIDTH,
          containerHeight: GAME_CONFIG.CANVAS_HEIGHT,
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

      let containerWidth, containerHeight, scale;

      if (windowAspectRatio > aspectRatio) {
        // Window is wider than game aspect ratio
        containerHeight = windowHeight * 0.9; // Use 90% of window height
        containerWidth = containerHeight * aspectRatio;
      } else {
        // Window is taller than game aspect ratio
        containerWidth = windowWidth * 0.9; // Use 90% of window width
        containerHeight = containerWidth / aspectRatio;
      }

      // Calculate scale factor for UI elements
      scale = Math.min(
        containerWidth / GAME_CONFIG.CANVAS_WIDTH,
        containerHeight / GAME_CONFIG.CANVAS_HEIGHT
      );

      setDimensions({
        width: GAME_CONFIG.CANVAS_WIDTH,  // Canvas always renders at native resolution
        height: GAME_CONFIG.CANVAS_HEIGHT,
        containerWidth,  // Container scales
        containerHeight,
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