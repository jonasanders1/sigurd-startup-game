/**
 * Tutorial mission definitions.
 *
 * Each mission has its own MapDefinition (kept slim — uses garasjen background
 * but only the entities relevant to the mission). The completion logic lives in
 * TutorialManager — this file is pure data.
 */

import { TutorialMissionId, CoinType } from "../types/enums";
import { GAME_CONFIG } from "../types/constants";
import { MapDefinition } from "../types/interfaces";
import {
  createAmbusherMonster,
  createFloaterMonster,
  createHorizontalPatrolMonster,
} from "../managers/MonsterFactory";

const centerX = (offsetWidth: number) =>
  (GAME_CONFIG.CANVAS_WIDTH - offsetWidth) / 2;
const centerY = (offsetHeight: number) =>
  (GAME_CONFIG.CANVAS_HEIGHT - offsetHeight) / 2;
const centerPoint = (offsetWidth: number, offsetHeight: number) => ({
  x: centerX(offsetWidth),
  y: centerY(offsetHeight),
});

const baseGround = {
  x: 0,
  y: GAME_CONFIG.CANVAS_HEIGHT - 40,
  width: GAME_CONFIG.CANVAS_WIDTH,
  height: 40,
  color: "#4c6986",
};

const platform = (
  x: number,
  y: number,
  width: number,
  color: string = "#ebb185"
) => ({ x, y, width, height: 15, color, borderColor: "#000" });

const baseMap = (overrides: Partial<MapDefinition> & { id: string }): MapDefinition => ({
  id: overrides.id,
  name: "garasjen",
  width: GAME_CONFIG.CANVAS_WIDTH,
  height: GAME_CONFIG.CANVAS_HEIGHT,
  background: "garasjen",
  playerStart: centerPoint(GAME_CONFIG.PLAYER_WIDTH, GAME_CONFIG.PLAYER_HEIGHT),
  spawnIndicatorColor: "#ff9ff3",
  groupSequence: [1],
  ground: baseGround,
  platforms: [],
  bombs: [],
  monsters: [],
  monsterSpawnPoints: [],
  coinSpawnPoints: [],
  ...overrides,
});

// ── Mission 1: Movements ──────────────────────────────────────────────────
// A few platforms for jumping, no monsters, no bombs.
const movementsMap: MapDefinition = baseMap({
  id: "tutorial-movements",
  playerStart: { x: 100, y: GAME_CONFIG.CANVAS_HEIGHT - 75 },
  platforms: [
    platform(150, 450, 200),
    platform(450, 350, 200),
    platform(200, 220, 200),
  ],
});

// ── Mission 2: Bomb logic ────────────────────────────────────────────────
// Full bomb layout (small set), no monsters. Player learns blinking-bomb guide.
const createBomb = (x: number, y: number, order: number, group: number) => ({
  x,
  y,
  width: GAME_CONFIG.BOMB_SIZE,
  height: GAME_CONFIG.BOMB_SIZE,
  order,
  group,
  isCollected: false,
  isBlinking: false,
});

const bombsMap: MapDefinition = baseMap({
  id: "tutorial-bombs",
  playerStart: { x: 100, y: GAME_CONFIG.CANVAS_HEIGHT - 75 },
  platforms: [
    platform(125, 170, 150),
    platform(525, 170, 150),
    platform(100, 400, 200),
    platform(500, 400, 200),
  ],
  groupSequence: [1, 2, 3, 4],
  bombs: [
    createBomb(140, 138, 1, 1),
    createBomb(190, 138, 2, 1),
    createBomb(240, 138, 3, 1),
    createBomb(540, 138, 4, 2),
    createBomb(590, 138, 5, 2),
    createBomb(640, 138, 6, 2),
    createBomb(110, 368, 7, 3),
    createBomb(160, 368, 8, 3),
    createBomb(210, 368, 9, 3),
    createBomb(260, 368, 10, 3),
    createBomb(510, 368, 11, 4),
    createBomb(560, 368, 12, 4),
    createBomb(610, 368, 13, 4),
    createBomb(660, 368, 14, 4),
  ],
});

// ── Mission 3: Survive ───────────────────────────────────────────────────
// Empty arena with one ambusher + one floater. Survive 10 s.
const surviveMap: MapDefinition = baseMap({
  id: "tutorial-survive",
  playerStart: centerPoint(GAME_CONFIG.PLAYER_WIDTH, GAME_CONFIG.PLAYER_HEIGHT),
  platforms: [platform(150, 400, 500)],
  monsters: [
    createAmbusherMonster(600, 100, 1),
    createFloaterMonster(100, 200, 35, 1),
  ],
});

// ── Mission 4: Kill ──────────────────────────────────────────────────────
// A few patrols to kill, one P-coin available. Mission ends when power mode
// expires; show how many monsters were killed before time ran out.
const killMap: MapDefinition = baseMap({
  id: "tutorial-kill",
  playerStart: centerPoint(GAME_CONFIG.PLAYER_WIDTH, GAME_CONFIG.PLAYER_HEIGHT),
  platforms: [
    platform(125, 170, 150),
    platform(525, 170, 150),
    platform(100, 400, 200),
    platform(500, 400, 200),
  ],
  monsters: [
    createHorizontalPatrolMonster(125, 170, 150, "left", 1, 1, undefined, 0, "green"),
    createHorizontalPatrolMonster(525, 170, 150, "right", 1, 1, undefined, 0, "black"),
    createHorizontalPatrolMonster(100, 400, 200, "right", 1, 1, undefined, 0, "green"),
    createHorizontalPatrolMonster(500, 400, 200, "left", 1, 1, undefined, 0, "black"),
  ],
  coinSpawnPoints: [
    {
      x: GAME_CONFIG.CANVAS_WIDTH / 2,
      y: 100,
      type: CoinType.POWER,
      spawnAngle: 65,
    },
  ],
});

// ── Mission registry ──────────────────────────────────────────────────────

export type SubTask = { id: string; label: string };

export interface TutorialMission {
  id: TutorialMissionId;
  title: string;
  description: string;
  goal: string;
  map: MapDefinition;
  subTasks?: SubTask[];
  totalMonsters?: number; // for Mission 4 stats
  totalBombs?: number; // for Mission 2 stats
  surviveDurationMs?: number; // for Mission 3
}

export const TUTORIAL_MISSIONS: Record<TutorialMissionId, TutorialMission> = {
  [TutorialMissionId.MOVEMENTS]: {
    id: TutorialMissionId.MOVEMENTS,
    title: "Bevegelse",
    description: "Lær å bevege Sigurd, hoppe og fly.",
    goal: "Fullfør alle bevegelsene",
    map: movementsMap,
    subTasks: [
      { id: "moveLeft", label: "Beveg venstre" },
      { id: "moveRight", label: "Beveg høyre" },
      { id: "jump", label: "Hopp" },
      { id: "superJump", label: "Super-hopp (Shift + Hopp)" },
      { id: "float", label: "Sveve (hold hopp i lufta)" },
    ],
  },
  [TutorialMissionId.BOMBS]: {
    id: TutorialMissionId.BOMBS,
    title: "Bomber",
    description: "Lær rekkefølgen — følg de blinkende bombene.",
    goal: "Samle alle bombene",
    map: bombsMap,
    totalBombs: 14,
  },
  [TutorialMissionId.SURVIVE]: {
    id: TutorialMissionId.SURVIVE,
    title: "Overlev",
    description: "Hold deg unna monstrene i 10 sekunder.",
    goal: "Overlev i 10 sekunder",
    map: surviveMap,
    surviveDurationMs: 10000,
  },
  [TutorialMissionId.KILL]: {
    id: TutorialMissionId.KILL,
    title: "Drep monstrene",
    description: "Plukk P-mynten og drep så mange monstre som mulig før effekten går ut.",
    goal: "Drep monstrene under power-effekten",
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
