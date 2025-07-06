import { InputManager } from "./InputManager";
import { CollisionManager } from "./CollisionManager";
import { RenderManager } from "./RenderManager";
import { useGameStore } from "../stores/gameStore";
import { GameState, MenuType } from "../types/enums";
import { GAME_CONFIG, DEV_CONFIG } from "../types/constants";
import { mapDefinitions } from "../maps/mapDefinitions";
import { AudioManager } from "./AudioManager";
import { AudioEvent } from "../types/enums";
import { playerSprite } from "../entities/Player";
import { AnimationController } from "../lib/AnimationController";
import { sendGameReady, sendGameStateUpdate, sendMapCompletionData } from "../lib/communicationUtils";
import { log } from "../lib/logger";

export class GameManager {
  private inputManager: InputManager;
  private collisionManager: CollisionManager;
  private renderManager: RenderManager;
  private audioManager: AudioManager;
  private animationController: AnimationController;
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
    
    // Bind the game loop once to prevent multiple instances
    this.boundGameLoop = this.gameLoop.bind(this);
    
    // Set AudioManager reference in store for settings updates
    const gameState = useGameStore.getState();
    if ('setAudioManager' in gameState) {
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
      
      // Initialize first level normally
      this.loadCurrentLevel();
    }
    
    // Send game ready signal to host
    sendGameReady();
    
    this.gameLoop(0);
  }

  private initializeDevMode(): void {
    const gameState = useGameStore.getState();

    // ALWAYS initialize level data first - this is crucial for proper rendering
    this.loadCurrentLevel();

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

    // Set level
    for (let i = 1; i < DEV_CONFIG.MOCK_DATA.currentLevel; i++) {
      gameState.nextLevel();
      // Re-initialize level data after each level change
      this.loadCurrentLevel();
    }

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
        log.warn(
          `Unknown DEV_MODE target state: ${DEV_CONFIG.TARGET_STATE}`
        );
        gameState.setState(GameState.MENU);
        gameState.setMenuType(MenuType.START);
    }

    // Set multiplier LAST to override any automatic calculations
    log.dev(`DEV_MODE: Setting multiplier to ${DEV_CONFIG.MOCK_DATA.multiplier}x with ${DEV_CONFIG.MOCK_DATA.multiplierScore} progress`);
    gameState.setMultiplier(DEV_CONFIG.MOCK_DATA.multiplier, DEV_CONFIG.MOCK_DATA.multiplierScore);

    log.dev(
      `DEV_MODE initialized with state: ${DEV_CONFIG.TARGET_STATE}`
    );
    this.devModeInitialized = true;
  }

  stop(): void {
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

    // Start music if we should be playing and aren't already
    if (shouldPlayMusic && !this.isBackgroundMusicPlaying) {
      log.audio("Starting background music");
      this.audioManager.playSound(AudioEvent.BACKGROUND_MUSIC, currentState);
      this.isBackgroundMusicPlaying = true;
    }

    // Stop music if we shouldn't be playing but are
    if (!shouldPlayMusic && this.isBackgroundMusicPlaying) {
      log.audio("Stopping background music");
      this.audioManager.stopBackgroundMusic();
      this.isBackgroundMusicPlaying = false;
    }

    this.previousGameState = currentState;
  }

  private update(deltaTime: number): void {
    this.updatePlayer(deltaTime);
    this.updateMonsters(deltaTime);
    this.updateCoins(deltaTime);
  }

  private updatePlayer(deltaTime: number): void {
    const gameState = useGameStore.getState();
    let player = { ...gameState.player };

    // Handle pause key
    if (this.inputManager.isKeyPressed("p") || this.inputManager.isKeyPressed("P")) {
      if (gameState.currentState === GameState.PLAYING) {
        gameState.setState(GameState.PAUSED);
        gameState.setMenuType(MenuType.PAUSE);
      }
      return; // Don't process other input while paused
    }

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

        // Gradually increase jump power
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

    // Apply movement
    player.velocityX = moveX;
    player.x += player.velocityX;

    // Apply gravity - only use float gravity when floating and falling (velocityY >= 0)
    const gravity =
      player.isFloating && player.velocityY >= 0
        ? player.floatGravity
        : player.gravity;
    player.velocityY += gravity;
    player.y += player.velocityY;

    // Handle boundary collisions
    const bounds = { width: GAME_CONFIG.CANVAS_WIDTH, height: GAME_CONFIG.CANVAS_HEIGHT };
    const boundaryResult = this.collisionManager.resolveBoundaryCollision(player, bounds);
    
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
    const gameState = useGameStore.getState();
    const monsters = gameState.monsters.map((monster) => {
      if (!monster.isActive) return monster;

      // Don't move monsters if they are frozen
      if (monster.isFrozen) return monster;

      // Simple patrol AI
      monster.x += monster.speed * monster.direction;

      // Check patrol bounds
      if (
        monster.x <= monster.patrolStartX ||
        monster.x >= monster.patrolEndX
      ) {
        monster.direction *= -1;
      }

      return monster;
    });

    gameState.updateMonsters(monsters);
  }

  private updateCoins(deltaTime: number): void {
    const gameState = useGameStore.getState();
    const platforms = gameState.currentMap?.platforms || [];
    const ground = gameState.currentMap?.ground;
    const coinManager = gameState.coinManager;

    if (ground && coinManager) {
      // Check spawn conditions for all coin types
      coinManager.checkSpawnConditions(gameState as unknown as Record<string, unknown>);
      
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
      
      // Pass gameState to the coin manager for the new effect system
      const coinManager = gameState.coinManager;
      if (coinManager) {
        coinManager.collectCoin(collectedCoin, gameState as unknown as Record<string, unknown>);
      }
      
      gameState.collectCoin(collectedCoin);
      
      // If it's a power coin, play special sound
      if (collectedCoin.type === 'POWER') {
        this.audioManager.playSound(AudioEvent.POWER_COIN_ACTIVATE);
      }
    }

    // Monster collisions
    const hitMonster = this.collisionManager.checkPlayerMonsterCollision(
      player,
      monsters
    );
    if (hitMonster) {
      // Check if power mode is active - if so, kill the monster instead
      if (gameState.activeEffects.powerMode) {
        // Monster is killed during power mode - use progressive bonus system
        const points = gameState.coinManager?.calculateMonsterKillPoints(gameState.multiplier) || 
                      (GAME_CONFIG.MONSTER_KILL_POINTS * gameState.multiplier); // Fallback
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
        
        // Remove the monster from the game
        const updatedMonsters = monsters.filter(m => m !== hitMonster);
        gameState.updateMonsters(updatedMonsters);
      } else {
        // Normal monster collision - player dies
        this.audioManager.playSound(AudioEvent.MONSTER_HIT);
        this.handlePlayerDeath();
      }
    }
  }

  private handlePlayerDeath(): void {
    const gameState = useGameStore.getState();
    
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

    if (currentMap) {
      // Clear floating texts when respawning
      gameState.clearAllFloatingTexts();

      // Reset player position
      gameState.setPlayerPosition(
        currentMap.playerStartX,
        currentMap.playerStartY
      );

      // Reset monsters to starting positions
      const resetMonsters = currentMap.monsters.map((monster) => ({
        ...monster,
        x: monster.patrolStartX,
        direction: 1, // Reset to initial direction
      }));
      gameState.updateMonsters(resetMonsters);

      // Reset animation controller state
      this.animationController.reset();

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
    const bonusPoints =
      GAME_CONFIG.BONUS_POINTS[
        gameState.correctOrderCount as keyof typeof GAME_CONFIG.BONUS_POINTS
      ] || 0;

    // Calculate completion time
    const completionTime = Date.now() - this.mapStartTime;

    // Capture coin collection data BEFORE resetting effects
    const coinStats = gameState.getCoinStats();
    const coinsCollected = coinStats.totalCoinsCollected;
    const powerModeActivations = coinStats.totalPowerCoinsCollected;

    // Clear floating texts when map is completed
    gameState.clearAllFloatingTexts();

    // Reset coin effects when map is completed
    gameState.resetEffects();

    // Record the level result when level is completed
    if (gameState.currentMap) {
      const levelResult = {
        level: gameState.currentLevel,
        mapName: gameState.currentMap.name,
        correctOrderCount: gameState.correctOrderCount,
        totalBombs: GAME_CONFIG.TOTAL_BOMBS,
        score: gameState.score,
        bonus: bonusPoints,
        hasBonus: bonusPoints > 0,
        coinsCollected: coinsCollected,
        powerModeActivations: powerModeActivations,
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

    if (nextLevel <= mapDefinitions.length) {
      // Reset coin effects before loading new level
      gameState.resetEffects();
      
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

  private calculateBonus(correctCount: number): number {
    return (
      GAME_CONFIG.BONUS_POINTS[
        correctCount as keyof typeof GAME_CONFIG.BONUS_POINTS
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
      gameState.coinManager
    );
  }

  cleanup(): void {
    this.stop();
    this.inputManager.cleanup();
    this.audioManager.cleanup();
  }
}
