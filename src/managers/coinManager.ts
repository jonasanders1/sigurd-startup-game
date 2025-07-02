import {
  Coin,
  CoinSpawnPoint,
  Monster,
  Platform,
  Ground,
  CoinTypeConfig,
} from "../types/interfaces";
import { CoinType } from "../types/enums";
import { GAME_CONFIG } from "../types/constants";
import { CoinPhysics } from "./coinPhysics";
import { COIN_TYPES, P_COIN_COLORS } from "../config/coinTypes";

export class CoinManager {
  private coins: Coin[] = [];
  private spawnPoints: CoinSpawnPoint[] = [];
  private firebombCount: number = 0;
  private powerModeActive: boolean = false;
  private powerModeEndTime: number = 0;
  private activeEffects: Map<string, { endTime: number; effect: any }> =
    new Map();
  private triggeredSpawnConditions: Set<string> = new Set(); // Track which spawn conditions have been triggered
  private lastProcessedScore: number = 0; // Track the last score threshold that was processed
  private lastScoreCheck: number = 0; // Track the last score we checked
  private bombAndMonsterPoints: number = 0; // Track points from bombs and monsters only (no bonus)
  private monsterKillCount: number = 0; // Track monsters killed in current power mode session
  private pCoinColorIndex: number = 0; // Track current P-coin color index

  constructor(spawnPoints: CoinSpawnPoint[] = []) {
    this.spawnPoints = spawnPoints;
    console.log("🪙 CoinManager initialized");
  }

  reset(): void {
    this.coins = [];
    this.firebombCount = 0;
    this.powerModeActive = false;
    this.powerModeEndTime = 0;
    this.activeEffects.clear();
    this.triggeredSpawnConditions.clear();
    this.lastProcessedScore = 0;
    this.lastScoreCheck = 0;
    this.bombAndMonsterPoints = 0;
    this.monsterKillCount = 0;
    // Don't reset pCoinColorIndex - let it persist across sessions
  }

  update(platforms: Platform[], ground: Ground, gameState?: any): void {
    // Update coin physics based on coin type
    this.coins.forEach((coin) => {
      if (coin.isCollected) return;

      const coinConfig = COIN_TYPES[coin.type];
      if (coinConfig) {
        CoinPhysics.updateCoin(coin, platforms, ground, coinConfig.physics);
      } else {
        // Fallback to legacy behavior
        if (coin.type === CoinType.POWER) {
          CoinPhysics.updatePowerCoin(coin, platforms, ground);
        } else {
          CoinPhysics.updateCoin(coin, platforms, ground);
        }
      }
    });

    // Check if effects should end
    this.checkEffectsEnd(gameState);

    // Remove collected coins
    this.coins = this.coins.filter((coin) => !coin.isCollected);
  }

  spawnCoin(type: CoinType, x: number, y: number, spawnAngle?: number): void {
    const coinConfig = COIN_TYPES[type];

    // Check if a coin of this type already exists and respect maxActive limit
    if (coinConfig?.maxActive) {
      const existingCoins = this.coins.filter(
        (coin) => coin.type === type && !coin.isCollected
      );
      if (existingCoins.length >= coinConfig.maxActive) {
        console.log(
          `🪙 ${type} coin limit reached (${coinConfig.maxActive}), skipping spawn`
        );
        return;
      }
    } else {
      // Legacy behavior - check if any coin of this type exists
      const existingCoin = this.coins.find((coin) => coin.type === type);
      if (existingCoin) {
        console.log(`🪙 ${type} coin already exists, skipping spawn`);
        return;
      }
    }

    let initialVelocity;
    if (type === CoinType.POWER) {
      initialVelocity = CoinPhysics.createPowerCoinVelocity(spawnAngle);
    } else {
      initialVelocity = CoinPhysics.createInitialVelocity();
    }

    const coin: Coin = {
      type,
      x,
      y,
      width: GAME_CONFIG.COIN_SIZE,
      height: GAME_CONFIG.COIN_SIZE,
      velocityX: initialVelocity.velocityX,
      velocityY: initialVelocity.velocityY,
      isCollected: false,
      spawnX: x,
      spawnY: y,
    };

    // Set initial color and spawn time for P-coins
    if (type === CoinType.POWER) {
      coin.colorIndex = 0; // Start with blue (index 0)
      coin.spawnTime = Date.now();
      console.log(`🎨 Spawning P-coin with Blue color (100 points)`);
    }

    this.coins.push(coin);
    console.log(
      `🪙 Spawned ${type} coin at (${x}, ${y}) with angle ${
        spawnAngle || "random"
      }`
    );
  }

  onFirebombCollected(): void {
    this.firebombCount++;
    console.log(`🔥 Firebomb count: ${this.firebombCount}`);

    // Check spawn conditions immediately when firebomb count changes
    this.checkSpawnConditionsOnFirebombChange();
  }

  // Track points from bombs and monsters (excluding bonus points)
  onPointsEarned(points: number, isBonus: boolean = false): void {
    if (!isBonus) {
      this.bombAndMonsterPoints += points;
      console.log(
        `💰 Points earned: ${points}, total bomb/monster points: ${this.bombAndMonsterPoints}`
      );

      // Check for B-coin spawn conditions immediately when points are earned
      this.checkBcoinSpawnConditions();
    }
  }

  // Check B-coin spawn conditions specifically when points are earned
  private checkBcoinSpawnConditions(): void {
    const coinConfig = COIN_TYPES.BONUS_MULTIPLIER;
    if (!coinConfig) return;

    // Check if we've crossed a new threshold
    const currentThreshold =
      Math.floor(
        this.bombAndMonsterPoints / GAME_CONFIG.BONUS_COIN_SPAWN_INTERVAL
      ) * GAME_CONFIG.BONUS_COIN_SPAWN_INTERVAL;
    const lastThreshold =
      Math.floor(this.lastScoreCheck / GAME_CONFIG.BONUS_COIN_SPAWN_INTERVAL) *
      GAME_CONFIG.BONUS_COIN_SPAWN_INTERVAL;

    // If we've crossed a new threshold, spawn a coin
    if (
      currentThreshold > lastThreshold &&
      currentThreshold >= GAME_CONFIG.BONUS_COIN_SPAWN_INTERVAL
    ) {
      const spawnKey = `${coinConfig.type}_${currentThreshold}`;

      // Check if we've already triggered this spawn condition
      if (this.triggeredSpawnConditions.has(spawnKey)) {
        console.log(
          `🪙 B-coin spawn condition already triggered for threshold ${currentThreshold}`
        );
        return;
      }

      console.log(
        `🪙 B-coin threshold crossed: ${lastThreshold} -> ${currentThreshold} (bomb/monster points: ${this.bombAndMonsterPoints})`
      );

      // Mark this spawn condition as triggered
      this.triggeredSpawnConditions.add(spawnKey);

      // Update the last score we checked
      this.lastScoreCheck = this.bombAndMonsterPoints;

      // Find spawn point for this coin type
      const spawnPoints = this.spawnPoints.filter(
        (point) => point.type === coinConfig.type
      );

      if (spawnPoints.length > 0) {
        const spawnPoint =
          spawnPoints[Math.floor(Math.random() * spawnPoints.length)];
        this.spawnCoin(
          coinConfig.type as CoinType,
          spawnPoint.x,
          spawnPoint.y,
          spawnPoint.spawnAngle
        );
      } else {
        // Fallback spawn position - spawn from top for gravity coins
        const spawnX = 400 + (Math.random() - 0.5) * 200;
        const spawnY = 50; // Start from top of screen
        this.spawnCoin(coinConfig.type as CoinType, spawnX, spawnY);
      }
    }
  }

  // Check spawn conditions when firebomb count changes (for firebomb-based spawns)
  private checkSpawnConditionsOnFirebombChange(): void {
    Object.values(COIN_TYPES).forEach((coinConfig) => {
      // Only check spawn conditions that depend on firebomb count (P-coin)
      if (
        coinConfig.spawnCondition &&
        coinConfig.spawnCondition.toString().includes("firebombCount")
      ) {
        const combinedState = {
          firebombCount: this.firebombCount,
        };

        if (coinConfig.spawnCondition(combinedState)) {
          // Create a unique key for this spawn condition
          const spawnKey = `${coinConfig.type}_${this.firebombCount}`;

          // Check if we've already triggered this spawn condition
          if (this.triggeredSpawnConditions.has(spawnKey)) {
            return; // Already triggered this spawn condition
          }

          console.log(
            `🪙 P-coin spawn condition met (firebombCount: ${this.firebombCount}, key: ${spawnKey})`
          );

          // Mark this spawn condition as triggered
          this.triggeredSpawnConditions.add(spawnKey);

          // Find spawn point for this coin type
          const spawnPoints = this.spawnPoints.filter(
            (point) => point.type === coinConfig.type
          );

          if (spawnPoints.length > 0) {
            const spawnPoint =
              spawnPoints[Math.floor(Math.random() * spawnPoints.length)];
            this.spawnCoin(
              coinConfig.type as CoinType,
              spawnPoint.x,
              spawnPoint.y,
              spawnPoint.spawnAngle
            );
          } else {
            // Fallback spawn position for P-coin (random bouncing)
            const spawnX = 400 + (Math.random() - 0.5) * 200;
            const spawnY = 100 + Math.random() * 100;
            this.spawnCoin(coinConfig.type as CoinType, spawnX, spawnY);
          }
        }
      }
    });
  }

  // Check spawn conditions for other types (score-based, time-based, etc.)
  checkSpawnConditions(gameState: any): void {
    Object.values(COIN_TYPES).forEach((coinConfig) => {
      // Skip firebomb-based spawns as they're handled separately
      if (
        coinConfig.spawnCondition &&
        !coinConfig.spawnCondition.toString().includes("firebombCount") &&
        coinConfig.type !== "POWER"
      ) {
        const combinedState = {
          ...gameState,
          firebombCount: this.firebombCount,
        };

        if (coinConfig.spawnCondition(combinedState)) {
          // Create a unique key for this spawn condition based on the current state
          let spawnKey = `${coinConfig.type}`;

          // For score-based spawns, include the score threshold
          if (coinConfig.spawnCondition.toString().includes("score")) {
            if (coinConfig.type === "BONUS_MULTIPLIER") {
              // Use bombAndMonsterPoints instead of total score for B-coin spawning
              const currentThreshold =
                Math.floor(
                  this.bombAndMonsterPoints /
                    GAME_CONFIG.BONUS_COIN_SPAWN_INTERVAL
                ) * GAME_CONFIG.BONUS_COIN_SPAWN_INTERVAL;
              const lastThreshold =
                Math.floor(
                  this.lastScoreCheck / GAME_CONFIG.BONUS_COIN_SPAWN_INTERVAL
                ) * GAME_CONFIG.BONUS_COIN_SPAWN_INTERVAL;

              // If we've crossed a new threshold, spawn a coin
              if (
                currentThreshold > lastThreshold &&
                currentThreshold >= GAME_CONFIG.BONUS_COIN_SPAWN_INTERVAL
              ) {
                spawnKey = `${coinConfig.type}_${currentThreshold}`;
                console.log(
                  `🪙 B-coin threshold crossed: ${lastThreshold} -> ${currentThreshold} (bomb/monster points: ${this.bombAndMonsterPoints})`
                );
              } else {
                return; // Skip this spawn condition
              }

              // Update the last score we checked
              this.lastScoreCheck = this.bombAndMonsterPoints;
            }
          }

          // For bonus multiplier-based spawns (EXTRA_LIFE)
          if (
            coinConfig.spawnCondition
              .toString()
              .includes("totalBonusMultiplierCoinsCollected")
          ) {
            const bonusCount =
              gameState.totalBonusMultiplierCoinsCollected || 0;
            const threshold = Math.floor(bonusCount / 10) * 10;
            spawnKey = `${coinConfig.type}_${threshold}`;
            console.log(
              `🪙 M-coin spawn check: bonusCount=${bonusCount}, threshold=${threshold}`
            );
          }

          // Check if we've already triggered this spawn condition
          if (this.triggeredSpawnConditions.has(spawnKey)) {
            return; // Already triggered this spawn condition
          }

          console.log(
            `🪙 Spawn condition met for ${coinConfig.type} coin (key: ${spawnKey})`
          );

          // Mark this spawn condition as triggered
          this.triggeredSpawnConditions.add(spawnKey);

          // Find spawn point for this coin type
          const spawnPoints = this.spawnPoints.filter(
            (point) => point.type === coinConfig.type
          );

          if (spawnPoints.length > 0) {
            const spawnPoint =
              spawnPoints[Math.floor(Math.random() * spawnPoints.length)];
            this.spawnCoin(
              coinConfig.type as CoinType,
              spawnPoint.x,
              spawnPoint.y,
              spawnPoint.spawnAngle
            );
          } else {
            // Fallback spawn position - spawn from top for gravity coins
            const spawnX = 400 + (Math.random() - 0.5) * 200;
            let spawnY = 50; // Start from top of screen
            // For gravity-only coins, spawn from top
            if (
              coinConfig.physics.hasGravity &&
              !coinConfig.physics.bounces &&
              !coinConfig.physics.reflects
            ) {
              spawnY = 50; // Top of screen
            } else {
              spawnY = 100 + Math.random() * 100; // Random position for other coins
            }
            this.spawnCoin(coinConfig.type as CoinType, spawnX, spawnY);
          }
        }
      }
    });
  }

  collectCoin(coin: Coin, gameState?: any): void {
    coin.isCollected = true;
    console.log(`🪙 Collected ${coin.type} coin`);

    const coinConfig = COIN_TYPES[coin.type];
    if (coinConfig && gameState) {
      // Calculate points earned from this coin
      let pointsEarned = coinConfig.points;

      // Special handling for P-coin - points based on current color
      if (coin.type === CoinType.POWER) {
        const spawnTime = coin.spawnTime || Date.now();
        const colorData = this.getPcoinColorForTime(spawnTime);
        const currentMultiplier = gameState.multiplier || 1;
        pointsEarned = colorData.points * currentMultiplier;

        console.log(
          `🎨 P-coin collected: ${colorData.name} color, ${colorData.points} × ${currentMultiplier} = ${pointsEarned} points`
        );
      }
      // Special handling for B-coin (Bonus Multiplier) - points = 1000 * current multiplier
      else if (coin.type === CoinType.BONUS_MULTIPLIER) {
        const currentMultiplier = gameState.multiplier || 1;
        pointsEarned = 1000 * currentMultiplier;
      }

      // Show floating text for points earned
      if (gameState.addFloatingText) {
        const text = pointsEarned.toString();
        gameState.addFloatingText(
          text,
          coin.x + coin.width / 2,
          coin.y + coin.height / 2,
          1000, // duration
          "#fff",
          15 // fontSize
        );
      }

      // Apply all effects for this coin type
      coinConfig.effects.forEach((effect) => {
        effect.apply(gameState);

        // Track timed effects
        if (effect.duration) {
          this.activeEffects.set(effect.type, {
            endTime: Date.now() + effect.duration,
            effect,
          });
        }
      });
    } else {
      // Legacy behavior
      if (coin.type === CoinType.POWER) {
        this.activatePowerMode();
      }
    }
  }

  private checkEffectsEnd(gameState?: any): void {
    const currentTime = Date.now();
    const effectsToRemove: string[] = [];

    this.activeEffects.forEach((effectData, effectType) => {
      if (currentTime >= effectData.endTime) {
        effectsToRemove.push(effectType);
        if (effectData.effect.remove && gameState) {
          effectData.effect.remove(gameState);
        }
      }
    });

    effectsToRemove.forEach((effectType) => {
      this.activeEffects.delete(effectType);
    });

    // Legacy power mode check
    if (this.powerModeActive && Date.now() >= this.powerModeEndTime) {
      this.powerModeActive = false;
      console.log("⚡ Power mode deactivated");
    }
  }

  // Calculate monster kill points based on kill count progression
  calculateMonsterKillPoints(multiplier: number): number {
    this.monsterKillCount++;

    // Progressive monster kill bonus system
    let basePoints: number;
    switch (this.monsterKillCount) {
      case 1:
        basePoints = 100;
        break;
      case 2:
        basePoints = 200;
        break;
      case 3:
        basePoints = 300;
        break;
      case 4:
        basePoints = 500;
        break;
      case 5:
        basePoints = 800;
        break;
      case 6:
        basePoints = 1200;
        break;
      case 7:
        basePoints = 1700;
        break;
      case 8:
        basePoints = 2300;
        break;
      case 9:
        basePoints = 3000;
        break;
      case 10:
        basePoints = 4000;
        break;
      default:
        // For kills beyond 10, add 1000 per additional kill
        basePoints = 4000 + (this.monsterKillCount - 10) * 1000;
    }

    const totalPoints = basePoints * multiplier;
    console.log(
      `💀 Monster kill #${this.monsterKillCount}: ${basePoints} × ${multiplier} = ${totalPoints} points`
    );

    return totalPoints;
  }

  // Calculate current P-coin color based on time elapsed
  getPcoinColorForTime(spawnTime: number): {
    color: string;
    points: number;
    name: string;
    index: number;
  } {
    const now = Date.now();
    const elapsed = now - spawnTime;
    const colorChangeInterval = 1000; // Change color every 2 seconds
    const colorIndex =
      Math.floor(elapsed / colorChangeInterval) % P_COIN_COLORS.length;
    const colorData = P_COIN_COLORS[colorIndex];
    return { ...colorData, index: colorIndex };
  }

  // Get current P-coin color and points (legacy method)
  getCurrentPcoinColor(): { color: string; points: number; name: string } {
    const colorData = P_COIN_COLORS[this.pCoinColorIndex];
    return colorData;
  }

  // Get current color for a specific P-coin
  getPcoinCurrentColor(coin: Coin): string {
    if (coin.type === CoinType.POWER && coin.spawnTime !== undefined) {
      const colorData = this.getPcoinColorForTime(coin.spawnTime);
      return colorData.color;
    }
    return P_COIN_COLORS[0].color; // Default to blue
  }

  // Advance P-coin color to next in sequence (legacy method)
  advancePcoinColor(): void {
    this.pCoinColorIndex = (this.pCoinColorIndex + 1) % P_COIN_COLORS.length;
    const newColor = this.getCurrentPcoinColor();
    console.log(
      `🎨 P-coin color advanced to: ${newColor.name} (${newColor.points} points)`
    );
  }

  // Reset monster kill count when power mode starts
  resetMonsterKillCount(): void {
    this.monsterKillCount = 0;
    console.log("🔄 Monster kill count reset for new power mode session");
  }

  // Legacy methods for backward compatibility
  private activatePowerMode(): void {
    this.powerModeActive = true;
    this.powerModeEndTime = Date.now() + GAME_CONFIG.POWER_COIN_DURATION;
    this.resetMonsterKillCount(); // Reset kill count when power mode starts
    console.log(
      `⚡ Power mode activated for ${GAME_CONFIG.POWER_COIN_DURATION}ms`
    );
  }

  isPowerModeActive(): boolean {
    return this.powerModeActive;
  }

  getCoins(): Coin[] {
    return this.coins.filter((coin) => !coin.isCollected);
  }

  getAllCoins(): Coin[] {
    return [...this.coins];
  }

  getFirebombCount(): number {
    return this.firebombCount;
  }

  getBombAndMonsterPoints(): number {
    return this.bombAndMonsterPoints;
  }

  updateMonsters(monsters: Monster[]): void {
    const currentTime = Date.now();
    const timeLeft = this.powerModeEndTime - currentTime;
    const shouldBlink = timeLeft <= 2000 && timeLeft > 0; // Blink when 2 seconds or less remaining
    
    monsters.forEach((monster) => {
      monster.isFrozen = this.powerModeActive;
      monster.isBlinking = this.powerModeActive && shouldBlink;
    });
  }

  unfreezeAllMonsters(monsters: Monster[]): void {
    monsters.forEach((monster) => {
      monster.isFrozen = false;
      monster.isBlinking = false;
    });
  }

  resetEffects(): void {
    this.powerModeActive = false;
    this.powerModeEndTime = 0;
    this.firebombCount = 0;
    this.coins = [];
    this.activeEffects.clear();
    this.bombAndMonsterPoints = 0;
    console.log("🪙 Coin effects reset");
  }

  // New method to get coin configuration
  getCoinConfig(type: string): CoinTypeConfig | undefined {
    return COIN_TYPES[type];
  }

  // New method to check if an effect is active
  isEffectActive(effectType: string): boolean {
    return this.activeEffects.has(effectType);
  }
}
