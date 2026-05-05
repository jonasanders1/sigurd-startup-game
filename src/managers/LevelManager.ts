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
import { PLAYFIELD_BOTTOM } from "../config/floor";
import { mapDefinitions } from "../maps/mapDefinitions";
import {
  sendMapCompletionData,
  sendLevelStart,
  sendGameCompletionData,
  GameCompletionData,
  calculateGameStats,
} from "../lib/communicationUtils";
import { log } from "../lib/logger";
import { endOfLevelBonus } from "../lib/bjRules";
import {
  cornerToBirdSpawnPosition,
  decideBirdSpawnCorner,
  type SpawnCorner,
} from "../lib/birdSpawn";
import { createLevelBird } from "./MonsterFactory";
import { useInputStore } from "../stores/systems/inputStore";
import { MonsterType } from "../types/enums";
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
  private gameStartTime: number = Date.now();
  private activeTimers: Set<ReturnType<typeof setTimeout>> = new Set();

  // Dependencies
  private renderManager: RenderManager;
  private monsterSpawnManager: OptimizedSpawnManager;
  private monsterRespawnManager: OptimizedRespawnManager;
  private scalingManager: ScalingManager;
  private animationController: AnimationController;
  private audioManager: AudioManager;
  private playerManager: PlayerManager;
  private gameStateManager: GameStateManager;

  private scheduleTimer(callback: () => void, delay: number): ReturnType<typeof setTimeout> {
    const id = setTimeout(() => {
      this.activeTimers.delete(id);
      callback();
    }, delay);
    this.activeTimers.add(id);
    return id;
  }

  private clearAllTimers(): void {
    for (const id of this.activeTimers) {
      clearTimeout(id);
    }
    this.activeTimers.clear();
  }

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

  /**
   * Load an arbitrary map (used by tutorial missions). Mirrors loadCurrentLevel
   * but skips the mapDefinitions index lookup and currentLevel coupling.
   */
  public loadTutorialMap(mapDefinition: import("../types/interfaces").MapDefinition): void {
    const gameStore = useGameStore.getState();
    const { clearAllFloatingTexts } = useRenderStore.getState();

    this.clearAllTimers();
    this.wasGroundedWhenMapCleared = false;
    this.monsterSpawnManager.cleanup();
    this.scalingManager.startMap();
    gameStore.initializeLevel(mapDefinition);
    clearAllFloatingTexts();
    this.animationController.reset();
    this.renderManager.loadMapBackground(mapDefinition.name);
    this.mapStartTime = Date.now();

    this.monsterSpawnManager.initializeLevel(mapDefinition.monsterSpawnPoints || []);
    this.monsterRespawnManager.reset();

    const { updateMonsters } = useMonsterStore.getState();
    if (mapDefinition.monsters) {
      const monstersWithSpawnPoints = mapDefinition.monsters.map((m) => ({
        ...m,
        originalSpawnPoint: { x: m.x, y: m.y },
      }));
      updateMonsters(monstersWithSpawnPoints);
    }
  }

  public loadCurrentLevel(): void {
    const { currentLevel } = useStateStore.getState();
    const gameStore = useGameStore.getState();
    const { clearAllFloatingTexts } = useRenderStore.getState();

    // Clear any pending timers from previous level
    this.clearAllTimers();

    if (currentLevel <= mapDefinitions.length) {
      const mapDefinition = mapDefinitions[currentLevel - 1];

      // Reset map cleared state for new level
      this.wasGroundedWhenMapCleared = false;

      // Cleanup spawn manager before loading new level
      this.monsterSpawnManager.cleanup();

      // IMPORTANT: Start difficulty scaling for this map BEFORE initializing monsters
      // This ensures monsters get the correct spawn time and start at base speed
      this.scalingManager.startMap();

      // Use the gameStore initializeLevel which properly sets up bombs, monsters, coins, and player
      gameStore.initializeLevel(mapDefinition);

      // Clear floating texts when loading new level
      clearAllFloatingTexts();

      // Reset animation controller state
      this.animationController.reset();

      // Load parallax background (non-blocking)
      this.renderManager.loadMapBackground(mapDefinition.name);

      // Send level start event for tracking
      sendLevelStart(currentLevel, mapDefinition.name);

      // Record level start time
      this.mapStartTime = Date.now();

      // F-coin: notify coin manager now that currentLevel reflects the level
      // actually being played. Must run AFTER nextLevel() bumps the store.
      const { coinManager } = useCoinStore.getState();
      coinManager?.onLevelStarted();

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
      const baseMonsters = mapDefinition.monsters ?? [];
      const monstersWithSpawnPoints = baseMonsters.map((monster) => ({
        ...monster,
        originalSpawnPoint: { x: monster.x, y: monster.y },
      }));

      // BJ §5.1.1: every level has exactly 1 bird. If the level didn't
      // author one (most don't — birds are global game-design data, not
      // per-level), inject one programmatically. Speed scales with level.
      if (!monstersWithSpawnPoints.some((m) => m.type === MonsterType.BIRD)) {
        const bird = createLevelBird(currentLevel);
        monstersWithSpawnPoints.push({
          ...bird,
          originalSpawnPoint: { x: bird.x, y: bird.y },
        });
      }

      // BJ §5.1.1: re-position the bird to the corner OPPOSITE the
      // direction the player is holding at level start. Player input on
      // this exact frame is the canonical trigger.
      this.applyBirdCornerSpawn(monstersWithSpawnPoints);

      updateMonsters(monstersWithSpawnPoints);
      log.debug(
        `Set up spawn points for ${monstersWithSpawnPoints.length} static monsters`
      );

      // Record map start time
      this.mapStartTime = Date.now();
    }
  }

  /**
   * BJ §5.1.1 bird corner-spawn. Mutates the FIRST BIRD monster's x/y based
   * on directional input held at this moment. No-op if no BIRD on the map.
   * Mutates `monsters` in place — only the corner-spawned bird's position
   * changes; everything else is preserved.
   */
  private applyBirdCornerSpawn(monsters: import("../types/interfaces").Monster[]): void {
    const birdIndex = monsters.findIndex((m) => m.type === MonsterType.BIRD);
    if (birdIndex < 0) return;

    const input = useInputStore.getState().input;
    // When no direction is held the spec gives no rule, so randomize over
    // the 4 corners. decideBirdSpawnCorner falls through to `fallback` on
    // each axis when input is neutral, so a random fallback gives a fully
    // random corner; held inputs still flip the result on their axis.
    const allCorners: SpawnCorner[] = [
      "top-left",
      "top-right",
      "bottom-left",
      "bottom-right",
    ];
    const fallback = allCorners[Math.floor(Math.random() * allCorners.length)];
    const corner = decideBirdSpawnCorner(
      {
        left: input.left,
        right: input.right,
        // Sigurd's "jump" key === ↑/W; "fastFall" === ↓/S.
        up: input.jump,
        down: input.fastFall,
      },
      fallback
    );
    const pos = cornerToBirdSpawnPosition(corner, {
      width: GAME_CONFIG.CANVAS_WIDTH,
      // Use playfield bottom (top of the floor strip) so bottom corners
      // spawn above the restricted ground, not inside it.
      height: PLAYFIELD_BOTTOM,
      monsterSize: GAME_CONFIG.MONSTER_SIZE,
    });

    monsters[birdIndex] = {
      ...monsters[birdIndex],
      x: pos.x,
      y: pos.y,
      originalSpawnPoint: { x: pos.x, y: pos.y },
    };
    log.debug(`BJ §5.1.1: bird re-spawned at corner ${corner} (${pos.x}, ${pos.y})`);
  }

  public checkWinCondition(): void {
    const {
      collectedBombs,
      tutorialMission,
      tutorialResult,
      currentState,
    } = useStateStore.getState();
    const { player } = usePlayerStore.getState();
    const { currentMap } = useLevelStore.getState();

    // Tutorials own their own completion; skip while a mission is active,
    // is finishing this same frame (tutorialResult set, tutorialMission
    // cleared), or has already flipped state out of PLAYING.
    if (
      tutorialMission !== null ||
      tutorialResult !== null ||
      currentState !== GameState.PLAYING
    ) {
      return;
    }

    // Win when every bomb in THIS map is collected. Reading currentMap.bombs.length
    // (instead of getTuned("TOTAL_BOMBS")) lets editor previews with N<23 bombs
    // also win cleanly without runtime padding.
    const targetCount = currentMap?.bombs?.length ?? 0;
    if (targetCount > 0 && collectedBombs.length === targetCount) {
      log.game("Level completed - proceeding to next phase");

      // Record if player was grounded when map was cleared
      this.wasGroundedWhenMapCleared = player.isGrounded;

      // Stop background music and play victory sound
      this.audioManager.stopBackgroundMusic();
      this.gameStateManager.resetBackgroundMusicFlag();
      this.audioManager.playSound(AudioEvent.MAP_CLEARED);

      // Set game state to MAP_CLEARED
      this.gameStateManager.setState(GameState.MAP_CLEARED);

      // Wait for victory sound to finish (~5s) before proceeding
      this.scheduleTimer(() => {
        this.proceedAfterMapCleared();
      }, 5000);
    }
  }

  private proceedAfterMapCleared(): void {
    const {
      correctOrderCount,
      lives,
      currentLevel,
      setBonusAnimationComplete,
      gameStateManager,
      collectedBombs,
    } = useStateStore.getState();
    const {
      getLevelCoinStats,
      resetEffects,
      softResetCoinState,
      resetLevelCoinCounters,
      coinManager,
    } = useCoinStore.getState();
    const { currentMap, addLevelResult } = useLevelStore.getState();
    const { score, levelScore, multiplier, addScore, addRawScore } =
      useScoreStore.getState();
    const { clearAllFloatingTexts } = useRenderStore.getState();

    // Stop power-up melody if active
    gameStateManager.stopPowerUpMelodyIfActive();

    // BJ end-of-level bonus is purely on firebombs collected in correct order
    // (no Sigurd-specific livesLost penalty). Lookup table in bjRules.
    const effectiveCount = correctOrderCount;
    const bonusPoints = endOfLevelBonus(effectiveCount);

    // Calculate completion time
    const completionTime = Date.now() - this.mapStartTime;

    // Capture level coin stats BEFORE resetting
    const coinStats = getLevelCoinStats();
    const coinsCollected = coinStats.totalCoinsCollected;
    const powerModeActivations = coinStats.totalPowerCoinsCollected;
    const pCoinTierCollections = coinStats.pCoinTierCollections;
    const founderCoinsCollected = coinStats.totalFounderCoinsCollected;

    // Clear floating texts
    clearAllFloatingTexts();

    // Reset coin effects but preserve spawn counters (B-coin counter should persist across maps)
    resetEffects();
    softResetCoinState(); // Use soft reset to preserve totalBonusMultiplierCoinsCollected
    log.debug("Coins reset when map is cleared (preserving spawn counters)");

    // Record the level result
    if (currentMap) {
      const levelResult = {
        level: currentLevel,
        mapName: currentMap.name,
        correctOrderCount: correctOrderCount,
        effectiveCount: effectiveCount,
        totalBombs: collectedBombs.length,
        score: levelScore, // Use levelScore for this level's earnings only
        bonus: bonusPoints,
        hasBonus: bonusPoints > 0,
        coinsCollected: coinsCollected,
        powerModeActivations: powerModeActivations,
        pCoinTierCollections: pCoinTierCollections,
        founderCoinsCollected: founderCoinsCollected,
        completionTime: completionTime,
        timestamp: Date.now(),
        lives: lives,
        multiplier: multiplier,
        isPartial: false,
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
      addRawScore(bonusPoints); // Use addRawScore to avoid multiplying bonus

      // Notify coin manager about bonus points
      const { onPointsEarned } = useCoinStore.getState();
      onPointsEarned(bonusPoints, true);
    } else {
      // No bonus, go directly to next level
      this.proceedToNextLevel();
    }
  }

  public proceedToNextLevel(): void {
    const { nextLevel, currentLevel, gameStateManager } =
      useStateStore.getState();
    const { resetEffects, softResetCoinState, resetLevelCoinCounters } =
      useCoinStore.getState();

    // Stop power-up melody if active
    gameStateManager.stopPowerUpMelodyIfActive();

    // Check if there are more levels BEFORE incrementing
    const nextLevelNumber = currentLevel + 1;
    if (nextLevelNumber <= mapDefinitions.length) {
      // Reset coin effects but preserve spawn counters
      resetEffects();
      softResetCoinState(); // Use soft reset to preserve counters
      resetLevelCoinCounters(); // Reset level-specific counters for the new level
      log.level("Proceeding to next level with preserved coin spawn counters");

      // Increment level only once
      nextLevel();

      // Reset background music flag
      gameStateManager.resetBackgroundMusicFlag();

      // IMPORTANT: Set state to COUNTDOWN BEFORE loading the new level
      // This ensures MAP_CLEARED state doesn't persist to the new level
      gameStateManager.setState(GameState.COUNTDOWN, MenuType.COUNTDOWN);

      // Now load the new level with a clean state
      this.loadCurrentLevel();

      // Start the countdown timer to transition to PLAYING
      this.scheduleTimer(() => {
        gameStateManager.setState(GameState.PLAYING);
      }, 3000);
    } else {
      // All levels completed - victory!
      gameStateManager.setState(GameState.VICTORY, MenuType.VICTORY);

      // Send game completion data for victory
      this.sendGameCompletion("completed");
    }
  }

  public respawnPlayer(): void {
    log.data(
      "CoinSpawn: Player respawn - resetting firebomb count, preserving other counters"
    );
    const { currentMap } = useLevelStore.getState();
    const { clearAllFloatingTexts } = useRenderStore.getState();
    const { updateMonsters } = useMonsterStore.getState();

    // Stop power-up melody if active
    this.gameStateManager.stopPowerUpMelodyIfActive();

    if (currentMap) {
      // Clear floating texts
      clearAllFloatingTexts();

      // Reset bomb sequence tracking so the player can start with any bomb
      // group again, but keep already-collected bombs collected.
      const { bombManager, bombs, setBombs } = useStateStore.getState();
      if (bombManager) {
        bombManager.resetActiveSequence();
      }
      setBombs(bombs.map((b) => ({ ...b, isBlinking: false })));

      // Reset difficulty
      this.scalingManager.resetOnDeath();
      log.debug("Difficulty reset after player death");

      // Reset firebomb count when player dies but preserve other coin spawn counters
      // The firebomb count resets to ensure player must collect 9 correct bombs again
      const { clearActiveCoins, coinManager } = useCoinStore.getState();

      // Clear active coins and reset firebomb count
      clearActiveCoins();
      // setFirebombCount(0);

      // Also reset the coin manager's internal firebomb count if available

      coinManager.resetFirebombCount();

      // Reset player position
      this.playerManager.resetPlayer(
        currentMap.playerStart.x,
        currentMap.playerStart.y
      );

      // Reset monsters to starting positions and clear individual properties
      const resetMonsters: import("../types/interfaces").Monster[] =
        currentMap.monsters.map((monster) => {
          const startX = 'patrolStartX' in monster ? monster.patrolStartX : monster.x;
          const resetMonster = {
            ...monster,
            x: startX,
            direction: 1,
            // Clear runtime scaling properties
            updateIntervalMultiplier: undefined,
            directnessMultiplier: undefined,
            speedMultiplier: undefined,
            spawnPauseTime: undefined,
            // Clear runtime movement properties
            walkLengths: undefined,
            currentWalkCount: undefined,
            originalSpawnX: undefined,
          };

          // Clear subtype-specific runtime properties
          if ('targetX' in resetMonster) resetMonster.targetX = undefined;
          if ('targetY' in resetMonster) resetMonster.targetY = undefined;
          if ('patrolSide' in resetMonster) resetMonster.patrolSide = undefined;
          if ('targetPlatformX' in resetMonster) resetMonster.targetPlatformX = undefined;
          if ('chaseTargetX' in resetMonster) resetMonster.chaseTargetX = undefined;
          if ('chaseTargetY' in resetMonster) resetMonster.chaseTargetY = undefined;
          if ('ambushCooldown' in resetMonster) resetMonster.ambushCooldown = undefined;

          return resetMonster;
        });

      // Preserve the auto-injected bird (spec §5.1.1, persistent through the
      // level) — it lives in the live store but not in currentMap.monsters.
      // The respawn queue (line below) is no longer wiped, so dead-and-
      // queued-for-respawn birds keep their place in the queue.
      for (const m of useMonsterStore.getState().monsters) {
        if (m.type === MonsterType.BIRD) {
          resetMonsters.push({ ...m, isFrozen: false });
        }
      }

      updateMonsters(resetMonsters);

      // Reset spawn manager and reinitialize spawn points
      if (currentMap.monsterSpawnPoints) {
        log.debug("Resetting spawn manager after player death");
        this.monsterSpawnManager.reset();
        this.monsterSpawnManager.initializeLevel(currentMap.monsterSpawnPoints);
      }

      // Don't reset the respawn manager. Pending respawns should continue
      // from where they were — the OptimizedRespawnManager already pauses
      // during the death/countdown state transition (see GameStateManager
      // pause cascade) and `totalPausedTime` shifts respawn deadlines
      // forward by exactly the pause duration. Resetting here was wiping
      // the deadMonsters queue, so monsters killed by a P-coin just before
      // a player death would never come back.

      // Reload background
      this.renderManager.loadMapBackground(currentMap.name);

      // Show countdown before resuming
      this.gameStateManager.showCountdown();
    }
  }

  public handleMapClearedFall(
    wasGroundedWhenMapCleared: boolean,
    deltaTime?: number
  ): void {
    const { player, updatePlayer } = usePlayerStore.getState();
    // Only apply gravity if player wasn't already grounded
    if (!wasGroundedWhenMapCleared) {
      const updatedPlayer = { ...player };
      // Apply frame-rate independent gravity
      const frameMultiplier = deltaTime ? deltaTime / 16.67 : 1; // 16.67ms = 60fps
      updatedPlayer.velocityY += player.gravity * frameMultiplier;
      updatedPlayer.y += updatedPlayer.velocityY * frameMultiplier;

      // Resolve against platforms first.
      let finalPlayer = this.playerManager.handlePlatformCollision(
        updatedPlayer,
        []
      );

      // Clamp to floor-top — without this, the post-clear fall path skips
      // boundary resolution (only the live PLAYING update calls
      // resolveBoundaryCollision) and Jack drops into the floor strip.
      if (finalPlayer.y + finalPlayer.height >= PLAYFIELD_BOTTOM) {
        finalPlayer = {
          ...finalPlayer,
          y: PLAYFIELD_BOTTOM - finalPlayer.height,
          velocityY: 0,
          isGrounded: true,
        };
      }

      updatePlayer(finalPlayer);
    }
  }

  /**
   * Send game completion data when game ends (victory or game over)
   */
  private sendGameCompletion(reason: "completed" | "failed"): void {
    const { score, multiplier } = useScoreStore.getState();
    const { currentLevel, lives } = useStateStore.getState();
    const { getLevelResults, getSessionId, getGameStartTime } =
      useLevelStore.getState();

    const levelResults = getLevelResults();
    const sessionId = getSessionId();
    const startTime = getGameStartTime() || this.gameStartTime;
    const endTime = Date.now();

    // Calculate comprehensive game stats
    const gameStats = calculateGameStats(
      levelResults,
      score,
      lives,
      multiplier,
      reason,
      startTime,
      endTime
    );

    const gameCompletionData: GameCompletionData = {
      finalScore: score,
      totalLevels: mapDefinitions.length,
      completedLevels: levelResults.filter((l: any) => !l.isPartial).length,
      timestamp: Date.now(),
      lives: lives,
      multiplier: multiplier,
      levelHistory: levelResults,
      totalCoinsCollected: gameStats.totalCoinsCollected,
      totalPowerModeActivations: gameStats.totalPowerModeActivations,
      totalPCoinTierCollections: gameStats.totalPCoinTierCollections,
      totalFounderCoinsCollected: gameStats.totalFounderCoinsCollected,
      totalBombs: gameStats.totalBombs,
      totalCorrectOrders: gameStats.totalCorrectOrders,
      averageCompletionTime: gameStats.averageCompletionTime,
      gameEndReason: reason,
      sessionId: sessionId,
      startTime: startTime,
      endTime: endTime,
    };

    sendGameCompletionData(gameCompletionData);
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
