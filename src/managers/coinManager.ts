import {
  Coin,
  CoinSpawnPoint,
  Monster,
  Platform,
  CoinTypeConfig,
  GameStateInterface,
  CoinEffect,
} from "../types/interfaces";
import { CoinType } from "../types/enums";
import { GAME_CONFIG } from "../types/constants";
import { CoinPhysics } from "./coinPhysics";
import { COIN_TYPES, P_COIN_COLORS, COIN_EFFECTS } from "../config/coinTypes";
import { COIN_SPAWNING } from "../config/coins";
import { log, LogCategory, logger } from "../lib/logger";
import { ScalingManager } from "./ScalingManager";
import { useAudioStore } from "../stores/systems/audioStore";
import { AudioEvent } from "../types/enums";
import { useScoreStore, useStateStore } from "../stores/gameStore";
import { getTuned } from "../stores/systems/tuningStore";
import {
  bCoinMilestonesCrossed,
  mCoinSpawnDecision,
  monsterKillBasePoints,
  pCoinSpawnsAt,
  pCoinTokensForBomb,
  tokensAddedOnBomb,
} from "../lib/bjRules";
import { useCoinStore } from "../stores/entities/coinStore";

interface EffectData {
  endTime: number;
  effect: CoinEffect;
  remainingDuration?: number; // Track remaining duration when paused
}

export class CoinManager {
  private coins: Coin[] = [];
  private spawnPoints: CoinSpawnPoint[] = [];
  private firebombCount: number = 0;
  // BJ P-coin tokens: firebomb=2, normal=1, threshold=9. Increment paused while
  // a P-coin is alive on screen. Spawn at 9, subtract 9 (don't reset to 0).
  private pCoinTokens: number = 0;
  private powerModeActive: boolean = false;
  private powerModeEndTime: number = 0;
  private activeEffects: Map<string, EffectData> = new Map();
  private triggeredSpawnConditions: Set<string> = new Set(); // Track which spawn conditions have been triggered
  private lastProcessedScore: number = 0; // Track the last score threshold that was processed
  private lastScoreCheck: number = 0; // Track the last total score we checked for B-coin spawning
  private bombAndMonsterPoints: number = 0; // Track points from bombs and monsters only (no bonus)
  private coinPoints: number = 0; // Track points earned from coin collection only (for statistics)
  private firebombPoints: number = 0; // Track points from firebomb collection only (for B-coin spawning)
  private monsterKillCount: number = 0; // Track monsters killed in current power mode session
  private pCoinColorIndex: number = 0; // Track current P-coin color index
  private bCoinSpawnsThisLevel: number = 0; // BJ: max 5 B-coin spawns per level
  private pCoinSpawnsThisLevel: number = 0; // BJ: max 2 P-coin spawns per level
  // BJ S-coin: rolled once per level. If hit, schedules a single spawn.
  private sCoinScheduledSpawnTime: number | null = null;
  private sCoinSpawnedThisLevel: boolean = false;
  private lastBonusCountLogged: number = 0; // Track last logged bonus count to avoid duplicate logging
  private lastFirebombCountLogged: number = 0; // Track last logged firebomb count to avoid duplicate logging

  // Pause state tracking
  private isPaused: boolean = false;
  private pauseStartTime: number = 0;

  constructor(spawnPoints: CoinSpawnPoint[] = []) {
    this.spawnPoints = spawnPoints;
    log.debug("CoinManager initialized");

    // Log all coin spawn configurations for debugging
    const pcoinSpawnPoints = spawnPoints.filter((p) => p.type === "POWER");
    const bcoinSpawnPoints = spawnPoints.filter(
      (p) => p.type === "BONUS_MULTIPLIER"
    );
    const mcoinSpawnPoints = spawnPoints.filter((p) => p.type === "EXTRA_LIFE");

    log.data("CoinSpawn: Initialize - All coin spawn conditions", {
      "P-Coin (Power)": {
        condition: "Every 9 firebombs collected in correct order",
        spawnInterval: COIN_SPAWNING.POWER_COIN_SPAWN_INTERVAL,
        spawnPointsCount: pcoinSpawnPoints.length,
        spawnPoints: pcoinSpawnPoints.map((p) => ({ x: p.x, y: p.y })),
        expectedSpawnsAt: [9, 18, 27, 36, 45].map((n) => `${n} firebombs`),
        color: "Dynamic (red to purple gradient based on time left)",
        effects: "Power mode - invincibility and monster destruction",
      },
      "B-Coin (Bonus Multiplier)": {
        condition:
          "Every 5000 points from firebomb collection only (100/200 points per firebomb)",
        spawnInterval: GAME_CONFIG.BONUS_COIN_SPAWN_INTERVAL,
        spawnPointsCount: bcoinSpawnPoints.length,
        spawnPoints: bcoinSpawnPoints.map((p) => ({ x: p.x, y: p.y })),
        expectedSpawnsAt: [5000, 10000, 15000, 20000, 25000].map(
          (n) => `${n} firebomb points`
        ),
        color: "#e9b300 (yellow-orange)",
        effects: "1000 × current multiplier points + increase multiplier",
        note: "Does NOT include points from B-coin or E-coin collection to prevent spawn loops",
      },
      "M-Coin (Extra Life)": {
        condition: `Every ${GAME_CONFIG.EXTRA_LIFE_COIN_RATIO} B-coins collected`,
        ratio: GAME_CONFIG.EXTRA_LIFE_COIN_RATIO,
        spawnPointsCount: mcoinSpawnPoints.length,
        spawnPoints: mcoinSpawnPoints.map((p) => ({ x: p.x, y: p.y })),
        expectedSpawnsAt: [5, 10, 15, 20, 25].map((n) => `${n} B-coins`),
        color: "#ef4444 (red)",
        effects: "+1 extra life",
      },
      usage:
        "Run gameLog.coinSpawn() to see real-time spawn checks, or gameLog.coinConditions() for this summary",
    });
  }

  // Stop the P-coin ambient loop if anything is playing. Used by all reset
  // paths so the loop doesn't outlive the level/run that spawned it.
  private stopPowerCoinAmbientIfAny(): void {
    const hadLivePcoin = this.coins.some(
      (c) => c.type === CoinType.POWER && !c.isCollected
    );
    if (hadLivePcoin) {
      useAudioStore
        .getState()
        .audioManager?.playSound(AudioEvent.POWER_COIN_AMBIENT_STOP);
    }
  }

  // Full reset for game over - clears everything
  reset(): void {
    this.stopPowerCoinAmbientIfAny();
    this.coins = [];
    this.firebombCount = 0;
    this.pCoinTokens = 0;
    this.powerModeActive = false;
    this.powerModeEndTime = 0;
    this.activeEffects.clear();
    this.triggeredSpawnConditions.clear();
    this.lastProcessedScore = 0;
    this.lastScoreCheck = 0;
    this.bombAndMonsterPoints = 0;
    this.coinPoints = 0;
    this.firebombPoints = 0;
    this.monsterKillCount = 0;
    this.bCoinSpawnsThisLevel = 0;
    this.pCoinSpawnsThisLevel = 0;
    this.lastBonusCountLogged = 0;
    this.lastFirebombCountLogged = 0;
    this.rollSCoinForLevel();
    // Don't reset pCoinColorIndex - let it persist across sessions
    log.data("CoinManager: Full reset (game over) - all counters cleared");
  }

  // Soft reset for level transitions - preserves spawn counters
  softReset(): void {
    this.stopPowerCoinAmbientIfAny();
    this.coins = [];
    this.powerModeActive = false;
    this.powerModeEndTime = 0;
    this.activeEffects.clear();
    this.bCoinSpawnsThisLevel = 0; // BJ: B-coin per-level cap resets each map
    this.pCoinSpawnsThisLevel = 0; // BJ: P-coin per-level cap resets each map
    this.rollSCoinForLevel(); // S-coin per-level roll
    // lastScoreCheck tracks bombAndMonsterPoints (the threshold counter), which
    // already persists across levels — no sync needed. Coin pickups and bonus
    // never write to bombAndMonsterPoints, so there's no retro-trigger risk.
    // DON'T reset these - they accumulate across levels:
    // - firebombCount (for P-coin spawning)
    // - firebombPoints (for B-coin spawning)
    // - triggeredSpawnConditions (prevents duplicate spawns)
    // - lastProcessedScore, lastScoreCheck (for threshold tracking)
    log.data(
      `CoinManager: Soft reset (level transition) - preserving counters:`,
      {
        firebombCount: this.firebombCount,
        firebombPoints: this.firebombPoints,
        lastScoreCheck: this.lastScoreCheck,
      }
    );
  }

  // Update spawn points when loading a new level
  updateSpawnPoints(spawnPoints: CoinSpawnPoint[]): void {
    this.spawnPoints = spawnPoints;
    log.debug(
      `Updated coin spawn points for new level: ${spawnPoints.length} spawn points`
    );
  }

  // Clear active coins but preserve score tracking for new level
  clearActiveCoins(): void {
    this.stopPowerCoinAmbientIfAny();
    this.coins = [];
    this.powerModeActive = false;
    this.powerModeEndTime = 0;
    this.activeEffects.clear();
    // Don't clear score tracking or firebomb count - these persist across levels
    log.data(
      `CoinManager: Cleared active coins for new level, preserved spawn tracking:`,
      {
        firebombCount: this.firebombCount,
        firebombPoints: this.firebombPoints,
        lastScoreCheck: this.lastScoreCheck,
      }
    );
  }

  update(
    platforms: Platform[],
    gameState?: GameStateInterface,
    deltaTime?: number
  ): void {
    // Update coin physics based on coin type
    this.coins.forEach((coin) => {
      if (coin.isCollected) return;

      const coinConfig = COIN_TYPES[coin.type];
      if (coinConfig) {
        CoinPhysics.updateCoin(coin, platforms, coinConfig.physics, deltaTime);
      } else {
        // Fallback to legacy behavior
        if (coin.type === CoinType.POWER) {
          CoinPhysics.updatePowerCoin(coin, platforms, deltaTime);
        } else {
          CoinPhysics.updateCoin(coin, platforms, undefined, deltaTime);
        }
      }
    });

    // Check if effects should end
    this.checkEffectsEnd(gameState as unknown as Record<string, unknown>);

    // BJ B-coin spawn (driven by total score from any source).
    this.checkBcoinSpawnConditions();

    // BJ S-coin: per-level scheduled roll.
    this.checkSCoinSpawn();

    // Remove collected coins
    this.coins = this.coins.filter((coin) => !coin.isCollected);
  }

  // BJ S-coin: rolled at level start. If the roll hits, schedule a single
  // spawn during the [min, max] window after now. Reads tuning live so
  // panel changes apply on the NEXT level roll.
  private rollSCoinForLevel(): void {
    this.sCoinScheduledSpawnTime = null;
    this.sCoinSpawnedThisLevel = false;
    const chance = getTuned("S_COIN_LEVEL_CHANCE");
    if (Math.random() >= chance) return;
    const min = getTuned("S_COIN_SPAWN_MIN_DELAY_MS");
    const max = getTuned("S_COIN_SPAWN_MAX_DELAY_MS");
    this.sCoinScheduledSpawnTime = Date.now() + min + Math.random() * (max - min);
    log.coin(
      `S-coin scheduled for this level in ${Math.round(
        ((this.sCoinScheduledSpawnTime ?? 0) - Date.now()) / 1000
      )}s`
    );
  }

  private checkSCoinSpawn(): void {
    if (this.isPaused) return;
    if (this.sCoinSpawnedThisLevel) return;
    if (this.sCoinScheduledSpawnTime === null) return;
    if (Date.now() < this.sCoinScheduledSpawnTime) return;

    const tm = useStateStore.getState().tutorialMission;
    if (tm) return; // Tutorials don't spawn coins.

    // Prefer a configured SPECIAL spawn point; otherwise reuse another coin
    // type's spawn point so it lands somewhere sensible on the map.
    const sp =
      this.spawnPoints.find((p) => p.type === CoinType.SPECIAL) ??
      this.spawnPoints[Math.floor(Math.random() * this.spawnPoints.length)];

    if (sp) {
      this.spawnCoin(CoinType.SPECIAL, sp.x, sp.y, sp.spawnAngle);
    } else {
      const x = 100 + Math.random() * (GAME_CONFIG.CANVAS_WIDTH - 200);
      this.spawnCoin(CoinType.SPECIAL, x, 50);
    }

    this.sCoinSpawnedThisLevel = true;
    this.sCoinScheduledSpawnTime = null;
    log.coin("⭐ S-coin spawned (rare)");
  }

  spawnCoin(type: CoinType, x: number, y: number, spawnAngle?: number): void {
    const coinConfig = COIN_TYPES[type];

    // Check if a coin of this type already exists and respect maxActive limit
    if (coinConfig?.maxActive) {
      const existingCoins = this.coins.filter(
        (coin) => coin.type === type && !coin.isCollected
      );
      if (existingCoins.length >= coinConfig.maxActive) {
        log.debug(
          `${type} coin limit reached (${coinConfig.maxActive}), skipping spawn`
        );
        return;
      }
    } else {
      // Legacy behavior - check if any coin of this type exists
      const existingCoin = this.coins.find((coin) => coin.type === type);
      if (existingCoin) {
        log.debug(`${type} coin already exists, skipping spawn`);
        return;
      }
    }

    let initialVelocity;
    if (type === CoinType.POWER) {
      initialVelocity = CoinPhysics.createPowerCoinVelocity(spawnAngle);
    } else {
      initialVelocity = CoinPhysics.createInitialVelocity();
    }

    const coin: Coin = {
      type,
      x,
      y,
      width: GAME_CONFIG.COIN_SIZE,
      height: GAME_CONFIG.COIN_SIZE,
      velocityX: initialVelocity.velocityX,
      velocityY: initialVelocity.velocityY,
      isCollected: false,
      spawnX: x,
      spawnY: y,
    };

    // Set initial color and spawn time for P-coins
    if (type === CoinType.POWER) {
      coin.colorIndex = 0; // Start with blue (index 0)
      coin.spawnTime = Date.now();
      log.debug("Spawning P-coin with Blue color (100 points)");
      useAudioStore
        .getState()
        .audioManager?.playSound(AudioEvent.POWER_COIN_AMBIENT_START);
    }

    this.coins.push(coin);
    log.debug(
      `Spawned ${type} coin at (${x}, ${y}) with angle ${
        spawnAngle || "random"
      }`
    );
  }

  onFirebombCollected(): void {
    this.onBombCollected(true);
  }

  // BJ P-coin token rule: firebomb=2, normal=1, threshold=18 (so 9 firebombs
  // alone = 1 P-coin). Tokens don't accrue while a P-coin is already on
  // screen — see tokensAddedOnBomb in bjRules.ts.
  onBombCollected(isFirebomb: boolean): void {
    if (isFirebomb) this.firebombCount++;

    const hasLivePcoin = this.coins.some(
      (c) => c.type === CoinType.POWER && !c.isCollected
    );
    this.pCoinTokens += tokensAddedOnBomb(isFirebomb, hasLivePcoin);

    log.coin(
      `${isFirebomb ? "Firebomb" : "Normal bomb"} collected. firebombCount=${this.firebombCount} pCoinTokens=${this.pCoinTokens} (Pcoin alive: ${hasLivePcoin})`
    );

    this.checkPcoinSpawnConditions();
  }

  // Track points from bombs and monsters (excluding bonus points)
  onPointsEarned(points: number, isBonus: boolean = false): void {
    if (!isBonus) {
      const previousPoints = this.bombAndMonsterPoints;
      this.bombAndMonsterPoints += points;

      log.data(
        "CoinSpawn: Bomb/Monster points earned (WILL count for B-coin)",
        {
          pointsEarned: points,
          previousTotal: previousPoints,
          newTotal: this.bombAndMonsterPoints,
          coinPoints: this.coinPoints,
          note: "These points WILL count toward B-coin spawning - all points count except end-of-map bonus",
        }
      );

      // Check B-coin spawn conditions since these points count
      this.checkBcoinSpawnConditions();
    } else {
      log.data("CoinSpawn: Bonus points earned (not counted for B-coin)", {
        points,
      });
    }
  }

  // Track points from coin collection (also triggers B-coin checks)
  onCoinPointsEarned(points: number): void {
    const previousPoints = this.coinPoints;
    this.coinPoints += points;

    log.data("CoinSpawn: Coin points earned (for statistics only)", {
      pointsEarned: points,
      previousCoinPoints: previousPoints,
      newCoinPoints: this.coinPoints,
      note: "These points are for statistics only, not used for B-coin spawning",
    });
  }

  // Track points from firebomb collection (kept for stats; B-coin no longer
  // gated on firebomb-only points — see checkBcoinSpawnConditions, which uses
  // total score and runs each frame).
  onFirebombPointsEarned(points: number): void {
    this.firebombPoints += points;
    // Trigger B-coin check immediately so bomb collection has zero-frame latency.
    this.checkBcoinSpawnConditions();
  }

  // BJ B-coin: every 5,000 of *thresholdable* score (bombs + monster kills +
  // trampoline) — coin pickups and end-of-level bonus do NOT count, per the
  // arcade rule "5,000 points crossed cleanly without B-coin contribution"
  // (see bjRules.isThresholdablePointSource). Missed thresholds are "lost"
  // (not queued) when a B is already on screen; per-level cap of 5 spawns.
  private checkBcoinSpawnConditions(): void {
    const coinConfig = COIN_TYPES.BONUS_MULTIPLIER;
    if (!coinConfig) return;

    const points = this.bombAndMonsterPoints;
    const milestones = bCoinMilestonesCrossed(this.lastScoreCheck, points);

    if (milestones.length === 0) {
      this.lastScoreCheck = points;
      return;
    }

    for (const m of milestones) {
      const spawnKey = `${coinConfig.type}_${m}`;
      if (this.triggeredSpawnConditions.has(spawnKey)) continue;

      // Mark milestone consumed regardless of spawn outcome — BJ "lost" semantics.
      this.triggeredSpawnConditions.add(spawnKey);

      const bCap = getTuned("BONUS_COIN_MAX_PER_LEVEL");
      if (this.bCoinSpawnsThisLevel >= bCap) {
        log.coin(`B-coin per-level cap (${bCap}) reached at score ${m}; threshold lost`);
        continue;
      }

      const hasLiveBcoin = this.coins.some(
        (c) => c.type === CoinType.BONUS_MULTIPLIER && !c.isCollected
      );
      if (hasLiveBcoin) {
        log.coin(`B-coin already on screen at score ${m}; threshold lost (BJ rule)`);
        continue;
      }

      const spawnPoints = this.spawnPoints.filter(
        (p) => p.type === coinConfig.type
      );
      if (spawnPoints.length > 0) {
        const sp = spawnPoints[Math.floor(Math.random() * spawnPoints.length)];
        this.spawnCoin(coinConfig.type as CoinType, sp.x, sp.y, sp.spawnAngle);
        this.bCoinSpawnsThisLevel++;
        log.coin(`🎆 B-coin spawned at score milestone ${m} (level spawn ${this.bCoinSpawnsThisLevel}/${bCap})`);
      } else {
        log.warn(`No spawn points found for B-coin at milestone ${m}`);
      }
    }

    this.lastScoreCheck = points;
  }

  // BJ P-coin: spawn when token counter reaches threshold. Spawn count and
  // remainder come from pCoinSpawnsAt (pure helper, tested in bjRules.test).
  private checkPcoinSpawnConditions(): void {
    // Tutorials don't spawn coins.
    const tm = useStateStore.getState().tutorialMission;
    if (tm === "bombs" || tm === "survive" || tm === "movements") return;

    const decision = pCoinSpawnsAt(this.pCoinTokens);
    if (decision.spawns === 0) return;

    const coinConfig = COIN_TYPES[CoinType.POWER];
    if (!coinConfig) return;

    // BJ: max P-coin spawns per level (game-specs §7.1) — live-tunable.
    const pCap = getTuned("POWER_COIN_MAX_PER_LEVEL");
    if (this.pCoinSpawnsThisLevel >= pCap) {
      log.coin(
        `P-coin per-level cap (${pCap}) reached; tokens stay parked`
      );
      return;
    }

    // Only one P-coin alive at a time (token accrual is paused upstream).
    const hasLive = this.coins.some(
      (c) => c.type === CoinType.POWER && !c.isCollected
    );
    if (hasLive) return;

    // Spawn ONE P-coin even if `decision.spawns > 1`. maxActive = 1, so the
    // surplus stays as remainder for after collection.
    const tokenInterval = getTuned("POWER_COIN_SPAWN_INTERVAL");
    this.pCoinTokens =
      decision.remainingTokens +
      (decision.spawns - 1) * tokenInterval;

    const spawnPoints = this.spawnPoints.filter(
      (p) => p.type === coinConfig.type
    );
    if (spawnPoints.length > 0) {
      const sp = spawnPoints[Math.floor(Math.random() * spawnPoints.length)];
      this.spawnCoin(coinConfig.type as CoinType, sp.x, sp.y, sp.spawnAngle);
    } else {
      const spawnX = 400 + (Math.random() - 0.5) * 200;
      const spawnY = 100 + Math.random() * 100;
      this.spawnCoin(coinConfig.type as CoinType, spawnX, spawnY);
    }
    this.pCoinSpawnsThisLevel++;

    log.coin(
      `🟦 P-coin spawned (level spawn ${this.pCoinSpawnsThisLevel}/${pCap}, tokens after spawn=${this.pCoinTokens})`
    );
  }

  // Check spawn conditions for other types (score-based, time-based, etc.)
  // Note: Logging is optimized to only show when state changes or when near thresholds
  // to avoid spam during continuous gameplay
  checkSpawnConditions(gameState: Record<string, unknown>): void {
    Object.values(COIN_TYPES).forEach((coinConfig) => {
      // Skip firebomb-based spawns as they're handled separately
      if (
        coinConfig.spawnCondition &&
        !coinConfig.spawnCondition.toString().includes("firebombCount") &&
        coinConfig.type !== "POWER"
      ) {
        // Get the latest coin collection count from coinStore
        const coinStore = useCoinStore.getState();
        const stateStore = useStateStore.getState();
        const combinedState = {
          ...gameState,
          firebombCount: this.firebombCount,
          bombAndMonsterPoints: this.bombAndMonsterPoints,
          coinPoints: this.coinPoints,
          firebombPoints: this.firebombPoints,
          totalBonusMultiplierCoinsCollected: coinStore.totalBonusMultiplierCoinsCollected || 0,
          livesLostThisGame: stateStore.livesLostThisGame || 0,
        };

        // Only log when there are actual state changes for B-coin
        if (coinConfig.type === "BONUS_MULTIPLIER") {
          const currentThreshold =
            Math.floor(
              this.firebombPoints / GAME_CONFIG.BONUS_COIN_SPAWN_INTERVAL
            ) * GAME_CONFIG.BONUS_COIN_SPAWN_INTERVAL;
          const lastThreshold =
            Math.floor(
              this.lastScoreCheck / GAME_CONFIG.BONUS_COIN_SPAWN_INTERVAL
            ) * GAME_CONFIG.BONUS_COIN_SPAWN_INTERVAL;

          // Only log if threshold changed or we're close to a threshold
          if (
            currentThreshold !== lastThreshold ||
            this.firebombPoints % GAME_CONFIG.BONUS_COIN_SPAWN_INTERVAL < 100
          ) {
            // Log when within 100 points of threshold
            // Use throttled logging to avoid spam when near threshold
            const logKey = `bcoin_threshold_${currentThreshold}`;
            const logMessage = "CoinSpawn: B-coin spawn condition check";
            const logData = {
              firebombPoints: this.firebombPoints,
              lastScoreCheck: this.lastScoreCheck,
              currentThreshold,
              lastThreshold,
              spawnInterval: GAME_CONFIG.BONUS_COIN_SPAWN_INTERVAL,
              thresholdChanged: currentThreshold !== lastThreshold,
              nearThreshold:
                this.firebombPoints % GAME_CONFIG.BONUS_COIN_SPAWN_INTERVAL <
                100,
            };

            if (currentThreshold !== lastThreshold) {
              // Log immediately for threshold changes
              log.data(logMessage, logData);
            } else {
              // Use throttled logging for near-threshold updates (every 2 seconds)
              logger.throttled(
                LogCategory.DATA,
                logKey,
                logMessage,
                2000,
                logData
              );
            }
          }
        }

        // Only log when there are actual state changes for EXTRA_LIFE coin
        if (coinConfig.type === "EXTRA_LIFE") {
          // Read from coinStore directly to get the most up-to-date value
          const coinStore = useCoinStore.getState();
          const bonusCount = coinStore.totalBonusMultiplierCoinsCollected || 0;
          const nextMCoinAt =
            Math.ceil(bonusCount / GAME_CONFIG.EXTRA_LIFE_COIN_RATIO) *
            GAME_CONFIG.EXTRA_LIFE_COIN_RATIO;
          const bcoinsNeeded =
            bonusCount === 0
              ? GAME_CONFIG.EXTRA_LIFE_COIN_RATIO
              : nextMCoinAt - bonusCount;

          // Only log if bonus count changed or we're close to a threshold
          const lastBonusCount = this.lastBonusCountLogged || 0;
          if (
            bonusCount !== lastBonusCount ||
            (bonusCount > 0 &&
              bonusCount % GAME_CONFIG.EXTRA_LIFE_COIN_RATIO === 0)
          ) {
            // Use throttled logging to avoid spam for repeated checks
            const logKey = `mcoin_bonus_${bonusCount}`;
            const logMessage = "CoinSpawn: M-coin spawn condition check";
            const logData = {
              totalBonusMultiplierCoinsCollected: bonusCount,
              ratio: GAME_CONFIG.EXTRA_LIFE_COIN_RATIO,
              nextMCoinAt: nextMCoinAt || GAME_CONFIG.EXTRA_LIFE_COIN_RATIO,
              bcoinsNeeded,
              willSpawn:
                bonusCount > 0 &&
                bonusCount % GAME_CONFIG.EXTRA_LIFE_COIN_RATIO === 0,
              reason:
                bonusCount === 0
                  ? "No B-coins collected yet"
                  : bonusCount % GAME_CONFIG.EXTRA_LIFE_COIN_RATIO === 0
                  ? "Threshold reached!"
                  : `Need ${bcoinsNeeded} more B-coin${
                      bcoinsNeeded === 1 ? "" : "s"
                    }`,
              stateChanged: bonusCount !== lastBonusCount,
            };

            if (bonusCount !== lastBonusCount) {
              // Log immediately for state changes
              log.data(logMessage, logData);
            } else {
              // Use throttled logging for threshold checks (every 3 seconds)
              logger.throttled(
                LogCategory.DATA,
                logKey,
                logMessage,
                3000,
                logData
              );
            }
            this.lastBonusCountLogged = bonusCount;
          }
        }

        if (
          coinConfig.spawnCondition(
            combinedState as unknown as GameStateInterface
          )
        ) {
          // Spawn condition met - proceed with spawning logic

          // Create a unique key for this spawn condition based on the current state
          let spawnKey = `${coinConfig.type}`;

          // B-coin spawning is fully handled by checkBcoinSpawnConditions()
          // (called from update() each frame). Skip it here to avoid duplicate
          // spawn paths competing on lastScoreCheck.
          if (coinConfig.type === "BONUS_MULTIPLIER") return;

          // E-coin (EXTRA_LIFE) — milestone-based spawn with death-generosity
          // (effective = bCoins + 2 × livesLost). Milestone math is in
          // bjRules.mCoinSpawnDecision (pure, tested).
          if (
            coinConfig.spawnCondition &&
            coinConfig.spawnCondition
              .toString()
              .includes("totalBonusMultiplierCoinsCollected")
          ) {
            const coinStore = useCoinStore.getState();
            const stateStore = useStateStore.getState();
            const bonusCount = coinStore.totalBonusMultiplierCoinsCollected || 0;
            const livesLost = stateStore.livesLostThisGame || 0;
            const triggeredMilestones = new Set<number>();
            for (const key of this.triggeredSpawnConditions) {
              if (key.startsWith(`${coinConfig.type}_`)) {
                const n = Number(key.slice(coinConfig.type.length + 1));
                if (!Number.isNaN(n)) triggeredMilestones.add(n);
              }
            }
            const decision = mCoinSpawnDecision(
              bonusCount,
              livesLost,
              triggeredMilestones
            );
            if (!decision) return;

            spawnKey = `${coinConfig.type}_${decision.milestone}`;
            log.coin(
              `M-coin spawn condition met! (bonusCount: ${bonusCount}, livesLost: ${livesLost}, milestone: ${decision.milestone})`
            );
          }

          // Check if we've already triggered this spawn condition
          if (this.triggeredSpawnConditions.has(spawnKey)) {
            return; // Already triggered this spawn condition
          }

          log.debug(
            `Spawn condition met for ${coinConfig.type} coin (key: ${spawnKey})`
          );

          // Mark this spawn condition as triggered
          this.triggeredSpawnConditions.add(spawnKey);

          // Find spawn point for this coin type
          const spawnPoints = this.spawnPoints.filter(
            (point) => point.type === coinConfig.type
          );

          if (spawnPoints.length > 0) {
            const spawnPoint =
              spawnPoints[Math.floor(Math.random() * spawnPoints.length)];
            this.spawnCoin(
              coinConfig.type as CoinType,
              spawnPoint.x,
              spawnPoint.y,
              spawnPoint.spawnAngle
            );
          } else {
            // Fallback spawn position - spawn from top for gravity coins
            const spawnX = 400 + (Math.random() - 0.5) * 200;
            let spawnY = 50; // Start from top of screen
            // For gravity-only coins, spawn from top
            if (
              coinConfig.physics.hasGravity &&
              !coinConfig.physics.bounces &&
              !coinConfig.physics.reflects
            ) {
              spawnY = 50; // Top of screen
            } else {
              spawnY = 100 + Math.random() * 100; // Random position for other coins
            }
            this.spawnCoin(coinConfig.type as CoinType, spawnX, spawnY);
          }
        } else {
          // Additional debug logging only for coins that weren't already logged
          if (coinConfig.type === "EXTRA_LIFE") {
            // Already logged in the check above, no need to duplicate
          }
        }
      }
    });
  }

  collectCoin(coin: Coin, gameState?: Record<string, unknown>): void {
    coin.isCollected = true;
    log.debug(`Collected ${coin.type} coin`);

    if (coin.type === CoinType.POWER) {
      useAudioStore
        .getState()
        .audioManager?.playSound(AudioEvent.POWER_COIN_AMBIENT_STOP);
    }

    const coinConfig = COIN_TYPES[coin.type];
    if (coinConfig && gameState) {
      log.debug(
        `Processing ${coin.type} coin with ${coinConfig.effects.length} effects`
      );

      // Calculate points earned from this coin
      let pointsEarned = coinConfig.points;

      // Special handling for P-coin - points based on current color
      if (coin.type === CoinType.POWER) {
        const spawnTime = coin.spawnTime || Date.now();
        const colorData = this.getPcoinColorForTime(spawnTime);
        const currentMultiplier = (gameState.multiplier as number) || 1;
        pointsEarned = colorData.points * currentMultiplier;

        log.debug(
          `P-coin collected: ${colorData.name} color, ${colorData.points} × ${currentMultiplier} = ${pointsEarned} points`
        );
        log.data("CoinSpawn: P-coin collected", {
          colorName: colorData.name,
          basePoints: colorData.points,
          multiplier: currentMultiplier,
          totalPoints: pointsEarned,
          coinPointsBefore: this.coinPoints,
          coinPointsAfter: this.coinPoints + pointsEarned,
        });
      }
      // Special handling for B-coin (Bonus Multiplier) - points = 1000 * current multiplier
      else if (coin.type === CoinType.BONUS_MULTIPLIER) {
        const currentMultiplier = (gameState.multiplier as number) || 1;
        pointsEarned = 1000 * currentMultiplier;
        log.coin(
          `💰 B-coin collected! Points: ${pointsEarned} (1000 × ${currentMultiplier})`
        );
        log.data("CoinSpawn: B-coin collected", {
          basePoints: 1000,
          multiplier: currentMultiplier,
          totalPoints: pointsEarned,
          coinPointsBefore: this.coinPoints,
          coinPointsAfter: this.coinPoints + pointsEarned,
        });
      }
      // Special handling for E-coin (Extra Life) - add extra life and award points
      else if (coin.type === CoinType.EXTRA_LIFE) {
        const currentMultiplier = (gameState.multiplier as number) || 1;
        pointsEarned = coinConfig.points * currentMultiplier;
        log.coin(`❤️ E-coin (Extra Life) collected! Points: ${pointsEarned}`);
        log.data("CoinSpawn: E-coin collected", {
          basePoints: coinConfig.points,
          multiplier: currentMultiplier,
          totalPoints: pointsEarned,
          coinPointsBefore: this.coinPoints,
          coinPointsAfter: this.coinPoints + pointsEarned,
        });
      }

      // Track coin points for statistics only (B-coin and E-coin points don't count toward B-coin spawning)
      // Only firebomb collection points should trigger B-coin spawning
      log.data("CoinSpawn: Tracking coin points", {
        coinType: coin.type,
        pointsEarned: pointsEarned,
        currentCoinPoints: this.coinPoints,
        newCoinPoints: this.coinPoints + pointsEarned,
        note: "Special coin points are for statistics only, not for B-coin spawning",
      });
      this.onCoinPointsEarned(pointsEarned);

      // Show floating text for points earned
      if (
        "addFloatingText" in gameState &&
        typeof gameState.addFloatingText === "function"
      ) {
        const text = pointsEarned.toString();
        (
          gameState.addFloatingText as (
            text: string,
            x: number,
            y: number,
            duration: number,
            color: string,
            fontSize: number
          ) => void
        )(
          text,
          coin.x + coin.width / 2,
          coin.y + coin.height / 2,
          1000, // duration
          "#fff",
          15 // fontSize
        );
      }

      // Apply all effects for this coin type
      coinConfig.effects.forEach((effect) => {
        // Create a proper GameStateInterface object with coinManager and activeEffects
        const gameStateWithManager: GameStateInterface = {
          ...(gameState as any),
          // Ensure required properties are present
          player: (gameState as any).player || {
            x: 0,
            y: 0,
            width: 0,
            height: 0,
            velocityX: 0,
            velocityY: 0,
          },
          currentState: (gameState as any).currentState || "PLAYING",
          currentLevel: (gameState as any).currentLevel || 1,
          score: (gameState as any).score || 0,
          lives: (gameState as any).lives || 3,
          monsters: (gameState as any).monsters || [],
          multiplier: (gameState as any).multiplier || 1,
          multiplierScore: (gameState as any).multiplierScore || 0,
          bombs: (gameState as any).bombs || [],
          coins: (gameState as any).coins || [],
          platforms: (gameState as any).platforms || [],
          firebombCount: (gameState as any).firebombCount || 0,
          totalCoinsCollected: (gameState as any).totalCoinsCollected || 0,
          totalPowerCoinsCollected:
            (gameState as any).totalPowerCoinsCollected || 0,
          totalBonusMultiplierCoinsCollected:
            (gameState as any).totalBonusMultiplierCoinsCollected || 0,
          activeEffects: {
            powerMode: false,
            powerModeEndTime: 0,
            ...(gameState as any).activeEffects,
          },
          coinManager: {
            resetMonsterKillCount: () => this.resetMonsterKillCount(),
            getPcoinColorForTime: (spawnTime: number) =>
              this.getPcoinColorForTime(spawnTime),
            getPowerModeEndTime: () => this.getPowerModeEndTime(),
          },
          difficultyManager: {
            pause: () => {
              // Access the global scaling manager instance
              const scalingManager = ScalingManager.getInstance();
              scalingManager.pause();
              log.debug("Difficulty scaling paused (power mode active)");
            },
            resume: () => {
              // Access the global scaling manager instance
              const scalingManager = ScalingManager.getInstance();
              scalingManager.resume();
              log.debug("Difficulty scaling resumed (power mode ended)");
            },
          },
          // Ensure audioManager is included from the original gameState
          audioManager: (gameState as any).audioManager,
          // Add the missing methods
          addScore: (points: number) => {
            const scoreStore = useScoreStore.getState();
            scoreStore.addScore(points);
          },
          setMultiplier: (multiplier: number, score: number) => {
            const scoreStore = useScoreStore.getState();
            scoreStore.setMultiplier(multiplier, score);
          },
        };

        log.debug(
          `GameStateWithManager created, audioManager:`,
          (gameStateWithManager as any).audioManager
        );
        log.debug(
          `GameStateWithManager keys:`,
          Object.keys(gameStateWithManager)
        );
        // Apply the effect first
        log.debug(`Applying effect: ${effect.type}`);
        effect.apply(gameStateWithManager, coin);
        log.debug(`Effect ${effect.type} applied successfully`);

        // Track timed effects - for POWER_MODE, get the duration from the activeEffects
        if (effect.type === "POWER_MODE") {
          // POWER_MODE effect calculates its own duration, so get it from the updated gameState
          const powerModeEndTime = (gameStateWithManager as any).activeEffects
            .powerModeEndTime;
          if (powerModeEndTime > 0) {
            this.activeEffects.set(effect.type, {
              endTime: powerModeEndTime,
              effect,
            });

            // Also update the coin manager's internal power mode state
            this.powerModeActive = true;
            this.powerModeEndTime = powerModeEndTime;

            log.debug(
              `POWER_MODE effect tracked with endTime: ${powerModeEndTime}, internal state updated`
            );
            log.debug(
              `Current time: ${Date.now()}, Effect will end at: ${powerModeEndTime}, Duration: ${
                powerModeEndTime - Date.now()
              }ms`
            );
          } else {
            log.warn("POWER_MODE effect applied but no endTime found");
          }
        } else if (effect.duration) {
          // For other effects with static durations
          this.activeEffects.set(effect.type, {
            endTime: Date.now() + effect.duration,
            effect,
          });
        }
      });
    } else {
      // Legacy behavior - just use the old system for now
      // Only warn if it's not a known coin type (to avoid spam)
      if (
        coin.type !== CoinType.POWER &&
        coin.type !== CoinType.BONUS_MULTIPLIER &&
        coin.type !== CoinType.EXTRA_LIFE
      ) {
        log.warn(`Unknown coin type: ${coin.type}, using legacy behavior`);
      }
      if (coin.type === CoinType.POWER) {
        this.activatePowerMode();
      }
    }
  }

  private checkEffectsEnd(gameState?: Record<string, unknown>): void {
    // Don't check effects while paused
    if (this.isPaused) {
      return;
    }

    const currentTime = Date.now();
    const effectsToRemove: string[] = [];

    log.debug(
      `checkEffectsEnd called at ${currentTime}, checking ${this.activeEffects.size} active effects`
    );

    this.activeEffects.forEach((effectData, effectType) => {
      const timeLeft = effectData.endTime - currentTime;
      log.debug(
        `Checking effect: ${effectType}, endTime: ${
          effectData.endTime
        }, currentTime: ${currentTime}, timeLeft: ${timeLeft}ms, shouldEnd: ${
          timeLeft <= 0
        }`
      );

      // Add a minimum duration safeguard to prevent effects from being removed too quickly
      const minimumDuration = 100; // 100ms minimum
      const shouldEnd = timeLeft <= -minimumDuration; // Allow some buffer time

      if (shouldEnd) {
        effectsToRemove.push(effectType);
        log.debug(`Effect ${effectType} marked for removal`);

        if (effectData.effect.remove && gameState) {
          log.debug(`Removing effect: ${effectType}`);

          // Create a proper GameStateInterface for the remove function
          const gameStateWithManager: GameStateInterface = {
            ...(gameState as any),
            activeEffects: {
              powerMode: false,
              powerModeEndTime: 0,
              ...(gameState as any).activeEffects,
            },
            coinManager: {
              resetMonsterKillCount: () => this.resetMonsterKillCount(),
              getPcoinColorForTime: (spawnTime: number) =>
                this.getPcoinColorForTime(spawnTime),
              getPowerModeEndTime: () => this.getPowerModeEndTime(),
            },
            difficultyManager: {
              pause: () => {
                const scalingManager = ScalingManager.getInstance();
                scalingManager.pause();
                log.debug("Difficulty scaling paused (power mode active)");
              },
              resume: () => {
                const scalingManager = ScalingManager.getInstance();
                scalingManager.resumeFromPowerMode();
                log.debug("Difficulty scaling resumed (power mode ended)");
              },
            },
          };

          try {
            effectData.effect.remove(gameStateWithManager);
            log.debug(`Effect ${effectType} removed successfully`);
          } catch (error) {
            log.error(`Error removing effect ${effectType}:`, error);
          }
        }
      }
    });

    if (effectsToRemove.length > 0) {
      log.debug(
        `Removing ${effectsToRemove.length} effects: ${effectsToRemove.join(
          ", "
        )}`
      );
    }

    effectsToRemove.forEach((effectType) => {
      this.activeEffects.delete(effectType);

      // Handle legacy power mode state when POWER_MODE effect is removed
      if (effectType === "POWER_MODE") {
        this.powerModeActive = false;
        this.powerModeEndTime = 0;
        log.debug("Power mode deactivated, internal state updated");
        // Note: Difficulty scaling resume is handled by the effect's remove function
      }
    });
  }

  // BJ kill escalation 100/200/300/500/800/1200/2000 (caps at 2000) ×
  // multiplier. Table lives in bjRules.monsterKillBasePoints (tested).
  calculateMonsterKillPoints(multiplier: number): number {
    this.monsterKillCount++;
    const basePoints = monsterKillBasePoints(this.monsterKillCount);
    const totalPoints = basePoints * multiplier;
    log.debug(
      `Monster kill #${this.monsterKillCount}: ${basePoints} × ${multiplier} = ${totalPoints} points`
    );
    return totalPoints;
  }

  // BJ P-coin color is advanced by player actions (jump / wall-hit / fall-off),
  // not time. The live coin's colorIndex is the source of truth.
  // Signature kept compatible with existing callers passing coin.spawnTime.
  getPcoinColorForTime(spawnTime: number): {
    color: string;
    points: number;
    name: string;
    index: number;
    duration: number;
  } {
    const live = this.coins.find(
      (c) => c.type === CoinType.POWER && c.spawnTime === spawnTime
    );
    const idx = Math.min(
      Math.max(live?.colorIndex ?? 0, 0),
      P_COIN_COLORS.length - 1
    );
    const colorData = P_COIN_COLORS[idx];
    return { ...colorData, index: idx };
  }

  // Advance the color of every live P-coin by one tier (caps at gray).
  // Called by PlayerManager on jump-start, wall-hit, and fall-off-platform.
  advanceLivePcoinColors(): void {
    let advanced = 0;
    for (const coin of this.coins) {
      if (coin.type !== CoinType.POWER || coin.isCollected) continue;
      const current = coin.colorIndex ?? 0;
      const next = Math.min(current + 1, P_COIN_COLORS.length - 1);
      if (next !== current) {
        coin.colorIndex = next;
        advanced++;
      }
    }
    if (advanced > 0) {
      log.debug(`P-coin color advanced for ${advanced} live coin(s)`);
    }
  }

  // Get current P-coin color and points (legacy method)
  getCurrentPcoinColor(): { color: string; points: number; name: string } {
    const colorData = P_COIN_COLORS[this.pCoinColorIndex];
    return colorData;
  }

  // Get current color for a specific P-coin
  getPcoinCurrentColor(coin: Coin): string {
    if (coin.type === CoinType.POWER && coin.spawnTime !== undefined) {
      const colorData = this.getPcoinColorForTime(coin.spawnTime);
      return colorData.color;
    }
    return P_COIN_COLORS[0].color; // Default to blue
  }

  // Advance P-coin color to next in sequence (legacy method)
  advancePcoinColor(): void {
    this.pCoinColorIndex = (this.pCoinColorIndex + 1) % P_COIN_COLORS.length;
    const newColor = this.getCurrentPcoinColor();
    log.debug(
      `P-coin color advanced to: ${newColor.name} (${newColor.points} points)`
    );
  }

  // Reset monster kill count when power mode starts
  resetMonsterKillCount(): void {
    this.monsterKillCount = 0;
    log.debug("Monster kill count reset for new power mode session");
  }

  isPowerModeActive(): boolean {
    // Check if POWER_MODE effect is active
    const powerModeEffect = this.activeEffects.get("POWER_MODE");
    if (powerModeEffect) {
      const isActive = Date.now() < powerModeEffect.endTime;
      if (!isActive) {
        // Effect has expired, remove it
        this.activeEffects.delete("POWER_MODE");
        this.powerModeActive = false;
      }
      return isActive;
    }
    return this.powerModeActive; // Fallback to legacy property
  }

  getCoins(): Coin[] {
    return this.coins.filter((coin) => !coin.isCollected);
  }

  getFirebombCount(): number {
    return this.firebombCount;
  }

  // Reset firebomb count when player dies (loses a life)
  resetFirebombCount(): void {
    const previousCount = this.firebombCount;
    this.firebombCount = 0;
    
    log.coin(`Firebomb count reset after player death: ${previousCount} → 0`);
    log.data("CoinSpawn: Firebomb count reset", {
      previousCount,
      newCount: 0,
      reason: "Player lost a life",
      note: "Player must collect 9 correct bombs again for P-coin spawn"
    });
  }

  getAllCoins(): Coin[] {
    return [...this.coins];
  }

  getBombAndMonsterPoints(): number {
    return this.bombAndMonsterPoints;
  }

  getFirebombPoints(): number {
    return this.firebombPoints;
  }

  updateMonsters(monsters: Monster[]): void {
    // Check both new effect system and legacy system
    const isPowerModeActive = this.isPowerModeActive() || this.powerModeActive;

    if (isPowerModeActive) {
      // Calculate remaining time from either system
      let timeLeft = 0;

      // Check new effect system first
      const powerModeEffect = this.activeEffects.get("POWER_MODE");
      if (powerModeEffect) {
        timeLeft = powerModeEffect.endTime - Date.now();
      } else {
        // Fall back to legacy system
        timeLeft = this.powerModeEndTime - Date.now();
      }

      const shouldBlink = timeLeft <= 2000 && timeLeft > 0; // Blink when 2 seconds or less remaining

      monsters.forEach((monster) => {
        monster.isFrozen = true;
        monster.isBlinking = shouldBlink;
      });
    } else {
      const now = Date.now();
      const passthrough = getTuned("MUTATION_PASSTHROUGH_MS");
      monsters.forEach((monster) => {
        if (monster.isFrozen) {
          // BJ mutation pass-through: safe window after unfreezing (tunable).
          monster.mutationEndTime = now + passthrough;
        }
        monster.isFrozen = false;
        monster.isBlinking = false;
      });
    }
  }

  unfreezeAllMonsters(monsters: Monster[]): void {
    const now = Date.now();
    const passthrough = getTuned("MUTATION_PASSTHROUGH_MS");
    monsters.forEach((monster) => {
      if (monster.isFrozen) {
        monster.mutationEndTime = now + passthrough;
      }
      monster.isFrozen = false;
      monster.isBlinking = false;
    });
  }

  // Pause and resume methods for proper effect duration handling
  pause(): void {
    if (this.isPaused) return;

    this.isPaused = true;
    this.pauseStartTime = Date.now();

    // Store remaining duration for all active effects
    this.activeEffects.forEach((effectData, effectType) => {
      const remainingTime = effectData.endTime - Date.now();
      if (remainingTime > 0) {
        effectData.remainingDuration = remainingTime;
        log.debug(
          `Pausing effect ${effectType} with ${remainingTime}ms remaining`
        );
      }
    });

    // Also handle legacy powerModeEndTime
    if (this.powerModeActive && this.powerModeEndTime > Date.now()) {
      const remainingTime = this.powerModeEndTime - Date.now();
      log.debug(`Pausing legacy power mode with ${remainingTime}ms remaining`);
    }
  }

  resume(): void {
    if (!this.isPaused) return;

    this.isPaused = false;
    const pauseDuration = Date.now() - this.pauseStartTime;

    // Restore end times for all active effects
    this.activeEffects.forEach((effectData, effectType) => {
      if (
        effectData.remainingDuration !== undefined &&
        effectData.remainingDuration > 0
      ) {
        effectData.endTime = Date.now() + effectData.remainingDuration;
        log.debug(
          `Resuming effect ${effectType} with ${effectData.remainingDuration}ms remaining, new endTime: ${effectData.endTime}`
        );

        // Restart power-up melody if it's the POWER_MODE effect
        if (effectType === "POWER_MODE" && effectData.remainingDuration > 0) {
          // Get the audioManager from audioStore
          const audioStore = useAudioStore.getState();
          if (
            audioStore?.audioManager &&
            typeof audioStore.audioManager.startPowerUpMelodyWithDuration ===
              "function"
          ) {
            log.debug(
              `Restarting PowerUp melody with ${effectData.remainingDuration}ms remaining`
            );
            audioStore.audioManager.startPowerUpMelodyWithDuration(
              effectData.remainingDuration
            );
          }
        }

        effectData.remainingDuration = undefined; // Clear the remaining duration
      }
    });

    // Also update legacy powerModeEndTime if it was active
    if (this.powerModeActive && this.powerModeEndTime > 0) {
      // Only adjust if the power mode hasn't expired during pause
      const originalRemainingTime = this.powerModeEndTime - this.pauseStartTime;
      if (originalRemainingTime > 0) {
        this.powerModeEndTime = Date.now() + originalRemainingTime;
        log.debug(
          `Resuming legacy power mode, new endTime: ${this.powerModeEndTime}`
        );
      }
    }

    this.pauseStartTime = 0;
  }

  resetEffects(): void {
    // Stop power-up melody if active when resetting effects
    if (this.powerModeActive) {
      log.debug(
        "Resetting effects while power mode is active, this should stop PowerUp melody"
      );
    }

    this.powerModeActive = false;
    this.powerModeEndTime = 0;
    this.firebombCount = 0;
    this.coins = [];
    this.activeEffects.clear();
    this.bombAndMonsterPoints = 0;
    this.monsterKillCount = 0;
    // Clear spawn-condition keys alongside firebombCount; otherwise level 2's
    // bomb #9 hits the already-triggered "POWER_9" key from level 1 and the
    // P-coin never spawns again. Same for lastProcessedScore (B-coin keys).
    this.triggeredSpawnConditions.clear();
    this.lastProcessedScore = 0;
    log.debug("Coin effects reset");
  }

  // Method to force stop power mode and melody (for game state changes)
  forceStopPowerMode(): void {
    if (this.powerModeActive) {
      log.debug("Force stopping power mode");
      this.powerModeActive = false;
      this.powerModeEndTime = 0;
      this.activeEffects.delete("POWER_MODE");

      // Resume difficulty scaling
      try {
        const scalingManager = ScalingManager.getInstance();
        scalingManager.resumeFromPowerMode();
        log.debug("Difficulty scaling resumed after force stop");
      } catch (error) {
        log.debug(
          "Could not resume difficulty scaling (ScalingManager not available)"
        );
      }
    }
  }

  // New method to get coin configuration
  getCoinConfig(type: string): CoinTypeConfig | undefined {
    return COIN_TYPES[type];
  }

  // New method to check if an effect is active
  isEffectActive(effectType: string): boolean {
    return this.activeEffects.has(effectType);
  }

  // Get power mode end time
  getPowerModeEndTime(): number {
    const powerModeEffect = this.activeEffects.get("POWER_MODE");
    return powerModeEffect ? powerModeEffect.endTime : 0;
  }

  // Legacy method with dynamic duration
  private activatePowerMode(): void {
    this.powerModeActive = true;

    // Get duration based on current P-coin color (if we have a recent P-coin)
    let duration: number = GAME_CONFIG.POWER_COIN_DURATION; // Default fallback

    // Find the most recent P-coin to get its color
    const recentPcoin = this.coins.find(
      (coin) => coin.type === CoinType.POWER && coin.spawnTime
    );
    if (recentPcoin && recentPcoin.spawnTime) {
      const colorData = this.getPcoinColorForTime(recentPcoin.spawnTime);
      duration = colorData.duration || GAME_CONFIG.POWER_COIN_DURATION;
    }

    this.powerModeEndTime = Date.now() + duration;
    this.resetMonsterKillCount();

    // Also add to activeEffects Map so checkEffectsEnd can handle it properly
    this.activeEffects.set("POWER_MODE", {
      endTime: this.powerModeEndTime,
      effect: COIN_EFFECTS.POWER_MODE,
    });

    log.debug(
      `Power mode timing - duration: ${duration}ms, endTime: ${
        this.powerModeEndTime
      }, currentTime: ${Date.now()}`
    );

    // Pause difficulty scaling during power mode
    try {
      const scalingManager = ScalingManager.getInstance();
      scalingManager.pauseForPowerMode();
      log.debug("Difficulty scaling paused (power mode active)");
    } catch (error) {
      log.debug(
        "Could not pause difficulty scaling (ScalingManager not available)"
      );
    }

    log.debug(`Power mode activated for ${duration}ms (${duration / 1000}s)`);
  }
}
