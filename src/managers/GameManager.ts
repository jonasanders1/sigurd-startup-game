import { InputManager } from "./InputManager";
import { CollisionManager } from "./CollisionManager";
import { RenderManager } from "./RenderManager";
import { OptimizedSpawnManager } from "./OptimizedSpawnManager";
import { ScalingManager } from "./ScalingManager";
import { OptimizedRespawnManager } from "./OptimizedRespawnManager";
import { PlayerManager } from "./PlayerManager";
import { AudioManager } from "./AudioManager";
import { AnimationController } from "../lib/AnimationController";
import { GameLoopManager } from "./GameLoopManager";
import { GameStateManager } from "./GameStateManager";
import { LevelManager } from "./LevelManager";
import { ScoreManager } from "./ScoreManager";
import { PowerUpManager } from "./PowerUpManager";
import {
  useAudioStore,
  useGameStore,
  useLevelStore,
  usePlayerStore,
  useMonsterStore,
  useCoinStore,
  useStateStore,
  useRenderStore,
} from "../stores/gameStore";
import { GameState, AudioEvent } from "../types/enums";
import { DEV_CONFIG, GAME_CONFIG } from "../types/constants";
import { playerSprite } from "../entities/Player";
import { sendGameReady } from "../lib/communicationUtils";
import { log } from "../lib/logger";
import { SpawnDiagnostics } from "./spawn-diagnostics";

/**
 * GameManager - Main orchestrator for the game
 * Coordinates between all specialized managers
 */
export class GameManager {
  // Core managers
  private gameLoopManager: GameLoopManager;
  private gameStateManager: GameStateManager;
  private levelManager: LevelManager;
  private scoreManager: ScoreManager;
  private powerUpManager: PowerUpManager;
  private inputManager: InputManager;

  // Supporting managers
  private collisionManager: CollisionManager;

  private renderManager: RenderManager;
  private monsterSpawnManager: OptimizedSpawnManager;
  private audioManager: AudioManager;
  private animationController: AnimationController;
  private scalingManager: ScalingManager;
  private monsterRespawnManager: OptimizedRespawnManager;
  private playerManager: PlayerManager;

  constructor(canvas: HTMLCanvasElement) {
    // Create managers
    this.animationController = new AnimationController(playerSprite);
    this.renderManager = new RenderManager(canvas);
    this.collisionManager = new CollisionManager();
    this.audioManager = new AudioManager();
    this.inputManager = new InputManager();
    this.scalingManager = ScalingManager.getInstance();
    this.monsterRespawnManager = OptimizedRespawnManager.getInstance();
    this.playerManager = new PlayerManager(this.animationController);
    this.monsterSpawnManager = new OptimizedSpawnManager();

    // Set up player death callback
    this.playerManager.setDeathCallback(() => this.handlePlayerDeath());

    // Create higher-level managers that depend on the above
    this.gameStateManager = new GameStateManager(
      this.audioManager,
      this.scalingManager,
      this.monsterSpawnManager,
      this.monsterRespawnManager
    );

    this.scoreManager = new ScoreManager();

    this.powerUpManager = new PowerUpManager(
      this.audioManager,
      this.monsterRespawnManager,
      this.scoreManager
    );

    this.levelManager = new LevelManager(
      this.renderManager,
      this.monsterSpawnManager,
      this.monsterRespawnManager,
      this.scalingManager,
      this.animationController,
      this.audioManager,
      this.playerManager,
      this.gameStateManager
    );

    this.gameLoopManager = new GameLoopManager(
      this.renderManager,
      this.playerManager,
      this.monsterSpawnManager,
      this.monsterRespawnManager,
      this.collisionManager,
      this.animationController
    );

    // Set up callbacks for game loop manager
    this.gameLoopManager.setCallbacks({
      onUpdate: this.update.bind(this),
      onCollisions: this.handleCollisions.bind(this),
      onCheckWinCondition: this.checkWinCondition.bind(this),
      onMapClearedFall: this.handleMapClearedFall.bind(this),
    });

    // Set AudioManager reference in store
    const { setAudioManager } = useAudioStore.getState();
    const { setGameStateManager } = useStateStore.getState();
    const { setRenderManager } = useRenderStore.getState();

    if (setAudioManager) {
      setAudioManager(this.audioManager);
    }

    // Set GameStateManager reference in store
    if (setGameStateManager) {
      setGameStateManager(this.gameStateManager);
    }

    // Set RenderManager reference in store
    if (setRenderManager) {
      setRenderManager(this.renderManager);
    }
  }

  /**
   * Start the game
   */
  public start(): void {
    // Initialize input
    this.inputManager.initialize();

    // Handle dev mode if enabled
    if (DEV_CONFIG.ENABLED) {
      log.debug("DEV_MODE is ENABLED");
      log.debug(`Target state: ${DEV_CONFIG.TARGET_STATE}`);
      this.gameStateManager.initializeDevMode();
      this.levelManager.loadCurrentLevel();
    } else {
      // Normal game start
      const gameState = useGameStore.getState();
      gameState.resetGame();

      if ("setGameStartTime" in gameState) {
        (gameState as any).setGameStartTime(Date.now());
      }

      this.levelManager.loadCurrentLevel();
    }

    // Initialize spawn diagnostics for debugging
    this.initializeSpawnDiagnostics();

    // Send ready signal
    sendGameReady();

    // Start game loop
    this.gameLoopManager.start();
  }

  /**
   * Initialize spawn diagnostics utility
   */
  private initializeSpawnDiagnostics(): void {
    // Create and expose spawn diagnostics utility
    const diagnostics = new SpawnDiagnostics(
      this.monsterSpawnManager,
      this.monsterRespawnManager
    );

    // Make available globally for console debugging
    (window as any).spawnDiagnostics = {
      dump: () => diagnostics.dumpFullDiagnostics(),
      start: (intervalMs: number = 1000) => {
        (window as any).spawnDiagnosticsInstance = diagnostics;
        diagnostics.startDiagnostics(intervalMs);
      },
      stop: () => {
        const instance = (window as any).spawnDiagnosticsInstance;
        if (instance) {
          instance.stopDiagnostics();
          delete (window as any).spawnDiagnosticsInstance;
        }
      }
    };

    // Also expose managers for advanced debugging
    if (DEV_CONFIG.ENABLED) {
      (window as any).gameManagers = {
        spawn: this.monsterSpawnManager,
        respawn: this.monsterRespawnManager,
        gameState: this.gameStateManager,
        level: this.levelManager,
        audio: this.audioManager
      };
    }

    log.debug("Spawn diagnostics initialized - use spawnDiagnostics.dump() in console");
  }

  /**
   * Stop the game
   */
  public stop(): void {
    this.powerUpManager.stopPowerUpMelody();
    this.gameLoopManager.stop();
    this.audioManager.stopBackgroundMusic();
    this.gameStateManager.resetBackgroundMusicFlag();
  }

  /**
   * Main update method called by game loop
   */
  private update(deltaTime: number): void {
    const { currentState } = useStateStore.getState();
    const { currentMap } = useLevelStore.getState();

    // Handle background music and difficulty pausing
    this.gameStateManager.handleBackgroundMusic(currentState);
    this.gameStateManager.handleDifficultyPause(currentState);

    // Skip updates in dev mode if not playing
    if (
      DEV_CONFIG.ENABLED &&
      this.gameStateManager.isDevModeInitialized() &&
      currentState !== GameState.PLAYING
    ) {
      return;
    }

    // Check if level needs to be loaded
    if (currentState === GameState.MENU && !currentMap) {
      this.powerUpManager.stopPowerUpMelody();
      this.levelManager.loadCurrentLevel();
    }

    // Handle bonus animation completion
    this.gameStateManager.handleBonusCompletion(() => {
      log.info("Bonus completion callback triggered, proceeding to next level");
      this.levelManager.proceedToNextLevel();
    });

    // Update game loop (players, monsters, coins)
    if (currentState === GameState.PLAYING) {
      this.gameLoopManager.update(deltaTime);
    }
  }

  /**
   * Handle all collisions
   */
  private handleCollisions(): void {
    const { player } = usePlayerStore.getState();
    const { platforms, ground } = useLevelStore.getState();
    const { bombs } = useStateStore.getState();
    const { monsters } = useMonsterStore.getState();
    const { coins } = useCoinStore.getState();

    // Platform collisions
    const updatedPlayer = this.playerManager.handlePlatformCollision(
      player,
      platforms,
      ground
    );
    if (updatedPlayer !== player) {
      usePlayerStore.getState().updatePlayer(updatedPlayer);
    }

    // Bomb collisions
    const collectedBomb = this.collisionManager.checkPlayerBombCollision(
      player,
      bombs
    );
    if (collectedBomb) {
      this.audioManager.playSound(AudioEvent.BOMB_COLLECT);
      this.scoreManager.handleBombCollection(collectedBomb);
    }

    // Coin collisions
    const collectedCoin = this.collisionManager.checkPlayerCoinCollision(
      player,
      coins
    );
    if (collectedCoin) {
      this.audioManager.playSound(AudioEvent.COIN_COLLECT);
      this.scoreManager.handleCoinCollection(collectedCoin);
      this.powerUpManager.handlePowerCoinCollection(collectedCoin);
    }

    // Monster collisions
    const hitMonster = this.collisionManager.checkPlayerMonsterCollision(
      player,
      monsters
    );
    if (hitMonster) {
      this.handleMonsterCollision(hitMonster);
    }
  }

  /**
   * Handle monster collision with player
   */
  private handleMonsterCollision(monster: any): void {
    // Check god mode
    if (this.powerUpManager.isGodModeEnabled()) {
      log.debug("God mode enabled - player is invincible");
      return;
    }

    // Check power mode
    if (this.powerUpManager.isPowerModeActive()) {
      this.powerUpManager.handleMonsterCollisionDuringPowerMode(monster);
    } else {
      // Normal collision - player dies
      this.audioManager.playSound(AudioEvent.MONSTER_HIT);
      this.handlePlayerDeath();
    }
  }

  /**
   * Handle player death
   */
  private handlePlayerDeath(): void {
    const { lives, loseLife } = useStateStore.getState();

    // Stop any power-up effects
    this.powerUpManager.handlePlayerDeath();

    // Stop background music immediately when player dies
    this.audioManager.stopBackgroundMusic();
    this.gameStateManager.resetBackgroundMusicFlag();

    if (lives <= 1) {
      // Game over
      loseLife();
    } else {
      // Respawn player
      loseLife();
      this.levelManager.respawnPlayer();
    }
  }

  /**
   * Check if level is complete
   */
  private checkWinCondition(): void {
    this.levelManager.checkWinCondition();
  }

  /**
   * Handle map cleared falling animation
   */
  private handleMapClearedFall(wasGroundedWhenMapCleared: boolean): void {
    this.levelManager.handleMapClearedFall(
      this.levelManager.getWasGroundedWhenMapCleared()
    );
  }

  /**
   * Continue to next level (called from UI)
   */
  public continueToNextLevel(): void {
    this.gameStateManager.resetBackgroundMusicFlag();
    this.levelManager.proceedToNextLevel();
  }

  /**
   * Clean up resources
   */
  public cleanup(): void {
    this.stop();
    this.inputManager.destroy();
    this.audioManager.cleanup();
  }

  // Debug methods
  public getPauseStatus(): any {
    return {
      gameState: useStateStore.getState().currentState,
      scalingManager: this.scalingManager.getPauseStatus(),
      spawnManager: this.monsterSpawnManager.getPauseStatus(),
      respawnManager: {
        isPaused: this.monsterRespawnManager.isPaused(),
      },
    };
  }

  public getSpawnStatus(): any {
    return this.monsterSpawnManager.getSpawnStatus();
  }

  public getPowerUpStatus(): any {
    return this.powerUpManager.getPowerUpStatus();
  }

  public getSpawnManager(): OptimizedSpawnManager {
    return this.monsterSpawnManager;
  }
}
