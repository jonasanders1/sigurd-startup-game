import { useState, useEffect } from 'react';
import { ParallaxManager } from '../managers/ParallaxManager';

export const useBackgroundPreloading = () => {
  const [isPreloading, setIsPreloading] = useState(true);

  useEffect(() => {
    // Preload all background images to prevent flashing
    ParallaxManager.preloadAllBackgrounds().then(() => {
      console.log("All background images preloaded");
      setIsPreloading(false);
    }).catch(error => {
      console.warn("Failed to preload some background images:", error);
      setIsPreloading(false);
    });
  }, []);

  return { isPreloading };
}; 