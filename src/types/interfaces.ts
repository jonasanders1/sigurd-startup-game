export interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  velocityX: number;
  velocityY: number;
  isGrounded: boolean;
  isFloating: boolean;
  isJumping: boolean;
  jumpStartTime: number;
  moveSpeed: number;
  jumpPower: number;
  gravity: number;
  floatGravity: number;
}

// Base monster properties that all monsters share
interface BaseMonster {
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
  speed: number;
  direction: number;
  isActive: boolean;
  isFrozen?: boolean;
  isBlinking?: boolean; // For power mode warning
  spawnTime?: number; // When this monster was spawned
  lastDirectionChange?: number; // For behavior timing
  behaviorState?: string; // Current behavior state
  spawnDelay?: number; // When this monster should spawn (in milliseconds)
  // New properties for gravity-based movement
  velocityX?: number;
  velocityY?: number;
  isGrounded?: boolean;
  gravity?: number;
  isFalling?: boolean; // Whether the monster is currently falling
  currentPlatform?: Platform | null; // Current platform the monster is on
  spawnSide?: 'left' | 'right'; // Which side of the platform it spawned on
  walkLengths?: number; // How many times to walk across the platform before falling
  currentWalkCount?: number; // Current walk count
  originalSpawnX?: number; // Original spawn position for fall detection
}

// Patrol monster (horizontal and vertical)
interface PatrolMonster extends BaseMonster {
  type: "HORIZONTAL_PATROL" | "VERTICAL_PATROL";
  patrolStartX: number;
  patrolEndX: number;
  patrolStartY?: number; // For vertical patrol
  patrolEndY?: number; // For vertical patrol
  patrolSide?: "left" | "right"; // Which side of platform to patrol on (for vertical patrol)
}

// Chaser monster
interface ChaserMonster extends BaseMonster {
  type: "CHASER";
  patrolStartX: number;
  patrolEndX: number;
  patrolStartY?: number;
  patrolEndY?: number;
  directness?: number; // How direct they track the player (0.0-1.0)
  chaseTargetX?: number; // Current chase target
  chaseTargetY?: number; // Current chase target
  chaseUpdateInterval?: number; // How often to update target (ms)
}

// Ambusher monster
interface AmbusherMonster extends BaseMonster {
  type: "AMBUSHER";
  targetX?: number; // For wandering behavior
  targetY?: number; // For wandering behavior
  ambushCooldown?: number; // Time until next ambush
  ambushTargetX?: number; // Stored target position
  ambushTargetY?: number; // Stored target position
}

// Floater monster
interface FloaterMonster extends BaseMonster {
  type: "FLOATER";
  patrolStartX: number;
  patrolEndX: number;
  patrolStartY?: number;
  patrolEndY?: number;
  startAngle?: number; // Starting angle in degrees for straight-line movement
}

// Union type for all monster types
export type Monster =
  | PatrolMonster
  | ChaserMonster
  | AmbusherMonster
  | FloaterMonster;

// Type guards for monster types
export const isPatrolMonster = (monster: Monster): monster is PatrolMonster =>
  monster.type === "HORIZONTAL_PATROL" || monster.type === "VERTICAL_PATROL";

export const isChaserMonster = (monster: Monster): monster is ChaserMonster =>
  monster.type === "CHASER";

export const isAmbusherMonster = (
  monster: Monster
): monster is AmbusherMonster => monster.type === "AMBUSHER";

export const isFloaterMonster = (monster: Monster): monster is FloaterMonster =>
  monster.type === "FLOATER";

export interface Bomb {
  x: number;
  y: number;
  width: number;
  height: number;
  order: number;
  group: number;
  isCollected: boolean;
  isBlinking: boolean;
  isCorrect?: boolean;
}

export interface Coin {
  x: number;
  y: number;
  width: number;
  height: number;
  type: string;
  isCollected: boolean;
  velocityX: number;
  velocityY: number;
  spawnX: number;
  spawnY: number;
  effectDuration?: number;
  colorIndex?: number; // For P-coins to track current color
  spawnTime?: number; // For P-coins to track when they spawned
  platformDirection?: number | null; // For platform movement
  groundDirection?: number | null; // For ground movement
}

export interface CoinSpawnPoint {
  x: number;
  y: number;
  type: string;
  spawnAngle?: number;
}

export interface MonsterSpawnPoint {
  spawnDelay: number; // When this monster should spawn (in milliseconds)
  createMonster: () => Monster; // Function that creates the monster using MonsterFactory
  color?: string; // Optional custom color override for the monster
}

export interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  borderColor?: string;
  isVertical?: boolean; // Indicates if this is a vertical platform (wall)
}

export interface Ground {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

export interface MapDefinition {
  id: string;
  name: string;
  width: number;
  height: number;
  playerStart: {
    x: number;
    y: number;
  };
  platforms: Platform[];
  ground: Ground;
  bombs: Bomb[];
  monsters: Monster[];
  coinSpawnPoints?: CoinSpawnPoint[];
  monsterSpawnPoints?: MonsterSpawnPoint[];
  background?: string;

  groupSequence: number[];
  timeLimit?: number;
  difficulty: number;
}

export interface CollisionResult {
  hasCollision: boolean;
  normal?: { x: number; y: number };
  penetration?: number;
}

export interface BombCollectionState {
  collectedBombs: Set<string>;
  correctBombs: Set<string>;
  activeGroup: number | null;
  nextBombOrder: number | null;
  gameStarted: boolean;
}

export interface CoinState {
  coins: Coin[];
  activeEffects: {
    powerMode: boolean;
    powerModeEndTime: number;
  };
  firebombCount: number;
}

// Comprehensive GameState interface for type safety
export interface GameStateInterface {
  // Player state
  player: Player;

  // Game state
  currentState: string;
  currentLevel: number;
  score: number;
  lives: number;
  multiplier: number;
  multiplierScore: number;

  // Collections
  monsters: Monster[];
  bombs: Bomb[];
  coins: Coin[];
  platforms: Platform[];
  ground: Ground;

  // Effects
  activeEffects: {
    powerMode: boolean;
    powerModeEndTime: number;
  };

  // Counters
  firebombCount: number;
  totalCoinsCollected: number;
  totalPowerCoinsCollected: number;
  totalBonusMultiplierCoinsCollected: number;

  // Managers
  coinManager?: {
    resetMonsterKillCount: () => void;
  };

  // Methods
  addScore: (points: number) => void;
  setMultiplier: (multiplier: number, score: number) => void;
}

// New interfaces for scalable coin system
export interface CoinEffect {
  type: string;
  duration?: number;
  points?: number;
  apply: (gameState: GameStateInterface) => void;
  remove?: (gameState: GameStateInterface) => void;
}

export interface CoinPhysicsConfig {
  hasGravity: boolean;
  bounces: boolean;
  reflects: boolean;
  customUpdate?: (coin: Coin, platforms: Platform[], ground: Ground) => void;
}

export interface CoinTypeConfig {
  type: string;
  color: string;
  points: number;
  physics: CoinPhysicsConfig;
  effects: CoinEffect[];
  spawnCondition?: (gameState: GameStateInterface) => boolean;
  maxActive?: number;
}

export interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  startTime: number;
  duration: number;
  color: string;
  fontSize: number;
}

// New interface for monster spawn configurations
export interface MonsterSpawnConfig {
  type: string;
  spawnInterval: number; // Base spawn interval in milliseconds
  maxActive: number; // Maximum number of this type active at once
  spawnPoints: Array<{
    x: number;
    y: number;
    patrolStartX?: number;
    patrolEndX?: number;
    patrolStartY?: number;
    patrolEndY?: number;
  }>;
  speedRange: { min: number; max: number };
  difficultyMultiplier: number; // How much this type scales with difficulty
}

// Interface for dynamic spawning system
export interface DynamicSpawnSystem {
  levelStartTime: number;
  currentDifficulty: number;
  spawnConfigs: MonsterSpawnConfig[];
  activeMonsters: Monster[];
  lastSpawnTimes: Map<string, number>;
  difficultyScaling: {
    timeBased: boolean;
    scoreBased: boolean;
    bombBased: boolean;
  };
}
