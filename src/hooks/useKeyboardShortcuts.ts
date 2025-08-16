import { useEffect } from "react";
import { useGameStore } from "../stores/gameStore";
import { GameState, MenuType } from "../types/enums";
import { sendAudioSettingsUpdate } from "../lib/communicationUtils";

// Type definition for webkit fullscreen element
interface WebkitDocument extends Document {
  webkitFullscreenElement?: Element | null;
}

export const useKeyboardShortcuts = (onFullscreenToggle?: () => void) => {
  const { currentState, setState, setMenuType, isPaused, updateAudioSettings, audioSettings } = useGameStore();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Prevent shortcuts when typing in input fields
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (event.key) {
        case "f":
        case "F":
          event.preventDefault();
          onFullscreenToggle?.();
          break;

        case "Escape":
          // Exit fullscreen if in fullscreen mode
          if (
            document.fullscreenElement ||
            (document as WebkitDocument).webkitFullscreenElement
          ) {
            event.preventDefault();
            onFullscreenToggle?.();
          }
          break;

        case "p":
        case "P":
          // Pause/unpause game if playing, or resume if paused
          if (currentState === GameState.PLAYING) {
            event.preventDefault();
            setState(GameState.PAUSED);
            setMenuType(MenuType.PAUSE);
          } else if (isPaused) {
            event.preventDefault();
            // Use the same resume logic as the pause menu button
            setMenuType(MenuType.COUNTDOWN);
            setState(GameState.COUNTDOWN);
            
            // After 3 seconds, start the game
            setTimeout(() => {
            setState(GameState.PLAYING);
            }, 3000);
          }
          break;

        case "m":
        case "M":
          // Toggle audio mute
          event.preventDefault();
          const newMuteState = !audioSettings.masterMuted;
          updateAudioSettings({ masterMuted: newMuteState });
          
          // Send audio settings update to host
          sendAudioSettingsUpdate({
            ...audioSettings,
            masterMuted: newMuteState,
          });
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [currentState, isPaused, setState, setMenuType, onFullscreenToggle, updateAudioSettings, audioSettings.masterMuted]);
};
