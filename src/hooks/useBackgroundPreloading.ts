import { useState, useEffect } from 'react';
import { BackgroundManager } from '../managers/BackgroundManager';

export const useBackgroundPreloading = () => {
  const [isPreloading, setIsPreloading] = useState(true);

  useEffect(() => {
    // Preload all background images to prevent flashing
    BackgroundManager.preloadAllBackgrounds().then(() => {
      console.log("All background images preloaded");
      setIsPreloading(false);
    }).catch(error => {
      console.warn("Failed to preload some background images:", error);
      setIsPreloading(false);
    });
  }, []);

  return { isPreloading };
}; 