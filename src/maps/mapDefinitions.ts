import { MapDefinition, Bomb, Platform } from "../types/interfaces";
import { GAME_CONFIG, COLORS } from "../types/constants";
import { CoinType } from "../types/enums";
import {
  createMummyMonster,
  createVerticalPatrolMonster,
  createHornMonster,
  createBirdMonster,
  createUfoMonster,
  createSphereMonster,
  createOrbMonster,
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

export const level1Map: MapDefinition = {
  id: "level1",
  name: "garasjen",
  width: GAME_CONFIG.CANVAS_WIDTH,
  height: GAME_CONFIG.CANVAS_HEIGHT,
  background: "soverommet",
  playerStart: { x: 388, y: 283 },
  spawnIndicatorColor: "#ff9ff3",

  groupSequence: [1, 2, 3, 4, 5, 6, 7, 8],

  platforms: [
    {
      ...createPlatform(75, 175, { width: 150, height: 25 }, "#2f3543", "#000"),
      tileTheme: "construction",
    },
    {
      ...createVerticalPlatform(75, 350, 150, "#2f3543", "#000"),
      tileTheme: "construction",
    },
    {
      ...createPlatform(
        100,
        475,
        { width: 150, height: 25 },
        "#2f3543",
        "#000",
      ),
      tileTheme: "construction",
    },
    {
      ...createVerticalPlatform(75, 200, 150, "#2f3543", "#000"),
      tileTheme: "construction",
    },
    {
      ...createPlatform(
        550,
        175,
        { width: 175, height: 25 },
        "#2f3543",
        "#000",
      ),
      tileTheme: "construction",
    },
    {
      ...createVerticalPlatform(700, 350, 150, "#2f3543", "#000"),
      tileTheme: "construction",
    },
    {
      ...createPlatform(
        550,
        475,
        { width: 150, height: 25 },
        "#2f3543",
        "#000",
      ),
      tileTheme: "construction",
    },
    {
      ...createVerticalPlatform(700, 200, 150, "#2f3543", "#000"),
      tileTheme: "construction",
    },
    {
      ...createPlatform(
        325,
        175,
        { width: 150, height: 25 },
        "#2f3543",
        "#000",
      ),
      tileTheme: "construction",
    },
  ],

  bombs: [
    createBomb(563, 450, 1, 1),
    createBomb(612, 450, 2, 1),
    createBomb(663, 450, 3, 1),
    createBomb(664, 204, 4, 2),
    createBomb(613, 204, 5, 2),
    createBomb(564, 204, 6, 2),
    createBomb(438, 200, 7, 3),
    createBomb(387, 200, 8, 3),
    createBomb(338, 200, 9, 3),
    createBomb(213, 450, 10, 4),
    createBomb(161, 450, 11, 4),
    createBomb(112, 450, 12, 4),
    createBomb(189, 150, 13, 5),
    createBomb(138, 150, 14, 5),
    createBomb(88, 150, 15, 5),
    createBomb(575, 150, 16, 6),
    createBomb(625, 150, 17, 6),
    createBomb(675, 150, 18, 6),
    createBomb(413, 50, 19, 7),
    createBomb(363, 50, 20, 7),
    createBomb(438, 571, 21, 8),
    createBomb(388, 571, 22, 8),
    createBomb(338, 571, 23, 8),
  ],

  monsters: [],

  monsterSpawnPoints: [
    {
      spawnDelay: 5000,
      createMonster: () => createBirdMonster(150, 250, 0.8, 0.2, 500, 5000),
    },
    {
      spawnDelay: 0,
      respawnInterval: 10000,
      maxSpawns: 2,
      createMonster: () =>
        createMummyMonster(75, 175, 150, "left", 3, 1, 1, 0, "green", "ORB"),
    },
    {
      spawnDelay: 1500,
      respawnInterval: 10000,
      maxSpawns: 2,
      createMonster: () =>
        createMummyMonster(
          550,
          175,
          175,
          "right",
          3,
          1,
          -1,
          1500,
          "green",
          "ORB",
        ),
    },
    {
      spawnDelay: 0,
      respawnInterval: 7000,
      maxSpawns: 2,
      createMonster: () =>
        createMummyMonster(
          325,
          175,
          150,
          "left",
          3,
          1,
          1,
          0,
          "green",
          "SPHERE",
        ),
    },
  ],

  coinSpawnPoints: [
    {
      x: 387.5,
      y: 287.5,
      type: CoinType.POWER,
      spawnAngle: 43,
    },
    {
      x: 388,
      y: 289,
      type: CoinType.POWER,
      spawnAngle: 205,
    },
    {
      x: 100,
      y: 50,
      type: CoinType.BONUS_MULTIPLIER,
    },
    {
      x: 100,
      y: 75,
      type: CoinType.EXTRA_LIFE,
    },
    {
      x: 675,
      y: 50,
      type: CoinType.BONUS_MULTIPLIER,
    },
    {
      x: 675,
      y: 75,
      type: CoinType.EXTRA_LIFE,
    },
  ],
};

// Level 2 - Bedroom
export const level2Map: MapDefinition = {
  id: "level2",
  name: "soverommet",
  width: GAME_CONFIG.CANVAS_WIDTH,
  height: GAME_CONFIG.CANVAS_HEIGHT,
  background: "soverommet",
  playerStart: { x: 387.5, y: 282.5 },
  spawnIndicatorColor: "#ff9ff3",

  groupSequence: [1, 2, 3, 4, 5, 6],

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
        550,
        175,
        { width: 150, height: 25 },
        "#2f3543",
        "#000",
      ),
      tileTheme: "plastic",
    },
    {
      ...createPlatform(
        100,
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
    createBomb(275, 571, 1, 1),
    createBomb(225, 571, 2, 1),
    createBomb(175, 571, 3, 1),
    createBomb(500, 571, 4, 2),
    createBomb(550, 571, 5, 2),
    createBomb(600, 571, 6, 2),
    createBomb(650, 571, 7, 2),
    createBomb(263, 375, 8, 3),
    createBomb(213, 375, 9, 3),
    createBomb(163, 375, 10, 3),
    createBomb(113, 375, 11, 3),
    createBomb(12, 250, 12, 4),
    createBomb(113, 150, 13, 5),
    createBomb(163, 150, 14, 5),
    createBomb(213, 150, 15, 5),
    createBomb(511, 375, 16, 6),
    createBomb(561, 375, 17, 6),
    createBomb(611, 375, 18, 6),
    createBomb(661, 375, 19, 6),
    createBomb(763, 250, 20, 7),
    createBomb(663, 150, 21, 8),
    createBomb(613, 150, 22, 8),
    createBomb(563, 150, 23, 8),
  ],

  monsters: [],

  monsterSpawnPoints: [
    {
      spawnDelay: 0,
      respawnInterval: 8500,
      maxSpawns: 1,
      createMonster: () =>
        createMummyMonster(100, 175, 150, "left", 3, 1, 1, 0, "green", "ORB"),
    },
    {
      spawnDelay: 0,
      respawnInterval: 9000,
      maxSpawns: 1,
      createMonster: () =>
        createMummyMonster(550, 175, 150, "right", 3, 1, -1, 0, "green", "ORB"),
    },
    {
      spawnDelay: 0,
      respawnInterval: 10000,
      maxSpawns: 1,
      createMonster: () =>
        createMummyMonster(
          100,
          400,
          200,
          "right",
          5,
          1,
          -1,
          0,
          "black",
          "SPHERE",
        ),
    },
    {
      spawnDelay: 0,
      respawnInterval: 14000,
      maxSpawns: 2,
      createMonster: () =>
        createMummyMonster(
          500,
          400,
          200,
          "left",
          5,
          1,
          1,
          0,
          "black",
          "SPHERE",
        ),
    },
    {
      spawnDelay: 10000,
      createMonster: () => createBirdMonster(500, 500, 1, 0.2, 500, 10000),
    },
  ],

  coinSpawnPoints: [
    {
      x: 150,
      y: 75,
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
      x: 175,
      y: 100,
      type: CoinType.BONUS_MULTIPLIER,
    },
    {
      x: 650,
      y: 100,
      type: CoinType.BONUS_MULTIPLIER,
    },
    {
      x: 175,
      y: 100,
      type: CoinType.EXTRA_LIFE,
    },
    {
      x: 650,
      y: 100,
      type: CoinType.EXTRA_LIFE,
    },
  ],
};

// Level 3 - Startup Lab - Norge
export const level3Map: MapDefinition = {
  id: "level3",
  name: "startup lab",
  width: GAME_CONFIG.CANVAS_WIDTH,
  height: GAME_CONFIG.CANVAS_HEIGHT,
  background: "soverommet",
  playerStart: { x: 387.5, y: 282.5 },
  spawnIndicatorColor: "#00ffff",

  groupSequence: [1, 2, 3, 4, 5],

  platforms: [
    createPlatform(600, 125, { width: 200, height: 25 }, "#2f3543", "#000"),
    createVerticalPlatform(675, 225, 150, "#2f3543", "#000"),
    createPlatform(425, 425, { width: 200, height: 25 }, "#2f3543", "#000"),
    createPlatform(100, 498, { width: 200, height: 25 }, "#2f3543", "#000"),
    createPlatform(0, 150, { width: 200, height: 25 }, "#2f3543", "#000"),
    createVerticalPlatform(75, 250, 150, "#2f3543", "#000"),
  ],

  bombs: [
    createBomb(440, 400, 1, 1),
    createBomb(490, 400, 2, 1),
    createBomb(540, 400, 3, 1),
    createBomb(590, 400, 4, 1),
    createBomb(25, 125, 5, 2),
    createBomb(75, 125, 6, 2),
    createBomb(125, 125, 7, 2),
    createBomb(175, 125, 8, 2),
    createBomb(710, 230, 9, 3),
    createBomb(710, 280, 10, 3),
    createBomb(710, 330, 11, 3),
    createBomb(130, 526, 12, 4),
    createBomb(180, 526, 13, 4),
    createBomb(230, 526, 14, 4),
    createBomb(625, 100, 15, 5),
    createBomb(675, 100, 16, 5),
    createBomb(725, 100, 17, 5),
    createBomb(102, 262, 18, 6),
    createBomb(102, 312, 19, 6),
    createBomb(102, 362, 20, 6),
    createBomb(130, 470, 21, 7),
    createBomb(180, 470, 22, 7),
    createBomb(230, 470, 23, 7),
  ],

  monsters: [],

  monsterSpawnPoints: [
    {
      spawnDelay: 0,
      respawnInterval: 13000,
      maxSpawns: 2,
      createMonster: () =>
        createMummyMonster(0, 150, 200, "left", 3, 1, 1, 0, "black", "SPHERE"),
    },
    {
      spawnDelay: 0,
      respawnInterval: 15000,
      maxSpawns: 3,
      createMonster: () =>
        createMummyMonster(
          100,
          500,
          200,
          "right",
          3,
          1,
          1,
          4000,
          "green",
          "ORB",
        ),
    },
    {
      spawnDelay: 7000,
      createMonster: () => createHornMonster(275, 175, -122, 1, 7000),
    },
    {
      spawnDelay: 0,
      respawnInterval: 16000,
      maxSpawns: 2,
      createMonster: () =>
        createMummyMonster(
          600,
          125,
          200,
          "right",
          5,
          1,
          undefined,
          0,
          "green",
          "ORB",
        ),
    },
  ],

  coinSpawnPoints: [
    {
      x: 387.5,
      y: 287.5,
      type: CoinType.POWER,
      spawnAngle: -35,
    },
    {
      x: 387.5,
      y: 287.5,
      type: CoinType.POWER,
      spawnAngle: 141,
    },
    {
      x: 25,
      y: 50,
      type: CoinType.BONUS_MULTIPLIER,
    },
    {
      x: 750,
      y: 50,
      type: CoinType.BONUS_MULTIPLIER,
    },
    {
      x: 25,
      y: 25,
      type: CoinType.EXTRA_LIFE,
    },
    {
      x: 750,
      y: 25,
      type: CoinType.EXTRA_LIFE,
    },
  ],
};

// Level 4 - Innovasjon Norge
export const level4Map: MapDefinition = {
  id: "level4",
  name: "innovasjon norge",
  width: GAME_CONFIG.CANVAS_WIDTH,
  height: GAME_CONFIG.CANVAS_HEIGHT,
  background: "soverommet",
  playerStart: { x: 387.5, y: 282.5 },
  spawnIndicatorColor: "#ff6b6b",

  groupSequence: [1, 2, 3, 4, 5],

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

  monsters: [],

  monsterSpawnPoints: [
    {
      spawnDelay: 0,
      respawnInterval: 8000,
      createMonster: () =>
        createMummyMonster(
          150,
          125,
          150,
          "left",
          3,
          0.7,
          1,
          0,
          "green",
          "SPHERE",
        ),
    },
    {
      spawnDelay: 0,
      respawnInterval: 8000,
      maxSpawns: 2,
      createMonster: () =>
        createMummyMonster(500, 125, 150, "right", 3, 1, -1, 0, "black", "ORB"),
    },
    {
      spawnDelay: 0,
      respawnInterval: 15000,
      maxSpawns: 2,
      createMonster: () =>
        createMummyMonster(
          300,
          250,
          200,
          "left",
          4,
          1,
          1,
          0,
          "green",
          "SPHERE",
        ),
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

// Level 5 - Skatteetaten
export const level5Map: MapDefinition = {
  id: "level5",
  name: "skatteetaten",
  width: GAME_CONFIG.CANVAS_WIDTH,
  height: GAME_CONFIG.CANVAS_HEIGHT,
  background: "soverommet",
  playerStart: { x: 387.5, y: 242.5 },
  spawnIndicatorColor: "#4ecdc4",

  groupSequence: [1, 2, 3, 4, 5, 6, 7],

  platforms: [
    createPlatform(0, 225, { width: 175, height: 25 }, "#2f3543", "#000"),
    createPlatform(625, 225, { width: 175, height: 25 }, "#2f3543", "#000"),
    createPlatform(75, 350, { width: 200, height: 25 }, "#2f3543", "#000"),
    createPlatform(500, 350, { width: 200, height: 25 }, "#2f3543", "#000"),
    createPlatform(150, 500, { width: 500, height: 25 }, "#2f3543", "#000"),
    createPlatform(150, 125, { width: 500, height: 25 }, "#2f3543", "#000"),
  ],

  bombs: [
    createBomb(673, 257, 1, 1),
    createBomb(723, 257, 2, 1),
    createBomb(767, 258, 3, 1),
    createBomb(767, 308, 4, 1),
    createBomb(767, 358, 5, 1),
    createBomb(600, 475, 6, 2),
    createBomb(550, 475, 7, 2),
    createBomb(500, 475, 8, 2),
    createBomb(105, 257, 9, 3),
    createBomb(55, 257, 10, 3),
    createBomb(7, 257, 11, 3),
    createBomb(7, 307, 12, 3),
    createBomb(7, 357, 13, 3),
    createBomb(175, 473, 14, 4),
    createBomb(225, 473, 15, 4),
    createBomb(275, 475, 16, 4),
    createBomb(337, 155, 17, 5),
    createBomb(387, 155, 18, 5),
    createBomb(437, 155, 19, 5),
    createBomb(425, 528, 20, 6),
    createBomb(375, 528, 21, 6),
    createBomb(325, 528, 22, 6),
    createBomb(385, 95, 23, 7),
  ],

  monsters: [],

  monsterSpawnPoints: [
    {
      spawnDelay: 0,
      respawnInterval: 13000,
      maxSpawns: 2,
      createMonster: () =>
        createMummyMonster(150, 500, 500, "left", 1, 1, 1, 0, "black", "ORB"),
    },
    {
      spawnDelay: 0,
      respawnInterval: 11000,
      maxSpawns: 2,
      createMonster: () =>
        createMummyMonster(150, 125, 500, "left", 2, 1, 1, 0, "black", "ORB"),
    },
    {
      spawnDelay: 3500,
      respawnInterval: 4500,
      maxSpawns: 2,
      createMonster: () =>
        createMummyMonster(
          625,
          225,
          175,
          "right",
          1,
          1,
          -1,
          3500,
          "green",
          "SPHERE",
        ),
    },
    {
      spawnDelay: 0,
      respawnInterval: 12500,
      maxSpawns: 1,
      createMonster: () =>
        createMummyMonster(
          75,
          350,
          200,
          "right",
          1,
          1,
          -1,
          0,
          "black",
          "SPHERE",
        ),
    },
    {
      spawnDelay: 0,
      respawnInterval: 12500,
      maxSpawns: 1,
      createMonster: () =>
        createMummyMonster(
          500,
          350,
          200,
          "left",
          1,
          1,
          1,
          0,
          "green",
          "SPHERE",
        ),
    },
  ],

  coinSpawnPoints: [
    {
      x: 375,
      y: 250,
      type: CoinType.POWER,
      spawnAngle: -30,
    },
    {
      x: 400,
      y: 250,
      type: CoinType.POWER,
      spawnAngle: -120,
    },
    {
      x: 175,
      y: 25,
      type: CoinType.BONUS_MULTIPLIER,
    },
    {
      x: 600,
      y: 25,
      type: CoinType.BONUS_MULTIPLIER,
    },
    {
      x: 175,
      y: 50,
      type: CoinType.EXTRA_LIFE,
    },
    {
      x: 600,
      y: 50,
      type: CoinType.EXTRA_LIFE,
    },
  ],
};

// Level 6 - NAV
export const level6Map: MapDefinition = {
  id: "level6",
  name: "nav",
  width: GAME_CONFIG.CANVAS_WIDTH,
  height: GAME_CONFIG.CANVAS_HEIGHT,
  background: "soverommet",
  playerStart: { x: 387.5, y: 282.5 },
  spawnIndicatorColor: "#ffe66d",

  groupSequence: [1, 2, 3, 4, 5],

  platforms: [
    createVerticalPlatform(645, 225, 150, "#586c5c", "#202e32"),
    createVerticalPlatform(705, 225, 150, "#586c5c", "#202e32"),
    createVerticalPlatform(118, 199, 150, "#586c5c", "#202e32"),
    createVerticalPlatform(178, 199, 150, "#586c5c", "#202e32"),
    createPlatform(75, 50, { width: 150, height: 25 }, "#2f3543", "#000"),
    createPlatform(75, 110, { width: 150, height: 25 }, "#2f3543", "#000"),
    createPlatform(75, 525, { width: 175, height: 25 }, "#2f3543", "#000"),
    createPlatform(275, 400, { width: 150, height: 25 }, "#2f3543", "#000"),
    createPlatform(575, 509, { width: 150, height: 25 }, "#2f3543", "#000"),
    createPlatform(575, 449, { width: 150, height: 25 }, "#2f3543", "#000"),
    createPlatform(375, 200, { width: 150, height: 25 }, "#2f3543", "#000"),
    createPlatform(525, 50, { width: 200, height: 25 }, "#2f3543", "#000"),
  ],

  bombs: [
    createBomb(587, 479, 1, 1),
    createBomb(637, 479, 2, 1),
    createBomb(687, 479, 3, 1),
    createBomb(675, 237, 4, 2),
    createBomb(675, 287, 5, 2),
    createBomb(675, 337, 6, 2),
    createBomb(112, 498, 7, 3),
    createBomb(162, 498, 8, 3),
    createBomb(212, 498, 9, 3),
    createBomb(287, 373, 10, 4),
    createBomb(337, 373, 11, 4),
    createBomb(387, 373, 12, 4),
    createBomb(148, 211, 13, 5),
    createBomb(148, 261, 14, 5),
    createBomb(148, 311, 15, 5),
    createBomb(88, 80, 16, 6),
    createBomb(138, 80, 17, 6),
    createBomb(188, 80, 18, 6),
    createBomb(387, 173, 19, 7),
    createBomb(437, 173, 20, 7),
    createBomb(487, 173, 21, 7),
    createBomb(625, 79, 22, 8),
    createBomb(675, 79, 23, 8),
  ],

  monsters: [],

  monsterSpawnPoints: [
    {
      spawnDelay: 0,
      respawnInterval: 12000,
      maxSpawns: 2,
      createMonster: () =>
        createMummyMonster(75, 525, 175, "left", 5, 1, 1, 0, "green", "SPHERE"),
    },
    {
      spawnDelay: 0,
      respawnInterval: 16000,
      maxSpawns: 2,
      createMonster: () =>
        createMummyMonster(75, 50, 150, "right", 2, 1, -1, 0, "black", "ORB"),
    },
    {
      spawnDelay: 6000,
      createMonster: () => createHornMonster(240, 350, 40, 1, 6000),
    },
    {
      spawnDelay: 0,
      respawnInterval: 12000,
      maxSpawns: 3,
      createMonster: () =>
        createMummyMonster(
          525,
          50,
          200,
          "left",
          2,
          1,
          undefined,
          0,
          "green",
          "SPHERE",
        ),
    },
  ],

  coinSpawnPoints: [
    {
      x: 387.5,
      y: 287.5,
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
      x: 75,
      y: 25,
      type: CoinType.BONUS_MULTIPLIER,
    },
    {
      x: 550,
      y: 10,
      type: CoinType.BONUS_MULTIPLIER,
    },
    {
      x: 75,
      y: 0,
      type: CoinType.EXTRA_LIFE,
    },
    {
      x: 550,
      y: 10,
      type: CoinType.EXTRA_LIFE,
    },
  ],
};

// Level 7 - Kommunehuset
export const level7Map: MapDefinition = {
  id: "level7",
  name: "kommunehuset",
  width: GAME_CONFIG.CANVAS_WIDTH,
  height: GAME_CONFIG.CANVAS_HEIGHT,
  background: "soverommet",
  playerStart: { x: 387.5, y: 282.5 },
  spawnIndicatorColor: "#a8e6cf",

  groupSequence: [1, 2, 3, 4, 5, 6],

  platforms: [
    createPlatform(50, 300, { width: 75, height: 25 }, "#2f3543", "#000"),
    createPlatform(675, 300, { width: 75, height: 25 }, "#2f3543", "#000"),
    createPlatform(375, 375, { width: 50, height: 25 }, "#2f3543", "#000"),
  ],

  bombs: [
    createBomb(150, 60, 1, 1),
    createBomb(100, 60, 2, 1),
    createBomb(50, 60, 3, 1),
    createBomb(625, 60, 4, 2),
    createBomb(675, 60, 5, 2),
    createBomb(725, 60, 6, 2),
    createBomb(150, 573, 7, 3),
    createBomb(100, 573, 8, 3),
    createBomb(50, 573, 9, 3),
    createBomb(625, 573, 10, 4),
    createBomb(675, 573, 11, 4),
    createBomb(725, 573, 12, 4),
    createBomb(438, 100, 13, 5),
    createBomb(388, 100, 14, 5),
    createBomb(338, 100, 15, 5),
    createBomb(338, 572, 16, 6),
    createBomb(388, 572, 17, 6),
    createBomb(438, 572, 18, 6),
    createBomb(388, 405, 19, 6),
    createBomb(388, 455, 20, 6),
    createBomb(388, 505, 21, 6),
    createBomb(75, 273, 22, 7),
    createBomb(700, 273, 23, 7),
  ],

  monsters: [
    createVerticalPatrolMonster(535, 300, 300, "right", 1, 1, 0),
    createVerticalPatrolMonster(235, 0, 300, "right", 1, 1, 0),
  ],

  monsterSpawnPoints: [
    {
      spawnDelay: 750,
      createMonster: () =>
        createVerticalPatrolMonster(235, 300, 300, "right", 1, 1, 750),
    },
    {
      spawnDelay: 850,
      createMonster: () =>
        createVerticalPatrolMonster(535, 0, 300, "right", 1, 1, 850),
    },
    {
      spawnDelay: 7000,
      respawnInterval: 15500,
      maxSpawns: 2,
      createMonster: () =>
        createMummyMonster(
          175,
          175,
          25,
          "left",
          1,
          1,
          undefined,
          7000,
          "green",
          "SPHERE",
        ),
    },
    {
      spawnDelay: 5500,
      respawnInterval: 13500,
      maxSpawns: 2,
      createMonster: () =>
        createMummyMonster(
          600,
          175,
          25,
          "right",
          1,
          1,
          undefined,
          5500,
          "green",
          "ORB",
        ),
    },
  ],

  coinSpawnPoints: [
    {
      x: 387.5,
      y: 287.5,
      type: CoinType.POWER,
      spawnAngle: 46,
    },
    {
      x: 387.5,
      y: 287.5,
      type: CoinType.POWER,
      spawnAngle: -45,
    },
    {
      x: 388,
      y: 27,
      type: CoinType.BONUS_MULTIPLIER,
    },
    {
      x: 387,
      y: 0,
      type: CoinType.EXTRA_LIFE,
    },
    {
      x: 75,
      y: 0,
      type: CoinType.BONUS_MULTIPLIER,
    },
    {
      x: 75,
      y: 25,
      type: CoinType.EXTRA_LIFE,
    },
    {
      x: 700,
      y: 0,
      type: CoinType.BONUS_MULTIPLIER,
    },
    {
      x: 700,
      y: 25,
      type: CoinType.EXTRA_LIFE,
    },
  ],
};

// Level 8 - Alltinn Norge
// Vertical-ascent zigzag: twin pillar walls anchor vertical patrols while a
// center spine of horizontal platforms forces left↔right traversal upward.
// Bomb groups are ordered floor→top — the climb itself is the difficulty curve.
export const level8Map: MapDefinition = {
  id: "level8",
  name: "alltinn norge",
  width: GAME_CONFIG.CANVAS_WIDTH,
  height: GAME_CONFIG.CANVAS_HEIGHT,
  background: "soverommet",
  playerStart: { x: 387.5, y: 282.5 },
  spawnIndicatorColor: "#ff9ff3",

  groupSequence: [1, 2, 3, 4, 5, 6, 7],

  platforms: [
    createVerticalPlatform(50, 175, 325, "#5d8fb3", "#1a2540"),
    createVerticalPlatform(725, 175, 325, "#5d8fb3", "#1a2540"),
    createPlatform(50, 150, { width: 150, height: 25 }, "#2f3543", "#000"),
    createPlatform(600, 150, { width: 150, height: 25 }, "#2f3543", "#000"),
    createPlatform(75, 475, { width: 150, height: 25 }, "#2f3543", "#000"),
    createPlatform(575, 475, { width: 150, height: 25 }, "#2f3543", "#000"),
    createPlatform(250, 225, { width: 300, height: 25 }, "#2f3543", "#000"),
  ],

  bombs: [
    createBomb(12, 400, 1, 1),
    createBomb(12, 350, 2, 1),
    createBomb(12, 300, 3, 1),
    createBomb(12, 250, 4, 1),
    createBomb(765, 250, 5, 2),
    createBomb(765, 300, 6, 2),
    createBomb(765, 350, 7, 2),
    createBomb(765, 400, 8, 2),
    createBomb(87, 447, 9, 3),
    createBomb(137, 447, 10, 3),
    createBomb(187, 447, 11, 3),
    createBomb(64, 123, 12, 4),
    createBomb(114, 123, 13, 4),
    createBomb(164, 123, 14, 4),
    createBomb(614, 123, 15, 5),
    createBomb(664, 123, 16, 5),
    createBomb(714, 123, 17, 5),
    createBomb(338, 197, 18, 6),
    createBomb(388, 197, 19, 6),
    createBomb(438, 197, 20, 6),
    createBomb(589, 448, 21, 7),
    createBomb(639, 448, 22, 7),
    createBomb(689, 448, 23, 7),
  ],

  monsters: [
    createMummyMonster(75, 475, 150, "left", 1, 1, 1, 0, "green", "SPHERE"),
  ],

  monsterSpawnPoints: [
    {
      spawnDelay: 0,
      respawnInterval: 14000,
      maxSpawns: 3,
      createMonster: () =>
        createMummyMonster(
          50,
          150,
          150,
          "right",
          1,
          1,
          -1,
          0,
          "black",
          "SPHERE",
        ),
    },
    {
      spawnDelay: 0,
      respawnInterval: 14500,
      maxSpawns: 2,
      createMonster: () =>
        createMummyMonster(600, 150, 150, "left", 1, 1, 1, 0, "black", "ORB"),
    },
  ],

  coinSpawnPoints: [
    {
      x: 388,
      y: 290,
      type: CoinType.POWER,
      spawnAngle: 45,
    },
    {
      x: 388,
      y: 289,
      type: CoinType.POWER,
      spawnAngle: -125,
    },
    {
      x: 125,
      y: 25,
      type: CoinType.BONUS_MULTIPLIER,
    },
    {
      x: 675,
      y: 50,
      type: CoinType.BONUS_MULTIPLIER,
    },
    {
      x: 125,
      y: 50,
      type: CoinType.EXTRA_LIFE,
    },
    {
      x: 675,
      y: 25,
      type: CoinType.EXTRA_LIFE,
    },
  ],
};

export const level9Map: MapDefinition = {
  id: "level9",
  name: "silicone vally",
  width: GAME_CONFIG.CANVAS_WIDTH,
  height: GAME_CONFIG.CANVAS_HEIGHT,
  playerStart: centerPoint(GAME_CONFIG.PLAYER_WIDTH, GAME_CONFIG.PLAYER_HEIGHT),
  spawnIndicatorColor: "#feca57", // Orange for dark gray background

  groupSequence: [1, 2, 3, 4, 5],

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
  level9Map,
];
