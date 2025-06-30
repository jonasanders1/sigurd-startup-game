import { MapDefinition } from '../types/interfaces';
import { GAME_CONFIG, COLORS } from '../types/constants';
import { MonsterType, CoinType } from '../types/enums';

export const level1Map: MapDefinition = {
  id: 'level1',
  name: 'Startup Norge',
  width: GAME_CONFIG.CANVAS_WIDTH,
  height: GAME_CONFIG.CANVAS_HEIGHT,
  playerStartX: 100,
  playerStartY: GAME_CONFIG.CANVAS_HEIGHT - 150,
  backgroundColor: COLORS.BACKGROUND,
  theme: 'classic',
  groupSequence: [1, 2, 3, 4, 5, 6],
  difficulty: 1,
  
  // Ground covering entire width at bottom
  ground: {
    x: 0,
    y: GAME_CONFIG.CANVAS_HEIGHT - 40,
    width: GAME_CONFIG.CANVAS_WIDTH,
    height: 40,
    color: COLORS.GROUND
  },
  
  platforms: [
    // Middle platforms
    { x: 150, y: GAME_CONFIG.CANVAS_HEIGHT - 200, width: 150, height: 20, color: COLORS.PLATFORM },
    { x: 500, y: GAME_CONFIG.CANVAS_HEIGHT - 200, width: 150, height: 20, color: COLORS.PLATFORM },
    
    // Top platforms
    { x: 100, y: GAME_CONFIG.CANVAS_HEIGHT - 350, width: 120, height: 20, color: COLORS.PLATFORM },
    { x: 350, y: GAME_CONFIG.CANVAS_HEIGHT - 350, width: 100, height: 20, color: COLORS.PLATFORM },
    { x: 580, y: GAME_CONFIG.CANVAS_HEIGHT - 350, width: 120, height: 20, color: COLORS.PLATFORM },
    
    // High platform
    { x: 300, y: GAME_CONFIG.CANVAS_HEIGHT - 480, width: 200, height: 20, color: COLORS.PLATFORM }
  ],
  
  bombs: [
    // Group 1 (bottom level)
    { x: 50, y: GAME_CONFIG.CANVAS_HEIGHT - 70, width: 16, height: 16, order: 1, group: 1, isCollected: false, isBlinking: false },
    { x: 150, y: GAME_CONFIG.CANVAS_HEIGHT - 70, width: 16, height: 16, order: 2, group: 1, isCollected: false, isBlinking: false },
    { x: 350, y: GAME_CONFIG.CANVAS_HEIGHT - 70, width: 16, height: 16, order: 3, group: 1, isCollected: false, isBlinking: false },
    { x: 450, y: GAME_CONFIG.CANVAS_HEIGHT - 70, width: 16, height: 16, order: 4, group: 1, isCollected: false, isBlinking: false },
    
    // Group 2 (middle level)
    { x: 200, y: GAME_CONFIG.CANVAS_HEIGHT - 230, width: 16, height: 16, order: 5, group: 2, isCollected: false, isBlinking: false },
    { x: 250, y: GAME_CONFIG.CANVAS_HEIGHT - 230, width: 16, height: 16, order: 6, group: 2, isCollected: false, isBlinking: false },
    { x: 520, y: GAME_CONFIG.CANVAS_HEIGHT - 230, width: 16, height: 16, order: 7, group: 2, isCollected: false, isBlinking: false },
    { x: 580, y: GAME_CONFIG.CANVAS_HEIGHT - 230, width: 16, height: 16, order: 8, group: 2, isCollected: false, isBlinking: false },
    
    // Group 3 (top level)
    { x: 130, y: GAME_CONFIG.CANVAS_HEIGHT - 380, width: 16, height: 16, order: 9, group: 3, isCollected: false, isBlinking: false },
    { x: 170, y: GAME_CONFIG.CANVAS_HEIGHT - 380, width: 16, height: 16, order: 10, group: 3, isCollected: false, isBlinking: false },
    { x: 380, y: GAME_CONFIG.CANVAS_HEIGHT - 380, width: 16, height: 16, order: 11, group: 3, isCollected: false, isBlinking: false },
    { x: 420, y: GAME_CONFIG.CANVAS_HEIGHT - 380, width: 16, height: 16, order: 12, group: 3, isCollected: false, isBlinking: false },
    
    // More bombs to reach 23 total
    { x: 610, y: GAME_CONFIG.CANVAS_HEIGHT - 380, width: 16, height: 16, order: 13, group: 4, isCollected: false, isBlinking: false },
    { x: 650, y: GAME_CONFIG.CANVAS_HEIGHT - 380, width: 16, height: 16, order: 14, group: 4, isCollected: false, isBlinking: false },
    { x: 320, y: GAME_CONFIG.CANVAS_HEIGHT - 510, width: 16, height: 16, order: 15, group: 5, isCollected: false, isBlinking: false },
    { x: 360, y: GAME_CONFIG.CANVAS_HEIGHT - 510, width: 16, height: 16, order: 16, group: 5, isCollected: false, isBlinking: false },
    { x: 400, y: GAME_CONFIG.CANVAS_HEIGHT - 510, width: 16, height: 16, order: 17, group: 5, isCollected: false, isBlinking: false },
    { x: 440, y: GAME_CONFIG.CANVAS_HEIGHT - 510, width: 16, height: 16, order: 18, group: 5, isCollected: false, isBlinking: false },
    { x: 480, y: GAME_CONFIG.CANVAS_HEIGHT - 510, width: 16, height: 16, order: 19, group: 5, isCollected: false, isBlinking: false },
    { x: 50, y: GAME_CONFIG.CANVAS_HEIGHT - 110, width: 16, height: 16, order: 20, group: 6, isCollected: false, isBlinking: false },
    { x: 750, y: GAME_CONFIG.CANVAS_HEIGHT - 110, width: 16, height: 16, order: 21, group: 6, isCollected: false, isBlinking: false },
    { x: 30, y: GAME_CONFIG.CANVAS_HEIGHT - 290, width: 16, height: 16, order: 22, group: 6, isCollected: false, isBlinking: false },
    { x: 770, y: GAME_CONFIG.CANVAS_HEIGHT - 290, width: 16, height: 16, order: 23, group: 6, isCollected: false, isBlinking: false }
  ],
  
  coinSpawnPoints: [
    // Power coin spawn points - only 2 per map with non-cardinal angles
    { x: 300, y: GAME_CONFIG.CANVAS_HEIGHT - 150, type: CoinType.POWER, spawnAngle: 45 },
    { x: 500, y: GAME_CONFIG.CANVAS_HEIGHT - 200, type: CoinType.POWER, spawnAngle: 135 }
  ],
  
  monsters: [
    {
      x: 350,
      y: GAME_CONFIG.CANVAS_HEIGHT - 70,
      width: GAME_CONFIG.MONSTER_SIZE,
      height: GAME_CONFIG.MONSTER_SIZE,
      color: COLORS.MONSTER,
      type: MonsterType.HORIZONTAL_PATROL,
      patrolStartX: 300,
      patrolEndX: 500,
      speed: 1,
      direction: 1,
      isActive: true
    },
    {
      x: 200,
      y: GAME_CONFIG.CANVAS_HEIGHT - 230,
      width: GAME_CONFIG.MONSTER_SIZE,
      height: GAME_CONFIG.MONSTER_SIZE,
      color: COLORS.MONSTER,
      type: MonsterType.HORIZONTAL_PATROL,
      patrolStartX: 150,
      patrolEndX: 300,
      speed: 1.5,
      direction: -1,
      isActive: true
    }
  ]
};

export const level2Map: MapDefinition = {
  id: 'level2',
  name: 'Innovasjon Norge',
  width: GAME_CONFIG.CANVAS_WIDTH,
  height: GAME_CONFIG.CANVAS_HEIGHT,
  playerStartX: 50,
  playerStartY: GAME_CONFIG.CANVAS_HEIGHT - 150,
  backgroundColor: COLORS.BACKGROUND,
  theme: 'advanced',
  groupSequence: [1, 2, 3, 4, 5, 6],
  difficulty: 2,
  
  // Ground covering entire width at bottom
  ground: {
    x: 0,
    y: GAME_CONFIG.CANVAS_HEIGHT - 40,
    width: GAME_CONFIG.CANVAS_WIDTH,
    height: 40,
    color: COLORS.PLATFORM
  },
  
  platforms: [
    // Remove the bottom platforms and keep only elevated ones
    { x: 250, y: GAME_CONFIG.CANVAS_HEIGHT - 120, width: 100, height: 20, color: COLORS.PLATFORM },
    { x: 450, y: GAME_CONFIG.CANVAS_HEIGHT - 120, width: 100, height: 20, color: COLORS.PLATFORM },
    
    // Staggered middle platforms
    { x: 100, y: GAME_CONFIG.CANVAS_HEIGHT - 160, width: 100, height: 20, color: COLORS.PLATFORM },
    { x: 300, y: GAME_CONFIG.CANVAS_HEIGHT - 180, width: 80, height: 20, color: COLORS.PLATFORM },
    { x: 480, y: GAME_CONFIG.CANVAS_HEIGHT - 160, width: 100, height: 20, color: COLORS.PLATFORM },
    { x: 680, y: GAME_CONFIG.CANVAS_HEIGHT - 180, width: 80, height: 20, color: COLORS.PLATFORM },
    
    // Higher platforms
    { x: 50, y: GAME_CONFIG.CANVAS_HEIGHT - 280, width: 120, height: 20, color: COLORS.PLATFORM },
    { x: 250, y: GAME_CONFIG.CANVAS_HEIGHT - 320, width: 100, height: 20, color: COLORS.PLATFORM },
    { x: 450, y: GAME_CONFIG.CANVAS_HEIGHT - 300, width: 80, height: 20, color: COLORS.PLATFORM },
    { x: 630, y: GAME_CONFIG.CANVAS_HEIGHT - 280, width: 120, height: 20, color: COLORS.PLATFORM },
    
    // Top platforms
    { x: 150, y: GAME_CONFIG.CANVAS_HEIGHT - 420, width: 100, height: 20, color: COLORS.PLATFORM },
    { x: 350, y: GAME_CONFIG.CANVAS_HEIGHT - 460, width: 100, height: 20, color: COLORS.PLATFORM },
    { x: 550, y: GAME_CONFIG.CANVAS_HEIGHT - 420, width: 100, height: 20, color: COLORS.PLATFORM }
  ],
  
  bombs: [
    // Level 2 bomb placement - more challenging layout
    { x: 75, y: GAME_CONFIG.CANVAS_HEIGHT - 70, width: 16, height: 16, order: 1, group: 1, isCollected: false, isBlinking: false },
    { x: 275, y: GAME_CONFIG.CANVAS_HEIGHT - 70, width: 16, height: 16, order: 2, group: 1, isCollected: false, isBlinking: false },
    { x: 475, y: GAME_CONFIG.CANVAS_HEIGHT - 70, width: 16, height: 16, order: 3, group: 1, isCollected: false, isBlinking: false },
    { x: 700, y: GAME_CONFIG.CANVAS_HEIGHT - 70, width: 16, height: 16, order: 4, group: 1, isCollected: false, isBlinking: false },
    
    { x: 130, y: GAME_CONFIG.CANVAS_HEIGHT - 190, width: 16, height: 16, order: 5, group: 2, isCollected: false, isBlinking: false },
    { x: 320, y: GAME_CONFIG.CANVAS_HEIGHT - 210, width: 16, height: 16, order: 6, group: 2, isCollected: false, isBlinking: false },
    { x: 510, y: GAME_CONFIG.CANVAS_HEIGHT - 190, width: 16, height: 16, order: 7, group: 2, isCollected: false, isBlinking: false },
    { x: 710, y: GAME_CONFIG.CANVAS_HEIGHT - 210, width: 16, height: 16, order: 8, group: 2, isCollected: false, isBlinking: false },
    
    { x: 80, y: GAME_CONFIG.CANVAS_HEIGHT - 320, width: 16, height: 16, order: 9, group: 3, isCollected: false, isBlinking: false },
    { x: 280, y: GAME_CONFIG.CANVAS_HEIGHT - 340, width: 16, height: 16, order: 10, group: 3, isCollected: false, isBlinking: false },
    { x: 480, y: GAME_CONFIG.CANVAS_HEIGHT - 320, width: 16, height: 16, order: 11, group: 3, isCollected: false, isBlinking: false },
    { x: 680, y: GAME_CONFIG.CANVAS_HEIGHT - 300, width: 16, height: 16, order: 12, group: 3, isCollected: false, isBlinking: false },
    
    { x: 180, y: GAME_CONFIG.CANVAS_HEIGHT - 450, width: 16, height: 16, order: 13, group: 4, isCollected: false, isBlinking: false },
    { x: 380, y: GAME_CONFIG.CANVAS_HEIGHT - 480, width: 16, height: 16, order: 14, group: 4, isCollected: false, isBlinking: false },
    { x: 580, y: GAME_CONFIG.CANVAS_HEIGHT - 440, width: 16, height: 16, order: 15, group: 4, isCollected: false, isBlinking: false },
    
    // Additional bombs scattered around
    { x: 25, y: GAME_CONFIG.CANVAS_HEIGHT - 120, width: 16, height: 16, order: 16, group: 5, isCollected: false, isBlinking: false },
    { x: 775, y: GAME_CONFIG.CANVAS_HEIGHT - 120, width: 16, height: 16, order: 17, group: 5, isCollected: false, isBlinking: false },
    { x: 200, y: GAME_CONFIG.CANVAS_HEIGHT - 250, width: 16, height: 16, order: 18, group: 5, isCollected: false, isBlinking: false },
    { x: 600, y: GAME_CONFIG.CANVAS_HEIGHT - 250, width: 16, height: 16, order: 19, group: 5, isCollected: false, isBlinking: false },
    { x: 100, y: GAME_CONFIG.CANVAS_HEIGHT - 380, width: 16, height: 16, order: 20, group: 6, isCollected: false, isBlinking: false },
    { x: 300, y: GAME_CONFIG.CANVAS_HEIGHT - 400, width: 16, height: 16, order: 21, group: 6, isCollected: false, isBlinking: false },
    { x: 500, y: GAME_CONFIG.CANVAS_HEIGHT - 380, width: 16, height: 16, order: 22, group: 6, isCollected: false, isBlinking: false },
    { x: 700, y: GAME_CONFIG.CANVAS_HEIGHT - 400, width: 16, height: 16, order: 23, group: 6, isCollected: false, isBlinking: false }
  ],
  
  coinSpawnPoints: [
    // Power coin spawn points for level 2 - only 2 per map with non-cardinal angles
    { x: 350, y: GAME_CONFIG.CANVAS_HEIGHT - 120, type: CoinType.POWER, spawnAngle: 60 },
    { x: 450, y: GAME_CONFIG.CANVAS_HEIGHT - 180, type: CoinType.POWER, spawnAngle: 120 }
  ],
  
  monsters: [
    {
      x: 250,
      y: GAME_CONFIG.CANVAS_HEIGHT - 70,
      width: GAME_CONFIG.MONSTER_SIZE,
      height: GAME_CONFIG.MONSTER_SIZE,
      color: COLORS.MONSTER,
      type: MonsterType.HORIZONTAL_PATROL,
      patrolStartX: 200,
      patrolEndX: 400,
      speed: 1.5,
      direction: 1,
      isActive: true
    },
    {
      x: 500,
      y: GAME_CONFIG.CANVAS_HEIGHT - 190,
      width: GAME_CONFIG.MONSTER_SIZE,
      height: GAME_CONFIG.MONSTER_SIZE,
      color: COLORS.MONSTER,
      type: MonsterType.HORIZONTAL_PATROL,
      patrolStartX: 450,
      patrolEndX: 600,
      speed: 2,
      direction: -1,
      isActive: true
    },
    {
      x: 100,
      y: GAME_CONFIG.CANVAS_HEIGHT - 310,
      width: GAME_CONFIG.MONSTER_SIZE,
      height: GAME_CONFIG.MONSTER_SIZE,
      color: COLORS.MONSTER,
      type: MonsterType.HORIZONTAL_PATROL,
      patrolStartX: 50,
      patrolEndX: 200,
      speed: 1.8,
      direction: 1,
      isActive: true
    }
  ]
};

export const level3Map: MapDefinition = {
  id: 'level3',
  name: 'Kommunehuset',
  width: GAME_CONFIG.CANVAS_WIDTH,
  height: GAME_CONFIG.CANVAS_HEIGHT,
  playerStartX: 50,
  playerStartY: GAME_CONFIG.CANVAS_HEIGHT - 150,
  backgroundColor: COLORS.BACKGROUND,
  theme: 'innovation',
  groupSequence: [1, 2, 3, 4, 5, 6],
  difficulty: 3,
  
  ground: {
    x: 0,
    y: GAME_CONFIG.CANVAS_HEIGHT - 40,
    width: GAME_CONFIG.CANVAS_WIDTH,
    height: 40,
    color: COLORS.GROUND
  },
  
  platforms: [
    // Floating platforms with gaps
    { x: 100, y: GAME_CONFIG.CANVAS_HEIGHT - 100, width: 80, height: 20, color: COLORS.PLATFORM },
    { x: 300, y: GAME_CONFIG.CANVAS_HEIGHT - 100, width: 80, height: 20, color: COLORS.PLATFORM },
    { x: 500, y: GAME_CONFIG.CANVAS_HEIGHT - 100, width: 80, height: 20, color: COLORS.PLATFORM },
    { x: 700, y: GAME_CONFIG.CANVAS_HEIGHT - 100, width: 80, height: 20, color: COLORS.PLATFORM },
    
    // Zigzag pattern
    { x: 50, y: GAME_CONFIG.CANVAS_HEIGHT - 180, width: 100, height: 20, color: COLORS.PLATFORM },
    { x: 250, y: GAME_CONFIG.CANVAS_HEIGHT - 220, width: 100, height: 20, color: COLORS.PLATFORM },
    { x: 450, y: GAME_CONFIG.CANVAS_HEIGHT - 180, width: 100, height: 20, color: COLORS.PLATFORM },
    { x: 650, y: GAME_CONFIG.CANVAS_HEIGHT - 220, width: 100, height: 20, color: COLORS.PLATFORM },
    
    // High platforms
    { x: 150, y: GAME_CONFIG.CANVAS_HEIGHT - 300, width: 80, height: 20, color: COLORS.PLATFORM },
    { x: 350, y: GAME_CONFIG.CANVAS_HEIGHT - 340, width: 80, height: 20, color: COLORS.PLATFORM },
    { x: 550, y: GAME_CONFIG.CANVAS_HEIGHT - 300, width: 80, height: 20, color: COLORS.PLATFORM },
    
    // Top platforms
    { x: 200, y: GAME_CONFIG.CANVAS_HEIGHT - 420, width: 120, height: 20, color: COLORS.PLATFORM },
    { x: 480, y: GAME_CONFIG.CANVAS_HEIGHT - 420, width: 120, height: 20, color: COLORS.PLATFORM }
  ],
  
  bombs: [
    // Ground level bombs
    { x: 120, y: GAME_CONFIG.CANVAS_HEIGHT - 70, width: 16, height: 16, order: 1, group: 1, isCollected: false, isBlinking: false },
    { x: 320, y: GAME_CONFIG.CANVAS_HEIGHT - 70, width: 16, height: 16, order: 2, group: 1, isCollected: false, isBlinking: false },
    { x: 520, y: GAME_CONFIG.CANVAS_HEIGHT - 70, width: 16, height: 16, order: 3, group: 1, isCollected: false, isBlinking: false },
    { x: 720, y: GAME_CONFIG.CANVAS_HEIGHT - 70, width: 16, height: 16, order: 4, group: 1, isCollected: false, isBlinking: false },
    
    // First platform level
    { x: 130, y: GAME_CONFIG.CANVAS_HEIGHT - 130, width: 16, height: 16, order: 5, group: 2, isCollected: false, isBlinking: false },
    { x: 330, y: GAME_CONFIG.CANVAS_HEIGHT - 130, width: 16, height: 16, order: 6, group: 2, isCollected: false, isBlinking: false },
    { x: 530, y: GAME_CONFIG.CANVAS_HEIGHT - 130, width: 16, height: 16, order: 7, group: 2, isCollected: false, isBlinking: false },
    { x: 730, y: GAME_CONFIG.CANVAS_HEIGHT - 130, width: 16, height: 16, order: 8, group: 2, isCollected: false, isBlinking: false },
    
    // Zigzag level
    { x: 80, y: GAME_CONFIG.CANVAS_HEIGHT - 210, width: 16, height: 16, order: 9, group: 3, isCollected: false, isBlinking: false },
    { x: 280, y: GAME_CONFIG.CANVAS_HEIGHT - 250, width: 16, height: 16, order: 10, group: 3, isCollected: false, isBlinking: false },
    { x: 480, y: GAME_CONFIG.CANVAS_HEIGHT - 210, width: 16, height: 16, order: 11, group: 3, isCollected: false, isBlinking: false },
    { x: 680, y: GAME_CONFIG.CANVAS_HEIGHT - 250, width: 16, height: 16, order: 12, group: 3, isCollected: false, isBlinking: false },
    
    // High platforms
    { x: 180, y: GAME_CONFIG.CANVAS_HEIGHT - 330, width: 16, height: 16, order: 13, group: 4, isCollected: false, isBlinking: false },
    { x: 380, y: GAME_CONFIG.CANVAS_HEIGHT - 370, width: 16, height: 16, order: 14, group: 4, isCollected: false, isBlinking: false },
    { x: 580, y: GAME_CONFIG.CANVAS_HEIGHT - 330, width: 16, height: 16, order: 15, group: 4, isCollected: false, isBlinking: false },
    
    // Top platforms
    { x: 230, y: GAME_CONFIG.CANVAS_HEIGHT - 450, width: 16, height: 16, order: 16, group: 5, isCollected: false, isBlinking: false },
    { x: 510, y: GAME_CONFIG.CANVAS_HEIGHT - 450, width: 16, height: 16, order: 17, group: 5, isCollected: false, isBlinking: false },
    
    // Scattered bombs
    { x: 25, y: GAME_CONFIG.CANVAS_HEIGHT - 110, width: 16, height: 16, order: 18, group: 6, isCollected: false, isBlinking: false },
    { x: 775, y: GAME_CONFIG.CANVAS_HEIGHT - 110, width: 16, height: 16, order: 19, group: 6, isCollected: false, isBlinking: false },
    { x: 150, y: GAME_CONFIG.CANVAS_HEIGHT - 270, width: 16, height: 16, order: 20, group: 6, isCollected: false, isBlinking: false },
    { x: 650, y: GAME_CONFIG.CANVAS_HEIGHT - 270, width: 16, height: 16, order: 21, group: 6, isCollected: false, isBlinking: false },
    { x: 370, y: GAME_CONFIG.CANVAS_HEIGHT - 390, width: 16, height: 16, order: 22, group: 6, isCollected: false, isBlinking: false },
    { x: 430, y: GAME_CONFIG.CANVAS_HEIGHT - 390, width: 16, height: 16, order: 23, group: 6, isCollected: false, isBlinking: false }
  ],
  
  coinSpawnPoints: [
    // Power coin spawn points for level 3 - only 2 per map with non-cardinal angles
    { x: 250, y: GAME_CONFIG.CANVAS_HEIGHT - 150, type: CoinType.POWER, spawnAngle: 75 },
    { x: 550, y: GAME_CONFIG.CANVAS_HEIGHT - 200, type: CoinType.POWER, spawnAngle: 105 }
  ],
  
  monsters: [
    {
      x: 300,
      y: GAME_CONFIG.CANVAS_HEIGHT - 70,
      width: GAME_CONFIG.MONSTER_SIZE,
      height: GAME_CONFIG.MONSTER_SIZE,
      color: COLORS.MONSTER,
      type: MonsterType.HORIZONTAL_PATROL,
      patrolStartX: 250,
      patrolEndX: 450,
      speed: 2,
      direction: 1,
      isActive: true
    },
    {
      x: 500,
      y: GAME_CONFIG.CANVAS_HEIGHT - 130,
      width: GAME_CONFIG.MONSTER_SIZE,
      height: GAME_CONFIG.MONSTER_SIZE,
      color: COLORS.MONSTER,
      type: MonsterType.HORIZONTAL_PATROL,
      patrolStartX: 450,
      patrolEndX: 650,
      speed: 2.2,
      direction: -1,
      isActive: true
    },
    {
      x: 100,
      y: GAME_CONFIG.CANVAS_HEIGHT - 210,
      width: GAME_CONFIG.MONSTER_SIZE,
      height: GAME_CONFIG.MONSTER_SIZE,
      color: COLORS.MONSTER,
      type: MonsterType.HORIZONTAL_PATROL,
      patrolStartX: 50,
      patrolEndX: 250,
      speed: 1.8,
      direction: 1,
      isActive: true
    }
  ]
};

export const level4Map: MapDefinition = {
  id: 'level4',
  name: 'Altinn',
  width: GAME_CONFIG.CANVAS_WIDTH,
  height: GAME_CONFIG.CANVAS_HEIGHT,
  playerStartX: 50,
  playerStartY: GAME_CONFIG.CANVAS_HEIGHT - 150,
  backgroundColor: COLORS.BACKGROUND,
  theme: 'ocean',
  groupSequence: [1, 2, 3, 4, 5, 6],
  difficulty: 4,
  
  ground: {
    x: 0,
    y: GAME_CONFIG.CANVAS_HEIGHT - 40,
    width: GAME_CONFIG.CANVAS_WIDTH,
    height: 40,
    color: COLORS.GROUND
  },
  
  platforms: [
    // Underwater platforms - scattered layout
    { x: 80, y: GAME_CONFIG.CANVAS_HEIGHT - 80, width: 60, height: 20, color: COLORS.PLATFORM },
    { x: 220, y: GAME_CONFIG.CANVAS_HEIGHT - 80, width: 60, height: 20, color: COLORS.PLATFORM },
    { x: 520, y: GAME_CONFIG.CANVAS_HEIGHT - 80, width: 60, height: 20, color: COLORS.PLATFORM },
    { x: 660, y: GAME_CONFIG.CANVAS_HEIGHT - 80, width: 60, height: 20, color: COLORS.PLATFORM },
    
    // Mid-level platforms
    { x: 150, y: GAME_CONFIG.CANVAS_HEIGHT - 140, width: 80, height: 20, color: COLORS.PLATFORM },
    { x: 350, y: GAME_CONFIG.CANVAS_HEIGHT - 160, width: 80, height: 20, color: COLORS.PLATFORM },
    { x: 550, y: GAME_CONFIG.CANVAS_HEIGHT - 140, width: 80, height: 20, color: COLORS.PLATFORM },
    
    // Higher platforms
    { x: 100, y: GAME_CONFIG.CANVAS_HEIGHT - 220, width: 70, height: 20, color: COLORS.PLATFORM },
    { x: 300, y: GAME_CONFIG.CANVAS_HEIGHT - 240, width: 70, height: 20, color: COLORS.PLATFORM },
    { x: 500, y: GAME_CONFIG.CANVAS_HEIGHT - 220, width: 70, height: 20, color: COLORS.PLATFORM },
    { x: 700, y: GAME_CONFIG.CANVAS_HEIGHT - 240, width: 70, height: 20, color: COLORS.PLATFORM },
    
    // Top platforms
    { x: 200, y: GAME_CONFIG.CANVAS_HEIGHT - 320, width: 90, height: 20, color: COLORS.PLATFORM },
    { x: 400, y: GAME_CONFIG.CANVAS_HEIGHT - 340, width: 90, height: 20, color: COLORS.PLATFORM },
    { x: 600, y: GAME_CONFIG.CANVAS_HEIGHT - 320, width: 90, height: 20, color: COLORS.PLATFORM },
    
    // Floating platforms
    { x: 250, y: GAME_CONFIG.CANVAS_HEIGHT - 420, width: 100, height: 20, color: COLORS.PLATFORM },
    { x: 450, y: GAME_CONFIG.CANVAS_HEIGHT - 420, width: 100, height: 20, color: COLORS.PLATFORM }
  ],
  
  bombs: [
    // Bottom level
    { x: 100, y: GAME_CONFIG.CANVAS_HEIGHT - 70, width: 16, height: 16, order: 1, group: 1, isCollected: false, isBlinking: false },
    { x: 240, y: GAME_CONFIG.CANVAS_HEIGHT - 70, width: 16, height: 16, order: 2, group: 1, isCollected: false, isBlinking: false },
    { x: 540, y: GAME_CONFIG.CANVAS_HEIGHT - 70, width: 16, height: 16, order: 3, group: 1, isCollected: false, isBlinking: false },
    { x: 680, y: GAME_CONFIG.CANVAS_HEIGHT - 70, width: 16, height: 16, order: 4, group: 1, isCollected: false, isBlinking: false },
    
    // First platform level
    { x: 110, y: GAME_CONFIG.CANVAS_HEIGHT - 110, width: 16, height: 16, order: 5, group: 2, isCollected: false, isBlinking: false },
    { x: 250, y: GAME_CONFIG.CANVAS_HEIGHT - 110, width: 16, height: 16, order: 6, group: 2, isCollected: false, isBlinking: false },
    { x: 550, y: GAME_CONFIG.CANVAS_HEIGHT - 110, width: 16, height: 16, order: 7, group: 2, isCollected: false, isBlinking: false },
    { x: 690, y: GAME_CONFIG.CANVAS_HEIGHT - 110, width: 16, height: 16, order: 8, group: 2, isCollected: false, isBlinking: false },
    
    // Mid-level
    { x: 170, y: GAME_CONFIG.CANVAS_HEIGHT - 170, width: 16, height: 16, order: 9, group: 3, isCollected: false, isBlinking: false },
    { x: 370, y: GAME_CONFIG.CANVAS_HEIGHT - 190, width: 16, height: 16, order: 10, group: 3, isCollected: false, isBlinking: false },
    { x: 570, y: GAME_CONFIG.CANVAS_HEIGHT - 170, width: 16, height: 16, order: 11, group: 3, isCollected: false, isBlinking: false },
    
    // Higher level
    { x: 120, y: GAME_CONFIG.CANVAS_HEIGHT - 250, width: 16, height: 16, order: 12, group: 4, isCollected: false, isBlinking: false },
    { x: 320, y: GAME_CONFIG.CANVAS_HEIGHT - 270, width: 16, height: 16, order: 13, group: 4, isCollected: false, isBlinking: false },
    { x: 520, y: GAME_CONFIG.CANVAS_HEIGHT - 250, width: 16, height: 16, order: 14, group: 4, isCollected: false, isBlinking: false },
    { x: 720, y: GAME_CONFIG.CANVAS_HEIGHT - 270, width: 16, height: 16, order: 15, group: 4, isCollected: false, isBlinking: false },
    
    // Top level
    { x: 220, y: GAME_CONFIG.CANVAS_HEIGHT - 350, width: 16, height: 16, order: 16, group: 5, isCollected: false, isBlinking: false },
    { x: 420, y: GAME_CONFIG.CANVAS_HEIGHT - 370, width: 16, height: 16, order: 17, group: 5, isCollected: false, isBlinking: false },
    { x: 620, y: GAME_CONFIG.CANVAS_HEIGHT - 350, width: 16, height: 16, order: 18, group: 5, isCollected: false, isBlinking: false },
    
    // Floating level
    { x: 270, y: GAME_CONFIG.CANVAS_HEIGHT - 450, width: 16, height: 16, order: 19, group: 6, isCollected: false, isBlinking: false },
    { x: 470, y: GAME_CONFIG.CANVAS_HEIGHT - 450, width: 16, height: 16, order: 20, group: 6, isCollected: false, isBlinking: false },
    
    // Scattered bombs
    { x: 30, y: GAME_CONFIG.CANVAS_HEIGHT - 100, width: 16, height: 16, order: 21, group: 6, isCollected: false, isBlinking: false },
    { x: 770, y: GAME_CONFIG.CANVAS_HEIGHT - 100, width: 16, height: 16, order: 22, group: 6, isCollected: false, isBlinking: false },
    { x: 400, y: GAME_CONFIG.CANVAS_HEIGHT - 300, width: 16, height: 16, order: 23, group: 6, isCollected: false, isBlinking: false }
  ],
  
  monsters: [
    {
      x: 220,
      y: GAME_CONFIG.CANVAS_HEIGHT - 70,
      width: GAME_CONFIG.MONSTER_SIZE,
      height: GAME_CONFIG.MONSTER_SIZE,
      color: COLORS.MONSTER,
      type: MonsterType.HORIZONTAL_PATROL,
      patrolStartX: 180,
      patrolEndX: 380,
      speed: 2.5,
      direction: 1,
      isActive: true
    },
    {
      x: 520,
      y: GAME_CONFIG.CANVAS_HEIGHT - 110,
      width: GAME_CONFIG.MONSTER_SIZE,
      height: GAME_CONFIG.MONSTER_SIZE,
      color: COLORS.MONSTER,
      type: MonsterType.HORIZONTAL_PATROL,
      patrolStartX: 480,
      patrolEndX: 680,
      speed: 2.8,
      direction: -1,
      isActive: true
    },
    {
      x: 150,
      y: GAME_CONFIG.CANVAS_HEIGHT - 250,
      width: GAME_CONFIG.MONSTER_SIZE,
      height: GAME_CONFIG.MONSTER_SIZE,
      color: COLORS.MONSTER,
      type: MonsterType.HORIZONTAL_PATROL,
      patrolStartX: 100,
      patrolEndX: 300,
      speed: 2.2,
      direction: 1,
      isActive: true
    },
    {
      x: 650,
      y: GAME_CONFIG.CANVAS_HEIGHT - 270,
      width: GAME_CONFIG.MONSTER_SIZE,
      height: GAME_CONFIG.MONSTER_SIZE,
      color: COLORS.MONSTER,
      type: MonsterType.HORIZONTAL_PATROL,
      patrolStartX: 600,
      patrolEndX: 800,
      speed: 2.3,
      direction: -1,
      isActive: true
    }
  ],
  
  coinSpawnPoints: [
    // Power coin spawn points for level 4 - only 2 per map with non-cardinal angles
    { x: 200, y: GAME_CONFIG.CANVAS_HEIGHT - 120, type: CoinType.POWER, spawnAngle: 30 },
    { x: 600, y: GAME_CONFIG.CANVAS_HEIGHT - 160, type: CoinType.POWER, spawnAngle: 150 }
  ]
};

export const level5Map: MapDefinition = {
  id: 'level5',
  name: 'NAV',
  width: GAME_CONFIG.CANVAS_WIDTH,
  height: GAME_CONFIG.CANVAS_HEIGHT,
  playerStartX: 50,
  playerStartY: GAME_CONFIG.CANVAS_HEIGHT - 150,
  backgroundColor: COLORS.BACKGROUND,
  theme: 'research',
  groupSequence: [1, 2, 3, 4, 5, 6],
  difficulty: 5,
  
  ground: {
    x: 0,
    y: GAME_CONFIG.CANVAS_HEIGHT - 40,
    width: GAME_CONFIG.CANVAS_WIDTH,
    height: 40,
    color: COLORS.GROUND
  },
  
  platforms: [
    // Minimal ground platforms
    { x: 50, y: GAME_CONFIG.CANVAS_HEIGHT - 60, width: 50, height: 20, color: COLORS.PLATFORM },
    { x: 750, y: GAME_CONFIG.CANVAS_HEIGHT - 60, width: 50, height: 20, color: COLORS.PLATFORM },
    
    // Floating platforms in spiral pattern
    { x: 200, y: GAME_CONFIG.CANVAS_HEIGHT - 120, width: 60, height: 20, color: COLORS.PLATFORM },
    { x: 600, y: GAME_CONFIG.CANVAS_HEIGHT - 120, width: 60, height: 20, color: COLORS.PLATFORM },
    
    { x: 100, y: GAME_CONFIG.CANVAS_HEIGHT - 180, width: 60, height: 20, color: COLORS.PLATFORM },
    { x: 700, y: GAME_CONFIG.CANVAS_HEIGHT - 180, width: 60, height: 20, color: COLORS.PLATFORM },
    
    { x: 300, y: GAME_CONFIG.CANVAS_HEIGHT - 240, width: 60, height: 20, color: COLORS.PLATFORM },
    { x: 500, y: GAME_CONFIG.CANVAS_HEIGHT - 240, width: 60, height: 20, color: COLORS.PLATFORM },
    
    { x: 150, y: GAME_CONFIG.CANVAS_HEIGHT - 300, width: 60, height: 20, color: COLORS.PLATFORM },
    { x: 650, y: GAME_CONFIG.CANVAS_HEIGHT - 300, width: 60, height: 20, color: COLORS.PLATFORM },
    
    { x: 400, y: GAME_CONFIG.CANVAS_HEIGHT - 360, width: 60, height: 20, color: COLORS.PLATFORM },
    
    { x: 250, y: GAME_CONFIG.CANVAS_HEIGHT - 420, width: 60, height: 20, color: COLORS.PLATFORM },
    { x: 550, y: GAME_CONFIG.CANVAS_HEIGHT - 420, width: 60, height: 20, color: COLORS.PLATFORM }
  ],
  
  bombs: [
    // Ground level
    { x: 70, y: GAME_CONFIG.CANVAS_HEIGHT - 70, width: 16, height: 16, order: 1, group: 1, isCollected: false, isBlinking: false },
    { x: 795, y: GAME_CONFIG.CANVAS_HEIGHT - 70, width: 16, height: 16, order: 2, group: 1, isCollected: false, isBlinking: false },
    
    // First floating level
    { x: 220, y: GAME_CONFIG.CANVAS_HEIGHT - 150, width: 16, height: 16, order: 3, group: 2, isCollected: false, isBlinking: false },
    { x: 620, y: GAME_CONFIG.CANVAS_HEIGHT - 150, width: 16, height: 16, order: 4, group: 2, isCollected: false, isBlinking: false },
    
    // Second level
    { x: 120, y: GAME_CONFIG.CANVAS_HEIGHT - 210, width: 16, height: 16, order: 5, group: 3, isCollected: false, isBlinking: false },
    { x: 720, y: GAME_CONFIG.CANVAS_HEIGHT - 210, width: 16, height: 16, order: 6, group: 3, isCollected: false, isBlinking: false },
    
    // Third level
    { x: 320, y: GAME_CONFIG.CANVAS_HEIGHT - 270, width: 16, height: 16, order: 7, group: 4, isCollected: false, isBlinking: false },
    { x: 540, y: GAME_CONFIG.CANVAS_HEIGHT - 270, width: 16, height: 16, order: 8, group: 4, isCollected: false, isBlinking: false },
    
    // Fourth level
    { x: 170, y: GAME_CONFIG.CANVAS_HEIGHT - 330, width: 16, height: 16, order: 9, group: 5, isCollected: false, isBlinking: false },
    { x: 670, y: GAME_CONFIG.CANVAS_HEIGHT - 330, width: 16, height: 16, order: 10, group: 5, isCollected: false, isBlinking: false },
    
    // Fifth level
    { x: 420, y: GAME_CONFIG.CANVAS_HEIGHT - 390, width: 16, height: 16, order: 11, group: 6, isCollected: false, isBlinking: false },
    
    // Sixth level
    { x: 270, y: GAME_CONFIG.CANVAS_HEIGHT - 450, width: 16, height: 16, order: 12, group: 6, isCollected: false, isBlinking: false },
    { x: 570, y: GAME_CONFIG.CANVAS_HEIGHT - 450, width: 16, height: 16, order: 13, group: 6, isCollected: false, isBlinking: false },
    
    // Additional scattered bombs
    { x: 25, y: GAME_CONFIG.CANVAS_HEIGHT - 90, width: 16, height: 16, order: 14, group: 6, isCollected: false, isBlinking: false },
    { x: 775, y: GAME_CONFIG.CANVAS_HEIGHT - 90, width: 16, height: 16, order: 15, group: 6, isCollected: false, isBlinking: false },
    { x: 180, y: GAME_CONFIG.CANVAS_HEIGHT - 150, width: 16, height: 16, order: 16, group: 6, isCollected: false, isBlinking: false },
    { x: 620, y: GAME_CONFIG.CANVAS_HEIGHT - 150, width: 16, height: 16, order: 17, group: 6, isCollected: false, isBlinking: false },
    { x: 280, y: GAME_CONFIG.CANVAS_HEIGHT - 210, width: 16, height: 16, order: 18, group: 6, isCollected: false, isBlinking: false },
    { x: 520, y: GAME_CONFIG.CANVAS_HEIGHT - 210, width: 16, height: 16, order: 19, group: 6, isCollected: false, isBlinking: false },
    { x: 370, y: GAME_CONFIG.CANVAS_HEIGHT - 270, width: 16, height: 16, order: 20, group: 6, isCollected: false, isBlinking: false },
    { x: 470, y: GAME_CONFIG.CANVAS_HEIGHT - 270, width: 16, height: 16, order: 21, group: 6, isCollected: false, isBlinking: false },
    { x: 220, y: GAME_CONFIG.CANVAS_HEIGHT - 330, width: 16, height: 16, order: 22, group: 6, isCollected: false, isBlinking: false },
    { x: 580, y: GAME_CONFIG.CANVAS_HEIGHT - 330, width: 16, height: 16, order: 23, group: 6, isCollected: false, isBlinking: false }
  ],
  
  monsters: [
    {
      x: 150,
      y: GAME_CONFIG.CANVAS_HEIGHT - 70,
      width: GAME_CONFIG.MONSTER_SIZE,
      height: GAME_CONFIG.MONSTER_SIZE,
      color: COLORS.MONSTER,
      type: MonsterType.HORIZONTAL_PATROL,
      patrolStartX: 100,
      patrolEndX: 300,
      speed: 4,
      direction: 1,
      isActive: true
    },
    {
      x: 650,
      y: GAME_CONFIG.CANVAS_HEIGHT - 130,
      width: GAME_CONFIG.MONSTER_SIZE,
      height: GAME_CONFIG.MONSTER_SIZE,
      color: COLORS.MONSTER,
      type: MonsterType.HORIZONTAL_PATROL,
      patrolStartX: 600,
      patrolEndX: 800,
      speed: 4.2,
      direction: -1,
      isActive: true
    },
    {
      x: 300,
      y: GAME_CONFIG.CANVAS_HEIGHT - 170,
      width: GAME_CONFIG.MONSTER_SIZE,
      height: GAME_CONFIG.MONSTER_SIZE,
      color: COLORS.MONSTER,
      type: MonsterType.HORIZONTAL_PATROL,
      patrolStartX: 250,
      patrolEndX: 450,
      speed: 3.8,
      direction: 1,
      isActive: true
    },
    {
      x: 500,
      y: GAME_CONFIG.CANVAS_HEIGHT - 290,
      width: GAME_CONFIG.MONSTER_SIZE,
      height: GAME_CONFIG.MONSTER_SIZE,
      color: COLORS.MONSTER,
      type: MonsterType.HORIZONTAL_PATROL,
      patrolStartX: 450,
      patrolEndX: 650,
      speed: 3.6,
      direction: -1,
      isActive: true
    },
    {
      x: 400,
      y: GAME_CONFIG.CANVAS_HEIGHT - 350,
      width: GAME_CONFIG.MONSTER_SIZE,
      height: GAME_CONFIG.MONSTER_SIZE,
      color: COLORS.MONSTER,
      type: MonsterType.HORIZONTAL_PATROL,
      patrolStartX: 350,
      patrolEndX: 550,
      speed: 4,
      direction: 1,
      isActive: true
    }
  ],
  
  coinSpawnPoints: [
    // Power coin spawn points for level 5 - only 2 per map with non-cardinal angles
    { x: 300, y: GAME_CONFIG.CANVAS_HEIGHT - 100, type: CoinType.POWER, spawnAngle: 165 },
    { x: 500, y: GAME_CONFIG.CANVAS_HEIGHT - 140, type: CoinType.POWER, spawnAngle: 15 }
  ]
};

export const level6Map: MapDefinition = {
  id: 'level6',
  name: 'Skatteetaten',
  width: GAME_CONFIG.CANVAS_WIDTH,
  height: GAME_CONFIG.CANVAS_HEIGHT,
  playerStartX: 50,
  playerStartY: GAME_CONFIG.CANVAS_HEIGHT - 150,
  backgroundColor: COLORS.BACKGROUND,
  theme: 'environment',
  groupSequence: [1, 2, 3, 4, 5, 6],
  difficulty: 6,
  
  ground: {
    x: 0,
    y: GAME_CONFIG.CANVAS_HEIGHT - 40,
    width: GAME_CONFIG.CANVAS_WIDTH,
    height: 40,
    color: COLORS.GROUND
  },
  
  platforms: [
    // Minimal ground access
    { x: 25, y: GAME_CONFIG.CANVAS_HEIGHT - 60, width: 40, height: 20, color: COLORS.PLATFORM },
    { x: 775, y: GAME_CONFIG.CANVAS_HEIGHT - 60, width: 40, height: 20, color: COLORS.PLATFORM },
    
    // Vertical tower platforms
    { x: 150, y: GAME_CONFIG.CANVAS_HEIGHT - 100, width: 50, height: 20, color: COLORS.PLATFORM },
    { x: 150, y: GAME_CONFIG.CANVAS_HEIGHT - 160, width: 50, height: 20, color: COLORS.PLATFORM },
    { x: 150, y: GAME_CONFIG.CANVAS_HEIGHT - 220, width: 50, height: 20, color: COLORS.PLATFORM },
    { x: 150, y: GAME_CONFIG.CANVAS_HEIGHT - 280, width: 50, height: 20, color: COLORS.PLATFORM },
    { x: 150, y: GAME_CONFIG.CANVAS_HEIGHT - 340, width: 50, height: 20, color: COLORS.PLATFORM },
    { x: 150, y: GAME_CONFIG.CANVAS_HEIGHT - 400, width: 50, height: 20, color: COLORS.PLATFORM },
    
    // Right tower platforms
    { x: 650, y: GAME_CONFIG.CANVAS_HEIGHT - 100, width: 50, height: 20, color: COLORS.PLATFORM },
    { x: 650, y: GAME_CONFIG.CANVAS_HEIGHT - 160, width: 50, height: 20, color: COLORS.PLATFORM },
    { x: 650, y: GAME_CONFIG.CANVAS_HEIGHT - 220, width: 50, height: 20, color: COLORS.PLATFORM },
    { x: 650, y: GAME_CONFIG.CANVAS_HEIGHT - 280, width: 50, height: 20, color: COLORS.PLATFORM },
    { x: 650, y: GAME_CONFIG.CANVAS_HEIGHT - 340, width: 50, height: 20, color: COLORS.PLATFORM },
    { x: 650, y: GAME_CONFIG.CANVAS_HEIGHT - 400, width: 50, height: 20, color: COLORS.PLATFORM },
    
    // Connecting platforms
    { x: 300, y: GAME_CONFIG.CANVAS_HEIGHT - 140, width: 60, height: 20, color: COLORS.PLATFORM },
    { x: 500, y: GAME_CONFIG.CANVAS_HEIGHT - 140, width: 60, height: 20, color: COLORS.PLATFORM },
    { x: 400, y: GAME_CONFIG.CANVAS_HEIGHT - 200, width: 60, height: 20, color: COLORS.PLATFORM },
    { x: 300, y: GAME_CONFIG.CANVAS_HEIGHT - 260, width: 60, height: 20, color: COLORS.PLATFORM },
    { x: 500, y: GAME_CONFIG.CANVAS_HEIGHT - 260, width: 60, height: 20, color: COLORS.PLATFORM },
    { x: 400, y: GAME_CONFIG.CANVAS_HEIGHT - 320, width: 60, height: 20, color: COLORS.PLATFORM },
    { x: 300, y: GAME_CONFIG.CANVAS_HEIGHT - 380, width: 60, height: 20, color: COLORS.PLATFORM },
    { x: 500, y: GAME_CONFIG.CANVAS_HEIGHT - 380, width: 60, height: 20, color: COLORS.PLATFORM }
  ],
  
  bombs: [
    // Ground level
    { x: 45, y: GAME_CONFIG.CANVAS_HEIGHT - 70, width: 16, height: 16, order: 1, group: 1, isCollected: false, isBlinking: false },
    { x: 795, y: GAME_CONFIG.CANVAS_HEIGHT - 70, width: 16, height: 16, order: 2, group: 1, isCollected: false, isBlinking: false },
    
    // Left tower
    { x: 170, y: GAME_CONFIG.CANVAS_HEIGHT - 130, width: 16, height: 16, order: 3, group: 2, isCollected: false, isBlinking: false },
    { x: 170, y: GAME_CONFIG.CANVAS_HEIGHT - 190, width: 16, height: 16, order: 4, group: 2, isCollected: false, isBlinking: false },
    { x: 170, y: GAME_CONFIG.CANVAS_HEIGHT - 250, width: 16, height: 16, order: 5, group: 2, isCollected: false, isBlinking: false },
    { x: 170, y: GAME_CONFIG.CANVAS_HEIGHT - 310, width: 16, height: 16, order: 6, group: 2, isCollected: false, isBlinking: false },
    { x: 170, y: GAME_CONFIG.CANVAS_HEIGHT - 370, width: 16, height: 16, order: 7, group: 2, isCollected: false, isBlinking: false },
    { x: 170, y: GAME_CONFIG.CANVAS_HEIGHT - 430, width: 16, height: 16, order: 8, group: 2, isCollected: false, isBlinking: false },
    
    // Right tower
    { x: 670, y: GAME_CONFIG.CANVAS_HEIGHT - 130, width: 16, height: 16, order: 9, group: 3, isCollected: false, isBlinking: false },
    { x: 670, y: GAME_CONFIG.CANVAS_HEIGHT - 190, width: 16, height: 16, order: 10, group: 3, isCollected: false, isBlinking: false },
    { x: 670, y: GAME_CONFIG.CANVAS_HEIGHT - 250, width: 16, height: 16, order: 11, group: 3, isCollected: false, isBlinking: false },
    { x: 670, y: GAME_CONFIG.CANVAS_HEIGHT - 310, width: 16, height: 16, order: 12, group: 3, isCollected: false, isBlinking: false },
    { x: 670, y: GAME_CONFIG.CANVAS_HEIGHT - 370, width: 16, height: 16, order: 13, group: 3, isCollected: false, isBlinking: false },
    { x: 670, y: GAME_CONFIG.CANVAS_HEIGHT - 430, width: 16, height: 16, order: 14, group: 3, isCollected: false, isBlinking: false },
    
    // Connecting platforms
    { x: 320, y: GAME_CONFIG.CANVAS_HEIGHT - 170, width: 16, height: 16, order: 15, group: 4, isCollected: false, isBlinking: false },
    { x: 520, y: GAME_CONFIG.CANVAS_HEIGHT - 170, width: 16, height: 16, order: 16, group: 4, isCollected: false, isBlinking: false },
    { x: 420, y: GAME_CONFIG.CANVAS_HEIGHT - 230, width: 16, height: 16, order: 17, group: 4, isCollected: false, isBlinking: false },
    { x: 320, y: GAME_CONFIG.CANVAS_HEIGHT - 290, width: 16, height: 16, order: 18, group: 4, isCollected: false, isBlinking: false },
    { x: 520, y: GAME_CONFIG.CANVAS_HEIGHT - 290, width: 16, height: 16, order: 19, group: 4, isCollected: false, isBlinking: false },
    { x: 420, y: GAME_CONFIG.CANVAS_HEIGHT - 350, width: 16, height: 16, order: 20, group: 4, isCollected: false, isBlinking: false },
    { x: 320, y: GAME_CONFIG.CANVAS_HEIGHT - 410, width: 16, height: 16, order: 21, group: 4, isCollected: false, isBlinking: false },
    { x: 520, y: GAME_CONFIG.CANVAS_HEIGHT - 410, width: 16, height: 16, order: 22, group: 4, isCollected: false, isBlinking: false },
    
    // Final bomb
    { x: 400, y: GAME_CONFIG.CANVAS_HEIGHT - 470, width: 16, height: 16, order: 23, group: 4, isCollected: false, isBlinking: false }
  ],
  
  monsters: [
    {
      x: 150,
      y: GAME_CONFIG.CANVAS_HEIGHT - 70,
      width: GAME_CONFIG.MONSTER_SIZE,
      height: GAME_CONFIG.MONSTER_SIZE,
      color: COLORS.MONSTER,
      type: MonsterType.HORIZONTAL_PATROL,
      patrolStartX: 100,
      patrolEndX: 300,
      speed: 4,
      direction: 1,
      isActive: true
    },
    {
      x: 650,
      y: GAME_CONFIG.CANVAS_HEIGHT - 130,
      width: GAME_CONFIG.MONSTER_SIZE,
      height: GAME_CONFIG.MONSTER_SIZE,
      color: COLORS.MONSTER,
      type: MonsterType.HORIZONTAL_PATROL,
      patrolStartX: 600,
      patrolEndX: 800,
      speed: 4.2,
      direction: -1,
      isActive: true
    },
    {
      x: 200,
      y: GAME_CONFIG.CANVAS_HEIGHT - 150,
      width: GAME_CONFIG.MONSTER_SIZE,
      height: GAME_CONFIG.MONSTER_SIZE,
      color: COLORS.MONSTER,
      type: MonsterType.HORIZONTAL_PATROL,
      patrolStartX: 150,
      patrolEndX: 350,
      speed: 3.8,
      direction: 1,
      isActive: true
    },
    {
      x: 620,
      y: GAME_CONFIG.CANVAS_HEIGHT - 190,
      width: GAME_CONFIG.MONSTER_SIZE,
      height: GAME_CONFIG.MONSTER_SIZE,
      color: COLORS.MONSTER,
      type: MonsterType.HORIZONTAL_PATROL,
      patrolStartX: 570,
      patrolEndX: 770,
      speed: 4.5,
      direction: -1,
      isActive: true
    },
    {
      x: 400,
      y: GAME_CONFIG.CANVAS_HEIGHT - 310,
      width: GAME_CONFIG.MONSTER_SIZE,
      height: GAME_CONFIG.MONSTER_SIZE,
      color: COLORS.MONSTER,
      type: MonsterType.HORIZONTAL_PATROL,
      patrolStartX: 350,
      patrolEndX: 550,
      speed: 4.8,
      direction: 1,
      isActive: true
    },
    {
      x: 250,
      y: GAME_CONFIG.CANVAS_HEIGHT - 390,
      width: GAME_CONFIG.MONSTER_SIZE,
      height: GAME_CONFIG.MONSTER_SIZE,
      color: COLORS.MONSTER,
      type: MonsterType.HORIZONTAL_PATROL,
      patrolStartX: 200,
      patrolEndX: 400,
      speed: 5,
      direction: -1,
      isActive: true
    }
  ],
  
  coinSpawnPoints: [
    // Power coin spawn points for level 6 - only 2 per map with non-cardinal angles
    { x: 400, y: GAME_CONFIG.CANVAS_HEIGHT - 120, type: CoinType.POWER, spawnAngle: 195 },
    { x: 400, y: GAME_CONFIG.CANVAS_HEIGHT - 180, type: CoinType.POWER, spawnAngle: 345 }
  ]
};

export const level7Map: MapDefinition = {
  id: 'level7',
  name: 'Silicon Valley',
  width: GAME_CONFIG.CANVAS_WIDTH,
  height: GAME_CONFIG.CANVAS_HEIGHT,
  playerStartX: 50,
  playerStartY: GAME_CONFIG.CANVAS_HEIGHT - 150,
  backgroundColor: COLORS.BACKGROUND,
  theme: 'finance',
  groupSequence: [1, 2, 3, 4, 5, 6],
  difficulty: 7,
  
  ground: {
    x: 0,
    y: GAME_CONFIG.CANVAS_HEIGHT - 40,
    width: GAME_CONFIG.CANVAS_WIDTH,
    height: 40,
    color: COLORS.GROUND
  },
  
  platforms: [
    // Minimal ground access
    { x: 20, y: GAME_CONFIG.CANVAS_HEIGHT - 60, width: 30, height: 20, color: COLORS.PLATFORM },
    { x: 790, y: GAME_CONFIG.CANVAS_HEIGHT - 60, width: 30, height: 20, color: COLORS.PLATFORM },
    
    // Complex maze-like structure
    { x: 100, y: GAME_CONFIG.CANVAS_HEIGHT - 80, width: 40, height: 20, color: COLORS.PLATFORM },
    { x: 720, y: GAME_CONFIG.CANVAS_HEIGHT - 80, width: 40, height: 20, color: COLORS.PLATFORM },
    
    { x: 200, y: GAME_CONFIG.CANVAS_HEIGHT - 120, width: 50, height: 20, color: COLORS.PLATFORM },
    { x: 620, y: GAME_CONFIG.CANVAS_HEIGHT - 120, width: 50, height: 20, color: COLORS.PLATFORM },
    
    { x: 50, y: GAME_CONFIG.CANVAS_HEIGHT - 160, width: 40, height: 20, color: COLORS.PLATFORM },
    { x: 770, y: GAME_CONFIG.CANVAS_HEIGHT - 160, width: 40, height: 20, color: COLORS.PLATFORM },
    
    { x: 300, y: GAME_CONFIG.CANVAS_HEIGHT - 200, width: 60, height: 20, color: COLORS.PLATFORM },
    { x: 520, y: GAME_CONFIG.CANVAS_HEIGHT - 200, width: 60, height: 20, color: COLORS.PLATFORM },
    
    { x: 150, y: GAME_CONFIG.CANVAS_HEIGHT - 240, width: 50, height: 20, color: COLORS.PLATFORM },
    { x: 670, y: GAME_CONFIG.CANVAS_HEIGHT - 240, width: 50, height: 20, color: COLORS.PLATFORM },
    
    { x: 400, y: GAME_CONFIG.CANVAS_HEIGHT - 280, width: 80, height: 20, color: COLORS.PLATFORM },
    
    { x: 100, y: GAME_CONFIG.CANVAS_HEIGHT - 320, width: 50, height: 20, color: COLORS.PLATFORM },
    { x: 720, y: GAME_CONFIG.CANVAS_HEIGHT - 320, width: 50, height: 20, color: COLORS.PLATFORM },
    
    { x: 250, y: GAME_CONFIG.CANVAS_HEIGHT - 360, width: 60, height: 20, color: COLORS.PLATFORM },
    { x: 570, y: GAME_CONFIG.CANVAS_HEIGHT - 360, width: 60, height: 20, color: COLORS.PLATFORM },
    
    { x: 400, y: GAME_CONFIG.CANVAS_HEIGHT - 400, width: 80, height: 20, color: COLORS.PLATFORM },
    
    { x: 50, y: GAME_CONFIG.CANVAS_HEIGHT - 440, width: 40, height: 20, color: COLORS.PLATFORM },
    { x: 770, y: GAME_CONFIG.CANVAS_HEIGHT - 440, width: 40, height: 20, color: COLORS.PLATFORM }
  ],
  
  bombs: [
    // Ground level
    { x: 35, y: GAME_CONFIG.CANVAS_HEIGHT - 70, width: 16, height: 16, order: 1, group: 1, isCollected: false, isBlinking: false },
    { x: 805, y: GAME_CONFIG.CANVAS_HEIGHT - 70, width: 16, height: 16, order: 2, group: 1, isCollected: false, isBlinking: false },
    
    // First level
    { x: 110, y: GAME_CONFIG.CANVAS_HEIGHT - 110, width: 16, height: 16, order: 3, group: 2, isCollected: false, isBlinking: false },
    { x: 730, y: GAME_CONFIG.CANVAS_HEIGHT - 110, width: 16, height: 16, order: 4, group: 2, isCollected: false, isBlinking: false },
    
    // Second level
    { x: 220, y: GAME_CONFIG.CANVAS_HEIGHT - 150, width: 16, height: 16, order: 5, group: 3, isCollected: false, isBlinking: false },
    { x: 640, y: GAME_CONFIG.CANVAS_HEIGHT - 150, width: 16, height: 16, order: 6, group: 3, isCollected: false, isBlinking: false },
    
    // Third level
    { x: 60, y: GAME_CONFIG.CANVAS_HEIGHT - 190, width: 16, height: 16, order: 7, group: 4, isCollected: false, isBlinking: false },
    { x: 780, y: GAME_CONFIG.CANVAS_HEIGHT - 190, width: 16, height: 16, order: 8, group: 4, isCollected: false, isBlinking: false },
    
    // Fourth level
    { x: 320, y: GAME_CONFIG.CANVAS_HEIGHT - 230, width: 16, height: 16, order: 9, group: 5, isCollected: false, isBlinking: false },
    { x: 540, y: GAME_CONFIG.CANVAS_HEIGHT - 230, width: 16, height: 16, order: 10, group: 5, isCollected: false, isBlinking: false },
    
    // Fifth level
    { x: 170, y: GAME_CONFIG.CANVAS_HEIGHT - 270, width: 16, height: 16, order: 11, group: 6, isCollected: false, isBlinking: false },
    { x: 690, y: GAME_CONFIG.CANVAS_HEIGHT - 270, width: 16, height: 16, order: 12, group: 6, isCollected: false, isBlinking: false },
    
    // Sixth level
    { x: 420, y: GAME_CONFIG.CANVAS_HEIGHT - 310, width: 16, height: 16, order: 13, group: 6, isCollected: false, isBlinking: false },
    
    // Seventh level
    { x: 120, y: GAME_CONFIG.CANVAS_HEIGHT - 350, width: 16, height: 16, order: 14, group: 6, isCollected: false, isBlinking: false },
    { x: 740, y: GAME_CONFIG.CANVAS_HEIGHT - 350, width: 16, height: 16, order: 15, group: 6, isCollected: false, isBlinking: false },
    
    // Eighth level
    { x: 270, y: GAME_CONFIG.CANVAS_HEIGHT - 390, width: 16, height: 16, order: 16, group: 6, isCollected: false, isBlinking: false },
    { x: 590, y: GAME_CONFIG.CANVAS_HEIGHT - 390, width: 16, height: 16, order: 17, group: 6, isCollected: false, isBlinking: false },
    
    // Ninth level
    { x: 420, y: GAME_CONFIG.CANVAS_HEIGHT - 430, width: 16, height: 16, order: 18, group: 6, isCollected: false, isBlinking: false },
    
    // Final level
    { x: 70, y: GAME_CONFIG.CANVAS_HEIGHT - 470, width: 16, height: 16, order: 19, group: 6, isCollected: false, isBlinking: false },
    { x: 790, y: GAME_CONFIG.CANVAS_HEIGHT - 470, width: 16, height: 16, order: 20, group: 6, isCollected: false, isBlinking: false },
    
    // Additional scattered bombs
    { x: 15, y: GAME_CONFIG.CANVAS_HEIGHT - 90, width: 16, height: 16, order: 21, group: 6, isCollected: false, isBlinking: false },
    { x: 785, y: GAME_CONFIG.CANVAS_HEIGHT - 90, width: 16, height: 16, order: 22, group: 6, isCollected: false, isBlinking: false },
    { x: 400, y: GAME_CONFIG.CANVAS_HEIGHT - 350, width: 16, height: 16, order: 23, group: 6, isCollected: false, isBlinking: false }
  ],
  
  monsters: [
    {
      x: 100,
      y: GAME_CONFIG.CANVAS_HEIGHT - 70,
      width: GAME_CONFIG.MONSTER_SIZE,
      height: GAME_CONFIG.MONSTER_SIZE,
      color: COLORS.MONSTER,
      type: MonsterType.HORIZONTAL_PATROL,
      patrolStartX: 50,
      patrolEndX: 250,
      speed: 4,
      direction: 1,
      isActive: true
    },
    {
      x: 720,
      y: GAME_CONFIG.CANVAS_HEIGHT - 110,
      width: GAME_CONFIG.MONSTER_SIZE,
      height: GAME_CONFIG.MONSTER_SIZE,
      color: COLORS.MONSTER,
      type: MonsterType.HORIZONTAL_PATROL,
      patrolStartX: 670,
      patrolEndX: 870,
      speed: 4.2,
      direction: -1,
      isActive: true
    },
    {
      x: 200,
      y: GAME_CONFIG.CANVAS_HEIGHT - 150,
      width: GAME_CONFIG.MONSTER_SIZE,
      height: GAME_CONFIG.MONSTER_SIZE,
      color: COLORS.MONSTER,
      type: MonsterType.HORIZONTAL_PATROL,
      patrolStartX: 150,
      patrolEndX: 350,
      speed: 3.8,
      direction: 1,
      isActive: true
    },
    {
      x: 620,
      y: GAME_CONFIG.CANVAS_HEIGHT - 190,
      width: GAME_CONFIG.MONSTER_SIZE,
      height: GAME_CONFIG.MONSTER_SIZE,
      color: COLORS.MONSTER,
      type: MonsterType.HORIZONTAL_PATROL,
      patrolStartX: 570,
      patrolEndX: 770,
      speed: 4.5,
      direction: -1,
      isActive: true
    },
    {
      x: 400,
      y: GAME_CONFIG.CANVAS_HEIGHT - 310,
      width: GAME_CONFIG.MONSTER_SIZE,
      height: GAME_CONFIG.MONSTER_SIZE,
      color: COLORS.MONSTER,
      type: MonsterType.HORIZONTAL_PATROL,
      patrolStartX: 350,
      patrolEndX: 550,
      speed: 4.8,
      direction: 1,
      isActive: true
    },
    {
      x: 250,
      y: GAME_CONFIG.CANVAS_HEIGHT - 390,
      width: GAME_CONFIG.MONSTER_SIZE,
      height: GAME_CONFIG.MONSTER_SIZE,
      color: COLORS.MONSTER,
      type: MonsterType.HORIZONTAL_PATROL,
      patrolStartX: 200,
      patrolEndX: 400,
      speed: 5,
      direction: -1,
      isActive: true
    }
  ],
  
  coinSpawnPoints: [
    // Power coin spawn points for level 7 - only 2 per map with non-cardinal angles
    { x: 350, y: GAME_CONFIG.CANVAS_HEIGHT - 100, type: CoinType.POWER, spawnAngle: 225 },
    { x: 450, y: GAME_CONFIG.CANVAS_HEIGHT - 160, type: CoinType.POWER, spawnAngle: 315 }
  ]
};

export const mapDefinitions = [level1Map, level2Map, level3Map, level4Map, level5Map, level6Map, level7Map];