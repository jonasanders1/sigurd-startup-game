# Coin Spawning Debug Logs Documentation

## Overview
Comprehensive debugging logs have been added to track coin spawning conditions as the game progresses. This will help diagnose why coins may not be spawning as expected.

## Configuration Values
- **P-coin (Power)**: Spawns every 9 firebombs collected
- **B-coin (Bonus Multiplier)**: Spawns every 5000 bomb/monster points
- **E-coin (Extra Life)**: Spawns for every 5 bonus multiplier coins collected

## Debug Logs Added

### 1. Main Spawn Condition Check (`checkSpawnConditions`)
**Location**: `src/managers/coinManager.ts`

Logs the following when checking spawn conditions:
- Current game state (score, bomb/monster points, firebomb count, bonus coins collected)
- Active coins currently in the game
- Previously triggered spawn conditions
- Specific checks for each coin type with detailed spawn calculations
- Whether spawn conditions are met or not

### 2. Firebomb Collection (`onFirebombCollected`)
**Location**: `src/managers/coinManager.ts`

Logs when a firebomb is collected:
- New firebomb count
- P-coin spawn interval progress
- Whether P-coin will spawn
- Active P-coins count

### 3. P-Coin Spawn Check (`checkSpawnConditionsOnFirebombChange`)
**Location**: `src/managers/coinManager.ts`

Specifically checks P-coin spawning:
- Current firebomb count vs required interval
- Whether spawn should trigger
- Active P-coins
- Spawn key generation for duplicate prevention

### 4. Points Earning (`onPointsEarned`)
**Location**: `src/managers/coinManager.ts`

Tracks points from bombs and monsters:
- Points added and running total
- B-coin spawn interval progress
- Next B-coin threshold
- Distinguishes between regular and bonus points

### 5. B-Coin Spawn Check (`checkBcoinSpawnConditions`)
**Location**: `src/managers/coinManager.ts`

Specifically checks B-coin spawning:
- Bomb/monster points tracking
- Threshold calculations
- Whether threshold has been crossed
- Active B-coins

### 6. Coin Collection (`collectCoin`)
**Location**: `src/managers/coinManager.ts`

Detailed logging when any coin is collected:
- Coin type and position
- Game state before collection (score, multiplier, lives)
- Points calculation based on coin type
- Effects that will be applied
- Special handling for each coin type

### 7. Game Loop Monitoring
**Location**: `src/managers/GameLoopManager.ts`

Periodic logging (every 5 seconds) of:
- Current score and multiplier
- When spawn conditions are being checked

## Visual Debug Display

### CoinDebugDisplay Component
**Location**: `src/components/debug/CoinDebugDisplay.tsx`

A real-time visual display showing:
- Current game state (score, points, multiplier, lives)
- Progress bars for each coin type spawn
- Active coins count
- Next spawn thresholds
- Only visible in dev mode (when `DEV_CONFIG.ENABLED` is true)

The display appears in the top-right corner of the game screen with:
- Color-coded sections for each coin type
- Progress bars showing how close you are to spawning each coin
- Real-time updates as the game progresses

## How to Use

### Viewing Console Logs
1. Open the browser developer console (F12)
2. Filter logs by "debug" level
3. Play the game and watch for log entries starting with "==="
4. Each major event (collection, spawn check, points earned) will be clearly labeled

### Example Log Output
```
=== FIREBOMB COLLECTED ===
  New firebomb count: 9
  P-coin spawn interval: 9
  Will trigger P-coin: true
  Active P-coins: 0

=== CHECKING P-COIN SPAWN ON FIREBOMB CHANGE ===
  Firebomb count: 9
  Required interval: 9
  Should spawn P-coin: true
  Active P-coins: 0
  ✓ P-COIN WILL SPAWN! (firebombCount: 9, key: POWER_9)

=== POINTS EARNED (BOMB/MONSTER) ===
  Points added: 200
  Previous total: 4800
  New total: 5000
  B-coin spawn interval: 5000
  Next B-coin threshold: 5000
  Active B-coins: 0

=== CHECKING B-COIN SPAWN ON POINT EARN ===
  Bomb/Monster points: 5000
  Last check: 4800
  Current threshold: 5000
  Last threshold: 0
  Spawn interval: 5000
  Threshold crossed: true
  Active B-coins: 0
  ✓ B-COIN WILL SPAWN! Threshold crossed: 0 -> 5000
```

### Visual Debug Display
The debug display will show real-time information about:
- **P-COIN**: Firebomb count progress (X/9)
- **B-COIN**: Bomb/monster points progress (X/5000)
- **E-COIN**: Bonus coins collected progress (X/5)

## Troubleshooting

If coins are not spawning as expected, check:
1. **Console logs** for any error messages
2. **Spawn conditions** are actually being met (check the progress bars)
3. **Active coins** - only one of each type can be active at once
4. **Triggered conditions** - each threshold is only triggered once
5. **Points tracking** - ensure bomb/monster points are being tracked separately from bonus points

## Key Things to Monitor

1. **Firebomb Count**: Should increase with each firebomb collected, P-coin spawns at multiples of 9
2. **Bomb/Monster Points**: Should track points from bombs and monsters only (not bonus points), B-coin spawns at multiples of 5000
3. **Bonus Coins Collected**: Should track total B-coins collected across all levels, E-coin spawns at multiples of 5
4. **Spawn Keys**: Each spawn has a unique key to prevent duplicates (e.g., "POWER_9", "BONUS_MULTIPLIER_5000")
5. **Active Coins**: Maximum of 1 active coin per type at any time