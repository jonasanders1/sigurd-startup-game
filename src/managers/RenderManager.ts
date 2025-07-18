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
import { ParallaxManager } from "./ParallaxManager";

interface CoinManagerInterface {
  getPcoinCurrentColor: (coin: Coin) => string;
}

export class RenderManager {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private lastTime: number = 0;
  private parallaxManager: ParallaxManager;
  private bombSprites: Map<number, SpriteInstance> = new Map(); // Individual sprites for each bomb

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.parallaxManager = new ParallaxManager(canvas.width, canvas.height);
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
    coinManager?: CoinManagerInterface
  ): void {
    const currentTime = Date.now();
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    // Update parallax background based on player position
    this.parallaxManager.update(player.x, player.y);

    // Render parallax background first
    this.renderParallaxBackground();
    
    // Render game elements on top
    if (ground) {
      this.renderGround(ground);
    }
    this.renderPlatforms(platforms);
    this.renderBombs(bombs);
    this.renderCoins(coins, coinManager);
    this.renderMonsters(monsters);
    this.renderPlayer(player);
    this.renderFloatingTexts(floatingTexts, deltaTime);
  }

  private clearCanvas(): void {
    this.ctx.fillStyle = COLORS.BACKGROUND;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private renderParallaxBackground(): void {
    if (GAME_CONFIG.USE_SPRITES && GAME_CONFIG.PARALLAX_ENABLED) {
      // Use parallax background when sprites and parallax are enabled
      this.parallaxManager.render(this.ctx);
    } else {
      // Fallback to solid background when sprites or parallax are disabled
      this.clearCanvas();
    }
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

    // Add a simple glow effect when floating
    if (player.isFloating) {
      // this.ctx.shadowColor = player.color;
      // this.ctx.shadowBlur = 10;
      // this.ctx.fillRect(player.x, player.y, 10, 10);
      // this.ctx.shadowBlur = 0;
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
      this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
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

      if (bombSprite && GAME_CONFIG.USE_SPRITES) {
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
        this.ctx.font = "12px Arial";
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

      // Add coin type indicator
      this.ctx.fillStyle = "#000";
      this.ctx.font = "10px Arial";
      this.ctx.textAlign = "center";

      let coinSymbol = "C";
      if (coin.type === "POWER") {
        coinSymbol = "P";
      } else if (coin.type === "BONUS_MULTIPLIER") {
        coinSymbol = "B";
      } else if (coin.type === "MONSTER_FREEZE") {
        coinSymbol = "M";
      }

      this.ctx.fillText(
        coinSymbol,
        coin.x + coin.width / 2,
        coin.y + coin.height / 2 + 2
      );
    });
  }

  private renderMonsters(monsters: Monster[]): void {
    log.debug(`Rendering ${monsters.length} monsters`);

    monsters.forEach((monster, index) => {
      if (!monster.isActive) {
        log.debug(`Monster ${index} is not active, skipping`);
        return; // Don't render inactive monsters
      }

      log.debug(`Rendering monster ${index}:`, {
        type: monster.type,
        x: monster.x,
        y: monster.y,
        color: monster.color,
        isActive: monster.isActive,
        isFrozen: monster.isFrozen,
        isBlinking: monster.isBlinking,
      });

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
      this.ctx.fillStyle = "#000";
      this.ctx.fillRect(monster.x + 2, monster.y + 2, 2, 2);
      this.ctx.fillRect(monster.x + monster.width - 4, monster.y + 2, 2, 2);
    });
  }

  private renderFloatingTexts(floatingTexts: FloatingText[], deltaTime: number): void {
    floatingTexts.forEach((text) => {
      // Calculate animation progress
      const elapsed = Date.now() - text.startTime;
      const progress = Math.min(elapsed / text.duration, 1);
      
      // Animate position (float upward)
      const floatDistance = 50; // How far the text floats up
      const animatedY = text.y - (floatDistance * progress);
      
      // Animate opacity (fade out)
      const opacity = 1 - progress;
      
      // Apply opacity
      this.ctx.globalAlpha = opacity;
      
      this.ctx.fillStyle = text.color;
      this.ctx.font = `${text.fontSize}px Arial`;
      this.ctx.textAlign = "center";
      this.ctx.fillText(text.text, text.x, animatedY);
      
      // Reset opacity
      this.ctx.globalAlpha = 1;
    });
  }

  // Public method to load a city theme
  loadCityTheme(cityName: string): void {
    this.parallaxManager.loadCityTheme(cityName);
  }

  // Public method to load a background by map name
  loadMapBackground(mapName: string): void {
    this.parallaxManager.loadMapBackground(mapName);
  }

  // Check if parallax background is ready
  isParallaxReady(): boolean {
    return this.parallaxManager.isReady();
  }

  // Check if parallax is currently loading
  isParallaxLoading(): boolean {
    return this.parallaxManager.isCurrentlyLoading();
  }

  // Get current map name
  getCurrentMapName(): string {
    return this.parallaxManager.getCurrentMapName();
  }

  // Clear bomb sprites (call when bombs are reset)
  clearBombSprites(): void {
    this.bombSprites.clear();
  }
}
