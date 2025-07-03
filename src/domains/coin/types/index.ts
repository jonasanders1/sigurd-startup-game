export interface CoinState {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: CoinType;
  isCollected: boolean;
  velocityX: number;
  velocityY: number;
  spawnX: number;
  spawnY: number;
  effectDuration?: number;
  colorIndex?: number;
  spawnTime?: number;
}

export enum CoinType {
  POWER = 'POWER',
  BONUS_MULTIPLIER = 'BONUS_MULTIPLIER',
  EXTRA_LIFE = 'EXTRA_LIFE',
}

export interface CoinSpawnPoint {
  x: number;
  y: number;
  type: CoinType;
  spawnAngle?: number;
}

export interface CoinEffect {
  type: string;
  duration?: number;
  points?: number;
  apply: (gameState: any) => void;
  remove?: (gameState: any) => void;
}

export interface CoinPhysicsConfig {
  hasGravity: boolean;
  bounces: boolean;
  reflects: boolean;
  customUpdate?: (coin: CoinState, platforms: any[], ground: any) => void;
}

export interface CoinTypeConfig {
  type: CoinType;
  color: string;
  points: number;
  physics: CoinPhysicsConfig;
  effects: CoinEffect[];
  spawnCondition?: (gameState: any) => boolean;
  maxActive?: number;
}

export interface CoinManagerState {
  coins: CoinState[];
  activeEffects: Map<string, { endTime: number; effect: CoinEffect }>;
  firebombCount: number;
  powerModeActive: boolean;
  powerModeEndTime: number;
  bombAndMonsterPoints: number;
}