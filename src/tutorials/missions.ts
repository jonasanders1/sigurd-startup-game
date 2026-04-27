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
import { P_COIN_COLORS } from "../config/coinTypes";
import {
  createAmbusherMonster,
  createChaserMonster,
  createFloaterMonster,
  createHorizontalPatrolMonster,
  createVerticalPatrolMonster,
} from "../managers/MonsterFactory";

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

const verticalPlatform = (
  x: number,
  y: number,
  height: number,
  color: string = "#ebb185"
) => ({
  x,
  y,
  width: 15,
  height,
  color,
  borderColor: "#000",
  isVertical: true,
});

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
// 30 s gauntlet — one of each monster type so the player meets them all.
// Patrol monsters need their platforms (h-patrol on horizontal, v-patrol next
// to a wall), so platforms here are aligned with the spawn coords below.
const surviveMap: MapDefinition = baseMap({
  id: "tutorial-survive",
  playerStart: centerPoint(GAME_CONFIG.PLAYER_WIDTH, GAME_CONFIG.PLAYER_HEIGHT),
  platforms: [
    platform(150, 170, 200), // anchors the horizontal patrol
    verticalPlatform(680, 220, 200), // anchors the vertical patrol
    platform(100, 400, 200),
    platform(500, 400, 200),
  ],
  monsters: [
    createHorizontalPatrolMonster(150, 170, 200, "left", 1, 1, undefined, 0, "green"),
    createVerticalPatrolMonster(680, 220, 180, "left"),
    createChaserMonster(250, 300, 1, 0.3, 1000),
    createFloaterMonster(100, 250, 35, 1),
    createAmbusherMonster(600, 80, 1),
  ],
  coinSpawnPoints: [],
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
