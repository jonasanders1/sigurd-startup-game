export interface EntityConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  velocityX?: number;
  velocityY?: number;
}

export abstract class BaseEntity {
  public x: number;
  public y: number;
  public width: number;
  public height: number;
  public velocityX: number;
  public velocityY: number;
  public isActive: boolean = true;

  constructor(config: EntityConfig) {
    this.x = config.x;
    this.y = config.y;
    this.width = config.width;
    this.height = config.height;
    this.velocityX = config.velocityX || 0;
    this.velocityY = config.velocityY || 0;
  }

  // Abstract methods that subclasses must implement
  abstract update(deltaTime: number): void;
  abstract render(ctx: CanvasRenderingContext2D): void;

  // Common collision detection method
  getBounds() {
    return {
      left: this.x,
      right: this.x + this.width,
      top: this.y,
      bottom: this.y + this.height,
    };
  }

  // Check if this entity collides with another
  collidesWith(other: BaseEntity): boolean {
    const bounds = this.getBounds();
    const otherBounds = other.getBounds();

    return (
      bounds.left < otherBounds.right &&
      bounds.right > otherBounds.left &&
      bounds.top < otherBounds.bottom &&
      bounds.bottom > otherBounds.top
    );
  }

  // Apply physics
  applyGravity(gravity: number) {
    this.velocityY += gravity;
  }

  // Move entity
  move() {
    this.x += this.velocityX;
    this.y += this.velocityY;
  }
}