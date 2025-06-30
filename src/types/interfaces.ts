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