import { useGameStore } from "../stores/gameStore";
import { usePlayerStore } from "../stores/entities/playerStore";
import { useInputStore } from "../stores/systems/inputStore";
import { Player } from "../types/interfaces";
import { GAME_CONFIG } from "../types/constants";
import { Platform } from "../types/interfaces";
import { SpriteInstance } from "../lib/SpriteInstance";
import { log } from "../lib/logger";

export class PlayerManager {
  private moveX: number = 0;
  private mapClearedFallApplied: boolean = false;
  private animationController: any;

  constructor(animationController: any) {
    this.animationController = animationController;
  }

  setAnimationController(controller: any): void {
    this.animationController = controller;
  }

  setVelocity(x: number, y: number): void {
    // Set the player's velocity
  }

  update(deltaTime: number): void {
    const playerStore = usePlayerStore.getState();
    const inputStore = useInputStore.getState();
    let player = { ...playerStore.player };

    // Process input
    const moveX = this.processInput(inputStore.input);

    // Apply movement
    player.x += moveX * GAME_CONFIG.PLAYER_SPEED * (deltaTime / 16);

    // Apply gravity
    if (!player.isGrounded || player.velocityY < 0) {
      player.velocityY += player.gravity;
      player.y += player.velocityY;
    }

    // Handle jumping
    if (inputStore.input.space && player.isGrounded) {
      player.velocityY = -GAME_CONFIG.JUMP_FORCE;
      player.isGrounded = false;
      player.isJumping = true;
    }

    // Update animations
    if (this.animationController) {
      this.animationController.update(
        player.isGrounded,
        moveX,
        player.isJumping,
        player.velocityY
      );
    }

    // Update sprite
    if (player.sprite) {
      player.sprite.update(deltaTime);
    }

    // Update player state
    playerStore.updatePlayer(player);
  }

  private processInput(input: any): number {
    const playerStore = usePlayerStore.getState();
    const player = playerStore.player;
    let moveX = 0;

    // Handle horizontal movement
    if (input.left) {
      moveX = -1;
      if (player.sprite && !player.sprite.flipped) {
        player.sprite.setFlipped(true);
      }
    } else if (input.right) {
      moveX = 1;
      if (player.sprite && player.sprite.flipped) {
        player.sprite.setFlipped(false);
      }
    }

    return moveX;
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

  // Check collision with platforms
  checkPlatformCollision(
    player: Player,
    platforms: Platform[],
    ground?: Platform
  ): Player {
    let updatedPlayer = { ...player };
    updatedPlayer.isGrounded = false;

    // Check ground collision
    if (ground && player.velocityY >= 0) {
      const groundY = ground.y;
      const playerBottom = player.y + player.height;

      if (
        playerBottom >= groundY &&
        player.y < groundY &&
        player.x + player.width > ground.x &&
        player.x < ground.x + ground.width
      ) {
        updatedPlayer.y = groundY - player.height;
        updatedPlayer.velocityY = 0;
        updatedPlayer.isGrounded = true;
        updatedPlayer.isJumping = false;
      }
    }

    // Check platform collisions
    for (const platform of platforms) {
      if (player.velocityY >= 0) {
        const platformTop = platform.y;
        const playerBottom = player.y + player.height;

        if (
          playerBottom >= platformTop &&
          playerBottom <= platformTop + 15 &&
          player.x + player.width > platform.x &&
          player.x < platform.x + platform.width
        ) {
          updatedPlayer.y = platformTop - player.height;
          updatedPlayer.velocityY = 0;
          updatedPlayer.isGrounded = true;
          updatedPlayer.isJumping = false;
          break;
        }
      }
    }

    return updatedPlayer;
  }

  // Reset player position and state
  resetPlayer(x: number, y: number): void {
    const playerStore = usePlayerStore.getState();
    playerStore.setPlayerPosition(x, y);

    // Reset animation state
    if (this.animationController) {
      this.animationController.reset();
    }
  }

  // Get current player state
  getPlayer(): Player {
    return usePlayerStore.getState().player;
  }
}
