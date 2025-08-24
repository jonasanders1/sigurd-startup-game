import {
  useGameStore,
  useInputStore,
  usePlayerStore,
  useStateStore,
} from "../stores/gameStore";
import { Player } from "../types/interfaces";
import { GAME_CONFIG } from "../types/constants";
import { CollisionManager } from "./CollisionManager";
import { AnimationController } from "../lib/AnimationController";
import { log } from "../lib/logger";

export class PlayerManager {
  private collisionManager: CollisionManager;
  private animationController: AnimationController;
  private bounds: { width: number; height: number };
  private onPlayerDeath?: () => void;

  constructor(animationController: AnimationController) {
    this.collisionManager = new CollisionManager();
    this.animationController = animationController;
    this.bounds = {
      width: GAME_CONFIG.CANVAS_WIDTH,
      height: GAME_CONFIG.CANVAS_HEIGHT,
    };
  }

  public setDeathCallback(callback: () => void): void {
    this.onPlayerDeath = callback;
  }

  update(deltaTime: number): void {
    const { player, updatePlayer } = usePlayerStore.getState();
    const { input } = useInputStore.getState();
    const { currentState, loseLife } = useStateStore.getState();
    // Handle input from store
    const moveX = this.processInput(input);

    // Update animation state
    this.animationController.update(
      player.isGrounded,
      moveX,
      player.isFloating,
      currentState
    );

    // Handle jumping mechanics
    this.handleJumping(player, input);

    // Handle fast fall and floating
    this.handleAirMovement(player, input);

    // Apply movement with frame-rate compensation
    this.applyMovement(player, moveX, deltaTime);

    // Apply physics (gravity, velocity)
    this.applyPhysics(player, deltaTime);

    // Handle boundary collisions
    const boundaryResult = this.collisionManager.resolveBoundaryCollision(
      player,
      this.bounds
    );

    if (boundaryResult.fellOffScreen) {
      // Player fell off screen - use death callback if available
      if (this.onPlayerDeath) {
        this.onPlayerDeath();
      } else {
        // Fallback to direct loseLife if no callback set
        loseLife();
      }
      return;
    }

    // Update player with boundary-resolved position
    const updatedPlayer = boundaryResult.player;

    // Reset grounded state
    player.isGrounded = false;

    // Update the store
    updatePlayer(updatedPlayer);
  }

  private processInput(input: any): number {
    const { player } = usePlayerStore.getState();
    let moveX = 0;
    if (input.left) {
      moveX = -player.moveSpeed;
    }
    if (input.right) {
      moveX = player.moveSpeed;
    }
    return moveX;
  }

  private handleJumping(player: Player, input: any): void {
    const isUpPressed = input.jump;
    const isShiftPressed = input.superJump;

    if (isUpPressed && player.isGrounded && !player.isJumping) {
      // Start jump
      player.isJumping = true;
      player.jumpStartTime = Date.now();
      player.isGrounded = false;

      // Initial jump velocity (minimum jump)
      const baseJumpPower = isShiftPressed
        ? GAME_CONFIG.SUPER_JUMP_POWER
        : GAME_CONFIG.JUMP_POWER;
      player.velocityY = -baseJumpPower * 0.6; // Start with 60% of jump power
    }

    // Continue jump if key is held and we're still in jump phase
    if (isUpPressed && player.isJumping && player.velocityY < 0) {
      const jumpDuration = Date.now() - player.jumpStartTime;

      if (jumpDuration <= GAME_CONFIG.MAX_JUMP_DURATION) {
        // Calculate additional jump power based on hold duration
        const holdRatio = Math.min(
          jumpDuration / GAME_CONFIG.MAX_JUMP_DURATION,
          1
        );
        const baseJumpPower = isShiftPressed
          ? GAME_CONFIG.SUPER_JUMP_POWER
          : GAME_CONFIG.JUMP_POWER;
        const targetVelocity = -baseJumpPower * (0.6 + 0.4 * holdRatio); // Scale from 60% to 100%

        // Gradually increase jump power with frame-rate compensation
        if (player.velocityY > targetVelocity) {
          player.velocityY = targetVelocity;
        }
      }
    }

    // End jump when key is released or max duration reached
    if (
      (!isUpPressed ||
        Date.now() - player.jumpStartTime > GAME_CONFIG.MAX_JUMP_DURATION) &&
      player.isJumping
    ) {
      player.isJumping = false;
    }
  }

  private handleAirMovement(player: Player, input: any): void {
    const isDownPressed = input.fastFall;
    const isSpacePressed = input.float;

    // Fast fall mechanic - Arrow Down kills upward momentum and speeds up fall
    if (isDownPressed && !player.isGrounded) {
      // Kill any upward momentum immediately
      if (player.velocityY < 0) {
        player.velocityY = 0;
      }
      // Set fast fall state
      player.isFastFalling = true;
    } else {
      player.isFastFalling = false;
    }

    // Floating mechanism - works anytime the player is in the air
    if (isSpacePressed && !player.isGrounded) {
      // Only kill momentum if we're just starting to float (not already floating)
      if (!player.isFloating) {
        player.velocityY = 0;
      }
      // Set floating state for slower fall
      player.isFloating = true;
    } else {
      // Key is not pressed or player is grounded - disable floating
      player.isFloating = false;
    }

    // Additional safety: disable floating if player becomes grounded
    if (player.isGrounded) {
      player.isFloating = false;
      player.isFastFalling = false;
    }
  }

  private applyMovement(
    player: Player,
    moveX: number,
    deltaTime: number
  ): void {
    player.velocityX = moveX;
    player.x += player.velocityX * (deltaTime / 16.67); // 16.67ms = 60fps for consistent speed
  }

  private applyPhysics(player: Player, deltaTime: number): void {
    // Apply gravity - handle different gravity states
    let gravity = player.gravity; // Default gravity

    if (player.isFloating && player.velocityY >= 0) {
      // Use float gravity when floating and falling
      gravity = player.floatGravity;
    } else if (player.isFastFalling) {
      // Use fast fall gravity multiplier when fast falling
      gravity = player.gravity * GAME_CONFIG.FAST_FALL_GRAVITY_MULTIPLIER;
    }

    player.velocityY += gravity * (deltaTime / 16.67); // Frame-rate compensation for gravity
    player.y += player.velocityY * (deltaTime / 16.67); // Frame-rate compensation for vertical movement
  }

  // Handle platform and ground collisions (called from GameManager)
  handlePlatformCollision(
    player: Player,
    platforms: any[],
    ground: any
  ): Player {
    let updatedPlayer = { ...player };

    // Platform collisions - handle all directions
    const platformCollision =
      this.collisionManager.checkPlayerPlatformCollision(player, platforms);
    if (
      platformCollision.hasCollision &&
      platformCollision.normal &&
      platformCollision.penetration
    ) {
      if (platformCollision.normal.y === -1) {
        // Landing on top of platform
        updatedPlayer.y = updatedPlayer.y - platformCollision.penetration;
        updatedPlayer.velocityY = 0;
        updatedPlayer.isGrounded = true;
        // Reset floating state when landing
        updatedPlayer.isFloating = false;
      } else if (platformCollision.normal.y === 1) {
        // Hitting platform from below
        updatedPlayer.y = updatedPlayer.y + platformCollision.penetration;
        updatedPlayer.velocityY = 0;
      } else if (platformCollision.normal.x === 1) {
        // Hitting platform from the right
        updatedPlayer.x = updatedPlayer.x + platformCollision.penetration;
        updatedPlayer.velocityX = 0;
      } else if (platformCollision.normal.x === -1) {
        // Hitting platform from the left
        updatedPlayer.x = updatedPlayer.x - platformCollision.penetration;
        updatedPlayer.velocityX = 0;
      }
    }

    // Ground collision - handle all directions
    if (ground) {
      const groundCollision = this.collisionManager.checkPlayerGroundCollision(
        updatedPlayer,
        ground
      );
      if (
        groundCollision.hasCollision &&
        groundCollision.normal &&
        groundCollision.penetration
      ) {
        if (groundCollision.normal.y === -1) {
          // Landing on top of ground
          updatedPlayer.y = updatedPlayer.y - groundCollision.penetration;
          updatedPlayer.velocityY = 0;
          updatedPlayer.isGrounded = true;
          // Reset floating state when landing
          updatedPlayer.isFloating = false;
        } else if (groundCollision.normal.y === 1) {
          // Hitting ground from below (shouldn't normally happen but just in case)
          updatedPlayer.y = updatedPlayer.y + groundCollision.penetration;
          updatedPlayer.velocityY = 0;
        } else if (groundCollision.normal.x === 1) {
          // Hitting ground from the right
          updatedPlayer.x = updatedPlayer.x + groundCollision.penetration;
          updatedPlayer.velocityX = 0;
        } else if (groundCollision.normal.x === -1) {
          // Hitting ground from the left
          updatedPlayer.x = updatedPlayer.x - groundCollision.penetration;
          updatedPlayer.velocityX = 0;
        }
      }
    }

    return updatedPlayer;
  }

  // Reset player position and state
  resetPlayer(x: number, y: number): void {
    const { player, updatePlayer } = usePlayerStore.getState();
    updatePlayer({ ...player, x, y });

    // Reset animation controller state
    this.animationController.reset();
  }

  // Get current player state
  getPlayer(): Player {
    const { player } = usePlayerStore.getState();
    return player;
  }
}
