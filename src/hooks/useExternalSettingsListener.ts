import { useEffect, useRef } from 'react';
import { useGameStore } from '../stores/gameStore';
import { 
  listenForExternalAudioSettings, 
  requestAudioSettingsFromHost,
  sendAudioSettingsUpdate,
  AudioSettingsData 
} from '../lib/communicationUtils';
import { log } from '../lib/logger';

/**
 * Hook that listens for external audio settings from the host website
 * and automatically applies them to the game
 */
export const useExternalSettingsListener = () => {
  const updateAudioSettings = useGameStore((state) => state.updateAudioSettings);
  const removeListenerRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Function to handle received external settings
    const handleExternalSettings = (settings: AudioSettingsData) => {
      log.info("Applying external audio settings:", settings);
      
      // Extract the audio settings (excluding timestamp and sessionId)
      const audioSettings = {
        masterVolume: settings.masterVolume,
        musicVolume: settings.musicVolume,
        sfxVolume: settings.sfxVolume,
        masterMuted: settings.masterMuted,
        musicMuted: settings.musicMuted,
        sfxMuted: settings.sfxMuted,
      };

      // Update the game's audio settings
      updateAudioSettings(audioSettings);
      
      log.info("External audio settings applied successfully");
    };

    // Function to handle internal requests for game settings
    const handleInternalRequest = (event: CustomEvent) => {
      log.info("Internal request for game settings received");
      
      // Get current game settings and send them to host
      const currentSettings = useGameStore.getState().audioSettings;
      const settingsWithTimestamp = {
        ...currentSettings,
        timestamp: Date.now(),
      };
      
      sendAudioSettingsUpdate(settingsWithTimestamp);
      log.info("Current game settings sent to host");
    };

    // Start listening for external settings
    const removeExternalListener = listenForExternalAudioSettings(handleExternalSettings);
    
    // Listen for internal requests for game settings
    window.addEventListener("internal:request-game-settings", handleInternalRequest as EventListener);
    
    // Store both cleanup functions
    removeListenerRef.current = () => {
      removeExternalListener();
      window.removeEventListener("internal:request-game-settings", handleInternalRequest as EventListener);
    };

    // Request current settings from host
    requestAudioSettingsFromHost();

    log.info("External audio settings listener initialized and requested current settings");

    // Cleanup function
    return () => {
      if (removeListenerRef.current) {
        removeListenerRef.current();
        removeListenerRef.current = null;
        log.info("External audio settings listener removed");
      }
    };
  }, [updateAudioSettings]);

  // Return function to manually remove listener if needed
  const removeListener = () => {
    if (removeListenerRef.current) {
      removeListenerRef.current();
      removeListenerRef.current = null;
    }
  };

  return { removeListener };
}; 