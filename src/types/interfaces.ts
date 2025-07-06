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
  
  export interface Monster {
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
    type: string;
    patrolStartX: number;
    patrolEndX: number;
    speed: number;
    direction: number;
    isActive: boolean;
    isFrozen?: boolean;
    isBlinking?: boolean; // For power mode warning
  }
  
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
  
  export interface Platform {
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
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
    playerStartX: number;
    playerStartY: number;
    platforms: Platform[];
    ground: Ground;
    bombs: Bomb[];
    monsters: Monster[];
    coinSpawnPoints?: CoinSpawnPoint[];
    backgroundColor: string;
    theme: string;
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