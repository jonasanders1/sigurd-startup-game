# Coin Spawn Condition Logging System

## Overview
This document describes the enhanced coin spawn condition logging system that has been integrated into the game's logger utility. This system provides comprehensive debugging capabilities for tracking when and why coins spawn, with optimized logging that only triggers when values change (not every frame).

## Features

### 1. Browser Console Commands

#### View Spawn Conditions
```javascript
gameLog.coinConditions()
```
Displays static information about all coin spawn conditions:
- P-Coin (Power): Every 9 firebombs collected in correct order
- B-Coin (Bonus Multiplier): Every 5000 points from coin collection only  
- M-Coin (Extra Life): Every 5 B-coins collected

#### Force Current Status Log
```javascript
gameLog.coinStatus()
```
Forces an immediate log of current spawn progress for all coin types, showing:
- Current counters (firebombs, coin points, B-coins collected)
- Next spawn thresholds
- Progress toward next spawn
- How many of each coin type have spawned so far

### 2. Real-time Spawn Condition Tracking
Enable coin spawn logging to see real-time checks (only when values change):

```javascript
gameLog.coinSpawn()  // Enables coin, spawn, and data logs
```

**Important:** Logs are now only generated when values actually change, preventing frame-by-frame spam.

### 3. Enhanced Logging Output
All coin spawn conditions log with the prefix `"CoinSpawn:"` for easy filtering. Logs are only generated when values change:

#### P-Coin (Power Coin) Logs
```javascript
// Only logged when firebomb count changes
log.data("CoinSpawn: P-coin spawn condition check", {
  coinType: "POWER",
  firebombCount: 7,
  spawnInterval: 9,
  nextPCoinAt: 9,
  firebombsNeeded: 2,
  willSpawn: false,
  progress: "7 / 9",
  reason: "Need 2 more firebombs"
})
```

#### B-Coin (Bonus Multiplier) Logs
```javascript
// Only logged when coin points change
log.data("CoinSpawn: B-coin checking spawn conditions", {
  coinPoints: 4800,
  lastScoreCheck: 0,
  currentThreshold: 0,
  lastThreshold: 0,
  spawnInterval: 5000,
  nextBCoinAt: 5000,
  progress: "4800 / 5000"
})
```

#### M-Coin (Extra Life) Logs
```javascript
// Only logged when B-coin collection count changes
log.data("CoinSpawn: M-coin spawn condition check", {
  totalBonusMultiplierCoinsCollected: 3,
  ratio: 5,
  nextMCoinAt: 5,
  bcoinsNeeded: 2,
  willSpawn: false,
  progress: "3 / 5",
  reason: "Need 2 more B-coins"
})
```

#### Forced Status Log
```javascript
// Triggered by gameLog.coinStatus()
log.data("CoinSpawn: Current Status (Forced)", {
  "P-Coin Progress": {
    firebombCount: 7,
    nextSpawnAt: 9,
    firebombsNeeded: 2,
    progress: "7 / 9",
    spawnedSoFar: 0
  },
  "B-Coin Progress": {
    coinPoints: 4800,
    nextSpawnAt: 5000,
    pointsNeeded: 200,
    progress: "4800 / 5000",
    spawnedSoFar: 0
  },
  "M-Coin Progress": {
    bonusCoinsCollected: 3,
    nextSpawnAt: 5,
    bcoinsNeeded: 2,
    progress: "3 / 5",
    spawnedSoFar: 0
  }
})
```

## Usage Examples

### Check Current Spawn Conditions
```javascript
// View static spawn condition information
gameLog.coinConditions()

// Get immediate snapshot of current progress
gameLog.coinStatus()

// Enable real-time spawn condition logging (only on value changes)
gameLog.coinSpawn()

// Then play the game and watch the console for spawn checks
```

### Filter Only Coin Spawn Data
```javascript
// Show only data logs (includes all CoinSpawn logs)
gameLog.data()

// Show coin-related logs
gameLog.coin()

// Force log current status at any time
gameLog.coinStatus()
```

### Debug Specific Coin Types
When debugging specific coin spawn issues:

1. **P-Coins**: Collect firebombs and watch for `"CoinSpawn: P-coin"` logs
2. **B-Coins**: Collect any coins and watch for `"CoinSpawn: B-coin"` logs  
3. **M-Coins**: Collect B-coins and watch for `"CoinSpawn: M-coin"` logs

## Implementation Details

### Logger Enhancements
- Added `coinConditions()` method to display spawn condition summary
- Updated help text to include the new command
- Enhanced initialization messages to mention the feature

### CoinManager Enhancements
- Comprehensive initialization logging showing all coin configurations
- Real-time spawn condition checking with detailed reasons
- Clear indication of thresholds and progress toward next spawn
- Removed duplicate logging for cleaner output

### Log Categories Used
- `LogCategory.COIN`: General coin events
- `LogCategory.SPAWN`: Spawn-related events
- `LogCategory.DATA`: Detailed spawn condition data

## Troubleshooting

### No Spawn Logs Appearing
1. Ensure logging is enabled: `gameLog.coinSpawn()`
2. Check log level: `gameLog.setLevel("debug")`
3. Verify you're in development mode

### Too Many Logs
1. Filter to specific categories: `gameLog.only("data")`
2. Disable other categories: `gameLog.disable("render")`
3. Clear console: `gameLog.clear()`

## Key Improvements
- **No Frame-by-Frame Spam**: Logs only appear when values actually change
- **On-Demand Status**: Use `gameLog.coinStatus()` to check current progress anytime
- **Clear Progress Tracking**: Shows "X / Y" progress format for all coin types
- **Comprehensive Information**: Each log includes all relevant counters and thresholds

## Summary
The enhanced coin spawn logging system provides developers and testers with powerful tools to understand and debug coin spawning behavior without console spam. Key commands:
- `gameLog.coinConditions()` - View spawn condition rules
- `gameLog.coinStatus()` - Force log current progress
- `gameLog.coinSpawn()` - Enable real-time tracking (only on changes)

The system now intelligently tracks value changes and only logs when something meaningful happens, making debugging much more efficient and readable.