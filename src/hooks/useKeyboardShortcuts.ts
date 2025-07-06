import { useEffect } from "react";
import { useGameStore } from "../stores/gameStore";
import { GameState, MenuType } from "../types/enums";

// Type definition for webkit fullscreen element
interface WebkitDocument extends Document {
  webkitFullscreenElement?: Element | null;
}

export const useKeyboardShortcuts = (onFullscreenToggle?: () => void) => {
  const { currentState, setState, setMenuType, isPaused } = useGameStore();

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
        case "F11":
        case "f":
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
          // Pause/unpause game if playing
          else if (currentState === GameState.PLAYING) {
            event.preventDefault();
            if (isPaused) {
              setState(GameState.PLAYING);
            } else {
              setState(GameState.PAUSED);
              setMenuType(MenuType.PAUSE);
            }
          }
          break;

        case "p":
        case "P":
          // Pause/unpause game if playing
          if (currentState === GameState.PLAYING) {
            event.preventDefault();
            if (isPaused) {
              setState(GameState.PLAYING);
            } else {
              setState(GameState.PAUSED);
              setMenuType(MenuType.PAUSE);
            }
          }
          break;

        case " ":
          if (currentState === GameState.PAUSED) {
            event.preventDefault();
            setState(GameState.PLAYING);
          }
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [currentState, isPaused, setState, setMenuType, onFullscreenToggle]);
};
