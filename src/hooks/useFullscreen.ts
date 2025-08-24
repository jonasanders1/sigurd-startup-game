import { useState, useEffect, useCallback } from 'react';
import { log } from '../lib/logger';

// Type definitions for browser-specific fullscreen APIs
interface WebkitDocument extends Document {
  webkitFullscreenEnabled?: boolean;
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void>;
}

interface WebkitElement extends HTMLElement {
  webkitRequestFullscreen?: () => Promise<void>;
}

interface MozDocument extends Document {
  mozFullScreenEnabled?: boolean;
  mozFullScreenElement?: Element | null;
  mozCancelFullScreen?: () => Promise<void>;
}

interface MozElement extends HTMLElement {
  mozRequestFullScreen?: () => Promise<void>;
}

interface MsDocument extends Document {
  msFullscreenEnabled?: boolean;
  msFullscreenElement?: Element | null;
  msExitFullscreen?: () => Promise<void>;
}

interface MsElement extends HTMLElement {
  msRequestFullscreen?: () => Promise<void>;
}

export const useFullscreen = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Dispatch custom fullscreen event
  const dispatchFullscreenEvent = useCallback((fullscreen: boolean) => {
    const event = new CustomEvent('sigurd-startup-fullscreen-change', {
      detail: {
        isFullscreen: fullscreen,
        timestamp: Date.now(),
        gameId: 'sigurd-startup-game'
      },
      bubbles: true,
      cancelable: true
    });
    
    // Dispatch on window for external sites to catch
    window.dispatchEvent(event);
    
    // Also dispatch on document for iframe scenarios
    document.dispatchEvent(event);
    
    log.debug(`Fullscreen event dispatched: ${fullscreen ? 'entered' : 'exited'}`);
  }, []);

  // Check if fullscreen is supported
  const isFullscreenSupported = () => {
    return !!(
      document.fullscreenEnabled ||
      (document as WebkitDocument).webkitFullscreenEnabled ||
      (document as MozDocument).mozFullScreenEnabled ||
      (document as MsDocument).msFullscreenEnabled
    );
  };

  // Get the fullscreen element
  const getFullscreenElement = () => {
    return (
      document.fullscreenElement ||
      (document as WebkitDocument).webkitFullscreenElement ||
      (document as MozDocument).mozFullScreenElement ||
      (document as MsDocument).msFullscreenElement
    );
  };

  // Enter fullscreen
  const enterFullscreen = useCallback(async (element?: HTMLElement) => {
    if (!isFullscreenSupported()) {
      log.warn('Fullscreen is not supported in this browser');
      return false;
    }

    const targetElement = element || document.documentElement;

    try {
      if (targetElement.requestFullscreen) {
        await targetElement.requestFullscreen();
      } else if ((targetElement as WebkitElement).webkitRequestFullscreen) {
        await (targetElement as WebkitElement).webkitRequestFullscreen();
      } else if ((targetElement as MozElement).mozRequestFullScreen) {
        await (targetElement as MozElement).mozRequestFullScreen();
      } else if ((targetElement as MsElement).msRequestFullscreen) {
        await (targetElement as MsElement).msRequestFullscreen();
      }
      return true;
    } catch (error) {
      log.error('Error entering fullscreen:', error);
      return false;
    }
  }, []);

  // Exit fullscreen
  const exitFullscreen = useCallback(async () => {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if ((document as WebkitDocument).webkitExitFullscreen) {
        await (document as WebkitDocument).webkitExitFullscreen();
      } else if ((document as MozDocument).mozCancelFullScreen) {
        await (document as MozDocument).mozCancelFullScreen();
      } else if ((document as MsDocument).msExitFullscreen) {
        await (document as MsDocument).msExitFullscreen();
      }
      return true;
    } catch (error) {
      log.error('Error exiting fullscreen:', error);
      return false;
    }
  }, []);

  // Toggle fullscreen
   const toggleFullscreen = useCallback(async (element?: HTMLElement) => {
    if (isFullscreen) {
      const success = await exitFullscreen();
      if (success) {
        setIsFullscreen(false);
        dispatchFullscreenEvent(false);
      }
    } else {
      const success = await enterFullscreen(element);
      if (success) {
        setIsFullscreen(true);
        dispatchFullscreenEvent(true);
      }
    }
  }, [isFullscreen, enterFullscreen, exitFullscreen, dispatchFullscreenEvent]);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const fullscreenElement = getFullscreenElement();
      const newFullscreenState = !!fullscreenElement;
      
      // Only dispatch event if state actually changed
      if (newFullscreenState !== isFullscreen) {
        setIsFullscreen(newFullscreenState);
        dispatchFullscreenEvent(newFullscreenState);
      }
    };

    // Add event listeners for different browsers
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    // Initial check
    handleFullscreenChange();

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, [isFullscreen, dispatchFullscreenEvent]);

  return {
    isFullscreen,
    isFullscreenSupported: isFullscreenSupported(),
    enterFullscreen,
    exitFullscreen,
    toggleFullscreen,
  };
}; 