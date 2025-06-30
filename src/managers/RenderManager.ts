import { Player, Monster, Bomb, Platform, Ground, Coin } from "../types/interfaces";
import { COLORS } from "../types/constants";
import { playerSprite } from "@/entities/Player";
import { GAME_CONFIG } from "../types/constants";

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
    coins: Coin[] = []
  ): void {
    this.clearCanvas();
    if (ground) {
      this.renderGround(ground);
    }
    this.renderPlatforms(platforms);
    this.renderBombs(bombs);
    this.renderCoins(coins);
    this.renderMonsters(monsters);
    this.renderPlayer(player);
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

  private renderCoins(coins: Coin[]): void {
    coins.forEach((coin) => {
      if (coin.isCollected) {
        return; // Don't render collected coins
      }

      // Set coin color based on type
      switch (coin.type) {
        case 'POWER':
          this.ctx.fillStyle = COLORS.COIN_POWER;
          break;
        case 'BONUS_MULTIPLIER':
          this.ctx.fillStyle = COLORS.COIN_BONUS;
          break;
        case 'EXTRA_LIFE':
          this.ctx.fillStyle = COLORS.COIN_LIFE;
          break;
        default:
          this.ctx.fillStyle = COLORS.COIN_POWER;
      }

      // Draw coin as a circle
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
    });
  }

  private renderMonsters(monsters: Monster[]): void {
    monsters.forEach((monster) => {
      if (!monster.isActive) return;

      // Use different color for frozen monsters
      this.ctx.fillStyle = monster.isFrozen ? COLORS.MONSTER_FROZEN : monster.color;
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
}
