import { Coin, CoinSpawnPoint, Monster, Platform, Ground } from '../types/interfaces';
import { CoinType } from '../types/enums';
import { GAME_CONFIG } from '../types/constants';
import { CoinPhysics } from './coinPhysics';

export class CoinManager {
  private coins: Coin[] = [];
  private spawnPoints: CoinSpawnPoint[] = [];
  private firebombCount: number = 0;
  private powerModeActive: boolean = false;
  private powerModeEndTime: number = 0;

  constructor(spawnPoints: CoinSpawnPoint[] = []) {
    this.spawnPoints = spawnPoints;
    console.log('🪙 CoinManager initialized');
  }

  reset(): void {
    this.coins = [];
    this.firebombCount = 0;
    this.powerModeActive = false;
    this.powerModeEndTime = 0;
  }

  update(platforms: Platform[], ground: Ground): void {
    // Update coin physics based on coin type
    this.coins.forEach(coin => {
      if (coin.isCollected) return;
      
      if (coin.type === CoinType.POWER) {
        // Debug: Log power coin state before update
        const beforeX = coin.x;
        const beforeY = coin.y;
        const beforeVX = coin.velocityX;
        const beforeVY = coin.velocityY;
        
        CoinPhysics.updatePowerCoin(coin, platforms, ground);
        
        // Debug: Log power coin state after update
        
      } else {
        CoinPhysics.updateCoin(coin, platforms, ground);
      }
    });

    // Check if power mode should end
    this.checkPowerModeEnd();

    // Remove collected coins
    this.coins = this.coins.filter(coin => !coin.isCollected);
  }

  spawnCoin(type: CoinType, x: number, y: number, spawnAngle?: number): void {
    // Check if a coin of this type already exists
    const existingCoin = this.coins.find(coin => coin.type === type);
    if (existingCoin) {
      console.log(`🪙 ${type} coin already exists, skipping spawn`);
      return;
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
      spawnY: y
    };

    this.coins.push(coin);
    console.log(`🪙 Spawned ${type} coin at (${x}, ${y}) with angle ${spawnAngle || 'random'}`);
  }

  onFirebombCollected(): void {
    this.firebombCount++;
    console.log(`🔥 Firebomb count: ${this.firebombCount}`);

    // Check if it's time to spawn a Power coin
    if (this.firebombCount % GAME_CONFIG.POWER_COIN_SPAWN_INTERVAL === 0) {
      this.spawnPowerCoin();
    }
  }

  private spawnPowerCoin(): void {
    // Use spawn points if available, otherwise fallback to fixed position
    const powerCoinSpawnPoints = this.spawnPoints.filter(point => point.type === CoinType.POWER);
    
    if (powerCoinSpawnPoints.length > 0) {
      // Pick a random spawn point
      const spawnPoint = powerCoinSpawnPoints[Math.floor(Math.random() * powerCoinSpawnPoints.length)];
      this.spawnCoin(CoinType.POWER, spawnPoint.x, spawnPoint.y, spawnPoint.spawnAngle);
    } else {
      // Fallback: spawn at a fixed position with random angle
      const spawnX = 400; // Center of screen
      const spawnY = 100; // Above ground
      this.spawnCoin(CoinType.POWER, spawnX, spawnY);
    }
  }

  collectCoin(coin: Coin): void {
    coin.isCollected = true;
    console.log(`🪙 Collected ${coin.type} coin`);

    if (coin.type === CoinType.POWER) {
      this.activatePowerMode();
    }
  }

  private activatePowerMode(): void {
    this.powerModeActive = true;
    this.powerModeEndTime = Date.now() + GAME_CONFIG.POWER_COIN_DURATION;
    console.log(`⚡ Power mode activated for ${GAME_CONFIG.POWER_COIN_DURATION}ms`);
  }

  private checkPowerModeEnd(): void {
    if (this.powerModeActive && Date.now() >= this.powerModeEndTime) {
      this.powerModeActive = false;
      console.log('⚡ Power mode deactivated');
    }
  }

  isPowerModeActive(): boolean {
    return this.powerModeActive;
  }

  getCoins(): Coin[] {
    return this.coins.filter(coin => !coin.isCollected);
  }

  // Get all coins including collected ones (for debugging)
  getAllCoins(): Coin[] {
    return [...this.coins];
  }

  getFirebombCount(): number {
    return this.firebombCount;
  }

  // Method to freeze/unfreeze monsters based on power mode
  updateMonsters(monsters: Monster[]): void {
    monsters.forEach(monster => {
      monster.isFrozen = this.powerModeActive;
    });
  }

  // Method to unfreeze all monsters (called when power mode ends)
  unfreezeAllMonsters(monsters: Monster[]): void {
    monsters.forEach(monster => {
      monster.isFrozen = false;
    });
  }

  // Method to reset effects when map is completed
  resetEffects(): void {
    this.powerModeActive = false;
    this.powerModeEndTime = 0;
    this.firebombCount = 0;
    this.coins = [];
    console.log('🪙 Coin effects reset');
  }

  // Method to check if a coin type already exists
  private hasActiveCoinOfType(coinType: string): boolean {
    return this.coins.some(coin => coin.type === coinType && !coin.isCollected);
  }
} 