import { useGameStore } from "../stores/gameStore";
import { InputKey, GameState } from "../types/enums";

class InputManager {
  private keysPressed: Set<string> = new Set();
  private store = useGameStore.getState();
  private initialized = false;

  initialize() {
    if (this.initialized) return;

    // Add keyboard event listeners
    window.addEventListener("keydown", this.handleKeyDown.bind(this));
    window.addEventListener("keyup", this.handleKeyUp.bind(this));
    window.addEventListener("blur", this.handleBlur.bind(this));

    this.initialized = true;
  }

  destroy() {
    window.removeEventListener("keydown", this.handleKeyDown.bind(this));
    window.removeEventListener("keyup", this.handleKeyUp.bind(this));
    window.removeEventListener("blur", this.handleBlur.bind(this));

    this.keysPressed.clear();
    this.initialized = false;
  }

  private handleKeyDown(event: KeyboardEvent) {
    // Prevent default for game keys
    if (this.isGameKey(event.key)) {
      event.preventDefault();
    }

    // Track key state
    this.keysPressed.add(event.key);

    // Update store based on key
    this.updateInputState(event.key, true);
  }

  private handleKeyUp(event: KeyboardEvent) {
    // Remove from pressed keys
    this.keysPressed.delete(event.key);

    // Update store based on key
    this.updateInputState(event.key, false);
  }

  private handleBlur() {
    // Clear all keys when window loses focus
    this.keysPressed.clear();
    this.store.clearInput();
  }

  private updateInputState(key: string, pressed: boolean) {
    this.store = useGameStore.getState();

    switch (key) {
      // Left movement - A or Arrow Left
      case "a":
      case "A":
      case InputKey.LEFT:
        this.store.setInput("left", pressed);
        break;

      // Right movement - D or Arrow Right
      case "d":
      case "D":
      case InputKey.RIGHT:
        this.store.setInput("right", pressed);
        break;

      // Jump - W or Arrow Up
      case "w":
      case "W":
      case InputKey.UP:
        this.store.setInput("jump", pressed);
        break;

      // Fast Fall - S or Arrow Down
      case "s":
      case "S":
      case InputKey.DOWN:
        this.store.setInput("fastFall", pressed);
        break;

      // Super Jump - Shift
      case "Shift":
        this.store.setInput("superJump", pressed);
        break;

      // Float - Space or Z
      case InputKey.SPACE:
      case "z":
      case "Z":
        this.store.setInput("float", pressed);
        break;

      case InputKey.ENTER:
      case "x":
      case "X":
        this.store.setInput("float", pressed);
        break;

      // case InputKey.ESCAPE:
      // case InputKey.P:
      // case 'p':
      //   if (pressed) {
      //     this.handlePause();
      //   }
      //   break;

      case InputKey.R:
      case "r":
        if (pressed) {
          this.store.setInput("restart", pressed);
        }
        break;
    }
  }

  // private handlePause() {
  //   const { currentState, setState } = useGameStore.getState();

  //   if (currentState === GameState.PLAYING) {
  //     setState(GameState.PAUSED);
  //   } else if (currentState === GameState.PAUSED) {
  //     setState(GameState.PLAYING);
  //   }
  // }

  private isGameKey(key: string): boolean {
    const gameKeys = [
      InputKey.LEFT,
      InputKey.RIGHT,
      InputKey.UP,
      InputKey.DOWN,
      InputKey.SPACE,
      InputKey.ENTER,
      InputKey.ESCAPE,
      InputKey.P,
      "a",
      "A",
      "d",
      "D",
      "w",
      "W",
      "s",
      "S",
      "z",
      "Z",
      "x",
      "X",
      "r",
      "R",
      "Shift",
      "p",
    ];

    return gameKeys.includes(key);
  }

  isKeyPressed(key: string): boolean {
    return this.keysPressed.has(key);
  }

  clearKeys() {
    this.keysPressed.clear();
    this.store.clearInput();
  }
}

// Export singleton instance
export const inputManager = new InputManager();
