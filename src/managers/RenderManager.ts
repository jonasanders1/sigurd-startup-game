import {
  Player,
  Monster,
  Bomb,
  Platform,
  Ground,
  Coin,
  FloatingText,
} from "../types/interfaces";
import { COLORS } from "../types/constants";
import { playerSprite } from "../entities/Player";
import { bombSprite, BombSpriteInstance } from "../entities/Bomb";
import { SpriteInstance } from "../lib/SpriteInstance";
import { GAME_CONFIG } from "../types/constants";
import { COIN_TYPES, P_COIN_COLORS } from "../config/coinTypes";
import { log } from "../lib/logger";
import { BackgroundManager } from "./BackgroundManager";
import { OptimizedRespawnManager } from "./OptimizedRespawnManager";
import { MonsterType } from "@/types/enums";

interface CoinManagerInterface {
  getPcoinCurrentColor: (coin: Coin) => string;
}

export class RenderManager {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private lastTime: number = 0;
  private backgroundManager: BackgroundManager;
  private bombSprites: Map<number, SpriteInstance> = new Map(); // Individual sprites for each bomb
  private currentSpawnManager: any = null;
  private currentGameState: any = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.backgroundManager = new BackgroundManager(canvas.width, canvas.height);
    log.debug("RenderManager initialized with canvas");
  }

  render(
    player: Player,
    platforms: Platform[],
    bombs: Bomb[],
    monsters: Monster[],
    ground: Ground | null,
    coins: Coin[] = [],
    floatingTexts: FloatingText[] = [],
    coinManager?: CoinManagerInterface,
    spawnManager?: any,
    currentMap?: any,
    gameState?: any
  ): void {
    // Store spawn manager and game state for use in indicator rendering
    this.currentSpawnManager = spawnManager;
    this.currentGameState = gameState;
    const currentTime = Date.now();
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    // Render background first
    this.renderBackground();

    // Render game elements on top
    this.renderGround(ground);
    this.renderPlatforms(platforms);
    this.renderBombs(bombs);
    this.renderCoins(coins, coinManager);
    this.renderMonsters(monsters);
    this.renderPlayer(player);
    this.renderFloatingTexts(floatingTexts, deltaTime);
  }

  private renderBackground(): void {
    this.backgroundManager.render(this.ctx);
  }

  private renderGround(ground: Ground): void {
    this.ctx.fillStyle = ground.color;
    this.ctx.fillRect(ground.x, ground.y, ground.width, ground.height);
  }

  private renderPlayer(player: Player): void {
    if (playerSprite && GAME_CONFIG.USE_SPRITES) {
      // Calculate scale to match player's collision dimensions
      const scale = player.height / GAME_CONFIG.PLAYER_HEIGHT;
      playerSprite.draw(this.ctx, player.x, player.y, scale);
    } else {
      this.ctx.fillStyle = player.color;
      this.ctx.fillRect(player.x, player.y, player.width, player.height);
    }
  }

  private renderPlatforms(platforms: Platform[]): void {
    platforms.forEach((platform) => {
      this.ctx.fillStyle = platform.color;
      this.ctx.strokeStyle = platform.borderColor;

      // Draw rounded rectangle
      const radius = 4; // Corner radius
      const x = platform.x;
      const y = platform.y;
      const width = platform.width;
      const height = platform.height;

      this.ctx.beginPath();
      this.ctx.moveTo(x + radius, y);
      this.ctx.lineTo(x + width - radius, y);
      this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      this.ctx.lineTo(x + width, y + height - radius);
      this.ctx.quadraticCurveTo(
        x + width,
        y + height,
        x + width - radius,
        y + height
      );
      this.ctx.lineTo(x + radius, y + height);
      this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      this.ctx.lineTo(x, y + radius);
      this.ctx.quadraticCurveTo(x, y, x + radius, y);
      this.ctx.closePath();
      this.ctx.lineWidth = 3;
      this.ctx.stroke();
      this.ctx.fill();
    });
  }

  private renderBombs(bombs: Bomb[]): void {
    bombs.forEach((bomb) => {
      // Don't render collected bombs
      if (bomb.isCollected) {
        return;
      }

      if (bombSprite && GAME_CONFIG.USE_BOMB_SPRITES) {
        // Get or create individual sprite for this bomb
        let individualSprite = this.bombSprites.get(bomb.order);
        if (!individualSprite) {
          // Create new sprite instance for this bomb
          const bombAnimations = [
            {
              name: "unlit",
              frames: bombSprite.animations.unlit.frames,
              frameDuration: 50,
              loop: false,
            },
            {
              name: "lit",
              frames: bombSprite.animations.lit.frames,
              frameDuration: 100,
              loop: true,
            },
          ];
          individualSprite = new BombSpriteInstance(bombAnimations, "unlit");
          this.bombSprites.set(bomb.order, individualSprite);
        }

        // Set animation based on this bomb's state
        const animationName = bomb.isBlinking ? "lit" : "unlit";
        individualSprite.setAnimation(animationName);
        individualSprite.update(16);

        // Calculate scale to match bomb's collision dimensions
        const scale = bomb.width / GAME_CONFIG.BOMB_SIZE;
        individualSprite.draw(this.ctx, bomb.x, bomb.y, scale);
      } else {
        // Fallback to colored rectangles
        this.ctx.fillStyle = bomb.isBlinking ? COLORS.BOMB_NEXT : COLORS.BOMB;
        this.ctx.fillRect(bomb.x, bomb.y, bomb.width, bomb.height);

        // Draw bomb number
        this.ctx.fillStyle = "#000000";
        this.ctx.font = "12px JetBrains Mono";
        this.ctx.textAlign = "center";
        this.ctx.fillText(
          bomb.order.toString(),
          bomb.x + bomb.width / 2,
          bomb.y + bomb.height / 2 + 4
        );
      }
    });
  }

  private renderCoins(coins: Coin[], coinManager?: CoinManagerInterface): void {
    coins.forEach((coin) => {
      if (coin.isCollected) {
        return; // Don't render collected coins
      }

      const coinConfig = COIN_TYPES[coin.type];
      let color = coinConfig?.color || "#FFD700"; // Default gold color

      // Special handling for P-coins (power coins)
      if (coin.type === "POWER" && coinManager) {
        color = coinManager.getPcoinCurrentColor(coin);
      }

      // Draw coin as circle
      this.ctx.fillStyle = color;
      this.ctx.beginPath();
      this.ctx.arc(
        coin.x + coin.width / 2,
        coin.y + coin.height / 2,
        coin.width / 2,
        0,
        2 * Math.PI
      );
      this.ctx.fill();
      this.ctx.restore();

      this.ctx.save();
      this.ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
      this.ctx.beginPath();
      this.ctx.arc(
        coin.x + coin.width / 2 + 1,
        coin.y + coin.height / 2 + 1,
        coin.width / 2,
        0,
        Math.PI * 2
      );
      this.ctx.fill();
      this.ctx.restore();

      // Coin body with pulsing effect
      const pulse = Math.sin(Date.now() / 200) * 0.1 + 1;
      this.ctx.fillStyle = color;
      this.ctx.beginPath();
      this.ctx.arc(
        coin.x + coin.width / 2,
        coin.y + coin.height / 2,
        (coin.width / 2) * pulse,
        0,
        Math.PI * 2
      );
      this.ctx.fill();

      // Inner circle
      this.ctx.fillStyle = "rgba(2, 2, 2, 0.3)";
      this.ctx.beginPath();
      this.ctx.arc(
        coin.x + coin.width / 2,
        coin.y + coin.height / 2,
        coin.width / 2.5,
        0,
        Math.PI * 2
      );
      this.ctx.fill();

      let coinSymbol = "C";
      if (coin.type === "POWER") {
        coinSymbol = "P";
      } else if (coin.type === "BONUS_MULTIPLIER") {
        coinSymbol = "B";
      } else if (coin.type === "EXTRA_LIFE") {
        coinSymbol = "M";
      }
      // Add coin type indicator
      this.ctx.fillStyle = "#fff";
      this.ctx.font = "14px JetBrains Mono";
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";

      this.ctx.fillText(
        coinSymbol,
        coin.x + coin.width / 2,
        coin.y + coin.height / 2 + 2
      );
    });
  }

  private renderMonsters(monsters: Monster[]): void {
    // log.debug(`Rendering ${monsters.length} monsters`);

    monsters.forEach((monster, index) => {
      if (!monster.isActive) {
        return; // Don't render inactive monsters
      }

      // Handle blinking effect for monsters about to unfreeze
      let monsterColor = monster.color;
      if (monster.isBlinking) {
        const time = Date.now();
        if (Math.floor(time / 300) % 2 === 0) {
          monsterColor = COLORS.MONSTER_FROZEN; // Blink to frozen color
        } else {
          monsterColor = monster.color; // Normal color
        }
      } else if (monster.isFrozen) {
        monsterColor = COLORS.MONSTER_FROZEN;
      }

      this.ctx.fillStyle = monsterColor;
      this.ctx.fillRect(monster.x, monster.y, monster.width, monster.height);

      // Draw monster eyes
      this.ctx.fillStyle = "#333";
      const eyeY = monster.y + 8;
      this.ctx.fillRect(monster.x + 6, eyeY, 4, 4);
      this.ctx.fillRect(monster.x + monster.width - 10, eyeY, 4, 4);

      // Monster mouth - based on type
      this.ctx.fillStyle = "#333";
      this.ctx.font = "12px JetBrains Mono";
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";
      let typeSymbol = "";
      switch (monster.type) {
        case MonsterType.HORIZONTAL_PATROL:
          typeSymbol = "↔";
          break;
        case MonsterType.VERTICAL_PATROL:
          typeSymbol = "↕";
          break;
        case MonsterType.FLOATER:
          typeSymbol = "⟳";
          break;
        case MonsterType.CHASER:
          typeSymbol = "!";
          break;
        case MonsterType.AMBUSHER:
          typeSymbol = "?";
          break;
      }
      this.ctx.fillText(
        typeSymbol,
        monster.x + monster.width / 2,
        monster.y + monster.height - 5
      );
    });

    // Render respawn indicators for dead monsters
    this.renderRespawnIndicators(monsters);

    // Render spawn indicators for pending dynamic spawns
    this.renderSpawnIndicators(this.currentSpawnManager);
  }

  private renderRespawnIndicators(monsters: Monster[]): void {
    const respawnManager = OptimizedRespawnManager.getInstance();

    monsters.forEach((monster) => {
      if (monster.isDead && monster.originalSpawnPoint) {
        const timeRemaining = respawnManager.getRespawnTimeRemaining(monster);
        const secondsRemaining = Math.ceil(timeRemaining / 1000);
        if (timeRemaining > 0 && secondsRemaining <= 3) {
          // Only show in final 3 seconds
          // Draw respawn indicator at original spawn point
          const spawnPoint = monster.originalSpawnPoint;

          // Use monster's actual color with pulsating effect
          const pulseIntensity = Math.sin(Date.now() / 200) * 0.3 + 0.7; // Pulsing effect
          const monsterColor = monster.color || "#ffffff";

          // Draw a pulsating filled rectangle using monster's color
          this.ctx.fillStyle = `${monsterColor}${Math.floor(
            pulseIntensity * 1 * 255
          )
            .toString(16)
            .padStart(2, "0")}`;
          this.ctx.fillRect(
            spawnPoint.x,
            spawnPoint.y,
            monster.width,
            monster.height
          );

          // Draw respawn timer inside the rectangle
          const text = `${secondsRemaining}`;
          const textX = spawnPoint.x + monster.width / 2;
          const textY = spawnPoint.y + monster.height / 2 + 4;

          // Draw text using monster's color
          this.ctx.fillStyle = "#ffffff"; // White text for contrast
          this.ctx.font = "16px JetBrains Mono";
          this.ctx.textAlign = "center";
          this.ctx.textBaseline = "middle";
          this.ctx.fillText(text, textX, textY);
        }
      }
    });
  }

  private renderSpawnIndicators(spawnManager?: any): void {
    if (!spawnManager) {
      return;
    }

    // Only show spawn indicators when game is in PLAYING state
    if (
      !this.currentGameState ||
      this.currentGameState.currentState !== "PLAYING"
    ) {
      return;
    }

    try {
      const pendingSpawns = spawnManager.getPendingSpawns();

      pendingSpawns.forEach((spawn: any) => {
        const timeRemaining = spawnManager.getSpawnTimeRemaining(spawn);
        const secondsRemaining = Math.ceil(timeRemaining / 1000);
        if (timeRemaining > 0 && secondsRemaining <= 3) {
          // Only show in final 3 seconds
          // Create a temporary monster to get its dimensions and color
          const tempMonster = spawn.spawnPoint.createMonster();

          // Use monster's actual color with pulsating effect
          const pulseIntensity = Math.sin(Date.now() / 200) * 0.3 + 0.7; // Pulsing effect
          const monsterColor = tempMonster.color || "#ffffff";

          // Draw a pulsating filled rectangle using monster's color
          this.ctx.fillStyle = `${monsterColor}${Math.floor(
            pulseIntensity * 1 * 255
          )
            .toString(16)
            .padStart(2, "0")}`;
          this.ctx.fillRect(
            tempMonster.x,
            tempMonster.y,
            tempMonster.width,
            tempMonster.height
          );

          // Draw spawn timer inside the rectangle
          const text = `${secondsRemaining}`;
          const textX = tempMonster.x + tempMonster.width / 2;
          const textY = tempMonster.y + tempMonster.height / 2;

          // Draw text using white for contrast
          this.ctx.fillStyle = "#ffffff"; // White text for contrast
          this.ctx.font = "16px JetBrains Mono";
          this.ctx.textAlign = "center";
          this.ctx.textBaseline = "middle";
          this.ctx.fillText(text, textX, textY);
        }
      });
    } catch (error) {
      // Silently fail if spawn manager is not available
      // This prevents errors when the game is not fully initialized
    }
  }

  private renderFloatingTexts(
    floatingTexts: FloatingText[],
    deltaTime: number
  ): void {
    floatingTexts.forEach((text) => {
      // Calculate animation progress
      const elapsed = Date.now() - text.startTime;
      const progress = Math.min(elapsed / text.duration, 1);

      // Animate position (float upward)
      const floatDistance = 50; // How far the text floats up
      const animatedY = text.y - floatDistance * progress;

      // Animate opacity (fade out)
      const opacity = 1 - progress;

      // Apply opacity
      this.ctx.globalAlpha = opacity;

      this.ctx.fillStyle = text.color;
      this.ctx.font = `${text.fontSize}px JetBrains Mono`;
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";
      this.ctx.fillText(text.text, text.x, animatedY);

      // Reset opacity
      this.ctx.globalAlpha = 1;
    });
  }

  // Public method to load a city theme
  loadCityTheme(cityName: string): void {
    this.backgroundManager.loadMapBackground(cityName);
  }

  // Public method to load a background by map name
  loadMapBackground(mapName: string): void {
    this.backgroundManager.loadMapBackground(mapName);
  }

  // Check if background is ready
  isParallaxReady(): boolean {
    return this.backgroundManager.isReady();
  }

  // Check if background is currently loading
  isParallaxLoading(): boolean {
    return this.backgroundManager.isCurrentlyLoading();
  }

  // Get current map name
  getCurrentMapName(): string {
    return this.backgroundManager.getCurrentMapName();
  }

  // Clear bomb sprites (call when bombs are reset)
  clearBombSprites(): void {
    this.bombSprites.clear();
  }
}
