import {
  CoinTypeConfig,
  CoinEffect,
  CoinPhysicsConfig,
  GameStateInterface,
  Coin,
  Platform,
} from "../types/interfaces";
import { CoinType } from "../types/enums";
import { GAME_CONFIG } from "../types/constants";
import { PLAYFIELD_BOTTOM } from "./floor";
import { COIN_SPAWNING } from "./coins";
import { ScalingManager } from "../managers/ScalingManager";
import { useAudioStore } from "../stores/systems/audioStore";
import { log } from "../lib/logger";
import { getTuned } from "../stores/systems/tuningStore";

// Define coin effects
export const COIN_EFFECTS = {
  POWER_MODE: {
    type: "POWER_MODE",
    duration: GAME_CONFIG.POWER_COIN_DURATION, // Default; overridden per pickup by coin color
    points: GAME_CONFIG.POWER_COIN_POINTS,
    apply: (gameState: GameStateInterface, coin?: any) => {
      // Calculate duration based on coin color if available
      let duration: number = GAME_CONFIG.POWER_COIN_DURATION; // Default fallback

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
            log.warn(
              "Failed to get P-coin color data, using default duration:",
              error
            );
          }
        }
      }

      // Freeze monsters (safely handle undefined monsters). Stamp frozenAt
      // so we can shift wall-clock timestamps on unfreeze; otherwise
      // movement classes see a bogus 7s gap on the first post-freeze frame
      // (e.g. Bird snaps onto player, Ambusher instantly redirects).
      const freezeStart = Date.now();
      if (gameState.monsters && Array.isArray(gameState.monsters)) {
        gameState.monsters.forEach((monster) => {
          monster.isFrozen = true;
          monster.frozenAt = freezeStart;
        });
      }

      // Enable monster killing
      gameState.activeEffects.powerMode = true;
      gameState.activeEffects.powerModeEndTime = freezeStart + duration;

      // Reset monster kill count for new power mode session
      if (gameState.coinManager) {
        gameState.coinManager.resetMonsterKillCount();
      }

      // Pause difficulty scaling during power mode
      try {
        const scalingManager = ScalingManager.getInstance();
        scalingManager.pauseForPowerMode();
      } catch (error) {
        log.debug(
          "Could not pause difficulty scaling (ScalingManager not available)"
        );
      }

      // Spawn/respawn pause is owned by coinManager around effect.apply
      // (importing useStateStore here would create a circular dependency).

      // Start power-up melody with the correct duration
      const audioStore = useAudioStore.getState();
      if (audioStore.audioManager && typeof audioStore.audioManager.startPowerUpMelodyWithDuration === 'function') {
        log.audio(`Starting PowerUp melody from coin effect for ${duration}ms`);
        log.debug(`AudioManager available:`, audioStore.audioManager);
        audioStore.audioManager.startPowerUpMelodyWithDuration(duration);
      } else {
        log.warn("AudioManager not available for PowerUp melody");
        log.debug(`AudioStore audioManager:`, audioStore.audioManager);
        log.debug(`AudioStore keys:`, Object.keys(audioStore));
      }
    },
    remove: (gameState: GameStateInterface) => {
      log.audio("Removing POWER_MODE effect, stopping PowerUp melody");
      
      // Stop power-up melody when effect ends
      // Get audioManager from the audioStore instead of gameState
      const audioStore = useAudioStore.getState();
      if (audioStore.audioManager && typeof audioStore.audioManager.stopPowerUpMelody === 'function') {
        audioStore.audioManager.stopPowerUpMelody();
      } else {
        log.warn("AudioManager not available to stop PowerUp melody");
      }
      
      // Unfreeze monsters (safely handle undefined monsters).
      // BJ mutation pass-through: tunable safe window when monster unfreezes.
      // Also shift wall-clock timestamps forward by the freeze duration so
      // movement classes resume cleanly (no 7s gap that would cause Bird to
      // snap onto player, etc.).
      if (gameState.monsters && Array.isArray(gameState.monsters)) {
        const now = Date.now();
        const passthrough = getTuned("MUTATION_PASSTHROUGH_MS");
        gameState.monsters.forEach((monster) => {
          if (monster.isFrozen) {
            monster.mutationEndTime = now + passthrough;

            // Shift any wall-clock timestamps the monster carries forward by
            // the freeze duration so `currentTime - <ts>` returns the same
            // elapsed value it would have without the freeze.
            const freezeDuration = monster.frozenAt
              ? now - monster.frozenAt
              : 0;
            if (freezeDuration > 0) {
              if (monster.lastDirectionChange !== undefined) {
                monster.lastDirectionChange += freezeDuration;
              }
              if (monster.lastSeenAt !== undefined) {
                monster.lastSeenAt += freezeDuration;
              }
              if (monster.nextHopTime !== undefined) {
                monster.nextHopTime += freezeDuration;
              }
            }
          }
          monster.isFrozen = false;
          monster.frozenAt = undefined;
        });
      }
      gameState.activeEffects.powerMode = false;

      // Resume difficulty scaling when power mode ends
      try {
        const scalingManager = ScalingManager.getInstance();
        scalingManager.resumeFromPowerMode();
      } catch (error) {
        log.debug(
          "Could not resume difficulty scaling (ScalingManager not available)"
        );
      }
    },
  },

  BONUS_MULTIPLIER: {
    type: "BONUS_MULTIPLIER",
    points: 0, // Points will be calculated dynamically
    apply: () => {
      // Scoring and multiplier bump are handled by coinStore.collectCoin()
      // This effect is intentionally empty to avoid double-counting
    },
  },

  EXTRA_LIFE: {
    type: "EXTRA_LIFE",
    points: 1000,
    apply: () => {
      // Score addition and life grant are handled by coinStore.collectCoin()
      // This effect is intentionally empty to avoid double-counting
    },
  },

  FOUNDER_MODE: {
    type: "FOUNDER_MODE",
    points: 0, // F-coin awards no in-game score; reward is the +1 Forretningsidee.
    apply: () => {
      // Bridge call (grantBusinessIdea), floating text, and audio are
      // handled by coinStore.collectCoin().
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
    hasGravity: false,
    bounces: false,
    reflects: false,
    // Bomb-Jack-style gravity-only coins (B / M / F):
    //  1. Fall straight down at constant FALL_SPEED until they hit a platform
    //     or the canvas floor.
    //  2. On a platform: pick a random direction (left/right) and walk.
    //     - Hitting a canvas wall reverses direction (bounce, keep walking).
    //     - Reaching the open platform edge → fall off, continue falling.
    //  3. On the canvas floor: bounce wall-to-wall forever until collected.
    //
    // Velocity values are PER FRAME at 60 FPS. The standard updateCoin loop
    // already applies `frameMultiplier` once when integrating position, so
    // do NOT pre-multiply velocity here and do NOT touch coin.x/coin.y
    // directly except to clamp.
    customUpdate: (coin, platforms) => {
      const FALL_SPEED = 2; // px/frame at 60 FPS — slow, fixed.
      const HORIZONTAL_SPEED = 2; // px/frame at 60 FPS.
      const LANDING_TOLERANCE = 4;
      // 0 (not 1) so the fall-off threshold lines up with the landing
      // threshold: the coin only falls when it's fully past the platform
      // edge, at which point the landing check correctly says "not aligned"
      // and won't re-snap the coin back onto the platform.
      const EDGE_TOLERANCE = 0;

      // ── On the playfield floor (top of decorative floor strip) ────────
      if (coin.y + coin.height >= PLAYFIELD_BOTTOM) {
        coin.y = PLAYFIELD_BOTTOM - coin.height;
        coin.velocityY = 0;
        coin.platformDirection = null;

        if (!coin.groundDirection) {
          coin.groundDirection = Math.random() < 0.5 ? -1 : 1;
        }

        // Bounce off canvas walls: reverse direction.
        if (coin.x <= 0) {
          coin.x = 0;
          coin.groundDirection = 1;
        } else if (coin.x + coin.width >= GAME_CONFIG.CANVAS_WIDTH) {
          coin.x = GAME_CONFIG.CANVAS_WIDTH - coin.width;
          coin.groundDirection = -1;
        }
        coin.velocityX = coin.groundDirection * HORIZONTAL_SPEED;
        return;
      }

      // ── Look for a platform under the coin ─────────────────────────────
      let landedPlatform: typeof platforms[number] | null = null;
      for (const platform of platforms) {
        const coinBottom = coin.y + coin.height;
        const platformTop = platform.y;
        const isOnTop =
          coinBottom >= platformTop &&
          coinBottom <= platformTop + LANDING_TOLERANCE;
        const isHorizontallyAligned =
          coin.x < platform.x + platform.width &&
          coin.x + coin.width > platform.x;
        // Only LAND when descending (velocityY >= 0). Coins shouldn't snap
        // onto a platform while passing through from below.
        if (isOnTop && isHorizontallyAligned && coin.velocityY >= 0) {
          landedPlatform = platform;
          coin.y = platformTop - coin.height;
          coin.velocityY = 0;
          if (!coin.platformDirection) {
            coin.platformDirection = Math.random() < 0.5 ? -1 : 1;
            coin.velocityX = coin.platformDirection * HORIZONTAL_SPEED;
          }
          break;
        }
      }

      // ── Walking on a platform ──────────────────────────────────────────
      if (landedPlatform) {
        // Canvas wall takes priority over platform edge: bounce, keep walking.
        if (coin.x <= 0) {
          coin.x = 0;
          coin.platformDirection = 1;
          coin.velocityX = HORIZONTAL_SPEED;
          return;
        }
        if (coin.x + coin.width >= GAME_CONFIG.CANVAS_WIDTH) {
          coin.x = GAME_CONFIG.CANVAS_WIDTH - coin.width;
          coin.platformDirection = -1;
          coin.velocityX = -HORIZONTAL_SPEED;
          return;
        }

        // Platform edge (no wall blocking) → fall off.
        const offLeft =
          coin.x + coin.width <= landedPlatform.x + EDGE_TOLERANCE;
        const offRight =
          coin.x >= landedPlatform.x + landedPlatform.width - EDGE_TOLERANCE;
        if (offLeft || offRight) {
          coin.platformDirection = null;
          coin.velocityX = 0;
          coin.velocityY = FALL_SPEED;
        }
        // else: keep walking — velocityX is already set, std update advances x.
        return;
      }

      // ── Free-falling: not on platform, not on floor ────────────────────
      coin.platformDirection = null;
      coin.groundDirection = null;
      coin.velocityX = 0;
      coin.velocityY = FALL_SPEED;
    },
  },
};

// P-coin color progression system with duration scaling
export const P_COIN_COLORS = [
  { color: "#8fb7ff", points: 100, name: "Blue", duration: 3000 }, // coin-blue - 3 seconds
  { color: "#ee90cb", points: 200, name: "Pink", duration: 4000 }, // coin-pink - 4 seconds
  { color: "#8465ec", points: 300, name: "Purple", duration: 5000 }, // coin-purple - 5 seconds
  { color: "#abdd64", points: 500, name: "Lime", duration: 6000 }, // coin-lime - 6 seconds
  { color: "#22d3ee", points: 800, name: "Cyan", duration: 7000 }, // coin-cyan - 7 seconds
  { color: "#eab308", points: 1000, name: "Yellow", duration: 8000 }, // coin-yellow - 8 seconds
  { color: "#91a6b0", points: 2000, name: "Gray", duration: 10000 }, // coin-gray - 10 seconds
] as const;

// Stable English keys used as the wire-format contract with the host backend.
// Frontend maps these to localized labels for display (see P_COIN_TUTORIAL_INFO).
export type PCoinTier = (typeof P_COIN_COLORS)[number]["name"];

export type PCoinTierCollections = Record<PCoinTier, number>;

export const emptyPCoinTierCollections = (): PCoinTierCollections =>
  P_COIN_COLORS.reduce(
    (acc, c) => {
      acc[c.name] = 0;
      return acc;
    },
    {} as PCoinTierCollections
  );

export const sumPCoinTierCollections = (
  entries: ReadonlyArray<PCoinTierCollections | undefined>
): PCoinTierCollections => {
  const out = emptyPCoinTierCollections();
  for (const e of entries) {
    if (!e) continue;
    for (const k of Object.keys(out) as PCoinTier[]) {
      out[k] += e[k] ?? 0;
    }
  }
  return out;
};

// Define all coin types according to user specifications
export const COIN_TYPES: Record<string, CoinTypeConfig> = {
  [CoinType.POWER]: {
    type: CoinType.POWER,
    color: "#8fb7ff", // Initial color (will be dynamic — coin-blue)
    points: 0, // Points will be calculated dynamically based on color
    physics: COIN_PHYSICS.POWER,
    effects: [COIN_EFFECTS.POWER_MODE],
    // BJ P-coin spawning is driven by a token counter (firebomb=2, normal=1,
    // threshold=9), gated on no live P-coin. Implemented in
    // CoinManager.checkPcoinSpawnConditions; this function is unused.
    spawnCondition: () => false,
    maxActive: 1,
  },

  [CoinType.BONUS_MULTIPLIER]: {
    type: CoinType.BONUS_MULTIPLIER,
    color: "#eab308", // coin-yellow
    points: GAME_CONFIG.BONUS_MULTIPLIER_COIN_POINTS,
    physics: COIN_PHYSICS.GRAVITY_ONLY,
    effects: [COIN_EFFECTS.BONUS_MULTIPLIER],
    spawnCondition: (gameState: GameStateInterface) => {
      // Spawn every BONUS_COIN_SPAWN_INTERVAL points from firebomb collection ONLY
      // This prevents B-coin collection from triggering more B-coins
      const firebombPoints = (gameState as any).firebombPoints || 0;
      
      // Check if we've reached a threshold (not using modulo since that fails for incremental points)
      // This is handled properly in checkBcoinSpawnConditions method
      return firebombPoints >= GAME_CONFIG.BONUS_COIN_SPAWN_INTERVAL;
    },
    maxActive: 1,
  },

  [CoinType.FOUNDER_MODE]: {
    type: CoinType.FOUNDER_MODE,
    color: "#f97316", // tailwind orange-500 — Founder Mode (FAFO) signature.
    points: 0, // F-coin grants Forretningsidee, no score award.
    physics: COIN_PHYSICS.GRAVITY_ONLY,
    effects: [COIN_EFFECTS.FOUNDER_MODE],
    // Run-level roll happens inside CoinManager (see rollFCoinForRun); this
    // gate is unused but kept for COIN_TYPES iteration consistency.
    spawnCondition: () => false,
    maxActive: 1,
  },

  [CoinType.EXTRA_LIFE]: {
    type: CoinType.EXTRA_LIFE,
    color: "#ee90cb", // coin-pink
    points: GAME_CONFIG.EXTRA_LIFE_COIN_POINTS,
    physics: COIN_PHYSICS.GRAVITY_ONLY,
    effects: [COIN_EFFECTS.EXTRA_LIFE],
    // BJ E-coin: every 8 B-coins, with each life lost giving 2 credits toward
    // the next milestone. Gate is "potential" only; downstream dedup handles
    // milestone uniqueness via triggeredSpawnConditions.
    spawnCondition: (gameState: GameStateInterface) => {
      const bonusCount = gameState.totalBonusMultiplierCoinsCollected || 0;
      const livesLost = gameState.livesLostThisGame ?? 0;
      const effective =
        bonusCount + COIN_SPAWNING.EXTRA_LIFE_DEATH_GENEROSITY * livesLost;
      return effective >= COIN_SPAWNING.EXTRA_LIFE_COIN_RATIO;
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
