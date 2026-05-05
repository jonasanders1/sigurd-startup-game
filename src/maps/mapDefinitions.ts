import { MapDefinition, Platform } from "../types/interfaces";
import { GAME_CONFIG } from "../types/constants";
import { CoinType } from "../types/enums";
import {
  createMummyMonster,
  createVerticalPatrolMonster,
  createHornMonster,
  createUfoMonster,
  createSphereMonster,
  createOrbMonster,
} from "../managers/MonsterFactory";
import {
  createBomb,
  createPlatform,
  createVerticalPlatform,
  centerPoint,
} from "./mapFactories";

// Level 1 - Bedroom (gameplay swapped from level 2)
export const level1Map: MapDefinition = {
  id: "level1",
  name: "soverommet",
  width: GAME_CONFIG.CANVAS_WIDTH,
  height: GAME_CONFIG.CANVAS_HEIGHT,
  background: "soverommet",
  floor: "green",
  playerStart: { x: 387.5, y: 282.5 },
  spawnIndicatorColor: "#ff9ff3",

  groupSequence: [1, 2, 3, 4, 5, 6],

  platforms: [
    {
      ...createPlatform(
        500,
        400,
        { width: 200, height: 25 },
        "#84bf4d",
        "#000",
      ),
      roundedCorners: { tl: true, tr: true, bl: true, br: true },
    },
    {
      ...createPlatform(
        100,
        400,
        { width: 200, height: 25 },
        "#84bf4d",
        "#000",
      ),
      roundedCorners: { tl: true, tr: true, bl: true, br: true },
    },
    {
      ...createPlatform(
        550,
        175,
        { width: 150, height: 25 },
        "#84bf4d",
        "#000",
      ),
      roundedCorners: { tl: true, tr: true, bl: true, br: true },
    },
    {
      ...createPlatform(
        100,
        175,
        { width: 150, height: 25 },
        "#84bf4d",
        "#000",
      ),
      roundedCorners: { tl: true, tr: true, bl: true, br: true },
    },
    {
      ...createPlatform(750, 275, { width: 50, height: 25 }, "#84bf4d", "#000"),
      roundedCorners: { tl: true, bl: true },
    },
    {
      ...createPlatform(0, 275, { width: 50, height: 25 }, "#84bf4d", "#000"),
      roundedCorners: { tr: true, br: true },
    },
  ],

  bombs: [
    createBomb(275, 551, 1, 1),
    createBomb(225, 551, 2, 1),
    createBomb(175, 551, 3, 1),
    createBomb(500, 551, 4, 2),
    createBomb(550, 551, 5, 2),
    createBomb(600, 551, 6, 2),
    createBomb(650, 551, 7, 2),
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

// Level 2 - Garasjen (gameplay swapped from level 1)
export const level2Map: MapDefinition = {
  id: "level2",
  name: "garasjen",
  width: GAME_CONFIG.CANVAS_WIDTH,
  height: GAME_CONFIG.CANVAS_HEIGHT,
  background: "garasjen",
  floor: "brown",
  playerStart: { x: 388, y: 283 },
  spawnIndicatorColor: "#ff9ff3",

  groupSequence: [1, 2, 3, 4, 5, 6, 7, 8],

  platforms: [
    {
      ...createPlatform(75, 175, { width: 150, height: 25 }, "#bd9853", "#000"),
      roundedCorners: { tl: true, tr: true, br: true },
    },
    {
      ...createPlatform(
        100,
        475,
        { width: 150, height: 25 },
        "#bd9853",
        "#000",
      ),
      roundedCorners: { tr: true, br: true },
    },
    {
      ...createVerticalPlatform(75, 200, 300, "#bd9853", "#000"),
      roundedCorners: { bl: true },
    },
    {
      ...createPlatform(
        550,
        175,
        { width: 175, height: 25 },
        "#bd9853",
        "#000",
      ),
      roundedCorners: { tl: true, tr: true, bl: true },
    },
    {
      ...createPlatform(
        550,
        475,
        { width: 150, height: 25 },
        "#bd9853",
        "#000",
      ),
      roundedCorners: { tl: true, bl: true },
    },
    {
      ...createVerticalPlatform(700, 200, 300, "#bd9853", "#000"),
      roundedCorners: { br: true },
    },
    {
      ...createPlatform(
        325,
        175,
        { width: 150, height: 25 },
        "#bd9853",
        "#000",
      ),
      roundedCorners: { tl: true, tr: true, bl: true, br: true },
    },
  ],

  bombs: [
    createBomb(563, 450, 1, 1),
    createBomb(612, 450, 2, 1),
    createBomb(663, 450, 3, 1),
    createBomb(664, 204, 4, 2),
    createBomb(613, 204, 5, 2),
    createBomb(564, 204, 6, 2),
    createBomb(438, 204, 7, 3),
    createBomb(387, 204, 8, 3),
    createBomb(338, 204, 9, 3),
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
    createBomb(438, 551, 21, 8),
    createBomb(388, 551, 22, 8),
    createBomb(338, 551, 23, 8),
  ],

  monsters: [],

  monsterSpawnPoints: [
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

// Level 3 - Startup Lab - Norge
export const level3Map: MapDefinition = {
  id: "level3",
  name: "startup lab",
  width: GAME_CONFIG.CANVAS_WIDTH,
  height: GAME_CONFIG.CANVAS_HEIGHT,
  background: "startup-lab",
  floor: "gray-clean",
  playerStart: { x: 387.5, y: 282.5 },
  spawnIndicatorColor: "#00ffff",

  groupSequence: [1, 2, 3, 4, 5],

  platforms: [
    {
      ...createPlatform(
        600,
        125,
        { width: 200, height: 25 },
        "#a2a2a2",
        "#000",
      ),
      roundedCorners: { tl: true, bl: true },
    },
    {
      ...createVerticalPlatform(675, 225, 150, "#a2a2a2", "#000"),
      roundedCorners: { tl: true, tr: true, bl: true, br: true },
    },
    {
      ...createPlatform(
        425,
        425,
        { width: 200, height: 25 },
        "#a2a2a2",
        "#000",
      ),
      roundedCorners: { tl: true, tr: true, bl: true, br: true },
    },
    {
      ...createPlatform(
        100,
        475,
        { width: 200, height: 25 },
        "#a2a2a2",
        "#000",
      ),
      roundedCorners: { tl: true, tr: true, bl: true, br: true },
    },
    {
      ...createPlatform(0, 150, { width: 200, height: 25 }, "#a2a2a2", "#000"),
      roundedCorners: { tr: true, br: true },
    },
    {
      ...createVerticalPlatform(75, 250, 150, "#a2a2a2", "#000"),
      roundedCorners: { tl: true, tr: true, bl: true, br: true },
    },
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
    createBomb(125, 503, 12, 4),
    createBomb(175, 503, 13, 4),
    createBomb(225, 503, 14, 4),
    createBomb(625, 100, 15, 5),
    createBomb(675, 100, 16, 5),
    createBomb(725, 100, 17, 5),
    createBomb(102, 262, 18, 6),
    createBomb(102, 312, 19, 6),
    createBomb(102, 362, 20, 6),
    createBomb(125, 450, 21, 7),
    createBomb(175, 450, 22, 7),
    createBomb(225, 450, 23, 7),
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
        createMummyMonster(100, 475, 200, "left", 3, 1, 1, 0, "green", "ORB"),
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
        createMummyMonster(600, 125, 200, "right", 5, 1, -1, 0, "green", "ORB"),
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
  background: "innovasjon-norge",
  floor: "blue-green-clean",
  playerStart: { x: 387.5, y: 282.5 },
  spawnIndicatorColor: "#ff6b6b",

  groupSequence: [1, 2, 3, 4, 5],

  platforms: [
    {
      ...createPlatform(
        150,
        125,
        { width: 150, height: 25 },
        "#249c8e",
        "#000",
      ),
      roundedCorners: { tl: true, tr: true, bl: true, br: true },
    },
    {
      ...createPlatform(
        500,
        125,
        { width: 150, height: 25 },
        "#249c8e",
        "#000",
      ),
      roundedCorners: { tl: true, tr: true, bl: true, br: true },
    },
    {
      ...createPlatform(
        300,
        250,
        { width: 200, height: 25 },
        "#249c8e",
        "#000",
      ),
      roundedCorners: { tl: true, tr: true, bl: true, br: true },
    },
    {
      ...createPlatform(
        300,
        375,
        { width: 200, height: 25 },
        "#249c8e",
        "#000",
      ),
      roundedCorners: { tl: true, tr: true, bl: true, br: true },
    },
    {
      ...createPlatform(
        150,
        475,
        { width: 150, height: 25 },
        "#249c8e",
        "#000",
      ),
      roundedCorners: { tl: true, tr: true, bl: true, br: true },
    },
    {
      ...createPlatform(
        500,
        475,
        { width: 150, height: 25 },
        "#249c8e",
        "#000",
      ),
      roundedCorners: { tl: true, tr: true, bl: true, br: true },
    },
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
  background: "skatteetaten",
  floor: "green-white",
  playerStart: { x: 387.5, y: 242.5 },
  spawnIndicatorColor: "#4ecdc4",

  groupSequence: [1, 2, 3, 4, 5, 6, 7],

  platforms: [
    {
      ...createPlatform(0, 225, { width: 175, height: 25 }, "#059f60", "#000"),
      roundedCorners: { tr: true, br: true },
    },
    {
      ...createPlatform(
        625,
        225,
        { width: 175, height: 25 },
        "#059f60",
        "#000",
      ),
      roundedCorners: { tl: true, bl: true },
    },
    {
      ...createPlatform(75, 350, { width: 200, height: 25 }, "#059f60", "#000"),
      roundedCorners: { tl: true, tr: true, bl: true, br: true },
    },
    {
      ...createPlatform(
        500,
        350,
        { width: 200, height: 25 },
        "#059f60",
        "#000",
      ),
      roundedCorners: { tl: true, tr: true, bl: true, br: true },
    },
    {
      ...createPlatform(
        150,
        500,
        { width: 500, height: 25 },
        "#059f60",
        "#000",
      ),
      roundedCorners: { tl: true, tr: true, bl: true, br: true },
    },
    {
      ...createPlatform(
        150,
        125,
        { width: 500, height: 25 },
        "#059f60",
        "#000",
      ),
      roundedCorners: { tl: true, tr: true, bl: true, br: true },
    },
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
    createBomb(425, 548, 20, 6),
    createBomb(375, 548, 21, 6),
    createBomb(325, 548, 22, 6),
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
  background: "nav",
  floor: "yellow-light",
  playerStart: { x: 387.5, y: 282.5 },
  spawnIndicatorColor: "#ffe66d",

  groupSequence: [1, 2, 3, 4, 5],

  platforms: [
    {
      ...createVerticalPlatform(645, 225, 150, "#bd9853", "#202e32"),
      roundedCorners: { tl: true, tr: true, bl: true, br: true },
    },
    {
      ...createVerticalPlatform(705, 225, 150, "#bd9853", "#202e32"),
      roundedCorners: { tl: true, tr: true, bl: true, br: true },
    },
    {
      ...createVerticalPlatform(118, 199, 150, "#bd9853", "#202e32"),
      roundedCorners: { tl: true, tr: true, bl: true, br: true },
    },
    {
      ...createVerticalPlatform(178, 199, 150, "#bd9853", "#202e32"),
      roundedCorners: { tl: true, tr: true, bl: true, br: true },
    },
    {
      ...createPlatform(75, 50, { width: 150, height: 25 }, "#bd9853", "#000"),
      roundedCorners: { tl: true, tr: true, bl: true, br: true },
    },
    {
      ...createPlatform(75, 110, { width: 150, height: 25 }, "#bd9853", "#000"),
      roundedCorners: { tl: true, tr: true, bl: true, br: true },
    },
    {
      ...createPlatform(75, 500, { width: 175, height: 25 }, "#bd9853", "#000"),
      roundedCorners: { tl: true, tr: true, bl: true, br: true },
    },
    {
      ...createPlatform(
        275,
        400,
        { width: 150, height: 25 },
        "#bd9853",
        "#000",
      ),
      roundedCorners: { tl: true, tr: true, bl: true, br: true },
    },
    {
      ...createPlatform(
        575,
        509,
        { width: 150, height: 25 },
        "#bd9853",
        "#000",
      ),
      roundedCorners: { tl: true, tr: true, bl: true, br: true },
    },
    {
      ...createPlatform(
        575,
        444,
        { width: 150, height: 25 },
        "#bd9853",
        "#000",
      ),
      roundedCorners: { tl: true, tr: true, bl: true, br: true },
    },
    {
      ...createPlatform(
        375,
        200,
        { width: 150, height: 25 },
        "#bd9853",
        "#000",
      ),
      roundedCorners: { tl: true, tr: true, bl: true, br: true },
    },
    {
      ...createPlatform(525, 50, { width: 200, height: 25 }, "#bd9853", "#000"),
      roundedCorners: { tl: true, tr: true, bl: true, br: true },
    },
  ],

  bombs: [
    createBomb(587, 479, 1, 1),
    createBomb(637, 479, 2, 1),
    createBomb(687, 479, 3, 1),
    createBomb(675, 237, 4, 2),
    createBomb(675, 287, 5, 2),
    createBomb(675, 337, 6, 2),
    createBomb(112, 476, 7, 3),
    createBomb(162, 476, 8, 3),
    createBomb(212, 476, 9, 3),
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
        createMummyMonster(525, 50, 200, "left", 2, 1, 1, 0, "green", "SPHERE"),
    },
    {
      spawnDelay: 0,
      respawnInterval: 10000,
      maxSpawns: 3,
      createMonster: () =>
        createMummyMonster(
          75,
          500,
          175,
          "left",
          5,
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
  background: "kommunehuset",
  floor: "yellow-light",
  playerStart: { x: 387.5, y: 282.5 },
  spawnIndicatorColor: "#a8e6cf",

  groupSequence: [1, 2, 3, 4, 5, 6],

  platforms: [
    {
      ...createPlatform(50, 300, { width: 75, height: 25 }, "#fcc233", "#000"),
      roundedCorners: { tl: true, tr: true, bl: true, br: true },
    },
    {
      ...createPlatform(675, 300, { width: 75, height: 25 }, "#fcc233", "#000"),
      roundedCorners: { tl: true, tr: true, bl: true, br: true },
    },
    {
      ...createPlatform(375, 375, { width: 50, height: 25 }, "#fcc233", "#000"),
      roundedCorners: { tl: true, tr: true, bl: true, br: true },
    },
  ],

  bombs: [
    createBomb(150, 60, 1, 1),
    createBomb(100, 60, 2, 1),
    createBomb(50, 60, 3, 1),
    createBomb(625, 60, 4, 2),
    createBomb(675, 60, 5, 2),
    createBomb(725, 60, 6, 2),
    createBomb(150, 553, 7, 3),
    createBomb(100, 553, 8, 3),
    createBomb(50, 553, 9, 3),
    createBomb(625, 553, 10, 4),
    createBomb(675, 553, 11, 4),
    createBomb(725, 553, 12, 4),
    createBomb(438, 100, 13, 5),
    createBomb(388, 100, 14, 5),
    createBomb(338, 100, 15, 5),
    createBomb(338, 552, 16, 6),
    createBomb(388, 552, 17, 6),
    createBomb(438, 552, 18, 6),
    createBomb(388, 405, 19, 6),
    createBomb(388, 455, 20, 6),
    createBomb(388, 505, 21, 6),
    createBomb(75, 273, 22, 7),
    createBomb(700, 273, 23, 7),
  ],

  monsters: [
    createVerticalPatrolMonster(535, 300, 250, "right", 1, 1, 0),
    createVerticalPatrolMonster(235, 0, 300, "right", 1, 1, 0),
  ],

  monsterSpawnPoints: [
    {
      spawnDelay: 750,
      createMonster: () =>
        createVerticalPatrolMonster(235, 300, 250, "right", 1, 1, 750),
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
          1,
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
          -1,
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
  background: "alltinn",
  floor: "gray",
  playerStart: { x: 387.5, y: 282.5 },
  spawnIndicatorColor: "#ff9ff3",

  groupSequence: [1, 2, 3, 4, 5, 6, 7],

  platforms: [
    {
      ...createVerticalPlatform(50, 175, 325, "#a2a2a2", "#1a2540"),
      roundedCorners: { bl: true },
    },
    {
      ...createVerticalPlatform(725, 175, 325, "#a2a2a2", "#1a2540"),
      roundedCorners: { br: true },
    },
    {
      ...createPlatform(50, 150, { width: 150, height: 25 }, "#a2a2a2", "#000"),
      roundedCorners: { tl: true, tr: true, br: true },
    },
    {
      ...createPlatform(
        600,
        150,
        { width: 150, height: 25 },
        "#a2a2a2",
        "#000",
      ),
      roundedCorners: { tl: true, tr: true, bl: true },
    },
    {
      ...createPlatform(75, 475, { width: 150, height: 25 }, "#a2a2a2", "#000"),
      roundedCorners: { tr: true, br: true },
    },
    {
      ...createPlatform(
        575,
        475,
        { width: 150, height: 25 },
        "#a2a2a2",
        "#000",
      ),
      roundedCorners: { tl: true, bl: true },
    },
    {
      ...createPlatform(
        250,
        225,
        { width: 300, height: 25 },
        "#a2a2a2",
        "#000",
      ),
      roundedCorners: { tl: true, tr: true, bl: true, br: true },
    },
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
    {
      spawnDelay: 6000,
      createMonster: () => createUfoMonster(650, 200, 1, 8000, 6000),
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
  background: "silicone-vally",
  floor: "sand-pink",
  playerStart: { x: 387.5, y: 282.5 },
  spawnIndicatorColor: "#feca57",

  groupSequence: [1, 2, 3, 4, 5],

  platforms: [
    {
      ...createPlatform(0, 125, { width: 325, height: 25 }, "#fdd58e", "#000"),
      roundedCorners: { tr: true, br: true },
    },
    {
      ...createPlatform(
        100,
        475,
        { width: 150, height: 25 },
        "#fdd58e",
        "#000",
      ),
      roundedCorners: { tl: true, bl: true },
    },
    {
      ...createVerticalPlatform(250, 350, 150, "#fdd58e", "#000"),
      roundedCorners: { tl: true, br: true },
    },
    {
      ...createPlatform(
        275,
        350,
        { width: 300, height: 25 },
        "#fdd58e",
        "#000",
      ),
      roundedCorners: { br: true },
    },
    {
      ...createVerticalPlatform(550, 200, 150, "#fdd58e", "#000"),
      roundedCorners: { tl: true, tr: true },
    },
    {
      ...createPlatform(
        675,
        100,
        { width: 125, height: 25 },
        "#fdd58e",
        "#000",
      ),
      roundedCorners: { tl: true, bl: true },
    },
    {
      ...createPlatform(
        700,
        350,
        { width: 100, height: 25 },
        "#fdd58e",
        "#000",
      ),
      roundedCorners: { tl: true, bl: true },
    },
  ],

  bombs: [
    createBomb(200, 97, 1, 1),
    createBomb(150, 97, 2, 1),
    createBomb(100, 97, 3, 1),
    createBomb(375, 2, 4, 2),
    createBomb(425, 2, 5, 2),
    createBomb(475, 2, 6, 2),
    createBomb(668, 549, 7, 3),
    createBomb(718, 549, 8, 3),
    createBomb(768, 549, 9, 3),
    createBomb(481, 378, 10, 4),
    createBomb(431, 378, 11, 4),
    createBomb(381, 378, 12, 4),
    createBomb(331, 378, 13, 4),
    createBomb(193, 503, 14, 5),
    createBomb(143, 503, 15, 5),
    createBomb(275, 322, 16, 6),
    createBomb(325, 322, 17, 6),
    createBomb(700, 73, 18, 7),
    createBomb(750, 73, 19, 7),
    createBomb(738, 322, 20, 7),
    createBomb(116, 549, 21, 8),
    createBomb(166, 549, 22, 8),
    createBomb(216, 549, 23, 8),
  ],

  monsters: [createHornMonster(150, 350, 39, 1, 0)],

  monsterSpawnPoints: [
    {
      spawnDelay: 0,
      respawnInterval: 8000,
      createMonster: () =>
        createMummyMonster(0, 125, 325, "left", 1, 1, 1, 0, "green", "ORB"),
    },
    {
      spawnDelay: 16000,
      respawnInterval: 18000,
      maxSpawns: 2,
      createMonster: () =>
        createMummyMonster(
          675,
          100,
          125,
          "right",
          3,
          1,
          -1,
          16000,
          "green",
          "SPHERE",
        ),
    },
    {
      spawnDelay: 0,
      respawnInterval: 10000,
      maxSpawns: 2,
      createMonster: () =>
        createMummyMonster(700, 350, 100, "left", 2, 1, 1, 0, "black", "ORB"),
    },
    {
      spawnDelay: 17500,
      createMonster: () => createUfoMonster(550, 125, 0.8, 8000, 17500),
    },
  ],

  coinSpawnPoints: [
    {
      x: 387.5,
      y: 287.5,
      type: CoinType.POWER,
      spawnAngle: -55,
    },
    {
      x: 387.6,
      y: 287.6,
      type: CoinType.POWER,
      spawnAngle: 155,
    },
    {
      x: 725,
      y: 25,
      type: CoinType.BONUS_MULTIPLIER,
    },
    {
      x: 725,
      y: 0,
      type: CoinType.EXTRA_LIFE,
    },
    {
      x: 275,
      y: 25,
      type: CoinType.BONUS_MULTIPLIER,
    },
    {
      x: 275,
      y: 0,
      type: CoinType.EXTRA_LIFE,
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
  level7Map,
  level8Map,
  level9Map,
];
