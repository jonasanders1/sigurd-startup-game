import {
  CoinTypeConfig,
  CoinEffect,
  CoinPhysicsConfig,
} from "../types/interfaces";
import { CoinType } from "../types/enums";
import { GAME_CONFIG } from "../types/constants";

// Define coin effects
export const COIN_EFFECTS = {
  POWER_MODE: {
    type: "POWER_MODE",
    duration: GAME_CONFIG.POWER_COIN_DURATION,
    points: GAME_CONFIG.POWER_COIN_POINTS,
    apply: (gameState: any) => {
      // Freeze monsters
      gameState.monsters.forEach((monster: any) => {
        monster.isFrozen = true;
      });
      // Enable monster killing
      gameState.activeEffects.powerMode = true;
      gameState.activeEffects.powerModeEndTime =
        Date.now() + GAME_CONFIG.POWER_COIN_DURATION;
      
      // Reset monster kill count for new power mode session
      if (gameState.coinManager) {
        gameState.coinManager.resetMonsterKillCount();
      }
    },
    remove: (gameState: any) => {
      // Unfreeze monsters
      gameState.monsters.forEach((monster: any) => {
        monster.isFrozen = false;
      });
      gameState.activeEffects.powerMode = false;
    },
  },

  BONUS_MULTIPLIER: {
    type: "BONUS_MULTIPLIER",
    points: 0, // Points will be calculated dynamically
    apply: (gameState: any) => {
      // Give points based on current multiplier (1000 * multiplier)
      const points = 1000 * gameState.multiplier;
      gameState.addScore(points);

      // Increase multiplier
      if (gameState.multiplier < GAME_CONFIG.MAX_MULTIPLIER) {
        gameState.multiplier += 1;
      }
    },
  },

  EXTRA_LIFE: {
    type: "EXTRA_LIFE",
    points: 1000,
    apply: (gameState: any) => {
      // Add extra life
      gameState.lives += 1;
    },
  },
};

// Define coin physics configurations
export const COIN_PHYSICS = {
  STANDARD: {
    hasGravity: true,
    bounces: true,
    reflects: false,
  },

  POWER: {
    hasGravity: false,
    bounces: false,
    reflects: true,
  },

  GRAVITY_ONLY: {
    hasGravity: true,
    bounces: false,
    reflects: false,
    customUpdate: (coin: any, platforms: any[], ground: any) => {
      // Only vertical gravity, no horizontal movement
      coin.velocityY += GAME_CONFIG.COIN_GRAVITY;
      coin.y += coin.velocityY;

      // Check ground collision first
      if (ground && coin.y + coin.height >= ground.y) {
        coin.y = ground.y - coin.height;
        coin.velocityY = 0;
        coin.platformDirection = null; // Reset platform direction when on ground

        // Move left/right along ground
        if (!coin.groundDirection) {
          coin.groundDirection = Math.random() < 0.5 ? -1 : 1; // Random initial direction
        }

        const groundSpeed = 1;
        coin.x += coin.groundDirection * groundSpeed;

        // Bounce off walls
        if (coin.x <= 0) {
          coin.x = 0;
          coin.groundDirection = 1;
        } else if (coin.x + coin.width >= GAME_CONFIG.CANVAS_WIDTH) {
          coin.x = GAME_CONFIG.CANVAS_WIDTH - coin.width;
          coin.groundDirection = -1;
        }
        return; // Don't check platform collisions if on ground
      }

      // Check if coin is currently on a platform
      let isOnPlatform = false;
      let currentPlatform = null;

      for (const platform of platforms) {
        // Check if coin is on top of this platform with more precise detection
        const coinBottom = coin.y + coin.height;
        const platformTop = platform.y;
        const isOnTop =
          coinBottom >= platformTop && coinBottom <= platformTop + 5; // Small range for "on top"
        const isHorizontallyAligned =
          coin.x < platform.x + platform.width &&
          coin.x + coin.width > platform.x;

        if (isOnTop && isHorizontallyAligned) {
          isOnPlatform = true;
          currentPlatform = platform;
          // Ensure coin is properly positioned on platform
          coin.y = platformTop - coin.height;
          coin.velocityY = 0;
          break;
        }
      }

      // If on a platform, move horizontally
      if (isOnPlatform && currentPlatform) {
        // Start moving horizontally on platform if not already moving
        if (!coin.platformDirection) {
          coin.platformDirection = Math.random() < 0.5 ? -1 : 1; // Random initial direction
        }

        // Calculate next position
        const platformSpeed = 1; // Increased speed for better movement
        const nextX = coin.x + coin.platformDirection * platformSpeed;

        console.log("Platform bounds check:", {
          coinX: coin.x,
          coinWidth: coin.width,
          nextX: nextX,
          platformX: currentPlatform.x,
          platformWidth: currentPlatform.width,
          leftCheck: nextX + coin.width <= currentPlatform.x,
          rightCheck: nextX >= currentPlatform.x + currentPlatform.width,
          direction: coin.platformDirection,
        });
        // Check if coin is near or past the platform edge
        const edgeTolerance = 1; // Small tolerance for edge detection

        // Check if coin is at or past the left edge
        if (nextX + coin.width <= currentPlatform.x + edgeTolerance) {
          // Coin has fallen off the left edge
          coin.platformDirection = null;
          coin.x = currentPlatform.x - coin.width; // Position just off the platform
        }
        // Check if coin is at or past the right edge
        else if (
          nextX >=
          currentPlatform.x + currentPlatform.width - edgeTolerance
        ) {
          // Coin has fallen off the right edge
          coin.platformDirection = null;
          coin.x = currentPlatform.x + currentPlatform.width; // Position just off the platform
        } else {
          // Safe to move, update position
          coin.x = nextX;
        }
      } else {
        // Not on any platform, check for new platform collisions
        for (const platform of platforms) {
          // Check if coin is falling and about to land on platform
          if (
            coin.velocityY > 0 && // Falling
            coin.x < platform.x + platform.width &&
            coin.x + coin.width > platform.x &&
            coin.y < platform.y &&
            coin.y + coin.height >= platform.y
          ) {
            // Land on platform
            coin.y = platform.y - coin.height;
            coin.velocityY = 0;
            coin.platformDirection = null; // Will be set on next frame
            break;
          }
        }
      }
    },
  },
};

// P-coin color progression system
export const P_COIN_COLORS = [
  { color: "#0066FF", points: 100, name: "Blue" },    // Blue
  { color: "#FF0000", points: 200, name: "Red" },     // Red  
  { color: "#800080", points: 300, name: "Purple" },  // Purple
  { color: "#00FF00", points: 500, name: "Green" },   // Green
  { color: "#00FFFF", points: 800, name: "Cyan" },    // Cyan
  { color: "#FFFF00", points: 1200, name: "Yellow" }, // Yellow
  { color: "#808080", points: 2000, name: "Gray" }    // Gray
];

// Define all coin types according to user specifications
export const COIN_TYPES: Record<string, CoinTypeConfig> = {
  [CoinType.POWER]: {
    type: CoinType.POWER,
    color: "#FF0000", // Initial color (will be dynamic)
    points: 0, // Points will be calculated dynamically based on color
    physics: COIN_PHYSICS.POWER,
    effects: [COIN_EFFECTS.POWER_MODE],
    spawnCondition: (gameState: any) => {
      // Spawn every 9 firebombs collected in correct order
      return gameState.firebombCount % 9 === 0;
    },
    maxActive: 1,
  },

  [CoinType.BONUS_MULTIPLIER]: {
    type: CoinType.BONUS_MULTIPLIER,
    color: "#800080", // Purple
    points: GAME_CONFIG.BONUS_MULTIPLIER_COIN_POINTS,
    physics: COIN_PHYSICS.GRAVITY_ONLY,
    effects: [COIN_EFFECTS.BONUS_MULTIPLIER],
    spawnCondition: (gameState: any) => {
      // Spawn every BONUS_COIN_SPAWN_INTERVAL points
      const score = gameState.score || 0;
      return score > 0 && score % GAME_CONFIG.BONUS_COIN_SPAWN_INTERVAL === 0;
    },
    maxActive: 1,
  },

  [CoinType.EXTRA_LIFE]: {
    type: CoinType.EXTRA_LIFE,
    color: "#FFFF00", // Yellow
    points: GAME_CONFIG.EXTRA_LIFE_COIN_POINTS,
    physics: COIN_PHYSICS.GRAVITY_ONLY,
    effects: [COIN_EFFECTS.EXTRA_LIFE],
    spawnCondition: (gameState: any) => {
      // Spawn for every 10 bonus multiplier coins collected
      const bonusCount = gameState.totalBonusMultiplierCoinsCollected || 0;
      return bonusCount > 0 && bonusCount % 10 === 0;
    },
    maxActive: 1,
  },
};

// Example of how to add new coin types easily:
/*
export const COIN_TYPES = {
  ...COIN_TYPES,
  
  SPEED_BOOST: {
    type: 'SPEED_BOOST',
    color: '#9B59B6', // Purple
    points: 300,
    physics: COIN_PHYSICS.FLOATING,
    effects: [{
      type: 'SPEED_BOOST',
      duration: 3000,
      apply: (gameState) => {
        gameState.player.moveSpeed *= 1.5;
      },
      remove: (gameState) => {
        gameState.player.moveSpeed /= 1.5;
      }
    }],
    spawnCondition: (gameState) => gameState.score % 3000 === 0
  },
  
  MAGNET: {
    type: 'MAGNET',
    color: '#3498DB', // Blue
    points: 400,
    physics: COIN_PHYSICS.HOMING,
    effects: [{
      type: 'MAGNET',
      duration: 4000,
      apply: (gameState) => {
        gameState.activeEffects.magnetMode = true;
      },
      remove: (gameState) => {
        gameState.activeEffects.magnetMode = false;
      }
    }]
  }
};
*/
