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
import { COIN_TYPES, P_COIN_COLORS } from "../config/coinTypes";
import { COIN_SPAWNING } from "../config/coins";
import { log, LogCategory, logger } from "../lib/logger";
import { ScalingManager } from "./ScalingManager";
import { useAudioStore } from "../stores/systems/audioStore";
import { AudioEvent } from "../types/enums";
import { useScoreStore, useStateStore } from "../stores/gameStore";
import { useRenderStore } from "../stores/systems/renderStore";
import { getTuned } from "../stores/systems/tuningStore";
import { formatScoreText } from "../lib/scoringUtils";
import {
  bCoinMilestonesCrossed,
  mCoinSpawnDecision,
  monsterKillBasePoints,
  pCoinSpawnsAt,
  pCoinTokensForFounding,
  tokensAddedOnFounding,
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
  private firefoundingCount: number = 0;
  // BJ P-coin tokens: firefounding=2, normal=1, threshold=9. Increment paused while
  // a P-coin is alive on screen. Spawn at 9, subtract 9 (don't reset to 0).
  private pCoinTokens: number = 0;
  private activeEffects: Map<string, EffectData> = new Map();
  private triggeredSpawnConditions: Set<string> = new Set(); // Track which spawn conditions have been triggered
  private lastProcessedScore: number = 0; // Track the last score threshold that was processed
  private lastScoreCheck: number = 0; // Track the last total score we checked for B-coin spawning
  private foundingAndMonsterPoints: number = 0; // Track points from foundings and monsters only (no bonus)
  private coinPoints: number = 0; // Track points earned from coin collection only (for statistics)
  private firefoundingPoints: number = 0; // Track points from firefounding collection only (for B-coin spawning)
  private monsterKillCount: number = 0; // Track monsters killed in current power mode session
  private pCoinColorIndex: number = 0; // Track current P-coin color index
  private bCoinSpawnsThisLevel: number = 0; // BJ: max 5 B-coin spawns per level
  private pCoinSpawnsThisLevel: number = 0; // BJ: max 2 P-coin spawns per level
  // F-coin (Founder Mode): rolled once per RUN at game start. If hit, picks
  // a random target level (in [F_COIN_MIN_LEVEL..F_COIN_MAX_LEVEL]). On entry
  // to that level, picks a random founding-count in [F_COIN_TRIGGER_MIN_FOUNDING..
  // F_COIN_TRIGGER_MAX_FOUNDING] — the F-coin spawns when that many foundings have
  // been collected on the level. Founding-count triggering ties spawn to player
  // progress instead of wall clock (level may finish in <30s).
  private fCoinTargetLevel: number | null = null;
  private fCoinTargetFoundingCount: number | null = null;
  private fCoinFoundingsThisLevel: number = 0;
  private fCoinSetupLevel: number | null = null; // Dedup guard for repeated softReset()
  private fCoinSpawnedThisLevel: boolean = false;
  private fCoinSpawnsThisRun: number = 0; // Hard cap (defense in depth).
  private lastBonusCountLogged: number = 0; // Track last logged bonus count to avoid duplicate logging
  private lastFirefoundingCountLogged: number = 0; // Track last logged firefounding count to avoid duplicate logging

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
        condition: "Every 9 firefoundings collected in correct order",
        spawnInterval: COIN_SPAWNING.POWER_COIN_SPAWN_INTERVAL,
        spawnPointsCount: pcoinSpawnPoints.length,
        spawnPoints: pcoinSpawnPoints.map((p) => ({ x: p.x, y: p.y })),
        expectedSpawnsAt: [9, 18, 27, 36, 45].map((n) => `${n} firefoundings`),
        color: "Dynamic (red to purple gradient based on time left)",
        effects: "Power mode - invincibility and monster destruction",
      },
      "B-Coin (Bonus Multiplier)": {
        condition:
          "Every 5000 points from firefounding collection only (100/200 points per firefounding)",
        spawnInterval: GAME_CONFIG.BONUS_COIN_SPAWN_INTERVAL,
        spawnPointsCount: bcoinSpawnPoints.length,
        spawnPoints: bcoinSpawnPoints.map((p) => ({ x: p.x, y: p.y })),
        expectedSpawnsAt: [5000, 10000, 15000, 20000, 25000].map(
          (n) => `${n} firefounding points`
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
    this.firefoundingCount = 0;
    this.pCoinTokens = 0;
    this.activeEffects.clear();
    this.triggeredSpawnConditions.clear();
    this.lastProcessedScore = 0;
    this.lastScoreCheck = 0;
    this.foundingAndMonsterPoints = 0;
    this.coinPoints = 0;
    this.firefoundingPoints = 0;
    this.monsterKillCount = 0;
    this.bCoinSpawnsThisLevel = 0;
    this.pCoinSpawnsThisLevel = 0;
    this.lastBonusCountLogged = 0;
    this.lastFirefoundingCountLogged = 0;
    this.fCoinSpawnsThisRun = 0;
    this.fCoinSetupLevel = null; // Allow setup to fire fresh for the new run.
    this.rollFCoinForRun();
    this.setupFCoinForCurrentLevel();
    // Don't reset pCoinColorIndex - let it persist across sessions
    log.data("CoinManager: Full reset (game over) - all counters cleared");
  }

  // Soft reset for level transitions - preserves spawn counters
  softReset(): void {
    this.stopPowerCoinAmbientIfAny();
    this.coins = [];
    this.activeEffects.clear();
    this.bCoinSpawnsThisLevel = 0; // BJ: B-coin per-level cap resets each map
    this.pCoinSpawnsThisLevel = 0; // BJ: P-coin per-level cap resets each map
    // F-coin setup is NOT done here — softReset runs before currentLevel
    // bumps, so it would read the stale level. setup happens in
    // onLevelStarted(), called from LevelManager.loadCurrentLevel().
    // lastScoreCheck tracks foundingAndMonsterPoints (the threshold counter), which
    // already persists across levels — no sync needed. Coin pickups and bonus
    // never write to foundingAndMonsterPoints, so there's no retro-trigger risk.
    // DON'T reset these - they accumulate across levels:
    // - firefoundingCount (for P-coin spawning)
    // - firefoundingPoints (for B-coin spawning)
    // - triggeredSpawnConditions (prevents duplicate spawns)
    // - lastProcessedScore, lastScoreCheck (for threshold tracking)
    log.data(
      `CoinManager: Soft reset (level transition) - preserving counters:`,
      {
        firefoundingCount: this.firefoundingCount,
        firefoundingPoints: this.firefoundingPoints,
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
    this.activeEffects.clear();
    // Don't clear score tracking or firefounding count - these persist across levels
    log.data(
      `CoinManager: Cleared active coins for new level, preserved spawn tracking:`,
      {
        firefoundingCount: this.firefoundingCount,
        firefoundingPoints: this.firefoundingPoints,
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
    // F-coin spawn is event-driven from onFoundingCollected, not per-frame.

    // Remove collected coins
    this.coins = this.coins.filter((coin) => !coin.isCollected);
  }

  // F-coin (Founder Mode): rolled once per RUN at game start. If the roll
  // hits, picks a random target level (rookie-gated to F_COIN_MIN_LEVEL+).
  // Level 1 is intentionally excluded.
  private rollFCoinForRun(): void {
    this.fCoinTargetLevel = null;
    this.fCoinTargetFoundingCount = null;
    this.fCoinFoundingsThisLevel = 0;
    this.fCoinSpawnedThisLevel = false;

    const chance = getTuned("F_COIN_RUN_CHANCE");
    const roll = Math.random();
    const minLevel = COIN_SPAWNING.F_COIN_MIN_LEVEL;
    const maxLevel = COIN_SPAWNING.F_COIN_MAX_LEVEL;
    const minFounding = getTuned("F_COIN_TRIGGER_MIN_FOUNDING");
    const maxFounding = getTuned("F_COIN_TRIGGER_MAX_FOUNDING");

    if (roll >= chance) {
      log.coin(
        `F-coin roll MISS — chance=${chance}, roll=${roll.toFixed(3)}. No F-coin this run.`
      );
      return;
    }

    const range = maxLevel - minLevel + 1;
    this.fCoinTargetLevel = minLevel + Math.floor(Math.random() * range);

    log.coin(
      `💡 F-coin ROLL HIT — chance=${chance}, roll=${roll.toFixed(3)}, ` +
        `target level=${this.fCoinTargetLevel} (range ${minLevel}-${maxLevel}), ` +
        `founding-trigger window=${minFounding}-${maxFounding}`
    );
  }

  // Public entry point — called by LevelManager.loadCurrentLevel() AFTER
  // currentLevel has been bumped to the level being loaded. Idempotent
  // (the dedup guard inside setupFCoinForCurrentLevel handles repeats).
  public onLevelStarted(): void {
    this.setupFCoinForCurrentLevel();
  }

  // Called on level transition. If the entered level is this run's F-coin
  // target level, picks a random target founding count to trigger spawn.
  // Dedup guard prevents repeated calls from rerolling mid-level.
  private setupFCoinForCurrentLevel(): void {
    const currentLevel = useStateStore.getState().currentLevel;

    // Dedup: identical-level repeat calls (multiple softReset paths) skip.
    if (this.fCoinSetupLevel === currentLevel) return;
    this.fCoinSetupLevel = currentLevel;

    // Reset level-scoped state.
    this.fCoinTargetFoundingCount = null;
    this.fCoinFoundingsThisLevel = 0;
    this.fCoinSpawnedThisLevel = false;

    if (this.fCoinTargetLevel === null) return;
    if (this.fCoinSpawnsThisRun >= COIN_SPAWNING.F_COIN_RUN_CAP) return;
    if (currentLevel !== this.fCoinTargetLevel) return;

    const min = getTuned("F_COIN_TRIGGER_MIN_FOUNDING");
    const max = getTuned("F_COIN_TRIGGER_MAX_FOUNDING");
    const range = Math.max(1, max - min + 1);
    this.fCoinTargetFoundingCount = min + Math.floor(Math.random() * range);

    log.coin(
      `🎯 F-coin target level ${currentLevel} reached — will spawn on founding #${this.fCoinTargetFoundingCount}`
    );
  }

  // Called from onFoundingCollected. Increments the level-scoped founding counter and
  // spawns the F-coin if the random target is reached.
  private checkFCoinSpawnOnFounding(): void {
    if (this.fCoinSpawnedThisLevel) return;
    if (this.fCoinTargetFoundingCount === null) return;
    if (this.fCoinSpawnsThisRun >= COIN_SPAWNING.F_COIN_RUN_CAP) return;

    // Defense: only spawn on the actual target level. Protects against any
    // pathological case where founding collection fires after level transition.
    const currentLevel = useStateStore.getState().currentLevel;
    if (currentLevel !== this.fCoinTargetLevel) return;

    const tm = useStateStore.getState().tutorialMission;
    if (tm) return; // Tutorials don't spawn coins.

    this.fCoinFoundingsThisLevel += 1;
    if (this.fCoinFoundingsThisLevel < this.fCoinTargetFoundingCount) return;

    // F-coin inherits B-coin's gravity-only physics, so it must use the same
    // class of spawn point — those are placed by the level designer above
    // platforms where gravity-only coins land cleanly. Falling back to a
    // random spawn point would put it at a P-coin position (mid-air, designed
    // for reflective physics), which makes it look like it's "moving fast"
    // as it falls and walks weird paths.
    const fOwnSpawns = this.spawnPoints.filter(
      (p) => p.type === CoinType.FOUNDER_MODE
    );
    const bSpawns = this.spawnPoints.filter(
      (p) => p.type === CoinType.BONUS_MULTIPLIER
    );
    const candidates = fOwnSpawns.length > 0 ? fOwnSpawns : bSpawns;

    let sp = null;
    if (candidates.length > 0) {
      sp = candidates[Math.floor(Math.random() * candidates.length)];
      this.spawnCoin(CoinType.FOUNDER_MODE, sp.x, sp.y, sp.spawnAngle);
    } else {
      const x = 100 + Math.random() * (GAME_CONFIG.CANVAS_WIDTH - 200);
      this.spawnCoin(CoinType.FOUNDER_MODE, x, 50);
    }

    this.fCoinSpawnedThisLevel = true;
    this.fCoinSpawnsThisRun += 1;

    log.coin(
      `💡 F-coin SPAWNED on level ${currentLevel} at (` +
        `${sp ? Math.round(sp.x) : "?"}, ${sp ? Math.round(sp.y) : "?"}) ` +
        `after founding #${this.fCoinFoundingsThisLevel}. ` +
        `Run total: ${this.fCoinSpawnsThisRun}/${COIN_SPAWNING.F_COIN_RUN_CAP}`
    );
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

  onFirefoundingCollected(): void {
    this.onFoundingCollected(true);
  }

  // BJ P-coin token rule: firefounding=2, normal=1, threshold=18 (so 9 firefoundings
  // alone = 1 P-coin). Tokens don't accrue while a P-coin is already on
  // screen — see tokensAddedOnFounding in bjRules.ts.
  onFoundingCollected(isFirefounding: boolean): void {
    if (isFirefounding) this.firefoundingCount++;

    const hasLivePcoin = this.coins.some(
      (c) => c.type === CoinType.POWER && !c.isCollected
    );
    this.pCoinTokens += tokensAddedOnFounding(isFirefounding, hasLivePcoin);

    log.coin(
      `${isFirefounding ? "Firefounding" : "Normal founding"} collected. firefoundingCount=${this.firefoundingCount} pCoinTokens=${this.pCoinTokens} (Pcoin alive: ${hasLivePcoin})`
    );

    this.checkPcoinSpawnConditions();
    this.checkFCoinSpawnOnFounding();
  }

  // Track points from foundings and monsters (excluding bonus points)
  onPointsEarned(points: number, isBonus: boolean = false): void {
    if (!isBonus) {
      const previousPoints = this.foundingAndMonsterPoints;
      this.foundingAndMonsterPoints += points;

      log.data(
        "CoinSpawn: Founding/Monster points earned (WILL count for B-coin)",
        {
          pointsEarned: points,
          previousTotal: previousPoints,
          newTotal: this.foundingAndMonsterPoints,
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

  // Track points from firefounding collection (kept for stats; B-coin no longer
  // gated on firefounding-only points — see checkBcoinSpawnConditions, which uses
  // total score and runs each frame).
  onFirefoundingPointsEarned(points: number): void {
    this.firefoundingPoints += points;
    // Trigger B-coin check immediately so founding collection has zero-frame latency.
    this.checkBcoinSpawnConditions();
  }

  // BJ B-coin: every 5,000 of *thresholdable* score (foundings + monster kills +
  // trampoline) — coin pickups and end-of-level bonus do NOT count, per the
  // arcade rule "5,000 points crossed cleanly without B-coin contribution"
  // (see bjRules.isThresholdablePointSource). Missed thresholds are "lost"
  // (not queued) when a B is already on screen; per-level cap of 5 spawns.
  private checkBcoinSpawnConditions(): void {
    const coinConfig = COIN_TYPES.BONUS_MULTIPLIER;
    if (!coinConfig) return;

    const points = this.foundingAndMonsterPoints;
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
    if (tm === "foundings" || tm === "survive" || tm === "movements") return;

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
      // Skip firefounding-based spawns as they're handled separately
      if (
        coinConfig.spawnCondition &&
        !coinConfig.spawnCondition.toString().includes("firefoundingCount") &&
        coinConfig.type !== "POWER"
      ) {
        // Get the latest coin collection count from coinStore
        const coinStore = useCoinStore.getState();
        const stateStore = useStateStore.getState();
        const combinedState = {
          ...gameState,
          firefoundingCount: this.firefoundingCount,
          foundingAndMonsterPoints: this.foundingAndMonsterPoints,
          coinPoints: this.coinPoints,
          firefoundingPoints: this.firefoundingPoints,
          totalBonusMultiplierCoinsCollected: coinStore.totalBonusMultiplierCoinsCollected || 0,
          livesLostThisGame: stateStore.livesLostThisGame || 0,
        };

        // Only log when there are actual state changes for B-coin
        if (coinConfig.type === "BONUS_MULTIPLIER") {
          const currentThreshold =
            Math.floor(
              this.firefoundingPoints / GAME_CONFIG.BONUS_COIN_SPAWN_INTERVAL
            ) * GAME_CONFIG.BONUS_COIN_SPAWN_INTERVAL;
          const lastThreshold =
            Math.floor(
              this.lastScoreCheck / GAME_CONFIG.BONUS_COIN_SPAWN_INTERVAL
            ) * GAME_CONFIG.BONUS_COIN_SPAWN_INTERVAL;

          // Only log if threshold changed or we're close to a threshold
          if (
            currentThreshold !== lastThreshold ||
            this.firefoundingPoints % GAME_CONFIG.BONUS_COIN_SPAWN_INTERVAL < 100
          ) {
            // Log when within 100 points of threshold
            // Use throttled logging to avoid spam when near threshold
            const logKey = `bcoin_threshold_${currentThreshold}`;
            const logMessage = "CoinSpawn: B-coin spawn condition check";
            const logData = {
              firefoundingPoints: this.firefoundingPoints,
              lastScoreCheck: this.lastScoreCheck,
              currentThreshold,
              lastThreshold,
              spawnInterval: GAME_CONFIG.BONUS_COIN_SPAWN_INTERVAL,
              thresholdChanged: currentThreshold !== lastThreshold,
              nearThreshold:
                this.firefoundingPoints % GAME_CONFIG.BONUS_COIN_SPAWN_INTERVAL <
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

      // Calculate points earned from this coin. `basePoints` and
      // `displayMultiplier` are tracked separately so the score pop-up can
      // render `base × mult` instead of just the multiplied total — gives
      // the player visual feedback on *why* a high-multiplier B/P-coin
      // pickup landed the score it did.
      let basePoints = coinConfig.points;
      let displayMultiplier = 1;

      if (coin.type === CoinType.POWER) {
        const spawnTime = coin.spawnTime || Date.now();
        const colorData = this.getPcoinColorForTime(spawnTime);
        basePoints = colorData.points;
        displayMultiplier = (gameState.multiplier as number) || 1;

        log.debug(
          `P-coin collected: ${colorData.name} color, ${basePoints} × ${displayMultiplier} = ${basePoints * displayMultiplier} points`
        );
        log.data("CoinSpawn: P-coin collected", {
          colorName: colorData.name,
          basePoints,
          multiplier: displayMultiplier,
          totalPoints: basePoints * displayMultiplier,
          coinPointsBefore: this.coinPoints,
          coinPointsAfter: this.coinPoints + basePoints * displayMultiplier,
        });
      } else if (coin.type === CoinType.BONUS_MULTIPLIER) {
        basePoints = 1000;
        displayMultiplier = (gameState.multiplier as number) || 1;
        log.coin(
          `💰 B-coin collected! Points: ${basePoints * displayMultiplier} (1000 × ${displayMultiplier})`
        );
        log.data("CoinSpawn: B-coin collected", {
          basePoints,
          multiplier: displayMultiplier,
          totalPoints: basePoints * displayMultiplier,
          coinPointsBefore: this.coinPoints,
          coinPointsAfter: this.coinPoints + basePoints * displayMultiplier,
        });
      } else if (coin.type === CoinType.EXTRA_LIFE) {
        displayMultiplier = (gameState.multiplier as number) || 1;
        log.coin(
          `❤️ E-coin (Extra Life) collected! Points: ${basePoints * displayMultiplier}`
        );
        log.data("CoinSpawn: E-coin collected", {
          basePoints,
          multiplier: displayMultiplier,
          totalPoints: basePoints * displayMultiplier,
          coinPointsBefore: this.coinPoints,
          coinPointsAfter: this.coinPoints + basePoints * displayMultiplier,
        });
      }

      const pointsEarned = basePoints * displayMultiplier;

      // Track coin points for statistics only (B-coin and E-coin points don't count toward B-coin spawning)
      // Only firefounding collection points should trigger B-coin spawning
      log.data("CoinSpawn: Tracking coin points", {
        coinType: coin.type,
        pointsEarned: pointsEarned,
        currentCoinPoints: this.coinPoints,
        newCoinPoints: this.coinPoints + pointsEarned,
        note: "Special coin points are for statistics only, not for B-coin spawning",
      });
      this.onCoinPointsEarned(pointsEarned);

      // Score pop-up. Goes through the render store directly — the
      // `gameState` arg here is the coin slice (no `addFloatingText`
      // method), so the previous `"addFloatingText" in gameState` check
      // never matched and coin pickups were silently scoreless.
      useRenderStore
        .getState()
        .addFloatingText?.(
          formatScoreText(basePoints, displayMultiplier),
          coin.x + coin.width / 2,
          coin.y + coin.height / 2,
          1000,
          "#fff",
          15
        );

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
          foundings: (gameState as any).foundings || [],
          coins: (gameState as any).coins || [],
          platforms: (gameState as any).platforms || [],
          firefoundingCount: (gameState as any).firefoundingCount || 0,
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

        // Pause spawn + respawn managers for the duration of POWER_MODE so
        // new monsters and respawn timers don't keep accruing during freeze
        // (otherwise kills during power mode all respawn in a flood right
        // when power mode ends, feeling like "10× speed").
        if (effect.type === "POWER_MODE") {
          const gsm = useStateStore.getState().gameStateManager;
          gsm?.pauseForPowerMode?.();
          const status = gsm?.getPowerModePauseStatus?.();
          if (status) {
            log.power(
              `paused spawn/respawn — ` +
                `spawnReasons=${JSON.stringify(status.spawnReasons)}, ` +
                `respawnReasons=${JSON.stringify(status.respawnReasons)}`
            );
          }
        }

        // Track timed effects - for POWER_MODE, get the duration from the activeEffects
        if (effect.type === "POWER_MODE") {
          const powerModeEndTime = (gameStateWithManager as any).activeEffects
            .powerModeEndTime;
          if (powerModeEndTime > 0) {
            this.activeEffects.set(effect.type, {
              endTime: powerModeEndTime,
              effect,
            });
            log.debug(
              `POWER_MODE tracked: endTime=${powerModeEndTime}, duration=${
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
      log.warn(`Coin type ${coin.type} has no effects configured`);
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
          };

          try {
            effectData.effect.remove(gameStateWithManager);
            log.debug(`Effect ${effectType} removed successfully`);
          } catch (error) {
            log.error(`Error removing effect ${effectType}:`, error);
          }

          // Resume spawn + respawn managers (mirrors the pause around
          // effect.apply for POWER_MODE).
          if (effectType === "POWER_MODE") {
            const gsm = useStateStore.getState().gameStateManager;
            const before = gsm?.getPowerModePauseStatus?.();
            gsm?.resumeFromPowerMode?.();
            const after = gsm?.getPowerModePauseStatus?.();
            if (before && after) {
              log.power(
                `resumed spawn/respawn — ` +
                  `spawnReasons ${JSON.stringify(before.spawnReasons)}→${JSON.stringify(after.spawnReasons)}, ` +
                  `respawnReasons ${JSON.stringify(before.respawnReasons)}→${JSON.stringify(after.respawnReasons)}`
              );
            }
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
      if (effectType === "POWER_MODE") {
        log.debug("Power mode deactivated");
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

  // Advance the color of every live P-coin by one tier; loops back to
  // Blue after Gray (BJ §7.1: "the cycle continues looping while the P
  // coin is active"). Called by PlayerManager on jump-start, wall-hit,
  // and fall-off-platform.
  advanceLivePcoinColors(): void {
    let advanced = 0;
    for (const coin of this.coins) {
      if (coin.type !== CoinType.POWER || coin.isCollected) continue;
      coin.colorIndex = ((coin.colorIndex ?? 0) + 1) % P_COIN_COLORS.length;
      advanced++;
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
    // Pure read — no mutation. checkEffectsEnd is the single owner of
    // expiration cleanup; mutating here created a race where the POWER_MODE
    // entry could be deleted by an isPowerModeActive() caller (e.g.
    // updateMonsterStates) before checkEffectsEnd's 100ms grace fired
    // effect.remove. That skipped the scaling-resume + spawn/respawn-resume
    // side effects, leaving managers stuck paused.
    const powerModeEffect = this.activeEffects.get("POWER_MODE");
    if (!powerModeEffect) return false;
    return Date.now() < powerModeEffect.endTime;
  }

  getCoins(): Coin[] {
    return this.coins.filter((coin) => !coin.isCollected);
  }

  getFirefoundingCount(): number {
    return this.firefoundingCount;
  }

  // Reset firefounding count when player dies (loses a life)
  resetFirefoundingCount(): void {
    const previousCount = this.firefoundingCount;
    this.firefoundingCount = 0;
    
    log.coin(`Firefounding count reset after player death: ${previousCount} → 0`);
    log.data("CoinSpawn: Firefounding count reset", {
      previousCount,
      newCount: 0,
      reason: "Player lost a life",
      note: "Player must collect 9 correct foundings again for P-coin spawn"
    });
  }

  getAllCoins(): Coin[] {
    return [...this.coins];
  }

  getFoundingAndMonsterPoints(): number {
    return this.foundingAndMonsterPoints;
  }

  getFirefoundingPoints(): number {
    return this.firefoundingPoints;
  }

  updateMonsters(monsters: Monster[]): void {
    if (this.isPowerModeActive()) {
      const timeLeft = this.getPowerModeEndTime() - Date.now();
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

    this.pauseStartTime = 0;
  }

  resetEffects(): void {
    this.firefoundingCount = 0;
    this.coins = [];
    this.activeEffects.clear();
    this.foundingAndMonsterPoints = 0;
    this.monsterKillCount = 0;
    // Clear spawn-condition keys alongside firefoundingCount; otherwise level 2's
    // founding #9 hits the already-triggered "POWER_9" key from level 1 and the
    // P-coin never spawns again. Same for lastProcessedScore (B-coin keys).
    this.triggeredSpawnConditions.clear();
    this.lastProcessedScore = 0;
    log.debug("Coin effects reset");
  }

  // Force-stop path used when game state changes (level transitions, menu,
  // game over) cut a power mode short before its timer expires. Mirrors the
  // resume side effects of POWER_MODE.remove without going through the
  // effect.remove flow (which the game-state pause already disabled).
  forceStopPowerMode(): void {
    if (!this.isPowerModeActive()) return;

    log.debug("Force stopping power mode");
    this.activeEffects.delete("POWER_MODE");
    ScalingManager.getInstance().resumeFromPowerMode();
    useStateStore.getState().gameStateManager?.resumeFromPowerMode?.();
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

}
