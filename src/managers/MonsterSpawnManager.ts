import { Monster, MonsterSpawnPoint } from '../types/interfaces';
import { MonsterType } from '../types/enums';
import { GAME_CONFIG, COLORS } from '../types/constants';
import { logger } from '../lib/logger';
import { useGameStore } from '../stores/gameStore';
import { MonsterBehaviorManager } from './MonsterBehaviorManager';

export class MonsterSpawnManager {
  private levelStartTime: number = 0;
  private spawnPoints: MonsterSpawnPoint[] = [];
  private spawnedMonsters: Set<string> = new Set(); // Track which spawn points have been used
  private behaviorManager: MonsterBehaviorManager;
  
  // Monster wave system
  private currentWave: number = 0;
  private waveStartTime: number = 0;
  private maxMonstersOnScreen: number = 8; // Maximum monsters allowed at once
  private minMonstersForNewWave: number = 3; // Minimum monsters before spawning new ones
  private waveCooldown: number = 5000; // 5 seconds between waves
  private lastWaveTime: number = 0;

  constructor(spawnPoints: MonsterSpawnPoint[] = []) {
    this.spawnPoints = spawnPoints;
    this.levelStartTime = Date.now();
    this.behaviorManager = new MonsterBehaviorManager();
  }

  public initializeLevel(spawnPoints: MonsterSpawnPoint[]): void {
    this.spawnPoints = spawnPoints;
    this.levelStartTime = Date.now();
    this.spawnedMonsters.clear();
    
    logger.info(`Initialized monster spawn manager with ${spawnPoints.length} spawn points`);
  }

  public update(currentTime: number): void {
    const gameState = useGameStore.getState();
    const timeElapsed = currentTime - this.levelStartTime;
    const currentMonsterCount = gameState.monsters.filter(m => m.isActive).length;
    
    // Add console.log for immediate visibility
    console.log(`MonsterSpawnManager update - timeElapsed: ${timeElapsed}ms, currentMonsters: ${currentMonsterCount}, maxMonsters: ${this.maxMonstersOnScreen}`);
    logger.debug(`MonsterSpawnManager update - timeElapsed: ${timeElapsed}ms, currentMonsters: ${currentMonsterCount}, maxMonsters: ${this.maxMonstersOnScreen}`);
    
    // Check if we should spawn new monsters based on wave system
    this.checkWaveSpawning(currentTime, gameState, currentMonsterCount);
    
    // Update monster behaviors
    this.behaviorManager.updateMonsterBehaviors(currentTime, gameState);
  }

  private spawnMonster(spawnPoint: MonsterSpawnPoint, currentTime: number, gameState: any): void {
    // Add console.log for immediate visibility
    console.log(`MonsterSpawnManager: Starting to spawn monster`, {
      spawnPointType: spawnPoint.type,
      spawnPointX: spawnPoint.x,
      spawnPointY: spawnPoint.y,
      gameStateHasUpdateMonsters: !!gameState.updateMonsters,
      gameStateMonstersLength: gameState.monsters?.length || 0
    });
    
    logger.info(`MonsterSpawnManager: Starting to spawn monster`, {
      spawnPointType: spawnPoint.type,
      spawnPointX: spawnPoint.x,
      spawnPointY: spawnPoint.y,
      gameStateHasUpdateMonsters: !!gameState.updateMonsters,
      gameStateMonstersLength: gameState.monsters?.length || 0
    });

    const monster: Monster = {
      x: spawnPoint.x,
      y: spawnPoint.y,
      width: GAME_CONFIG.MONSTER_SIZE, // Normal monster size
      height: GAME_CONFIG.MONSTER_SIZE, // Normal monster size
      color: spawnPoint.color || this.getMonsterColor(spawnPoint.type), // Use spawn point color if available, otherwise get default
      type: spawnPoint.type as MonsterType,
      patrolStartX: spawnPoint.patrolStartX || spawnPoint.x - 100,
      patrolEndX: spawnPoint.patrolEndX || spawnPoint.x + 100,
      patrolStartY: spawnPoint.patrolStartY,
      patrolEndY: spawnPoint.patrolEndY,
      speed: spawnPoint.speed,
      direction: spawnPoint.direction || (Math.random() > 0.5 ? 1 : -1),
      isActive: true,
      spawnTime: currentTime,
      lastDirectionChange: currentTime,
      behaviorState: 'patrol'
    };
    
    logger.info(`MonsterSpawnManager: Created monster object`, {
      monsterType: monster.type,
      monsterX: monster.x,
      monsterY: monster.y,
      monsterWidth: monster.width,
      monsterHeight: monster.height,
      monsterColor: monster.color,
      isActive: monster.isActive
    });
    
    // Add to game state monsters using the proper update method
    if (gameState.updateMonsters) {
      const currentMonsters = gameState.monsters || [];
      const updatedMonsters = [...currentMonsters, monster];
      
      logger.info(`MonsterSpawnManager: About to call updateMonsters`, {
        currentMonstersCount: currentMonsters.length,
        updatedMonstersCount: updatedMonsters.length,
        newMonsterIndex: updatedMonsters.length - 1
      });
      
      gameState.updateMonsters(updatedMonsters);
      
      // Verify the monster was actually added
      const verifyState = useGameStore.getState();
      console.log(`MonsterSpawnManager: After updateMonsters call, game state has ${verifyState.monsters.length} monsters`);
      
      logger.info(`MonsterSpawnManager: Successfully called updateMonsters`, {
        monsterType: spawnPoint.type,
        monsterX: monster.x,
        monsterY: monster.y,
        isActive: monster.isActive,
        monsterColor: monster.color,
        currentMonstersCount: currentMonsters.length,
        updatedMonstersCount: updatedMonsters.length,
        verifyStateMonstersCount: verifyState.monsters.length
      });
    } else {
      logger.warn('Game state updateMonsters method is not available');
    }
    
    logger.info(`Spawned ${spawnPoint.type} monster at (${spawnPoint.x}, ${spawnPoint.y})`, {
      type: spawnPoint.type,
      spawnDelay: spawnPoint.spawnDelay,
      speed: spawnPoint.speed
    });
  }

  private getMonsterColor(type: string): string {
    switch (type) {
      case MonsterType.HORIZONTAL_PATROL:
        return COLORS.MONSTER;
      case MonsterType.VERTICAL_PATROL:
        return '#FF6B6B'; // Red
      case MonsterType.CHASER:
        return '#FFD93D'; // Yellow
      case MonsterType.AMBUSHER:
        return '#FF8800'; // Orange
      case MonsterType.FLOATER:
        return '#4ECDC4'; // Cyan
      default:
        return COLORS.MONSTER;
    }
  }





  public removeMonster(monster: Monster): void {
    monster.isActive = false;
    
    const gameState = useGameStore.getState();
    if (gameState.updateMonsters) {
      const currentMonsters = gameState.monsters || [];
      const updatedMonsters = currentMonsters.filter(m => m !== monster);
      gameState.updateMonsters(updatedMonsters);
      
      logger.debug(`Removed monster from game state. Total monsters: ${updatedMonsters.length}`);
    }
  }

  private checkWaveSpawning(currentTime: number, gameState: any, currentMonsterCount: number): void {
    // Don't spawn if we're at max monsters
    if (currentMonsterCount >= this.maxMonstersOnScreen) {
      return;
    }
    
    // Check if enough time has passed since last wave
    if (currentTime - this.lastWaveTime < this.waveCooldown) {
      return;
    }
    
    // Check if we have enough monsters to justify a new wave
    if (currentMonsterCount >= this.minMonstersForNewWave) {
      return;
    }
    
    // Time to spawn a new wave!
    this.spawnWave(currentTime, gameState, currentMonsterCount);
  }
  
  private spawnWave(currentTime: number, gameState: any, currentMonsterCount: number): void {
    this.currentWave++;
    this.waveStartTime = currentTime;
    this.lastWaveTime = currentTime;
    
    const monstersToSpawn = Math.min(
      this.maxMonstersOnScreen - currentMonsterCount,
      3 // Spawn up to 3 monsters per wave
    );
    
    console.log(`Spawning wave ${this.currentWave} with ${monstersToSpawn} monsters`);
    logger.info(`Spawning wave ${this.currentWave} with ${monstersToSpawn} monsters`);
    
    // Get available spawn points (not yet used)
    const availableSpawnPoints = this.spawnPoints.filter((spawnPoint, index) => {
      const spawnKey = `${spawnPoint.x}-${spawnPoint.y}-${spawnPoint.type}`;
      return !this.spawnedMonsters.has(spawnKey);
    });
    
    // Shuffle available spawn points for randomness
    const shuffledSpawnPoints = [...availableSpawnPoints].sort(() => Math.random() - 0.5);
    
    // Spawn monsters from the wave
    for (let i = 0; i < Math.min(monstersToSpawn, shuffledSpawnPoints.length); i++) {
      const spawnPoint = shuffledSpawnPoints[i];
      const spawnKey = `${spawnPoint.x}-${spawnPoint.y}-${spawnPoint.type}`;
      
      // Add some randomness to spawn timing within the wave
      const spawnDelay = Math.random() * 2000; // 0-2 seconds delay within wave
      
      setTimeout(() => {
        logger.info(`Spawning wave monster: ${spawnPoint.type} at (${spawnPoint.x}, ${spawnPoint.y})`);
        this.spawnMonster(spawnPoint, Date.now(), gameState);
        this.spawnedMonsters.add(spawnKey);
      }, spawnDelay);
    }
  }
  

  
  public reset(): void {
    this.levelStartTime = Date.now();
    this.spawnedMonsters.clear();
    this.currentWave = 0;
    this.waveStartTime = 0;
    this.lastWaveTime = 0;
  }
} 