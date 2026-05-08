import {
  Player,
  Monster,
  Bomb,
  Platform,
  Coin,
  FloatingText,
  MapDefinition,
} from "../types/interfaces";
import { COLORS, DEV_CONFIG } from "../types/constants";
import { HITBOX_VISUAL_CORNER_RADIUS } from "../config/entities";
import { SHOW_HITBOXES, SHOW_SPAWN_INDICATORS } from "../config/dev";
import { playerSprite, setPlayerSkin, getPlayerHitboxRect, PLAYER_HITBOX } from "../entities/Player";
import { tailwindSprite } from "../entities/TailwindSprite";
import { useCoinStore } from "../stores/entities/coinStore";
import { bombSprite, BombSpriteInstance } from "../entities/Bomb";
import { ByrakratSprite, dirName } from "../entities/Byrakrat";
import {
  getBoundsForFrame,
  applyBoundsToMonster,
  getNaturalAnchor,
  getMonsterHitboxRect,
  MONSTER_HITBOXES,
} from "../config/monsterBounds";
import { VertikalByrakratSprite } from "../entities/VertikalByrakrat";
import { UfoSprite } from "../entities/UfoSprite";
import {
  FloaterSprite,
  createBirdSprite,
  createHornSprite,
  createOrbSprite,
  createSphereSprite,
} from "../entities/FloaterSprite";
import { GAME_CONFIG } from "../types/constants";
import { COIN_TYPES, P_COIN_COLORS } from "../config/coinTypes";
import {
  getPlatformTileSet,
  DEFAULT_PLATFORM_THEME,
  layoutPlatformTiles,
} from "../config/platformTiles";
import {
  getFloorImage,
  FLOOR_TILE_WIDTH,
  FLOOR_TILE_HEIGHT,
} from "../config/floor";
import {
  PLATFORM_CHAMFER_SIZE,
  PLATFORM_CHAMFER_INSET,
  PLATFORM_CHAMFER_INNER_SIZE,
  PLATFORM_CHAMFER_INNER_INSET,
} from "../config/platformColors";
import type { RoundedCorners } from "../types/interfaces";
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

/**
 * Pixel-perfect chamfered rect fill. Each enabled corner removes a 45°
 * triangle of `R` pixels using `insetTable` (must have R entries).
 *
 * Two-pass usage: call once with the full rect + outer R/table in
 * borderColor, then again with rect inset 1 px on each side + inner R/table
 * in fill color. Result: 1-px border on every edge including the diagonal.
 */
function fillChamferedShape(
  ctx: CanvasRenderingContext2D,
  color: string,
  x: number,
  y: number,
  w: number,
  h: number,
  R: number,
  insetTable: readonly number[],
  rc: RoundedCorners
): void {
  if (w <= 0 || h <= 0) return;
  ctx.fillStyle = color;
  if (h > 2 * R) {
    ctx.fillRect(x, y + R, w, h - 2 * R);
  }
  const topRows = Math.min(R, h);
  for (let i = 0; i < topRows; i++) {
    const lIn = rc.tl ? insetTable[i] : 0;
    const rIn = rc.tr ? insetTable[i] : 0;
    const rowW = w - lIn - rIn;
    if (rowW > 0) ctx.fillRect(x + lIn, y + i, rowW, 1);
  }
  const bottomRows = Math.min(R, h - R);
  for (let i = 0; i < bottomRows; i++) {
    const lIn = rc.bl ? insetTable[i] : 0;
    const rIn = rc.br ? insetTable[i] : 0;
    const rowW = w - lIn - rIn;
    if (rowW > 0) ctx.fillRect(x + lIn, y + h - 1 - i, rowW, 1);
  }
}

export class RenderManager {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private lastTime: number = 0;
  private backgroundManager: BackgroundManager;
  private bombSprites: Map<number, BombSpriteInstance> = new Map();
  private byrakratSprites: WeakMap<Monster, ByrakratSprite> = new WeakMap();
  private vertikalByrakratSprites: WeakMap<Monster, VertikalByrakratSprite> = new WeakMap();
  private ufoSprites: WeakMap<Monster, UfoSprite> = new WeakMap();
  private birdSprites: WeakMap<Monster, FloaterSprite> = new WeakMap();
  private hornSprites: WeakMap<Monster, FloaterSprite> = new WeakMap();
  private orbSprites: WeakMap<Monster, FloaterSprite> = new WeakMap();
  private sphereSprites: WeakMap<Monster, FloaterSprite> = new WeakMap();
  private currentSpawnManager: OptimizedSpawnManager | null = null;
  private currentGameState: GameStateSnapshot | null = null;
  private frameTime: number = 0; // Cached Date.now() for current frame

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

    // Decorative striped floor tile (visual only; canvas bottom is still the
    // player's effective ground). Sits between background and platforms so
    // bombs and coins resting near the floor visually rest on top of it.
    if (currentMap?.floor) {
      this.renderFloor(currentMap.floor);
    }

    this.renderPlatforms(platforms);
    this.renderBombs(bombs);
    this.renderCoins(coins, coinManager);
    this.renderMonsters(monsters, deltaTime, player);
    this.renderPlayer(player);
    this.renderFloatingTexts(floatingTexts, deltaTime);

    if (SHOW_HITBOXES) {
      this.renderHitboxes(player, platforms, bombs, monsters, coins);
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

  private strokeRoundedRect(color: string, x: number, y: number, w: number, h: number, radius: number): void {
    this.ctx.strokeStyle = color;
    this.ctx.beginPath();
    this.ctx.roundRect(Math.round(x) + 0.5, Math.round(y) + 0.5, w, h, radius);
    this.ctx.stroke();
  }

  private renderHitboxes(
    player: Player,
    platforms: Platform[],
    bombs: Bomb[],
    monsters: Monster[],
    coins: Coin[]
  ): void {
    const ctx = this.ctx;
    const prevSmoothing = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    ctx.lineWidth = 1;

    platforms.forEach((p) => this.strokeRect("#00BFFF", p.x, p.y, p.width, p.height));
    bombs.forEach((b) => {
      if (!b.isCollected) this.strokeEllipse("#FF3030", b.x, b.y, b.width, b.height);
    });
    coins.forEach((c) => {
      if (!c.isCollected) this.strokeRect("#FFD700", c.x, c.y, c.width, c.height);
    });

    // Bounds (physics envelope) drawn as plain rects in magenta/green.
    // Lethal hitboxes drawn rounded-rect by default (or ellipse when the
    // hitbox config opts into shape: "ellipse") in cyan/yellow.
    const drawHitbox = (
      color: string,
      shape: "rect" | "ellipse" | undefined,
      r: { x: number; y: number; width: number; height: number },
    ) => {
      if (shape === "ellipse") {
        this.strokeEllipse(color, r.x, r.y, r.width, r.height);
      } else {
        this.strokeRoundedRect(color, r.x, r.y, r.width, r.height, HITBOX_VISUAL_CORNER_RADIUS);
      }
    };
    monsters.forEach((m) => {
      this.strokeRect("#FF66FF", m.x, m.y, m.width, m.height);
      drawHitbox(
        "#00FFFF",
        MONSTER_HITBOXES[m.type as MonsterType]?.shape,
        getMonsterHitboxRect(m, m.type),
      );
    });
    this.strokeRect("#00FF00", player.x, player.y, player.width, player.height);
    drawHitbox("#FFFF00", PLAYER_HITBOX.shape, getPlayerHitboxRect(player));

    ctx.imageSmoothingEnabled = prevSmoothing;
  }

  private renderBackground(): void {
    this.backgroundManager.render(this.ctx);
  }

  private renderFloor(variant: import("../config/floor").FloorVariant): void {
    const img = getFloorImage(variant);
    if (!img.complete || img.naturalWidth === 0) return;
    const ctx = this.ctx;
    const prevSmoothing = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    // Top-crop the 32×64 source to 32×FLOOR_TILE_HEIGHT (preserves the
    // diagonal cap; trims the plain-color bottom).
    const y = this.canvas.height - FLOOR_TILE_HEIGHT;
    const tilesAcross = Math.ceil(this.canvas.width / FLOOR_TILE_WIDTH);
    for (let i = 0; i < tilesAcross; i++) {
      ctx.drawImage(
        img,
        0, 0, FLOOR_TILE_WIDTH, FLOOR_TILE_HEIGHT,
        i * FLOOR_TILE_WIDTH, y, FLOOR_TILE_WIDTH, FLOOR_TILE_HEIGHT
      );
    }
    ctx.imageSmoothingEnabled = prevSmoothing;
  }

  private renderPlayer(player: Player): void {
    if (playerSprite && GAME_CONFIG.USE_SPRITES) {
      // Swap to the SigurdPower skin while a P-coin power mode is active.
      // setPlayerSkin is a no-op when the skin hasn't changed.
      const powerActive = useCoinStore.getState().activeEffects.powerMode;
      setPlayerSkin(powerActive ? "power" : "default");

      // Feet-anchored on the bounds bottom-center.
      const feetX = player.x + player.width / 2;
      const feetY = player.y + player.height;
      playerSprite.draw(this.ctx, feetX, feetY);
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
      // No tileTheme → solid color rect (the new default look). Tiles are
      // still supported via Platform.tileTheme; opt in per platform.
      if (!platform.tileTheme) {
        const rc = platform.roundedCorners;
        const hasRounded = rc?.tl || rc?.tr || rc?.bl || rc?.br;
        ctx.fillStyle = platform.color || "#888888";

        if (!hasRounded) {
          ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
          if (platform.borderColor) {
            ctx.strokeStyle = platform.borderColor;
            ctx.lineWidth = 1;
            ctx.strokeRect(
              platform.x + 0.5,
              platform.y + 0.5,
              platform.width - 1,
              platform.height - 1
            );
          }
          return;
        }

        // Chamfered (45° cut) corners — pixel-perfect, no anti-aliasing.
        // With borderColor: two-pass fill (outer chamfer in border, inner
        // chamfer in platform color). Without: single-pass platform fill.
        if (platform.borderColor) {
          fillChamferedShape(
            ctx,
            platform.borderColor,
            platform.x,
            platform.y,
            platform.width,
            platform.height,
            PLATFORM_CHAMFER_SIZE,
            PLATFORM_CHAMFER_INSET,
            rc!
          );
          fillChamferedShape(
            ctx,
            platform.color || "#888888",
            platform.x + 1,
            platform.y + 1,
            platform.width - 2,
            platform.height - 2,
            PLATFORM_CHAMFER_INNER_SIZE,
            PLATFORM_CHAMFER_INNER_INSET,
            rc!
          );
        } else {
          fillChamferedShape(
            ctx,
            platform.color || "#888888",
            platform.x,
            platform.y,
            platform.width,
            platform.height,
            PLATFORM_CHAMFER_SIZE,
            PLATFORM_CHAMFER_INSET,
            rc!
          );
        }
        return;
      }

      const tiles = getPlatformTileSet(platform.tileTheme);
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
      let coinSymbol = "?";
      if (coin.type === "POWER") coinSymbol = "P";
      else if (coin.type === "BONUS_MULTIPLIER") coinSymbol = "B";
      else if (coin.type === "EXTRA_LIFE") coinSymbol = "M";
      else if (coin.type === "FOUNDER_MODE") coinSymbol = "F";

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

    // P-coin power-mode visual override: every active monster renders as the
    // shared Tailwind chip-bag instead of its normal sprite. Underlying
    // monster logic (movement, collision, etc.) is unaffected.
    const powerActive = useCoinStore.getState().activeEffects.powerMode;
    if (powerActive) tailwindSprite.update(deltaTime);

    monsters.forEach((monster, index) => {
      if (powerActive) {
        // During power mode: live monsters render as the tailwind chip-bag,
        // killed monsters render nothing (no death/transition fall-through —
        // collected enemies should disappear immediately).
        if (!monster.isActive) return;
        if (monster.type === MonsterType.MUMMY) {
          const { x: feetX, y: feetY } = getNaturalAnchor(monster, "feet");
          tailwindSprite.draw(this.ctx, feetX, feetY, "feet");
        } else {
          tailwindSprite.draw(
            this.ctx,
            monster.x + monster.width / 2,
            monster.y + monster.height / 2,
            "center",
          );
        }
        return;
      }

      // Byråkrat-klonen handles its own activity check so dead mummies can
      // render through the transition animation before disappearing.
      if (monster.type === MonsterType.MUMMY) {
        this.renderByrakrat(monster);
        return;
      }

      // Other monster types have no death/transition animation — once
      // killed (isActive=false), they render nothing.
      if (!monster.isActive) return;

      if (monster.type === MonsterType.UFO) {
        this.renderUfo(monster, deltaTime);
        return;
      }

      if (monster.type === MonsterType.BIRD) {
        this.renderBird(monster, deltaTime);
        return;
      }

      if (monster.type === MonsterType.HORN) {
        this.renderHorn(monster, deltaTime);
        return;
      }

      if (monster.type === MonsterType.ORB) {
        this.renderOrb(monster, deltaTime);
        return;
      }

      if (monster.type === MonsterType.SPHERE) {
        this.renderSphere(monster, deltaTime);
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

    if (SHOW_SPAWN_INDICATORS) {
      this.renderRespawnIndicators(monsters);
      this.renderSpawnIndicators(this.currentSpawnManager);
    }
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
      sprite = new ByrakratSprite();
      this.byrakratSprites.set(monster, sprite);
    }

    const dir = dirName(monster.direction);
    // Transition animation is reserved for ground-impact transformation
    // (isTransitioning). isDead alone — i.e. killed by P-coin / collected
    // chip-bag — should disappear silently; renderByrakrat skips on !isActive.
    if (monster.isTransitioning) {
      sprite.setAnimation(`transition-${dir}`);
    } else if (monster.isFalling) {
      sprite.setAnimation(`fall-${dir}`);
    } else if (idleOnly) {
      sprite.setAnimation(`idle-${dir}`);
    } else if (monster.direction < 0) {
      sprite.setAnimation("walk-left");
    } else if (monster.direction > 0) {
      sprite.setAnimation("walk-right");
    } else {
      sprite.setAnimation("idle-front");
    }

    // Pause animation in place while frozen — no Tailwind sheet anymore.
    if (!monster.isFrozen) {
      sprite.update(deltaTime);
    }

    if (!monster.isDead && !monster.isTransitioning) {
      const hitbox = getBoundsForFrame(
        monster.type,
        sprite.getAnimation(),
        sprite.getFrame()
      );
      applyBoundsToMonster(monster, hitbox, "feet");
    }
  }

  private renderByrakrat(monster: Monster): void {
    const sprite = this.byrakratSprites.get(monster);
    if (!sprite) return;
    // Killed mummies disappear immediately. Ground-impact transformation
    // still keeps isActive=true throughout the transition; isActive only
    // flips false after transformMummyOnGround runs (for NONE target),
    // which is after the transition anim has played out.
    if (!monster.isActive) return;

    // Asset has ~3px of transparent padding at the bottom of the sprite cell.
    // Push the feet anchor down so the visible feet sit flush with the
    // platform top; padding pixels fall behind the platform and are hidden.
    const FOOT_PADDING = 3;
    const { x: feetX, y: feetY } = getNaturalAnchor(monster, "feet");
    sprite.draw(this.ctx, feetX, feetY + FOOT_PADDING);
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
      if (monster.type === MonsterType.MUMMY) {
        this.updateByrakratState(monster, deltaTime, idleOnly);
      }
      // UFO no longer needs a pre-collision hitbox pass — its rect is uniform
      // across animation frames now (no more rotated attack hitbox).
    }
  }

  /**
   * Advance one airborne monster's animation state. Picks float vs bump
   * based on the bump-tracking fields on Monster, and clears the bump fields
   * once the bump animation completes so the next frame reverts to float.
   */
  private updateFloater(
    sprite: FloaterSprite,
    monster: Monster,
    deltaTime: number,
  ): void {
    const dirSign = monster.bumpAxis
      ? monster.bumpDirection ?? 1
      : (monster.velocityX ?? 0) !== 0
        ? Math.sign(monster.velocityX ?? 0)
        : monster.direction || 1;
    const dir: "left" | "right" = dirSign < 0 ? "left" : "right";

    if (monster.bumpAxis) {
      sprite.setAnimation(`bump-${monster.bumpAxis}-${dir}`);
      if (sprite.isBumpComplete()) {
        monster.bumpAxis = undefined;
        monster.bumpDirection = undefined;
        monster.bumpedAt = undefined;
        sprite.setAnimation(`float-${dir}`);
      }
    } else {
      sprite.setAnimation(`float-${dir}`);
    }

    if (!monster.isFrozen) sprite.update(deltaTime);
  }

  private renderUfo(monster: Monster, deltaTime: number): void {
    let sprite = this.ufoSprites.get(monster);
    if (!sprite) {
      sprite = new UfoSprite();
      this.ufoSprites.set(monster, sprite);
    }

    const dirSign = (monster.velocityX ?? 0) !== 0
      ? Math.sign(monster.velocityX ?? 0)
      : monster.direction || 1;
    const dir: "left" | "right" = dirSign < 0 ? "left" : "right";

    if (monster.behaviorState === "ambushing") {
      sprite.setAnimation(`charge-${dir}`);
    } else {
      sprite.setAnimation(`float-${dir}`);
    }

    if (!monster.isFrozen) sprite.update(deltaTime);
    sprite.draw(this.ctx, monster.x + monster.width / 2, monster.y + monster.height / 2);
  }

  private renderBird(monster: Monster, deltaTime: number): void {
    let sprite = this.birdSprites.get(monster);
    if (!sprite) {
      sprite = createBirdSprite();
      this.birdSprites.set(monster, sprite);
    }

    // Bird uses ChaserMovement (hop-and-pause) which doesn't drive velocityX.
    // Direction comes from the active hop target's horizontal delta; when at
    // rest between hops we keep the last facing on monster.direction.
    const m = monster as Monster & { hopTargetX?: number };
    if (m.hopTargetX !== undefined) {
      const hopDx = m.hopTargetX - monster.x;
      if (Math.abs(hopDx) >= 1) {
        monster.direction = hopDx < 0 ? -1 : 1;
      }
    }
    const dir: "left" | "right" = monster.direction < 0 ? "left" : "right";

    if (monster.bumpAxis) {
      sprite.setAnimation(`bump-${monster.bumpAxis}-${dir}`);
      if (sprite.isBumpComplete()) {
        monster.bumpAxis = undefined;
        monster.bumpDirection = undefined;
        monster.bumpedAt = undefined;
        sprite.setAnimation(`float-${dir}`);
      }
    } else {
      sprite.setAnimation(`float-${dir}`);
    }
    if (!monster.isFrozen) sprite.update(deltaTime);
    sprite.draw(this.ctx, monster.x + monster.width / 2, monster.y + monster.height / 2);
  }

  private renderHorn(monster: Monster, deltaTime: number): void {
    let sprite = this.hornSprites.get(monster);
    if (!sprite) {
      sprite = createHornSprite();
      this.hornSprites.set(monster, sprite);
    }
    this.updateFloater(sprite, monster, deltaTime);
    sprite.draw(this.ctx, monster.x + monster.width / 2, monster.y + monster.height / 2);
  }

  private renderOrb(monster: Monster, deltaTime: number): void {
    let sprite = this.orbSprites.get(monster);
    if (!sprite) {
      sprite = createOrbSprite();
      this.orbSprites.set(monster, sprite);
    }
    this.updateFloater(sprite, monster, deltaTime);
    sprite.draw(this.ctx, monster.x + monster.width / 2, monster.y + monster.height / 2);
  }

  private renderSphere(monster: Monster, deltaTime: number): void {
    let sprite = this.sphereSprites.get(monster);
    if (!sprite) {
      sprite = createSphereSprite();
      this.sphereSprites.set(monster, sprite);
    }
    this.updateFloater(sprite, monster, deltaTime);
    sprite.draw(this.ctx, monster.x + monster.width / 2, monster.y + monster.height / 2);
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
    // Mirror renderSpawnIndicators: hide the countdown outside PLAYING so
    // pause/menu/bonus screens don't show a ticking "3" over a frozen scene.
    if (
      !this.currentGameState ||
      this.currentGameState.currentState !== "PLAYING"
    ) {
      return;
    }

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
      // Pixuf — pixel-grid display face for in-game score pop-ups.
      // JetBrains Mono is the fallback while the font is still loading or
      // if Pixuf fails to register in the shadow DOM.
      this.ctx.font = `${text.fontSize}px "Pixuf", "JetBrains Mono", monospace`;
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
