# Coin Spawning Logic Fixes

## Summary of Issues Fixed

### 1. POWER_COIN (P-coin) Issues
**Problem:** The firebomb count was being reset when transitioning between levels, causing P-coins not to spawn correctly on subsequent levels.
**Solution:** 
- Created separate reset methods: `softReset()` for level transitions and `reset()` for GAME_OVER
- `softReset()` preserves `firebombCount` across levels
- P-coin now spawns correctly every 9 firebombs regardless of level transitions

### 2. BONUS_COIN (B-coin) Issues  
**Problem:** B-coins were spawning based on total score (including monster kill points) instead of just coin points.
**Solution:**
- Added new `coinPoints` counter to track points from coin collection only
- Added `onCoinPointsEarned()` method to track coin points separately
- B-coin spawn condition now checks `coinPoints` instead of total score
- B-coins now spawn every 5000 coin points (not including monster kills)

### 3. EXTRA_LIFE_COIN (M-coin) Issues
**Problem:** M-coins spawn based on B-coin collection count, which needs to be preserved across levels.
**Solution:**
- `totalBonusMultiplierCoinsCollected` already persists across levels in the store
- M-coin spawning continues to work correctly with every 5 B-coins collected

### 4. State Persistence Issues
**Problem:** All coin-related counters were being reset between levels.
**Solution:**
- Implemented two reset methods:
  - `softReset()`: Used for level transitions, preserves all counters
  - `reset()`: Used for GAME_OVER only, resets everything
- Preserved counters across levels:
  - `firebombCount` (for P-coin spawning)
  - `coinPoints` (for B-coin spawning) 
  - `lastCoinPointsCheck` (for B-coin threshold tracking)
  - `triggeredSpawnConditions` (to prevent duplicate spawns)
  - Total coin collection counters in the store

## Key Changes Made

### CoinManager (`src/managers/coinManager.ts`)
1. Added `coinPoints` and `lastCoinPointsCheck` properties
2. Created `softReset()` method for level transitions
3. Updated `reset()` to be used only for GAME_OVER
4. Added `onCoinPointsEarned()` method for tracking coin points
5. Updated `checkBcoinSpawnConditions()` to use `coinPoints`
6. Added getters: `getCoinPoints()`, `getBombAndMonsterPoints()`
7. Track coin points when coins are collected

### Coin Store (`src/stores/entities/coinStore.ts`)
1. Updated `resetCoinState()` to use `softReset()` for level transitions
2. Added `fullResetCoinState()` for GAME_OVER
3. Preserve firebomb count across level transitions

### Game Store (`src/stores/gameStore.ts`)
1. Updated `resetGame()` to use `fullResetCoinState()` for GAME_OVER

### Coin Types (`src/config/coinTypes.ts`)  
1. Updated B-coin spawn condition to use `coinPoints` instead of total score

## Testing Checklist

To verify the fixes work correctly:

1. **P-coin spawning:**
   - Collect 5 firebombs on level 1
   - Complete the level
   - On level 2, P-coin should spawn after collecting 4 more firebombs (total of 9)

2. **B-coin spawning:**
   - Collect coins worth 3000 points on level 1
   - Complete the level
   - On level 2, B-coin should spawn after collecting coins worth 2000 more points (total of 5000)
   - Killing monsters should NOT contribute to B-coin spawning

3. **M-coin spawning:**
   - Collect 3 B-coins on level 1
   - Complete the level
   - On level 2, M-coin should spawn after collecting 2 more B-coins (total of 5)

4. **GAME_OVER reset:**
   - Build up some counters across levels
   - Trigger GAME_OVER
   - All counters should reset to 0
   - Spawning should start fresh from the beginning

## Configuration

Current spawn intervals (from `src/config/coins.ts`):
- `POWER_COIN_SPAWN_INTERVAL`: 9 (firebombs in correct order)
- `BONUS_COIN_SPAWN_INTERVAL`: 5000 (coin points)
- `EXTRA_LIFE_COIN_RATIO`: 5 (B-coins collected)

These values can be adjusted in the configuration file as needed.