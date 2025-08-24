# Game Package Integration Guide

## Overview
This document describes the communication protocol between the game package and the website to ensure proper tracking of game progress, including partial level completions.

## Problem Solved
Previously, if a player died before completing the first level, their entire game run would not be saved. This led to a poor user experience where players lost all record of their attempts. The new system tracks progress from the moment a level starts, ensuring all attempts are recorded.

## Communication Events

### 1. Level Started Event (`game:level-started`)
**When to send:** As soon as a new level/map begins loading or starts.

```javascript
// Game package should call this when a level starts
window.sigurdGame?.sendLevelStart(levelNumber, mapName);

// Or dispatch directly:
window.dispatchEvent(new CustomEvent("game:level-started", {
  detail: {
    level: 1,              // Current level number
    mapName: "Training Ground", // Name of the map
    timestamp: Date.now()  // When the level started
  },
  bubbles: true
}));
```

### 2. Score Update Event (`scoreUpdate`)
**When to send:** During gameplay whenever score, lives, or multiplier changes.

```javascript
// Real-time updates during gameplay
window.sigurdGame?.updateCurrentScore(score, level, lives, multiplier);
```

### 3. Level Failed Event (`game:level-failed`)
**When to send:** When a player dies or fails a level without completing it.

```javascript
// When player dies mid-level
window.sigurdGame?.sendLevelFailure({
  level: 1,
  mapName: "Training Ground",
  score: 150,           // Final score for this attempt
  bombs: 5,             // Total bombs encountered (optional)
  correctOrders: 3,     // Correct orders before failing (optional)
  lives: 0,             // Remaining lives
  multiplier: 1.5       // Current multiplier
});
```

### 4. Map Completed Event (`game:map-completed`)
**When to send:** When a level/map is successfully completed.

```javascript
// Existing event - still used for successful completions
window.sigurdGame?.sendMapCompletion({
  mapName: "Training Ground",
  level: 1,
  correctOrderCount: 10,
  totalBombs: 10,
  score: 500,
  bonus: 100,
  hasBonus: true,
  timestamp: Date.now(),
  lives: 3,
  multiplier: 2,
  completionTime: 45000,        // milliseconds
  coinsCollected: 15,            // optional
  powerModeActivations: 2        // optional
});
```

### 5. Game Completed Event (`game:completed`)
**When to send:** When the entire game session ends (either by completion or game over).

```javascript
// Send comprehensive game data when game ends
window.sigurdGame?.sendGameCompletion({
  finalScore: 5000,
  totalLevels: 10,
  completedLevels: 8,  // Could be less than totalLevels if player died
  timestamp: Date.now(),
  lives: 0,
  multiplier: 2.5,
  levelHistory: [...],  // Array of all level attempts
  totalCoinsCollected: 150,
  totalPowerModeActivations: 12,
  totalBombs: 80,
  totalCorrectOrders: 75,
  averageCompletionTime: 60,
  gameEndReason: "failed",  // "completed" or "failed"
  sessionId: "session_xxx",
  startTime: startTimestamp,
  endTime: Date.now()
});
```

## Implementation Flow in Game Package

### Game Start
1. When game initializes: Send `game:ready` event
2. When player starts game: Website will call `startNewGameRun()`
3. Website creates session and initializes tracking

### Level/Map Flow
1. **Level Start:**
   - Send `game:level-started` event immediately when level begins
   - This creates a partial level entry in the database

2. **During Gameplay:**
   - Send `scoreUpdate` events for real-time score tracking
   - These updates modify the partial level entry

3. **Level End - Success:**
   - Send `game:map-completed` event with full stats
   - This marks the level as complete (not partial)

4. **Level End - Failure:**
   - Send `game:level-failed` event with final stats
   - This updates the partial entry with final data
   - Level remains marked as partial

5. **Game End:**
   - Send `game:completed` event with comprehensive stats
   - Include all level attempts (both complete and partial)

## Key Changes for Game Package

### Required Changes:
1. **Add level start tracking:** Send event when each level begins
2. **Add failure detection:** Send event when player dies mid-level
3. **Track partial progress:** Keep stats even for incomplete levels
4. **Include all attempts in final data:** Don't filter out failed level attempts

### Example Implementation Pattern:

```javascript
class GameManager {
  constructor() {
    this.currentLevelStats = null;
    this.levelHistory = [];
  }

  startLevel(levelNumber, mapName) {
    // Initialize level tracking
    this.currentLevelStats = {
      level: levelNumber,
      mapName: mapName,
      startTime: Date.now(),
      score: 0,
      bombs: 0,
      correctOrders: 0,
      coins: 0,
      powerModes: 0
    };

    // Notify website that level started
    window.sigurdGame?.sendLevelStart(levelNumber, mapName);
  }

  updateScore(points) {
    this.currentLevelStats.score += points;
    
    // Send real-time update
    window.sigurdGame?.updateCurrentScore(
      this.currentLevelStats.score,
      this.currentLevelStats.level,
      this.lives,
      this.multiplier
    );
  }

  onPlayerDeath() {
    if (this.currentLevelStats) {
      // Send failure event with current stats
      window.sigurdGame?.sendLevelFailure({
        level: this.currentLevelStats.level,
        mapName: this.currentLevelStats.mapName,
        score: this.currentLevelStats.score,
        bombs: this.currentLevelStats.bombs,
        correctOrders: this.currentLevelStats.correctOrders,
        lives: this.lives,
        multiplier: this.multiplier
      });

      // Add to history as partial
      this.levelHistory.push({
        ...this.currentLevelStats,
        isPartial: true,
        completionTime: Date.now() - this.currentLevelStats.startTime
      });
    }

    // Check if game over
    if (this.lives <= 0) {
      this.endGame("failed");
    }
  }

  onLevelComplete() {
    if (this.currentLevelStats) {
      const completionData = {
        ...this.currentLevelStats,
        completionTime: Date.now() - this.currentLevelStats.startTime,
        hasBonus: true,
        bonus: 100,
        lives: this.lives,
        multiplier: this.multiplier,
        timestamp: Date.now()
      };

      // Send completion event
      window.sigurdGame?.sendMapCompletion(completionData);

      // Add to history as complete
      this.levelHistory.push({
        ...completionData,
        isPartial: false
      });
    }
  }

  endGame(reason) {
    // Calculate totals from levelHistory
    const totalBombs = this.levelHistory.reduce((sum, l) => sum + l.bombs, 0);
    const totalCorrectOrders = this.levelHistory.reduce((sum, l) => sum + l.correctOrders, 0);
    
    // Send comprehensive game data
    window.sigurdGame?.sendGameCompletion({
      finalScore: this.totalScore,
      totalLevels: this.maxLevel,
      completedLevels: this.levelHistory.filter(l => !l.isPartial).length,
      levelHistory: this.levelHistory,
      totalBombs,
      totalCorrectOrders,
      // ... other stats
      gameEndReason: reason,
      startTime: this.gameStartTime,
      endTime: Date.now()
    });
  }
}
```

## Benefits

1. **No Lost Progress:** Every attempt is recorded, even if the player dies on level 1
2. **Better Analytics:** Can track where players struggle and fail
3. **Improved UX:** Players can see their progress history, even for failed attempts
4. **Backward Compatible:** Existing complete levels work exactly as before
5. **Granular Tracking:** Can distinguish between partial and complete level attempts

## Testing Checklist

- [ ] Level start event fires when level begins
- [ ] Score updates are tracked during gameplay
- [ ] Level failure event fires when player dies
- [ ] Partial levels are saved with `isPartial: true`
- [ ] Complete levels are saved with `isPartial: false`
- [ ] Game completion includes all level attempts
- [ ] Stats are accurately calculated from level history
- [ ] Session tracking works across all levels
- [ ] Backwards compatibility with existing game runs