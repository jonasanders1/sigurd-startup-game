export class InputManager {
  private keys: Set<string> = new Set();
  private keyPressTimes: Map<string, number> = new Map();
  private touchControls = {
    left: false,
    right: false,
    up: false,
    float: false,
  };

  // Store bound event handlers for proper cleanup
  private boundKeyDownHandler: (event: KeyboardEvent) => void;
  private boundKeyUpHandler: (event: KeyboardEvent) => void;
  private boundPreventDefaultHandler: (event: KeyboardEvent) => void;
  private boundWindowBlurHandler: () => void;
  private boundWindowFocusHandler: () => void;

  constructor() {
    // Bind event handlers once and store them
    this.boundKeyDownHandler = this.handleKeyDown.bind(this);
    this.boundKeyUpHandler = this.handleKeyUp.bind(this);
    this.boundPreventDefaultHandler = (e: KeyboardEvent) => {
      if (
        [
          "ArrowLeft",
          "ArrowRight",
          "ArrowUp",
          "ArrowDown",
          "Space",
          " ",
          "p",
          "P",
        ].includes(e.key)
      ) {
        e.preventDefault();
      }
    };
    this.boundWindowBlurHandler = this.handleWindowBlur.bind(this);
    this.boundWindowFocusHandler = this.handleWindowFocus.bind(this);

    this.bindEvents();
  }

  private bindEvents() {
    document.addEventListener("keydown", this.boundKeyDownHandler);
    document.addEventListener("keyup", this.boundKeyUpHandler);
    document.addEventListener("keydown", this.boundPreventDefaultHandler);
    window.addEventListener("blur", this.boundWindowBlurHandler);
    window.addEventListener("focus", this.boundWindowFocusHandler);
  }

  private handleWindowBlur(): void {
    // Clear all keys when window loses focus to prevent stuck keys
    this.keys.clear();
    this.keyPressTimes.clear();
  }

  private handleWindowFocus(): void {
    // Reset touch controls when window regains focus
    this.touchControls = {
      left: false,
      right: false,
      up: false,
      float: false,
    };
  }

  isKeyPressed(key: string): boolean {
    return this.keys.has(key) || this.getTouchControl(key);
  }

  isShiftPressed(): boolean {
    return this.keys.has("Shift");
  }

  getKeyPressDuration(key: string): number {
    const startTime = this.keyPressTimes.get(key);
    if (startTime && this.keys.has(key)) {
      return Date.now() - startTime;
    }
    return 0;
  }

  // Method to reset stuck keys (call this when game state changes)
  resetStuckKeys(): void {
    this.keys.clear();
    this.keyPressTimes.clear();
  }

  private getTouchControl(key: string): boolean {
    switch (key) {
      case "ArrowLeft":
        return this.touchControls.left;
      case "ArrowRight":
        return this.touchControls.right;
      case "ArrowUp":
        return this.touchControls.up;
      case " ":
      case "Space":
        return this.touchControls.float;
      default:
        return false;
    }
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.keys.has(event.key)) {
      this.keyPressTimes.set(event.key, Date.now());
    }
    this.keys.add(event.key);
  }

  private handleKeyUp(event: KeyboardEvent): void {
    this.keys.delete(event.key);
    this.keyPressTimes.delete(event.key);
  }

  // Touch controls for mobile
  setTouchControl(
    control: keyof typeof this.touchControls,
    pressed: boolean
  ): void {
    this.touchControls[control] = pressed;
  }

  cleanup(): void {
    document.removeEventListener("keydown", this.boundKeyDownHandler);
    document.removeEventListener("keyup", this.boundKeyUpHandler);
    document.removeEventListener("keydown", this.boundPreventDefaultHandler);
    window.removeEventListener("blur", this.boundWindowBlurHandler);
    window.removeEventListener("focus", this.boundWindowFocusHandler);
  }
}
