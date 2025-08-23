import { useEffect } from "react";
import { useGameStore } from "../stores/gameStore";
import { GameState } from "../types/enums";

// Type definition for webkit fullscreen element
interface WebkitDocument extends Document {
  webkitFullscreenElement?: Element | null;
}

export const useKeyboardShortcuts = (onFullscreenToggle?: () => void) => {
  const { currentState, gameStateManager, audioSettings, updateAudioSettings } = useGameStore();

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
          // Use centralized pause/resume logic through GameStateManager
          if (currentState === GameState.PLAYING) {
            event.preventDefault();
            // Use the GameStateManager to pause the game
            // This ensures all managers are properly paused
            gameStateManager?.pauseGame();
          } else if (currentState === GameState.PAUSED) {
            event.preventDefault();
            // Use the GameStateManager to resume the game
            // This ensures all managers are properly resumed
            gameStateManager?.resumeGame();
          }
          break;

        case "m":
        case "M":
          // Toggle audio mute
          event.preventDefault();
          updateAudioSettings({ masterMuted: !audioSettings.masterMuted });
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [currentState, gameStateManager, onFullscreenToggle, updateAudioSettings, audioSettings.masterMuted]);
};
