import {
  useCoinStore,
  useGameStore,
  useLevelStore,
  useMonsterStore,
  usePlayerStore,
  useRenderStore,
  useScoreStore,
  useStateStore,
} from "../stores/gameStore";
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
    const { currentLevel } = useStateStore.getState();
    const gameStore = useGameStore.getState();
    const { clearAllFloatingTexts } = useRenderStore.getState();

    if (currentLevel <= mapDefinitions.length) {
      const mapDefinition = mapDefinitions[currentLevel - 1];
      
      // Use the gameStore initializeLevel which properly sets up bombs, monsters, coins, and player
      gameStore.initializeLevel(mapDefinition);

      // Clear floating texts when loading new level
      clearAllFloatingTexts();

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

      // Set up original spawn points for static monsters (this is already done in gameStore.initializeLevel, but we need spawn points)
      const { updateMonsters } = useMonsterStore.getState();
      if (mapDefinition.monsters) {
        const monstersWithSpawnPoints = mapDefinition.monsters.map(
          (monster) => ({
            ...monster,
            originalSpawnPoint: { x: monster.x, y: monster.y },
          })
        );
        updateMonsters(monstersWithSpawnPoints);
        log.debug(
          `Set up spawn points for ${monstersWithSpawnPoints.length} static monsters`
        );
      }

      // Record map start time
      this.mapStartTime = Date.now();
    }
  }

  public checkWinCondition(): void {
    const { collectedBombs } = useStateStore.getState();
    const { player } = usePlayerStore.getState();

    if (collectedBombs.length === GAME_CONFIG.TOTAL_BOMBS) {
      log.game("Level completed - proceeding to next phase");

      // Record if player was grounded when map was cleared
      this.wasGroundedWhenMapCleared = player.isGrounded;

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
    const {
      correctOrderCount,
      lives,
      currentLevel,
      setBonusAnimationComplete,
      gameStateManager,
    } = useStateStore.getState();
    const { getCoinStats, resetEffects, resetCoinState, coinManager } =
      useCoinStore.getState();
    const { currentMap, addLevelResult } = useLevelStore.getState();
    const { score, multiplier, addScore } = useScoreStore.getState();
    const { clearAllFloatingTexts } = useRenderStore.getState();

    // Stop power-up melody if active
    gameStateManager.stopPowerUpMelodyIfActive();

    // Calculate effective bomb count
    const livesLost = GAME_CONFIG.STARTING_LIVES - lives;
    const effectiveCount = Math.max(0, correctOrderCount - livesLost);

    const bonusPoints =
      GAME_CONFIG.BONUS_POINTS[
        effectiveCount as keyof typeof GAME_CONFIG.BONUS_POINTS
      ] || 0;

    // Calculate completion time
    const completionTime = Date.now() - this.mapStartTime;

    // Capture coin stats BEFORE resetting
    const coinStats = getCoinStats();
    const coinsCollected = coinStats.totalCoinsCollected;
    const powerModeActivations = coinStats.totalPowerCoinsCollected;

    // Clear floating texts
    clearAllFloatingTexts();

    // Reset coin effects and state
    resetEffects();
    resetCoinState();
    log.debug("Coins reset when map is cleared");

    // Record the level result
    if (currentMap) {
      const levelResult = {
        level: currentLevel,
        mapName: currentMap.name,
        correctOrderCount: correctOrderCount,
        effectiveCount: effectiveCount,
        totalBombs: GAME_CONFIG.TOTAL_BOMBS,
        score: score,
        bonus: bonusPoints,
        hasBonus: bonusPoints > 0,
        coinsCollected: coinsCollected,
        powerModeActivations: powerModeActivations,
        completionTime: completionTime,
        timestamp: Date.now(),
        lives: lives,
        multiplier: multiplier,
      };
      addLevelResult(levelResult);

      // Send map completion data
      sendMapCompletionData(levelResult);
    }

    if (bonusPoints > 0) {
      // Reset bonus animation flag before showing bonus screen
      setBonusAnimationComplete(false);

      // Show bonus screen
      this.gameStateManager.setState(GameState.BONUS, MenuType.BONUS);
      this.audioManager.playSound(AudioEvent.BONUS_SCREEN);
      addScore(bonusPoints);

      // Notify coin manager about bonus points
      if (coinManager) {
        coinManager.onPointsEarned(bonusPoints, true);
      }
    } else {
      // No bonus, go directly to next level
      this.proceedToNextLevel();
    }
  }

  public proceedToNextLevel(): void {
    const { nextLevel, currentLevel, gameStateManager } = useStateStore.getState();
    const { resetEffects, resetCoinState } = useCoinStore.getState();

    // Stop power-up melody if active
    gameStateManager.stopPowerUpMelodyIfActive();

    // Check if there are more levels BEFORE incrementing
    const nextLevelNumber = currentLevel + 1;
    if (nextLevelNumber <= mapDefinitions.length) {
      // Reset coin effects and state
      resetEffects();
      resetCoinState();
      log.debug("Coins reset when proceeding to next level");

      // Increment level only once
      nextLevel();
      this.loadCurrentLevel();

      // Reset background music flag
      gameStateManager.resetBackgroundMusicFlag();

      // Show countdown for next level
      gameStateManager.showCountdown();
    } else {
      // All levels completed - victory!
      gameStateManager.setState(GameState.VICTORY, MenuType.VICTORY);
    }
  }

  public respawnPlayer(): void {
    const { currentMap } = useLevelStore.getState();
    const { clearAllFloatingTexts } = useRenderStore.getState();
    const { resetCoinState } = useCoinStore.getState();
    const { updateMonsters } = useMonsterStore.getState();

    // Stop power-up melody if active
    this.gameStateManager.stopPowerUpMelodyIfActive();

    if (currentMap) {
      // Clear floating texts
      clearAllFloatingTexts();

      // Reset difficulty
      this.scalingManager.resetOnDeath();
      log.debug("Difficulty reset after player death");

      // Reset coins
      resetCoinState();
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
      updateMonsters(resetMonsters);

      // Reload background
      this.renderManager.loadMapBackground(currentMap.name);

      // Show countdown before resuming
      this.gameStateManager.showCountdown();
    }
  }

  public handleMapClearedFall(wasGroundedWhenMapCleared: boolean): void {
    const { player, updatePlayer } = usePlayerStore.getState();
    const { ground } = useLevelStore.getState();
    // Only apply gravity if player wasn't already grounded
    if (!wasGroundedWhenMapCleared) {
      const updatedPlayer = { ...player };
      updatedPlayer.velocityY += player.gravity;
      updatedPlayer.y += updatedPlayer.velocityY;

      // Check for ground collision

      if (ground) {
        const finalPlayer = this.playerManager.handlePlatformCollision(
          updatedPlayer,
          [],
          ground
        );
        updatePlayer(finalPlayer);
      } else {
        updatePlayer(updatedPlayer);
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
