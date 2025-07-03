// UI and visual configuration
export const UI_CONFIG = {
  // Color palette
  COLORS: {
    // Environment
    BACKGROUND: "#262521",
    PLATFORM: "#484744",
    GROUND: "#484744",
    
    // Player
    PLAYER: "#00FF00",
    
    // Bombs
    BOMB: "#FFD700",
    BOMB_COLLECTED: "#666666",
    BOMB_NEXT: "#FF0000",
    
    // Monsters
    MONSTER: "#FF4444",
    MONSTER_FROZEN: "#4444FF",
    
    // Coins
    COIN_POWER: "#0066FF",
    COIN_BONUS: "#FF6600",
    COIN_LIFE: "#FF0066",
    
    // UI
    UI_PRIMARY: "#00FFFF",
    UI_SECONDARY: "#FFFFFF",
  },
  
  // Text styles
  FONTS: {
    DEFAULT: "Arial",
    SCORE: "bold 16px Arial",
    BOMB_NUMBER: "10px Arial",
    COIN_LETTER: "bold 12px Arial",
  },
  
  // Animation timings
  ANIMATIONS: {
    BLINK_INTERVAL: 300, // ms
    FLOAT_TEXT_DURATION: 1000, // ms
    FLOAT_TEXT_RISE: 30, // pixels
  },
  
  // UI layout
  LAYOUT: {
    PADDING: 20,
    MARGIN: 10,
  },
};