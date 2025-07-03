import { BaseEntity } from '../entities/BaseEntity';
import { PlayerEntity } from '../entities/PlayerEntity';
import { MonsterEntity } from '../entities/MonsterEntity';
import { CoinEntity } from '../entities/CoinEntity';
import { BombEntity } from '../entities/BombEntity';
import { Platform, Ground } from '../types/interfaces';

export class EntityManager {
  private player: PlayerEntity | null = null;
  private monsters: MonsterEntity[] = [];
  private coins: CoinEntity[] = [];
  private bombs: BombEntity[] = [];
  private platforms: Platform[] = [];
  private ground: Ground | null = null;

  // Get all entities for rendering/physics
  getEntities(): BaseEntity[] {
    const entities: BaseEntity[] = [];
    
    if (this.player) entities.push(this.player);
    entities.push(...this.monsters.filter(m => m.isActive));
    entities.push(...this.coins.filter(c => c.isActive));
    entities.push(...this.bombs.filter(b => b.isActive));
    
    return entities;
  }

  // Entity getters
  getPlayer(): PlayerEntity | null {
    return this.player;
  }

  getMonsters(): MonsterEntity[] {
    return this.monsters;
  }

  getCoins(): CoinEntity[] {
    return this.coins;
  }

  getBombs(): BombEntity[] {
    return this.bombs;
  }

  getPlatforms(): Platform[] {
    return this.platforms;
  }

  getGround(): Ground | null {
    return this.ground;
  }

  // Entity setters
  setPlayer(player: PlayerEntity): void {
    this.player = player;
  }

  addMonster(monster: MonsterEntity): void {
    this.monsters.push(monster);
  }

  addCoin(coin: CoinEntity): void {
    this.coins.push(coin);
  }

  addBomb(bomb: BombEntity): void {
    this.bombs.push(bomb);
  }

  setPlatforms(platforms: Platform[]): void {
    this.platforms = platforms;
  }

  setGround(ground: Ground): void {
    this.ground = ground;
  }

  // Entity management
  removeInactiveEntities(): void {
    this.monsters = this.monsters.filter(m => m.isActive);
    this.coins = this.coins.filter(c => c.isActive && !c.isCollected);
    this.bombs = this.bombs.filter(b => b.isActive);
  }

  // Update all entities
  update(deltaTime: number): void {
    if (this.player) {
      this.player.update(deltaTime);
    }

    this.monsters.forEach(monster => {
      if (monster.isActive) {
        monster.update(deltaTime);
      }
    });

    this.coins.forEach(coin => {
      if (coin.isActive && !coin.isCollected) {
        coin.update(deltaTime);
      }
    });

    this.bombs.forEach(bomb => {
      if (bomb.isActive) {
        bomb.update(deltaTime);
      }
    });

    // Clean up inactive entities periodically
    this.removeInactiveEntities();
  }

  // Clear all entities
  clear(): void {
    this.player = null;
    this.monsters = [];
    this.coins = [];
    this.bombs = [];
    this.platforms = [];
    this.ground = null;
  }

  // Load entities from map data
  loadFromMap(mapData: any): void {
    this.clear();

    // Create player
    if (mapData.playerStartX && mapData.playerStartY) {
      this.player = new PlayerEntity({
        x: mapData.playerStartX,
        y: mapData.playerStartY,
        width: 0, // Will use defaults from PlayerEntity
        height: 0, // Will use defaults from PlayerEntity
      });
    }

    // Create monsters
    if (mapData.monsters) {
      mapData.monsters.forEach((monsterData: any) => {
        const monster = new MonsterEntity({
          x: monsterData.x,
          y: monsterData.y,
          width: monsterData.width,
          height: monsterData.height,
          type: monsterData.type,
          patrolStartX: monsterData.patrolStartX,
          patrolEndX: monsterData.patrolEndX,
          speed: monsterData.speed,
          direction: monsterData.direction,
        });
        this.addMonster(monster);
      });
    }

    // Create bombs
    if (mapData.bombs) {
      mapData.bombs.forEach((bombData: any) => {
        const bomb = new BombEntity({
          x: bombData.x,
          y: bombData.y,
          width: bombData.width,
          height: bombData.height,
          order: bombData.order,
          group: bombData.group,
        });
        this.addBomb(bomb);
      });
    }

    // Set platforms and ground
    if (mapData.platforms) {
      this.setPlatforms(mapData.platforms);
    }

    if (mapData.ground) {
      this.setGround(mapData.ground);
    }
  }
}