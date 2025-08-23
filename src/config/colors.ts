/**
 * Color palette configuration
 * Contains all color definitions used throughout the game
 */

export const COLORS = {
  // Player
  PLAYER: "#00FF00",
  
  // Bombs
  BOMB: "#FFD700",
  BOMB_COLLECTED: "#666666",
  BOMB_NEXT: "#FF0000",
  
  // Monsters
  MONSTER: "#FF4444", // Default monster color (fallback)
  MONSTER_FROZEN: "#4444FF", // Blue color for frozen monsters
  
  // Monster type variants
  MONSTER_TYPES: {
    HORIZONTAL_PATROL: "#FF4444", // Red - horizontal patrol
    VERTICAL_PATROL: "#44FF44", // Green - vertical patrol
    CHASER: "#FF8844", // Orange - chaser
    AMBUSHER: "#8844FF", // Purple - ambusher
    FLOATER: "#44FFFF", // Cyan - floater
  },
  
  // Environment
  PLATFORM: "#484744",
  BACKGROUND: "#262521",
  GROUND: "#484744",
  
  // UI
  UI_PRIMARY: "#00FFFF",
  UI_SECONDARY: "#FFFFFF",
  
  // Coins
  COINS: {
    POWER: "#0066FF", // Blue for power coin
    BONUS: "#FF6600", // Orange for bonus multiplier coin
    LIFE: "#FF0066", // Pink for extra life coin
  },
} as const;