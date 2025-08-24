import { useState, useEffect } from 'react';
import { BackgroundManager } from '../managers/BackgroundManager';
import { logger } from '../lib/logger';

export const useBackgroundPreloading = () => {
  const [isPreloading, setIsPreloading] = useState(true);

  useEffect(() => {
    // Preload all background images to prevent flashing
    BackgroundManager.preloadAllBackgrounds().then(() => {
      logger.asset("All background images preloaded");
      setIsPreloading(false);
    }).catch(error => {
      logger.warn("Failed to preload some background images");
      setIsPreloading(false);
    });
  }, []);

  return { isPreloading };
}; 