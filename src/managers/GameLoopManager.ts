import { useGameStore } from "../stores/gameStore";
import { useStateStore } from "../stores/game/stateStore";
import { useLevelStore } from "../stores/game/levelStore";
import { usePlayerStore } from "../stores/entities/playerStore";
import { useCoinStore } from "../stores/entities/coinStore";
import { useMonsterStore } from "../stores/entities/monsterStore";
import { GameState } from "../types/enums";
import { DEV_CONFIG } from "../types/constants";
import { PlayerManager } from "./PlayerManager";
import { RenderManager } from "./RenderManager";
import { ScalingManager } from "./ScalingManager";
import { OptimizedSpawnManager } from "./OptimizedSpawnManager";
import { OptimizedRespawnManager } from "./OptimizedRespawnManager";
import { GAME_CONFIG } from "../types/constants";
import { log } from "../lib/logger";
import type { RenderManager } from "./RenderManager";
import type { PlayerManager } from "./PlayerManager";
import type { OptimizedSpawnManager } from "./OptimizedSpawnManager";
import type { OptimizedRespawnManager } from "./OptimizedRespawnManager";
import type { CollisionManager } from "./CollisionManager";
import type { AnimationController } from "../lib/AnimationController";
import { playerSprite } from "../entities/Player";
import { useScoreStore } from "../stores/game/scoreStore";
import { useRenderStore } from "../stores/game/renderStore";

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

    const stateStore = useStateStore.getState();

    // Handle dev mode special cases
    if (
      DEV_CONFIG.SKIP_TO_BONUS &&
      stateStore.currentState === GameState.LEVEL_COMPLETE
    ) {
      // Skip bonus screen logic
      requestAnimationFrame(this.gameLoop);
      return;
    }

    if (stateStore.currentState === GameState.PAUSED) {
      // ... existing code ...
    }

    if (stateStore.currentState === GameState.PLAYING) {
      // ... existing code ...
    }

    if (stateStore.currentState === GameState.MAP_CLEARED) {
      // ... existing code ...
    }
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
    const playerStore = usePlayerStore.getState();
    
    // Update sprite animation for map cleared state
    if (playerStore.player.sprite) {
      playerStore.player.sprite.update(deltaTime);
    }

    // Handle falling animation if needed
    this.onMapClearedFall?.(false); // Pass the appropriate flag

    // Update animation controller with actual player state
    const player = playerStore.player;
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
    
    const monsterStore = useMonsterStore.getState();
    let monsters = monsterStore.monsters;
    
    if (respawnedMonsters.length > 0) {
      monsterStore.addMonsters(respawnedMonsters);
    }
  }

  private updateCoins(deltaTime: number): void {
    const coinStore = useCoinStore.getState();
    const levelStore = useLevelStore.getState();
    const scoreStore = useScoreStore.getState();
    const stateStore = useStateStore.getState();
    const renderStore = useRenderStore.getState();
    const platforms = levelStore.currentMap?.platforms || [];
    const ground = levelStore.currentMap?.ground;

    if (coinStore.coinManager) {
      // Create a gameState object for backward compatibility with coinManager
      const gameState = {
        multiplier: scoreStore.multiplier,
        totalBonusMultiplierCoinsCollected: coinStore.totalBonusMultiplierCoinsCollected,
        addFloatingText: renderStore.addFloatingText,
        audioManager: stateStore.audioManager || null,
        activeEffects: coinStore.activeEffects
      };
      
      coinStore.coinManager.update(deltaTime, platforms, ground, gameState);
    }
  }

  private render(): void {
    const playerStore = usePlayerStore.getState();
    const monsterStore = useMonsterStore.getState();
    const stateStore = useStateStore.getState();
    const levelStore = useLevelStore.getState();
    const coinStore = useCoinStore.getState();
    
    this.renderManager.render(
      playerStore.player,
      monsterStore.monsters,
      stateStore.bombs,
      coinStore.coins || [],
      levelStore.currentMap
    );
  }
}