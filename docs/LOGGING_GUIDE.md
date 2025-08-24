# 🎮 Game Logging System Guide

## Overview

The game now has a powerful, category-based logging system that allows you to filter logs by type, making debugging much more efficient. No more scrolling through hundreds of irrelevant logs!

## Quick Start

### In Development

When you run the game in development mode, you'll see in the console:
```
🎮 Game Logger Ready!
Type gameLog.help() for available commands
```

### Quick Filters (Browser Console)

Filter logs instantly using these commands:

```javascript
// Show only specific categories
gameLog.audio()       // Only audio-related logs
gameLog.player()      // Only player actions
gameLog.bombs()       // Bomb collection progression
gameLog.coins()       // Coin collection logs

// Show grouped categories
gameLog.gameplay()    // All gameplay logs (player, monsters, items, etc.)
gameLog.technical()   // Technical logs (rendering, physics, performance)

// Control all categories
gameLog.all()         // Enable all categories
gameLog.none()        // Disable all (errors still show)
```

## Using the Logger in Code

### Import

```typescript
import { log } from '@/lib/logger';
// or for direct logger access:
import { logger } from '@/lib/logger';
```

### Basic Usage

```typescript
// Category-specific logging
log.audio('Background music started');
log.player('Jumped at position', { x: 100, y: 200 });
log.coin('Collected gold coin', coinData);
log.bomb('Bomb 3/5 collected');
log.monster('Spawned chaser at', position);
log.score('Score increased', { from: 1000, to: 1500 });

// Level-based logging (use sparingly)
log.error('Failed to load asset', assetPath);
log.warn('Performance degradation detected');
log.info('Game initialized');
log.debug('Render frame', frameData);
```

### Categories Reference

| Category | Icon | Purpose | Example Usage |
|----------|------|---------|---------------|
| `audio` | 🎵 | Sound/music events | `log.audio('PowerUp melody started')` |
| `player` | 👤 | Player actions | `log.player('Player died at level 3')` |
| `monster` | 👹 | Monster behavior | `log.monster('Chaser activated rage mode')` |
| `coin` | 🪙 | Coin collection | `log.coin('P-coin collected, power mode: 5s')` |
| `bomb` | 💣 | Bomb progression | `log.bomb('Bomb sequence complete!')` |
| `power` | ⚡ | Power-up events | `log.power('Power mode activated for 5s')` |
| `level` | 🏁 | Level progression | `log.level('Started level 3: Mountain')` |
| `score` | 📊 | Score changes | `log.score('Multiplier increased to 3x')` |
| `game` | 🎮 | General game state | `log.game('Game paused')` |
| `spawn` | ✨ | Entity spawning | `log.spawn('Spawned 5 coins')` |
| `collision` | 💥 | Collision events | `log.collision('Player hit monster')` |
| `performance` | 📈 | Performance metrics | `log.performance('FPS: 60')` |
| `data` | 📡 | External data | `log.data('Sent score to server')` |
| `asset` | 📦 | Asset loading | `log.asset('Loaded sprite: player-idle')` |

## Browser Console Commands

### Full Command List

```javascript
// Get help
gameLog.help()        // Show all available commands

// Quick filters
gameLog.player()      // Show only player logs
gameLog.audio()       // Show only audio logs
gameLog.bombs()       // Show bomb progression
gameLog.coins()       // Show coin collection
gameLog.gameplay()    // Show all gameplay logs
gameLog.technical()   // Show technical logs

// Fine control
gameLog.enable('audio')      // Enable specific category
gameLog.disable('render')    // Disable specific category
gameLog.only('player')        // Show ONLY this category
gameLog.categories()          // List all categories with status

// Configuration
gameLog.setLevel('debug')     // Set log level (off/error/warn/info/debug/trace)
gameLog.showConfig()          // Show current configuration

// Utility
gameLog.clear()               // Clear console
```

## Advanced Features

### Throttled Logging

For events that fire frequently (like render frames), use throttled logging:

```typescript
// This will only log once per second even if called more frequently
logger.throttled(
  LogCategory.PERFORMANCE,
  'fps-update',           // Unique key for this throttle
  'FPS Update',           
  1000,                   // Throttle interval in ms
  currentFPS
);
```

### Environment Variables

Configure logging via `.env`:

```bash
# Set default log level
VITE_LOG_LEVEL=debug  # off, error, warn, info, debug, trace

# Set enabled categories (comma-separated)
VITE_LOG_CATEGORIES=audio,player,bomb  # Only these categories
VITE_LOG_CATEGORIES=all               # All categories (default)
VITE_LOG_CATEGORIES=none              # No categories
```

## Best Practices

### 1. Use Appropriate Categories

```typescript
// ✅ GOOD - Clear category separation
log.audio('Background music volume changed to', volume);
log.player('Player collected power-up at', position);
log.monster('Boss entered rage mode');

// ❌ BAD - Wrong category
log.audio('Player jumped');  // This should be log.player()
```

### 2. Log Meaningful Events

```typescript
// ✅ GOOD - Meaningful game events
log.bomb('Bomb collected', { current: 3, total: 5, percentage: 60 });
log.level('Level complete', { time: '2:34', score: 15000 });

// ❌ BAD - Too granular
log.player('Player x position: 100');  // Log only significant position changes
```

### 3. Include Relevant Data

```typescript
// ✅ GOOD - Includes context
log.coin('Special coin collected', {
  type: 'gold',
  value: 500,
  position: { x: 100, y: 200 },
  multiplier: 2
});

// ❌ BAD - No context
log.coin('Coin collected');
```

### 4. Use Debug/Trace for Technical Details

```typescript
// Use debug for technical implementation details
log.debug('Collision check', { 
  entities: 45, 
  checks: 120, 
  time: '2ms' 
});

// Use regular categories for game events
log.collision('Player hit by monster', { 
  damage: 10, 
  remainingHealth: 2 
});
```

## Common Debugging Scenarios

### 1. Debug Audio Issues
```javascript
// In browser console:
gameLog.audio()  // Show only audio logs
```

### 2. Track Player Progression
```javascript
// Show player, score, and bomb logs
gameLog.enableCategories(['player', 'score', 'bomb'])
```

### 3. Performance Analysis
```javascript
// Show technical logs
gameLog.technical()
// Or specifically:
gameLog.enableCategories(['performance', 'render', 'physics'])
```

### 4. Debug Specific Level
```javascript
// Show all gameplay for debugging
gameLog.gameplay()
```

### 5. Silent Mode (Production-like)
```javascript
gameLog.setLevel('error')  // Only show errors
// or
gameLog.none()  // Disable all categories
```

## Migration from console.log

Replace your console.log statements with appropriate logger methods:

```typescript
// Before:
console.log('Player jumped at', position);
console.log('🎵 Music started');
console.warn('Failed to load sprite');

// After:
log.player('Jumped at', position);
log.audio('Music started');
log.warn('Failed to load sprite');
```

## Tips & Tricks

1. **Quick Toggle**: Double-tap `F12` to open console, then quickly type `gameLog.` and use autocomplete
2. **Persistent Filters**: Your filter settings persist during the session
3. **Color Coding**: Each category has its own color for easy visual scanning
4. **Combine with Chrome DevTools**: Use Chrome's filter box with the icons (🎵, 👤, etc.) for additional filtering
5. **Production Ready**: In production builds, logging is automatically reduced to essential logs only

## Troubleshooting

**Q: I don't see any logs**
- Check if categories are enabled: `gameLog.categories()`
- Check log level: `gameLog.showConfig()`
- Enable all: `gameLog.all()`

**Q: Too many logs**
- Filter to specific category: `gameLog.only('player')`
- Increase log level: `gameLog.setLevel('warn')`

**Q: Logs are not colored**
- Colors work best in Chrome/Edge DevTools
- Check browser console settings for "Show timestamps" interference

## Summary

The new logging system gives you complete control over what you see in the console. Use the browser commands for real-time filtering during debugging, and use appropriate categories when adding new logs to keep everything organized and easily filterable.