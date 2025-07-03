import { PlayerState, PlayerConfig } from '../types';
import { ServiceContainer, ServiceKeys } from '../../../core/ServiceContainer';
import { GAME_CONFIG } from '../../../types/constants';

export interface IPlayerService {
  updateMovement(player: PlayerState, input: PlayerInput): PlayerState;
  applyPhysics(player: PlayerState, deltaTime: number): PlayerState;
  handleJump(player: PlayerState, input: PlayerInput): PlayerState;
  handleFloat(player: PlayerState, input: PlayerInput): PlayerState;
  checkBoundaries(player: PlayerState): { player: PlayerState; fellOffScreen: boolean };
}

export interface PlayerInput {
  left: boolean;
  right: boolean;
  up: boolean;
  space: boolean;
  shift: boolean;
}

/**
 * PlayerService handles all player-related business logic
 * Keeps the store focused on state management only
 */
export class PlayerService implements IPlayerService {
  private config: PlayerConfig;

  constructor(config: PlayerConfig) {
    this.config = config;
  }

  updateMovement(player: PlayerState, input: PlayerInput): PlayerState {
    const updated = { ...player };
    
    // Calculate horizontal movement
    let moveX = 0;
    if (input.left) moveX -= player.moveSpeed;
    if (input.right) moveX += player.moveSpeed;
    
    updated.velocityX = moveX;
    updated.x += moveX;
    
    return updated;
  }

  applyPhysics(player: PlayerState, deltaTime: number): PlayerState {
    const updated = { ...player };
    
    // Apply gravity based on floating state
    const gravity = player.isFloating && player.velocityY >= 0
      ? player.floatGravity
      : player.gravity;
    
    updated.velocityY += gravity;
    updated.y += updated.velocityY;
    
    return updated;
  }

  handleJump(player: PlayerState, input: PlayerInput): PlayerState {
    if (!input.up || !player.isGrounded || player.isJumping) {
      return player;
    }
    
    const updated = { ...player };
    
    // Start jump
    updated.isJumping = true;
    updated.jumpStartTime = Date.now();
    updated.isGrounded = false;
    
    // Initial jump velocity
    const baseJumpPower = input.shift
      ? this.config.superJumpPower
      : player.jumpPower;
    updated.velocityY = -baseJumpPower * 0.6; // Start with 60% power
    
    return updated;
  }

  handleFloat(player: PlayerState, input: PlayerInput): PlayerState {
    const updated = { ...player };
    
    if (input.space && !player.isGrounded) {
      // Kill momentum on first float
      if (!player.isFloating) {
        updated.velocityY = 0;
      }
      updated.isFloating = true;
    } else {
      updated.isFloating = false;
    }
    
    return updated;
  }

  checkBoundaries(player: PlayerState): { player: PlayerState; fellOffScreen: boolean } {
    const updated = { ...player };
    let fellOffScreen = false;
    
    // Left boundary
    if (updated.x < 0) {
      updated.x = 0;
      updated.velocityX = 0;
    }
    
    // Right boundary
    if (updated.x + updated.width > GAME_CONFIG.CANVAS_WIDTH) {
      updated.x = GAME_CONFIG.CANVAS_WIDTH - updated.width;
      updated.velocityX = 0;
    }
    
    // Top boundary
    if (updated.y < 0) {
      updated.y = 0;
      updated.velocityY = 0;
    }
    
    // Bottom boundary - fell off screen
    if (updated.y > GAME_CONFIG.CANVAS_HEIGHT) {
      fellOffScreen = true;
    }
    
    return { player: updated, fellOffScreen };
  }

  // Variable height jump mechanics
  updateJump(player: PlayerState, input: PlayerInput): PlayerState {
    if (!player.isJumping || player.velocityY >= 0) {
      return player;
    }
    
    const updated = { ...player };
    const jumpDuration = Date.now() - player.jumpStartTime;
    
    if (input.up && jumpDuration <= GAME_CONFIG.MAX_JUMP_DURATION) {
      // Continue jump with variable height
      const holdRatio = Math.min(
        jumpDuration / GAME_CONFIG.MAX_JUMP_DURATION,
        1
      );
      const baseJumpPower = input.shift
        ? this.config.superJumpPower
        : player.jumpPower;
      const targetVelocity = -baseJumpPower * (0.6 + 0.4 * holdRatio);
      
      if (updated.velocityY > targetVelocity) {
        updated.velocityY = targetVelocity;
      }
    } else {
      // End jump
      updated.isJumping = false;
    }
    
    return updated;
  }
}