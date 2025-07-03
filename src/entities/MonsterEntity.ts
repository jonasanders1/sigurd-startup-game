import { BaseEntity, EntityConfig } from './BaseEntity';
import { COLORS } from '../types/constants';

export interface MonsterConfig extends EntityConfig {
  type: string;
  patrolStartX: number;
  patrolEndX: number;
  speed: number;
  direction?: number;
  color?: string;
}

export class MonsterEntity extends BaseEntity {
  public type: string;
  public patrolStartX: number;
  public patrolEndX: number;
  public speed: number;
  public direction: number;
  public color: string;
  public isFrozen: boolean = false;
  public isBlinking: boolean = false;

  constructor(config: MonsterConfig) {
    super(config);
    
    this.type = config.type;
    this.patrolStartX = config.patrolStartX;
    this.patrolEndX = config.patrolEndX;
    this.speed = config.speed;
    this.direction = config.direction || 1;
    this.color = config.color || COLORS.MONSTER;
  }

  update(deltaTime: number): void {
    if (!this.isActive || this.isFrozen) return;

    // Simple patrol AI
    this.velocityX = this.speed * this.direction;
    
    // Move
    this.x += this.velocityX;

    // Check patrol bounds and reverse direction
    if (this.x <= this.patrolStartX || this.x >= this.patrolEndX) {
      this.direction *= -1;
      // Clamp position to bounds
      this.x = Math.max(this.patrolStartX, Math.min(this.patrolEndX, this.x));
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.isActive) return;

    // Choose color based on state
    let fillColor = this.color;
    if (this.isFrozen) {
      fillColor = COLORS.MONSTER_FROZEN;
    } else if (this.isBlinking) {
      // Blink between normal and frozen colors
      fillColor = Math.floor(Date.now() / 200) % 2 === 0 
        ? this.color 
        : COLORS.MONSTER_FROZEN;
    }

    ctx.fillStyle = fillColor;
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }

  freeze(): void {
    this.isFrozen = true;
    this.isBlinking = false;
  }

  unfreeze(): void {
    this.isFrozen = false;
    this.isBlinking = false;
  }

  startBlinking(): void {
    this.isBlinking = true;
    this.isFrozen = false;
  }

  stopBlinking(): void {
    this.isBlinking = false;
  }
}