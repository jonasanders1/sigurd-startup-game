import { useInputStore, useStateStore } from "../stores/gameStore";
import { GameState, InputKey } from "../types/enums";
import { log } from "../lib/logger";

// Keys the browser acts on by default (page scroll). The game is embedded in
// a host landing page, so without preventDefault every jump/move scrolls the
// page underneath the canvas.
const SCROLLING_KEYS = new Set<string>([
  InputKey.LEFT,
  InputKey.RIGHT,
  InputKey.UP,
  InputKey.DOWN,
  InputKey.SPACE,
]);

/** True when the event originates from a field the host page is typing in. */
const isEditableTarget = (target: EventTarget | null): boolean => {
  const el = target as HTMLElement | null;
  if (!el) return false;
  return (
    el.tagName === "INPUT" ||
    el.tagName === "TEXTAREA" ||
    el.isContentEditable === true
  );
};

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
    // Leave host-page form fields alone entirely.
    if (isEditableTarget(event.target)) return;

    // Keep Space/arrows from scrolling the host page while a game session is
    // active. On the start menu the game is idle, so the page keeps its
    // normal scroll behavior.
    if (
      SCROLLING_KEYS.has(event.key) &&
      useStateStore.getState().currentState !== GameState.MENU
    ) {
      event.preventDefault();
    }

    // Track key state
    this.keysPressed.add(event.key);

    // Update store based on key
    this.updateInputState(event.key, true);
  }

  private handleKeyUp(event: KeyboardEvent) {
    if (isEditableTarget(event.target)) return;

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

      // Float - Space
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
