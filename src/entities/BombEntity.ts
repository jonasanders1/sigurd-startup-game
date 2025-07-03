import { BaseEntity, EntityConfig } from './BaseEntity';
import { COLORS, GAME_CONFIG } from '../types/constants';

export interface BombConfig extends EntityConfig {
  order: number;
  group: number;
}

export class BombEntity extends BaseEntity {
  public order: number;
  public group: number;
  public isCollected: boolean = false;
  public isBlinking: boolean = false;
  public isCorrect: boolean = false;

  constructor(config: BombConfig) {
    super({
      ...config,
      width: config.width || GAME_CONFIG.BOMB_SIZE,
      height: config.height || GAME_CONFIG.BOMB_SIZE,
    });
    
    this.order = config.order;
    this.group = config.group;
  }

  update(deltaTime: number): void {
    // Bombs don't move, but we could add animations here
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.isActive || this.isCollected) return;

    // Choose color based on state
    let fillColor = COLORS.BOMB;
    
    if (this.isCollected) {
      fillColor = COLORS.BOMB_COLLECTED;
    } else if (this.isBlinking) {
      // Blink between normal and next colors
      fillColor = Math.floor(Date.now() / 300) % 2 === 0 
        ? COLORS.BOMB 
        : COLORS.BOMB_NEXT;
    }

    // Draw bomb
    ctx.fillStyle = fillColor;
    ctx.fillRect(this.x, this.y, this.width, this.height);

    // Draw order number
    if (!this.isCollected) {
      ctx.fillStyle = '#000000';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        this.order.toString(),
        this.x + this.width / 2,
        this.y + this.height / 2
      );
    }
  }

  collect(): void {
    this.isCollected = true;
    this.isBlinking = false;
  }

  startBlinking(): void {
    this.isBlinking = true;
  }

  stopBlinking(): void {
    this.isBlinking = false;
  }
}