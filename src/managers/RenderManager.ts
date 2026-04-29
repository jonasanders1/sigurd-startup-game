import {
  Player,
  Monster,
  Bomb,
  Platform,
  Ground,
  Coin,
  FloatingText,
  MapDefinition,
} from "../types/interfaces";
import { COLORS, DEV_CONFIG } from "../types/constants";
import { SHOW_HITBOXES } from "../config/dev";
import { playerSprite } from "../entities/Player";
import { bombSprite, BombSpriteInstance } from "../entities/Bomb";
import { ByrakratSprite, dirName, type ByrakratVariant } from "../entities/Byrakrat";
import {
  getHitboxForFrame,
  applyHitboxToMonster,
  getNaturalAnchor,
} from "../config/monsterHitboxes";
import { VertikalByrakratSprite } from "../entities/VertikalByrakrat";
import { RegelRobotenSprite, dirNameRegel } from "../entities/RegelRoboten";
import { SkatteSpokelsetSprite, dirNameSkatte } from "../entities/SkatteSpokelset";
import { HodelosKonsulentSprite, dirNameHodelos } from "../entities/HodelosKonsulent";
import { SpriteInstance } from "../lib/SpriteInstance";
import { GAME_CONFIG } from "../types/constants";
import { COIN_TYPES, P_COIN_COLORS } from "../config/coinTypes";
import {
  getPlatformTileSet,
  DEFAULT_PLATFORM_THEME,
  layoutPlatformTiles,
} from "../config/platformTiles";
import {
  getGroundTileSet,
  DEFAULT_GROUND_THEME,
  layoutGroundCells,
  type GroundCell,
} from "../config/groundTiles";
import { log } from "../lib/logger";
import { BackgroundManager } from "./BackgroundManager";
import { OptimizedRespawnManager } from "./OptimizedRespawnManager";
import type { OptimizedSpawnManager } from "./OptimizedSpawnManager";
import { MonsterType } from "@/types/enums";

interface CoinManagerInterface {
  getPcoinCurrentColor: (coin: Coin) => string;
}

interface GameStateSnapshot {
  currentState: string;
}

export class RenderManager {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private lastTime: number = 0;
  private backgroundManager: BackgroundManager;
  private bombSprites: Map<number, SpriteInstance> = new Map();
  private byrakratSprites: WeakMap<Monster, ByrakratSprite> = new WeakMap();
  private vertikalByrakratSprites: WeakMap<Monster, VertikalByrakratSprite> = new WeakMap();
  private regelRobotenSprites: WeakMap<Monster, RegelRobotenSprite> = new WeakMap();
  private skatteSpokelsetSprites: WeakMap<Monster, SkatteSpokelsetSprite> = new WeakMap();
  private hodelosKonsulentSprites: WeakMap<Monster, HodelosKonsulentSprite> = new WeakMap();
  private currentSpawnManager: OptimizedSpawnManager | null = null;
  private currentGameState: GameStateSnapshot | null = null;
  private frameTime: number = 0; // Cached Date.now() for current frame
  /** Per-Ground tile layout cache; survives until the Ground reference changes. */
  private groundLayoutCache: WeakMap<Ground, GroundCell[]> = new WeakMap();

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
    spawnManager?: OptimizedSpawnManager,
    currentMap?: MapDefinition,
    gameState?: GameStateSnapshot
  ): void {
    // Store spawn manager and game state for use in indicator rendering
    this.currentSpawnManager = spawnManager;
    this.currentGameState = gameState;
    this.frameTime = Date.now();
    const deltaTime = this.frameTime - this.lastTime;
    this.lastTime = this.frameTime;

    // Render background first
    this.renderBackground();

    // Render game elements on top
    this.renderGround(ground);
    this.renderPlatforms(platforms);
    this.renderBombs(bombs);
    this.renderCoins(coins, coinManager);
    this.renderMonsters(monsters, deltaTime, player);
    this.renderPlayer(player);
    this.renderFloatingTexts(floatingTexts, deltaTime);

    if (SHOW_HITBOXES) {
      this.renderHitboxes(player, platforms, bombs, monsters, ground, coins);
    }
  }

  private strokeRect(color: string, x: number, y: number, w: number, h: number): void {
    this.ctx.strokeStyle = color;
    this.ctx.strokeRect(Math.round(x) + 0.5, Math.round(y) + 0.5, w, h);
  }

  private strokeEllipse(color: string, x: number, y: number, w: number, h: number): void {
    this.ctx.strokeStyle = color;
    this.ctx.beginPath();
    this.ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
    this.ctx.stroke();
  }

  private renderHitboxes(
    player: Player,
    platforms: Platform[],
    bombs: Bomb[],
    monsters: Monster[],
    ground: Ground | null,
    coins: Coin[]
  ): void {
    const ctx = this.ctx;
    const prevSmoothing = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    ctx.lineWidth = 1;

    if (ground) this.strokeRect("#888888", ground.x, ground.y, ground.width, ground.height);
    platforms.forEach((p) => this.strokeRect("#00BFFF", p.x, p.y, p.width, p.height));
    bombs.forEach((b) => {
      if (!b.isCollected) this.strokeEllipse("#FF3030", b.x, b.y, b.width, b.height);
    });
    coins.forEach((c) => {
      if (!c.isCollected) this.strokeRect("#FFD700", c.x, c.y, c.width, c.height);
    });
    monsters.forEach((m) => this.strokeRect("#FF66FF", m.x, m.y, m.width, m.height));
    this.strokeRect("#00FF00", player.x, player.y, player.width, player.height);

    ctx.imageSmoothingEnabled = prevSmoothing;
  }

  private renderBackground(): void {
    this.backgroundManager.render(this.ctx);
  }

  private renderGround(ground: Ground): void {
    const ctx = this.ctx;
    const theme = ground.tileTheme || DEFAULT_GROUND_THEME;
    const tiles = getGroundTileSet(theme);
    const ready =
      tiles.surface.every((img) => img.complete && img.naturalWidth > 0) &&
      tiles.ground.every((img) => img.complete && img.naturalWidth > 0);

    if (!ready) {
      // Tiles still loading — solid fill so the player has ground to stand on.
      ctx.fillStyle = ground.color || DEV_CONFIG.COLORS.GROUND;
      ctx.fillRect(ground.x, ground.y, ground.width, ground.height);
      return;
    }

    const prevSmoothing = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;

    // Clip to ground bounds so overflow cells (when width/height isn't a
    // clean multiple of the block size) get cropped instead of bleeding past.
    ctx.save();
    ctx.beginPath();
    ctx.rect(ground.x, ground.y, ground.width, ground.height);
    ctx.clip();

    let cells = this.groundLayoutCache.get(ground);
    if (!cells) {
      cells = layoutGroundCells(
        ground.x,
        ground.y,
        ground.width,
        ground.height,
        theme,
        ground.tileNoise
      );
      this.groundLayoutCache.set(ground, cells);
    }
    for (const cell of cells) {
      const variants = cell.layer === "surface" ? tiles.surface : tiles.ground;
      const img = variants[cell.variantIndex % variants.length];
      ctx.drawImage(img, cell.x, cell.y, cell.width, cell.height);
    }

    ctx.restore();
    ctx.imageSmoothingEnabled = prevSmoothing;
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
    const ctx = this.ctx;
    const prevSmoothing = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;

    platforms.forEach((platform) => {
      const theme = platform.tileTheme || DEFAULT_PLATFORM_THEME;
      const tiles = getPlatformTileSet(theme);
      if (
        !tiles.left.complete ||
        !tiles.middle.complete ||
        !tiles.right.complete
      ) {
        // Tiles not yet loaded — fall back to a solid rect so platforms remain visible.
        ctx.fillStyle = platform.color || "#888888";
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        return;
      }

      const isVertical = platform.isVertical ?? false;
      const slots = layoutPlatformTiles(platform.width, platform.height, isVertical);
      for (const slot of slots) {
        const img = tiles[slot.piece];
        const dx = platform.x + slot.localX;
        const dy = platform.y + slot.localY;
        if (isVertical) {
          // Rotate 90° CW around the slot center; pre-rotation rect is (height × width).
          ctx.save();
          ctx.translate(dx + slot.width / 2, dy + slot.height / 2);
          ctx.rotate(Math.PI / 2);
          ctx.drawImage(img, -slot.height / 2, -slot.width / 2, slot.height, slot.width);
          ctx.restore();
        } else {
          ctx.drawImage(img, dx, dy, slot.width, slot.height);
        }
      }
    });

    ctx.imageSmoothingEnabled = prevSmoothing;
  }

  private renderBombs(bombs: Bomb[]): void {
    const prevSmoothing = this.ctx.imageSmoothingEnabled;
    this.ctx.imageSmoothingEnabled = false;

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
        this.ctx.font = "12px JetBrains Mono";
        this.ctx.textAlign = "center";
        this.ctx.fillText(
          bomb.order.toString(),
          bomb.x + bomb.width / 2,
          bomb.y + bomb.height / 2 + 4
        );
      }
    });

    this.ctx.imageSmoothingEnabled = prevSmoothing;
  }

  private renderCoins(coins: Coin[], coinManager?: CoinManagerInterface): void {
    // Disable anti-aliasing for pixel-art coins
    this.ctx.imageSmoothingEnabled = false;

    coins.forEach((coin) => {
      if (coin.isCollected) return;

      const coinConfig = COIN_TYPES[coin.type];
      let color = coinConfig?.color || "#FFD700";

      if (coin.type === "POWER" && coinManager) {
        color = coinManager.getPcoinCurrentColor(coin);
      }

      const x = Math.round(coin.x);
      const y = Math.round(coin.y);
      const s = coin.width; // coin size (square)
      const px = Math.max(1, Math.round(s / 8)); // pixel unit size

      // Pulsing scale
      const pulse = Math.sin(this.frameTime / 200) * 0.06 + 1;
      const halfExpand = Math.round(((pulse - 1) * s) / 2);

      const ox = x - halfExpand;
      const oy = y - halfExpand;
      const sz = s + halfExpand * 2;

      // Shadow (1px offset)
      this.ctx.fillStyle = "rgba(0,0,0,0.35)";
      this.drawPixelOctagon(ox + 1, oy + 1, sz, px);

      // Main body
      this.ctx.fillStyle = color;
      this.drawPixelOctagon(ox, oy, sz, px);

      // Dark inner border for depth
      this.ctx.fillStyle = "rgba(0,0,0,0.25)";
      this.drawPixelOctagon(ox + px, oy + px, sz - px * 2, Math.max(1, px - 1));

      // Highlight top-left
      this.ctx.fillStyle = "rgba(255,255,255,0.3)";
      this.ctx.fillRect(ox + px * 2, oy + px, px * 2, px);
      this.ctx.fillRect(ox + px, oy + px * 2, px, px * 2);

      // Letter
      let coinSymbol = "C";
      if (coin.type === "POWER") coinSymbol = "P";
      else if (coin.type === "BONUS_MULTIPLIER") coinSymbol = "B";
      else if (coin.type === "EXTRA_LIFE") coinSymbol = "M";

      this.ctx.fillStyle = "#fff";
      this.ctx.font = `bold ${Math.round(s * 0.55)}px Pixelify Sans`;
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";
      this.ctx.fillText(coinSymbol, Math.round(ox + sz / 2), Math.round(oy + sz / 2) + 1);
    });

    this.ctx.imageSmoothingEnabled = true;
  }

  /** Draw a pixel-art octagon (circle approximation) using axis-aligned rects. */
  private drawPixelOctagon(x: number, y: number, size: number, px: number): void {
    const indent = Math.round(size * 0.25);
    const rows = Math.round(size / px);
    const cornerRows = Math.round(rows * 0.2); // rows used for corner indent on each side

    for (let r = 0; r < rows; r++) {
      // Distance from nearest edge (symmetric top and bottom)
      const distFromEdge = Math.min(r, rows - 1 - r);
      let rowIndent = 0;

      if (distFromEdge < cornerRows) {
        rowIndent = Math.round(indent * (1 - distFromEdge / cornerRows));
      }

      this.ctx.fillRect(
        Math.round(x + rowIndent),
        Math.round(y + r * px),
        Math.round(size - rowIndent * 2),
        px
      );
    }
  }

  private renderMonsters(monsters: Monster[], deltaTime: number, player: Player): void {
    // Pixel-art monster sprites need nearest-neighbor scaling. Toggle once for
    // the whole pass instead of save/restoring inside every sprite.draw().
    const prevSmoothing = this.ctx.imageSmoothingEnabled;
    this.ctx.imageSmoothingEnabled = false;

    monsters.forEach((monster, index) => {
      // Byråkrat-klonen handles its own activity check so dead monsters can
      // render through the death animation before disappearing.
      if (monster.type === MonsterType.HORIZONTAL_PATROL) {
        this.renderByrakrat(monster);
        return;
      }

      if (monster.type === MonsterType.VERTICAL_PATROL) {
        this.renderVertikalByrakrat(monster, deltaTime);
        return;
      }

      if (monster.type === MonsterType.AMBUSHER) {
        this.renderRegelRoboten(monster);
        return;
      }

      if (monster.type === MonsterType.CHASER) {
        this.renderSkatteSpokelset(monster, deltaTime, player);
        return;
      }

      if (monster.type === MonsterType.FLOATER) {
        this.renderHodelosKonsulent(monster, deltaTime);
        return;
      }

      if (!monster.isActive) {
        return; // Don't render inactive monsters
      }

      // Handle blinking effect for monsters about to unfreeze
      let monsterColor = monster.color;
      if (monster.isBlinking) {
        const time = this.frameTime;
        if (Math.floor(time / 300) % 2 === 0) {
          monsterColor = COLORS.MONSTER_FROZEN; // Blink to frozen color
        } else {
          monsterColor = monster.color; // Normal color
        }
      } else if (monster.isFrozen) {
        monsterColor = COLORS.MONSTER_FROZEN;
      }

      // Draw subtle shadow first (similar to coins)
      this.ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
      this.ctx.beginPath();
      this.ctx.roundRect(
        monster.x,
        monster.y,
        monster.width + 1,
        monster.height + 1,
        4
      );
      this.ctx.fill();

      this.ctx.fillStyle = monsterColor;

      // Draw rounded rectangle for monster
      const radius = 4;
      const x = monster.x;
      const y = monster.y;
      const width = monster.width;
      const height = monster.height;

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
      this.ctx.fill();

      // Add body highlights for more dimension
      this.ctx.fillStyle = `rgba(0, 0, 0, 0.15)`;
      this.ctx.beginPath();
      this.ctx.moveTo(x + radius + 2, y + 2);
      this.ctx.lineTo(x + width - radius - 2, y + 2);
      this.ctx.quadraticCurveTo(
        x + width - 2,
        y + 2,
        x + width - 2,
        y + radius + 2
      );
      this.ctx.lineTo(x + width - 2, y + height - radius - 2);
      this.ctx.quadraticCurveTo(
        x + width - 2,
        y + height - 2,
        x + width - radius - 2,
        y + height - 2
      );
      this.ctx.lineTo(x + radius + 2, y + height - 2);
      this.ctx.quadraticCurveTo(
        x + 2,
        y + height - 2,
        x + 2,
        y + height - radius - 2
      );
      this.ctx.lineTo(x + 2, y + radius + 2);
      this.ctx.quadraticCurveTo(x + 2, y + 2, x + radius + 2, y + 2);
      this.ctx.closePath();
      this.ctx.fill();

      // Draw monster eyes
      const eyeY = monster.y + 8;
      const leftEyeX = monster.x + monster.width * 0.3;
      const rightEyeX = monster.x + monster.width * 0.7;

      // Draw eye whites with subtle glow
      this.ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
      this.ctx.beginPath();
      this.ctx.arc(leftEyeX, eyeY, 4, 0, 2 * Math.PI);
      this.ctx.fill();
      this.ctx.beginPath();
      this.ctx.arc(rightEyeX, eyeY, 4, 0, 2 * Math.PI);
      this.ctx.fill();

      // Draw eye pupils with depth
      this.ctx.fillStyle = "#333";
      this.ctx.beginPath();
      this.ctx.arc(leftEyeX, eyeY, 2.5, 0, 2 * Math.PI);
      this.ctx.fill();
      this.ctx.beginPath();
      this.ctx.arc(rightEyeX, eyeY, 2.5, 0, 2 * Math.PI);
      this.ctx.fill();

      // Add angry eyebrows
      this.ctx.strokeStyle = "#f";
      this.ctx.lineWidth = 2;
      this.ctx.lineCap = "round";

      // Left eyebrow (angled down and inward)
      this.ctx.beginPath();
      this.ctx.moveTo(leftEyeX - 3, eyeY - 6);
      this.ctx.lineTo(leftEyeX + 2, eyeY - 4);
      this.ctx.stroke();

      // Right eyebrow (angled down and inward)
      this.ctx.beginPath();
      this.ctx.moveTo(rightEyeX - 2, eyeY - 4);
      this.ctx.lineTo(rightEyeX + 3, eyeY - 6);
      this.ctx.stroke();

      // Add subtle eye outline for definition
      this.ctx.strokeStyle = "rgba(0, 0, 0, 0.3)";
      this.ctx.lineWidth = 0.5;
      this.ctx.beginPath();
      this.ctx.arc(leftEyeX, eyeY, 4, 0, 2 * Math.PI);
      this.ctx.stroke();
      this.ctx.beginPath();
      this.ctx.arc(rightEyeX, eyeY, 4, 0, 2 * Math.PI);
      this.ctx.stroke();

      // Monster mouth - angry and simple
      this.ctx.fillStyle = "#333";
      this.ctx.lineWidth = 2;
      this.ctx.lineCap = "round";

      // Draw angry mouth (simple curved line)
      const mouthY = monster.y + monster.height - 8;
      const mouthCenterX = monster.x + monster.width / 2;
      const mouthWidth = monster.width * 0.4;

      this.ctx.beginPath();
      this.ctx.moveTo(mouthCenterX - mouthWidth / 2, mouthY);
      this.ctx.quadraticCurveTo(
        mouthCenterX,
        mouthY - 3,
        mouthCenterX + mouthWidth / 2,
        mouthY
      );
      this.ctx.stroke();
    });

    this.ctx.imageSmoothingEnabled = prevSmoothing;

    this.renderRespawnIndicators(monsters);
    this.renderSpawnIndicators(this.currentSpawnManager);
  }

  /**
   * Advance the byråkrat sprite animation state and apply its per-frame hitbox.
   * Called BEFORE collision check so the collision uses the current frame's
   * hitbox (otherwise collision would lag the visual by one frame).
   *
   * `idleOnly` forces the idle animation during countdown / pre-play states so
   * monsters look "alive" without committing to walk/attack states.
   */
  private updateByrakratState(
    monster: Monster,
    deltaTime: number,
    idleOnly: boolean = false
  ): void {
    let sprite = this.byrakratSprites.get(monster);
    if (!sprite) {
      const variant: ByrakratVariant =
        (monster as { variant?: ByrakratVariant }).variant ?? "green";
      sprite = new ByrakratSprite(variant);
      this.byrakratSprites.set(monster, sprite);
    }

    if (monster.isDead && sprite.isDeathAnimComplete()) return;

    const dir = dirName(monster.direction);
    if (monster.isDead) {
      sprite.setAnimation(`death-${dir}`);
    } else if (monster.isFrozen) {
      const phase = monster.isBlinking ? "blink" : "still";
      sprite.setAnimation(`freeze-${phase}-${dir}`);
    } else if (idleOnly) {
      sprite.setAnimation(`idle-${dir}`);
    } else if (monster.direction < 0) {
      sprite.setAnimation("walk-left");
    } else if (monster.direction > 0) {
      sprite.setAnimation("walk-right");
    } else {
      sprite.setAnimation("idle-front");
    }

    sprite.update(deltaTime);

    if (!monster.isDead) {
      const hitbox = getHitboxForFrame(
        monster.type,
        sprite.getAnimation(),
        sprite.getFrame()
      );
      applyHitboxToMonster(monster, hitbox, "feet");
    }
  }

  private renderByrakrat(monster: Monster): void {
    const sprite = this.byrakratSprites.get(monster);
    if (!sprite) return;
    if (monster.isDead && sprite.isDeathAnimComplete()) return;

    const NATURAL = GAME_CONFIG.MONSTER_SIZE;
    const { x: feetX, y: feetY } = getNaturalAnchor(monster, "feet");
    sprite.draw(this.ctx, feetX - NATURAL / 2, feetY - NATURAL, NATURAL, NATURAL);
  }

  /**
   * Pre-collision pass: advance every monster sprite that has per-frame hitbox
   * data and apply its current frame's hitbox to monster.x/y/width/height.
   * Call this from the game loop BEFORE collision detection.
   */
  public updateMonsterAnimations(
    monsters: Monster[],
    deltaTime: number,
    player: Player,
    idleOnly: boolean = false
  ): void {
    for (const monster of monsters) {
      if (monster.type === MonsterType.HORIZONTAL_PATROL) {
        this.updateByrakratState(monster, deltaTime, idleOnly);
      } else if (monster.type === MonsterType.AMBUSHER) {
        this.updateRegelRobotenState(monster, deltaTime, player, idleOnly);
      }
      // Add other monsters here as they get per-frame hitbox configs.
    }
  }

  /**
   * Advance ambusher animation state and apply per-frame hitbox (incl. rotation
   * during attack-left/attack-right). Run BEFORE collision so the rotated
   * hitbox is current at collision time.
   */
  private updateRegelRobotenState(
    monster: Monster,
    deltaTime: number,
    player: Player,
    idleOnly: boolean = false
  ): void {
    let sprite = this.regelRobotenSprites.get(monster);
    if (!sprite) {
      sprite = new RegelRobotenSprite();
      this.regelRobotenSprites.set(monster, sprite);
    }

    if (monster.isDead && sprite.isDeathAnimComplete()) return;

    const FRONT_THRESHOLD = 10;
    const dx = player.x + player.width / 2 - (monster.x + monster.width / 2);
    const dirSign = Math.abs(dx) < FRONT_THRESHOLD ? 0 : Math.sign(dx);
    const dir = dirNameRegel(dirSign);

    if (monster.isDead) {
      sprite.setAnimation(`death-${dir}`);
    } else if (monster.isFrozen) {
      const phase = monster.isBlinking ? "blink" : "still";
      sprite.setAnimation(`freeze-${phase}-${dir}`);
    } else if (idleOnly) {
      sprite.setAnimation(`idle-${dir}`);
    } else if (monster.behaviorState === "ambushing") {
      sprite.setAnimation(`attack-${dir}`);
    } else {
      sprite.setAnimation(`run-${dir}`);
    }

    sprite.update(deltaTime);

    if (!monster.isDead) {
      const hitbox = getHitboxForFrame(
        monster.type,
        sprite.getAnimation(),
        sprite.getFrame()
      );
      applyHitboxToMonster(monster, hitbox, "center");
    }
  }

  private renderRegelRoboten(monster: Monster): void {
    const sprite = this.regelRobotenSprites.get(monster);
    if (!sprite) return;
    if (monster.isDead && sprite.isDeathAnimComplete()) return;

    // Draw sprite at natural size, centered on stable natural center.
    const NATURAL = GAME_CONFIG.MONSTER_SIZE;
    const { x: cx, y: cy } = getNaturalAnchor(monster, "center");
    sprite.draw(this.ctx, cx - NATURAL / 2, cy - NATURAL / 2, NATURAL, NATURAL);

  }

  private renderHodelosKonsulent(monster: Monster, deltaTime: number): void {
    let sprite = this.hodelosKonsulentSprites.get(monster);
    if (!sprite) {
      sprite = new HodelosKonsulentSprite();
      this.hodelosKonsulentSprites.set(monster, sprite);
    }

    // Direction from horizontal velocity (floater moves freely). Falls back to
    // monster.direction if velocity isn't set yet.
    const vx = monster.velocityX ?? 0;
    const dirSign = Math.abs(vx) > 0.1 ? Math.sign(vx) : monster.direction;
    const dir = dirNameHodelos(dirSign);

    if (monster.isDead) {
      if (sprite.isDeathAnimComplete()) return;
      sprite.setAnimation(`death-${dir}`);
    } else if (monster.isFrozen) {
      const phase = monster.isBlinking ? "blink" : "still";
      sprite.setAnimation(`freeze-${phase}-${dir}`);
    } else if (dir === "front") {
      // No walk-front frames available — fall back to idle when purely vertical
      sprite.setAnimation("idle-front");
    } else {
      sprite.setAnimation(`walk-${dir}`);
    }

    sprite.update(deltaTime);
    sprite.draw(
      this.ctx,
      monster.x,
      monster.y,
      monster.width,
      monster.height
    );
  }

  private renderSkatteSpokelset(
    monster: Monster,
    deltaTime: number,
    player: Player
  ): void {
    let sprite = this.skatteSpokelsetSprites.get(monster);
    if (!sprite) {
      sprite = new SkatteSpokelsetSprite();
      this.skatteSpokelsetSprites.set(monster, sprite);
    }

    // Face the player. Front when player is roughly directly above/below.
    const FRONT_THRESHOLD = 10;
    const dx =
      player.x + player.width / 2 - (monster.x + monster.width / 2);
    const dirSign = Math.abs(dx) < FRONT_THRESHOLD ? 0 : Math.sign(dx);
    const dir = dirNameSkatte(dirSign);

    if (monster.isDead) {
      if (sprite.isDeathAnimComplete()) return;
      sprite.setAnimation(`death-${dir}`);
    } else if (monster.isFrozen) {
      const phase = monster.isBlinking ? "blink" : "still";
      sprite.setAnimation(`freeze-${phase}-${dir}`);
    } else {
      // Chasers are essentially always pursuing — default to walk.
      sprite.setAnimation(`walk-${dir}`);
    }

    sprite.update(deltaTime);
    sprite.draw(
      this.ctx,
      monster.x,
      monster.y,
      monster.width,
      monster.height
    );
  }

  private renderVertikalByrakrat(monster: Monster, deltaTime: number): void {
    let sprite = this.vertikalByrakratSprites.get(monster);
    if (!sprite) {
      sprite = new VertikalByrakratSprite();
      this.vertikalByrakratSprites.set(monster, sprite);
    }

    if (monster.isDead) {
      if (sprite.isDeathAnimComplete()) return;
      sprite.setAnimation("death");
    } else if (monster.isFrozen) {
      sprite.setAnimation(monster.isBlinking ? "freeze-blink" : "freeze-still");
    } else {
      sprite.setAnimation("walk");
    }

    sprite.update(deltaTime);
    sprite.draw(
      this.ctx,
      monster.x,
      monster.y,
      monster.width,
      monster.height
    );
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
          const pulseIntensity = Math.sin(this.frameTime / 200) * 0.3 + 0.7; // Pulsing effect
          const monsterColor = monster.color || "#ffffff";

          // Draw a pulsating filled rounded rectangle using monster's color
          this.ctx.fillStyle = `${monsterColor}${Math.floor(pulseIntensity * 255)
            .toString(16)
            .padStart(2, "0")}`;

          // Draw rounded rectangle like active monsters
          const radius = 4;
          const x = spawnPoint.x;
          const y = spawnPoint.y;
          const width = monster.width;
          const height = monster.height;

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
          this.ctx.fill();

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

  private renderSpawnIndicators(spawnManager?: OptimizedSpawnManager): void {
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

      pendingSpawns.forEach((spawn) => {
        const timeRemaining = spawnManager.getSpawnTimeRemaining(spawn);
        const secondsRemaining = Math.ceil(timeRemaining / 1000);
        if (timeRemaining > 0 && secondsRemaining <= 3) {
          // Only show in final 3 seconds
          // Create a temporary monster to get its dimensions and color
          const tempMonster = spawn.spawnPoint.createMonster();

          // Use monster's actual color with pulsating effect
          const pulseIntensity = Math.sin(this.frameTime / 200) * 0.3 + 0.7; // Pulsing effect
          const monsterColor = tempMonster.color || "#ffffff";

          // Draw a pulsating filled rounded rectangle using monster's color
          this.ctx.fillStyle = `${monsterColor}${Math.floor(pulseIntensity * 255)
            .toString(16)
            .padStart(2, "0")}`;

          // Draw rounded rectangle like active monsters
          const radius = 4;
          const x = tempMonster.x;
          const y = tempMonster.y;
          const width = tempMonster.width;
          const height = tempMonster.height;

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
          this.ctx.fill();

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
      const elapsed = this.frameTime - text.startTime;
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
