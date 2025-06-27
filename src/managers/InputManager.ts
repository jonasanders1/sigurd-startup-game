export class InputManager {
    private keys: Set<string> = new Set();
    private keyPressTimes: Map<string, number> = new Map();
    private touchControls = {
      left: false,
      right: false,
      up: false,
      float: false
    };
  
    constructor() {
      this.bindEvents();
    }
  
    private bindEvents() {
      document.addEventListener('keydown', this.handleKeyDown.bind(this));
      document.addEventListener('keyup', this.handleKeyUp.bind(this));
      
      // Prevent default behavior for game keys
      document.addEventListener('keydown', (e) => {
        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'Space', ' '].includes(e.key)) {
          e.preventDefault();
        }
      });
    }
  
    isKeyPressed(key: string): boolean {
      return this.keys.has(key) || this.getTouchControl(key);
    }
  
    isShiftPressed(): boolean {
      return this.keys.has('Shift');
    }
  
    getKeyPressDuration(key: string): number {
      const startTime = this.keyPressTimes.get(key);
      if (startTime && this.keys.has(key)) {
        return Date.now() - startTime;
      }
      return 0;
    }
  
    private getTouchControl(key: string): boolean {
      switch (key) {
        case 'ArrowLeft':
          return this.touchControls.left;
        case 'ArrowRight':
          return this.touchControls.right;
        case 'ArrowUp':
          return this.touchControls.up;
        case ' ':
        case 'Space':
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
    setTouchControl(control: keyof typeof this.touchControls, pressed: boolean): void {
      this.touchControls[control] = pressed;
    }
  
    cleanup(): void {
      document.removeEventListener('keydown', this.handleKeyDown.bind(this));
      document.removeEventListener('keyup', this.handleKeyUp.bind(this));
    }
  }