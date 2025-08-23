import { useGameStore } from "../stores/gameStore";
import { useInputStore } from "../stores/systems/inputStore";
import { InputKey, GameState } from "../types/enums";

export class InputManager {
  private keysPressed: Set<string> = new Set();
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
    const inputStore = useInputStore.getState();
    inputStore.clearInput();
  }

  private updateInputState(key: string, pressed: boolean) {
    const inputStore = useInputStore.getState();
    console.log("updateInputState", key, pressed);

    // Update the store based on the key pressed
    const input = {
      left: this.keysPressed.has("ArrowLeft") || this.keysPressed.has("a"),
      right: this.keysPressed.has("ArrowRight") || this.keysPressed.has("d"),
      jump: this.keysPressed.has("ArrowUp") || this.keysPressed.has("w"),
      superJump:
        (this.keysPressed.has("ArrowUp") || this.keysPressed.has("w")) &&
        this.keysPressed.has("Shift"),
      fastFall: this.keysPressed.has("ArrowDown") || this.keysPressed.has("s"),
      float: this.keysPressed.has(" "),
      space: this.keysPressed.has(" "),
      escape: this.keysPressed.has("Escape"),
    };

    inputStore.setInput(input);
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
    const inputStore = useInputStore.getState();
    inputStore.clearInput();
  }
}


