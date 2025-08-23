/**
 * Entity dimensions configuration
 * Contains sizes and dimensions for all game entities
 */

export const ENTITY_SIZES = {
  // Player dimensions
  PLAYER: {
    WIDTH: 25,
    HEIGHT: 35,
  },
  
  // Collectibles and obstacles
  BOMB_SIZE: 25,
  MONSTER_SIZE: 25,
  COIN_SIZE: 25,
  
  // Environment
  PLATFORM_HEIGHT: 25,
} as const;