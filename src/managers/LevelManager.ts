import { useGameStore } from "../stores/gameStore";
import { useStateStore } from "../stores/game/stateStore";
import { useLevelStore } from "../stores/game/levelStore";
import { useScoreStore } from "../stores/game/scoreStore";
import { usePlayerStore } from "../stores/entities/playerStore";
import { useCoinStore } from "../stores/entities/coinStore";
import { useMonsterStore } from "../stores/entities/monsterStore";
import { useRenderStore } from "../stores/systems/renderStore";
import { GameState, MenuType, AudioEvent } from "../types/enums";
import { GAME_CONFIG } from "../types/constants";
import { mapDefinitions } from "../maps/mapDefinitions";
import { sendMapCompletionData } from "../lib/communicationUtils";
import { log } from "../lib/logger";
import type { RenderManager } from "./RenderManager";
import type { OptimizedSpawnManager } from "./OptimizedSpawnManager";
import type { OptimizedRespawnManager } from "./OptimizedRespawnManager";
import type { ScalingManager } from "./ScalingManager";
import type { AnimationController } from "../lib/AnimationController";
import type { AudioManager } from "./AudioManager";
import type { PlayerManager } from "./PlayerManager";
import type { GameStateManager } from "./GameStateManager";

export class LevelManager {
  private mapStartTime: number = 0;
  private wasGroundedWhenMapCleared: boolean = false;
  
  // Dependencies
  private renderManager: RenderManager;
  private monsterSpawnManager: OptimizedSpawnManager;
  private monsterRespawnManager: OptimizedRespawnManager;
  private scalingManager: ScalingManager;
  private animationController: AnimationController;
  private audioManager: AudioManager;
  private playerManager: PlayerManager;
  private gameStateManager: GameStateManager;

  constructor(
    renderManager: RenderManager,
    monsterSpawnManager: OptimizedSpawnManager,
    monsterRespawnManager: OptimizedRespawnManager,
    scalingManager: ScalingManager,
    animationController: AnimationController,
    audioManager: AudioManager,
    playerManager: PlayerManager,
    gameStateManager: GameStateManager
  ) {
    this.renderManager = renderManager;
    this.monsterSpawnManager = monsterSpawnManager;
    this.monsterRespawnManager = monsterRespawnManager;
    this.scalingManager = scalingManager;
    this.animationController = animationController;
    this.audioManager = audioManager;
    this.playerManager = playerManager;
    this.gameStateManager = gameStateManager;
  }

  public loadCurrentLevel(): void {
    const gameState = useGameStore.getState();
    const levelStore = useLevelStore.getState();
    const renderStore = useRenderStore.getState();
    const monsterStore = useMonsterStore.getState();
    const coinStore = useCoinStore.getState();
    const currentLevel = levelStore.currentLevel;

    if (currentLevel <= mapDefinitions.length) {
      const mapDefinition = mapDefinitions[currentLevel - 1];
      gameState.initializeLevel(mapDefinition);

      // Clear floating texts when loading new level
      renderStore.clearAllFloatingTexts();

      // Reset animation controller state
      this.animationController.reset();

      // Start difficulty scaling for this map
      this.scalingManager.startMap();

      // Load parallax background (non-blocking)
      this.renderManager.loadMapBackground(mapDefinition.name);

      // Initialize monster spawn manager
      if (mapDefinition.monsterSpawnPoints) {
        log.info(
          `LevelManager: Initializing spawn points: ${mapDefinition.monsterSpawnPoints.length}`
        );
        this.monsterSpawnManager.initializeLevel(
          mapDefinition.monsterSpawnPoints
        );
      } else {
        log.info("LevelManager: No spawn points for this level");
        this.monsterSpawnManager.initializeLevel([]);
      }

      // Reset respawn manager
      this.monsterRespawnManager.reset();

      // Set up original spawn points for static monsters
      if (mapDefinition.monsters) {
        const monstersWithSpawnPoints = mapDefinition.monsters.map(
          (monster) => ({
            ...monster,
            originalSpawnPoint: { x: monster.x, y: monster.y },
          })
        );
        monsterStore.updateMonsters(monstersWithSpawnPoints);
        log.debug(
          `Set up spawn points for ${monstersWithSpawnPoints.length} static monsters`
        );
      }

      // Reset coins
      coinStore.resetCoinState();
      log.debug("Coins reset when loading new level");

      // Record map start time
      this.mapStartTime = Date.now();
    }
  }

  public checkWinCondition(): void {
    const stateStore = useStateStore.getState();
    const playerStore = usePlayerStore.getState();
    
    if (stateStore.collectedBombs.length === GAME_CONFIG.TOTAL_BOMBS) {
      log.game("Level completed - proceeding to next phase");

      // Record if player was grounded when map was cleared
      this.wasGroundedWhenMapCleared = playerStore.player.isGrounded;

      // Play map cleared sound
      this.audioManager.playSound(AudioEvent.MAP_CLEARED);

      // Set game state to MAP_CLEARED
      this.gameStateManager.setState(GameState.MAP_CLEARED);

      // Pause briefly, then proceed
      setTimeout(() => {
        this.proceedAfterMapCleared();
      }, 3000);
    }
  }

  private proceedAfterMapCleared(): void {
    const gameState = useGameStore.getState();
    const stateStore = useStateStore.getState();
    const levelStore = useLevelStore.getState();
    const scoreStore = useScoreStore.getState();
    const coinStore = useCoinStore.getState();
    const renderStore = useRenderStore.getState();

    // Stop power-up melody if active
    this.gameStateManager.stopPowerUpMelodyIfActive();

    // Calculate effective bomb count
    const livesLost = GAME_CONFIG.STARTING_LIVES - stateStore.lives;
    const effectiveCount = Math.max(0, stateStore.correctOrderCount - livesLost);

    const bonusPoints =
      GAME_CONFIG.BONUS_POINTS[
        effectiveCount as keyof typeof GAME_CONFIG.BONUS_POINTS
      ] || 0;

    // Calculate completion time
    const completionTime = Date.now() - this.mapStartTime;

    // Capture coin stats BEFORE resetting
    const coinStats = coinStore.getCoinStats();
    const coinsCollected = coinStats.totalCoinsCollected;
    const powerModeActivations = coinStats.totalPowerCoinsCollected;

    // Clear floating texts
    renderStore.clearAllFloatingTexts();

    // Reset coin effects and state
    coinStore.resetEffects();
    coinStore.resetCoinState();
    log.debug("Coins reset when map is cleared");

    // Record the level result
    if (levelStore.currentMap) {
      const levelResult = {
        level: levelStore.currentLevel,
        mapName: levelStore.currentMap.name,
        correctOrderCount: stateStore.correctOrderCount,
        effectiveCount: effectiveCount,
        totalBombs: GAME_CONFIG.TOTAL_BOMBS,
        score: scoreStore.score,
        bonus: bonusPoints,
        hasBonus: bonusPoints > 0,
        coinsCollected: coinsCollected,
        powerModeActivations: powerModeActivations,
        completionTime: completionTime,
        timestamp: Date.now(),
        lives: stateStore.lives,
        multiplier: scoreStore.multiplier,
      };
      levelStore.addLevelResult(levelResult);

      // Send map completion data
      sendMapCompletionData({
        mapName: levelStore.currentMap.name,
        level: levelStore.currentLevel,
        correctOrderCount: stateStore.correctOrderCount,
        totalBombs: GAME_CONFIG.TOTAL_BOMBS,
        score: scoreStore.score,
        bonus: bonusPoints,
        hasBonus: bonusPoints > 0,
        timestamp: Date.now(),
        lives: stateStore.lives,
        multiplier: scoreStore.multiplier,
        completionTime: completionTime,
        coinsCollected: coinsCollected,
        powerModeActivations: powerModeActivations,
      });
    }

    if (bonusPoints > 0) {
      // Reset bonus animation flag before showing bonus screen
      stateStore.setBonusAnimationComplete(false);
      
      // Show bonus screen
      this.gameStateManager.setState(GameState.BONUS, MenuType.BONUS);
      this.audioManager.playSound(AudioEvent.BONUS_SCREEN);
      scoreStore.addScore(bonusPoints);

      // Notify coin manager about bonus points
      if (coinStore.coinManager) {
        coinStore.coinManager.onPointsEarned(bonusPoints, true);
      }
    } else {
      // No bonus, go directly to next level
      this.proceedToNextLevel();
    }
  }

  public proceedToNextLevel(): void {
    const gameState = useGameStore.getState();
    const levelStore = useLevelStore.getState();
    const coinStore = useCoinStore.getState();
    const nextLevel = levelStore.currentLevel + 1;

    // Stop power-up melody if active
    this.gameStateManager.stopPowerUpMelodyIfActive();

    if (nextLevel <= mapDefinitions.length) {
      // Reset coin effects and state
      coinStore.resetEffects();
      coinStore.resetCoinState();
      log.debug("Coins reset when proceeding to next level");

      levelStore.nextLevel();
      this.loadCurrentLevel();

      // Reset background music flag
      this.gameStateManager.resetBackgroundMusicFlag();

      // Show countdown for next level
      this.gameStateManager.showCountdown();
    } else {
      // All levels completed - victory!
      this.gameStateManager.setState(GameState.VICTORY, MenuType.VICTORY);
    }
  }

  public respawnPlayer(): void {
    const levelStore = useLevelStore.getState();
    const renderStore = useRenderStore.getState();
    const coinStore = useCoinStore.getState();
    const monsterStore = useMonsterStore.getState();
    const currentMap = levelStore.currentMap;

    // Stop power-up melody if active
    this.gameStateManager.stopPowerUpMelodyIfActive();

    if (currentMap) {
      // Clear floating texts
      renderStore.clearAllFloatingTexts();

      // Reset difficulty
      this.scalingManager.resetOnDeath();
      log.debug("Difficulty reset after player death");

      // Reset coins
      coinStore.resetCoinState();
      log.debug("Coins reset after player death");

      // Reset player position
      this.playerManager.resetPlayer(
        currentMap.playerStart.x,
        currentMap.playerStart.y
      );

      // Reset monsters to starting positions
      const resetMonsters = currentMap.monsters.map((monster) => ({
        ...monster,
        x: (monster as any).patrolStartX || monster.x,
        direction: 1,
      }));
      monsterStore.updateMonsters(resetMonsters);

      // Reload background
      this.renderManager.loadMapBackground(currentMap.name);

      // Show countdown before resuming
      this.gameStateManager.showCountdown();
    }
  }

  public handleMapClearedFall(wasGroundedWhenMapCleared: boolean): void {
    const playerStore = usePlayerStore.getState();
    const levelStore = useLevelStore.getState();
    const player = playerStore.player;

    // Only apply gravity if player wasn't already grounded
    if (!wasGroundedWhenMapCleared) {
      const updatedPlayer = { ...player };
      updatedPlayer.velocityY += player.gravity;
      updatedPlayer.y += updatedPlayer.velocityY;

      // Check for ground collision
      const ground = levelStore.currentMap?.ground;
      if (ground) {
        const finalPlayer = this.playerManager.handlePlatformCollision(
          updatedPlayer,
          [],
          ground
        );
        playerStore.updatePlayer(finalPlayer);
      } else {
        playerStore.updatePlayer(updatedPlayer);
      }
    }
  }

  public getWasGroundedWhenMapCleared(): boolean {
    return this.wasGroundedWhenMapCleared;
  }

  public getTotalLevels(): number {
    return mapDefinitions.length;
  }

  public getMapStartTime(): number {
    return this.mapStartTime;
  }
}