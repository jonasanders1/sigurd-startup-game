import { useState, useEffect, useCallback } from 'react';

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
    
    console.log(`🎮 Fullscreen event dispatched: ${fullscreen ? 'entered' : 'exited'}`);
  }, []);

  // Check if fullscreen is supported
  const isFullscreenSupported = () => {
    return !!(
      document.fullscreenEnabled ||
      (document as any).webkitFullscreenEnabled ||
      (document as any).mozFullScreenEnabled ||
      (document as any).msFullscreenEnabled
    );
  };

  // Get the fullscreen element
  const getFullscreenElement = () => {
    return (
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement
    );
  };

  // Enter fullscreen
  const enterFullscreen = useCallback(async (element?: HTMLElement) => {
    if (!isFullscreenSupported()) {
      console.warn('Fullscreen is not supported in this browser');
      return false;
    }

    const targetElement = element || document.documentElement;

    try {
      if (targetElement.requestFullscreen) {
        await targetElement.requestFullscreen();
      } else if ((targetElement as any).webkitRequestFullscreen) {
        await (targetElement as any).webkitRequestFullscreen();
      } else if ((targetElement as any).mozRequestFullScreen) {
        await (targetElement as any).mozRequestFullScreen();
      } else if ((targetElement as any).msRequestFullscreen) {
        await (targetElement as any).msRequestFullscreen();
      }
      return true;
    } catch (error) {
      console.error('Error entering fullscreen:', error);
      return false;
    }
  }, []);

  // Exit fullscreen
  const exitFullscreen = useCallback(async () => {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen();
      } else if ((document as any).mozCancelFullScreen) {
        await (document as any).mozCancelFullScreen();
      } else if ((document as any).msExitFullscreen) {
        await (document as any).msExitFullscreen();
      }
      return true;
    } catch (error) {
      console.error('Error exiting fullscreen:', error);
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