import { useGameStore } from "../stores/gameStore";
import { GameState, MenuType, AudioEvent } from "../types/enums";
import { GAME_CONFIG, DEV_CONFIG } from "../types/constants";
import { mapDefinitions } from "../maps/mapDefinitions";
import { playerSprite } from "@/entities/Player";
import { AnimationController } from "../lib/AnimationController";
import { sendGameReady, sendGameStateUpdate, sendMapCompletionData } from "../lib/communicationUtils";

export class GameManager {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animationController: AnimationController;
  private animationFrameId: number | null = null;
  private lastTime = 0;
  private boundGameLoop: (currentTime: number) => void;
  private wasGroundedWhenMapCleared: boolean = false;
  private mapStartTime: number = 0;
  private keys: Set<string> = new Set();
  private keyPressTimes: Map<string, number> = new Map();

  // Audio components
  private audioContext: AudioContext | null = null;
  private backgroundMusicGain: GainNode | null = null;
  private isBackgroundMusicPlaying = false;
  private backgroundMusicBuffer: AudioBuffer | null = null;
  private backgroundMusicSource: AudioBufferSourceNode | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.animationController = new AnimationController(playerSprite);
    
    // Bind methods
    this.boundGameLoop = this.gameLoop.bind(this);
    
    // Set up input handling
    this.setupInput();
    
    // Initialize audio
    this.initializeAudio();
    
    // Set AudioManager reference in store
    const gameState = useGameStore.getState();
    gameState.setAudioManager(this);
  }

  private setupInput(): void {
    // Keyboard event handlers
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'Space', ' ', 'p', 'P'].includes(e.key)) {
        e.preventDefault();
      }
      
      if (!this.keys.has(e.key)) {
        this.keyPressTimes.set(e.key, Date.now());
      }
      this.keys.add(e.key);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      this.keys.delete(e.key);
      this.keyPressTimes.delete(e.key);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
  }

  private initializeAudio(): void {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.backgroundMusicGain = this.audioContext.createGain();
      this.backgroundMusicGain.connect(this.audioContext.destination);
      
      // Load background music
      fetch('/audio/background-music.wav')
        .then(response => response.arrayBuffer())
        .then(data => this.audioContext!.decodeAudioData(data))
        .then(buffer => {
          this.backgroundMusicBuffer = buffer;
        })
        .catch(err => console.error('Failed to load background music:', err));
    } catch (e) {
      console.error('Web Audio API not supported:', e);
    }
  }

  start(): void {
    const gameState = useGameStore.getState();
    
    // Check if DEV_MODE is enabled
    if (DEV_CONFIG.ENABLED) {
      console.log("🚀 DEV_MODE is ENABLED");
      this.initializeDevMode();
    } else {
      gameState.resetGame();
      this.loadCurrentLevel();
    }
    
    sendGameReady();
    this.gameLoop(0);
  }

  private initializeDevMode(): void {
    const gameState = useGameStore.getState();
    
    // Initialize level first
    this.loadCurrentLevel();
    
    // Apply dev mode settings
    gameState.addScore(DEV_CONFIG.MOCK_DATA.score);
    
    // Set lives
    const currentLives = gameState.lives;
    const targetLives = DEV_CONFIG.MOCK_DATA.lives;
    if (targetLives < currentLives) {
      for (let i = 0; i < currentLives - targetLives; i++) {
        gameState.loseLife();
      }
    }
    
    // Set level
    for (let i = 1; i < DEV_CONFIG.MOCK_DATA.currentLevel; i++) {
      gameState.nextLevel();
      this.loadCurrentLevel();
    }
    
    // Set target state
    switch (DEV_CONFIG.TARGET_STATE) {
      case "START_MENU":
        gameState.setState(GameState.MENU);
        gameState.setMenuType(MenuType.START);
        break;
      case "PLAYING":
        gameState.setState(GameState.PLAYING);
        gameState.setMenuType(MenuType.IN_GAME);
        break;
      // ... other states
    }
  }

  private loadCurrentLevel(): void {
    const gameState = useGameStore.getState();
    const currentLevel = gameState.currentLevel;

    if (currentLevel <= mapDefinitions.length) {
      const mapDefinition = mapDefinitions[currentLevel - 1];
      gameState.initializeLevel(mapDefinition);
      
      this.animationController.reset();
      this.mapStartTime = Date.now();
    }
  }

  private gameLoop(currentTime: number): void {
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    const gameState = useGameStore.getState();

    // Handle background music
    this.handleBackgroundMusic(gameState.currentState);

    // Update based on game state
    if (gameState.currentState === GameState.PLAYING) {
      this.updatePlayer(deltaTime);
      this.updateMonsters(deltaTime);
      this.updateCoins();
      this.checkCollisions();
      this.checkWinCondition();
      playerSprite.update(deltaTime);
    } else if (gameState.currentState === GameState.MAP_CLEARED) {
      this.handleMapClearedState(deltaTime);
    }

    // Always update floating texts
    gameState.updateFloatingTexts();

    this.render();
    this.animationFrameId = requestAnimationFrame(this.boundGameLoop);
  }

  private updatePlayer(deltaTime: number): void {
    const gameState = useGameStore.getState();
    let player = { ...gameState.player };

    // Handle pause
    if (this.keys.has('p') || this.keys.has('P')) {
      if (gameState.currentState === GameState.PLAYING) {
        gameState.setState(GameState.PAUSED);
        gameState.setMenuType(MenuType.PAUSE);
      }
      return;
    }

    // Handle movement
    let moveX = 0;
    if (this.keys.has('ArrowLeft')) {
      moveX = -player.moveSpeed;
    }
    if (this.keys.has('ArrowRight')) {
      moveX = player.moveSpeed;
    }

    // Update animation
    this.animationController.update(
      player.isGrounded,
      moveX,
      player.isFloating,
      gameState.currentState
    );

    // Handle jumping
    const isUpPressed = this.keys.has('ArrowUp');
    const isShiftPressed = this.keys.has('Shift');
    const isSpacePressed = this.keys.has(' ') || this.keys.has('Space');

    if (isUpPressed && player.isGrounded && !player.isJumping) {
      player.isJumping = true;
      player.jumpStartTime = Date.now();
      player.isGrounded = false;
      
      const baseJumpPower = isShiftPressed ? GAME_CONFIG.SUPER_JUMP_POWER : GAME_CONFIG.JUMP_POWER;
      player.velocityY = -baseJumpPower * 0.6;
      
      this.playSound(AudioEvent.GAME_START);
    }

    // Apply physics
    const gravityToUse = isSpacePressed ? player.floatGravity : player.gravity;
    player.velocityY += gravityToUse;
    player.isFloating = isSpacePressed;

    // Update position
    player.x += moveX;
    player.y += player.velocityY;

    // Keep player in bounds
    player.x = Math.max(0, Math.min(player.x, GAME_CONFIG.CANVAS_WIDTH - player.width));

    gameState.updatePlayer(player);
  }

  private updateMonsters(deltaTime: number): void {
    const gameState = useGameStore.getState();
    const monsters = [...gameState.monsters];
    const powerModeActive = gameState.powerModeActive;

    monsters.forEach(monster => {
      if (monster.isFrozen || !monster.isActive) return;

      // Simple patrol movement
      monster.x += monster.speed * monster.direction;

      if (monster.x <= monster.patrolStartX || monster.x >= monster.patrolEndX) {
        monster.direction *= -1;
      }

      // Update blinking state during power mode
      if (powerModeActive) {
        const timeLeft = gameState.powerModeEndTime - Date.now();
        monster.isBlinking = timeLeft < 2000; // Blink in last 2 seconds
      }
    });

    gameState.updateMonsters(monsters);
  }

  private updateCoins(): void {
    const gameState = useGameStore.getState();
    gameState.updateCoinPhysics(gameState.platforms, gameState.ground!);
  }

  private checkCollisions(): void {
    const gameState = useGameStore.getState();
    const player = gameState.player;

    // Ground collision
    const ground = gameState.ground;
    if (ground && player.y + player.height >= ground.y) {
      gameState.updatePlayer({
        y: ground.y - player.height,
        velocityY: 0,
        isGrounded: true,
      });
    }

    // Platform collisions
    gameState.platforms.forEach(platform => {
      if (this.checkAABB(player, platform)) {
        // Simple platform collision - land on top
        if (player.velocityY > 0 && player.y < platform.y) {
          gameState.updatePlayer({
            y: platform.y - player.height,
            velocityY: 0,
            isGrounded: true,
          });
        }
      }
    });

    // Bomb collisions
    gameState.bombs.forEach(bomb => {
      if (!bomb.isCollected && this.checkAABB(player, bomb)) {
        const result = gameState.collectBomb(bomb);
        if (result.isValid) {
                     this.playSound(AudioEvent.BOMB_COLLECT);
          if (result.score > 0) {
            gameState.addFloatingText(`+${result.score}`, bomb.x, bomb.y - 20);
          }
        }
      }
    });

    // Coin collisions
    gameState.coins.forEach(coin => {
      if (!coin.isCollected && this.checkAABB(player, coin)) {
        gameState.collectCoin(coin);
                 this.playSound(AudioEvent.COIN_COLLECT);
        
        const pointsText = coin.type === 'POWER' ? '+2000' : '+1000';
        gameState.addFloatingText(pointsText, coin.x, coin.y - 20);
      }
    });

    // Monster collisions
    if (!gameState.powerModeActive) {
      gameState.monsters.forEach(monster => {
        if (monster.isActive && !monster.isFrozen && this.checkAABB(player, monster)) {
          this.handlePlayerDeath();
        }
      });
    } else {
      // Power mode - can kill monsters
      gameState.monsters.forEach(monster => {
        if (monster.isActive && monster.isFrozen && this.checkAABB(player, monster)) {
          monster.isActive = false;
          gameState.addScore(GAME_CONFIG.MONSTER_KILL_POINTS);
          gameState.addFloatingText('+100', monster.x, monster.y - 20);
                     this.playSound(AudioEvent.MONSTER_HIT);
        }
      });
    }

    // Fall death
    if (player.y > GAME_CONFIG.CANVAS_HEIGHT) {
      this.handlePlayerDeath();
    }
  }

  private checkAABB(a: any, b: any): boolean {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }

  private handlePlayerDeath(): void {
    const gameState = useGameStore.getState();
    gameState.loseLife();
    
    if (gameState.lives > 0) {
      this.respawnPlayer();
    }
  }

  private respawnPlayer(): void {
    const gameState = useGameStore.getState();
    const currentMap = gameState.currentMap;

    if (currentMap) {
      gameState.clearAllFloatingTexts();
      gameState.setPlayerPosition(currentMap.playerStartX, currentMap.playerStartY);
      
      // Reset monsters
      const resetMonsters = currentMap.monsters.map(monster => ({
        ...monster,
        x: monster.patrolStartX,
        direction: 1,
      }));
      gameState.updateMonsters(resetMonsters);

      this.animationController.reset();

      // Show countdown
      gameState.setMenuType(MenuType.COUNTDOWN);
      gameState.setState(GameState.COUNTDOWN);

      setTimeout(() => {
        gameState.setState(GameState.PLAYING);
      }, 3000);
    }
  }

  private checkWinCondition(): void {
    const gameState = useGameStore.getState();
    const allBombsCollected = gameState.bombs.every(bomb => bomb.isCollected);

    if (allBombsCollected) {
      this.wasGroundedWhenMapCleared = gameState.player.isGrounded;
      gameState.setState(GameState.MAP_CLEARED);
      
      this.playSound(AudioEvent.LEVEL_COMPLETE);

      setTimeout(() => {
        this.completeLevel();
      }, 3000);
    }
  }

  private completeLevel(): void {
    const gameState = useGameStore.getState();
    const { currentMap, correctOrderCount, bombs, score, levelScore, currentLevel, lives, multiplier } = gameState;

    if (!currentMap) return;

    // Calculate bonus
    let bonus = 0;
    const totalBombs = bombs.length;
    if (correctOrderCount === totalBombs && GAME_CONFIG.BONUS_POINTS[totalBombs]) {
      bonus = GAME_CONFIG.BONUS_POINTS[totalBombs];
      gameState.addScore(bonus);
    }

    // Record level result
    const levelResult = {
      level: currentLevel,
      mapName: currentMap.name,
      correctOrderCount,
      totalBombs,
      score: levelScore,
      bonus,
      hasBonus: bonus > 0,
      coinsCollected: 0, // TODO: Track this
      powerModeActivations: 0, // TODO: Track this
    };
    
    gameState.addLevelResult(levelResult);

    // Send completion data
    const completionTime = Date.now() - this.mapStartTime;
    sendMapCompletionData({
      mapName: currentMap.name,
      level: currentLevel,
      correctOrderCount,
      totalBombs,
      score: levelScore,
      bonus,
      hasBonus: bonus > 0,
      timestamp: Date.now(),
      lives,
      multiplier,
      completionTime,
    });

    // Check if there are more levels
    if (currentLevel < mapDefinitions.length) {
      if (bonus > 0) {
        gameState.setState(GameState.BONUS);
        gameState.setMenuType(MenuType.BONUS);
      } else {
        this.proceedToNextLevel();
      }
    } else {
      gameState.setState(GameState.VICTORY);
      gameState.setMenuType(MenuType.VICTORY);
    }
  }

  private proceedToNextLevel(): void {
    const gameState = useGameStore.getState();
    gameState.nextLevel();
    this.loadCurrentLevel();
    
    gameState.setMenuType(MenuType.COUNTDOWN);
    gameState.setState(GameState.COUNTDOWN);

    setTimeout(() => {
      gameState.setState(GameState.PLAYING);
    }, 3000);
  }

  private handleMapClearedState(deltaTime: number): void {
    const gameState = useGameStore.getState();
    const player = gameState.player;

    playerSprite.update(deltaTime);

    // Apply gravity if not grounded
    if (!this.wasGroundedWhenMapCleared && !player.isGrounded) {
      const updatedPlayer = { ...player };
      updatedPlayer.velocityY += player.gravity;
      updatedPlayer.y += updatedPlayer.velocityY;

      // Check ground collision
      const ground = gameState.ground;
      if (ground && updatedPlayer.y + updatedPlayer.height >= ground.y) {
        updatedPlayer.y = ground.y - updatedPlayer.height;
        updatedPlayer.velocityY = 0;
        updatedPlayer.isGrounded = true;
      }

      gameState.updatePlayer(updatedPlayer);
    }

    this.animationController.update(
      player.isGrounded,
      0,
      false,
      gameState.currentState
    );
  }

  private handleBackgroundMusic(state: GameState): void {
    const shouldPlayMusic = state === GameState.PLAYING;
    
    if (shouldPlayMusic && !this.isBackgroundMusicPlaying) {
      this.startBackgroundMusic();
    } else if (!shouldPlayMusic && this.isBackgroundMusicPlaying) {
      this.stopBackgroundMusic();
    }
  }

  private startBackgroundMusic(): void {
    if (!this.audioContext || !this.backgroundMusicBuffer || this.isBackgroundMusicPlaying) return;

    try {
      this.backgroundMusicSource = this.audioContext.createBufferSource();
      this.backgroundMusicSource.buffer = this.backgroundMusicBuffer;
      this.backgroundMusicSource.loop = true;
      this.backgroundMusicSource.connect(this.backgroundMusicGain!);
      this.backgroundMusicSource.start(0);
      this.isBackgroundMusicPlaying = true;
      
      this.updateVolumes();
    } catch (e) {
      console.error('Failed to start background music:', e);
    }
  }

  private stopBackgroundMusic(): void {
    if (this.backgroundMusicSource) {
      try {
        this.backgroundMusicSource.stop();
        this.backgroundMusicSource.disconnect();
      } catch (e) {
        // Ignore errors when stopping
      }
      this.backgroundMusicSource = null;
    }
    this.isBackgroundMusicPlaying = false;
  }

  private playSound(event: AudioEvent): void {
    // Simple sound effect playback
    const { audioSettings } = useGameStore.getState();
    
    if (audioSettings.masterMuted || audioSettings.sfxMuted) return;
    
    // TODO: Implement sound effect playback
    console.log('Playing sound:', event);
  }

  public updateVolumes(): void {
    const { audioSettings } = useGameStore.getState();
    
    if (this.backgroundMusicGain) {
      const musicVolume = audioSettings.masterMuted || audioSettings.musicMuted 
        ? 0 
        : (audioSettings.masterVolume / 100) * (audioSettings.musicVolume / 100);
      
      this.backgroundMusicGain.gain.setValueAtTime(musicVolume, this.audioContext!.currentTime);
    }
  }

  private render(): void {
    const gameState = useGameStore.getState();
    const { player, platforms, bombs, monsters, ground, coins, floatingTexts } = gameState;

    // Clear canvas
    this.ctx.fillStyle = '#262521';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Render ground
    if (ground) {
      this.ctx.fillStyle = ground.color;
      this.ctx.fillRect(ground.x, ground.y, ground.width, ground.height);
    }

    // Render platforms
    platforms.forEach(platform => {
      this.ctx.fillStyle = platform.color;
      this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
    });

    // Render bombs
    bombs.forEach(bomb => {
      if (bomb.isCollected) {
        this.ctx.fillStyle = '#666666';
      } else if (bomb.isBlinking) {
        this.ctx.fillStyle = Math.floor(Date.now() / 250) % 2 ? '#FF0000' : '#FFD700';
      } else {
        this.ctx.fillStyle = '#FFD700';
      }
      this.ctx.fillRect(bomb.x, bomb.y, bomb.width, bomb.height);
    });

    // Render coins
    coins.forEach(coin => {
      if (!coin.isCollected) {
        // P-coins change color
        if (coin.type === 'POWER') {
          const elapsed = Date.now() - (coin.spawnTime || 0);
          const colorIndex = Math.floor(elapsed / 1000) % 7; // Change color every second
          const colors = ['#0066FF', '#FF0000', '#800080', '#00FF00', '#00FFFF', '#FFFF00', '#808080'];
          this.ctx.fillStyle = colors[colorIndex];
        } else {
          this.ctx.fillStyle = coin.type === 'BONUS_MULTIPLIER' ? '#800080' : '#FFFF00';
        }
        
        // Draw coin as circle
        this.ctx.beginPath();
        this.ctx.arc(coin.x + coin.width/2, coin.y + coin.height/2, coin.width/2, 0, Math.PI * 2);
        this.ctx.fill();
      }
    });

    // Render monsters
    monsters.forEach(monster => {
      if (monster.isActive) {
        if (monster.isFrozen) {
          this.ctx.fillStyle = monster.isBlinking && Math.floor(Date.now() / 250) % 2 
            ? '#FF4444' 
            : '#4444FF';
        } else {
          this.ctx.fillStyle = '#FF4444';
        }
        this.ctx.fillRect(monster.x, monster.y, monster.width, monster.height);
      }
    });

         // Render player using sprite
     playerSprite.draw(this.ctx, player.x, player.y);

    // Render floating texts
    floatingTexts.forEach(text => {
      const elapsed = Date.now() - text.startTime;
      const opacity = 1 - (elapsed / text.duration);
      
      this.ctx.save();
      this.ctx.globalAlpha = opacity;
      this.ctx.fillStyle = text.color;
      this.ctx.font = `${text.fontSize}px Arial`;
      this.ctx.textAlign = 'center';
      this.ctx.fillText(text.text, text.x, text.y);
      this.ctx.restore();
    });
  }

  cleanup(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    this.stopBackgroundMusic();
    
    if (this.audioContext) {
      this.audioContext.close();
    }

    // Remove event listeners
    document.removeEventListener('keydown', () => {});
    document.removeEventListener('keyup', () => {});
  }
}
