/**
 * Core game constants organized by domain
 */

// Canvas and Display
export const DISPLAY = {
  CANVAS_WIDTH: 800,
  CANVAS_HEIGHT: 600,
  TARGET_FPS: 60,
  BACKGROUND_COLOR: '#262521',
} as const;

// Physics Engine
export const PHYSICS = {
  GRAVITY: 0.3,
  FLOAT_GRAVITY: 0.005,
  MAX_VELOCITY_X: 10,
  MAX_VELOCITY_Y: 15,
  BOUNCE_DAMPING: 0.8,
} as const;

// Player Configuration
export const PLAYER = {
  WIDTH: 25,
  HEIGHT: 40,
  COLOR: '#00FF00',
  MOVE_SPEED: 4,
  JUMP_POWER: 8,
  SUPER_JUMP_POWER: 12,
  MIN_JUMP_DURATION: 50, // ms
  MAX_JUMP_DURATION: 300, // ms
  SPAWN_X: 100,
  SPAWN_Y: 300,
} as const;

// Coin System
export const COINS = {
  SIZE: 20,
  GRAVITY: 0.2,
  BOUNCE_SPEED: 3,
  BOUNCE_DAMPING: 0.8,
  
  // Spawning rules
  POWER_SPAWN_INTERVAL: 9, // After every 9 firebombs
  BONUS_SPAWN_INTERVAL: 5000, // Every 5000 points
  LIFE_SPAWN_RATIO: 10, // Every 10 bonus coins
  
  // Points
  POWER_POINTS: 2000,
  BONUS_BASE_POINTS: 1000,
  LIFE_BASE_POINTS: 1000,
  MONSTER_KILL_POINTS: 100,
  
  // Effects
  POWER_DURATION: 7000, // 7 seconds
} as const;

// Bomb System
export const BOMBS = {
  SIZE: 16,
  COLOR: '#FFD700',
  COLOR_COLLECTED: '#666666',
  COLOR_NEXT: '#FF0000',
  POINTS_NORMAL: 100,
  POINTS_FIREBOMB: 200,
  TOTAL_COUNT: 23,
} as const;

// Monster System
export const MONSTERS = {
  SIZE: 18,
  COLOR: '#FF4444',
  COLOR_FROZEN: '#4444FF',
  BASE_SPEED: 1,
} as const;

// Game Rules
export const GAME_RULES = {
  STARTING_LIVES: 3,
  MAX_LIVES: 9,
  
  // Multiplier system
  MULTIPLIER_THRESHOLDS: {
    1: 0,
    2: 1800,
    3: 3600,
    4: 5400,
    5: 7200,
  },
  MAX_MULTIPLIER: 5,
  
  // Bonus scoring
  BONUS_POINTS: {
    23: 50000,
    22: 30000,
    21: 20000,
    20: 10000,
  },
} as const;

// Platform and Level
export const LEVEL = {
  PLATFORM_HEIGHT: 20,
  GROUND_COLOR: '#484744',
  PLATFORM_COLOR: '#484744',
} as const;

// UI and Menus
export const UI = {
  PRIMARY_COLOR: '#00FFFF',
  SECONDARY_COLOR: '#FFFFFF',
  MENU_TRANSITION_DURATION: 300, // ms
  FLOATING_TEXT_DURATION: 1000, // ms
} as const;

// Development
export const DEVELOPMENT = {
  SHOW_COLLISION_BOXES: false,
  SHOW_FPS_COUNTER: false,
  ENABLE_DEBUG_KEYS: false,
  LOG_PERFORMANCE: false,
} as const;

// Type exports for strict typing
export type DisplayConfig = typeof DISPLAY;
export type PhysicsConfig = typeof PHYSICS;
export type PlayerConfig = typeof PLAYER;
export type CoinsConfig = typeof COINS;
export type BombsConfig = typeof BOMBS;
export type MonstersConfig = typeof MONSTERS;
export type GameRulesConfig = typeof GAME_RULES;
export type LevelConfig = typeof LEVEL;
export type UIConfig = typeof UI;
export type DevelopmentConfig = typeof DEVELOPMENT;