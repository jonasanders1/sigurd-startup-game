import { SpriteInstance } from "./SpriteInstance";

export type AnimationState = {
  isGrounded: boolean;
  isMoving: boolean;
  moveDirection: 'left' | 'right' | 'none';
  lastDirection: 'left' | 'right';
};

export class AnimationController {
  private sprite: SpriteInstance;
  private currentState: AnimationState;
  private wasInAir: boolean = false; // Track previous air state for landing detection
  private isLanding: boolean = false; // Track if currently playing landing animation

  constructor(sprite: SpriteInstance) {
    this.sprite = sprite;
    this.currentState = {
      isGrounded: true,
      isMoving: false,
      moveDirection: 'none',
      lastDirection: 'right'
    };
  }

  update(isGrounded: boolean, moveX: number): void {
    const newState: AnimationState = {
      isGrounded,
      isMoving: moveX !== 0,
      moveDirection: moveX > 0 ? 'right' : moveX < 0 ? 'left' : 'none',
      lastDirection: this.getLastDirection()
    };

    // Check if landing animation finished
    if (this.isLanding) {
      const currentAnim = this.sprite.currentAnimation.name;
      if (currentAnim.includes('land') && this.sprite.currentFrameIndex >= this.sprite.currentAnimation.frames.length - 1) {
        console.log('🎯 Landing animation finished');
        this.isLanding = false;
      }
    }

    // Check for landing transition
    const justLanded = this.wasInAir && isGrounded;
    
    this.currentState = newState;
    this.wasInAir = !isGrounded;

    if (justLanded && !this.isLanding) {
      // Player just landed - play landing animation
      console.log('🎯 Landing detected! Playing landing animation');
      this.setLandingAnimation();
    } else if (!this.isLanding) {
      // Normal animation update (only if not currently landing)
      this.updateAnimation();
    }
  }

  private getLastDirection(): 'left' | 'right' {
    const currentAnim = this.sprite.currentAnimation.name;
    return currentAnim.includes('right') ? 'right' : 'left';
  }

  private updateAnimation(): void {
    const { isGrounded, isMoving, moveDirection, lastDirection } = this.currentState;

    if (!isGrounded) {
      // In air - jump animations
      this.handleAirAnimations(moveDirection, lastDirection);
    } else if (isMoving) {
      // On ground and moving - walk animations
      this.handleWalkAnimations(moveDirection);
    } else {
      // On ground and not moving - idle animations
      this.handleIdleAnimations(lastDirection);
    }
  }

  private handleAirAnimations(moveDirection: 'left' | 'right' | 'none', lastDirection: 'left' | 'right'): void {
    if (moveDirection === 'right') {
      this.sprite.setAnimationPreserveFrame('jump-right');
    } else if (moveDirection === 'left') {
      this.sprite.setAnimationPreserveFrame('jump-left');
    } else {
      // No movement in air - maintain last direction
      const animation = lastDirection === 'right' ? 'jump-right' : 'jump-left';
      this.sprite.setAnimationPreserveFrame(animation);
    }
  }

  private handleWalkAnimations(moveDirection: 'left' | 'right' | 'none'): void {
    if (moveDirection === 'right') {
      this.sprite.setAnimation('walk-right');
    } else if (moveDirection === 'left') {
      this.sprite.setAnimation('walk-left');
    }
  }

  private handleIdleAnimations(lastDirection: 'left' | 'right'): void {
    const animation = lastDirection === 'right' ? 'idle-right' : 'idle-left';
    this.sprite.setAnimation(animation);
  }

  // Optional: Add landing animation support
  setLandingAnimation(): void {
    const { lastDirection } = this.currentState;
    const animation = lastDirection === 'right' ? 'land-right' : 'land-left';
    console.log(`🎯 Setting landing animation: ${animation} (direction: ${lastDirection})`);
    this.sprite.setAnimation(animation);
    this.isLanding = true;
  }

  // Debug method
  getCurrentState(): AnimationState {
    return { ...this.currentState };
  }
} 