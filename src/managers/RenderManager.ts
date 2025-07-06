import { Player, Monster, Bomb, Platform, Ground, Coin, FloatingText } from "../types/interfaces";
import { COLORS } from "../types/constants";
import { playerSprite } from "../entities/Player";
import { GAME_CONFIG } from "../types/constants";
import { COIN_TYPES, P_COIN_COLORS } from "../config/coinTypes";
import { log } from "../lib/logger";

interface CoinManagerInterface {
  getPcoinCurrentColor: (coin: Coin) => string;
}

export class RenderManager {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
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
    this.clearCanvas();
    if (ground) {
      this.renderGround(ground);
    }
    this.renderPlatforms(platforms);
    this.renderBombs(bombs);
    this.renderCoins(coins, coinManager);
    this.renderMonsters(monsters);
    this.renderPlayer(player);
    this.renderFloatingTexts(floatingTexts);
  }

  private clearCanvas(): void {
    this.ctx.fillStyle = COLORS.BACKGROUND;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private renderGround(ground: Ground): void {
    this.ctx.fillStyle = ground.color;
    this.ctx.fillRect(ground.x, ground.y, ground.width, ground.height);
  }

  private renderPlayer(player: Player): void {
    if (playerSprite) {
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
      this.ctx.fillRect(
        platform.x,
        platform.y,
        platform.width,
        platform.height
      );
    });
  }

  private renderBombs(bombs: Bomb[]): void {
    bombs.forEach((bomb) => {
      if (bomb.isCollected) {
        return; // Don't render collected bombs
      }

      // Blinking effect for next bomb in sequence
      if (bomb.isBlinking) {
        const time = Date.now();
        if (Math.floor(time / 300) % 2 === 0) {
          this.ctx.fillStyle = COLORS.BOMB_NEXT;
        } else {
          this.ctx.fillStyle = COLORS.BOMB;
        }
      } else {
        this.ctx.fillStyle = COLORS.BOMB;
      }

      // Draw bomb as circle
      this.ctx.beginPath();
      this.ctx.arc(
        bomb.x + bomb.width / 2,
        bomb.y + bomb.height / 2,
        bomb.width / 2,
        0,
        2 * Math.PI
      );
      this.ctx.fill();

      // Draw bomb number
      this.ctx.fillStyle = "#000000";
      this.ctx.font = "12px Arial";
      this.ctx.textAlign = "center";
      this.ctx.fillText(
        bomb.order.toString(),
        bomb.x + bomb.width / 2,
        bomb.y + bomb.height / 2 + 4
      );
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
    monsters.forEach((monster) => {
      if (!monster.isActive) {
        return; // Don't render inactive monsters
      }

      // Different color for frozen monsters
      if (monster.isFrozen) {
        this.ctx.fillStyle = COLORS.MONSTER_FROZEN;
      } else {
        this.ctx.fillStyle = monster.color;
      }

      this.ctx.fillRect(
        monster.x,
        monster.y,
        monster.width,
        monster.height
      );

      // Draw monster eyes
      this.ctx.fillStyle = "#000";
      this.ctx.fillRect(
        monster.x + 2,
        monster.y + 2,
        2,
        2
      );
      this.ctx.fillRect(
        monster.x + monster.width - 4,
        monster.y + 2,
        2,
        2
      );
    });
  }

  private renderFloatingTexts(floatingTexts: FloatingText[]): void {
    floatingTexts.forEach((text) => {
      this.ctx.fillStyle = text.color;
      this.ctx.font = `${text.fontSize}px Arial`;
      this.ctx.textAlign = "center";
      this.ctx.fillText(text.text, text.x, text.y);
    });
  }
}
