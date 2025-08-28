# Coin Spawn Condition Logging System

## Overview
This document describes the enhanced coin spawn condition logging system that has been integrated into the game's logger utility. This system provides comprehensive debugging capabilities for tracking when and why coins spawn.

## Features

### 1. Browser Console Command
A new console command has been added to quickly check coin spawn conditions:

```javascript
gameLog.coinConditions()
```

This command displays:
- All coin types and their spawn conditions
- P-Coin (Power): Every 9 firebombs collected in correct order
- B-Coin (Bonus Multiplier): Every 5000 points from coin collection only  
- M-Coin (Extra Life): Every 5 B-coins collected
- Tips for using the logging system

### 2. Real-time Spawn Condition Tracking
Enable coin spawn logging to see real-time checks:

```javascript
gameLog.coinSpawn()  // Enables coin, spawn, and data logs
```

### 3. Enhanced Logging Output
All coin spawn conditions now log with the prefix `"CoinSpawn:"` for easy filtering:

#### P-Coin (Power Coin) Logs
```javascript
log.data("CoinSpawn: P-coin spawn condition check", {
  coinType: "POWER",
  firebombCount: 7,
  spawnInterval: 9,
  nextPCoinAt: 9,
  firebombsNeeded: 2,
  willSpawn: false,
  reason: "Need 2 more firebombs"
})
```

#### B-Coin (Bonus Multiplier) Logs
```javascript
log.data("CoinSpawn: B-coin checking spawn conditions", {
  coinPoints: 4800,
  lastScoreCheck: 0,
  currentThreshold: 0,
  lastThreshold: 0,
  spawnInterval: 5000,
  willCheckThreshold: true
})
```

#### M-Coin (Extra Life) Logs
```javascript
log.data("CoinSpawn: M-coin spawn condition check", {
  totalBonusMultiplierCoinsCollected: 3,
  ratio: 5,
  nextMCoinAt: 5,
  bcoinsNeeded: 2,
  willSpawn: false,
  reason: "Need 2 more B-coins"
})
```

## Usage Examples

### Check Current Spawn Conditions
```javascript
// View static spawn condition information
gameLog.coinConditions()

// Enable real-time spawn condition logging
gameLog.coinSpawn()

// Then play the game and watch the console for spawn checks
```

### Filter Only Coin Spawn Data
```javascript
// Show only data logs (includes all CoinSpawn logs)
gameLog.data()

// Show coin-related logs
gameLog.coin()
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

## Summary
The enhanced coin spawn logging system provides developers and testers with powerful tools to understand and debug coin spawning behavior. By using the `gameLog.coinConditions()` command for overview and `gameLog.coinSpawn()` for real-time tracking, you can easily monitor and verify that coins are spawning according to their intended conditions.