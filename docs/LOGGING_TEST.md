# Testing the Logging System

## How to Test

1. **Start the game in development mode:**
   ```bash
   npm run dev
   ```

2. **Open the browser console (F12)**

3. **You should see:**
   ```
   🎮 Game Logger Ready!
   Type gameLog.help() for available commands
   ```

## Test Commands

Try these commands in the browser console:

### Basic Filtering

```javascript
// Show only audio logs
gameLog.audio()

// Show only player actions
gameLog.player()

// Show bomb collection progression
gameLog.bombs()

// Show all gameplay logs
gameLog.gameplay()

// Show all logs
gameLog.all()

// Disable all logs
gameLog.none()
```

### Check What's Enabled

```javascript
// See all categories and their status
gameLog.categories()

// See current configuration
gameLog.showConfig()
```

### Custom Filtering

```javascript
// Enable multiple specific categories
gameLog.enableCategories(['player', 'coin', 'score'])

// Enable just one category
gameLog.only('audio')

// Enable a specific category (keeps others as they are)
gameLog.enable('monster')

// Disable a specific category
gameLog.disable('debug')
```

## Verify It's Working

1. Start playing the game
2. Try filtering to `gameLog.audio()` - you should only see audio-related logs
3. Try `gameLog.player()` - you should only see player actions like jumping, collecting items
4. Try `gameLog.bombs()` - you should see bomb collection progress

## Examples of What You Should See

### With `gameLog.audio()`:
```
🎵 Background music started
🎵 Starting PowerUp melody from coin effect for 5000ms
🎵 Sound effect played: jump
```

### With `gameLog.player()`:
```
👤 Player jumped at {x: 100, y: 200}
👤 Player collected coin
👤 Player died at level 3
```

### With `gameLog.bombs()`:
```
💣 Bomb collected (1/5)
💣 Bomb collected (2/5)
📊 Score increased by 500
👤 Player collected bomb fragment
```

## Troubleshooting

If you don't see any logs:
1. Make sure you're in development mode
2. Check if categories are enabled: `gameLog.categories()`
3. Enable all: `gameLog.all()`
4. Check log level: `gameLog.showConfig()`

## Environment Variables

You can also control logging via `.env` file:

```bash
# Set default log level
VITE_LOG_LEVEL=debug

# Set enabled categories
VITE_LOG_CATEGORIES=audio,player,bomb
```