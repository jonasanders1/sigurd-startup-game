import { BaseEntity, EntityConfig } from './BaseEntity';
import { COLORS, GAME_CONFIG } from '../types/constants';
import { CoinTypeConfig } from '../types/interfaces';

export interface CoinEntityConfig extends EntityConfig {
  type: string;
  spawnX: number;
  spawnY: number;
  effectDuration?: number;
  colorIndex?: number;
  spawnTime?: number;
}

export class CoinEntity extends BaseEntity {
  public type: string;
  public spawnX: number;
  public spawnY: number;
  public isCollected: boolean = false;
  public effectDuration?: number;
  public colorIndex?: number;
  public spawnTime?: number;
  
  // Physics properties
  private hasGravity: boolean = true;
  private bounces: boolean = true;
  private bounceCount: number = 0;
  private maxBounces: number = 3;

  constructor(config: CoinEntityConfig) {
    super({
      ...config,
      width: config.width || GAME_CONFIG.COIN_SIZE,
      height: config.height || GAME_CONFIG.COIN_SIZE,
    });
    
    this.type = config.type;
    this.spawnX = config.spawnX;
    this.spawnY = config.spawnY;
    this.effectDuration = config.effectDuration;
    this.colorIndex = config.colorIndex;
    this.spawnTime = config.spawnTime || Date.now();
    
    // Set physics based on coin type
    this.setupPhysics();
  }

  private setupPhysics(): void {
    switch (this.type) {
      case 'POWER':
        this.hasGravity = true;
        this.bounces = true;
        break;
      case 'BONUS_MULTIPLIER':
      case 'EXTRA_LIFE':
        this.hasGravity = false;
        this.bounces = false;
        break;
    }
  }

  update(deltaTime: number): void {
    if (!this.isActive || this.isCollected) return;

    // Apply gravity if needed
    if (this.hasGravity) {
      this.applyGravity(GAME_CONFIG.COIN_GRAVITY);
    }

    // Move the coin
    this.move();
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.isActive || this.isCollected) return;

    let color: string;
    
    switch (this.type) {
      case 'POWER':
        color = COLORS.COIN_POWER;
        break;
      case 'BONUS_MULTIPLIER':
        color = COLORS.COIN_BONUS;
        break;
      case 'EXTRA_LIFE':
        color = COLORS.COIN_LIFE;
        break;
      default:
        color = '#FFFFFF';
    }

    // Draw coin as a circle
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(
      this.x + this.width / 2,
      this.y + this.height / 2,
      this.width / 2,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Draw inner circle for visual effect
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.arc(
      this.x + this.width / 2,
      this.y + this.height / 2,
      this.width / 3,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  collect(): void {
    this.isCollected = true;
    this.isActive = false;
  }

  bounce(): void {
    if (this.bounces && this.bounceCount < this.maxBounces) {
      this.velocityY = -GAME_CONFIG.COIN_BOUNCE_SPEED * 
        Math.pow(GAME_CONFIG.COIN_BOUNCE_DAMPING, this.bounceCount);
      this.bounceCount++;
    } else {
      this.velocityY = 0;
    }
  }

  // Check if coin should despawn (e.g., fell off screen)
  shouldDespawn(canvasHeight: number): boolean {
    return this.y > canvasHeight + 100;
  }
}