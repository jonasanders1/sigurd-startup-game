# Scalable Coin System Documentation

## Overview

The coin system has been redesigned to be highly scalable and easy to extend. You can now add new coin types with different physics, effects, and spawn conditions without modifying core game logic.

## Architecture

### Core Components

1. **`CoinTypeConfig`** - Defines a coin type's properties
2. **`CoinEffect`** - Defines what happens when a coin is collected
3. **`CoinPhysicsConfig`** - Defines how a coin moves and behaves
4. **`COIN_TYPES`** - Central configuration object for all coin types

### Key Files

- `src/config/coinTypes.ts` - Main configuration file
- `src/managers/coinManager.ts` - Coin lifecycle management
- `src/managers/coinPhysics.ts` - Physics handling
- `src/managers/RenderManager.ts` - Visual rendering

## Adding a New Coin Type

### Step 1: Define the Coin Configuration

Add your new coin type to `src/config/coinTypes.ts`:

```typescript
export const COIN_TYPES: Record<string, CoinTypeConfig> = {
  // ... existing coins ...
  
  MY_NEW_COIN: {
    type: 'MY_NEW_COIN',
    color: '#FF5733', // Orange
    points: 250,
    physics: COIN_PHYSICS.STANDARD, // or create custom physics
    effects: [{
      type: 'MY_EFFECT',
      duration: 2000, // Optional: effect duration in ms
      points: 250,
      apply: (gameState: any) => {
        // What happens when coin is collected
        gameState.player.jumpPower *= 1.3;
        console.log('💪 Jump boost activated!');
      },
      remove: (gameState: any) => {
        // What happens when effect expires (optional)
        gameState.player.jumpPower /= 1.3;
        console.log('💪 Jump boost deactivated');
      }
    }],
    spawnCondition: (gameState: any) => {
      // When should this coin spawn?
      return gameState.score > 0 && gameState.score % 2500 === 0;
    },
    maxActive: 1 // Maximum number of this coin type active at once
  }
};
```

### Step 2: Choose Physics Behavior

Use one of the predefined physics configurations:

```typescript
// Standard physics (gravity, bouncing)
physics: COIN_PHYSICS.STANDARD

// Power coin physics (no gravity, perfect reflection)
physics: COIN_PHYSICS.POWER

// Floating physics (no gravity, gentle movement)
physics: COIN_PHYSICS.FLOATING

// Homing physics (moves toward player)
physics: COIN_PHYSICS.HOMING
```

Or create custom physics:

```typescript
physics: {
  hasGravity: false,
  bounces: false,
  reflects: false,
  customUpdate: (coin: any, platforms: any[], ground: any) => {
    // Custom movement logic
    coin.x += Math.sin(Date.now() * 0.005) * 2;
    coin.y += Math.cos(Date.now() * 0.003) * 1;
  }
}
```

### Step 3: Define Effects

Effects are what happen when the coin is collected:

```typescript
effects: [
  {
    type: 'EFFECT_NAME',
    duration: 3000, // Optional: how long the effect lasts
    points: 250,    // Points awarded
    apply: (gameState: any) => {
      // Apply the effect
      gameState.activeEffects.myEffect = true;
    },
    remove: (gameState: any) => {
      // Remove the effect when duration expires
      gameState.activeEffects.myEffect = false;
    }
  }
]
```

### Step 4: Define Spawn Conditions

Spawn conditions determine when the coin appears:

```typescript
spawnCondition: (gameState: any) => {
  // Return true when the coin should spawn
  return gameState.score > 0 && gameState.score % 3000 === 0;
}
```

## Available Physics Types

### STANDARD
- Has gravity
- Bounces off surfaces with damping
- Good for regular collectible coins

### POWER
- No gravity
- Perfect reflection off surfaces
- Good for special power coins

### FLOATING
- No gravity
- Custom movement patterns
- Good for magical/ethereal coins

### HOMING
- No gravity
- Moves toward the player
- Good for magnet-like effects

## Effect Examples

### Temporary Speed Boost
```typescript
{
  type: 'SPEED_BOOST',
  duration: 3000,
  apply: (gameState) => {
    gameState.player.moveSpeed *= 1.5;
  },
  remove: (gameState) => {
    gameState.player.moveSpeed /= 1.5;
  }
}
```

### Shield Protection
```typescript
{
  type: 'SHIELD',
  duration: 5000,
  apply: (gameState) => {
    gameState.activeEffects.shieldMode = true;
  },
  remove: (gameState) => {
    gameState.activeEffects.shieldMode = false;
  }
}
```

### Instant Effect (No Duration)
```typescript
{
  type: 'EXTRA_LIFE',
  apply: (gameState) => {
    gameState.lives += 1;
  }
}
```

## Spawn Condition Examples

### Score-based Spawning
```typescript
spawnCondition: (gameState) => gameState.score % 5000 === 0
```

### Life-based Spawning
```typescript
spawnCondition: (gameState) => gameState.lives <= 1
```

### Time-based Spawning
```typescript
spawnCondition: (gameState) => Date.now() - gameState.gameStartTime > 30000
```

### Complex Conditions
```typescript
spawnCondition: (gameState) => {
  return gameState.score > 10000 && 
         gameState.lives < 3 && 
         gameState.firebombCount % 5 === 0;
}
```

## Best Practices

1. **Use descriptive names** for coin types and effects
2. **Balance spawn conditions** to avoid too many coins
3. **Set appropriate `maxActive`** limits to prevent spam
4. **Test effect durations** to ensure they're not too long/short
5. **Use console.log** in effects for debugging
6. **Consider visual feedback** for active effects

## Integration with Existing Code

The new system is fully backward compatible. Existing coin types continue to work as before, but now benefit from the improved architecture.

## Debugging

- Check browser console for effect activation/deactivation messages
- Use `coinManager.getCoinConfig(type)` to inspect coin configurations
- Use `coinManager.isEffectActive(effectType)` to check if effects are active

## Performance Considerations

- Effects are automatically cleaned up when they expire
- Physics calculations are optimized based on coin type
- Spawn conditions are checked efficiently
- Visual effects are minimal and performant 