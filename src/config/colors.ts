/**
 * Color palette configuration
 * Contains all color definitions used throughout the game
 */

export const COLORS = {
  // Player
  PLAYER: "#abdd64", // KAPLAY lime

  // Bombs
  BOMB: "#eab308", // coin-yellow
  BOMB_COLLECTED: "#3a4150", // surface-line (dim on dark)
  BOMB_NEXT: "#ee90cb", // accent-pink

  // Monsters
  MONSTER: "#ee90cb", // Default monster color (accent pink)
  MONSTER_FROZEN: "#8fb7ff", // coin-blue for frozen monsters

  // Monster type variants — KAPLAY accent palette
  MONSTER_TYPES: {
    MUMMY: "#ee90cb", // Pink - horizontal patrol
    VERTICAL_PATROL: "#abdd64", // Lime - vertical patrol
    BIRD: "#f2ae99", // Peach — bird (BJ §5.1.1, was CHASER)
    UFO: "#8465ec", // Purple - ambusher
    HORN: "#22d3ee", // Cyan - floater
    // BJ airborne forms — distinct accent colors for the simple-rect render.
    SPHERE: "#fbbf24", // Amber
    ORB: "#a78bfa", // Lavender
  },

  // Environment
  PLATFORM: "#2f3543", // surface-raised
  BACKGROUND: "#2a303c", // background
  GROUND: "#242933", // surface

  // UI
  UI_PRIMARY: "#abdd64", // KAPLAY lime
  UI_SECONDARY: "#ffffff",

  // Coins — KAPLAY vivid set
  COINS: {
    POWER: "#8fb7ff", // coin-blue
    BONUS: "#eab308", // coin-yellow
    LIFE: "#ee90cb", // coin-pink
  },
} as const;