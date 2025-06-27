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
    collectedBombs: Set<string>; // Track collected bombs by "group-order" string
    correctBombs: Set<string>; // Track correctly collected bombs by "group-order" string
    activeGroup: number | null;
    nextBombOrder: number | null;
    gameStarted: boolean;
  }