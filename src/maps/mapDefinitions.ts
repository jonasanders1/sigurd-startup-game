import { MapDefinition, Bomb } from "../types/interfaces";
import { GAME_CONFIG, COLORS } from "../types/constants";
import { MonsterType, CoinType } from "../types/enums";

// Function to create background configuration based on parallax settings
const createBackgroundConfig = (mapName: string) => {
  return {
    background: GAME_CONFIG.PARALLAX_ENABLED ? mapName : COLORS.BACKGROUND,
  };
};

// Helper function to create bombs with default size
const createBomb = (
  x: number,
  y: number,
  order: number,
  group: number
): Bomb => ({
  x,
  y,
  width: GAME_CONFIG.BOMB_SIZE,
  height: GAME_CONFIG.BOMB_SIZE,
  order,
  group,
  isCollected: false,
  isBlinking: false,
});

// Bomb Jack Level 1 - Classic layout with symmetrical platforms
export const level1Map: MapDefinition = {
  id: "level1",
  name: "Taco Street",
  width: GAME_CONFIG.CANVAS_WIDTH,
  height: GAME_CONFIG.CANVAS_HEIGHT,
  playerStartX: 100,
  playerStartY: GAME_CONFIG.CANVAS_HEIGHT - 150,
  ...createBackgroundConfig("Taco Street"),

  groupSequence: [1, 2, 3, 4, 5],
  difficulty: 1,

  ground: {
    x: 0,
    y: GAME_CONFIG.CANVAS_HEIGHT - 40,
    width: GAME_CONFIG.CANVAS_WIDTH,
    height: 40,
    color: "#46474c",
  },

  platforms: [
    // Bottom platforms
    {
      x: 100,
      y: GAME_CONFIG.CANVAS_HEIGHT - 120,
      width: 120,
      height: 20,
      color: "#fff",
    },
    {
      x: 580,
      y: GAME_CONFIG.CANVAS_HEIGHT - 120,
      width: 120,
      height: 20,
      color: "#fff",
    },

    // Middle platforms
    {
      x: 200,
      y: GAME_CONFIG.CANVAS_HEIGHT - 200,
      width: 100,
      height: 20,
      color: "#fff",
    },
    {
      x: 500,
      y: GAME_CONFIG.CANVAS_HEIGHT - 200,
      width: 100,
      height: 20,
      color: "#fff",
    },

    // Upper platforms
    {
      x: 50,
      y: GAME_CONFIG.CANVAS_HEIGHT - 280,
      width: 80,
      height: 20,
      color: "#fff",
    },
    {
      x: 670,
      y: GAME_CONFIG.CANVAS_HEIGHT - 280,
      width: 80,
      height: 20,
      color: "#fff",
    },

    // Top platforms
    {
      x: 150,
      y: GAME_CONFIG.CANVAS_HEIGHT - 360,
      width: 100,
      height: 20,
      color: "#fff",
    },
    {
      x: 550,
      y: GAME_CONFIG.CANVAS_HEIGHT - 360,
      width: 100,
      height: 20,
      color: "#fff",
    },

    // Highest platform
    {
      x: 350,
      y: GAME_CONFIG.CANVAS_HEIGHT - 440,
      width: 100,
      height: 20,
      color: "#fff",
    },
  ],

  bombs: [
    // Ground level bombs
    createBomb(120, GAME_CONFIG.CANVAS_HEIGHT - 70, 1, 1),
    createBomb(600, GAME_CONFIG.CANVAS_HEIGHT - 70, 2, 1),
    createBomb(380, GAME_CONFIG.CANVAS_HEIGHT - 70, 3, 1),

    // Bottom platform bombs
    createBomb(130, GAME_CONFIG.CANVAS_HEIGHT - 150, 4, 2),
    createBomb(610, GAME_CONFIG.CANVAS_HEIGHT - 150, 5, 2),

    // Middle platform bombs
    createBomb(220, GAME_CONFIG.CANVAS_HEIGHT - 230, 6, 3),
    createBomb(520, GAME_CONFIG.CANVAS_HEIGHT - 230, 7, 3),

    // Upper platform bombs
    createBomb(70, GAME_CONFIG.CANVAS_HEIGHT - 310, 8, 4),
    createBomb(690, GAME_CONFIG.CANVAS_HEIGHT - 310, 9, 4),

    // Top platform bombs
    createBomb(170, GAME_CONFIG.CANVAS_HEIGHT - 390, 10, 5),
    createBomb(570, GAME_CONFIG.CANVAS_HEIGHT - 390, 11, 5),

    // Highest platform bombs
    createBomb(370, GAME_CONFIG.CANVAS_HEIGHT - 470, 12, 5),

    // Additional scattered bombs
    createBomb(50, GAME_CONFIG.CANVAS_HEIGHT - 100, 13, 5),
    createBomb(750, GAME_CONFIG.CANVAS_HEIGHT - 100, 14, 5),
    createBomb(300, GAME_CONFIG.CANVAS_HEIGHT - 150, 15, 5),
    createBomb(500, GAME_CONFIG.CANVAS_HEIGHT - 150, 16, 5),
    createBomb(200, GAME_CONFIG.CANVAS_HEIGHT - 200, 17, 5),
    createBomb(600, GAME_CONFIG.CANVAS_HEIGHT - 200, 18, 5),
    createBomb(100, GAME_CONFIG.CANVAS_HEIGHT - 250, 19, 5),
    createBomb(700, GAME_CONFIG.CANVAS_HEIGHT - 250, 20, 5),
    createBomb(250, GAME_CONFIG.CANVAS_HEIGHT - 300, 21, 5),
    createBomb(550, GAME_CONFIG.CANVAS_HEIGHT - 300, 22, 5),
    createBomb(400, GAME_CONFIG.CANVAS_HEIGHT - 350, 23, 5),
  ],

  coinSpawnPoints: [
    {
      x: 400,
      y: GAME_CONFIG.CANVAS_HEIGHT - 150,
      type: CoinType.POWER,
      spawnAngle: 45,
    },
    {
      x: 400,
      y: GAME_CONFIG.CANVAS_HEIGHT - 250,
      type: CoinType.POWER,
      spawnAngle: 135,
    },
  ],

  monsterSpawnPoints: [
    // Test monster - spawns immediately
    {
      x: 400,
      y: GAME_CONFIG.CANVAS_HEIGHT - 70,
      type: MonsterType.HORIZONTAL_PATROL,
      spawnDelay: 0, // Spawn immediately
      patrolStartX: 300,
      patrolEndX: 500,
      speed: 1.0,
    },
    // Another test monster - spawns immediately at different location
    {
      x: 600,
      y: GAME_CONFIG.CANVAS_HEIGHT - 100,
      type: MonsterType.VERTICAL_PATROL,
      spawnDelay: 0, // Spawn immediately
      patrolStartY: GAME_CONFIG.CANVAS_HEIGHT - 150,
      patrolEndY: GAME_CONFIG.CANVAS_HEIGHT - 50,
      speed: 1.5,
    },
    // Early spawns (0-10 seconds)
    {
      x: 100,
      y: GAME_CONFIG.CANVAS_HEIGHT - 70,
      type: MonsterType.HORIZONTAL_PATROL,
      spawnDelay: 5000, // 5 seconds
      patrolStartX: 50,
      patrolEndX: 200,
      speed: 1.0,
    },
    {
      x: 700,
      y: GAME_CONFIG.CANVAS_HEIGHT - 70,
      type: MonsterType.HORIZONTAL_PATROL,
      spawnDelay: 8000, // 8 seconds
      patrolStartX: 650,
      patrolEndX: 750,
      speed: 1.2,
    },

    // Mid-game spawns (15-30 seconds)
    {
      x: 50,
      y: GAME_CONFIG.CANVAS_HEIGHT - 100,
      type: MonsterType.VERTICAL_PATROL,
      spawnDelay: 15000, // 15 seconds
      patrolStartY: GAME_CONFIG.CANVAS_HEIGHT - 200,
      patrolEndY: GAME_CONFIG.CANVAS_HEIGHT - 50,
      speed: 1.0,
    },
    {
      x: 750,
      y: GAME_CONFIG.CANVAS_HEIGHT - 100,
      type: MonsterType.VERTICAL_PATROL,
      spawnDelay: 20000, // 20 seconds
      patrolStartY: GAME_CONFIG.CANVAS_HEIGHT - 200,
      patrolEndY: GAME_CONFIG.CANVAS_HEIGHT - 50,
      speed: 1.2,
    },

    // Late game spawns (45-60 seconds)
    {
      x: 0,
      y: GAME_CONFIG.CANVAS_HEIGHT - 70,
      type: MonsterType.CHASER,
      spawnDelay: 45000, // 45 seconds
      speed: 1.5,
    },
    {
      x: 200,
      y: GAME_CONFIG.CANVAS_HEIGHT - 200,
      type: MonsterType.AMBUSHER,
      spawnDelay: 60000, // 60 seconds
      speed: 1.8,
    },
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
      speed: 1,
      direction: 1,
      isActive: true,
    },
    {
      x: 200,
      y: GAME_CONFIG.CANVAS_HEIGHT - 230,
      width: GAME_CONFIG.MONSTER_SIZE,
      height: GAME_CONFIG.MONSTER_SIZE,
      color: COLORS.MONSTER,
      type: MonsterType.HORIZONTAL_PATROL,
      patrolStartX: 150,
      patrolEndX: 350,
      speed: 1.2,
      direction: -1,
      isActive: true,
    },
  ],
};

// Bomb Jack Level 2 - More complex layout with staggered platforms
export const level2Map: MapDefinition = {
  id: "level2",
  name: "The Future City",
  width: GAME_CONFIG.CANVAS_WIDTH,
  height: GAME_CONFIG.CANVAS_HEIGHT,
  playerStartX: 50,
  playerStartY: GAME_CONFIG.CANVAS_HEIGHT - 150,
  ...createBackgroundConfig("The Future City"),

  groupSequence: [1, 2, 3, 4, 5],
  difficulty: 2,

  ground: {
    x: 0,
    y: GAME_CONFIG.CANVAS_HEIGHT - 40,
    width: GAME_CONFIG.CANVAS_WIDTH,
    height: 40,
    color: COLORS.GROUND,
  },

  platforms: [
    // Bottom platforms - staggered
    {
      x: 50,
      y: GAME_CONFIG.CANVAS_HEIGHT - 100,
      width: 80,
      height: 20,
      color: COLORS.PLATFORM,
    },
    {
      x: 250,
      y: GAME_CONFIG.CANVAS_HEIGHT - 120,
      width: 80,
      height: 20,
      color: COLORS.PLATFORM,
    },
    {
      x: 450,
      y: GAME_CONFIG.CANVAS_HEIGHT - 100,
      width: 80,
      height: 20,
      color: COLORS.PLATFORM,
    },
    {
      x: 650,
      y: GAME_CONFIG.CANVAS_HEIGHT - 120,
      width: 80,
      height: 20,
      color: COLORS.PLATFORM,
    },

    // Middle platforms
    {
      x: 150,
      y: GAME_CONFIG.CANVAS_HEIGHT - 180,
      width: 100,
      height: 20,
      color: COLORS.PLATFORM,
    },
    {
      x: 350,
      y: GAME_CONFIG.CANVAS_HEIGHT - 200,
      width: 100,
      height: 20,
      color: COLORS.PLATFORM,
    },
    {
      x: 550,
      y: GAME_CONFIG.CANVAS_HEIGHT - 180,
      width: 100,
      height: 20,
      color: COLORS.PLATFORM,
    },

    // Upper platforms
    {
      x: 100,
      y: GAME_CONFIG.CANVAS_HEIGHT - 260,
      width: 80,
      height: 20,
      color: COLORS.PLATFORM,
    },
    {
      x: 300,
      y: GAME_CONFIG.CANVAS_HEIGHT - 280,
      width: 80,
      height: 20,
      color: COLORS.PLATFORM,
    },
    {
      x: 500,
      y: GAME_CONFIG.CANVAS_HEIGHT - 260,
      width: 80,
      height: 20,
      color: COLORS.PLATFORM,
    },
    {
      x: 700,
      y: GAME_CONFIG.CANVAS_HEIGHT - 280,
      width: 80,
      height: 20,
      color: COLORS.PLATFORM,
    },

    // Top platforms
    {
      x: 200,
      y: GAME_CONFIG.CANVAS_HEIGHT - 340,
      width: 100,
      height: 20,
      color: COLORS.PLATFORM,
    },
    {
      x: 400,
      y: GAME_CONFIG.CANVAS_HEIGHT - 360,
      width: 100,
      height: 20,
      color: COLORS.PLATFORM,
    },
    {
      x: 600,
      y: GAME_CONFIG.CANVAS_HEIGHT - 340,
      width: 100,
      height: 20,
      color: COLORS.PLATFORM,
    },

    // Highest platforms
    {
      x: 150,
      y: GAME_CONFIG.CANVAS_HEIGHT - 420,
      width: 80,
      height: 20,
      color: COLORS.PLATFORM,
    },
    {
      x: 350,
      y: GAME_CONFIG.CANVAS_HEIGHT - 440,
      width: 80,
      height: 20,
      color: COLORS.PLATFORM,
    },
    {
      x: 550,
      y: GAME_CONFIG.CANVAS_HEIGHT - 420,
      width: 80,
      height: 20,
      color: COLORS.PLATFORM,
    },
  ],

  bombs: [
    // Ground level bombs
    createBomb(80, GAME_CONFIG.CANVAS_HEIGHT - 70, 1, 1),
    createBomb(280, GAME_CONFIG.CANVAS_HEIGHT - 70, 2, 1),
    createBomb(480, GAME_CONFIG.CANVAS_HEIGHT - 70, 3, 1),
    createBomb(680, GAME_CONFIG.CANVAS_HEIGHT - 70, 4, 1),

    // Bottom platform bombs
    createBomb(90, GAME_CONFIG.CANVAS_HEIGHT - 130, 5, 2),
    createBomb(290, GAME_CONFIG.CANVAS_HEIGHT - 150, 6, 2),
    createBomb(490, GAME_CONFIG.CANVAS_HEIGHT - 130, 7, 2),
    createBomb(690, GAME_CONFIG.CANVAS_HEIGHT - 150, 8, 2),

    // Middle platform bombs
    createBomb(170, GAME_CONFIG.CANVAS_HEIGHT - 210, 9, 3),
    createBomb(370, GAME_CONFIG.CANVAS_HEIGHT - 230, 10, 3),
    createBomb(570, GAME_CONFIG.CANVAS_HEIGHT - 210, 11, 3),

    // Upper platform bombs
    createBomb(120, GAME_CONFIG.CANVAS_HEIGHT - 290, 12, 4),
    createBomb(320, GAME_CONFIG.CANVAS_HEIGHT - 310, 13, 4),
    createBomb(520, GAME_CONFIG.CANVAS_HEIGHT - 290, 14, 4),
    createBomb(720, GAME_CONFIG.CANVAS_HEIGHT - 310, 15, 4),

    // Top platform bombs
    createBomb(220, GAME_CONFIG.CANVAS_HEIGHT - 370, 16, 5),
    createBomb(420, GAME_CONFIG.CANVAS_HEIGHT - 390, 17, 5),
    createBomb(620, GAME_CONFIG.CANVAS_HEIGHT - 370, 18, 5),

    // Highest platform bombs
    createBomb(170, GAME_CONFIG.CANVAS_HEIGHT - 450, 19, 5),
    createBomb(370, GAME_CONFIG.CANVAS_HEIGHT - 470, 20, 5),
    createBomb(570, GAME_CONFIG.CANVAS_HEIGHT - 450, 21, 5),

    // Additional scattered bombs
    createBomb(25, GAME_CONFIG.CANVAS_HEIGHT - 110, 22, 5),
    createBomb(775, GAME_CONFIG.CANVAS_HEIGHT - 110, 23, 5),
  ],

  coinSpawnPoints: [
    {
      x: 400,
      y: GAME_CONFIG.CANVAS_HEIGHT - 150,
      type: CoinType.POWER,
      spawnAngle: 60,
    },
    {
      x: 400,
      y: GAME_CONFIG.CANVAS_HEIGHT - 250,
      type: CoinType.POWER,
      spawnAngle: 120,
    },
  ],

  monsterSpawnPoints: [
    // More aggressive early spawns for level 2
    {
      x: 250,
      y: GAME_CONFIG.CANVAS_HEIGHT - 70,
      type: MonsterType.HORIZONTAL_PATROL,
      spawnDelay: 3000, // 3 seconds
      patrolStartX: 200,
      patrolEndX: 400,
      speed: 1.5,
    },
    {
      x: 450,
      y: GAME_CONFIG.CANVAS_HEIGHT - 130,
      type: MonsterType.HORIZONTAL_PATROL,
      spawnDelay: 6000, // 6 seconds
      patrolStartX: 400,
      patrolEndX: 600,
      speed: 1.8,
    },

    // Floaters for mid-game
    {
      x: 100,
      y: GAME_CONFIG.CANVAS_HEIGHT - 150,
      type: MonsterType.FLOATER,
      spawnDelay: 12000, // 12 seconds
      speed: 0.8,
    },
    {
      x: 700,
      y: GAME_CONFIG.CANVAS_HEIGHT - 150,
      type: MonsterType.FLOATER,
      spawnDelay: 15000, // 15 seconds
      speed: 0.8,
    },

    // Chasers and ambushers for late game
    {
      x: 150,
      y: GAME_CONFIG.CANVAS_HEIGHT - 210,
      type: MonsterType.AMBUSHER,
      spawnDelay: 25000, // 25 seconds
      speed: 2.0,
    },
    {
      x: 600,
      y: GAME_CONFIG.CANVAS_HEIGHT - 70,
      type: MonsterType.CHASER,
      spawnDelay: 35000, // 35 seconds
      speed: 1.8,
    },
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
      isActive: true,
    },
    {
      x: 450,
      y: GAME_CONFIG.CANVAS_HEIGHT - 130,
      width: GAME_CONFIG.MONSTER_SIZE,
      height: GAME_CONFIG.MONSTER_SIZE,
      color: COLORS.MONSTER,
      type: MonsterType.HORIZONTAL_PATROL,
      patrolStartX: 400,
      patrolEndX: 600,
      speed: 1.8,
      direction: -1,
      isActive: true,
    },
    {
      x: 150,
      y: GAME_CONFIG.CANVAS_HEIGHT - 210,
      width: GAME_CONFIG.MONSTER_SIZE,
      height: GAME_CONFIG.MONSTER_SIZE,
      color: COLORS.MONSTER,
      type: MonsterType.HORIZONTAL_PATROL,
      patrolStartX: 100,
      patrolEndX: 300,
      speed: 1.3,
      direction: 1,
      isActive: true,
    },
  ],
};

// Bomb Jack Level 3 - Complex maze-like layout
export const level3Map: MapDefinition = {
  id: "level3",
  name: "Mountain Peak",
  width: GAME_CONFIG.CANVAS_WIDTH,
  height: GAME_CONFIG.CANVAS_HEIGHT,
  playerStartX: 50,
  playerStartY: GAME_CONFIG.CANVAS_HEIGHT - 150,
  ...createBackgroundConfig("Mountain Peak"),

  groupSequence: [1, 2, 3, 4, 5],
  difficulty: 3,

  ground: {
    x: 0,
    y: GAME_CONFIG.CANVAS_HEIGHT - 40,
    width: GAME_CONFIG.CANVAS_WIDTH,
    height: 40,
    color: COLORS.GROUND,
  },

  platforms: [
    // Bottom platforms - zigzag pattern
    {
      x: 50,
      y: GAME_CONFIG.CANVAS_HEIGHT - 80,
      width: 60,
      height: 20,
      color: COLORS.PLATFORM,
    },
    {
      x: 200,
      y: GAME_CONFIG.CANVAS_HEIGHT - 100,
      width: 60,
      height: 20,
      color: COLORS.PLATFORM,
    },
    {
      x: 350,
      y: GAME_CONFIG.CANVAS_HEIGHT - 80,
      width: 60,
      height: 20,
      color: COLORS.PLATFORM,
    },
    {
      x: 500,
      y: GAME_CONFIG.CANVAS_HEIGHT - 100,
      width: 60,
      height: 20,
      color: COLORS.PLATFORM,
    },
    {
      x: 650,
      y: GAME_CONFIG.CANVAS_HEIGHT - 80,
      width: 60,
      height: 20,
      color: COLORS.PLATFORM,
    },

    // Middle platforms - alternating heights
    {
      x: 100,
      y: GAME_CONFIG.CANVAS_HEIGHT - 160,
      width: 80,
      height: 20,
      color: COLORS.PLATFORM,
    },
    {
      x: 300,
      y: GAME_CONFIG.CANVAS_HEIGHT - 180,
      width: 80,
      height: 20,
      color: COLORS.PLATFORM,
    },
    {
      x: 500,
      y: GAME_CONFIG.CANVAS_HEIGHT - 160,
      width: 80,
      height: 20,
      color: COLORS.PLATFORM,
    },
    {
      x: 700,
      y: GAME_CONFIG.CANVAS_HEIGHT - 180,
      width: 80,
      height: 20,
      color: COLORS.PLATFORM,
    },

    // Upper platforms - cross pattern
    {
      x: 150,
      y: GAME_CONFIG.CANVAS_HEIGHT - 240,
      width: 60,
      height: 20,
      color: COLORS.PLATFORM,
    },
    {
      x: 400,
      y: GAME_CONFIG.CANVAS_HEIGHT - 260,
      width: 60,
      height: 20,
      color: COLORS.PLATFORM,
    },
    {
      x: 650,
      y: GAME_CONFIG.CANVAS_HEIGHT - 240,
      width: 60,
      height: 20,
      color: COLORS.PLATFORM,
    },

    // Top platforms - scattered
    {
      x: 50,
      y: GAME_CONFIG.CANVAS_HEIGHT - 320,
      width: 70,
      height: 20,
      color: COLORS.PLATFORM,
    },
    {
      x: 250,
      y: GAME_CONFIG.CANVAS_HEIGHT - 340,
      width: 70,
      height: 20,
      color: COLORS.PLATFORM,
    },
    {
      x: 450,
      y: GAME_CONFIG.CANVAS_HEIGHT - 320,
      width: 70,
      height: 20,
      color: COLORS.PLATFORM,
    },
    {
      x: 650,
      y: GAME_CONFIG.CANVAS_HEIGHT - 340,
      width: 70,
      height: 20,
      color: COLORS.PLATFORM,
    },

    // Highest platforms
    {
      x: 150,
      y: GAME_CONFIG.CANVAS_HEIGHT - 400,
      width: 80,
      height: 20,
      color: COLORS.PLATFORM,
    },
    {
      x: 350,
      y: GAME_CONFIG.CANVAS_HEIGHT - 420,
      width: 80,
      height: 20,
      color: COLORS.PLATFORM,
    },
    {
      x: 550,
      y: GAME_CONFIG.CANVAS_HEIGHT - 400,
      width: 80,
      height: 20,
      color: COLORS.PLATFORM,
    },
  ],

  bombs: [
    // Ground level bombs
    createBomb(70, GAME_CONFIG.CANVAS_HEIGHT - 70, 1, 1),
    createBomb(220, GAME_CONFIG.CANVAS_HEIGHT - 70, 2, 1),
    createBomb(370, GAME_CONFIG.CANVAS_HEIGHT - 70, 3, 1),
    createBomb(520, GAME_CONFIG.CANVAS_HEIGHT - 70, 4, 1),
    createBomb(670, GAME_CONFIG.CANVAS_HEIGHT - 70, 5, 1),

    // Bottom platform bombs
    createBomb(80, GAME_CONFIG.CANVAS_HEIGHT - 110, 6, 2),
    createBomb(230, GAME_CONFIG.CANVAS_HEIGHT - 130, 7, 2),
    createBomb(380, GAME_CONFIG.CANVAS_HEIGHT - 110, 8, 2),
    createBomb(530, GAME_CONFIG.CANVAS_HEIGHT - 130, 9, 2),
    createBomb(680, GAME_CONFIG.CANVAS_HEIGHT - 110, 10, 2),

    // Middle platform bombs
    createBomb(120, GAME_CONFIG.CANVAS_HEIGHT - 190, 11, 3),
    createBomb(320, GAME_CONFIG.CANVAS_HEIGHT - 210, 12, 3),
    createBomb(520, GAME_CONFIG.CANVAS_HEIGHT - 190, 13, 3),
    createBomb(720, GAME_CONFIG.CANVAS_HEIGHT - 210, 14, 3),

    // Upper platform bombs
    createBomb(170, GAME_CONFIG.CANVAS_HEIGHT - 270, 15, 4),
    createBomb(420, GAME_CONFIG.CANVAS_HEIGHT - 290, 16, 4),
    createBomb(670, GAME_CONFIG.CANVAS_HEIGHT - 270, 17, 4),

    // Top platform bombs
    createBomb(70, GAME_CONFIG.CANVAS_HEIGHT - 350, 18, 5),
    createBomb(270, GAME_CONFIG.CANVAS_HEIGHT - 370, 19, 5),
    createBomb(470, GAME_CONFIG.CANVAS_HEIGHT - 350, 20, 5),
    createBomb(670, GAME_CONFIG.CANVAS_HEIGHT - 370, 21, 5),

    // Highest platform bombs
    createBomb(170, GAME_CONFIG.CANVAS_HEIGHT - 430, 22, 5),
    createBomb(370, GAME_CONFIG.CANVAS_HEIGHT - 450, 23, 5),
    createBomb(570, GAME_CONFIG.CANVAS_HEIGHT - 430, 24, 5),
  ],

  coinSpawnPoints: [
    {
      x: 400,
      y: GAME_CONFIG.CANVAS_HEIGHT - 150,
      type: CoinType.POWER,
      spawnAngle: 75,
    },
    {
      x: 400,
      y: GAME_CONFIG.CANVAS_HEIGHT - 250,
      type: CoinType.POWER,
      spawnAngle: 105,
    },
  ],

  monsters: [
    {
      x: 200,
      y: GAME_CONFIG.CANVAS_HEIGHT - 70,
      width: GAME_CONFIG.MONSTER_SIZE,
      height: GAME_CONFIG.MONSTER_SIZE,
      color: COLORS.MONSTER,
      type: MonsterType.HORIZONTAL_PATROL,
      patrolStartX: 150,
      patrolEndX: 350,
      speed: 2,
      direction: 1,
      isActive: true,
    },
    {
      x: 500,
      y: GAME_CONFIG.CANVAS_HEIGHT - 110,
      width: GAME_CONFIG.MONSTER_SIZE,
      height: GAME_CONFIG.MONSTER_SIZE,
      color: COLORS.MONSTER,
      type: MonsterType.HORIZONTAL_PATROL,
      patrolStartX: 450,
      patrolEndX: 650,
      speed: 2.2,
      direction: -1,
      isActive: true,
    },
    {
      x: 350,
      y: GAME_CONFIG.CANVAS_HEIGHT - 190,
      width: GAME_CONFIG.MONSTER_SIZE,
      height: GAME_CONFIG.MONSTER_SIZE,
      color: COLORS.MONSTER,
      type: MonsterType.HORIZONTAL_PATROL,
      patrolStartX: 300,
      patrolEndX: 500,
      speed: 1.8,
      direction: 1,
      isActive: true,
    },
  ],
};

// Bomb Jack Level 4 - Vertical tower layout
export const level4Map: MapDefinition = {
  id: "level4",
  name: "Valley of Shadows",
  width: GAME_CONFIG.CANVAS_WIDTH,
  height: GAME_CONFIG.CANVAS_HEIGHT,
  playerStartX: 50,
  playerStartY: GAME_CONFIG.CANVAS_HEIGHT - 150,
  ...createBackgroundConfig("Valley of Shadows"),

  groupSequence: [1, 2, 3, 4, 5],
  difficulty: 4,

  ground: {
    x: 0,
    y: GAME_CONFIG.CANVAS_HEIGHT - 40,
    width: GAME_CONFIG.CANVAS_WIDTH,
    height: 40,
    color: COLORS.GROUND,
  },

  platforms: [
    // Ground access platforms
    {
      x: 50,
      y: GAME_CONFIG.CANVAS_HEIGHT - 80,
      width: 60,
      height: 20,
      color: COLORS.PLATFORM,
    },
    {
      x: 750,
      y: GAME_CONFIG.CANVAS_HEIGHT - 80,
      width: 60,
      height: 20,
      color: COLORS.PLATFORM,
    },

    // Left tower platforms
    {
      x: 100,
      y: GAME_CONFIG.CANVAS_HEIGHT - 120,
      width: 50,
      height: 20,
      color: COLORS.PLATFORM,
    },
    {
      x: 100,
      y: GAME_CONFIG.CANVAS_HEIGHT - 160,
      width: 50,
      height: 20,
      color: COLORS.PLATFORM,
    },
    {
      x: 100,
      y: GAME_CONFIG.CANVAS_HEIGHT - 200,
      width: 50,
      height: 20,
      color: COLORS.PLATFORM,
    },
    {
      x: 100,
      y: GAME_CONFIG.CANVAS_HEIGHT - 240,
      width: 50,
      height: 20,
      color: COLORS.PLATFORM,
    },
    {
      x: 100,
      y: GAME_CONFIG.CANVAS_HEIGHT - 280,
      width: 50,
      height: 20,
      color: COLORS.PLATFORM,
    },
    {
      x: 100,
      y: GAME_CONFIG.CANVAS_HEIGHT - 320,
      width: 50,
      height: 20,
      color: COLORS.PLATFORM,
    },
    {
      x: 100,
      y: GAME_CONFIG.CANVAS_HEIGHT - 360,
      width: 50,
      height: 20,
      color: COLORS.PLATFORM,
    },

    // Right tower platforms
    {
      x: 700,
      y: GAME_CONFIG.CANVAS_HEIGHT - 120,
      width: 50,
      height: 20,
      color: COLORS.PLATFORM,
    },
    {
      x: 700,
      y: GAME_CONFIG.CANVAS_HEIGHT - 160,
      width: 50,
      height: 20,
      color: COLORS.PLATFORM,
    },
    {
      x: 700,
      y: GAME_CONFIG.CANVAS_HEIGHT - 200,
      width: 50,
      height: 20,
      color: COLORS.PLATFORM,
    },
    {
      x: 700,
      y: GAME_CONFIG.CANVAS_HEIGHT - 240,
      width: 50,
      height: 20,
      color: COLORS.PLATFORM,
    },
    {
      x: 700,
      y: GAME_CONFIG.CANVAS_HEIGHT - 280,
      width: 50,
      height: 20,
      color: COLORS.PLATFORM,
    },
    {
      x: 700,
      y: GAME_CONFIG.CANVAS_HEIGHT - 320,
      width: 50,
      height: 20,
      color: COLORS.PLATFORM,
    },
    {
      x: 700,
      y: GAME_CONFIG.CANVAS_HEIGHT - 360,
      width: 50,
      height: 20,
      color: COLORS.PLATFORM,
    },

    // Connecting platforms
    {
      x: 250,
      y: GAME_CONFIG.CANVAS_HEIGHT - 140,
      width: 80,
      height: 20,
      color: COLORS.PLATFORM,
    },
    {
      x: 450,
      y: GAME_CONFIG.CANVAS_HEIGHT - 140,
      width: 80,
      height: 20,
      color: COLORS.PLATFORM,
    },
    {
      x: 350,
      y: GAME_CONFIG.CANVAS_HEIGHT - 180,
      width: 80,
      height: 20,
      color: COLORS.PLATFORM,
    },
    {
      x: 250,
      y: GAME_CONFIG.CANVAS_HEIGHT - 220,
      width: 80,
      height: 20,
      color: COLORS.PLATFORM,
    },
    {
      x: 450,
      y: GAME_CONFIG.CANVAS_HEIGHT - 220,
      width: 80,
      height: 20,
      color: COLORS.PLATFORM,
    },
    {
      x: 350,
      y: GAME_CONFIG.CANVAS_HEIGHT - 260,
      width: 80,
      height: 20,
      color: COLORS.PLATFORM,
    },
    {
      x: 250,
      y: GAME_CONFIG.CANVAS_HEIGHT - 300,
      width: 80,
      height: 20,
      color: COLORS.PLATFORM,
    },
    {
      x: 450,
      y: GAME_CONFIG.CANVAS_HEIGHT - 300,
      width: 80,
      height: 20,
      color: COLORS.PLATFORM,
    },
    {
      x: 350,
      y: GAME_CONFIG.CANVAS_HEIGHT - 340,
      width: 80,
      height: 20,
      color: COLORS.PLATFORM,
    },
    {
      x: 250,
      y: GAME_CONFIG.CANVAS_HEIGHT - 380,
      width: 80,
      height: 20,
      color: COLORS.PLATFORM,
    },
    {
      x: 450,
      y: GAME_CONFIG.CANVAS_HEIGHT - 380,
      width: 80,
      height: 20,
      color: COLORS.PLATFORM,
    },
  ],

  bombs: [
    // Ground level bombs
    createBomb(70, GAME_CONFIG.CANVAS_HEIGHT - 70, 1, 1),
    createBomb(770, GAME_CONFIG.CANVAS_HEIGHT - 70, 2, 1),

    // Left tower bombs
    createBomb(120, GAME_CONFIG.CANVAS_HEIGHT - 150, 3, 2),
    createBomb(120, GAME_CONFIG.CANVAS_HEIGHT - 190, 4, 2),
    createBomb(120, GAME_CONFIG.CANVAS_HEIGHT - 230, 5, 2),
    createBomb(120, GAME_CONFIG.CANVAS_HEIGHT - 270, 6, 2),
    createBomb(120, GAME_CONFIG.CANVAS_HEIGHT - 310, 7, 2),
    createBomb(120, GAME_CONFIG.CANVAS_HEIGHT - 350, 8, 2),
    createBomb(120, GAME_CONFIG.CANVAS_HEIGHT - 390, 9, 2),

    // Right tower bombs
    createBomb(720, GAME_CONFIG.CANVAS_HEIGHT - 150, 10, 3),
    createBomb(720, GAME_CONFIG.CANVAS_HEIGHT - 190, 11, 3),
    createBomb(720, GAME_CONFIG.CANVAS_HEIGHT - 230, 12, 3),
    createBomb(720, GAME_CONFIG.CANVAS_HEIGHT - 270, 13, 3),
    createBomb(720, GAME_CONFIG.CANVAS_HEIGHT - 310, 14, 3),
    createBomb(720, GAME_CONFIG.CANVAS_HEIGHT - 350, 15, 3),
    createBomb(720, GAME_CONFIG.CANVAS_HEIGHT - 390, 16, 3),

    // Connecting platform bombs
    createBomb(270, GAME_CONFIG.CANVAS_HEIGHT - 170, 17, 4),
    createBomb(470, GAME_CONFIG.CANVAS_HEIGHT - 170, 18, 4),
    createBomb(370, GAME_CONFIG.CANVAS_HEIGHT - 210, 19, 4),
    createBomb(270, GAME_CONFIG.CANVAS_HEIGHT - 250, 20, 4),
    createBomb(470, GAME_CONFIG.CANVAS_HEIGHT - 250, 21, 4),
    createBomb(370, GAME_CONFIG.CANVAS_HEIGHT - 290, 22, 4),
    createBomb(270, GAME_CONFIG.CANVAS_HEIGHT - 330, 23, 4),
    createBomb(470, GAME_CONFIG.CANVAS_HEIGHT - 330, 24, 4),
    createBomb(370, GAME_CONFIG.CANVAS_HEIGHT - 370, 25, 4),
    createBomb(270, GAME_CONFIG.CANVAS_HEIGHT - 410, 26, 4),
    createBomb(470, GAME_CONFIG.CANVAS_HEIGHT - 410, 27, 4),
  ],

  coinSpawnPoints: [
    {
      x: 400,
      y: GAME_CONFIG.CANVAS_HEIGHT - 150,
      type: CoinType.POWER,
      spawnAngle: 30,
    },
    {
      x: 400,
      y: GAME_CONFIG.CANVAS_HEIGHT - 250,
      type: CoinType.POWER,
      spawnAngle: 150,
    },
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
      speed: 2.5,
      direction: 1,
      isActive: true,
    },
    {
      x: 700,
      y: GAME_CONFIG.CANVAS_HEIGHT - 150,
      width: GAME_CONFIG.MONSTER_SIZE,
      height: GAME_CONFIG.MONSTER_SIZE,
      color: COLORS.MONSTER,
      type: MonsterType.HORIZONTAL_PATROL,
      patrolStartX: 650,
      patrolEndX: 850,
      speed: 2.8,
      direction: -1,
      isActive: true,
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
      isActive: true,
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
      isActive: true,
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
      isActive: true,
    },
  ],
};

export const level5Map: MapDefinition = {
  id: "level5",
  name: "Future City 2",
  width: GAME_CONFIG.CANVAS_WIDTH,
  height: GAME_CONFIG.CANVAS_HEIGHT,
  playerStartX: 50,
  playerStartY: GAME_CONFIG.CANVAS_HEIGHT - 150,
  ...createBackgroundConfig("Future City 2"),

  groupSequence: [1, 2, 3, 4, 5, 6],
  difficulty: 5,

  ground: {
    x: 0,
    y: GAME_CONFIG.CANVAS_HEIGHT - 40,
    width: GAME_CONFIG.CANVAS_WIDTH,
    height: 40,
    color: COLORS.GROUND,
  },

  platforms: [
    // Minimal ground platforms
    {
      x: 50,
      y: GAME_CONFIG.CANVAS_HEIGHT - 60,
      width: 50,
      height: 20,
      color: COLORS.PLATFORM,
    },
    {
      x: 750,
      y: GAME_CONFIG.CANVAS_HEIGHT - 60,
      width: 50,
      height: 20,
      color: COLORS.PLATFORM,
    },

    // Floating platforms in spiral pattern
    {
      x: 200,
      y: GAME_CONFIG.CANVAS_HEIGHT - 120,
      width: 60,
      height: 20,
      color: COLORS.PLATFORM,
    },
    {
      x: 600,
      y: GAME_CONFIG.CANVAS_HEIGHT - 120,
      width: 60,
      height: 20,
      color: COLORS.PLATFORM,
    },

    {
      x: 100,
      y: GAME_CONFIG.CANVAS_HEIGHT - 180,
      width: 60,
      height: 20,
      color: COLORS.PLATFORM,
    },
    {
      x: 700,
      y: GAME_CONFIG.CANVAS_HEIGHT - 180,
      width: 60,
      height: 20,
      color: COLORS.PLATFORM,
    },

    {
      x: 300,
      y: GAME_CONFIG.CANVAS_HEIGHT - 240,
      width: 60,
      height: 20,
      color: COLORS.PLATFORM,
    },
    {
      x: 500,
      y: GAME_CONFIG.CANVAS_HEIGHT - 240,
      width: 60,
      height: 20,
      color: COLORS.PLATFORM,
    },

    {
      x: 150,
      y: GAME_CONFIG.CANVAS_HEIGHT - 300,
      width: 60,
      height: 20,
      color: COLORS.PLATFORM,
    },
    {
      x: 650,
      y: GAME_CONFIG.CANVAS_HEIGHT - 300,
      width: 60,
      height: 20,
      color: COLORS.PLATFORM,
    },

    {
      x: 400,
      y: GAME_CONFIG.CANVAS_HEIGHT - 360,
      width: 60,
      height: 20,
      color: COLORS.PLATFORM,
    },

    {
      x: 250,
      y: GAME_CONFIG.CANVAS_HEIGHT - 420,
      width: 60,
      height: 20,
      color: COLORS.PLATFORM,
    },
    {
      x: 550,
      y: GAME_CONFIG.CANVAS_HEIGHT - 420,
      width: 60,
      height: 20,
      color: COLORS.PLATFORM,
    },
  ],

  bombs: [
    // Ground level
    {
      x: 70,
      y: GAME_CONFIG.CANVAS_HEIGHT - 70,
      width: 16,
      height: 16,
      order: 1,
      group: 1,
      isCollected: false,
      isBlinking: false,
    },
    {
      x: 795,
      y: GAME_CONFIG.CANVAS_HEIGHT - 70,
      width: 16,
      height: 16,
      order: 2,
      group: 1,
      isCollected: false,
      isBlinking: false,
    },

    // First floating level
    {
      x: 220,
      y: GAME_CONFIG.CANVAS_HEIGHT - 150,
      width: 16,
      height: 16,
      order: 3,
      group: 2,
      isCollected: false,
      isBlinking: false,
    },
    {
      x: 620,
      y: GAME_CONFIG.CANVAS_HEIGHT - 150,
      width: 16,
      height: 16,
      order: 4,
      group: 2,
      isCollected: false,
      isBlinking: false,
    },

    // Second level
    {
      x: 120,
      y: GAME_CONFIG.CANVAS_HEIGHT - 210,
      width: 16,
      height: 16,
      order: 5,
      group: 3,
      isCollected: false,
      isBlinking: false,
    },
    {
      x: 720,
      y: GAME_CONFIG.CANVAS_HEIGHT - 210,
      width: 16,
      height: 16,
      order: 6,
      group: 3,
      isCollected: false,
      isBlinking: false,
    },

    // Third level
    {
      x: 320,
      y: GAME_CONFIG.CANVAS_HEIGHT - 270,
      width: 16,
      height: 16,
      order: 7,
      group: 4,
      isCollected: false,
      isBlinking: false,
    },
    {
      x: 540,
      y: GAME_CONFIG.CANVAS_HEIGHT - 270,
      width: 16,
      height: 16,
      order: 8,
      group: 4,
      isCollected: false,
      isBlinking: false,
    },

    // Fourth level
    {
      x: 170,
      y: GAME_CONFIG.CANVAS_HEIGHT - 330,
      width: 16,
      height: 16,
      order: 9,
      group: 5,
      isCollected: false,
      isBlinking: false,
    },
    {
      x: 670,
      y: GAME_CONFIG.CANVAS_HEIGHT - 330,
      width: 16,
      height: 16,
      order: 10,
      group: 5,
      isCollected: false,
      isBlinking: false,
    },

    // Fifth level
    {
      x: 420,
      y: GAME_CONFIG.CANVAS_HEIGHT - 390,
      width: 16,
      height: 16,
      order: 11,
      group: 6,
      isCollected: false,
      isBlinking: false,
    },

    // Sixth level
    {
      x: 270,
      y: GAME_CONFIG.CANVAS_HEIGHT - 450,
      width: 16,
      height: 16,
      order: 12,
      group: 6,
      isCollected: false,
      isBlinking: false,
    },
    {
      x: 570,
      y: GAME_CONFIG.CANVAS_HEIGHT - 450,
      width: 16,
      height: 16,
      order: 13,
      group: 6,
      isCollected: false,
      isBlinking: false,
    },

    // Additional scattered bombs
    {
      x: 25,
      y: GAME_CONFIG.CANVAS_HEIGHT - 90,
      width: 16,
      height: 16,
      order: 14,
      group: 6,
      isCollected: false,
      isBlinking: false,
    },
    {
      x: 775,
      y: GAME_CONFIG.CANVAS_HEIGHT - 90,
      width: 16,
      height: 16,
      order: 15,
      group: 6,
      isCollected: false,
      isBlinking: false,
    },
    {
      x: 180,
      y: GAME_CONFIG.CANVAS_HEIGHT - 150,
      width: 16,
      height: 16,
      order: 16,
      group: 6,
      isCollected: false,
      isBlinking: false,
    },
    {
      x: 620,
      y: GAME_CONFIG.CANVAS_HEIGHT - 150,
      width: 16,
      height: 16,
      order: 17,
      group: 6,
      isCollected: false,
      isBlinking: false,
    },
    {
      x: 280,
      y: GAME_CONFIG.CANVAS_HEIGHT - 210,
      width: 16,
      height: 16,
      order: 18,
      group: 6,
      isCollected: false,
      isBlinking: false,
    },
    {
      x: 520,
      y: GAME_CONFIG.CANVAS_HEIGHT - 210,
      width: 16,
      height: 16,
      order: 19,
      group: 6,
      isCollected: false,
      isBlinking: false,
    },
    {
      x: 370,
      y: GAME_CONFIG.CANVAS_HEIGHT - 270,
      width: 16,
      height: 16,
      order: 20,
      group: 6,
      isCollected: false,
      isBlinking: false,
    },
    {
      x: 470,
      y: GAME_CONFIG.CANVAS_HEIGHT - 270,
      width: 16,
      height: 16,
      order: 21,
      group: 6,
      isCollected: false,
      isBlinking: false,
    },
    {
      x: 220,
      y: GAME_CONFIG.CANVAS_HEIGHT - 330,
      width: 16,
      height: 16,
      order: 22,
      group: 6,
      isCollected: false,
      isBlinking: false,
    },
    {
      x: 580,
      y: GAME_CONFIG.CANVAS_HEIGHT - 330,
      width: 16,
      height: 16,
      order: 23,
      group: 6,
      isCollected: false,
      isBlinking: false,
    },
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
      isActive: true,
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
      isActive: true,
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
      isActive: true,
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
      isActive: true,
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
      isActive: true,
    },
  ],

  coinSpawnPoints: [
    // Power coin spawn points for level 5 - only 2 per map with non-cardinal angles
    {
      x: 300,
      y: GAME_CONFIG.CANVAS_HEIGHT - 100,
      type: CoinType.POWER,
      spawnAngle: 165,
    },
    {
      x: 500,
      y: GAME_CONFIG.CANVAS_HEIGHT - 140,
      type: CoinType.POWER,
      spawnAngle: 15,
    },
  ],
};
export const level6Map: MapDefinition = {
  id: "level6",
  name: "Ocean Depths",
  width: GAME_CONFIG.CANVAS_WIDTH,
  height: GAME_CONFIG.CANVAS_HEIGHT,
  playerStartX: 50,
  playerStartY: GAME_CONFIG.CANVAS_HEIGHT - 150,
  ...createBackgroundConfig("Ocean Depths"),

  groupSequence: [1, 2, 3, 4, 5, 6],
  difficulty: 5,

  ground: {
    x: 0,
    y: GAME_CONFIG.CANVAS_HEIGHT - 40,
    width: GAME_CONFIG.CANVAS_WIDTH,
    height: 40,
    color: COLORS.GROUND,
  },

  platforms: [
    // Minimal ground platforms
    {
      x: 50,
      y: GAME_CONFIG.CANVAS_HEIGHT - 60,
      width: 50,
      height: 20,
      color: COLORS.PLATFORM,
    },
    {
      x: 750,
      y: GAME_CONFIG.CANVAS_HEIGHT - 60,
      width: 50,
      height: 20,
      color: COLORS.PLATFORM,
    },

    // Floating platforms in spiral pattern
    {
      x: 200,
      y: GAME_CONFIG.CANVAS_HEIGHT - 120,
      width: 60,
      height: 20,
      color: COLORS.PLATFORM,
    },
    {
      x: 600,
      y: GAME_CONFIG.CANVAS_HEIGHT - 120,
      width: 60,
      height: 20,
      color: COLORS.PLATFORM,
    },

    {
      x: 100,
      y: GAME_CONFIG.CANVAS_HEIGHT - 180,
      width: 60,
      height: 20,
      color: COLORS.PLATFORM,
    },
    {
      x: 700,
      y: GAME_CONFIG.CANVAS_HEIGHT - 180,
      width: 60,
      height: 20,
      color: COLORS.PLATFORM,
    },

    {
      x: 300,
      y: GAME_CONFIG.CANVAS_HEIGHT - 240,
      width: 60,
      height: 20,
      color: COLORS.PLATFORM,
    },
    {
      x: 500,
      y: GAME_CONFIG.CANVAS_HEIGHT - 240,
      width: 60,
      height: 20,
      color: COLORS.PLATFORM,
    },

    {
      x: 150,
      y: GAME_CONFIG.CANVAS_HEIGHT - 300,
      width: 60,
      height: 20,
      color: COLORS.PLATFORM,
    },
    {
      x: 650,
      y: GAME_CONFIG.CANVAS_HEIGHT - 300,
      width: 60,
      height: 20,
      color: COLORS.PLATFORM,
    },

    {
      x: 400,
      y: GAME_CONFIG.CANVAS_HEIGHT - 360,
      width: 60,
      height: 20,
      color: COLORS.PLATFORM,
    },

    {
      x: 250,
      y: GAME_CONFIG.CANVAS_HEIGHT - 420,
      width: 60,
      height: 20,
      color: COLORS.PLATFORM,
    },
    {
      x: 550,
      y: GAME_CONFIG.CANVAS_HEIGHT - 420,
      width: 60,
      height: 20,
      color: COLORS.PLATFORM,
    },
  ],

  bombs: [
    // Ground level
    {
      x: 70,
      y: GAME_CONFIG.CANVAS_HEIGHT - 70,
      width: 16,
      height: 16,
      order: 1,
      group: 1,
      isCollected: false,
      isBlinking: false,
    },
    {
      x: 795,
      y: GAME_CONFIG.CANVAS_HEIGHT - 70,
      width: 16,
      height: 16,
      order: 2,
      group: 1,
      isCollected: false,
      isBlinking: false,
    },

    // First floating level
    {
      x: 220,
      y: GAME_CONFIG.CANVAS_HEIGHT - 150,
      width: 16,
      height: 16,
      order: 3,
      group: 2,
      isCollected: false,
      isBlinking: false,
    },
    {
      x: 620,
      y: GAME_CONFIG.CANVAS_HEIGHT - 150,
      width: 16,
      height: 16,
      order: 4,
      group: 2,
      isCollected: false,
      isBlinking: false,
    },

    // Second level
    {
      x: 120,
      y: GAME_CONFIG.CANVAS_HEIGHT - 210,
      width: 16,
      height: 16,
      order: 5,
      group: 3,
      isCollected: false,
      isBlinking: false,
    },
    {
      x: 720,
      y: GAME_CONFIG.CANVAS_HEIGHT - 210,
      width: 16,
      height: 16,
      order: 6,
      group: 3,
      isCollected: false,
      isBlinking: false,
    },

    // Third level
    {
      x: 320,
      y: GAME_CONFIG.CANVAS_HEIGHT - 270,
      width: 16,
      height: 16,
      order: 7,
      group: 4,
      isCollected: false,
      isBlinking: false,
    },
    {
      x: 540,
      y: GAME_CONFIG.CANVAS_HEIGHT - 270,
      width: 16,
      height: 16,
      order: 8,
      group: 4,
      isCollected: false,
      isBlinking: false,
    },

    // Fourth level
    {
      x: 170,
      y: GAME_CONFIG.CANVAS_HEIGHT - 330,
      width: 16,
      height: 16,
      order: 9,
      group: 5,
      isCollected: false,
      isBlinking: false,
    },
    {
      x: 670,
      y: GAME_CONFIG.CANVAS_HEIGHT - 330,
      width: 16,
      height: 16,
      order: 10,
      group: 5,
      isCollected: false,
      isBlinking: false,
    },

    // Fifth level
    {
      x: 420,
      y: GAME_CONFIG.CANVAS_HEIGHT - 390,
      width: 16,
      height: 16,
      order: 11,
      group: 6,
      isCollected: false,
      isBlinking: false,
    },

    // Sixth level
    {
      x: 270,
      y: GAME_CONFIG.CANVAS_HEIGHT - 450,
      width: 16,
      height: 16,
      order: 12,
      group: 6,
      isCollected: false,
      isBlinking: false,
    },
    {
      x: 570,
      y: GAME_CONFIG.CANVAS_HEIGHT - 450,
      width: 16,
      height: 16,
      order: 13,
      group: 6,
      isCollected: false,
      isBlinking: false,
    },

    // Additional scattered bombs
    {
      x: 25,
      y: GAME_CONFIG.CANVAS_HEIGHT - 90,
      width: 16,
      height: 16,
      order: 14,
      group: 6,
      isCollected: false,
      isBlinking: false,
    },
    {
      x: 775,
      y: GAME_CONFIG.CANVAS_HEIGHT - 90,
      width: 16,
      height: 16,
      order: 15,
      group: 6,
      isCollected: false,
      isBlinking: false,
    },
    {
      x: 180,
      y: GAME_CONFIG.CANVAS_HEIGHT - 150,
      width: 16,
      height: 16,
      order: 16,
      group: 6,
      isCollected: false,
      isBlinking: false,
    },
    {
      x: 620,
      y: GAME_CONFIG.CANVAS_HEIGHT - 150,
      width: 16,
      height: 16,
      order: 17,
      group: 6,
      isCollected: false,
      isBlinking: false,
    },
    {
      x: 280,
      y: GAME_CONFIG.CANVAS_HEIGHT - 210,
      width: 16,
      height: 16,
      order: 18,
      group: 6,
      isCollected: false,
      isBlinking: false,
    },
    {
      x: 520,
      y: GAME_CONFIG.CANVAS_HEIGHT - 210,
      width: 16,
      height: 16,
      order: 19,
      group: 6,
      isCollected: false,
      isBlinking: false,
    },
    {
      x: 370,
      y: GAME_CONFIG.CANVAS_HEIGHT - 270,
      width: 16,
      height: 16,
      order: 20,
      group: 6,
      isCollected: false,
      isBlinking: false,
    },
    {
      x: 470,
      y: GAME_CONFIG.CANVAS_HEIGHT - 270,
      width: 16,
      height: 16,
      order: 21,
      group: 6,
      isCollected: false,
      isBlinking: false,
    },
    {
      x: 220,
      y: GAME_CONFIG.CANVAS_HEIGHT - 330,
      width: 16,
      height: 16,
      order: 22,
      group: 6,
      isCollected: false,
      isBlinking: false,
    },
    {
      x: 580,
      y: GAME_CONFIG.CANVAS_HEIGHT - 330,
      width: 16,
      height: 16,
      order: 23,
      group: 6,
      isCollected: false,
      isBlinking: false,
    },
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
      isActive: true,
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
      isActive: true,
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
      isActive: true,
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
      isActive: true,
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
      isActive: true,
    },
  ],

  coinSpawnPoints: [
    // Power coin spawn points for level 5 - only 2 per map with non-cardinal angles
    {
      x: 300,
      y: GAME_CONFIG.CANVAS_HEIGHT - 100,
      type: CoinType.POWER,
      spawnAngle: 165,
    },
    {
      x: 500,
      y: GAME_CONFIG.CANVAS_HEIGHT - 140,
      type: CoinType.POWER,
      spawnAngle: 15,
    },
  ],
};

export const mapDefinitions = [
  level1Map,
  level2Map,
  level3Map,
  level4Map,
  level5Map,
  level6Map,
];
