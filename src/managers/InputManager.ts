import { useInputStore } from "../stores/gameStore";
import { InputKey } from "../types/enums";
import { log } from "../lib/logger";

export class InputManager {
  private keysPressed: Set<string> = new Set();
  private initialized = false;

  // Store bound handlers so addEventListener/removeEventListener reference the same function
  private boundHandleKeyDown = this.handleKeyDown.bind(this);
  private boundHandleKeyUp = this.handleKeyUp.bind(this);
  private boundHandleBlur = this.handleBlur.bind(this);

  public initialize() {
    if (this.initialized) return;

    window.addEventListener("keydown", this.boundHandleKeyDown);
    window.addEventListener("keyup", this.boundHandleKeyUp);
    window.addEventListener("blur", this.boundHandleBlur);

    this.initialized = true;
  }

  destroy() {
    window.removeEventListener("keydown", this.boundHandleKeyDown);
    window.removeEventListener("keyup", this.boundHandleKeyUp);
    window.removeEventListener("blur", this.boundHandleBlur);

    this.keysPressed.clear();
    this.initialized = false;
  }

  private handleKeyDown(event: KeyboardEvent) {
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
    log.input("updateInputState", key, pressed);

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
