/**
 * Configuration Management System
 * Central export point for all game configuration modules
 */

// Core game configuration
export * from './game';
export * from './entities';

// Gameplay systems
export * from './scoring';
export * from './coins';

// Visual and audio
export * from './colors';
export * from './audio';

// Development
export * from './dev';

// Backwards compatibility exports for easier migration
export { 
  CANVAS_CONFIG,
  PHYSICS_CONFIG,
  GAME_RULES,
  RENDERING_CONFIG 
} from './game';

export { ENTITY_SIZES } from './entities';
export { COIN_PHYSICS, COIN_SPAWNING, COIN_EFFECTS } from './coins';
export { BOMB_POINTS, MULTIPLIER_SYSTEM, BONUS_POINTS } from './scoring';
export { COLORS } from './colors';
export { DEFAULT_AUDIO_SETTINGS } from './audio';
export { DEV_CONFIG } from './dev';