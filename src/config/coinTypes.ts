import {
  CoinTypeConfig,
  CoinEffect,
  CoinPhysicsConfig,
  GameStateInterface,
  Coin,
  Platform,
  Ground,
} from "../types/interfaces";
import { CoinType } from "../types/enums";
import { GAME_CONFIG } from "../types/constants";
import { ScalingManager } from "../managers/ScalingManager";

// Define coin effects
export const COIN_EFFECTS = {
  POWER_MODE: {
    type: "POWER_MODE",
    duration: GAME_CONFIG.POWER_COIN_DURATION, // Default duration (will be overridden)
    points: GAME_CONFIG.POWER_COIN_POINTS,
    apply: (gameState: GameStateInterface, coin?: any) => {
      // Calculate duration based on coin color if available
      let duration = GAME_CONFIG.POWER_COIN_DURATION; // Default fallback

      if (coin && coin.spawnTime !== undefined) {
        // Get the color data for this specific coin
        const coinManager = gameState.coinManager;
        if (
          coinManager &&
          typeof coinManager.getPcoinColorForTime === "function"
        ) {
          try {
            const colorData = coinManager.getPcoinColorForTime(coin.spawnTime);
            duration = colorData.duration || GAME_CONFIG.POWER_COIN_DURATION;
          } catch (error) {
            console.warn(
              "Failed to get P-coin color data, using default duration:",
              error
            );
          }
        }
      }

      // Freeze monsters (safely handle undefined monsters)
      if (gameState.monsters && Array.isArray(gameState.monsters)) {
        gameState.monsters.forEach((monster) => {
          monster.isFrozen = true;
        });
      }

      // Enable monster killing
      gameState.activeEffects.powerMode = true;
      gameState.activeEffects.powerModeEndTime = Date.now() + duration;

      // Reset monster kill count for new power mode session
      if (gameState.coinManager) {
        gameState.coinManager.resetMonsterKillCount();
      }

      // Pause difficulty scaling during power mode
      try {
        const scalingManager = ScalingManager.getInstance();
        scalingManager.pauseForPowerMode();
      } catch (error) {
        console.log(
          "Could not pause difficulty scaling (ScalingManager not available)"
        );
      }

      // Start power-up melody with the correct duration
      if (gameState.audioManager && typeof gameState.audioManager.startPowerUpMelodyWithDuration === 'function') {
        console.log(`Starting PowerUp melody from coin effect for ${duration}ms`);
        console.log(`AudioManager available:`, gameState.audioManager);
        gameState.audioManager.startPowerUpMelodyWithDuration(duration);
      } else {
        console.warn("AudioManager not available for PowerUp melody");
        console.log(`GameState audioManager:`, gameState.audioManager);
        console.log(`GameState keys:`, Object.keys(gameState));
      }
    },
    remove: (gameState: GameStateInterface) => {
      console.log("Removing POWER_MODE effect, stopping PowerUp melody");
      
      // Stop power-up melody when effect ends
      if (gameState.audioManager && typeof gameState.audioManager.stopPowerUpMelody === 'function') {
        gameState.audioManager.stopPowerUpMelody();
      } else {
        console.warn("AudioManager not available to stop PowerUp melody");
      }
      
      // Unfreeze monsters (safely handle undefined monsters)
      if (gameState.monsters && Array.isArray(gameState.monsters)) {
        gameState.monsters.forEach((monster) => {
          monster.isFrozen = false;
        });
      }
      gameState.activeEffects.powerMode = false;

      // Resume difficulty scaling when power mode ends
      try {
        const scalingManager = ScalingManager.getInstance();
        scalingManager.resumeFromPowerMode();
      } catch (error) {
        console.log(
          "Could not resume difficulty scaling (ScalingManager not available)"
        );
      }
    },
  },

  BONUS_MULTIPLIER: {
    type: "BONUS_MULTIPLIER",
    points: 0, // Points will be calculated dynamically
    apply: (gameState: GameStateInterface) => {
      // Give points based on current multiplier (1000 * multiplier)
      const points = 1000 * gameState.multiplier;
      gameState.addScore(points);

      // Increase multiplier
      if (gameState.multiplier < GAME_CONFIG.MAX_MULTIPLIER) {
        gameState.setMultiplier(gameState.multiplier + 1, 0);
      }
    },
  },

  EXTRA_LIFE: {
    type: "EXTRA_LIFE",
    points: 1000,
    apply: (gameState: GameStateInterface) => {
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
    hasGravity: false, // We'll handle gravity manually
    bounces: false,
    reflects: false,
    customUpdate: (coin, platforms, ground) => {
      const FALL_SPEED = 2;
      const HORIZONTAL_SPEED = 1;
      const LANDING_TOLERANCE = 4; // For detecting when coin lands on platform
      const EDGE_TOLERANCE = 0; // For detecting when coin should fall off platform

      // If falling
      if (coin.velocityY > 0 || coin.velocityY === undefined) {
        coin.velocityX = 0;
        coin.velocityY = FALL_SPEED;
      }

      // Check for ground collision
      if (ground && coin.y + coin.height >= ground.y) {
        coin.y = ground.y - coin.height;
        coin.velocityY = 0;
        // If not already moving horizontally, pick a direction
        if (!coin.groundDirection) {
          coin.groundDirection = Math.random() < 0.5 ? -1 : 1;
          coin.velocityX = coin.groundDirection * HORIZONTAL_SPEED;
        }
        // Move horizontally
        coin.x += coin.velocityX;
        // Bounce off map boundaries
        if (coin.x <= 0) {
          coin.x = 0;
          coin.groundDirection = 1;
          coin.velocityX = HORIZONTAL_SPEED;
        } else if (coin.x + coin.width >= GAME_CONFIG.CANVAS_WIDTH) {
          coin.x = GAME_CONFIG.CANVAS_WIDTH - coin.width;
          coin.groundDirection = -1;
          coin.velocityX = -HORIZONTAL_SPEED;
        }
        return;
      }

      // Check for platform collision (landing)
      let landedOnPlatform = false;
      let currentPlatform = null;
      for (const platform of platforms) {
        const coinBottom = coin.y + coin.height;
        const platformTop = platform.y;
        const isOnTop =
          coinBottom >= platformTop &&
          coinBottom <= platformTop + LANDING_TOLERANCE;
        const isHorizontallyAligned =
          coin.x < platform.x + platform.width &&
          coin.x + coin.width > platform.x;
        if (isOnTop && isHorizontallyAligned) {
          landedOnPlatform = true;
          currentPlatform = platform;
          coin.y = platformTop - coin.height;
          coin.velocityY = 0;
          // Pick a random horizontal direction if not already moving
          if (!coin.platformDirection) {
            coin.platformDirection = Math.random() < 0.5 ? -1 : 1;
            coin.velocityX = coin.platformDirection * HORIZONTAL_SPEED;
          }
          break;
        }
      }

      if (landedOnPlatform && currentPlatform) {
        // Move horizontally
        coin.x += coin.velocityX;
        // If at edge, fall off
        if (
          coin.x + coin.width <= currentPlatform.x + EDGE_TOLERANCE ||
          coin.x >= currentPlatform.x + currentPlatform.width - EDGE_TOLERANCE
        ) {
          coin.platformDirection = null;
          coin.velocityX = 0;
          coin.velocityY = FALL_SPEED;
        }
      } else if (!landedOnPlatform) {
        // If not on platform or ground, fall
        coin.platformDirection = null;
        coin.velocityX = 0;
        coin.velocityY = FALL_SPEED;
      }
    },
  },
};

// P-coin color progression system with duration scaling
export const P_COIN_COLORS = [
  { color: "#3c82f6", points: 100, name: "Blue", duration: 3000 }, // Blue - 3 seconds
  { color: "#ef4444", points: 200, name: "Red", duration: 4000 }, // Red - 4 seconds
  { color: "#a855f7", points: 300, name: "Purple", duration: 5000 }, // Purple - 5 seconds
  { color: "#22c55d", points: 500, name: "Green", duration: 6000 }, // Green - 6 seconds
  { color: "#07b6d4", points: 800, name: "Cyan", duration: 7000 }, // Cyan - 7 seconds
  { color: "#ebb305", points: 1200, name: "Yellow", duration: 8000 }, // Yellow - 8 seconds
  { color: "#6b7280", points: 2000, name: "Gray", duration: 10000 }, // Gray - 10 seconds
];

// Define all coin types according to user specifications
export const COIN_TYPES: Record<string, CoinTypeConfig> = {
  [CoinType.POWER]: {
    type: CoinType.POWER,
    color: "#FF0000", // Initial color (will be dynamic)
    points: 0, // Points will be calculated dynamically based on color
    physics: COIN_PHYSICS.POWER,
    effects: [COIN_EFFECTS.POWER_MODE],
    spawnCondition: (gameState: GameStateInterface) => {
      // Spawn every 9 firebombs collected in correct order
      return gameState.firebombCount % 9 === 0;
    },
    maxActive: 1,
  },

  [CoinType.BONUS_MULTIPLIER]: {
    type: CoinType.BONUS_MULTIPLIER,
    color: "#e9b300", // Yellow-Orange
    points: GAME_CONFIG.BONUS_MULTIPLIER_COIN_POINTS,
    physics: COIN_PHYSICS.GRAVITY_ONLY,
    effects: [COIN_EFFECTS.BONUS_MULTIPLIER],
    spawnCondition: (gameState: GameStateInterface) => {
      // Spawn every BONUS_COIN_SPAWN_INTERVAL points
      // Use bombAndMonsterPoints if available, otherwise fall back to total score
      const score =
        (gameState as any).bombAndMonsterPoints || gameState.score || 0;
      return score > 0 && score % GAME_CONFIG.BONUS_COIN_SPAWN_INTERVAL === 0;
    },
    maxActive: 1,
  },

  [CoinType.EXTRA_LIFE]: {
    type: CoinType.EXTRA_LIFE,
    color: "#ef4444", // Red
    points: GAME_CONFIG.EXTRA_LIFE_COIN_POINTS,
    physics: COIN_PHYSICS.GRAVITY_ONLY,
    effects: [COIN_EFFECTS.EXTRA_LIFE],
    spawnCondition: (gameState: GameStateInterface) => {
      // Spawn for every EXTRA_LIFE_COIN_RATIO bonus multiplier coins collected
      const bonusCount = gameState.totalBonusMultiplierCoinsCollected || 0;
      return (
        bonusCount > 0 && bonusCount % GAME_CONFIG.EXTRA_LIFE_COIN_RATIO === 0
      );
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
      apply: (gameState: GameStateInterface) => {
        gameState.player.moveSpeed *= 1.5;
      },
      remove: (gameState: GameStateInterface) => {
        gameState.player.moveSpeed /= 1.5;
      }
    }],
    spawnCondition: (gameState: GameStateInterface) => gameState.score % 3000 === 0
  },
  
  MAGNET: {
    type: 'MAGNET',
    color: '#3498DB', // Blue
    points: 400,
    physics: COIN_PHYSICS.HOMING,
    effects: [{
      type: 'MAGNET',
      duration: 4000,
      apply: (gameState: GameStateInterface) => {
        gameState.activeEffects.magnetMode = true;
      },
      remove: (gameState: GameStateInterface) => {
        gameState.activeEffects.magnetMode = false;
      }
    }]
  }
};
*/
