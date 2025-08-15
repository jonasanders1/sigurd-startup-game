import { InputManager } from "./InputManager";
import { CollisionManager } from "./CollisionManager";
import { RenderManager } from "./RenderManager";
import { OptimizedSpawnManager } from "./OptimizedSpawnManager";
import { ScalingManager } from "./ScalingManager";
import { OptimizedRespawnManager } from "./OptimizedRespawnManager";
import { useGameStore } from "../stores/gameStore";
import { GameState, MenuType } from "../types/enums";
import { Monster } from "../types/interfaces";
import { GAME_CONFIG, DEV_CONFIG } from "../types/constants";
import { mapDefinitions } from "../maps/mapDefinitions";
import { AudioManager } from "./AudioManager";
import { AudioEvent } from "../types/enums";
import { playerSprite } from "../entities/Player";
import { AnimationController } from "../lib/AnimationController";
import {
  sendGameReady,
  sendGameStateUpdate,
  sendMapCompletionData,
} from "../lib/communicationUtils";
import { log } from "../lib/logger";

export class GameManager {
  private inputManager: InputManager;
  private collisionManager: CollisionManager;
  private renderManager: RenderManager;
  private monsterSpawnManager: OptimizedSpawnManager;
  private audioManager: AudioManager;
  private animationController: AnimationController;
  private scalingManager: ScalingManager;
  private monsterRespawnManager: OptimizedRespawnManager;
  private animationFrameId: number | null = null;
  private lastTime = 0;
  private isBackgroundMusicPlaying = false;
  private previousGameState: GameState | null = null;
  private devModeInitialized = false;
  private boundGameLoop: (currentTime: number) => void;
  private wasGroundedWhenMapCleared: boolean = false;
  private mapStartTime: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.inputManager = new InputManager();
    this.collisionManager = new CollisionManager();
    this.renderManager = new RenderManager(canvas);
    this.audioManager = new AudioManager();
    this.animationController = new AnimationController(playerSprite);
    this.scalingManager = ScalingManager.getInstance();
    this.monsterRespawnManager = OptimizedRespawnManager.getInstance();

    // Initialize monster spawn manager with empty array initially
    this.monsterSpawnManager = new OptimizedSpawnManager();

    // Bind the game loop once to prevent multiple instances
    this.boundGameLoop = this.gameLoop.bind(this);

    // Set AudioManager reference in store for settings updates
    const gameState = useGameStore.getState();
    if ("setAudioManager" in gameState) {
      gameState.setAudioManager(this.audioManager);
    }
  }

  start(): void {
    // Check if DEV_MODE is enabled
    if (DEV_CONFIG.ENABLED) {
      log.dev("DEV_MODE is ENABLED");
      log.dev(`Target state: ${DEV_CONFIG.TARGET_STATE}`);
      this.initializeDevMode();
    } else {
      // Reset game state to ensure fresh start
      const gameState = useGameStore.getState();
      gameState.resetGame();

      // Set game start time when game actually starts
      if ("setGameStartTime" in gameState) {
        (gameState as any).setGameStartTime(Date.now());
      }

      // Initialize first level normally
      this.loadCurrentLevel();
    }

    // Send game ready signal to host
    sendGameReady();

    this.gameLoop(0);
  }

  private initializeDevMode(): void {
    const gameState = useGameStore.getState();

    // Reset game state first
    gameState.resetGameState();

    // Apply mock data AFTER reset
    gameState.addScore(DEV_CONFIG.MOCK_DATA.score);

    // Set lives (need to calculate difference)
    const currentLives = gameState.lives;
    const targetLives = DEV_CONFIG.MOCK_DATA.lives;
    if (targetLives < currentLives) {
      for (let i = 0; i < currentLives - targetLives; i++) {
        gameState.loseLife();
      }
      // Reset state after losing lives since loseLife might change it
      if (targetLives > 0) {
        gameState.setState(GameState.MENU);
      }
    }

    // Set level to target level in dev mode
    const targetLevel = DEV_CONFIG.TARGET_LEVEL;
    if (targetLevel > 1) {
      // Reset to level 1 first, then advance to target level
      gameState.resetLevelState();
      for (let i = 1; i < targetLevel; i++) {
        gameState.nextLevel();
      }
    }
    // Always load the current level data
    this.loadCurrentLevel();

    // Set the target state
    switch (DEV_CONFIG.TARGET_STATE) {
      case "START_MENU":
        gameState.setState(GameState.MENU);
        gameState.setMenuType(MenuType.START);
        break;
      case "COUNTDOWN":
        gameState.setState(GameState.COUNTDOWN);
        gameState.setMenuType(MenuType.COUNTDOWN);
        break;
      case "PLAYING":
        gameState.setState(GameState.PLAYING);
        gameState.setMenuType(MenuType.IN_GAME);
        break;
      case "PAUSED":
        gameState.setState(GameState.PAUSED);
        gameState.setMenuType(MenuType.PAUSE);
        break;
      case "SETTINGS":
        gameState.setState(GameState.MENU);
        gameState.setMenuType(MenuType.SETTINGS);
        break;
      case "BONUS":
        // Set collected bombs count for bonus screen
        gameState.setState(GameState.BONUS);
        gameState.setMenuType(MenuType.BONUS);
        // Mock the correct order count
        gameState.resetBombState();
        for (let i = 0; i < DEV_CONFIG.MOCK_DATA.correctOrderCount; i++) {
          gameState.collectBomb(i + 1);
        }
        break;
      case "VICTORY":
        gameState.setState(GameState.VICTORY);
        gameState.setMenuType(MenuType.VICTORY);
        break;
      case "GAME_OVER":
        gameState.setState(GameState.GAME_OVER);
        gameState.setMenuType(MenuType.GAME_OVER);
        break;
      default:
        log.warn(`Unknown DEV_MODE target state: ${DEV_CONFIG.TARGET_STATE}`);
        gameState.setState(GameState.MENU);
        gameState.setMenuType(MenuType.START);
    }

    // Set multiplier LAST to override any automatic calculations
    log.dev(
      `DEV_MODE: Setting multiplier to ${DEV_CONFIG.MOCK_DATA.multiplier}x with ${DEV_CONFIG.MOCK_DATA.multiplierScore} progress`
    );
    gameState.setMultiplier(
      DEV_CONFIG.MOCK_DATA.multiplier,
      DEV_CONFIG.MOCK_DATA.multiplierScore
    );

    log.dev(
      `DEV_MODE initialized with state: ${DEV_CONFIG.TARGET_STATE}, level: ${DEV_CONFIG.TARGET_LEVEL}`
    );
    this.devModeInitialized = true;
  }

  stop(): void {
    // Stop power-up melody if active
    if (this.audioManager.isPowerUpMelodyActive()) {
      this.audioManager.stopPowerUpMelody();
    }

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.audioManager.stopBackgroundMusic();
    this.isBackgroundMusicPlaying = false;
  }

  private loadCurrentLevel(): void {
    const gameState = useGameStore.getState();
    const currentLevel = gameState.currentLevel;

    if (currentLevel <= mapDefinitions.length) {
      const mapDefinition = mapDefinitions[currentLevel - 1];
      gameState.initializeLevel(mapDefinition);

      // Clear floating texts when loading new level
      gameState.clearAllFloatingTexts();

      // Reset animation controller state when loading new level
      this.animationController.reset();

      // Start difficulty scaling for this map
      this.scalingManager.startMap();

      // Load parallax background for this level based on map name (non-blocking)
      this.renderManager.loadMapBackground(mapDefinition.name);

      // Initialize monster spawn manager with map-specific spawn points
      if (mapDefinition.monsterSpawnPoints) {
        log.info(
          `GameManager: Initializing MonsterSpawnManager with ${mapDefinition.monsterSpawnPoints.length} spawn points`
        );
        this.monsterSpawnManager.initializeLevel(
          mapDefinition.monsterSpawnPoints
        );
      } else {
        log.info(
          `GameManager: Initializing MonsterSpawnManager with no spawn points`
        );
        this.monsterSpawnManager.initializeLevel([]);
      }

      // Reset respawn manager for new level
      this.monsterRespawnManager.reset();

      // Set up original spawn points for static monsters from the map
      if (mapDefinition.monsters) {
        const monstersWithSpawnPoints = mapDefinition.monsters.map(
          (monster) => ({
            ...monster,
            originalSpawnPoint: { x: monster.x, y: monster.y },
          })
        );
        gameState.updateMonsters(monstersWithSpawnPoints);
        log.debug(
          `Set up original spawn points for ${monstersWithSpawnPoints.length} static monsters`
        );
      }

      // Ensure coins are cleared when loading new level
      gameState.resetCoinState();
      log.debug("Coins reset when loading new level");

      // Record map start time for completion tracking
      this.mapStartTime = Date.now();
    }
  }

  private gameLoop(currentTime: number): void {
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    const gameState = useGameStore.getState();

    // Handle background music - only play during PLAYING state
    // This must be called before dev mode checks to ensure music stops when paused
    this.handleBackgroundMusic(gameState.currentState);

    // Handle difficulty manager pause/resume based on game state
    this.handleDifficultyPause(gameState.currentState);

    // DEV_MODE: Skip normal game logic if we're in dev mode and not in PLAYING state
    if (DEV_CONFIG.ENABLED && this.devModeInitialized) {
      // Only run normal game logic if we're in PLAYING state in dev mode
      if (gameState.currentState !== GameState.PLAYING) {
        this.render();
        this.animationFrameId = requestAnimationFrame(this.boundGameLoop);
        return;
      }
    }

    // Check if we need to reload the level after a reset
    if (gameState.currentState === GameState.MENU && !gameState.currentMap) {
      // Stop power-up melody if active (game reset/restart)
      if (this.audioManager.isPowerUpMelodyActive()) {
        this.audioManager.stopPowerUpMelody();
      }
      this.loadCurrentLevel();
    }

    // Check for bonus animation completion and auto-continue
    if (
      gameState.currentState === GameState.BONUS &&
      gameState.bonusAnimationComplete &&
      !DEV_CONFIG.ENABLED
    ) {
      // Animation is complete, proceed to next level after a brief delay
      setTimeout(() => {
        this.proceedToNextLevel();
      }, 2000); // 2 second delay after animation completes
      // Reset the flag to prevent multiple calls
      gameState.setBonusAnimationComplete(false);
    }

    if (gameState.currentState === GameState.PLAYING) {
      this.update(deltaTime);
      playerSprite.update(deltaTime);
      this.handleCollisions();
      this.checkWinCondition();
    } else if (gameState.currentState === GameState.MAP_CLEARED) {
      // Update sprite animation for map cleared state
      playerSprite.update(deltaTime);

      // Get current player state for falling
      const player = gameState.player;

      // Only apply gravity if player wasn't already grounded when map was cleared
      if (!this.wasGroundedWhenMapCleared) {
        // Apply gravity to make player fall
        const updatedPlayer = { ...player };
        updatedPlayer.velocityY += player.gravity;
        updatedPlayer.y += updatedPlayer.velocityY;

        // Check for ground collision during fall
        const ground = gameState.ground;
        if (ground) {
          const groundCollision =
            this.collisionManager.checkPlayerGroundCollision(
              updatedPlayer,
              ground
            );
          if (
            groundCollision.hasCollision &&
            groundCollision.normal &&
            groundCollision.penetration
          ) {
            if (groundCollision.normal.y === -1) {
              // Landing on ground
              updatedPlayer.y = updatedPlayer.y - groundCollision.penetration;
              updatedPlayer.velocityY = 0;
              updatedPlayer.isGrounded = true;
            }
          }
        }

        // Update player state
        gameState.updatePlayer(updatedPlayer);
      }

      // Update animation controller with actual player state
      this.animationController.update(
        player.isGrounded,
        0,
        false,
        gameState.currentState
      );
    }

    this.render();
    this.animationFrameId = requestAnimationFrame(this.boundGameLoop);
  }

  private handleDifficultyPause(currentState: GameState): void {
    // Pause difficulty scaling and monster spawning when game is not in PLAYING state
    if (currentState === GameState.PLAYING) {
      // Only resume if not paused by power mode
      if (!this.scalingManager.isCurrentlyPausedByPowerMode()) {
        this.scalingManager.resume();
      }
      this.scalingManager.resumeAllMonsterScaling();
      this.monsterSpawnManager.resume();
      this.monsterRespawnManager.resume();
      
      // Resume coin manager to restore powerup durations
      const gameState = useGameStore.getState();
      if (gameState.coinManager) {
        gameState.coinManager.resume();
      }
    } else {
      // Stop power-up melody when game is paused/stopped
      if (this.audioManager.isPowerUpMelodyActive()) {
        log.audio("Game paused/stopped, stopping PowerUp melody");
        this.audioManager.stopPowerUpMelody();
      }

      this.scalingManager.pause();
      this.scalingManager.pauseAllMonsterScaling();
      this.monsterSpawnManager.pause();
      this.monsterRespawnManager.pause();
      
      // Pause coin manager to preserve powerup durations
      const gameState = useGameStore.getState();
      if (gameState.coinManager) {
        gameState.coinManager.pause();
      }
    }
  }

  private handleBackgroundMusic(currentState: GameState): void {
    // Only play music during PLAYING state - stop in all other states
    const shouldPlayMusic = currentState === GameState.PLAYING;

    // Detect state changes
    const stateChanged = this.previousGameState !== currentState;

    if (stateChanged) {
      log.audio(
        `Game state changed: ${this.previousGameState} -> ${currentState}`
      );
    }

    // Always check if we need to start music when in PLAYING state
    // This ensures music restarts after powerup melody or after loading a new map
    if (shouldPlayMusic) {
      // Always check actual audio state, not our local flag
      // This handles cases where powerup melody stopped the music
      if (!this.audioManager.isBackgroundMusicActuallyPlaying()) {
        log.audio(`Starting/Restarting background music (local flag: ${this.isBackgroundMusicPlaying})`);
        this.audioManager.playSound(AudioEvent.BACKGROUND_MUSIC, currentState);
        this.isBackgroundMusicPlaying = true;
      }
    } else {
      // Stop music if we shouldn't be playing
      if (this.isBackgroundMusicPlaying || this.audioManager.isBackgroundMusicActuallyPlaying()) {
        log.audio(`Stopping background music (local flag: ${this.isBackgroundMusicPlaying})`);
        this.audioManager.stopBackgroundMusic();
        this.isBackgroundMusicPlaying = false;
      }
    }

    this.previousGameState = currentState;
  }

  private update(deltaTime: number): void {
    this.updatePlayer(deltaTime);
    this.updateMonsters(deltaTime);
    this.updateCoins(deltaTime);

    // Individual scaling is now handled by ScalingManager per monster
  }

  private updatePlayer(deltaTime: number): void {
    const gameState = useGameStore.getState();
    let player = { ...gameState.player };

    // Handle input
    let moveX = 0;
    if (this.inputManager.isKeyPressed("ArrowLeft")) {
      moveX = -player.moveSpeed;
    }
    if (this.inputManager.isKeyPressed("ArrowRight")) {
      moveX = player.moveSpeed;
    }

    // Update animation state
    this.animationController.update(
      player.isGrounded,
      moveX,
      player.isFloating,
      gameState.currentState
    );

    // Variable height jumping mechanics
    const isUpPressed = this.inputManager.isKeyPressed("ArrowUp");
    const isDownPressed = this.inputManager.isKeyPressed("ArrowDown");
    const isShiftPressed = this.inputManager.isShiftPressed();
    const isSpacePressed =
      this.inputManager.isKeyPressed(" ") ||
      this.inputManager.isKeyPressed("Space");

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
      player.isFloating = false;
    }

    // Apply movement with frame-rate compensation
    player.velocityX = moveX;
    player.x += player.velocityX * (deltaTime / 16.67); // 16.67ms = 60fps for consistent speed

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

    // Handle boundary collisions
    const bounds = {
      width: GAME_CONFIG.CANVAS_WIDTH,
      height: GAME_CONFIG.CANVAS_HEIGHT,
    };
    const boundaryResult = this.collisionManager.resolveBoundaryCollision(
      player,
      bounds
    );

    if (boundaryResult.fellOffScreen) {
      // Player fell off screen
      gameState.loseLife();
      return;
    }

    // Update player with boundary-resolved position
    player = boundaryResult.player;

    // Reset grounded state
    player.isGrounded = false;

    gameState.updatePlayer(player);
  }

  private updateMonsters(deltaTime: number): void {
    // Debug: Log that updateMonsters is being called (every 5 seconds)
    const currentTime = Date.now();
    const gameTime = (currentTime - this.mapStartTime) / 1000;

    if (
      Math.floor(gameTime / 5) !== Math.floor((gameTime - deltaTime / 1000) / 5)
    ) {
      log.debug(
        `GameManager.updateMonsters() called at ${gameTime.toFixed(1)}s`
      );
    }

    // Update monster spawn manager (handles spawning and behavior)
    this.monsterSpawnManager.update(currentTime, deltaTime);

    // Update respawn manager - get any monsters that should respawn
    const respawnedMonsters = this.monsterRespawnManager.update();

    // Get fresh game state after monster spawning
    const gameState = useGameStore.getState();

    // Add any respawned monsters back to the active monsters list
    let monsters = gameState.monsters;
    if (respawnedMonsters.length > 0) {
      monsters = [...monsters, ...respawnedMonsters];
      log.debug(
        `Added ${
          respawnedMonsters.length
        } respawned monsters to active list: ${respawnedMonsters
          .map((m) => m.type)
          .join(", ")}`
      );
    }

    // Debug: Log respawn status
    const deadMonsterCount = this.monsterRespawnManager.getDeadMonsterCount();
    if (deadMonsterCount > 0) {
      log.debug(
        `Respawn system: ${deadMonsterCount} monsters waiting to respawn`
      );
    }

    // Update the game state with any new monsters
    gameState.updateMonsters(monsters);

    // All monster behavior (including scaling) is now handled by MonsterBehaviorManager
    // through the OptimizedSpawnManager.update() call above
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

    // Update floating texts (remove expired ones)
    gameState.updateFloatingTexts();
  }

  private handleCollisions(): void {
    const gameState = useGameStore.getState();
    const { player, platforms, bombs, monsters, ground, coins } = gameState;

    // Platform collisions - handle all directions
    const platformCollision =
      this.collisionManager.checkPlayerPlatformCollision(player, platforms);
    if (
      platformCollision.hasCollision &&
      platformCollision.normal &&
      platformCollision.penetration
    ) {
      const updatedPlayer = { ...player };

      if (platformCollision.normal.y === -1) {
        // Landing on top of platform
        updatedPlayer.y = updatedPlayer.y - platformCollision.penetration;
        updatedPlayer.velocityY = 0;
        updatedPlayer.isGrounded = true;
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

      gameState.updatePlayer(updatedPlayer);
    }

    // Ground collision - handle all directions
    if (ground) {
      const groundCollision = this.collisionManager.checkPlayerGroundCollision(
        player,
        ground
      );
      if (
        groundCollision.hasCollision &&
        groundCollision.normal &&
        groundCollision.penetration
      ) {
        const updatedPlayer = { ...player };

        if (groundCollision.normal.y === -1) {
          // Landing on top of ground
          updatedPlayer.y = updatedPlayer.y - groundCollision.penetration;
          updatedPlayer.velocityY = 0;
          updatedPlayer.isGrounded = true;
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

        gameState.updatePlayer(updatedPlayer);
      }
    }

    // Bomb collisions
    const collectedBomb = this.collisionManager.checkPlayerBombCollision(
      player,
      bombs
    );
    if (collectedBomb) {
      this.audioManager.playSound(AudioEvent.BOMB_COLLECT);
      const result = gameState.collectBomb(collectedBomb.order);

      // Check if this was a firebomb (correct order) to trigger coin spawning
      if (result && result.isCorrect) {
        gameState.onFirebombCollected();
      }
    }

    // Coin collisions
    const collectedCoin = this.collisionManager.checkPlayerCoinCollision(
      player,
      coins
    );
    if (collectedCoin) {
      this.audioManager.playSound(AudioEvent.COIN_COLLECT);

      // Let the coin slice handle the collection (it will call coinManager.collectCoin internally)
      gameState.collectCoin(collectedCoin);

      // If it's a power coin, play special sound
      if (collectedCoin.type === "POWER") {
        this.audioManager.playSound(AudioEvent.POWER_COIN_ACTIVATE);
      }
    }

    // Monster collisions
    const hitMonster = this.collisionManager.checkPlayerMonsterCollision(
      player,
      monsters
    );
    if (hitMonster) {
      // Check if god mode is enabled in dev config
      if (DEV_CONFIG.GOD_MODE) {
        log.dev("God mode enabled - player is invincible to monsters");
        return; // Ignore monster collision entirely
      }

      // Check if power mode is active - if so, kill the monster instead
      if (gameState.activeEffects.powerMode) {
        // Monster is killed during power mode - use progressive bonus system
        const points =
          gameState.coinManager?.calculateMonsterKillPoints(
            gameState.multiplier
          ) || GAME_CONFIG.MONSTER_KILL_POINTS * gameState.multiplier; // Fallback
        gameState.addScore(points);

        // Show floating text for monster kill points
        if (gameState.addFloatingText) {
          const text = points.toString();
          gameState.addFloatingText(
            text,
            hitMonster.x + hitMonster.width / 2,
            hitMonster.y + hitMonster.height / 2,
            1000, // duration
            "#fff", // White color
            15 // fontSize
          );
        }

        // Notify coin manager about points earned (not bonus)
        if (gameState.coinManager) {
          gameState.coinManager.onPointsEarned(points, false);
        }

        log.debug(`Monster killed during power mode: ${points} points`);

        // Play monster kill sound (same as coin collect sound)
        this.audioManager.playSound(AudioEvent.COIN_COLLECT);

        // Kill the monster and schedule it for respawn
        this.monsterRespawnManager.killMonster(hitMonster);
      } else {
        // Normal monster collision - player dies
        this.audioManager.playSound(AudioEvent.MONSTER_HIT);
        this.handlePlayerDeath();
      }
    }
  }

  private handlePlayerDeath(): void {
    const gameState = useGameStore.getState();

    // Stop power-up melody if active (player died during power mode)
    if (this.audioManager.isPowerUpMelodyActive()) {
      log.audio("Player died during power mode, stopping PowerUp melody");
      this.audioManager.stopPowerUpMelody();
    }

    // Check if this will be the last life before calling loseLife
    if (gameState.lives <= 1) {
      // This will be the last life - just call loseLife and let it handle game over
      gameState.loseLife();
    } else {
      // Player will still have lives after losing one
      gameState.loseLife();
      this.respawnPlayer();
    }
  }

  private respawnPlayer(): void {
    const gameState = useGameStore.getState();
    const currentMap = gameState.currentMap;

    // Stop power-up melody if active (player respawning)
    if (this.audioManager.isPowerUpMelodyActive()) {
      log.audio("Player respawning, stopping PowerUp melody");
      this.audioManager.stopPowerUpMelody();
    }

    if (currentMap) {
      // Clear floating texts when respawning
      gameState.clearAllFloatingTexts();

      // Reset difficulty to base values when player dies
      this.scalingManager.resetOnDeath();
      log.debug(
        "ScalingManager: Reset difficulty to base values after player death"
      );

      // Reset coins when player dies
      gameState.resetCoinState();
      log.debug("Coins reset after player death");

      // Reset player position
      gameState.setPlayerPosition(
        currentMap.playerStart.x,
        currentMap.playerStart.y
      );

      // Reset monsters to starting positions
      const resetMonsters = currentMap.monsters.map((monster) => ({
        ...monster,
        x: (monster as any).patrolStartX || monster.x,
        direction: 1, // Reset to initial direction
      }));
      gameState.updateMonsters(resetMonsters);

      // Reset animation controller state
      this.animationController.reset();

      // Reload parallax background for the current level
      this.renderManager.loadMapBackground(currentMap.name);

      // Show countdown before resuming
      gameState.setMenuType(MenuType.COUNTDOWN);
      gameState.setState(GameState.COUNTDOWN);

      setTimeout(() => {
        gameState.setState(GameState.PLAYING);
      }, 3000);
    }
  }

  private checkWinCondition(): void {
    const gameState = useGameStore.getState();
    if (gameState.collectedBombs.length === GAME_CONFIG.TOTAL_BOMBS) {
      // Level completed - this will trigger a state change which will stop the music
      log.game("Level completed - proceeding to next phase");

      // Record if player was grounded when map was cleared
      this.wasGroundedWhenMapCleared = gameState.player.isGrounded;

      // Play map cleared sound
      this.audioManager.playSound(AudioEvent.MAP_CLEARED);

      // Set game state to MAP_CLEARED to trigger the animation
      gameState.setState(GameState.MAP_CLEARED);

      // Pause the game briefly, then proceed
      setTimeout(() => {
        this.proceedAfterMapCleared();
      }, 3000); // Brief pause to hear the sound and see the animation
    }
  }

  private proceedAfterMapCleared(): void {
    const gameState = useGameStore.getState();

    // Stop power-up melody if active (map completed during power mode)
    if (this.audioManager.isPowerUpMelodyActive()) {
      log.audio("Map completed during power mode, stopping PowerUp melody");
      this.audioManager.stopPowerUpMelody();
    }

    // Calculate effective bomb count by subtracting lives lost
    // Each life lost is equivalent to missing one bomb
    const livesLost = GAME_CONFIG.STARTING_LIVES - gameState.lives;
    const effectiveCount = Math.max(0, gameState.correctOrderCount - livesLost);

    const bonusPoints =
      GAME_CONFIG.BONUS_POINTS[
        effectiveCount as keyof typeof GAME_CONFIG.BONUS_POINTS
      ] || 0;

    // Calculate completion time
    const completionTime = Date.now() - this.mapStartTime;

    // Capture coin collection data BEFORE resetting effects
    const coinStats = gameState.getCoinStats();
    const coinsCollected = coinStats.totalCoinsCollected;
    const powerModeActivations = coinStats.totalPowerCoinsCollected;

    // Clear floating texts when map is completed
    gameState.clearAllFloatingTexts();

    // Reset coin effects and state when map is completed
    gameState.resetEffects();
    gameState.resetCoinState();
    log.debug("Coins reset when map is cleared");

    // Record the level result when level is completed
    if (gameState.currentMap) {
      const levelResult = {
        level: gameState.currentLevel,
        mapName: gameState.currentMap.name,
        correctOrderCount: gameState.correctOrderCount,
        effectiveCount: effectiveCount, // Add effective count for transparency
        totalBombs: GAME_CONFIG.TOTAL_BOMBS,
        score: gameState.score,
        bonus: bonusPoints,
        hasBonus: bonusPoints > 0,
        coinsCollected: coinsCollected,
        powerModeActivations: powerModeActivations,
        completionTime: completionTime,
        timestamp: Date.now(),
        lives: gameState.lives,
        multiplier: gameState.multiplier,
      };
      gameState.addLevelResult(levelResult);

      // Send comprehensive map completion data to external site
      const mapCompletionData = {
        mapName: gameState.currentMap.name,
        level: gameState.currentLevel,
        correctOrderCount: gameState.correctOrderCount,
        totalBombs: GAME_CONFIG.TOTAL_BOMBS,
        score: gameState.score,
        bonus: bonusPoints,
        hasBonus: bonusPoints > 0,
        timestamp: Date.now(),
        lives: gameState.lives,
        multiplier: gameState.multiplier,
        completionTime: completionTime,
        coinsCollected: coinsCollected,
        powerModeActivations: powerModeActivations,
      };

      sendMapCompletionData(mapCompletionData);
    }

    if (bonusPoints > 0) {
      // Show bonus screen
      gameState.setMenuType(MenuType.BONUS);
      gameState.setState(GameState.BONUS);
      this.audioManager.playSound(AudioEvent.BONUS_SCREEN);
      gameState.addScore(bonusPoints);

      // Notify coin manager about bonus points (these should not trigger B-coin spawning)
      if (gameState.coinManager) {
        gameState.coinManager.onPointsEarned(bonusPoints, true);
      }
    } else {
      // No bonus, go directly to next level
      this.proceedToNextLevel();
    }
  }

  private proceedToNextLevel(): void {
    const gameState = useGameStore.getState();
    const nextLevel = gameState.currentLevel + 1;

    // Stop power-up melody if active (level transition)
    if (this.audioManager.isPowerUpMelodyActive()) {
      log.audio("Level transition, stopping PowerUp melody");
      this.audioManager.stopPowerUpMelody();
    }

    if (nextLevel <= mapDefinitions.length) {
      // Reset coin effects and state before loading new level
      gameState.resetEffects();
      gameState.resetCoinState();
      log.debug("Coins reset when proceeding to next level");

      gameState.nextLevel();
      this.loadCurrentLevel();
      // Always show countdown when transitioning to next level
      gameState.setMenuType(MenuType.COUNTDOWN);
      gameState.setState(GameState.COUNTDOWN);

      setTimeout(() => {
        gameState.setState(GameState.PLAYING);
      }, 3000);
    } else {
      // All levels completed - show victory screen
      gameState.setState(GameState.VICTORY);
      gameState.setMenuType(MenuType.VICTORY);
    }
  }

  // Method to be called from BonusScreen to continue to next level
  public continueToNextLevel(): void {
    this.proceedToNextLevel();
  }

  private calculateBonus(correctCount: number, livesLost: number): number {
    // Calculate effective bomb count by subtracting lives lost
    // Each life lost is equivalent to missing one bomb
    const effectiveCount = Math.max(0, correctCount - livesLost);

    return (
      GAME_CONFIG.BONUS_POINTS[
        effectiveCount as keyof typeof GAME_CONFIG.BONUS_POINTS
      ] || 0
    );
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

  cleanup(): void {
    this.stop();
    this.inputManager.cleanup();
    this.audioManager.cleanup();
  }

  // Debug method to check pause status of all managers
  public getPauseStatus(): any {
    return {
      gameState: useGameStore.getState().currentState,
      scalingManager: this.scalingManager.getPauseStatus(),
      spawnManager: this.monsterSpawnManager.getPauseStatus(),
      respawnManager: {
        isPaused: this.monsterRespawnManager.isPaused(),
      },
    };
  }

  // Debug method to check spawn status
  public getSpawnStatus(): any {
    return this.monsterSpawnManager.getSpawnStatus();
  }

  // Debug method to check PowerUp melody and power mode synchronization
  public getPowerUpStatus(): any {
    const gameState = useGameStore.getState();
    return {
      powerUpMelody: this.audioManager.getPowerUpMelodyStatus(),
      powerMode: {
        isActive: gameState.activeEffects.powerMode,
        endTime: gameState.activeEffects.powerModeEndTime,
        timeLeft: gameState.activeEffects.powerModeEndTime > 0 ? gameState.activeEffects.powerModeEndTime - Date.now() : 0
      },
      coinManager: gameState.coinManager ? {
        powerModeActive: gameState.coinManager.isPowerModeActive(),
        powerModeEndTime: gameState.coinManager.getPowerModeEndTime()
      } : null
    };
  }

  // Expose spawn manager for render manager
  public getSpawnManager(): OptimizedSpawnManager {
    return this.monsterSpawnManager;
  }
}
