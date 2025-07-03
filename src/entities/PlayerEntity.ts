import { BaseEntity, EntityConfig } from './BaseEntity';
import { SpriteInstance } from '../lib/SpriteInstance';
import { GAME_CONFIG, COLORS } from '../types/constants';
import { playerSprite } from './Player';

export interface PlayerConfig extends EntityConfig {
  moveSpeed?: number;
  jumpPower?: number;
  gravity?: number;
  floatGravity?: number;
}

export class PlayerEntity extends BaseEntity {
  // Movement properties
  public moveSpeed: number;
  public jumpPower: number;
  public gravity: number;
  public floatGravity: number;
  
  // State properties
  public isGrounded: boolean = false;
  public isFloating: boolean = false;
  public isJumping: boolean = false;
  public jumpStartTime: number = 0;
  
  // Sprite for rendering
  private sprite: SpriteInstance;
  
  constructor(config: PlayerConfig) {
    super({
      ...config,
      width: config.width || GAME_CONFIG.PLAYER_WIDTH,
      height: config.height || GAME_CONFIG.PLAYER_HEIGHT,
    });
    
    this.moveSpeed = config.moveSpeed || GAME_CONFIG.MOVE_SPEED;
    this.jumpPower = config.jumpPower || GAME_CONFIG.JUMP_POWER;
    this.gravity = config.gravity || GAME_CONFIG.GRAVITY;
    this.floatGravity = config.floatGravity || GAME_CONFIG.FLOAT_GRAVITY;
    this.sprite = playerSprite;
  }
  
  update(deltaTime: number): void {
    // Update sprite animation
    this.sprite.update(deltaTime);
    
    // Apply appropriate gravity based on floating state
    const currentGravity = this.isFloating && this.velocityY >= 0
      ? this.floatGravity
      : this.gravity;
    
    this.applyGravity(currentGravity);
    this.move();
  }
  
  render(ctx: CanvasRenderingContext2D): void {
    // Use sprite rendering if available, otherwise fallback to rectangle
    if (this.sprite) {
      this.sprite.draw(ctx, this.x, this.y);
    } else {
      ctx.fillStyle = COLORS.PLAYER;
      ctx.fillRect(this.x, this.y, this.width, this.height);
    }
  }
  
  // Player-specific methods
  jump(superJump: boolean = false): void {
    if (this.isGrounded && !this.isJumping) {
      this.isJumping = true;
      this.jumpStartTime = Date.now();
      this.isGrounded = false;
      
      const jumpPower = superJump ? GAME_CONFIG.SUPER_JUMP_POWER : this.jumpPower;
      this.velocityY = -jumpPower * 0.6; // Start with 60% power
    }
  }
  
  continueJump(superJump: boolean = false): void {
    if (this.isJumping && this.velocityY < 0) {
      const jumpDuration = Date.now() - this.jumpStartTime;
      
      if (jumpDuration <= GAME_CONFIG.MAX_JUMP_DURATION) {
        const holdRatio = Math.min(jumpDuration / GAME_CONFIG.MAX_JUMP_DURATION, 1);
        const jumpPower = superJump ? GAME_CONFIG.SUPER_JUMP_POWER : this.jumpPower;
        const targetVelocity = -jumpPower * (0.6 + 0.4 * holdRatio);
        
        if (this.velocityY > targetVelocity) {
          this.velocityY = targetVelocity;
        }
      }
    }
  }
  
  endJump(): void {
    this.isJumping = false;
  }
  
  startFloating(): void {
    if (!this.isGrounded && !this.isFloating) {
      this.velocityY = 0; // Kill momentum when starting to float
      this.isFloating = true;
    }
  }
  
  stopFloating(): void {
    this.isFloating = false;
  }
  
  moveLeft(): void {
    this.velocityX = -this.moveSpeed;
  }
  
  moveRight(): void {
    this.velocityX = this.moveSpeed;
  }
  
  stopMoving(): void {
    this.velocityX = 0;
  }
  
  land(): void {
    this.isGrounded = true;
    this.isJumping = false;
    this.velocityY = 0;
  }
  
  updateAnimation(moveX: number, currentGameState: any): void {
    // This will be handled by AnimationController
    // Keeping method for compatibility
  }
}