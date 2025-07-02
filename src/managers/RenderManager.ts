import { Player, Monster, Bomb, Platform, Ground, Coin } from "../types/interfaces";
import { COLORS } from "../types/constants";
import { playerSprite } from "@/entities/Player";
import { GAME_CONFIG } from "../types/constants";
import { COIN_TYPES, P_COIN_COLORS } from "../config/coinTypes";

export class RenderManager {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
  }

  render(
    player: Player,
    platforms: Platform[],
    bombs: Bomb[],
    monsters: Monster[],
    ground: Ground | null,
    coins: Coin[] = [],
    floatingTexts: any[] = [],
    coinManager?: any
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

      // Draw order number
      this.ctx.fillStyle = "#000000";
      this.ctx.font = "10px Arial";
      this.ctx.textAlign = "center";
      this.ctx.fillText(
        bomb.order.toString(),
        bomb.x + bomb.width / 2,
        bomb.y + bomb.height / 2 + 3
      );
    });
  }

  private renderCoins(coins: Coin[], coinManager?: any): void {
    coins.forEach((coin) => {
      if (coin.isCollected) {
        return; // Don't render collected coins
      }

      // Get coin configuration for color and effects
      const coinConfig = COIN_TYPES[coin.type];
      let coinColor = COLORS.COIN_POWER; // Default fallback

      if (coinConfig) {
        // Special handling for P-coins - use dynamic color based on time
        if (coin.type === 'POWER' && coinManager) {
          coinColor = coinManager.getPcoinCurrentColor(coin);
        } else {
          coinColor = coinConfig.color;
        }
      } else {
        // Legacy color mapping
        switch (coin.type) {
          case 'POWER':
            coinColor = COLORS.COIN_POWER;
            break;
          case 'BONUS_MULTIPLIER':
            coinColor = COLORS.COIN_BONUS;
            break;
          case 'EXTRA_LIFE':
            coinColor = COLORS.COIN_LIFE;
            break;
          default:
            coinColor = COLORS.COIN_POWER;
        }
      }

      // Draw coin as a circle
      this.ctx.fillStyle = coinColor;
      this.ctx.beginPath();
      this.ctx.arc(
        coin.x + coin.width / 2,
        coin.y + coin.height / 2,
        coin.width / 2,
        0,
        2 * Math.PI
      );
      this.ctx.fill();

      // Add a shimmer effect
      this.ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
      this.ctx.beginPath();
      this.ctx.arc(
        coin.x + coin.width / 2 - 2,
        coin.y + coin.height / 2 - 2,
        coin.width / 4,
        0,
        2 * Math.PI
      );
      this.ctx.fill();

      // Draw coin type letter
      this.ctx.fillStyle = "#FFFFFF";
      this.ctx.font = "bold 12px Arial";
      this.ctx.textAlign = "center";
      this.ctx.fillText(
        coin.type.charAt(0),
        coin.x + coin.width / 2,
        coin.y + coin.height / 2 + 4
      );

      // Add special visual effects based on coin type
      if (coinConfig?.physics?.customUpdate) {
        // Add floating effect for custom physics coins
        this.ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.arc(
          coin.x + coin.width / 2,
          coin.y + coin.height / 2,
          coin.width / 2 + 2,
          0,
          2 * Math.PI
        );
        this.ctx.stroke();
      }
    });
  }

  private renderMonsters(monsters: Monster[]): void {
    monsters.forEach((monster) => {
      if (!monster.isActive) return;

      // Handle blinking effect for frozen monsters
      let monsterColor = monster.isFrozen ? COLORS.MONSTER_FROZEN : monster.color;
      
      if (monster.isBlinking) {
        const time = Date.now();
        // Blink every 200ms (5 times per second)
        if (Math.floor(time / 200) % 2 === 0) {
          monsterColor = COLORS.MONSTER_FROZEN; // Normal frozen color
        } else {
          monsterColor = "#FF0000"; // Red warning color
        }
      }

      this.ctx.fillStyle = monsterColor;
      this.ctx.fillRect(monster.x, monster.y, monster.width, monster.height);

      // Add simple eyes
      this.ctx.fillStyle = "#FFFFFF";
      this.ctx.fillRect(monster.x + 3, monster.y + 3, 3, 3);
      this.ctx.fillRect(monster.x + monster.width - 6, monster.y + 3, 3, 3);

      // Add frozen effect (ice crystals) for frozen monsters
      if (monster.isFrozen) {
        this.ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
        this.ctx.fillRect(monster.x + 1, monster.y + 1, 2, 2);
        this.ctx.fillRect(monster.x + monster.width - 3, monster.y + 1, 2, 2);
        this.ctx.fillRect(monster.x + 1, monster.y + monster.height - 3, 2, 2);
        this.ctx.fillRect(monster.x + monster.width - 3, monster.y + monster.height - 3, 2, 2);
      }
    });
  }

  private renderFloatingTexts(floatingTexts: any[]): void {
    const currentTime = Date.now();
    
    // Save original text properties
    const originalTextAlign = this.ctx.textAlign;
    const originalTextBaseline = this.ctx.textBaseline;
    const originalFont = this.ctx.font;
    const originalFillStyle = this.ctx.fillStyle;
    const originalGlobalAlpha = this.ctx.globalAlpha;
    const originalShadowColor = this.ctx.shadowColor;
    const originalShadowBlur = this.ctx.shadowBlur;
    const originalShadowOffsetX = this.ctx.shadowOffsetX;
    const originalShadowOffsetY = this.ctx.shadowOffsetY;
    
    floatingTexts.forEach(text => {
      const elapsed = currentTime - text.startTime;
      const progress = elapsed / text.duration;
      
      // Calculate fade out effect
      const alpha = Math.max(0, 1 - progress);
      
      // Calculate upward movement
      const yOffset = progress * 30; // Move up 30 pixels over the duration
      
      // Set text properties
      this.ctx.fillStyle = text.color;
      this.ctx.globalAlpha = alpha;
      this.ctx.font = `bold ${text.fontSize}px Arial`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      
      // Draw text with shadow for better visibility
      this.ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      this.ctx.shadowBlur = 2;
      this.ctx.shadowOffsetX = 1;
      this.ctx.shadowOffsetY = 1;
      
      this.ctx.fillText(text.text, text.x, text.y - yOffset);
    });
    
    // Restore original text properties
    this.ctx.textAlign = originalTextAlign;
    this.ctx.textBaseline = originalTextBaseline;
    this.ctx.font = originalFont;
    this.ctx.fillStyle = originalFillStyle;
    this.ctx.globalAlpha = originalGlobalAlpha;
    this.ctx.shadowColor = originalShadowColor;
    this.ctx.shadowBlur = originalShadowBlur;
    this.ctx.shadowOffsetX = originalShadowOffsetX;
    this.ctx.shadowOffsetY = originalShadowOffsetY;
  }
}
