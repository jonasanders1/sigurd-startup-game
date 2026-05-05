/**
 * Tutorial mission definitions.
 *
 * Each mission has its own MapDefinition (kept slim — uses garasjen background
 * but only the entities relevant to the mission). The completion logic lives in
 * TutorialManager — this file is pure data.
 *
 * Map shape mirrors src/maps/mapDefinitions.ts so code exported from the editor
 * (Toolbar → Export TS) pastes in cleanly.
 */

import { TutorialMissionId, CoinType } from "../types/enums";
import { GAME_CONFIG } from "../types/constants";
import { MapDefinition } from "../types/interfaces";
import { P_COIN_COLORS } from "../config/coinTypes";
import {
  createUfoMonster,
  createBirdMonster,
  createHornMonster,
  createMummyMonster,
  createVerticalPatrolMonster,
} from "../managers/MonsterFactory";
import {
  createBomb,
  createPlatform,
  createVerticalPlatform,
} from "../maps/mapFactories";

// Norwegian satirical names for the P-coin tiers, indexed against P_COIN_COLORS
// (so colour, points and duration come from the canonical config). Used by the
// Mission 4 overlay and the result-screen flavour text.
export const P_COIN_TUTORIAL_LABELS = [
  "Lokal støtte",
  "Ordførergodkjenning",
  "Startup-plan",
  "Fritak fra dokumentasjon",
  "Aksjeopsjoner",
  "Skattelette",
  "EU-støtte",
] as const;

export const P_COIN_TUTORIAL_INFO = P_COIN_COLORS.map((c, i) => ({
  color: c.color,
  label: P_COIN_TUTORIAL_LABELS[i] ?? c.name,
  durationMs: c.duration,
  durationLabel: `${Math.round(c.duration / 1000)}s`,
}));

// ── Mission 1: Movements ──────────────────────────────────────────────────
// A few platforms for jumping, no monsters, no bombs.
export const movementsMap: MapDefinition = {
  id: "tutorial-movements",
  name: "garasjen",
  floor: "gray",
  width: GAME_CONFIG.CANVAS_WIDTH,
  height: GAME_CONFIG.CANVAS_HEIGHT,
  background: "garasjen",
  playerStart: { x: 378.5, y: 278.5 },
  spawnIndicatorColor: "#ff9ff3",

  groupSequence: [1],

  platforms: [
    {
      ...createPlatform(
        500,
        425,
        { width: 175, height: 25 },
        "#2f3543",
        "#000",
      ),
      tileTheme: "plastic",
    },
    {
      ...createPlatform(75, 225, { width: 150, height: 25 }, "#2f3543", "#000"),
      tileTheme: "plastic",
    },
    {
      ...createPlatform(75, 475, { width: 150, height: 25 }, "#2f3543", "#000"),
      tileTheme: "plastic",
    },
  ],

  bombs: [],

  monsters: [],
};

// ── Mission 2: Bomb logic ────────────────────────────────────────────────
// Full bomb layout (small set), no monsters. Player learns blinking-bomb guide.
export const bombsMap: MapDefinition = {
  id: "tutorial-bombs",
  name: "garasjen",
  floor: "gray",
  width: GAME_CONFIG.CANVAS_WIDTH,
  height: GAME_CONFIG.CANVAS_HEIGHT,
  background: "garasjen",
  playerStart: { x: 378.5, y: 278.5 },
  spawnIndicatorColor: "#ff9ff3",

  groupSequence: [1, 2, 3, 4],

  platforms: [
    createPlatform(125, 450, { width: 200, height: 25 }, "#2f3543", "#000"),
    createPlatform(525, 375, { width: 200, height: 25 }, "#2f3543", "#000"),
    createPlatform(525, 175, { width: 150, height: 25 }, "#2f3543", "#000"),
    createPlatform(125, 175, { width: 150, height: 25 }, "#2f3543", "#000"),
  ],

  bombs: [
    createBomb(140, 147, 1, 1),
    createBomb(190, 147, 2, 1),
    createBomb(240, 147, 3, 1),
    createBomb(540, 148, 4, 2),
    createBomb(590, 148, 5, 2),
    createBomb(640, 148, 6, 2),
    createBomb(138, 423, 7, 3),
    createBomb(188, 423, 8, 3),
    createBomb(238, 423, 9, 3),
    createBomb(288, 423, 10, 3),
    createBomb(538, 348, 11, 4),
    createBomb(588, 348, 12, 4),
    createBomb(638, 348, 13, 4),
    createBomb(688, 348, 14, 4),
  ],

  monsters: [],
};

// ── Mission 3: Survive ───────────────────────────────────────────────────
// 30 s gauntlet — one of each monster type so the player meets them all.
// Patrol monsters need their platforms (h-patrol on horizontal, v-patrol next
// to a wall), so platforms here are aligned with the spawn coords below.
export const surviveMap: MapDefinition = {
  id: "tutorial-survive",
  name: "garasjen",
  floor: "gray",
  width: GAME_CONFIG.CANVAS_WIDTH,
  height: GAME_CONFIG.CANVAS_HEIGHT,
  background: "garasjen",
  playerStart: { x: 387.5, y: 282.5 },
  spawnIndicatorColor: "#ff9ff3",

  groupSequence: [1],

  platforms: [
    createVerticalPlatform(550, 300, 150, "#2f3543", "#000"),
    createPlatform(400, 425, { width: 150, height: 25 }, "#2f3543", "#000"),
    createPlatform(250, 150, { width: 150, height: 25 }, "#2f3543", "#000"),
    createVerticalPlatform(225, 150, 150, "#2f3543", "#000"),
    createPlatform(100, 500, { width: 150, height: 25 }, "#2f3543", "#000"),
    createVerticalPlatform(100, 350, 150, "#2f3543", "#000"),
    createPlatform(550, 100, { width: 150, height: 25 }, "#2f3543", "#000"),
    createVerticalPlatform(675, 125, 150, "#2f3543", "#000"),
  ],

  bombs: [],

  monsters: [
    createUfoMonster(600, 175, 0.8, 8000, 0),
    createHornMonster(425, 275, -142, 1, 0),
  ],

  monsterSpawnPoints: [
    {
      spawnDelay: 0,
      respawnInterval: 6000,
      maxSpawns: 2,
      createMonster: () =>
        createMummyMonster(
          125,
          500,
          125,
          "left",
          1,
          1,
          undefined,
          0,
          "green",
          "ORB",
        ),
    },
    {
      spawnDelay: 0,
      respawnInterval: 11500,
      maxSpawns: 2,
      createMonster: () =>
        createMummyMonster(
          400,
          425,
          150,
          "right",
          3,
          1,
          undefined,
          0,
          "green",
          "SPHERE",
        ),
    },
  ],
};

// ── Mission 4: Kill ──────────────────────────────────────────────────────
// A few patrols to kill, one P-coin available. Mission ends when power mode
// expires; show how many monsters were killed before time ran out.
export const killMap: MapDefinition = {
  id: "tutorial-kill",
  name: "garasjen",
  floor: "gray",
  width: GAME_CONFIG.CANVAS_WIDTH,
  height: GAME_CONFIG.CANVAS_HEIGHT,
  background: "garasjen",
  playerStart: { x: 387.5, y: 282.5 },
  spawnIndicatorColor: "#ff9ff3",

  groupSequence: [1],

  platforms: [
    createPlatform(100, 175, { width: 150, height: 25 }, "#2f3543", "#000"),
    createPlatform(525, 175, { width: 150, height: 25 }, "#2f3543", "#000"),
    createPlatform(125, 400, { width: 150, height: 25 }, "#2f3543", "#000"),
    createPlatform(525, 400, { width: 150, height: 25 }, "#2f3543", "#000"),
  ],

  bombs: [],

  monsters: [
    createMummyMonster(100, 175, 150, "left", 11, 1, 1, 0, "green", "SPHERE"),
    createMummyMonster(525, 175, 150, "right", 10, 1, -1, 0, "black", "SPHERE"),
    createMummyMonster(125, 400, 150, "right", 5, 1, -1, 0, "green", "SPHERE"),
    createMummyMonster(525, 400, 150, "left", 8, 1, 1, 0, "black", "SPHERE"),
    createHornMonster(575, 500, 47, 1, 0),
  ],

  monsterSpawnPoints: [
    {
      spawnDelay: 5000,
      createMonster: () => createBirdMonster(200, 50, 0.8, 0.2, 500, 5000),
    },
  ],

  coinSpawnPoints: [
    {
      x: 50,
      y: 225,
      type: CoinType.POWER,
      spawnAngle: 53,
    },
  ],
};

// ── Mission registry ──────────────────────────────────────────────────────

export type SubTask = { id: string; label: string };

export interface TutorialMission {
  id: TutorialMissionId;
  title: string;
  description: string;
  goal: string;
  /** Title shown in the top-right tutorial overlay (defaults to `title`). */
  overlayTitle?: string;
  map: MapDefinition;
  subTasks?: SubTask[];
  totalMonsters?: number;
  totalBombs?: number;
  surviveDurationMs?: number;
}

export const TUTORIAL_MISSIONS: Record<TutorialMissionId, TutorialMission> = {
  [TutorialMissionId.MOVEMENTS]: {
    id: TutorialMissionId.MOVEMENTS,
    title: "Bevegelse 101",
    description: "Lær å manøvrere skjemajungelen.",
    goal: "Lær å bevege Sigurd",
    overlayTitle: "Kontroller",
    map: movementsMap,
    subTasks: [
      { id: "moveLeft", label: "Gå venstre" },
      { id: "moveRight", label: "Gå høyre" },
      { id: "jump", label: "Hopp" },
      { id: "superJump", label: "Super-hopp" },
      { id: "float", label: "Sveve" },
      { id: "fall", label: "Rask fall" },
    ],
  },
  [TutorialMissionId.BOMBS]: {
    id: TutorialMissionId.BOMBS,
    title: "Finansieringer",
    description: "Plukk i riktig rekkefølge — som om Skatteetaten ser på.",
    goal: "Samle alle finansieringene",
    overlayTitle: "Samle finansiering",
    map: bombsMap,
    totalBombs: 14,
  },
  [TutorialMissionId.SURVIVE]: {
    id: TutorialMissionId.SURVIVE,
    title: "Overlev byråkratiet",
    description: "Hold deg unna byråkratene så lenge du klarer.",
    goal: "Overlev",
    overlayTitle: "Tid igjen",
    map: surviveMap,
    surviveDurationMs: 30000,
  },
  [TutorialMissionId.KILL]: {
    id: TutorialMissionId.KILL,
    title: "Politisk Ryggvind",
    description: "Plukk mynten på rett øyeblikk og fei vekk byråkratene.",
    goal: "Drep monstrene under effekten",
    overlayTitle: "Plukk Politisk Ryggvind",
    map: killMap,
    totalMonsters: 4,
  },
};

export const TUTORIAL_MISSION_ORDER: TutorialMissionId[] = [
  TutorialMissionId.MOVEMENTS,
  TutorialMissionId.BOMBS,
  TutorialMissionId.SURVIVE,
  TutorialMissionId.KILL,
];
