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

const centerX = (offsetWidth: number) =>
  (GAME_CONFIG.CANVAS_WIDTH - offsetWidth) / 2;
const centerY = (offsetHeight: number) =>
  (GAME_CONFIG.CANVAS_HEIGHT - offsetHeight) / 2;

const centerPoint = (offsetWidth: number, offsetHeight: number) => {
  return {
    x: centerX(offsetWidth),
    y: centerY(offsetHeight),
  };
};

// Level 1 - Startup Lab - Norge
export const level1Map: MapDefinition = {
  id: "level1",
  name: "startup lab",
  width: GAME_CONFIG.CANVAS_WIDTH,
  height: GAME_CONFIG.CANVAS_HEIGHT,
  playerStart: centerPoint(GAME_CONFIG.PLAYER_WIDTH, GAME_CONFIG.PLAYER_HEIGHT),

  groupSequence: [1, 2, 3, 4, 5],

  ground: {
    x: 0,
    y: GAME_CONFIG.CANVAS_HEIGHT - 40,
    width: GAME_CONFIG.CANVAS_WIDTH,
    height: 40,
    color: "#88a2bc",
  },

  platforms: [
    // bottom left
    createVerticalPlatform(96, 220, 150, "#abccee", "#4f6a8f"),
    createVerticalPlatform(684, 220, 150, "#abccee", "#4f6a8f"),

    // Top right
    createPlatform(95, 450, { width: 200, height: 15 }, "#abccee", "#4f6a8f"),
    createPlatform(480, 150, { width: 200, height: 15 }, "#abccee", "#4f6a8f"),

    createPlatform(430, 430, { width: 200, height: 15 }, "#abccee", "#4f6a8f"),
    createPlatform(170, 170, { width: 200, height: 15 }, "#abccee", "#4f6a8f"),
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
      x: centerX(GAME_CONFIG.COIN_SIZE),
      y: centerY(GAME_CONFIG.COIN_SIZE),
      type: CoinType.POWER,
      spawnAngle: 45,
    },
    {
      x: 570,
      y: 50,
      type: CoinType.POWER,
      spawnAngle: 135,
    },
    // {
    //   x: centerX(GAME_CONFIG.COIN_SIZE),
    //   y: 75,
    //   type: CoinType.BONUS_MULTIPLIER,
    // },
    {
      x: 200,
      y: 75,
      type: CoinType.BONUS_MULTIPLIER,
    },
    {
      x: 200,
      y: 75,
      type: CoinType.BONUS_MULTIPLIER,
    },
    {
      x: 200,
      y: 75,
      type: CoinType.EXTRA_LIFE,
    },
    {
      x: 200,
      y: 75,
      type: CoinType.EXTRA_LIFE,
    },
  ],

  monsterSpawnPoints: [
    // // Test monster - spawns immediately
    // {
    //   spawnDelay: 4000,
    //   createMonster: () =>
    //     createHorizontalPatrolMonster(
    //       430, // platformX
    //       430, // platformWidth
    //       200,
    //       "left", // spawnSide
    //       1, // walkLengths
    //       1.0 // speed
    //     ),
    // },
    // // Another test monster - spawns immediately at different location
    // {
    //   spawnDelay: 10000, // Spawn immediately
    //   createMonster: () => createFloaterMonster(50, 500, 45, 1),
    // },
    // {
    //   spawnDelay: 20000,
    //   createMonster: () => createAmbusherMonster(500, 500, 1),
    // },
  ],

  monsters: [
    createVerticalPatrolMonster(105, 220, 220, "right"),
    createVerticalPatrolMonster(695, 220, 220, "right", 2, 1),
    createHorizontalPatrolMonster(170, 170, 200, "left"),
    createChaserMonster(250, 300, 1, 0.3, 1000),
  ],
};

// Level 2 - Innovasjon Norge
export const level2Map: MapDefinition = {
  id: "level2",
  name: "innovasjon norge",
  width: GAME_CONFIG.CANVAS_WIDTH,
  height: GAME_CONFIG.CANVAS_HEIGHT,
  playerStart: centerPoint(GAME_CONFIG.PLAYER_WIDTH, GAME_CONFIG.PLAYER_HEIGHT),

  groupSequence: [1, 2, 3, 4, 5],

  ground: {
    x: 0,
    y: GAME_CONFIG.CANVAS_HEIGHT - 40,
    width: GAME_CONFIG.CANVAS_WIDTH,
    height: 40,
    color: "#262335",
  },

  platforms: [
    // Bottom platforms
    createPlatform(165, 475, { width: 150, height: 15 }, "#d4896a", "#262335"),
    createPlatform(485, 475, { width: 150, height: 15 }, "#d4896a", "#262335"),
    // Middle platforms
    createPlatform(300, 380, { width: 200, height: 15 }, "#d4896a", "#262335"),
    createPlatform(300, 240, { width: 200, height: 15 }, "#d4896a", "#262335"),
    // Top platforms
    createPlatform(165, 130, { width: 150, height: 15 }, "#d4896a", "#262335"),
    createPlatform(485, 130, { width: 150, height: 15 }, "#d4896a", "#262335"),
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
    createBomb(360, 345, 22, 8),
    createBomb(410, 345, 23, 8),
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
    {
      x: 520,
      y: 100,
      type: CoinType.BONUS_MULTIPLIER,
      spawnAngle: 120,
    },
    {
      x: 180,
      y: 100,
      type: CoinType.BONUS_MULTIPLIER,
      spawnAngle: 120,
    },
    {
      x: 520,
      y: 100,
      type: CoinType.EXTRA_LIFE,
      spawnAngle: 120,
    },
    {
      x: 180,
      y: 100,
      type: CoinType.EXTRA_LIFE,
      spawnAngle: 120,
    },
  ],

  monsterSpawnPoints: [
    // // More aggressive early spawns for level 2
    {
      spawnDelay: 7000,
      createMonster: () => createChaserMonster(750, 500, 1),
    },
    {
      spawnDelay: 15000,
      createMonster: () => createAmbusherMonster(50, 500, 1),
    },
  ],

  monsters: [
    // Monster on top left platform (left side, 3 walks)
    createHorizontalPatrolMonster(165, 130, 150, "left", 0, 0.7),
    // Monster on top right platform (right side, 2 walks)
    createHorizontalPatrolMonster(485, 130, 150, "right", 0, 1),
    // Monster on upper middle platform (left side, 1 walk)
    createHorizontalPatrolMonster(300, 240, 200, "left", 0, 1),
    createFloaterMonster(50, 300, 45, 1),
    createFloaterMonster(750, 500, 155, 1),
  ],
};

// Level 3 - Skatteetaten
export const level3Map: MapDefinition = {
  id: "level3",
  name: "skatteetaten",
  width: GAME_CONFIG.CANVAS_WIDTH,
  height: GAME_CONFIG.CANVAS_HEIGHT,
  playerStart: centerPoint(GAME_CONFIG.PLAYER_WIDTH, GAME_CONFIG.PLAYER_HEIGHT),

  groupSequence: [1, 2, 3, 4, 5, 6, 7],

  ground: {
    x: 0,
    y: GAME_CONFIG.CANVAS_HEIGHT - 40,
    width: GAME_CONFIG.CANVAS_WIDTH,
    height: 40,
    color: "#3c4c56",
  },

  platforms: [
    // Bottom long platform
    createPlatform(150, 490, { width: 500, height: 15 }, "#acc7d0", "#556d7b"),
    // Middle lower platforms
    createPlatform(100, 400, { width: 200, height: 15 }, "#acc7d0", "#556d7b"),
    createPlatform(500, 400, { width: 200, height: 15 }, "#acc7d0", "#556d7b"),
    // Middle upper platforms
    createPlatform(100, 250, { width: 200, height: 15 }, "#acc7d0", "#556d7b"),
    createPlatform(500, 250, { width: 200, height: 15 }, "#acc7d0", "#556d7b"),
    // Top platforms
    createPlatform(150, 130, { width: 500, height: 15 }, "#acc7d0", "#556d7b"),
  ],

  bombs: [
    // Group 1
    createBomb(540, 275, 1, 1),
    createBomb(590, 275, 2, 1),
    createBomb(640, 275, 3, 1),
    // Group 2
    createBomb(240, 275, 4, 2),
    createBomb(190, 275, 5, 2),
    createBomb(140, 275, 6, 2),
    // Group 3
    createBomb(325, 515, 7, 3),
    createBomb(375, 515, 8, 3),
    createBomb(425, 515, 9, 3),
    // Group 4
    createBomb(760, 360, 10, 4),
    createBomb(760, 310, 11, 4),
    createBomb(760, 260, 12, 4),
    // Group 5
    createBomb(15, 360, 13, 5),
    createBomb(15, 310, 14, 5),
    createBomb(15, 260, 15, 5),
    // Group 6
    createBomb(325, 155, 16, 6),
    createBomb(375, 155, 17, 6),
    createBomb(425, 155, 18, 6),
    createBomb(375, 205, 19, 6),
    createBomb(375, 255, 20, 6),
    // Group 7
    createBomb(580, 455, 21, 7),
    createBomb(195, 455, 22, 7),
    createBomb(375, 95, 23, 7),
  ],

  coinSpawnPoints: [],

  monsters: [
    // Static monster on horizontal platform
    createHorizontalPatrolMonster(150, 490, 500, "left", 0, 1),
    createHorizontalPatrolMonster(150, 130, 500, "left", 0, 1),
    createHorizontalPatrolMonster(150, 130, 500, "right", 0, 1),
    createHorizontalPatrolMonster(100, 400, 200, "right", 0, 1),
    createHorizontalPatrolMonster(500, 400, 200, "left", 0, 1),
    createChaserMonster(200, 200, 1, 0.1, 500),
  ],

  monsterSpawnPoints: [
    // Vertical patrol monster - spawns after 3 seconds
    {
      spawnDelay: 3000,
      createMonster: () =>
        createFloaterMonster(
          centerX(GAME_CONFIG.MONSTER_SIZE),
          centerY(GAME_CONFIG.MONSTER_SIZE),
          150,
          1
        ),
    },
    {
      spawnDelay: 6000,
      createMonster: () =>
        createFloaterMonster(
          centerX(GAME_CONFIG.MONSTER_SIZE),
          centerY(GAME_CONFIG.MONSTER_SIZE),
          50,
          1
        ),
    },
    // Chaser monster - spawns after 6 seconds

    {
      spawnDelay: 5000,
      createMonster: () =>
        createAmbusherMonster(
          50, // startX
          550, // startY
          1.5, // speed
          500 // updateInterval
        ),
    },
  ],
};

// Level 4 - NAV
export const level4Map: MapDefinition = {
  id: "level4",
  name: "nav",
  width: GAME_CONFIG.CANVAS_WIDTH,
  height: GAME_CONFIG.CANVAS_HEIGHT,
  playerStart: centerPoint(GAME_CONFIG.PLAYER_WIDTH, GAME_CONFIG.PLAYER_HEIGHT),

  groupSequence: [1, 2, 3, 4, 5],

  ground: {
    x: 0,
    y: GAME_CONFIG.CANVAS_HEIGHT - 40,
    width: GAME_CONFIG.CANVAS_WIDTH,
    height: 40,
    color: "#586c5c",
  },

  platforms: [
    /* BOTTOM TUNNELs */
    // Bottom horizontal tunnel
    createPlatform(580, 500, { width: 150, height: 15 }, "#586c5c", "#202e32"),
    // Upper horizontal tunnel
    createPlatform(580, 445, { width: 150, height: 15 }, "#586c5c", "#202e32"),
    // left vetical tunnel
    createVerticalPlatform(500, 245, 150, "#586c5c", "#202e32"),
    // right vetical tunnel
    createVerticalPlatform(555, 245, 150, "#586c5c", "#202e32"),

    /* UPPER TUNNEL */
    // Upper horizontal tunnel
    createPlatform(90, 45, { width: 150, height: 15 }, "#586c5c", "#202e32"),
    // Bottom horizontal tunnel
    createPlatform(90, 100, { width: 150, height: 15 }, "#586c5c", "#202e32"),
    // left vetical tunnel
    createVerticalPlatform(240, 160, 150, "#586c5c", "#202e32"),
    // right vetical tunnel
    createVerticalPlatform(295, 160, 150, "#586c5c", "#202e32"),

    // DIAGONAL PLATFORMS
    // bottom platform
    createPlatform(90, 500, { width: 200, height: 15 }, "#586c5c", "#202e32"),
    // lower middel platform
    createPlatform(235, 400, { width: 150, height: 15 }, "#586c5c", "#202e32"),
    // upper middel platform
    createPlatform(415, 145, { width: 150, height: 15 }, "#586c5c", "#202e32"),
    // upper platform
    createPlatform(530, 45, { width: 200, height: 15 }, "#586c5c", "#202e32"),
  ],

  bombs: [
    // Bottom horizontal tunnel bombs - GROUP 1
    createBomb(595, 467, 1, 1),
    createBomb(645, 467, 2, 1),
    createBomb(695, 467, 3, 1),

    // Bottom vetical tunnel bombs - GROUP 2
    createBomb(522, 255, 4, 2),
    createBomb(522, 305, 5, 2),
    createBomb(522, 355, 6, 2),

    // Bottom platform - GROUP 3
    createBomb(130, 467, 7, 3),
    createBomb(180, 467, 8, 3),
    createBomb(230, 467, 9, 3),

    // Lower middel platform bombs - GROUP 4
    createBomb(250, 367, 10, 4),
    createBomb(300, 367, 11, 4),
    createBomb(350, 367, 12, 4),

    // Upper vetical tunnel bombs - GROUP 5
    createBomb(263, 170, 13, 5),
    createBomb(263, 220, 14, 5),
    createBomb(263, 270, 15, 5),

    // Upper horizontal tunnel bombs - GROUP 6
    createBomb(100, 67, 16, 6),
    createBomb(150, 67, 17, 6),
    createBomb(200, 67, 18, 6),

    // Upper middel platform bombs - GROUP 7
    createBomb(430, 113, 19, 7),
    createBomb(480, 113, 20, 7),
    createBomb(530, 113, 21, 7),
    // Upper platform bombs - GROUP 8
    createBomb(630, 68, 22, 8),
    createBomb(680, 68, 23, 8),
  ],

  coinSpawnPoints: [
    // {
    //   x: 400,
    //   y: GAME_CONFIG.CANVAS_HEIGHT - 150,
    //   type: CoinType.POWER,
    //   spawnAngle: 30,
    // },
    // {
    //   x: 400,
    //   y: GAME_CONFIG.CANVAS_HEIGHT - 250,
    //   type: CoinType.POWER,
    //   spawnAngle: 150,
    // },
  ],
  monsterSpawnPoints: [
    // Vertical patrol monster - spawns after 3 seconds
    {
      spawnDelay: 4000,
      createMonster: () =>
        createFloaterMonster(
          centerX(GAME_CONFIG.MONSTER_SIZE),
          centerY(GAME_CONFIG.MONSTER_SIZE),
          65,
          1
        ),
    },
    {
      spawnDelay: 6000,
      createMonster: () => createFloaterMonster(240, 350, 40, 1),
    },
    // // Chaser monster - spawns after 6 seconds

    {
      spawnDelay: 2000,
      createMonster: () =>
        createAmbusherMonster(
          50, // startX
          50, // startY
          2, // speed
          300 // updateInterval
        ),
    },
    {
      spawnDelay: 4000,
      createMonster: () =>
        createAmbusherMonster(
          50, // startX
          50, // startY
          2, // speed
          300 // updateInterval
        ),
    },
    {
      spawnDelay: 4000,
      createMonster: () =>
        createChaserMonster(
          centerX(GAME_CONFIG.MONSTER_SIZE), // startX
          centerY(GAME_CONFIG.MONSTER_SIZE), // startY
          3, // Speed
          0.5 // Directness
          // updateInterval
        ),
    },
    {
      spawnDelay: 9000,
      createMonster: () =>
        createChaserMonster(
          590, // startX
          400, // startY
          3, // Speed
          0.5 // Directness
          // updateInterval
        ),
    },
  ],

  monsters: [
    createVerticalPatrolMonster(500, 170, 350, "right"),
    createVerticalPatrolMonster(240, 60, 340, "right"),
    createHorizontalPatrolMonster(90, 500, 200, "left"),
    createHorizontalPatrolMonster(90, 45, 150, "right"),
  ],
};

// Level 5 - Kommunehuset
export const level5Map: MapDefinition = {
  id: "level5",
  name: "kommunehuset",
  width: GAME_CONFIG.CANVAS_WIDTH,
  height: GAME_CONFIG.CANVAS_HEIGHT,
  playerStart: centerPoint(GAME_CONFIG.PLAYER_WIDTH, GAME_CONFIG.PLAYER_HEIGHT),

  groupSequence: [1, 2, 3, 4, 5, 6],

  ground: {
    x: 0,
    y: GAME_CONFIG.CANVAS_HEIGHT - 40,
    width: GAME_CONFIG.CANVAS_WIDTH,
    height: 40,
    color: "#8d4fc9",
  },

  platforms: [
    // Floating platforms in spiral pattern
    createPlatform(
      200,
      GAME_CONFIG.CANVAS_HEIGHT - 120,
      { width: 60, height: 60 },
      "#8d4fc9"
    ),
    createPlatform(
      600,
      GAME_CONFIG.CANVAS_HEIGHT - 100,
      { width: 60, height: 60 },
      "#8d4fc9"
    ),

    createPlatform(
      100,
      GAME_CONFIG.CANVAS_HEIGHT - 150,
      { width: 60, height: 60 },
      "#8d4fc9"
    ),
    createPlatform(
      700,
      GAME_CONFIG.CANVAS_HEIGHT - 180,
      { width: 60, height: 60 },
      "#8d4fc9"
    ),

    createPlatform(
      300,
      GAME_CONFIG.CANVAS_HEIGHT - 240,
      { width: 60, height: 60 },
      "#8d4fc9"
    ),
    createPlatform(
      500,
      GAME_CONFIG.CANVAS_HEIGHT - 240,
      { width: 60, height: 60 },
      "#8d4fc9"
    ),

    createPlatform(
      150,
      GAME_CONFIG.CANVAS_HEIGHT - 300,
      { width: 60, height: 60 },
      "#8d4fc9"
    ),
    createPlatform(
      650,
      GAME_CONFIG.CANVAS_HEIGHT - 300,
      { width: 60, height: 60 },
      "#8d4fc9"
    ),

    createPlatform(
      400,
      GAME_CONFIG.CANVAS_HEIGHT - 300,
      { width: 60, height: 60 },
      "#8d4fc9"
    ),

    createPlatform(
      250,
      GAME_CONFIG.CANVAS_HEIGHT - 420,
      { width: 60, height: 60 },
      "#8d4fc9"
    ),
    createPlatform(
      550,
      GAME_CONFIG.CANVAS_HEIGHT - 420,
      { width: 60, height: 60 },
      "#8d4fc9"
    ),
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

// Level 6 - Alltinn Norge
export const level6Map: MapDefinition = {
  id: "level6",
  name: "alltinn norge",
  width: GAME_CONFIG.CANVAS_WIDTH,
  height: GAME_CONFIG.CANVAS_HEIGHT,
  playerStart: centerPoint(GAME_CONFIG.PLAYER_WIDTH, GAME_CONFIG.PLAYER_HEIGHT),

  groupSequence: [1, 2, 3, 4, 5, 6],

  ground: {
    x: 0,
    y: GAME_CONFIG.CANVAS_HEIGHT - 40,
    width: GAME_CONFIG.CANVAS_WIDTH,
    height: 40,
    color: "#47567f",
  },

  platforms: [
    // Floating platforms in spiral pattern
    createPlatform(
      200,
      GAME_CONFIG.CANVAS_HEIGHT - 120,
      { width: 60, height: 60 },
      "#ebb185"
    ),
    createPlatform(
      600,
      GAME_CONFIG.CANVAS_HEIGHT - 110,
      { width: 60, height: 60 },
      "#ebb185"
    ),

    createPlatform(
      100,
      GAME_CONFIG.CANVAS_HEIGHT - 180,
      { width: 60, height: 60 },
      "#ebb185"
    ),
    createPlatform(
      700,
      GAME_CONFIG.CANVAS_HEIGHT - 180,
      { width: 60, height: 60 },
      "#ebb185"
    ),

    createPlatform(
      300,
      GAME_CONFIG.CANVAS_HEIGHT - 240,
      { width: 60, height: 60 },
      "#ebb185"
    ),
    createPlatform(
      500,
      GAME_CONFIG.CANVAS_HEIGHT - 240,
      { width: 60, height: 60 },
      "#ebb185"
    ),

    createPlatform(
      150,
      GAME_CONFIG.CANVAS_HEIGHT - 300,
      { width: 60, height: 60 },
      "#ebb185"
    ),
    createPlatform(
      650,
      GAME_CONFIG.CANVAS_HEIGHT - 300,
      { width: 60, height: 60 },
      "#ebb185"
    ),

    createPlatform(
      400,
      GAME_CONFIG.CANVAS_HEIGHT - 370,
      { width: 60, height: 60 },
      "#ebb185"
    ),

    createPlatform(
      250,
      GAME_CONFIG.CANVAS_HEIGHT - 420,
      { width: 60, height: 60 },
      "#ebb185"
    ),
    createPlatform(
      550,
      GAME_CONFIG.CANVAS_HEIGHT - 420,
      { width: 60, height: 60 },
      "#ebb185"
    ),
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
      x: 750,
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

export const level7Map: MapDefinition = {
  id: "level7",
  name: "silicone vally",
  width: GAME_CONFIG.CANVAS_WIDTH,
  height: GAME_CONFIG.CANVAS_HEIGHT,
  playerStart: centerPoint(GAME_CONFIG.PLAYER_WIDTH, GAME_CONFIG.PLAYER_HEIGHT),

  groupSequence: [1, 2, 3, 4, 5],

  ground: {
    x: 0,
    y: GAME_CONFIG.CANVAS_HEIGHT - 40,
    width: GAME_CONFIG.CANVAS_WIDTH,
    height: 40,
    color: "#46474c",
  },

  platforms: [
    // bottom left
    createPlatform(95, 220, { width: 15, height: 150 }, "#ebb185"),
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
    createBomb(180, 140, 1, 2),
    createBomb(230, 140, 2, 2),
    createBomb(280, 140, 3, 2),
    createBomb(330, 140, 4, 2),

    // Group 3
    createBomb(710, 230, 1, 3),
    createBomb(710, 280, 2, 3),
    createBomb(710, 330, 3, 3),

    // Group 4
    createBomb(130, 470, 1, 4),
    createBomb(180, 470, 2, 4),
    createBomb(230, 470, 3, 4),

    // Group 5
    createBomb(520, 70, 1, 5),
    createBomb(570, 70, 2, 5),
    createBomb(620, 70, 3, 5),

    // Group 6
    createBomb(120, 230, 1, 6),
    createBomb(120, 280, 2, 6),
    createBomb(120, 330, 3, 6),

    // Group 7
    createBomb(130, 420, 1, 7),
    createBomb(180, 420, 2, 7),
    createBomb(230, 420, 3, 7),
  ],

  coinSpawnPoints: [],

  monsterSpawnPoints: [
    // Test monster - spawns immediately
  ],

  monsters: [],
};

export const mapDefinitions = [
  level1Map,
  level2Map,
  level3Map,
  level4Map,
  // level5Map,
  // level6Map,
  // level7Map,
];
