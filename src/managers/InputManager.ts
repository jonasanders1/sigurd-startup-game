import { useInputStore } from "../stores/gameStore";
import { InputKey } from "../types/enums";

export class InputManager {
  private keysPressed: Set<string> = new Set();
  // Remove the cached store reference
  private initialized = false;

  public initialize() {
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
    // Get the store when needed
    const { clearInput } = useInputStore.getState();
    clearInput();
  }

  private updateInputState(key: string, pressed: boolean) {
    // Get the store when needed instead of using cached reference
    const { setInput } = useInputStore.getState();
    console.log("updateInputState", key, pressed);

    switch (key) {
      // Left movement - A or Arrow Left
      case "a":
      case "A":
      case InputKey.LEFT:
        setInput("left", pressed);
        break;

      // Right movement - D or Arrow Right
      case "d":
      case "D":
      case InputKey.RIGHT:
        setInput("right", pressed);
        break;

      // Jump - W or Arrow Up
      case "w":
      case "W":
      case InputKey.UP:
        setInput("jump", pressed);
        break;

      // Fast Fall - S or Arrow Down
      case "s":
      case "S":
      case InputKey.DOWN:
        setInput("fastFall", pressed);
        break;

      // Super Jump - Shift
      case "Shift":
        setInput("superJump", pressed);
        break;

      // Float - Space or Z
      case InputKey.SPACE:
        setInput("float", pressed);
        break;
    }
  }

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
      "Shift",
    ];

    return gameKeys.includes(key);
  }

  isKeyPressed(key: string): boolean {
    return this.keysPressed.has(key);
  }

  clearKeys() {
    this.keysPressed.clear();
    // Get the store when needed
    const { clearInput } = useInputStore.getState();
    clearInput();
  }
}
