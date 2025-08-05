import { MapDefinition, Bomb, Platform } from "../types/interfaces";
import { GAME_CONFIG, COLORS } from "../types/constants";
import { MonsterType, CoinType } from "../types/enums";
import {
  createHorizontalPatrolMonster,
  createVerticalPatrolMonster,
  createFloaterMonster,
  createChaserMonster,
  createAmbusherMonster,
} from "../managers/MonsterFactory";

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

// Helper function to create platforms with default height and color
const createPlatform = (
  x: number,
  y: number,
  dimensions: { width: number; height: number },
  color: string = COLORS.PLATFORM,
  borderColor: string = "#000"
) => ({
  x,
  y,
  width: dimensions.width,
  height: dimensions.height,
  borderColor,
  color,
});

// Helper function to create vertical platforms (walls)
const createVerticalPlatform = (
  x: number,
  y: number,
  height: number,
  color: string = COLORS.PLATFORM,
  borderColor: string = "#000"
) => ({
  x,
  y,
  width: 15, // Standard wall thickness
  height,
  borderColor,
  color,
  isVertical: true, // Mark as vertical platform
});

const centerPoint = () => {
  return {
    x: GAME_CONFIG.CANVAS_WIDTH / 2,
    y: GAME_CONFIG.CANVAS_HEIGHT / 2,
  };
};

// Bomb Jack Level 1 - Classic layout with symmetrical platforms
export const level1Map: MapDefinition = {
  id: "level1",
  name: "Taco Street",
  width: GAME_CONFIG.CANVAS_WIDTH,
  height: GAME_CONFIG.CANVAS_HEIGHT,
  playerStart: centerPoint(),
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
    // bottom left
    createVerticalPlatform(96, 220, 150, "#ebb185"),
    createPlatform(95, 450, { width: 200, height: 15 }, "#ebb185"),
    // Top right
    createPlatform(480, 150, { width: 200, height: 15 }, "#ebb185"),
    createPlatform(684, 220, { width: 15, height: 150 }, "#ebb185"),
    createPlatform(430, 430, { width: 200, height: 15 }, "#ebb185"),
    createPlatform(170, 170, { width: 200, height: 15 }, "#ebb185"),
  ],
  
  bombs: [
    // Group 1
    createBomb(440, 400, 1, 1),
    createBomb(490, 400, 2, 1),
    createBomb(540, 400, 3, 1),
    createBomb(590, 400, 4, 1),

    // Group 2
    createBomb(180, 140, 5, 2),
    createBomb(230, 140, 6, 2),
    createBomb(280, 140, 7, 2),
    createBomb(330, 140, 8, 2),

    // Group 3
    createBomb(710, 230, 9, 3),
    createBomb(710, 280, 10, 3),
    createBomb(710, 330, 11, 3),

    // Group 4
    createBomb(130, 470, 12, 4),
    createBomb(180, 470, 13, 4),
    createBomb(230, 470, 14, 4),

    // Group 5
    createBomb(520, 70, 15, 5),
    createBomb(570, 70, 16, 5),
    createBomb(620, 70, 17, 5),

    // Group 6
    createBomb(120, 230, 18, 6),
    createBomb(120, 280, 19, 6),
    createBomb(120, 330, 20, 6),

    // Group 7
    createBomb(130, 420, 21, 7),
    createBomb(180, 420, 22, 7),
    createBomb(230, 420, 23, 7),
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
    
    // Mid-game spawns (15-30 seconds)
  
    
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
    // Monster on the first platform (left side, 2 walks)
    // createHorizontalPatrolMonster(95, 220, 200, "left", 2, 1),
    // createVerticalPatrolMonster(96, 220, 150, "left", 1, 1),
    // // Monster on the top platform (right side, 1 walk)
    // createHorizontalPatrolMonster(480, 150, 200, "right", 1, 1.2),
  ],
};

// Bomb Jack Level 2 - More complex layout with staggered platforms
export const level2Map: MapDefinition = {
  id: "level2",
  name: "The Future City",
  width: GAME_CONFIG.CANVAS_WIDTH,
  height: GAME_CONFIG.CANVAS_HEIGHT,
  playerStart: centerPoint(),
  ...createBackgroundConfig("The Future City"),

  groupSequence: [1, 2, 3, 4, 5],
  difficulty: 2,
  
  ground: {
    x: 0,
    y: GAME_CONFIG.CANVAS_HEIGHT - 40,
    width: GAME_CONFIG.CANVAS_WIDTH,
    height: 40,
    color: "#75202d",
  },
  
  platforms: [
    // Bottom platforms
    createPlatform(165, 475, { width: 150, height: 15 }, "#75212d", "#b63348"),
    createPlatform(485, 475, { width: 150, height: 15 }, "#75212d", "#b63348"),
    
    // Middle platforms
    createPlatform(300, 380, { width: 200, height: 15 }, "#75212d", "#b63348"),
    createPlatform(300, 240, { width: 200, height: 15 }, "#75212d", "#b63348"),
    
    // Top platforms
    createPlatform(165, 130, { width: 150, height: 15 }, "#75212d", "#b63348"),
    createPlatform(485, 130, { width: 150, height: 15 }, "#75212d", "#b63348"),
  ],
  
  bombs: [
    // Group 1
    createBomb(600, 95, 1, 1),
    createBomb(550, 95, 2, 1),
    createBomb(500, 95, 3, 1),

    // Group 2
    createBomb(180, 440, 4, 2),
    createBomb(230, 440, 5, 2),
    createBomb(280, 440, 6, 2),

    // Group 3
    createBomb(280, 95, 7, 3),
    createBomb(230, 95, 8, 3),
    createBomb(180, 95, 9, 3),

    // Group 4
    createBomb(600, 440, 10, 4),
    createBomb(550, 440, 11, 4),
    createBomb(500, 440, 12, 4),

    // Group 5
    createBomb(385, 70, 13, 5),
    createBomb(385, 120, 14, 5),
    createBomb(385, 170, 15, 5),

    // Group 6
    createBomb(500, 500, 16, 6),
    createBomb(550, 500, 17, 6),
    createBomb(600, 500, 18, 6),

    // Group 7
    createBomb(180, 500, 19, 7),
    createBomb(230, 500, 20, 7),
    createBomb(280, 500, 21, 7),

    // Group 8
    createBomb(360, 265, 22, 8),
    createBomb(410, 265, 23, 8),
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
    // // More aggressive early spawns for level 2
    // {
    //   x: 250,
    //   y: GAME_CONFIG.CANVAS_HEIGHT - 70,
    //   type: MonsterType.HORIZONTAL_PATROL,
    //   spawnDelay: 3000, // 3 seconds
    //   patrolStartX: 200,
    //   patrolEndX: 400,
    //   speed: 1.5,
    // },
    // {
    //   x: 450,
    //   y: GAME_CONFIG.CANVAS_HEIGHT - 130,
    //   type: MonsterType.HORIZONTAL_PATROL,
    //   spawnDelay: 6000, // 6 seconds
    //   patrolStartX: 400,
    //   patrolEndX: 600,
    //   speed: 1.8,
    // },
    // // Floaters for mid-game
    // {
    //   x: 100,
    //   y: GAME_CONFIG.CANVAS_HEIGHT - 150,
    //   type: MonsterType.FLOATER,
    //   spawnDelay: 12000, // 12 seconds
    //   speed: 0.8,
    // },
    // {
    //   x: 700,
    //   y: GAME_CONFIG.CANVAS_HEIGHT - 150,
    //   type: MonsterType.FLOATER,
    //   spawnDelay: 15000, // 15 seconds
    //   speed: 0.8,
    // },
    // // Chasers and ambushers for late game
    // {
    //   x: 150,
    //   y: GAME_CONFIG.CANVAS_HEIGHT - 210,
    //   type: MonsterType.AMBUSHER,
    //   spawnDelay: 25000, // 25 seconds
    //   speed: 2.0,
    // },
    // {
    //   x: 600,
    //   y: GAME_CONFIG.CANVAS_HEIGHT - 70,
    //   type: MonsterType.CHASER,
    //   spawnDelay: 35000, // 35 seconds
    //   speed: 1.8,
    // },
  ],
  
  monsters: [
    // Monster on bottom left platform (left side, 3 walks)
    createHorizontalPatrolMonster(165, 475, 150, "left", 3, 1.5),
    // Monster on bottom right platform (right side, 2 walks)
    createHorizontalPatrolMonster(485, 475, 150, "right", 2, 1.8),
    // Monster on middle platform (left side, 1 walk)
    createHorizontalPatrolMonster(300, 380, 200, "left", 1, 1.3),
  ],
};

export const level3Map: MapDefinition = {
  id: "level3",
  name: "Mountain Peak",
  width: GAME_CONFIG.CANVAS_WIDTH,
  height: GAME_CONFIG.CANVAS_HEIGHT,
  playerStart: centerPoint(),
  ...createBackgroundConfig("Mountain Peak"),

  groupSequence: [1, 2, 3, 4, 5],
  difficulty: 3,
  
  ground: {
    x: 0,
    y: GAME_CONFIG.CANVAS_HEIGHT - 40,
    width: GAME_CONFIG.CANVAS_WIDTH,
    height: 40,
    color: "#56687a",
  },
  
  platforms: [
    // Horizontal platform
    createPlatform(300, 300, { width: 200, height: 15 }, "#56687a"),
    // Vertical platform (wall)
    createVerticalPlatform(550, 200, 200, "#56687a"),
  ],

  bombs: [],

  coinSpawnPoints: [],
  
  monsters: [
    // Different monster types with unique colors
    // createHorizontalPatrolMonster(300, 300, 200, "left", 2, 1), // Red - horizontal patrol
    // createVerticalPatrolMonster(550, 200, 200, "left", 1, 1), // Green - vertical patrol on LEFT side of wall
    // createVerticalPatrolMonster(550, 200, 200, "right", 1, 1), // Green - vertical patrol on RIGHT side of wall
    // createChaserMonster(200, 150, 1, 0.7, 300), // Orange - chaser
    // createFloaterMonster(600, 200, 45, 1.2), // Cyan - floater
    createAmbusherMonster(300, 450, 100, 100, 1, 300), // Purple - ambusher
  ],
};

// // Bomb Jack Level 4 - Vertical tower layout
// export const level4Map: MapDefinition = {
//   id: "level4",
//   name: "Valley of Shadows",
//   width: GAME_CONFIG.CANVAS_WIDTH,
//   height: GAME_CONFIG.CANVAS_HEIGHT,
//   playerStart: centerPoint(),
//   ...createBackgroundConfig("Valley of Shadows"),

//   groupSequence: [1, 2, 3, 4, 5],
//   difficulty: 4,

//   ground: {
//     x: 0,
//     y: GAME_CONFIG.CANVAS_HEIGHT - 40,
//     width: GAME_CONFIG.CANVAS_WIDTH,
//     height: 40,
//     color: "#583c2d",
//   },

//   platforms: [
//     // Left tower platforms
//     createPlatform(
//       100,
//       GAME_CONFIG.CANVAS_HEIGHT - 120,
//       { width: 100, height: 15 },
//       "#aa7557"
//     ),
//     createPlatform(
//       100,
//       GAME_CONFIG.CANVAS_HEIGHT - 200,
//       { width: 100, height: 15 },
//       "#aa7557"
//     ),
//     createPlatform(
//       100,
//       GAME_CONFIG.CANVAS_HEIGHT - 280,
//       { width: 100, height: 15 },
//       "#aa7557"
//     ),
//     createPlatform(
//       100,
//       GAME_CONFIG.CANVAS_HEIGHT - 360,
//       { width: 100, height: 15 },
//       "#aa7557"
//     ),
//     // Right tower platforms
//     createPlatform(
//       650,
//       GAME_CONFIG.CANVAS_HEIGHT - 120,
//       { width: 100, height: 15 },
//       "#aa7557"
//     ),
//     createPlatform(
//       650,
//       GAME_CONFIG.CANVAS_HEIGHT - 200,
//       { width: 100, height: 15 },
//       "#aa7557"
//     ),
//     createPlatform(
//       650,
//       GAME_CONFIG.CANVAS_HEIGHT - 280,
//       { width: 100, height: 15 },
//       "#aa7557"
//     ),

//     // middle platform
//     createPlatform(
//       250,
//       GAME_CONFIG.CANVAS_HEIGHT - 185,
//       { width: 340, height: 15 },
//       "#aa7557"
//     ),
//   ],

//   bombs: [
//     // Ground level bombs
//     createBomb(70, GAME_CONFIG.CANVAS_HEIGHT - 70, 1, 1),
//     createBomb(770, GAME_CONFIG.CANVAS_HEIGHT - 70, 2, 1),

//     // Left tower bombs
//     createBomb(120, GAME_CONFIG.CANVAS_HEIGHT - 150, 3, 2),
//     createBomb(120, GAME_CONFIG.CANVAS_HEIGHT - 190, 4, 2),
//     createBomb(120, GAME_CONFIG.CANVAS_HEIGHT - 230, 5, 2),
//     createBomb(120, GAME_CONFIG.CANVAS_HEIGHT - 270, 6, 2),
//     createBomb(120, GAME_CONFIG.CANVAS_HEIGHT - 310, 7, 2),
//     createBomb(120, GAME_CONFIG.CANVAS_HEIGHT - 350, 8, 2),
//     createBomb(120, GAME_CONFIG.CANVAS_HEIGHT - 390, 9, 2),

//     // Right tower bombs
//     createBomb(720, GAME_CONFIG.CANVAS_HEIGHT - 150, 10, 3),
//     createBomb(720, GAME_CONFIG.CANVAS_HEIGHT - 190, 11, 3),
//     createBomb(720, GAME_CONFIG.CANVAS_HEIGHT - 230, 12, 3),
//     createBomb(720, GAME_CONFIG.CANVAS_HEIGHT - 270, 13, 3),
//     createBomb(720, GAME_CONFIG.CANVAS_HEIGHT - 310, 14, 3),
//     createBomb(720, GAME_CONFIG.CANVAS_HEIGHT - 350, 15, 3),
//     createBomb(720, GAME_CONFIG.CANVAS_HEIGHT - 390, 16, 3),

//     // Connecting platform bombs
//     createBomb(270, GAME_CONFIG.CANVAS_HEIGHT - 170, 17, 4),
//     createBomb(470, GAME_CONFIG.CANVAS_HEIGHT - 170, 18, 4),
//     createBomb(370, GAME_CONFIG.CANVAS_HEIGHT - 210, 19, 4),
//     createBomb(270, GAME_CONFIG.CANVAS_HEIGHT - 250, 20, 4),
//     createBomb(470, GAME_CONFIG.CANVAS_HEIGHT - 250, 21, 4),
//     createBomb(370, GAME_CONFIG.CANVAS_HEIGHT - 290, 22, 4),
//     createBomb(270, GAME_CONFIG.CANVAS_HEIGHT - 330, 23, 4),
//     createBomb(470, GAME_CONFIG.CANVAS_HEIGHT - 330, 24, 4),
//     createBomb(370, GAME_CONFIG.CANVAS_HEIGHT - 370, 25, 4),
//     createBomb(270, GAME_CONFIG.CANVAS_HEIGHT - 410, 26, 4),
//     createBomb(470, GAME_CONFIG.CANVAS_HEIGHT - 410, 27, 4),
//   ],

//   coinSpawnPoints: [
//     {
//       x: 400,
//       y: GAME_CONFIG.CANVAS_HEIGHT - 150,
//       type: CoinType.POWER,
//       spawnAngle: 30,
//     },
//     {
//       x: 400,
//       y: GAME_CONFIG.CANVAS_HEIGHT - 250,
//       type: CoinType.POWER,
//       spawnAngle: 150,
//     },
//   ],

//   monsters: [
//     {
//       x: 100,
//       y: GAME_CONFIG.CANVAS_HEIGHT - 70,
//       width: GAME_CONFIG.MONSTER_SIZE,
//       height: GAME_CONFIG.MONSTER_SIZE,
//       color: COLORS.MONSTER,
//       type: MonsterType.HORIZONTAL_PATROL,
//       patrolStartX: 50,
//       patrolEndX: 250,
//       speed: 2.5,
//       direction: 1,
//       isActive: true,
//     },
//     {
//       x: 700,
//       y: GAME_CONFIG.CANVAS_HEIGHT - 150,
//       width: GAME_CONFIG.MONSTER_SIZE,
//       height: GAME_CONFIG.MONSTER_SIZE,
//       color: COLORS.MONSTER,
//       type: MonsterType.HORIZONTAL_PATROL,
//       patrolStartX: 650,
//       patrolEndX: 850,
//       speed: 2.8,
//       direction: -1,
//       isActive: true,
//     },
//     {
//       x: 300,
//       y: GAME_CONFIG.CANVAS_HEIGHT - 170,
//       width: GAME_CONFIG.MONSTER_SIZE,
//       height: GAME_CONFIG.MONSTER_SIZE,
//       color: COLORS.MONSTER,
//       type: MonsterType.HORIZONTAL_PATROL,
//       patrolStartX: 250,
//       patrolEndX: 450,
//       speed: 3.8,
//       direction: 1,
//       isActive: true,
//     },
//     {
//       x: 500,
//       y: GAME_CONFIG.CANVAS_HEIGHT - 290,
//       width: GAME_CONFIG.MONSTER_SIZE,
//       height: GAME_CONFIG.MONSTER_SIZE,
//       color: COLORS.MONSTER,
//       type: MonsterType.HORIZONTAL_PATROL,
//       patrolStartX: 450,
//       patrolEndX: 650,
//       speed: 3.6,
//       direction: -1,
//       isActive: true,
//     },
//     {
//       x: 400,
//       y: GAME_CONFIG.CANVAS_HEIGHT - 350,
//       width: GAME_CONFIG.MONSTER_SIZE,
//       height: GAME_CONFIG.MONSTER_SIZE,
//       color: COLORS.MONSTER,
//       type: MonsterType.HORIZONTAL_PATROL,
//       patrolStartX: 350,
//       patrolEndX: 550,
//       speed: 4,
//       direction: 1,
//       isActive: true,
//     },
//   ],
// };

// export const level5Map: MapDefinition = {
//   id: "level5",
//   name: "Future City 2",
//   width: GAME_CONFIG.CANVAS_WIDTH,
//   height: GAME_CONFIG.CANVAS_HEIGHT,
//   playerStart: centerPoint(),
//   ...createBackgroundConfig("Future City 2"),

//   groupSequence: [1, 2, 3, 4, 5, 6],
//   difficulty: 5,

//   ground: {
//     x: 0,
//     y: GAME_CONFIG.CANVAS_HEIGHT - 40,
//     width: GAME_CONFIG.CANVAS_WIDTH,
//     height: 40,
//     color: "#8d4fc9",
//   },

//   platforms: [
//     // Floating platforms in spiral pattern
//     createPlatform(
//       200,
//       GAME_CONFIG.CANVAS_HEIGHT - 120,
//       { width: 60, height: 60 },
//       "#8d4fc9"
//     ),
//     createPlatform(
//       600,
//       GAME_CONFIG.CANVAS_HEIGHT - 100,
//       { width: 60, height: 60 },
//       "#8d4fc9"
//     ),

//     createPlatform(
//       100,
//       GAME_CONFIG.CANVAS_HEIGHT - 150,
//       { width: 60, height: 60 },
//       "#8d4fc9"
//     ),
//     createPlatform(
//       700,
//       GAME_CONFIG.CANVAS_HEIGHT - 180,
//       { width: 60, height: 60 },
//       "#8d4fc9"
//     ),

//     createPlatform(
//       300,
//       GAME_CONFIG.CANVAS_HEIGHT - 240,
//       { width: 60, height: 60 },
//       "#8d4fc9"
//     ),
//     createPlatform(
//       500,
//       GAME_CONFIG.CANVAS_HEIGHT - 240,
//       { width: 60, height: 60 },
//       "#8d4fc9"
//     ),

//     createPlatform(
//       150,
//       GAME_CONFIG.CANVAS_HEIGHT - 300,
//       { width: 60, height: 60 },
//       "#8d4fc9"
//     ),
//     createPlatform(
//       650,
//       GAME_CONFIG.CANVAS_HEIGHT - 300,
//       { width: 60, height: 60 },
//       "#8d4fc9"
//     ),

//     createPlatform(
//       400,
//       GAME_CONFIG.CANVAS_HEIGHT - 300,
//       { width: 60, height: 60 },
//       "#8d4fc9"
//     ),

//     createPlatform(
//       250,
//       GAME_CONFIG.CANVAS_HEIGHT - 420,
//       { width: 60, height: 60 },
//       "#8d4fc9"
//     ),
//     createPlatform(
//       550,
//       GAME_CONFIG.CANVAS_HEIGHT - 420,
//       { width: 60, height: 60 },
//       "#8d4fc9"
//     ),
//   ],

//   bombs: [
//     // Ground level
//     {
//       x: 70,
//       y: GAME_CONFIG.CANVAS_HEIGHT - 70,
//       width: 16,
//       height: 16,
//       order: 1,
//       group: 1,
//       isCollected: false,
//       isBlinking: false,
//     },
//     {
//       x: 795,
//       y: GAME_CONFIG.CANVAS_HEIGHT - 70,
//       width: 16,
//       height: 16,
//       order: 2,
//       group: 1,
//       isCollected: false,
//       isBlinking: false,
//     },

//     // First floating level
//     {
//       x: 220,
//       y: GAME_CONFIG.CANVAS_HEIGHT - 150,
//       width: 16,
//       height: 16,
//       order: 3,
//       group: 2,
//       isCollected: false,
//       isBlinking: false,
//     },
//     {
//       x: 620,
//       y: GAME_CONFIG.CANVAS_HEIGHT - 150,
//       width: 16,
//       height: 16,
//       order: 4,
//       group: 2,
//       isCollected: false,
//       isBlinking: false,
//     },

//     // Second level
//     {
//       x: 120,
//       y: GAME_CONFIG.CANVAS_HEIGHT - 210,
//       width: 16,
//       height: 16,
//       order: 5,
//       group: 3,
//       isCollected: false,
//       isBlinking: false,
//     },
//     {
//       x: 720,
//       y: GAME_CONFIG.CANVAS_HEIGHT - 210,
//       width: 16,
//       height: 16,
//       order: 6,
//       group: 3,
//       isCollected: false,
//       isBlinking: false,
//     },

//     // Third level
//     {
//       x: 320,
//       y: GAME_CONFIG.CANVAS_HEIGHT - 270,
//       width: 16,
//       height: 16,
//       order: 7,
//       group: 4,
//       isCollected: false,
//       isBlinking: false,
//     },
//     {
//       x: 540,
//       y: GAME_CONFIG.CANVAS_HEIGHT - 270,
//       width: 16,
//       height: 16,
//       order: 8,
//       group: 4,
//       isCollected: false,
//       isBlinking: false,
//     },

//     // Fourth level
//     {
//       x: 170,
//       y: GAME_CONFIG.CANVAS_HEIGHT - 330,
//       width: 16,
//       height: 16,
//       order: 9,
//       group: 5,
//       isCollected: false,
//       isBlinking: false,
//     },
//     {
//       x: 670,
//       y: GAME_CONFIG.CANVAS_HEIGHT - 330,
//       width: 16,
//       height: 16,
//       order: 10,
//       group: 5,
//       isCollected: false,
//       isBlinking: false,
//     },

//     // Fifth level
//     {
//       x: 420,
//       y: GAME_CONFIG.CANVAS_HEIGHT - 390,
//       width: 16,
//       height: 16,
//       order: 11,
//       group: 6,
//       isCollected: false,
//       isBlinking: false,
//     },

//     // Sixth level
//     {
//       x: 270,
//       y: GAME_CONFIG.CANVAS_HEIGHT - 450,
//       width: 16,
//       height: 16,
//       order: 12,
//       group: 6,
//       isCollected: false,
//       isBlinking: false,
//     },
//     {
//       x: 570,
//       y: GAME_CONFIG.CANVAS_HEIGHT - 450,
//       width: 16,
//       height: 16,
//       order: 13,
//       group: 6,
//       isCollected: false,
//       isBlinking: false,
//     },

//     // Additional scattered bombs
//     {
//       x: 25,
//       y: GAME_CONFIG.CANVAS_HEIGHT - 90,
//       width: 16,
//       height: 16,
//       order: 14,
//       group: 6,
//       isCollected: false,
//       isBlinking: false,
//     },
//     {
//       x: 775,
//       y: GAME_CONFIG.CANVAS_HEIGHT - 90,
//       width: 16,
//       height: 16,
//       order: 15,
//       group: 6,
//       isCollected: false,
//       isBlinking: false,
//     },
//     {
//       x: 180,
//       y: GAME_CONFIG.CANVAS_HEIGHT - 150,
//       width: 16,
//       height: 16,
//       order: 16,
//       group: 6,
//       isCollected: false,
//       isBlinking: false,
//     },
//     {
//       x: 620,
//       y: GAME_CONFIG.CANVAS_HEIGHT - 150,
//       width: 16,
//       height: 16,
//       order: 17,
//       group: 6,
//       isCollected: false,
//       isBlinking: false,
//     },
//     {
//       x: 280,
//       y: GAME_CONFIG.CANVAS_HEIGHT - 210,
//       width: 16,
//       height: 16,
//       order: 18,
//       group: 6,
//       isCollected: false,
//       isBlinking: false,
//     },
//     {
//       x: 520,
//       y: GAME_CONFIG.CANVAS_HEIGHT - 210,
//       width: 16,
//       height: 16,
//       order: 19,
//       group: 6,
//       isCollected: false,
//       isBlinking: false,
//     },
//     {
//       x: 370,
//       y: GAME_CONFIG.CANVAS_HEIGHT - 270,
//       width: 16,
//       height: 16,
//       order: 20,
//       group: 6,
//       isCollected: false,
//       isBlinking: false,
//     },
//     {
//       x: 470,
//       y: GAME_CONFIG.CANVAS_HEIGHT - 270,
//       width: 16,
//       height: 16,
//       order: 21,
//       group: 6,
//       isCollected: false,
//       isBlinking: false,
//     },
//     {
//       x: 220,
//       y: GAME_CONFIG.CANVAS_HEIGHT - 330,
//       width: 16,
//       height: 16,
//       order: 22,
//       group: 6,
//       isCollected: false,
//       isBlinking: false,
//     },
//     {
//       x: 580,
//       y: GAME_CONFIG.CANVAS_HEIGHT - 330,
//       width: 16,
//       height: 16,
//       order: 23,
//       group: 6,
//       isCollected: false,
//       isBlinking: false,
//     },
//   ],

//   monsters: [
//     {
//       x: 150,
//       y: GAME_CONFIG.CANVAS_HEIGHT - 70,
//       width: GAME_CONFIG.MONSTER_SIZE,
//       height: GAME_CONFIG.MONSTER_SIZE,
//       color: COLORS.MONSTER,
//       type: MonsterType.HORIZONTAL_PATROL,
//       patrolStartX: 100,
//       patrolEndX: 300,
//       speed: 4,
//       direction: 1,
//       isActive: true,
//     },
//     {
//       x: 650,
//       y: GAME_CONFIG.CANVAS_HEIGHT - 130,
//       width: GAME_CONFIG.MONSTER_SIZE,
//       height: GAME_CONFIG.MONSTER_SIZE,
//       color: COLORS.MONSTER,
//       type: MonsterType.HORIZONTAL_PATROL,
//       patrolStartX: 600,
//       patrolEndX: 800,
//       speed: 4.2,
//       direction: -1,
//       isActive: true,
//     },
//     {
//       x: 300,
//       y: GAME_CONFIG.CANVAS_HEIGHT - 170,
//       width: GAME_CONFIG.MONSTER_SIZE,
//       height: GAME_CONFIG.MONSTER_SIZE,
//       color: COLORS.MONSTER,
//       type: MonsterType.HORIZONTAL_PATROL,
//       patrolStartX: 250,
//       patrolEndX: 450,
//       speed: 3.8,
//       direction: 1,
//       isActive: true,
//     },
//     {
//       x: 500,
//       y: GAME_CONFIG.CANVAS_HEIGHT - 290,
//       width: GAME_CONFIG.MONSTER_SIZE,
//       height: GAME_CONFIG.MONSTER_SIZE,
//       color: COLORS.MONSTER,
//       type: MonsterType.HORIZONTAL_PATROL,
//       patrolStartX: 450,
//       patrolEndX: 650,
//       speed: 3.6,
//       direction: -1,
//       isActive: true,
//     },
//     {
//       x: 400,
//       y: GAME_CONFIG.CANVAS_HEIGHT - 350,
//       width: GAME_CONFIG.MONSTER_SIZE,
//       height: GAME_CONFIG.MONSTER_SIZE,
//       color: COLORS.MONSTER,
//       type: MonsterType.HORIZONTAL_PATROL,
//       patrolStartX: 350,
//       patrolEndX: 550,
//       speed: 4,
//       direction: 1,
//       isActive: true,
//     },
//   ],

//   coinSpawnPoints: [
//     // Power coin spawn points for level 5 - only 2 per map with non-cardinal angles
//     {
//       x: 300,
//       y: GAME_CONFIG.CANVAS_HEIGHT - 100,
//       type: CoinType.POWER,
//       spawnAngle: 165,
//     },
//     {
//       x: 500,
//       y: GAME_CONFIG.CANVAS_HEIGHT - 140,
//       type: CoinType.POWER,
//       spawnAngle: 15,
//     },
//   ],
// };
// export const level6Map: MapDefinition = {
//   id: "level6",
//   name: "Ocean Depths",
//   width: GAME_CONFIG.CANVAS_WIDTH,
//   height: GAME_CONFIG.CANVAS_HEIGHT,
//   playerStart: centerPoint(),
//   ...createBackgroundConfig("Ocean Depths"),

//   groupSequence: [1, 2, 3, 4, 5, 6],
//   difficulty: 5,

//   ground: {
//     x: 0,
//     y: GAME_CONFIG.CANVAS_HEIGHT - 40,
//     width: GAME_CONFIG.CANVAS_WIDTH,
//     height: 40,
//     color: "#47567f",
//   },

//   platforms: [
//     // Floating platforms in spiral pattern
//     createPlatform(
//       200,
//       GAME_CONFIG.CANVAS_HEIGHT - 120,
//       { width: 60, height: 60 },
//       "#ebb185"
//     ),
//     createPlatform(
//       600,
//       GAME_CONFIG.CANVAS_HEIGHT - 110,
//       { width: 60, height: 60 },
//       "#ebb185"
//     ),

//     createPlatform(
//       100,
//       GAME_CONFIG.CANVAS_HEIGHT - 180,
//       { width: 60, height: 60 },
//       "#ebb185"
//     ),
//     createPlatform(
//       700,
//       GAME_CONFIG.CANVAS_HEIGHT - 180,
//       { width: 60, height: 60 },
//       "#ebb185"
//     ),

//     createPlatform(
//       300,
//       GAME_CONFIG.CANVAS_HEIGHT - 240,
//       { width: 60, height: 60 },
//       "#ebb185"
//     ),
//     createPlatform(
//       500,
//       GAME_CONFIG.CANVAS_HEIGHT - 240,
//       { width: 60, height: 60 },
//       "#ebb185"
//     ),

//     createPlatform(
//       150,
//       GAME_CONFIG.CANVAS_HEIGHT - 300,
//       { width: 60, height: 60 },
//       "#ebb185"
//     ),
//     createPlatform(
//       650,
//       GAME_CONFIG.CANVAS_HEIGHT - 300,
//       { width: 60, height: 60 },
//       "#ebb185"
//     ),

//     createPlatform(
//       400,
//       GAME_CONFIG.CANVAS_HEIGHT - 370,
//       { width: 60, height: 60 },
//       "#ebb185"
//     ),

//     createPlatform(
//       250,
//       GAME_CONFIG.CANVAS_HEIGHT - 420,
//       { width: 60, height: 60 },
//       "#ebb185"
//     ),
//     createPlatform(
//       550,
//       GAME_CONFIG.CANVAS_HEIGHT - 420,
//       { width: 60, height: 60 },
//       "#ebb185"
//     ),
//   ],

//   bombs: [
//     // Ground level
//     {
//       x: 70,
//       y: GAME_CONFIG.CANVAS_HEIGHT - 70,
//       width: 16,
//       height: 16,
//       order: 1,
//       group: 1,
//       isCollected: false,
//       isBlinking: false,
//     },
//     {
//       x: 750,
//       y: GAME_CONFIG.CANVAS_HEIGHT - 70,
//       width: 16,
//       height: 16,
//       order: 2,
//       group: 1,
//       isCollected: false,
//       isBlinking: false,
//     },

//     // First floating level
//     {
//       x: 220,
//       y: GAME_CONFIG.CANVAS_HEIGHT - 150,
//       width: 16,
//       height: 16,
//       order: 3,
//       group: 2,
//       isCollected: false,
//       isBlinking: false,
//     },
//     {
//       x: 620,
//       y: GAME_CONFIG.CANVAS_HEIGHT - 150,
//       width: 16,
//       height: 16,
//       order: 4,
//       group: 2,
//       isCollected: false,
//       isBlinking: false,
//     },

//     // Second level
//     {
//       x: 120,
//       y: GAME_CONFIG.CANVAS_HEIGHT - 210,
//       width: 16,
//       height: 16,
//       order: 5,
//       group: 3,
//       isCollected: false,
//       isBlinking: false,
//     },
//     {
//       x: 720,
//       y: GAME_CONFIG.CANVAS_HEIGHT - 210,
//       width: 16,
//       height: 16,
//       order: 6,
//       group: 3,
//       isCollected: false,
//       isBlinking: false,
//     },

//     // Third level
//     {
//       x: 320,
//       y: GAME_CONFIG.CANVAS_HEIGHT - 270,
//       width: 16,
//       height: 16,
//       order: 7,
//       group: 4,
//       isCollected: false,
//       isBlinking: false,
//     },
//     {
//       x: 540,
//       y: GAME_CONFIG.CANVAS_HEIGHT - 270,
//       width: 16,
//       height: 16,
//       order: 8,
//       group: 4,
//       isCollected: false,
//       isBlinking: false,
//     },

//     // Fourth level
//     {
//       x: 170,
//       y: GAME_CONFIG.CANVAS_HEIGHT - 330,
//       width: 16,
//       height: 16,
//       order: 9,
//       group: 5,
//       isCollected: false,
//       isBlinking: false,
//     },
//     {
//       x: 670,
//       y: GAME_CONFIG.CANVAS_HEIGHT - 330,
//       width: 16,
//       height: 16,
//       order: 10,
//       group: 5,
//       isCollected: false,
//       isBlinking: false,
//     },

//     // Fifth level
//     {
//       x: 420,
//       y: GAME_CONFIG.CANVAS_HEIGHT - 390,
//       width: 16,
//       height: 16,
//       order: 11,
//       group: 6,
//       isCollected: false,
//       isBlinking: false,
//     },

//     // Sixth level
//     {
//       x: 270,
//       y: GAME_CONFIG.CANVAS_HEIGHT - 450,
//       width: 16,
//       height: 16,
//       order: 12,
//       group: 6,
//       isCollected: false,
//       isBlinking: false,
//     },
//     {
//       x: 570,
//       y: GAME_CONFIG.CANVAS_HEIGHT - 450,
//       width: 16,
//       height: 16,
//       order: 13,
//       group: 6,
//       isCollected: false,
//       isBlinking: false,
//     },

//     // Additional scattered bombs
//     {
//       x: 25,
//       y: GAME_CONFIG.CANVAS_HEIGHT - 90,
//       width: 16,
//       height: 16,
//       order: 14,
//       group: 6,
//       isCollected: false,
//       isBlinking: false,
//     },
//     {
//       x: 775,
//       y: GAME_CONFIG.CANVAS_HEIGHT - 90,
//       width: 16,
//       height: 16,
//       order: 15,
//       group: 6,
//       isCollected: false,
//       isBlinking: false,
//     },
//     {
//       x: 180,
//       y: GAME_CONFIG.CANVAS_HEIGHT - 150,
//       width: 16,
//       height: 16,
//       order: 16,
//       group: 6,
//       isCollected: false,
//       isBlinking: false,
//     },
//     {
//       x: 620,
//       y: GAME_CONFIG.CANVAS_HEIGHT - 150,
//       width: 16,
//       height: 16,
//       order: 17,
//       group: 6,
//       isCollected: false,
//       isBlinking: false,
//     },
//     {
//       x: 280,
//       y: GAME_CONFIG.CANVAS_HEIGHT - 210,
//       width: 16,
//       height: 16,
//       order: 18,
//       group: 6,
//       isCollected: false,
//       isBlinking: false,
//     },
//     {
//       x: 520,
//       y: GAME_CONFIG.CANVAS_HEIGHT - 210,
//       width: 16,
//       height: 16,
//       order: 19,
//       group: 6,
//       isCollected: false,
//       isBlinking: false,
//     },
//     {
//       x: 370,
//       y: GAME_CONFIG.CANVAS_HEIGHT - 270,
//       width: 16,
//       height: 16,
//       order: 20,
//       group: 6,
//       isCollected: false,
//       isBlinking: false,
//     },
//     {
//       x: 470,
//       y: GAME_CONFIG.CANVAS_HEIGHT - 270,
//       width: 16,
//       height: 16,
//       order: 21,
//       group: 6,
//       isCollected: false,
//       isBlinking: false,
//     },
//     {
//       x: 220,
//       y: GAME_CONFIG.CANVAS_HEIGHT - 330,
//       width: 16,
//       height: 16,
//       order: 22,
//       group: 6,
//       isCollected: false,
//       isBlinking: false,
//     },
//     {
//       x: 580,
//       y: GAME_CONFIG.CANVAS_HEIGHT - 330,
//       width: 16,
//       height: 16,
//       order: 23,
//       group: 6,
//       isCollected: false,
//       isBlinking: false,
//     },
//   ],

//   monsters: [
//     {
//       x: 150,
//       y: GAME_CONFIG.CANVAS_HEIGHT - 70,
//       width: GAME_CONFIG.MONSTER_SIZE,
//       height: GAME_CONFIG.MONSTER_SIZE,
//       color: COLORS.MONSTER,
//       type: MonsterType.HORIZONTAL_PATROL,
//       patrolStartX: 100,
//       patrolEndX: 300,
//       speed: 4,
//       direction: 1,
//       isActive: true,
//     },
//     {
//       x: 650,
//       y: GAME_CONFIG.CANVAS_HEIGHT - 130,
//       width: GAME_CONFIG.MONSTER_SIZE,
//       height: GAME_CONFIG.MONSTER_SIZE,
//       color: COLORS.MONSTER,
//       type: MonsterType.HORIZONTAL_PATROL,
//       patrolStartX: 600,
//       patrolEndX: 800,
//       speed: 4.2,
//       direction: -1,
//       isActive: true,
//     },
//     {
//       x: 300,
//       y: GAME_CONFIG.CANVAS_HEIGHT - 170,
//       width: GAME_CONFIG.MONSTER_SIZE,
//       height: GAME_CONFIG.MONSTER_SIZE,
//       color: COLORS.MONSTER,
//       type: MonsterType.HORIZONTAL_PATROL,
//       patrolStartX: 250,
//       patrolEndX: 450,
//       speed: 3.8,
//       direction: 1,
//       isActive: true,
//     },
//     {
//       x: 500,
//       y: GAME_CONFIG.CANVAS_HEIGHT - 290,
//       width: GAME_CONFIG.MONSTER_SIZE,
//       height: GAME_CONFIG.MONSTER_SIZE,
//       color: COLORS.MONSTER,
//       type: MonsterType.HORIZONTAL_PATROL,
//       patrolStartX: 450,
//       patrolEndX: 650,
//       speed: 3.6,
//       direction: -1,
//       isActive: true,
//     },
//     {
//       x: 400,
//       y: GAME_CONFIG.CANVAS_HEIGHT - 350,
//       width: GAME_CONFIG.MONSTER_SIZE,
//       height: GAME_CONFIG.MONSTER_SIZE,
//       color: COLORS.MONSTER,
//       type: MonsterType.HORIZONTAL_PATROL,
//       patrolStartX: 350,
//       patrolEndX: 550,
//       speed: 4,
//       direction: 1,
//       isActive: true,
//     },
//   ],

//   coinSpawnPoints: [
//     // Power coin spawn points for level 5 - only 2 per map with non-cardinal angles
//     {
//       x: 300,
//       y: GAME_CONFIG.CANVAS_HEIGHT - 100,
//       type: CoinType.POWER,
//       spawnAngle: 165,
//     },
//     {
//       x: 500,
//       y: GAME_CONFIG.CANVAS_HEIGHT - 140,
//       type: CoinType.POWER,
//       spawnAngle: 15,
//     },
//   ],
// };

// export const level7Map: MapDefinition = {
//   id: "level1",
//   name: "Taco Street",
//   width: GAME_CONFIG.CANVAS_WIDTH,
//   height: GAME_CONFIG.CANVAS_HEIGHT,
//   playerStart: centerPoint(),
//   ...createBackgroundConfig("Taco Street"),

//   groupSequence: [1, 2, 3, 4, 5],
//   difficulty: 1,

//   ground: {
//     x: 0,
//     y: GAME_CONFIG.CANVAS_HEIGHT - 40,
//     width: GAME_CONFIG.CANVAS_WIDTH,
//     height: 40,
//     color: "#46474c",
//   },

//   platforms: [
//     // bottom left
//     createPlatform(95, 220, { width: 15, height: 150 }, "#ebb185"),
//     createPlatform(95, 450, { width: 200, height: 15 }, "#ebb185"),
//     // Top right
//     createPlatform(480, 150, { width: 200, height: 15 }, "#ebb185"),
//     createPlatform(684, 220, { width: 15, height: 150 }, "#ebb185"),
//     createPlatform(430, 430, { width: 200, height: 15 }, "#ebb185"),
//     createPlatform(170, 170, { width: 200, height: 15 }, "#ebb185"),
//   ],

//   bombs: [
//     // Group 1
//     createBomb(440, 400, 1, 1),
//     createBomb(490, 400, 2, 1),
//     createBomb(540, 400, 3, 1),
//     createBomb(590, 400, 4, 1),

//     // Group 2
//     createBomb(180, 140, 1, 2),
//     createBomb(230, 140, 2, 2),
//     createBomb(280, 140, 3, 2),
//     createBomb(330, 140, 4, 2),

//     // Group 3
//     createBomb(710, 230, 1, 3),
//     createBomb(710, 280, 2, 3),
//     createBomb(710, 330, 3, 3),

//     // Group 4
//     createBomb(130, 470, 1, 4),
//     createBomb(180, 470, 2, 4),
//     createBomb(230, 470, 3, 4),

//     // Group 5
//     createBomb(520, 70, 1, 5),
//     createBomb(570, 70, 2, 5),
//     createBomb(620, 70, 3, 5),

//     // Group 6
//     createBomb(120, 230, 1, 6),
//     createBomb(120, 280, 2, 6),
//     createBomb(120, 330, 3, 6),

//     // Group 7
//     createBomb(130, 420, 1, 7),
//     createBomb(180, 420, 2, 7),
//     createBomb(230, 420, 3, 7),
//   ],

//   coinSpawnPoints: [],

//   monsterSpawnPoints: [
//     // Test monster - spawns immediately
//   ],

//   monsters: [],
// };

export const mapDefinitions = [
  level1Map,
  level2Map,
  level3Map,
  // level4Map,
  // level5Map,
  // level6Map,
  // level7Map,
];
