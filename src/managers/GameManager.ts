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
import { TutorialManager } from "./TutorialManager";
import { TUTORIAL_MISSIONS } from "../tutorials/missions";
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
import { Monster } from "../types/interfaces";
import { GameState, AudioEvent } from "../types/enums";
import { DEV_CONFIG, GAME_CONFIG } from "../types/constants";
import { playerSprite } from "../entities/Player";
import {
  sendGameReady,
  sendLevelFailure,
  LevelFailureData,
  LevelHistoryEntry,
  waitForAudioSettings,
  initializeAudioSettingsListener,
} from "../lib/communicationUtils";
import { log } from "../lib/logger";
import { SpawnDiagnostics } from "./spawn-diagnostics";
import { LevelResult } from "@/stores/game/levelStore";
import { waitForBridge, subscribeBalance } from "../lib/gameBridge";
import { useBalanceStore } from "../stores/systems/balanceStore";

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
  private tutorialManager!: TutorialManager;
  private audioSettingsListenerCleanup: (() => void) | null = null;
  private balanceUnsubscribe: (() => void) | null = null;
  private deathInProgress = false;

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

    this.tutorialManager = new TutorialManager();
    this.gameStateManager.setTutorialManager(this.tutorialManager);

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

    // Set up restart callback so GameStateManager can trigger a full level reload
    this.gameStateManager.setOnRestartCallback(() => {
      this.levelManager.loadCurrentLevel();
    });

    // BJ S-coin level-skip: dispatch from coin collection to LevelManager.
    this.gameStateManager.setOnSCoinLevelSkip(() => {
      this.levelManager.proceedToNextLevel();
    });

    // Tutorial map loading — bypasses currentLevel + mapDefinitions index.
    this.gameStateManager.setOnTutorialMapLoad((id) => {
      const mission = TUTORIAL_MISSIONS[id];
      this.levelManager.loadTutorialMap(mission.map);
    });

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
   * Note: All loading is now handled by LoadingManager before GameManager is created
   */
  public start(): void {
    // Reset death flag for clean start
    this.deathInProgress = false;

    // Initialize input
    this.inputManager.initialize();

    // Initialize ongoing audio settings listener for future updates
    // Audio settings have already been loaded by LoadingManager
    this.audioSettingsListenerCleanup = initializeAudioSettingsListener();

    // Detect and subscribe to the host balance bridge
    this.initializeBridge();

    // Handle dev mode if enabled
    if (DEV_CONFIG.ENABLED) {
      log.debug("DEV_MODE is ENABLED");
      log.debug(`Target state: ${DEV_CONFIG.TARGET_STATE}`);
      this.gameStateManager.initializeDevMode();
      this.levelManager.loadCurrentLevel();
    } else {
      // Normal game start
      const gameState = useGameStore.getState();
      log.data('CoinSpawn: Normal game start - full reset, all coin spawn counters cleared');
      gameState.resetGame();

      useLevelStore.getState().setGameStartTime(Date.now());

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
    if (!DEV_CONFIG.ENABLED) return;

    // Create and expose spawn diagnostics utility
    const diagnostics = new SpawnDiagnostics(
      this.monsterSpawnManager,
      this.monsterRespawnManager
    );

    let diagnosticsInstance: SpawnDiagnostics | null = null;

    // Make available globally for console debugging
    (window as unknown as Record<string, unknown>).spawnDiagnostics = {
      dump: () => diagnostics.dumpFullDiagnostics(),
      start: (intervalMs: number = 1000) => {
        diagnosticsInstance = diagnostics;
        diagnostics.startDiagnostics(intervalMs);
      },
      stop: () => {
        if (diagnosticsInstance) {
          diagnosticsInstance.stopDiagnostics();
          diagnosticsInstance = null;
        }
      },
    };

    // Expose managers for advanced debugging
    (window as unknown as Record<string, unknown>).gameManagers = {
      spawn: this.monsterSpawnManager,
      respawn: this.monsterRespawnManager,
      gameState: this.gameStateManager,
      level: this.levelManager,
      audio: this.audioManager,
    };

    log.debug(
      "Spawn diagnostics initialized - use spawnDiagnostics.dump() in console"
    );
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

    // Check if level needs to be loaded (initial load only)
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

      // Tutorial tick — checks completion conditions for the active mission.
      this.tutorialManager.update();
      const { tutorialResult, tutorialMission } = useStateStore.getState();
      if (tutorialResult && !tutorialMission) {
        this.gameStateManager.finishTutorialMission();
      }
    }
  }

  /**
   * Handle all collisions
   */
  private handleCollisions(): void {
    const { player } = usePlayerStore.getState();
    const { platforms } = useLevelStore.getState();
    const { bombs } = useStateStore.getState();
    const { monsters } = useMonsterStore.getState();
    const { coins } = useCoinStore.getState();

    // Platform collisions
    const updatedPlayer = this.playerManager.handlePlatformCollision(
      player,
      platforms
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
  private handleMonsterCollision(monster: Monster): void {
    // Skip all collision handling while death sequence is playing
    if (this.deathInProgress) return;

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
      this.handlePlayerDeath();
    }
  }

  /**
   * Handle player death
   */
  private handlePlayerDeath(): void {
    // Prevent re-entry while death sequence is playing out
    if (this.deathInProgress) return;
    this.deathInProgress = true;

    const stateNow = useStateStore.getState();

    // Tutorial: bypass score/credit/game-over flow. Survive resets timer +
    // respawns; other missions end with current stats.
    if (stateNow.tutorialMission) {
      this.audioManager.playSound(AudioEvent.MONSTER_HIT);
      this.tutorialManager.onPlayerDeath();
      const stillActive = useStateStore.getState().tutorialMission;
      if (stillActive) {
        this.levelManager.respawnPlayer();
      }
      this.deathInProgress = false;
      return;
    }

    const { lives, loseLife, currentLevel, correctOrderCount } =
      useStateStore.getState();
    const { score, levelScore, multiplier } = this.scoreManager.getScore
      ? {
          score: this.scoreManager.getScore(),
          levelScore: this.scoreManager.getLevelScore(),
          multiplier: this.scoreManager.getMultiplier(),
        }
      : { score: 0, levelScore: 0, multiplier: 1 };
    const { currentMap, addLevelResult } = useLevelStore.getState();
    const { getLevelCoinStats } = useCoinStore.getState();
    const { bombs } = useStateStore.getState();

    // Get level coin stats (accumulated across respawns)
    const coinStats = getLevelCoinStats();
    const levelStartTime = useLevelStore.getState().levelStartTime;
    const completionTime = Date.now() - levelStartTime;

    // Stop any power-up effects
    this.powerUpManager.handlePlayerDeath();

    // Stop background music immediately when player dies
    this.audioManager.stopBackgroundMusic();
    this.gameStateManager.resetBackgroundMusicFlag();

    if (lives <= 1) {
      // Send level failure event for tracking
      if (currentMap) {
        const failureData: LevelFailureData = {
          level: currentLevel,
          mapName: currentMap.name,
          score: score,
          bombs: bombs.filter((b) => b.isCollected).length,
          correctOrders: correctOrderCount,
          lives: lives - 1,
          multiplier: multiplier,
          timestamp: Date.now(),
        };
        sendLevelFailure(failureData);
      }

      // Record level data on final death
      if (currentMap) {
        const partialLevelResult: LevelHistoryEntry = {
          level: currentLevel,
          mapName: currentMap.name,
          score: levelScore,
          bonus: 0,
          coinsCollected: coinStats.totalCoinsCollected,
          powerModeActivations: coinStats.totalPowerCoinsCollected,
          pCoinTierCollections: coinStats.pCoinTierCollections,
          timestamp: Date.now(),
          correctOrderCount: correctOrderCount,
          totalBombs: bombs.filter((b) => b.isCollected).length,
          lives: lives - 1,
          multiplier: multiplier,
          isPartial: true,
        };
        addLevelResult(partialLevelResult as LevelResult);
      }

      // Play game over sound — it plays while the game over screen shows
      this.audioManager.playSound(AudioEvent.GAME_OVER);

      // Transition to GAME_OVER state immediately (stops all gameplay updates)
      loseLife();
      this.deathInProgress = false;
    } else {
      // Still have lives — play monster hit sound and respawn
      this.audioManager.playSound(AudioEvent.MONSTER_HIT);
      loseLife();
      this.levelManager.respawnPlayer();
      this.deathInProgress = false;
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
  private handleMapClearedFall(wasGroundedWhenMapCleared: boolean, deltaTime?: number): void {
    this.levelManager.handleMapClearedFall(wasGroundedWhenMapCleared, deltaTime);
  }

  /**
   * Continue to next level (called from UI)
   */
  public continueToNextLevel(): void {
    this.gameStateManager.resetBackgroundMusicFlag();
    this.levelManager.proceedToNextLevel();
  }

  /**
   * Initialize the host balance bridge (async, non-blocking).
   */
  private initializeBridge(): void {
    waitForBridge().then((bridge) => {
      if (bridge) {
        log.debug("Balance bridge connected");
        useBalanceStore.getState().setBridgeAvailable(true);
        useBalanceStore.getState().setBalance(bridge.getBalance());

        // Subscribe to live balance updates
        this.balanceUnsubscribe = subscribeBalance((info) => {
          useBalanceStore.getState().setBalance(info.currentBalance);
          log.debug(`Balance update: ${info.currentBalance} (${info.reason})`);
        });
      } else {
        log.debug("No balance bridge — standalone/free-play mode");
        useBalanceStore.getState().setBridgeAvailable(false);
      }
    });
  }

  /**
   * Clean up resources
   */
  public cleanup(): void {
    this.stop();
    this.inputManager.destroy();
    this.audioManager.cleanup();

    if (this.audioSettingsListenerCleanup) {
      this.audioSettingsListenerCleanup();
      this.audioSettingsListenerCleanup = null;
    }

    if (this.balanceUnsubscribe) {
      this.balanceUnsubscribe();
      this.balanceUnsubscribe = null;
    }
  }

  // Debug methods
  public getPauseStatus() {
    return {
      gameState: useStateStore.getState().currentState,
      scalingManager: this.scalingManager.getPauseStatus(),
      spawnManager: this.monsterSpawnManager.getPauseStatus(),
      respawnManager: {
        isPaused: this.monsterRespawnManager.isPaused(),
      },
    };
  }

  public getSpawnStatus() {
    return this.monsterSpawnManager.getSpawnStatus();
  }

  public getPowerUpStatus() {
    return this.powerUpManager.getPowerUpStatus();
  }

  public getSpawnManager(): OptimizedSpawnManager {
    return this.monsterSpawnManager;
  }
}
