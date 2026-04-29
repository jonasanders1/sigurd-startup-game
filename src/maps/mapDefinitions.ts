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
  width: 25, // Standard wall thickness — matches PLATFORM_HEIGHT / cell grid.
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

export const level0Map: MapDefinition = {
  id: "level0",
  name: "garasjen",
  width: GAME_CONFIG.CANVAS_WIDTH,
  height: GAME_CONFIG.CANVAS_HEIGHT,
  background: "soverommet",
  playerStart: { x: 400, y: 300 },
  spawnIndicatorColor: "#ff9ff3",

  groupSequence: [1, 2, 3, 4, 5, 6, 7, 8],

  ground: {
    x: 0,
    y: 558,
    width: 800,
    height: 40,
    color: "#4c6986",
    tileTheme: "construction",
    tileNoise: 0.25,
  },

  platforms: [
    {
      ...createPlatform(75, 150, { width: 150, height: 25 }, "#2f3543", "#000"),
      tileTheme: "construction",
    },
    {
      ...createVerticalPlatform(75, 325, 150, "#2f3543", "#000"),
      tileTheme: "construction",
    },
    {
      ...createPlatform(
        100,
        450,
        { width: 150, height: 25 },
        "#2f3543",
        "#000",
      ),
      tileTheme: "construction",
    },
    {
      ...createVerticalPlatform(75, 175, 150, "#2f3543", "#000"),
      tileTheme: "construction",
    },
    {
      ...createPlatform(
        550,
        150,
        { width: 175, height: 25 },
        "#2f3543",
        "#000",
      ),
      tileTheme: "construction",
    },
    {
      ...createVerticalPlatform(700, 325, 150, "#2f3543", "#000"),
      tileTheme: "construction",
    },
    {
      ...createPlatform(
        550,
        450,
        { width: 150, height: 25 },
        "#2f3543",
        "#000",
      ),
      tileTheme: "construction",
    },
    {
      ...createVerticalPlatform(700, 175, 150, "#2f3543", "#000"),
      tileTheme: "construction",
    },
    {
      ...createPlatform(
        325,
        150,
        { width: 150, height: 25 },
        "#2f3543",
        "#000",
      ),
      tileTheme: "construction",
    },
  ],

  bombs: [
    createBomb(563, 425, 1, 1),
    createBomb(612, 425, 2, 1),
    createBomb(663, 425, 3, 1),
    createBomb(664, 179, 4, 2),
    createBomb(613, 179, 5, 2),
    createBomb(564, 179, 6, 2),
    createBomb(438, 175, 7, 3),
    createBomb(387, 175, 8, 3),
    createBomb(338, 175, 9, 3),
    createBomb(213, 425, 10, 4),
    createBomb(161, 425, 11, 4),
    createBomb(112, 425, 12, 4),
    createBomb(189, 125, 13, 5),
    createBomb(138, 125, 14, 5),
    createBomb(88, 125, 15, 5),
    createBomb(575, 125, 16, 6),
    createBomb(625, 125, 17, 6),
    createBomb(675, 125, 18, 6),
    createBomb(413, 25, 19, 7),
    createBomb(363, 25, 20, 7),
    createBomb(438, 525, 21, 8),
    createBomb(388, 525, 22, 8),
    createBomb(338, 525, 23, 8),
  ],

  monsters: [
    createVerticalPatrolMonster(75, 150, 325, "left", 1, 1, 0),
    createChaserMonster(213, 513, 0.8, 0.2, 500, 0),
    createFloaterMonster(50, 75, 41, 1, 0),
  ],

  monsterSpawnPoints: [
    {
      spawnDelay: 4000,
      createMonster: () =>
        createVerticalPatrolMonster(700, 175, 250, "left", 1, 1, 4000),
    },
    {
      spawnDelay: 5000,
      createMonster: () =>
        createHorizontalPatrolMonster(
          325,
          150,
          150,
          "left",
          1,
          1,
          1,
          5000,
          "green",
        ),
    },
  ],
};

// Level 1 - Bedroom
export const level1Map: MapDefinition = {
  id: "level1",
  name: "soverommet",
  width: GAME_CONFIG.CANVAS_WIDTH,
  height: GAME_CONFIG.CANVAS_HEIGHT,
  background: "soverommet",
  playerStart: { x: 387.5, y: 282.5 },
  spawnIndicatorColor: "#ff9ff3",

  groupSequence: [1, 2, 3, 4, 5, 6],

  ground: {
    x: 0,
    y: 560,
    width: 800,
    height: 40,
    color: "#4c6986",
    tileTheme: "stone-gray",
    tileNoise: 0,
  },

  platforms: [
    {
      ...createPlatform(
        500,
        400,
        { width: 200, height: 25 },
        "#2f3543",
        "#000",
      ),
      tileTheme: "plastic",
    },
    {
      ...createPlatform(
        100,
        400,
        { width: 200, height: 25 },
        "#2f3543",
        "#000",
      ),
      tileTheme: "plastic",
    },
    {
      ...createPlatform(
        525,
        175,
        { width: 150, height: 25 },
        "#2f3543",
        "#000",
      ),
      tileTheme: "plastic",
    },
    {
      ...createPlatform(
        125,
        175,
        { width: 150, height: 25 },
        "#2f3543",
        "#000",
      ),
      tileTheme: "plastic",
    },
    {
      ...createPlatform(750, 275, { width: 50, height: 25 }, "#2f3543", "#000"),
      tileTheme: "plastic",
    },
    {
      ...createPlatform(0, 275, { width: 50, height: 25 }, "#2f3543", "#000"),
      tileTheme: "plastic",
    },
  ],

  bombs: [
    createBomb(275, 533, 1, 1),
    createBomb(225, 533, 2, 1),
    createBomb(175, 533, 3, 1),
    createBomb(500, 533, 4, 2),
    createBomb(550, 533, 5, 2),
    createBomb(600, 533, 6, 2),
    createBomb(650, 533, 7, 2),
    createBomb(263, 375, 8, 3),
    createBomb(213, 375, 9, 3),
    createBomb(163, 375, 10, 3),
    createBomb(113, 375, 11, 3),
    createBomb(12, 250, 12, 4),
    createBomb(138, 150, 13, 5),
    createBomb(188, 150, 14, 5),
    createBomb(238, 150, 15, 5),
    createBomb(511, 375, 16, 6),
    createBomb(561, 375, 17, 6),
    createBomb(611, 375, 18, 6),
    createBomb(661, 375, 19, 6),
    createBomb(763, 250, 20, 7),
    createBomb(637, 150, 21, 8),
    createBomb(587, 150, 22, 8),
    createBomb(537, 150, 23, 8),
  ],

  monsters: [
    createHorizontalPatrolMonster(125, 175, 150, "left", 1, 1, 1, 0, "green"),
    createHorizontalPatrolMonster(525, 175, 150, "right", 1, 1, -1, 0, "black"),
    createHorizontalPatrolMonster(100, 400, 200, "right", 1, 1, -1, 0, "green"),
    createHorizontalPatrolMonster(500, 400, 200, "left", 1, 1, 1, 0, "black"),
  ],

  monsterSpawnPoints: [
    {
      spawnDelay: 10000,
      createMonster: () => createChaserMonster(500, 500, 1, 0.2, 500, 10000),
    },
    {
      spawnDelay: 13000,
      createMonster: () => createAmbusherMonster(600, 100, 1, 8000, 13000),
    },
  ],

  coinSpawnPoints: [
    {
      x: 300,
      y: 100,
      type: CoinType.POWER,
      spawnAngle: 65,
    },
    {
      x: 387.5,
      y: 287.5,
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
  id: "level2",
  name: "startup lab",
  width: GAME_CONFIG.CANVAS_WIDTH,
  height: GAME_CONFIG.CANVAS_HEIGHT,
  background: "soverommet",
  playerStart: { x: 387.5, y: 282.5 },
  spawnIndicatorColor: "#00ffff",

  groupSequence: [1, 2, 3, 4, 5],

  ground: {
    x: 0,
    y: 560,
    width: 800,
    height: 40,
    color: "#88a2bc",
    tileTheme: "store-redish",
    tileNoise: 0.15,
  },

  platforms: [
    createPlatform(475, 125, { width: 200, height: 25 }, "#2f3543", "#000"),
    createVerticalPlatform(675, 225, 150, "#2f3543", "#000"),
    createPlatform(425, 425, { width: 200, height: 25 }, "#2f3543", "#000"),
    createPlatform(100, 450, { width: 200, height: 25 }, "#2f3543", "#000"),
    createPlatform(175, 175, { width: 200, height: 25 }, "#2f3543", "#000"),
    createVerticalPlatform(100, 225, 150, "#2f3543", "#000"),
  ],

  bombs: [
    createBomb(440, 400, 1, 1),
    createBomb(490, 400, 2, 1),
    createBomb(540, 400, 3, 1),
    createBomb(590, 400, 4, 1),
    createBomb(184, 150, 5, 2),
    createBomb(234, 150, 6, 2),
    createBomb(284, 150, 7, 2),
    createBomb(334, 150, 8, 2),
    createBomb(710, 230, 9, 3),
    createBomb(710, 280, 10, 3),
    createBomb(710, 330, 11, 3),
    createBomb(130, 478, 12, 4),
    createBomb(180, 478, 13, 4),
    createBomb(230, 478, 14, 4),
    createBomb(515, 100, 15, 5),
    createBomb(563, 100, 16, 5),
    createBomb(615, 100, 17, 5),
    createBomb(126, 236, 18, 6),
    createBomb(126, 286, 19, 6),
    createBomb(126, 336, 20, 6),
    createBomb(130, 422, 21, 7),
    createBomb(180, 422, 22, 7),
    createBomb(230, 422, 23, 7),
  ],

  monsters: [
    createVerticalPatrolMonster(110, 225, 225, "right", 1, 1, 0),
    createVerticalPatrolMonster(685, 225, 325, "right", 2, 1, 0),
    createHorizontalPatrolMonster(175, 175, 200, "left", 1, 1, 1, 0, "black"),
    createChaserMonster(250, 300, 1, 0.3, 1000, 0),
  ],

  monsterSpawnPoints: [
    {
      spawnDelay: 4000,
      createMonster: () =>
        createHorizontalPatrolMonster(
          425,
          425,
          200,
          "left",
          1,
          1,
          1,
          4000,
          "green",
        ),
    },
    {
      spawnDelay: 5000,
      createMonster: () => createAmbusherMonster(500, 500, 1, 8000, 5000),
    },
  ],

  coinSpawnPoints: [
    {
      x: 387.5,
      y: 287.5,
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
};

// Level 3 - Innovasjon Norge
export const level3Map: MapDefinition = {
  id: "level3",
  name: "innovasjon norge",
  width: GAME_CONFIG.CANVAS_WIDTH,
  height: GAME_CONFIG.CANVAS_HEIGHT,
  background: "soverommet",
  playerStart: { x: 387.5, y: 282.5 },
  spawnIndicatorColor: "#ff6b6b",

  groupSequence: [1, 2, 3, 4, 5],

  ground: {
    x: 0,
    y: 560,
    width: 800,
    height: 40,
    color: "#262335",
  },

  platforms: [
    createPlatform(150, 125, { width: 150, height: 25 }, "#2f3543", "#000"),
    createPlatform(500, 125, { width: 150, height: 25 }, "#2f3543", "#000"),
    createPlatform(300, 250, { width: 200, height: 25 }, "#2f3543", "#000"),
    createPlatform(300, 375, { width: 200, height: 25 }, "#2f3543", "#000"),
    createPlatform(150, 475, { width: 150, height: 25 }, "#2f3543", "#000"),
    createPlatform(500, 475, { width: 150, height: 25 }, "#2f3543", "#000"),
  ],

  bombs: [
    createBomb(612, 100, 1, 1),
    createBomb(562, 100, 2, 1),
    createBomb(512, 100, 3, 1),
    createBomb(163, 450, 4, 2),
    createBomb(213, 450, 5, 2),
    createBomb(263, 450, 6, 2),
    createBomb(261, 100, 7, 3),
    createBomb(211, 100, 8, 3),
    createBomb(161, 100, 9, 3),
    createBomb(613, 450, 10, 4),
    createBomb(563, 450, 11, 4),
    createBomb(513, 450, 12, 4),
    createBomb(388, 75, 13, 5),
    createBomb(388, 125, 14, 5),
    createBomb(388, 175, 15, 5),
    createBomb(513, 500, 16, 6),
    createBomb(563, 500, 17, 6),
    createBomb(613, 500, 18, 6),
    createBomb(163, 500, 19, 7),
    createBomb(213, 500, 20, 7),
    createBomb(263, 500, 21, 7),
    createBomb(361, 350, 22, 8),
    createBomb(411, 350, 23, 8),
  ],

  monsters: [
    createHorizontalPatrolMonster(150, 125, 150, "left", 0, 0.7, 1, 0, "green"),
    createHorizontalPatrolMonster(500, 125, 150, "right", 0, 1, -1, 0, "black"),
    createHorizontalPatrolMonster(300, 250, 200, "left", 0, 1, 1, 0, "green"),
    createFloaterMonster(50, 300, 45, 1, 0),
    createFloaterMonster(750, 500, 155, 1, 0),
  ],

  monsterSpawnPoints: [
    {
      spawnDelay: 7000,
      createMonster: () => createChaserMonster(750, 500, 1, 0.2, 500, 7000),
    },
    {
      spawnDelay: 15000,
      createMonster: () => createAmbusherMonster(50, 500, 1, 8000, 15000),
    },
  ],

  coinSpawnPoints: [
    {
      x: 400,
      y: 477,
      type: CoinType.POWER,
      spawnAngle: 49,
    },
    {
      x: 475,
      y: 275,
      type: CoinType.POWER,
      spawnAngle: 120,
    },
    {
      x: 500,
      y: 75,
      type: CoinType.BONUS_MULTIPLIER,
      spawnAngle: 120,
    },
    {
      x: 275,
      y: 50,
      type: CoinType.BONUS_MULTIPLIER,
      spawnAngle: 120,
    },
    {
      x: 500,
      y: 50,
      type: CoinType.EXTRA_LIFE,
      spawnAngle: 120,
    },
    {
      x: 275,
      y: 75,
      type: CoinType.EXTRA_LIFE,
      spawnAngle: 120,
    },
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
  level0Map,
  level1Map,
  level2Map,
  level3Map,
  level4Map,
  level5Map,
  level6Map,
  level7Map,
  level8Map,
];
