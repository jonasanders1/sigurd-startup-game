import { ServiceContainer, ServiceKeys } from './ServiceContainer';
import { GameState } from '../types/enums';

export interface IGameLoop {
  start(): void;
  stop(): void;
  pause(): void;
  resume(): void;
}

/**
 * GameLoop manages the main game loop and delegates to subsystems
 * This replaces the monolithic GameManager
 */
export class GameLoop implements IGameLoop {
  private animationFrameId: number | null = null;
  private lastTime: number = 0;
  private isPaused: boolean = false;
  private container: ServiceContainer;

  constructor(container: ServiceContainer) {
    this.container = container;
  }

  start(): void {
    if (this.animationFrameId) return;
    
    console.log('🎮 Starting game loop');
    this.lastTime = performance.now();
    this.gameLoop(this.lastTime);
  }

  stop(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    console.log('🛑 Game loop stopped');
  }

  pause(): void {
    this.isPaused = true;
    console.log('⏸️ Game loop paused');
  }

  resume(): void {
    this.isPaused = false;
    console.log('▶️ Game loop resumed');
  }

  private gameLoop = (currentTime: number): void => {
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    if (!this.isPaused) {
      try {
        // Get current game state
        const gameStore = this.container.get<any>(ServiceKeys.GAME_STORE);
        const currentState = gameStore.getState().gameState.currentState;

        // Update based on game state
        switch (currentState) {
          case GameState.PLAYING:
            this.updatePlaying(deltaTime);
            break;
          case GameState.MAP_CLEARED:
            this.updateMapCleared(deltaTime);
            break;
          case GameState.BONUS:
            this.updateBonus(deltaTime);
            break;
          // Other states don't need updates
        }

        // Always render
        this.render();
      } catch (error) {
        console.error('Error in game loop:', error);
      }
    }

    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  };

  private updatePlaying(deltaTime: number): void {
    // Get services
    const inputManager = this.container.get<any>(ServiceKeys.INPUT_MANAGER);
    const playerService = this.container.get<any>(ServiceKeys.PLAYER_SERVICE);
    const collisionManager = this.container.get<any>(ServiceKeys.COLLISION_MANAGER);
    const coinManager = this.container.get<any>(ServiceKeys.COIN_MANAGER);
    const levelService = this.container.get<any>(ServiceKeys.LEVEL_SERVICE);
    const gameStore = this.container.get<any>(ServiceKeys.GAME_STORE);

    // Get current state
    const state = gameStore.getState();
    const playerState = state.player.getState();

    // Handle pause
    if (inputManager.isKeyPressed('p') || inputManager.isKeyPressed('P')) {
      state.gameState.pause();
      return;
    }

    // Get input
    const input = {
      left: inputManager.isKeyPressed('ArrowLeft'),
      right: inputManager.isKeyPressed('ArrowRight'),
      up: inputManager.isKeyPressed('ArrowUp'),
      space: inputManager.isKeyPressed(' ') || inputManager.isKeyPressed('Space'),
      shift: inputManager.isShiftPressed(),
    };

    // Update player through service
    let updatedPlayer = playerService.updateMovement(playerState, input);
    updatedPlayer = playerService.handleJump(updatedPlayer, input);
    updatedPlayer = playerService.updateJump(updatedPlayer, input);
    updatedPlayer = playerService.handleFloat(updatedPlayer, input);
    updatedPlayer = playerService.applyPhysics(updatedPlayer, deltaTime);

    // Check boundaries
    const boundaryResult = playerService.checkBoundaries(updatedPlayer);
    if (boundaryResult.fellOffScreen) {
      state.gameState.loseLife();
      return;
    }

    // Handle collisions
    const collisionResult = collisionManager.checkAllCollisions(
      boundaryResult.player,
      state.level.getCurrentLevel()
    );

    // Update state with collision results
    if (collisionResult.player) {
      state.player.setPosition(collisionResult.player.x, collisionResult.player.y);
      state.player.setVelocity(collisionResult.player.velocityX, collisionResult.player.velocityY);
      state.player.updatePhysics({
        isGrounded: collisionResult.player.isGrounded,
        isFloating: collisionResult.player.isFloating,
        isJumping: collisionResult.player.isJumping,
        jumpStartTime: collisionResult.player.jumpStartTime,
      });
    }

    // Handle collected items
    if (collisionResult.collectedBomb) {
      state.bombs.collectBomb(collisionResult.collectedBomb);
    }
    if (collisionResult.collectedCoin) {
      coinManager.collectCoin(collisionResult.collectedCoin, state);
    }
    if (collisionResult.hitMonster) {
      state.gameState.loseLife();
    }

    // Update other game systems
    coinManager.update(deltaTime);
    levelService.checkWinCondition(state);
  }

  private updateMapCleared(deltaTime: number): void {
    // Handle falling animation after map is cleared
    const animationController = this.container.get<any>(ServiceKeys.ANIMATION_CONTROLLER);
    animationController.update(deltaTime);
  }

  private updateBonus(deltaTime: number): void {
    // Update bonus screen animations
    const gameStore = this.container.get<any>(ServiceKeys.GAME_STORE);
    const state = gameStore.getState();
    
    if (state.gameState.bonusAnimationComplete) {
      // Proceed to next level after delay
      setTimeout(() => {
        state.level.nextLevel();
        state.gameState.setState(GameState.PLAYING);
      }, 2000);
    }
  }

  private render(): void {
    const renderManager = this.container.get<any>(ServiceKeys.RENDER_MANAGER);
    renderManager.render();
  }
}