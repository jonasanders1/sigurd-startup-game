import { useGameStore } from "../stores/gameStore";
import { GameState } from "../types/enums";
import { DEV_CONFIG } from "../types/constants";
import { log } from "../lib/logger";
import type { RenderManager } from "./RenderManager";
import type { PlayerManager } from "./PlayerManager";
import type { OptimizedSpawnManager } from "./OptimizedSpawnManager";
import type { OptimizedRespawnManager } from "./OptimizedRespawnManager";
import type { CollisionManager } from "./CollisionManager";
import type { AnimationController } from "../lib/AnimationController";
import { playerSprite } from "../entities/Player";

export class GameLoopManager {
  private animationFrameId: number | null = null;
  private lastTime = 0;
  private boundGameLoop: (currentTime: number) => void;
  
  // Dependencies
  private renderManager: RenderManager;
  private playerManager: PlayerManager;
  private monsterSpawnManager: OptimizedSpawnManager;
  private monsterRespawnManager: OptimizedRespawnManager;
  private collisionManager: CollisionManager;
  private animationController: AnimationController;
  
  // Callbacks for external managers
  private onUpdate?: (deltaTime: number) => void;
  private onCollisions?: () => void;
  private onCheckWinCondition?: () => void;
  private onMapClearedFall?: (wasGroundedWhenMapCleared: boolean) => void;

  constructor(
    renderManager: RenderManager,
    playerManager: PlayerManager,
    monsterSpawnManager: OptimizedSpawnManager,
    monsterRespawnManager: OptimizedRespawnManager,
    collisionManager: CollisionManager,
    animationController: AnimationController
  ) {
    this.renderManager = renderManager;
    this.playerManager = playerManager;
    this.monsterSpawnManager = monsterSpawnManager;
    this.monsterRespawnManager = monsterRespawnManager;
    this.collisionManager = collisionManager;
    this.animationController = animationController;
    
    // Bind the game loop once
    this.boundGameLoop = this.gameLoop.bind(this);
  }

  // Set callbacks for external managers
  public setCallbacks(callbacks: {
    onUpdate?: (deltaTime: number) => void;
    onCollisions?: () => void;
    onCheckWinCondition?: () => void;
    onMapClearedFall?: (wasGroundedWhenMapCleared: boolean) => void;
  }): void {
    this.onUpdate = callbacks.onUpdate;
    this.onCollisions = callbacks.onCollisions;
    this.onCheckWinCondition = callbacks.onCheckWinCondition;
    this.onMapClearedFall = callbacks.onMapClearedFall;
  }

  public start(): void {
    this.gameLoop(0);
  }

  public stop(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private gameLoop(currentTime: number): void {
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    const gameState = useGameStore.getState();

    // Handle dev mode special cases
    if (DEV_CONFIG.ENABLED && gameState.currentState !== GameState.PLAYING) {
      this.render();
      this.animationFrameId = requestAnimationFrame(this.boundGameLoop);
      return;
    }

    // Handle game states
    if (gameState.currentState === GameState.PLAYING) {
      this.updatePlaying(deltaTime);
    } else if (gameState.currentState === GameState.MAP_CLEARED) {
      this.updateMapCleared(deltaTime);
    } else if (gameState.currentState === GameState.BONUS) {
      // Call the update callback during BONUS state to allow checking for bonus animation completion
      if (this.onUpdate) {
        this.onUpdate(deltaTime);
      }
    }

    this.render();
    this.animationFrameId = requestAnimationFrame(this.boundGameLoop);
  }

  private updatePlaying(deltaTime: number): void {
    // Update sprite animation
    playerSprite.update(deltaTime);
    
    // Call external update handler
    this.onUpdate?.(deltaTime);
    
    // Handle collisions
    this.onCollisions?.();
    
    // Check win condition
    this.onCheckWinCondition?.();
  }

  private updateMapCleared(deltaTime: number): void {
    const gameState = useGameStore.getState();
    
    // Update sprite animation for map cleared state
    playerSprite.update(deltaTime);

    // Handle falling animation if needed
    this.onMapClearedFall?.(false); // Pass the appropriate flag

    // Update animation controller with actual player state
    const player = gameState.player;
    this.animationController.update(
      player.isGrounded,
      0,
      false,
      gameState.currentState
    );
  }

  public update(deltaTime: number): void {
    this.updatePlayer(deltaTime);
    this.updateMonsters(deltaTime);
    this.updateCoins(deltaTime);
  }

  private updatePlayer(deltaTime: number): void {
    this.playerManager.update(deltaTime);
  }

  private updateMonsters(deltaTime: number): void {
    const currentTime = Date.now();
    
    // Update monster spawn manager
    this.monsterSpawnManager.update(currentTime, deltaTime);
    
    // Update respawn manager
    const respawnedMonsters = this.monsterRespawnManager.update();
    
    const gameState = useGameStore.getState();
    let monsters = gameState.monsters;
    
    if (respawnedMonsters.length > 0) {
      monsters = [...monsters, ...respawnedMonsters];
      log.debug(
        `Added ${respawnedMonsters.length} respawned monsters to active list`
      );
    }
    
    gameState.updateMonsters(monsters);
  }

  private updateCoins(deltaTime: number): void {
    const gameState = useGameStore.getState();
    const platforms = gameState.currentMap?.platforms || [];
    const ground = gameState.currentMap?.ground;
    const coinManager = gameState.coinManager;

    if (ground && coinManager) {
      // Check spawn conditions for all coin types
      coinManager.checkSpawnConditions(
        gameState as unknown as Record<string, unknown>
      );

      // Let CoinManager handle all coin physics updates
      coinManager.update(platforms, ground, gameState);

      // Update the store with the latest coin state
      gameState.setCoins(coinManager.getCoins());

      // Update monster states based on power mode
      gameState.updateMonsterStates(gameState.monsters);
    }

    // Update floating texts
    gameState.updateFloatingTexts();
  }

  private render(): void {
    const gameState = useGameStore.getState();
    this.renderManager.render(
      gameState.player,
      gameState.platforms,
      gameState.bombs,
      gameState.monsters,
      gameState.ground,
      gameState.coins,
      gameState.floatingTexts,
      gameState.coinManager,
      this.monsterSpawnManager,
      gameState.currentMap,
      gameState
    );
  }
}