export interface PlayerState {
  x: number;
  y: number;
  width: number;
  height: number;
  velocityX: number;
  velocityY: number;
  isGrounded: boolean;
  isFloating: boolean;
  isJumping: boolean;
  jumpStartTime: number;
  moveSpeed: number;
  jumpPower: number;
  gravity: number;
  floatGravity: number;
}

export interface PlayerConfig {
  width: number;
  height: number;
  color: string;
  moveSpeed: number;
  jumpPower: number;
  gravity: number;
  floatGravity: number;
  superJumpPower: number;
}

export interface PlayerAnimationState {
  isGrounded: boolean;
  isMoving: boolean;
  isFloating: boolean;
  moveDirection: 'left' | 'right' | 'none';
  lastDirection: 'left' | 'right';
}

export const DEFAULT_PLAYER_CONFIG: PlayerConfig = {
  width: 25,
  height: 40,
  color: '#00FF00',
  moveSpeed: 4,
  jumpPower: 8,
  gravity: 0.3,
  floatGravity: 0.005,
  superJumpPower: 12,
};