import { MapDefinition, Bomb, Platform } from "../types/interfaces";
import { GAME_CONFIG, COLORS } from "../types/constants";
import { CoinType } from "../types/enums";
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
  group: number,
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
  borderColor: string = "#000",
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
  borderColor: string = "#000",
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

// Level 1 - Bedroom
export const level1Map: MapDefinition = {
  id: "level1",
  name: "soverommet",
  width: GAME_CONFIG.CANVAS_WIDTH,
  height: GAME_CONFIG.CANVAS_HEIGHT,
  background: "soverommet",
  playerStart: centerPoint(GAME_CONFIG.PLAYER_WIDTH, GAME_CONFIG.PLAYER_HEIGHT),
  spawnIndicatorColor: "#ff9ff3", // Pink for blue background

  groupSequence: [1, 2, 3, 4, 5, 6],

  ground: {
    x: 0,
    y: GAME_CONFIG.CANVAS_HEIGHT - 40,
    width: GAME_CONFIG.CANVAS_WIDTH,
    height: 40,
    color: "#4c6986",
  },

  platforms: [
    // Floating platforms in spiral pattern
    createPlatform(125, 170, { width: 150, height: 15 }, "#ebb185"),
    createPlatform(525, 170, { width: 150, height: 15 }, "#ebb185"),

    createPlatform(0, 270, { width: 50, height: 15 }, "#ebb185"),
    createPlatform(750, 270, { width: 50, height: 15 }, "#ebb185"),

    createPlatform(100, 400, { width: 200, height: 15 }, "#ebb185"),
    createPlatform(500, 400, { width: 200, height: 15 }, "#ebb185"),
  ],

  bombs: [
    createBomb(260, 525, 1, 1),
    createBomb(210, 525, 2, 1),
    createBomb(160, 525, 3, 1),

    createBomb(510, 525, 4, 2),
    createBomb(560, 525, 5, 2),
    createBomb(610, 525, 6, 2),
    createBomb(660, 525, 7, 2),

    createBomb(260, 368, 8, 3),
    createBomb(210, 368, 9, 3),
    createBomb(160, 368, 10, 3),
    createBomb(110, 368, 11, 3),

    createBomb(10, 240, 12, 4),

    createBomb(140, 138, 13, 5),
    createBomb(190, 138, 14, 5),
    createBomb(240, 138, 15, 5),

    createBomb(510, 368, 16, 6),
    createBomb(560, 368, 17, 6),
    createBomb(610, 368, 18, 6),
    createBomb(660, 368, 19, 6),

    createBomb(765, 240, 20, 7),

    createBomb(640, 138, 21, 8),
    createBomb(590, 138, 22, 8),
    createBomb(540, 138, 23, 8),
  ],

  monsters: [
    createHorizontalPatrolMonster(
      125,
      170,
      150,
      "left",
      1,
      1,
      undefined,
      0,
      "green",
    ),
    createHorizontalPatrolMonster(
      525,
      170,
      150,
      "right",
      1,
      1,
      undefined,
      0,
      "black",
    ),

    createHorizontalPatrolMonster(
      100,
      400,
      200,
      "right",
      1,
      1,
      undefined,
      0,
      "green",
    ),
    createHorizontalPatrolMonster(
      500,
      400,
      200,
      "left",
      1,
      1,
      undefined,
      0,
      "black",
    ),
  ],

  monsterSpawnPoints: [
    {
      spawnDelay: 10000,
      createMonster: () => createChaserMonster(500, 500, 1),
    },
    {
      spawnDelay: 13000,
      createMonster: () => createAmbusherMonster(600, 100, 1),
    },
  ],

  coinSpawnPoints: [
    // Power coin spawn points for level 5 - only 2 per map with non-cardinal angles
    {
      x: 300,
      y: 100,
      type: CoinType.POWER,
      spawnAngle: 65,
    },
    {
      x: centerX(GAME_CONFIG.COIN_SIZE),
      y: centerY(GAME_CONFIG.COIN_SIZE),
      type: CoinType.POWER,
      spawnAngle: -55,
    },
    {
      x: 190,
      y: 100,
      type: CoinType.BONUS_MULTIPLIER,
    },
    {
      x: 590,
      y: 100,
      type: CoinType.BONUS_MULTIPLIER,
    },
    {
      x: 190,
      y: 100,
      type: CoinType.EXTRA_LIFE,
    },
    {
      x: 590,
      y: 100,
      type: CoinType.EXTRA_LIFE,
    },
  ],
};

// Level 2 - Startup Lab - Norge
export const level2Map: MapDefinition = {
  id: "level1",
  name: "startup lab",
  width: GAME_CONFIG.CANVAS_WIDTH,
  height: GAME_CONFIG.CANVAS_HEIGHT,
  playerStart: centerPoint(GAME_CONFIG.PLAYER_WIDTH, GAME_CONFIG.PLAYER_HEIGHT),
  spawnIndicatorColor: "#00ffff", // Cyan for light background

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
    {
      spawnDelay: 4000,
      createMonster: () =>
        createHorizontalPatrolMonster(
          430,
          430,
          200,
          "left",
          1,
          1.0,
          undefined,
          0,
          "green",
        ),
    },

    {
      spawnDelay: 5000,
      createMonster: () => createAmbusherMonster(500, 500, 1),
    },
  ],

  monsters: [
    createVerticalPatrolMonster(105, 220, 220, "right"),
    createVerticalPatrolMonster(695, 220, 220, "right", 2, 1),
    createHorizontalPatrolMonster(
      170,
      170,
      200,
      "left",
      1,
      1,
      undefined,
      0,
      "black",
    ),
    createChaserMonster(250, 300, 1, 0.3, 1000),
  ],
};

// Level 3 - Innovasjon Norge
export const level3Map: MapDefinition = {
  id: "level2",
  name: "innovasjon norge",
  width: GAME_CONFIG.CANVAS_WIDTH,
  height: GAME_CONFIG.CANVAS_HEIGHT,
  playerStart: centerPoint(GAME_CONFIG.PLAYER_WIDTH, GAME_CONFIG.PLAYER_HEIGHT),
  spawnIndicatorColor: "#ff6b6b", // Red-orange for dark background

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
    createHorizontalPatrolMonster(
      165,
      130,
      150,
      "left",
      0,
      0.7,
      undefined,
      0,
      "green",
    ),
    // Monster on top right platform (right side, 2 walks)
    createHorizontalPatrolMonster(
      485,
      130,
      150,
      "right",
      0,
      1,
      undefined,
      0,
      "black",
    ),
    // Monster on upper middle platform (left side, 1 walk)
    createHorizontalPatrolMonster(
      300,
      240,
      200,
      "left",
      0,
      1,
      undefined,
      0,
      "green",
    ),
    createFloaterMonster(50, 300, 45, 1),
    createFloaterMonster(750, 500, 155, 1),
    // createAmbusherMonster(50, 500),
  ],
};

// Level 4 - Skatteetaten
export const level4Map: MapDefinition = {
  id: "level3",
  name: "skatteetaten",
  width: GAME_CONFIG.CANVAS_WIDTH,
  height: GAME_CONFIG.CANVAS_HEIGHT,
  playerStart: centerPoint(GAME_CONFIG.PLAYER_WIDTH, GAME_CONFIG.PLAYER_HEIGHT),
  spawnIndicatorColor: "#4ecdc4", // Teal for blue-gray background

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

  coinSpawnPoints: [
    {
      x: centerX(GAME_CONFIG.COIN_SIZE),
      y: centerY(GAME_CONFIG.COIN_SIZE),
      type: CoinType.POWER,
      spawnAngle: -30,
    },
    {
      x: centerX(GAME_CONFIG.COIN_SIZE),
      y: centerY(GAME_CONFIG.COIN_SIZE),
      type: CoinType.POWER,
      spawnAngle: -120,
    },
    {
      x: 180,
      y: 190,
      type: CoinType.BONUS_MULTIPLIER,
    },
    {
      x: 595,
      y: 190,
      type: CoinType.BONUS_MULTIPLIER,
    },
    {
      x: 180,
      y: 190,
      type: CoinType.EXTRA_LIFE,
    },
    {
      x: 595,
      y: 190,
      type: CoinType.EXTRA_LIFE,
    },
  ],

  monsters: [
    // Static monster on horizontal platform
    createHorizontalPatrolMonster(
      150,
      490,
      500,
      "left",
      0,
      1,
      undefined,
      0,
      "green",
    ),
    createHorizontalPatrolMonster(
      150,
      130,
      500,
      "left",
      0,
      1,
      undefined,
      0,
      "black",
    ),
    createHorizontalPatrolMonster(
      150,
      130,
      500,
      "right",
      0,
      1,
      undefined,
      0,
      "green",
    ),
    createHorizontalPatrolMonster(
      100,
      400,
      200,
      "right",
      0,
      1,
      undefined,
      0,
      "black",
    ),
    createHorizontalPatrolMonster(
      500,
      400,
      200,
      "left",
      0,
      1,
      undefined,
      0,
      "green",
    ),
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
          1,
        ),
    },
    {
      spawnDelay: 6000,
      createMonster: () =>
        createFloaterMonster(
          centerX(GAME_CONFIG.MONSTER_SIZE),
          centerY(GAME_CONFIG.MONSTER_SIZE),
          50,
          1,
        ),
    },
    // Chaser monster - spawns after 6 seconds

    {
      spawnDelay: 5000,
      createMonster: () =>
        createAmbusherMonster(
          50, // startX
          500, // startY
          1.0, // speed (reduced from 1.5)
          8000, // ambushInterval (increased from 500 to match new base value)
        ),
    },
  ],
};

// Level 5 - NAV
export const level5Map: MapDefinition = {
  id: "level5",
  name: "nav",
  width: GAME_CONFIG.CANVAS_WIDTH,
  height: GAME_CONFIG.CANVAS_HEIGHT,
  playerStart: centerPoint(GAME_CONFIG.PLAYER_WIDTH, GAME_CONFIG.PLAYER_HEIGHT),
  spawnIndicatorColor: "#ffe66d", // Yellow for green background

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
    {
      x: centerX(GAME_CONFIG.COIN_SIZE),
      y: centerY(GAME_CONFIG.COIN_SIZE),
      type: CoinType.POWER,
      spawnAngle: -20,
    },
    {
      x: 80,
      y: 200,
      type: CoinType.POWER,
      spawnAngle: 60,
    },
    {
      x: 150,
      y: 10,
      type: CoinType.BONUS_MULTIPLIER,
    },
    {
      x: 550,
      y: 10,
      type: CoinType.BONUS_MULTIPLIER,
    },
    {
      x: 150,
      y: 10,
      type: CoinType.EXTRA_LIFE,
    },
    {
      x: 550,
      y: 10,
      type: CoinType.EXTRA_LIFE,
    },
  ],
  monsterSpawnPoints: [
    // Vertical patrol monster - spawns after 3 seconds
    // {
    //   spawnDelay: 4000,
    //   createMonster: () =>
    //     createFloaterMonster(
    //       centerX(GAME_CONFIG.MONSTER_SIZE),
    //       centerY(GAME_CONFIG.MONSTER_SIZE),
    //       65,
    //       1
    //     ),
    // },
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
          1.2, // speed (reduced from 2)
          8000, // ambushInterval (increased from 300 to match new base value)
        ),
    },
    {
      spawnDelay: 10000,
      createMonster: () =>
        createAmbusherMonster(
          725, // startX
          100, // startY
          1, // speed (reduced from 2)
        ),
    },
    // {
    //   spawnDelay: 4000,
    //   createMonster: () =>
    //     createChaserMonster(
    //       centerX(GAME_CONFIG.MONSTER_SIZE), // startX
    //       centerY(GAME_CONFIG.MONSTER_SIZE), // startY
    //       3, // Speed
    //       0.5 // Directness
    //       // updateInterval
    //     ),
    // },
    {
      spawnDelay: 9000,
      createMonster: () =>
        createChaserMonster(
          590, // startX
          400, // startY
          3, // Speed
          0.5, // Directness
          // updateInterval
        ),
    },
  ],

  monsters: [
    createVerticalPatrolMonster(500, 170, 350, "right"),
    createVerticalPatrolMonster(240, 60, 340, "right"),
    createHorizontalPatrolMonster(
      90,
      500,
      200,
      "left",
      1,
      1,
      undefined,
      0,
      "green",
    ),
    createHorizontalPatrolMonster(
      90,
      45,
      150,
      "right",
      1,
      1,
      undefined,
      0,
      "black",
    ),
  ],
};

// Level 6 - Kommunehuset
export const level6Map: MapDefinition = {
  id: "level5",
  name: "kommunehuset",
  width: GAME_CONFIG.CANVAS_WIDTH,
  height: GAME_CONFIG.CANVAS_HEIGHT,
  playerStart: centerPoint(GAME_CONFIG.PLAYER_WIDTH, GAME_CONFIG.PLAYER_HEIGHT),
  spawnIndicatorColor: "#a8e6cf", // Light green for purple background

  groupSequence: [1, 2, 3, 4, 5, 6],

  ground: {
    x: 0,
    y: GAME_CONFIG.CANVAS_HEIGHT - 40,
    width: GAME_CONFIG.CANVAS_WIDTH,
    height: 40,
    color: "#8d4fc9",
  },

  platforms: [
    createPlatform(375, 300, { width: 50, height: 15 }, "#ff4700", "#631b09"),
    createPlatform(88, 300, { width: 50, height: 15 }, "#ff4700", "#631b09"),
    createPlatform(667, 300, { width: 50, height: 15 }, "#ff4700", "#631b09"),
  ],

  bombs: [
    // Top left
    createBomb(150, 60, 1, 1),
    createBomb(100, 60, 2, 1),
    createBomb(50, 60, 3, 1),
    // Top right
    createBomb(625, 60, 4, 2),
    createBomb(675, 60, 5, 2),
    createBomb(725, 60, 6, 2),

    // Bottom left
    createBomb(150, 525, 7, 3),
    createBomb(100, 525, 8, 3),
    createBomb(50, 525, 9, 3),
    // Bottom right
    createBomb(625, 525, 10, 4),
    createBomb(675, 525, 11, 4),
    createBomb(725, 525, 12, 4),

    // Top middle
    createBomb(438, 100, 13, 5),
    createBomb(388, 100, 14, 5),
    createBomb(338, 100, 15, 5),

    // Bottom middle
    createBomb(338, 525, 16, 6),
    createBomb(388, 525, 17, 6),
    createBomb(438, 525, 18, 6),

    // Bottom middle vertical
    createBomb(388, 330, 19, 6),
    createBomb(388, 380, 20, 6),
    createBomb(388, 430, 21, 6),

    // left platform
    createBomb(101, 270, 22, 7),
    createBomb(680, 270, 23, 7),
  ],

  monsters: [
    createVerticalPatrolMonster(520, 200, 350, "right"),
    createVerticalPatrolMonster(225, 200, 350, "right"),

    createVerticalPatrolMonster(520, 20, 350, "right"),
    createVerticalPatrolMonster(225, 20, 350, "right"),
    createHorizontalPatrolMonster(
      0,
      550,
      800,
      "left",
      1,
      1,
      undefined,
      0,
      "green",
    ),
  ],

  monsterSpawnPoints: [
    // // Test monster - spawns immediately
    {
      spawnDelay: 5000,
      createMonster: () => createAmbusherMonster(700, 150),
    },
    {
      spawnDelay: 7000,
      createMonster: () => createFloaterMonster(100, 150),
    },
    {
      spawnDelay: 10000,
      createMonster: () =>
        createChaserMonster(
          centerX(GAME_CONFIG.MONSTER_SIZE),
          centerY(GAME_CONFIG.MONSTER_SIZE + 200),
        ),
    },
    {
      spawnDelay: 15000,
      createMonster: () =>
        createFloaterMonster(
          centerX(GAME_CONFIG.MONSTER_SIZE),
          centerY(GAME_CONFIG.MONSTER_SIZE - 200),
        ),
    },
  ],

  coinSpawnPoints: [
    // Power coin spawn points for level 5 - only 2 per map with non-cardinal angles
    {
      x: 400,
      y: 500,
      type: CoinType.POWER,
      spawnAngle: 46,
    },
    {
      x: 500,
      y: 200,
      type: CoinType.POWER,
      spawnAngle: 45,
    },
    {
      x: 388,
      y: 50,
      type: CoinType.BONUS_MULTIPLIER,
    },
    {
      x: 388,
      y: 50,
      type: CoinType.EXTRA_LIFE,
    },
    {
      x: 101,
      y: 50,
      type: CoinType.BONUS_MULTIPLIER,
    },
    {
      x: 101,
      y: 50,
      type: CoinType.EXTRA_LIFE,
    },
    {
      x: 680,
      y: 50,
      type: CoinType.BONUS_MULTIPLIER,
    },
    {
      x: 680,
      y: 50,
      type: CoinType.EXTRA_LIFE,
    },
  ],
};

// Level 7 - Alltinn Norge
// Vertical-ascent zigzag: twin pillar walls anchor vertical patrols while a
// center spine of horizontal platforms forces left↔right traversal upward.
// Bomb groups are ordered floor→top — the climb itself is the difficulty curve.
export const level7Map: MapDefinition = {
  id: "level7",
  name: "alltinn norge",
  width: GAME_CONFIG.CANVAS_WIDTH,
  height: GAME_CONFIG.CANVAS_HEIGHT,
  playerStart: centerPoint(GAME_CONFIG.PLAYER_WIDTH, GAME_CONFIG.PLAYER_HEIGHT),
  spawnIndicatorColor: "#ff9ff3", // Pink — high contrast against navy ground

  groupSequence: [1, 2, 3, 4, 5, 6, 7],

  ground: {
    x: 0,
    y: GAME_CONFIG.CANVAS_HEIGHT - 40,
    width: GAME_CONFIG.CANVAS_WIDTH,
    height: 40,
    color: "#2a3858",
  },

  platforms: [
    // Twin pillar walls — vertical-patrol monster tracks
    createVerticalPlatform(40, 200, 300, "#5d8fb3", "#1a2540"),
    createVerticalPlatform(745, 200, 300, "#5d8fb3", "#1a2540"),

    // Center bottom (lane 1)
    createPlatform(300, 470, { width: 200, height: 15 }, "#5d8fb3", "#1a2540"),

    // Mid layer (lane 2 — split left/right, forces a side commit)
    createPlatform(100, 350, { width: 180, height: 15 }, "#5d8fb3", "#1a2540"),
    createPlatform(510, 350, { width: 180, height: 15 }, "#5d8fb3", "#1a2540"),

    // Lane 3 — center upper
    createPlatform(300, 210, { width: 200, height: 15 }, "#5d8fb3", "#1a2540"),

    // Top finale (lane 4 — narrow risk platform)
    createPlatform(325, 110, { width: 150, height: 15 }, "#5d8fb3", "#1a2540"),
  ],

  bombs: [
    // Group 1 — left ground (intro). 4 bombs to land at exactly 23 total
    // (GAME_CONFIG.TOTAL_BOMBS — strict equality gates level completion).
    createBomb(270, 525, 1, 1),
    createBomb(220, 525, 2, 1),
    createBomb(170, 525, 3, 1),
    createBomb(10, 325, 4, 1),

    // Group 2 — right ground (4 bombs)
    createBomb(530, 525, 5, 2),
    createBomb(580, 525, 6, 2),
    createBomb(630, 525, 7, 2),
    createBomb(765, 325, 8, 2),

    // Group 3 — center bottom platform
    createBomb(320, 440, 9, 3),
    createBomb(370, 440, 10, 3),
    createBomb(420, 440, 11, 3),

    // Group 4 — mid-left platform
    createBomb(130, 320, 12, 4),
    createBomb(180, 320, 13, 4),
    createBomb(230, 320, 14, 4),

    // Group 5 — mid-right platform
    createBomb(530, 320, 15, 5),
    createBomb(580, 320, 16, 5),
    createBomb(630, 320, 17, 5),

    // Group 6 — center upper platform (centered: platform spans x=300-500,
    // center=400; bombs at 340/390/440 give visual centers around 398).
    createBomb(340, 180, 18, 6),
    createBomb(390, 180, 19, 6),
    createBomb(440, 180, 20, 6),

    // Group 7 — top finale (narrow platform, highest risk)
    createBomb(345, 80, 21, 7),
    createBomb(395, 80, 22, 7),
    createBomb(445, 80, 23, 7),
  ],

  monsters: [
    // Spawn-pad platform (y=320) is intentionally clear so the centered drop
    // lands safely. Threats start one lane in either direction.
    createHorizontalPatrolMonster(
      300,
      470,
      200,
      "left",
      1,
      1,
      undefined,
      0,
      "green",
    ),
    createHorizontalPatrolMonster(
      80,
      350,
      180,
      "right",
      1,
      1,
      undefined,
      0,
      "black",
    ),
    createHorizontalPatrolMonster(
      540,
      350,
      180,
      "left",
      1,
      1,
      undefined,
      0,
      "black",
    ),

    // Pillar verticals — make the side approaches dangerous
    createVerticalPatrolMonster(45, 220, 280, "right"),
    createVerticalPatrolMonster(700, 220, 280, "right"),
  ],

  monsterSpawnPoints: [
    // Mid-game: ambusher emerges from below the left pillar to push the
    // player off the center-bottom platform mid-collection.
    {
      spawnDelay: 5000,
      createMonster: () => createAmbusherMonster(20, 525, 1, 8000),
    },
    // Late-game: chaser enters from above-right (clear of the right pillar
    // at x=725-740) once the player is committed to the upper half.
    {
      spawnDelay: 12000,
      createMonster: () => createChaserMonster(770, 100, 1, 0.3, 1000),
    },
    // Top-platform pressure: floater drifts in once the climb begins.
    {
      spawnDelay: 18000,
      createMonster: () => createFloaterMonster(400, 250, 50, 1),
    },
  ],

  coinSpawnPoints: [
    // P-coins spawn near the chokepoints (mid layer + top platform) so the
    // player has to commit to a route to reach them.
    {
      x: 400,
      y: 380,
      type: CoinType.POWER,
      spawnAngle: 45,
    },
    {
      x: 400,
      y: 140,
      type: CoinType.POWER,
      spawnAngle: -125,
    },

    // B-coin / E-coin candidates at the top-platform corners — reward for
    // making it that high.
    {
      x: 350,
      y: 80,
      type: CoinType.BONUS_MULTIPLIER,
    },
    {
      x: 450,
      y: 80,
      type: CoinType.BONUS_MULTIPLIER,
    },
    {
      x: 350,
      y: 80,
      type: CoinType.EXTRA_LIFE,
    },
    {
      x: 450,
      y: 80,
      type: CoinType.EXTRA_LIFE,
    },
  ],
};

export const level8Map: MapDefinition = {
  id: "level7",
  name: "silicone vally",
  width: GAME_CONFIG.CANVAS_WIDTH,
  height: GAME_CONFIG.CANVAS_HEIGHT,
  playerStart: centerPoint(GAME_CONFIG.PLAYER_WIDTH, GAME_CONFIG.PLAYER_HEIGHT),
  spawnIndicatorColor: "#feca57", // Orange for dark gray background

  groupSequence: [1, 2, 3, 4, 5],

  ground: {
    x: 0,
    y: GAME_CONFIG.CANVAS_HEIGHT - 40,
    width: GAME_CONFIG.CANVAS_WIDTH,
    height: 40,
    color: "#46474c",
  },

  platforms: [],

  bombs: [
    // Group 1
    createBomb(440, 530, 1, 1),
    createBomb(490, 530, 2, 1),
    createBomb(540, 530, 3, 1),
    createBomb(590, 530, 4, 1),

    // Group 2
    createBomb(760, 530, 5, 2),
    createBomb(760, 480, 6, 2),
    createBomb(760, 430, 7, 2),
    createBomb(760, 380, 8, 2),

    // Group 3
    createBomb(590, 330, 9, 3),
    createBomb(540, 330, 10, 3),
    createBomb(490, 330, 11, 3),
    createBomb(440, 330, 12, 3),

    // Group 4
    createBomb(290, 530, 13, 4),
    createBomb(240, 530, 14, 4),
    createBomb(190, 530, 15, 4),
    createBomb(140, 530, 16, 4),

    // Group 5
    createBomb(15, 530, 17, 5),
    createBomb(15, 480, 18, 5),
    createBomb(15, 430, 19, 5),
    createBomb(15, 380, 20, 5),

    // Group 6
    createBomb(190, 330, 21, 6),
    createBomb(240, 330, 22, 6),
    createBomb(290, 330, 23, 6),
  ],

  coinSpawnPoints: [],

  monsterSpawnPoints: [],

  monsters: [],
};

export const mapDefinitions = [
  level1Map,
  level2Map,
  level3Map,
  level4Map,
  level5Map,
  level6Map,
  level7Map,
  level8Map,
];
