# Configuration Management System

This directory contains all game configuration values organized into logical modules. This structure replaces the previous monolithic `constants.ts` file with a more maintainable, modular approach.

## Directory Structure

```
config/
├── game.ts        # Core game settings (canvas, physics, rules)
├── entities.ts    # Entity dimensions and sizes
├── coins.ts       # Coin system configuration
├── scoring.ts     # Scoring, multipliers, and bonuses
├── colors.ts      # Color palette definitions
├── audio.ts       # Audio settings and defaults
├── dev.ts         # Development mode configuration
└── index.ts       # Central export point
```

## Module Descriptions

### `game.ts`
Core game configuration including:
- **CANVAS_CONFIG**: Canvas dimensions (width, height)
- **PHYSICS_CONFIG**: Gravity, movement speed, jump mechanics
- **GAME_RULES**: Total bombs, starting lives
- **RENDERING_CONFIG**: Sprite and parallax settings

### `entities.ts`
Entity dimensions for all game objects:
- **ENTITY_SIZES**: Player dimensions, bomb size, monster size, coin size, platform height

### `coins.ts`
Comprehensive coin system configuration:
- **COIN_PHYSICS**: Bounce speed, damping, gravity
- **COIN_SPAWNING**: Spawn intervals and ratios
- **COIN_EFFECTS**: Duration, points, and effects

### `scoring.ts`
Scoring and progression system:
- **BOMB_POINTS**: Normal and firebomb point values
- **MULTIPLIER_SYSTEM**: Thresholds and max multiplier
- **BONUS_POINTS**: End-of-level bonuses

### `colors.ts`
Complete color palette:
- **COLORS**: All game colors organized by category
  - Player, bombs, monsters, environment, UI, coins
  - Monster type variants with unique colors

### `audio.ts`
Audio configuration:
- **DEFAULT_AUDIO_SETTINGS**: Default volume levels and mute states

### `dev.ts`
Development and debugging tools:
- **DEV_CONFIG**: Dev mode toggle, target states, god mode, mock data

## Usage Examples

### Import Specific Configurations

```typescript
// Import from specific modules
import { PHYSICS_CONFIG, GAME_RULES } from '@/config/game';
import { COLORS } from '@/config/colors';
import { MULTIPLIER_SYSTEM } from '@/config/scoring';

// Use the imported configs
const gravity = PHYSICS_CONFIG.GRAVITY;
const maxLives = GAME_RULES.STARTING_LIVES;
const playerColor = COLORS.PLAYER;
```

### Import Multiple Configurations

```typescript
// Import from the central index
import { 
  CANVAS_CONFIG, 
  ENTITY_SIZES, 
  COIN_EFFECTS,
  COLORS 
} from '@/config';

// Use the configurations
const width = CANVAS_CONFIG.WIDTH;
const playerHeight = ENTITY_SIZES.PLAYER.HEIGHT;
const powerDuration = COIN_EFFECTS.POWER_COIN_DURATION;
```

### Backwards Compatibility

The old `constants.ts` file is maintained for backwards compatibility:

```typescript
// Legacy import (deprecated but still works)
import { GAME_CONFIG, COLORS } from '@/types/constants';

// Recommended: Import from new config modules
import { PHYSICS_CONFIG, COLORS } from '@/config';
```

## Benefits of This Structure

1. **Modularity**: Each configuration domain is isolated in its own file
2. **Maintainability**: Easier to find and update specific configurations
3. **Type Safety**: All exports use `as const` for better TypeScript inference
4. **Scalability**: Easy to add new configuration modules
5. **Organization**: Clear separation of concerns
6. **Documentation**: Each module is self-documenting with comments

## Adding New Configurations

To add a new configuration module:

1. Create a new file in the `config/` directory
2. Export your configuration objects with `as const`
3. Add exports to `index.ts`
4. Update this README with the new module

Example:
```typescript
// config/powerups.ts
export const POWERUP_CONFIG = {
  DURATION: 5000,
  SPEED_MULTIPLIER: 1.5,
} as const;
```

## Migration Guide

When refactoring existing code:

1. Replace `GAME_CONFIG.CANVAS_WIDTH` with `CANVAS_CONFIG.WIDTH`
2. Replace `GAME_CONFIG.PLAYER_HEIGHT` with `ENTITY_SIZES.PLAYER.HEIGHT`
3. Replace `GAME_CONFIG.GRAVITY` with `PHYSICS_CONFIG.GRAVITY`
4. Import directly from `@/config` modules instead of `@/types/constants`

## Best Practices

1. **Use specific imports**: Import only what you need from each module
2. **Avoid magic numbers**: Always use configuration values instead of hardcoding
3. **Add comments**: Document any non-obvious configuration values
4. **Group related configs**: Keep related settings together in the same module
5. **Use TypeScript const assertions**: Always add `as const` to configuration objects