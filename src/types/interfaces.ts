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
  isFastFalling: boolean;
  jumpStartTime: number;
  moveSpeed: number;
  jumpPower: number;
  // Index into the BJ gravity LUT (game-specs §4.3). Drives all vertical
  // velocity. 0 = max upward, 64 = apex/hover, 127 = terminal downward.
  // Resets to 64 (apex) when grounded so walking off a platform falls
  // naturally; jumps snap it to 0; float (SPACE in air) snaps it to 64.
  gravityIndex: number;
  // Per-jump multiplier on the gravity-index advance rate during the
  // ascending half (idx < APEX). Lower = slower ascent = higher peak.
  // Set on jump initiation per JumpType (game-specs §4.4); reset to 1.0
  // on landing.
  jumpAdvanceRate: number;
  // Legacy constant-gravity fields — kept for backwards-compat with code
  // paths that still read them, but no longer drive physics.
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
  // Timestamp (Date.now()) when the monster was last frozen. Used by the
  // power-mode unfreeze path to shift wall-clock timestamps (lastSeenAt,
  // nextHopTime, lastDirectionChange) forward by the freeze duration so
  // movement classes don't see a bogus 7s gap on the first post-freeze frame.
  frozenAt?: number;
  isBlinking?: boolean; // For power mode warning
  // BJ "mutation" pass-through window: when a monster transitions form (e.g.,
  // unfreezing at power-mode end), player-monster collision is ignored until
  // this timestamp.
  mutationEndTime?: number;
  // BJ §5.4 spawn invulnerability — event-based. `false` means the monster
  // hasn't made its first AI decision yet, so player-monster collision is
  // ignored. Set to `true` by each movement class on its first direction
  // change / target update / bounce. Undefined ≡ true (lethal) for monsters
  // that don't go through a movement class with this wiring (e.g. airborne
  // forms produced by Bureaucrat transformation).
  isLethal?: boolean;
  spawnTime?: number; // When this monster was spawned
  lastDirectionChange?: number; // For behavior timing
  // Wall-clock timestamps used by Wisp's hop-and-pause logic. Lifted onto
  // BaseMonster so the power-mode unfreeze path can shift them generically
  // without a cast. Undefined for non-Wisp types.
  lastSeenAt?: number;
  nextHopTime?: number;
  behaviorState?: string; // Current behavior state
  spawnDelay?: number; // When this monster should spawn (in milliseconds)
  // New properties for gravity-based movement
  velocityX?: number;
  velocityY?: number;
  isGrounded?: boolean;
  gravity?: number;
  isFalling?: boolean; // Whether the monster is currently falling
  /** Y at the moment a Bureaucrat started phase-2 gravity fall. Used by the
   *  swept-landing detector and the source-platform clearance gate. */
  fallStartY?: number;
  /** Bureaucrat ground-impact transition phase (BJ §5.1.2). When true the bureaucrat
   *  plays the transition animation in place; on completion it either
   *  transforms (CONSULTANT/ROBOT) or dies. Movement and collision are paused
   *  while transitioning. */
  isTransitioning?: boolean;
  /** Wall-clock time the transition started, used to time out the phase. */
  transitionStartTime?: number;
  /** Bump animation axis for airborne floaters (Robot/Consultant/Founder/Wisp). When
   *  set, the renderer plays bump-${axis}-${dir} once and clears the field
   *  on completion. */
  bumpAxis?: "horizontal" | "vertical";
  /** Direction (-1 = left, 1 = right) the bump is facing. */
  bumpDirection?: -1 | 1;
  /** Wall-clock time the bump started. Useful as a safety timeout if the
   *  one-shot animation never completes. */
  bumpedAt?: number;
  currentPlatform?: Platform | null; // Current platform the monster is on
  spawnSide?: 'left' | 'right'; // Which side of the platform it spawned on
  walkLengths?: number; // How many times to walk across the platform before falling
  currentWalkCount?: number; // Current walk count
  originalSpawnX?: number; // Original spawn position for fall detection
  // Respawn system properties
  isDead?: boolean; // Whether the monster is currently dead
  deathTime?: number; // When the monster was killed
  respawnTime?: number; // When the monster should respawn
  originalSpawnPoint?: { x: number; y: number }; // Original spawn position for respawning
  // Pre-transform snapshot. Set by Bureaucrat's ground-impact transformation
  // (PatrolMovement.transformBureaucratOnGround) so a bureaucrat killed AFTER it has
  // mutated into CONSULTANT/ROBOT respawns as a fresh bureaucrat instead of the
  // transformed form. Cleared by resetMonsterState on respawn. Undefined
  // for monsters that never transformed.
  originalType?: string;
  originalColor?: string;
  originalWidth?: number;
  originalHeight?: number;
  
  // Individual scaling properties
  individualSpawnTime?: number; // When this specific monster was spawned (for individual scaling)
  individualScalingPaused?: boolean; // Whether this monster's scaling is paused

  // Runtime scaling properties (added by ScalingManager/behavior systems)
  updateIntervalMultiplier?: number;
  directnessMultiplier?: number;
  speedMultiplier?: number;
  spawnPauseTime?: number;

  // Hitbox bookkeeping written by applyBoundsToMonster — kept on the monster
  // so the natural anchor stays stable across per-frame hitbox swaps.
  _boundsOffsetX?: number;
  _boundsOffsetY?: number;
  _boundsRotation?: number;
}

// Horizontal-patrol bureaucrat
interface PatrolMonster extends BaseMonster {
  type: "BUREAUCRAT";
  patrolStartX: number;
  patrolEndX: number;
  /** Per-bureaucrat ground-impact transform target (BJ §5.1.2). Defaults to
   *  "CONSULTANT" if absent. "NONE" = die instead of mutating. */
  transformTarget?: "CONSULTANT" | "ROBOT" | "NONE";
  // Snapshot of the spawn-time platform bounds. updateFallingBureaucrat rewrites
  // patrolStartX/EndX when a dropped bureaucrat lands on a different platform; on
  // respawn we restore from these so the bureaucrat patrols its original platform
  // again instead of inheriting bounds from where it died.
  originalPatrolStartX?: number;
  originalPatrolEndX?: number;
}

// Wisp monster (BJ §5.1.1) — Manhattan-cardinal hop-and-pause toward Jack.
interface WispMonster extends BaseMonster {
  type: "WISP";
  patrolStartX: number;
  patrolEndX: number;
  patrolStartY?: number;
  patrolEndY?: number;
  directness?: number; // legacy — currently unused, kept for tuning compat
  chaseTargetX?: number; // legacy
  chaseTargetY?: number; // legacy
  chaseUpdateInterval?: number; // legacy
  /** Destination of the current hop (axis-locked, fixed-distance). Cleared
   *  on arrival; the wisp then rests until `nextHopTime` (on BaseMonster)
   *  before picking a fresh hop direction. */
  hopTargetX?: number;
  hopTargetY?: number;
  /** Delayed snapshot of the player's position the wisp is chasing. Refreshed
   *  every `WISP_TARGET_DELAY_MS`; planNextHop reads from this instead of
   *  the live player so the wisp tracks where Jack WAS, not where he is.
   *  Refreshed timestamp lives on BaseMonster.lastSeenAt. */
  lastSeenPlayerX?: number;
  lastSeenPlayerY?: number;
}

// Ambusher monster
interface TaxGhostMonster extends BaseMonster {
  type: "TAXGHOST";
  targetX?: number; // For wandering behavior
  targetY?: number; // For wandering behavior
  ambushCooldown?: number; // Time until next ambush
  ambushTargetX?: number; // Stored target position
  ambushTargetY?: number; // Stored target position
}

// Floater monster
interface FounderMonster extends BaseMonster {
  type: "FOUNDER";
  patrolStartX: number;
  patrolEndX: number;
  patrolStartY?: number;
  patrolEndY?: number;
  startAngle?: number; // Starting angle in degrees for straight-line movement
}

// BJ airborne forms (Monster-Movments.md). Consultant/Robot bounce edge-to-edge
// on one axis while homing on the other; Club does inertial 2D pursuit
// with edge bouncing.
interface AirborneMonster extends BaseMonster {
  type: "CONSULTANT" | "ROBOT";
}

// Union type for all monster types
export type Monster =
  | PatrolMonster
  | WispMonster
  | TaxGhostMonster
  | FounderMonster
  | AirborneMonster;

// Type guard for the new airborne family.
export const isAirborneMonster = (
  monster: Monster
): monster is AirborneMonster =>
  monster.type === "CONSULTANT" || monster.type === "ROBOT";

// Type guards for monster types
export const isPatrolMonster = (monster: Monster): monster is PatrolMonster =>
  monster.type === "BUREAUCRAT";

export const isWispMonster = (monster: Monster): monster is WispMonster =>
  monster.type === "WISP";

export const isTaxGhostMonster = (
  monster: Monster
): monster is TaxGhostMonster => monster.type === "TAXGHOST";

export const isFounderMonster = (monster: Monster): monster is FounderMonster =>
  monster.type === "FOUNDER";

export interface Founding {
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
  /** ms between repeated spawns. >0 = the spawn point fires continuously
   *  every `respawnInterval` ms after the initial `spawnDelay`. 0 / undefined
   *  = legacy one-shot behavior. */
  respawnInterval?: number;
  /** Hard cap on total fires for a recurring spawn point. 0 / undefined =
   *  unlimited. Only meaningful when respawnInterval > 0. */
  maxSpawns?: number;
}

import type { PlatformTheme } from "../config/platformTiles";
import type { FloorVariant } from "../config/floor";

/**
 * Per-corner rounding flags. Each true corner gets PLATFORM_CORNER_RADIUS
 * applied; missing/false corners stay square. Visual only — collision is
 * still AABB.
 */
export interface RoundedCorners {
  tl?: boolean;
  tr?: boolean;
  bl?: boolean;
  br?: boolean;
}

export interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  borderColor?: string;
  isVertical?: boolean;
  tileTheme?: PlatformTheme;
  roundedCorners?: RoundedCorners;
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
  foundings: Founding[];
  monsters: Monster[];
  coinSpawnPoints?: CoinSpawnPoint[];
  monsterSpawnPoints?: MonsterSpawnPoint[];
  background?: string;
  spawnIndicatorColor?: string; // Color for spawn/respawn indicators
  /** Decorative striped floor tiled across the canvas bottom. Visual only —
   *  the canvas bottom is still the player's effective ground. Omit for no
   *  floor strip. */
  floor?: FloorVariant;

  groupSequence: number[];
  timeLimit?: number;
  
}

/**
 * Identifying info about a monster that killed the player. Captured at the
 * moment of normal-mode collision (power-mode kills don't set this — those
 * kill the monster, not the player). Used in analytics payloads
 * (LevelFailureData, LevelHistoryEntry) so the host can attribute deaths.
 *
 * Stringly-typed `type` / `originalType` so the payload stays serializable
 * without leaking the MonsterType enum to consumers.
 */
export interface KillerInfo {
  type: string;
  /** Pre-transform type if the killer is a transformed Bureaucrat (CONSULTANT/ROBOT
   *  killed the player after morphing). Undefined otherwise. */
  originalType?: string;
}

export interface CollisionResult {
  hasCollision: boolean;
  normal?: { x: number; y: number };
  penetration?: number;
}

export interface FoundingCollectionState {
  collectedFoundings: Set<string>;
  correctFoundings: Set<string>;
  activeGroup: number | null;
  nextFoundingOrder: number | null;
  gameStarted: boolean;
}

export interface centerPoint {
  offsetHeight: number,
  offsetWidth: number,
}

export interface CoinState {
  coins: Coin[];
  activeEffects: {
    powerMode: boolean;
    powerModeEndTime: number;
  };
  firefoundingCount: number;
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
  foundings: Founding[];
  coins: Coin[];
  platforms: Platform[];

  // Effects
  activeEffects: {
    powerMode: boolean;
    powerModeEndTime: number;
  };

  // Counters
  firefoundingCount: number;
  totalCoinsCollected: number;
  totalPowerCoinsCollected: number;
  totalBonusMultiplierCoinsCollected: number;
  // Lifetime lives lost this game (BJ E-coin death-generosity).
  livesLostThisGame?: number;

  // Managers
  coinManager?: {
    resetMonsterKillCount: () => void;
    getPcoinColorForTime?: (spawnTime: number) => {
      color: string;
      points: number;
      name: string;
      index: number;
      duration?: number;
    };
    getPowerModeEndTime?: () => number;
  };
  audioManager?: {
    startPowerUpMelodyWithDuration: (duration: number) => void;
    stopPowerUpMelody: () => void;
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
  apply: (gameState: GameStateInterface, coin?: any) => void;
  remove?: (gameState: GameStateInterface) => void;
}

export interface CoinPhysicsConfig {
  hasGravity: boolean;
  bounces: boolean;
  reflects: boolean;
  customUpdate?: (coin: Coin, platforms: Platform[], deltaTime?: number) => void;
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
    foundingBased: boolean;
  };
}
