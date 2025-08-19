import { Player } from '../types/interfaces';
import { GAME_CONFIG } from '../types/constants';
import { GameState } from '../types/enums';
import { InputManager } from './InputManager';
import { AnimationController } from '../lib/AnimationController';
import { IPlayerPhysicsManager } from './interfaces/IPlayerPhysicsManager';
import { log } from '../lib/logger';

/**
 * Manages player physics and movement in the game.
 * Extracted from GameManager to follow single-responsibility principle.
 * 
 * Responsibilities:
 * - Handle player input for movement
 * - Apply physics (gravity, velocity, jump mechanics)
 * - Handle player states (jumping, floating, fast falling)
 * - Update animation states
 * 
 * @since 2.0.0
 */
export class PlayerPhysicsManager implements IPlayerPhysicsManager {
  private inputManager: InputManager;
  private animationController: AnimationController;

  constructor(inputManager: InputManager, animationController: AnimationController) {
    this.inputManager = inputManager;
    this.animationController = animationController;
  }

  /**
   * Updates the player's physics based on input and delta time.
   * This is the main update method that should be called each frame.
   * 
   * @param player - Current player state
   * @param deltaTime - Time elapsed since last frame in milliseconds
   * @param gameState - Current game state (for animation purposes)
   * @returns Updated player state after physics calculations
   */
  update(player: Player, deltaTime: number, gameState: GameState): Player {
    // Create a copy of the player to avoid mutations
    const updatedPlayer = { ...player };

    // Handle input and get movement state
    const movementState = this.handleInput(updatedPlayer);
    
    // Update animation state
    this.updateAnimation(updatedPlayer, movementState, gameState);
    
    // Apply physics calculations
    const physicsState = this.applyPhysics(updatedPlayer, movementState, deltaTime);
    
    // Apply the physics state to the player
    Object.assign(updatedPlayer, physicsState);

    return updatedPlayer;
  }

  /**
   * Handles player input and returns movement state
   * @private
   */
  private handleInput(player: Player): MovementState {
    const state: MovementState = {
      moveX: 0,
      jumpPressed: false,
      downPressed: false,
      shiftPressed: false,
      spacePressed: false,
    };

    // Horizontal movement
    if (this.inputManager.isKeyPressed("ArrowLeft")) {
      state.moveX = -player.moveSpeed;
    }
    if (this.inputManager.isKeyPressed("ArrowRight")) {
      state.moveX = player.moveSpeed;
    }

    // Vertical input states
    state.jumpPressed = this.inputManager.isKeyPressed("ArrowUp");
    state.downPressed = this.inputManager.isKeyPressed("ArrowDown");
    state.shiftPressed = this.inputManager.isShiftPressed();
    state.spacePressed = 
      this.inputManager.isKeyPressed(" ") || 
      this.inputManager.isKeyPressed("Space");

    return state;
  }

  /**
   * Updates the animation controller based on player state
   * @private
   */
  private updateAnimation(
    player: Player, 
    movementState: MovementState, 
    gameState: GameState
  ): void {
    this.animationController.update(
      player.isGrounded,
      movementState.moveX,
      player.isFloating,
      gameState
    );
  }

  /**
   * Applies physics calculations to the player
   * @private
   */
  private applyPhysics(
    player: Player,
    movementState: MovementState,
    deltaTime: number
  ): Partial<Player> {
    const physicsUpdate: Partial<Player> = {};
    
    // Handle jumping mechanics
    this.handleJumpMechanics(player, movementState, physicsUpdate);
    
    // Handle fast fall mechanic
    this.handleFastFall(player, movementState, physicsUpdate);
    
    // Handle floating mechanism
    this.handleFloating(player, movementState, physicsUpdate);
    
    // Apply horizontal movement
    physicsUpdate.velocityX = movementState.moveX;
    physicsUpdate.x = player.x + (physicsUpdate.velocityX ?? player.velocityX) * (deltaTime / 16.67);
    
    // Apply gravity
    const gravity = this.calculateGravity(player, physicsUpdate);
    const currentVelocityY = physicsUpdate.velocityY ?? player.velocityY;
    
    physicsUpdate.velocityY = currentVelocityY + gravity * (deltaTime / 16.67);
    physicsUpdate.y = player.y + physicsUpdate.velocityY * (deltaTime / 16.67);
    
    // Reset grounded state (will be set by collision detection)
    physicsUpdate.isGrounded = false;

    return physicsUpdate;
  }

  /**
   * Handles jump mechanics including variable height jumping
   * @private
   */
  private handleJumpMechanics(
    player: Player,
    movementState: MovementState,
    physicsUpdate: Partial<Player>
  ): void {
    const { jumpPressed, shiftPressed } = movementState;

    // Start jump
    if (jumpPressed && player.isGrounded && !player.isJumping) {
      physicsUpdate.isJumping = true;
      physicsUpdate.jumpStartTime = Date.now();
      physicsUpdate.isGrounded = false;

      // Initial jump velocity (minimum jump)
      const baseJumpPower = shiftPressed
        ? GAME_CONFIG.SUPER_JUMP_POWER
        : GAME_CONFIG.JUMP_POWER;
      physicsUpdate.velocityY = -baseJumpPower * 0.6; // Start with 60% of jump power
      
      log.debug(`Jump started: base power ${baseJumpPower}, initial velocity ${physicsUpdate.velocityY}`);
    }

    // Continue jump if key is held
    const isJumping = physicsUpdate.isJumping ?? player.isJumping;
    const jumpStartTime = physicsUpdate.jumpStartTime ?? player.jumpStartTime;
    const velocityY = physicsUpdate.velocityY ?? player.velocityY;
    
    if (jumpPressed && isJumping && velocityY < 0) {
      const jumpDuration = Date.now() - jumpStartTime;

      if (jumpDuration <= GAME_CONFIG.MAX_JUMP_DURATION) {
        // Calculate additional jump power based on hold duration
        const holdRatio = Math.min(
          jumpDuration / GAME_CONFIG.MAX_JUMP_DURATION,
          1
        );
        const baseJumpPower = shiftPressed
          ? GAME_CONFIG.SUPER_JUMP_POWER
          : GAME_CONFIG.JUMP_POWER;
        const targetVelocity = -baseJumpPower * (0.6 + 0.4 * holdRatio); // Scale from 60% to 100%

        // Gradually increase jump power
        if (velocityY > targetVelocity) {
          physicsUpdate.velocityY = targetVelocity;
        }
      }
    }

    // End jump when key is released or max duration reached
    if (isJumping) {
      const jumpDuration = Date.now() - jumpStartTime;
      if (!jumpPressed || jumpDuration > GAME_CONFIG.MAX_JUMP_DURATION) {
        physicsUpdate.isJumping = false;
      }
    }
  }

  /**
   * Handles fast fall mechanics
   * @private
   */
  private handleFastFall(
    player: Player,
    movementState: MovementState,
    physicsUpdate: Partial<Player>
  ): void {
    const { downPressed } = movementState;
    const isGrounded = physicsUpdate.isGrounded ?? player.isGrounded;

    if (downPressed && !isGrounded) {
      // Kill any upward momentum immediately
      const velocityY = physicsUpdate.velocityY ?? player.velocityY;
      if (velocityY < 0) {
        physicsUpdate.velocityY = 0;
      }
      // Set fast fall state
      physicsUpdate.isFastFalling = true;
    } else {
      physicsUpdate.isFastFalling = false;
    }
  }

  /**
   * Handles floating mechanics
   * @private
   */
  private handleFloating(
    player: Player,
    movementState: MovementState,
    physicsUpdate: Partial<Player>
  ): void {
    const { spacePressed } = movementState;
    const isGrounded = physicsUpdate.isGrounded ?? player.isGrounded;
    const isFloating = player.isFloating;

    if (spacePressed && !isGrounded) {
      // Only kill momentum if we're just starting to float
      if (!isFloating) {
        physicsUpdate.velocityY = 0;
      }
      // Set floating state for slower fall
      physicsUpdate.isFloating = true;
    } else {
      physicsUpdate.isFloating = false;
    }
  }

  /**
   * Calculates gravity based on player state
   * @private
   */
  private calculateGravity(player: Player, physicsUpdate: Partial<Player>): number {
    const isFloating = physicsUpdate.isFloating ?? player.isFloating;
    const isFastFalling = physicsUpdate.isFastFalling ?? player.isFastFalling;
    const velocityY = physicsUpdate.velocityY ?? player.velocityY;

    // Default gravity
    let gravity = player.gravity;

    if (isFloating && velocityY >= 0) {
      // Use float gravity when floating and falling
      gravity = player.floatGravity;
    } else if (isFastFalling) {
      // Use fast fall gravity multiplier
      gravity = player.gravity * GAME_CONFIG.FAST_FALL_GRAVITY_MULTIPLIER;
    }

    return gravity;
  }

  /**
   * Resets the player's physics state
   * Used when respawning or starting a new level
   */
  reset(): void {
    // Reset animation controller
    this.animationController.reset();
  }
}

/**
 * Movement state interface for input handling
 */
interface MovementState {
  moveX: number;
  jumpPressed: boolean;
  downPressed: boolean;
  shiftPressed: boolean;
  spacePressed: boolean;
}