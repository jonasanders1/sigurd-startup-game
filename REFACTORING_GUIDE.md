# Sigurd Startup Game - Refactoring Guide

## Overview

This document outlines the major architectural improvements made to the Sigurd Startup Game codebase to enhance maintainability, readability, and extensibility.

## Key Improvements

### 1. Domain-Driven Architecture

The codebase has been reorganized into domain-specific modules:

```
src/domains/
├── player/     # Player-related functionality
├── coin/       # Coin system
├── bomb/       # Bomb collection mechanics
├── level/      # Level management
├── game/       # Core game state
└── ui/         # UI components and state
```

Each domain contains:
- `types/` - Domain-specific TypeScript interfaces and types
- `services/` - Business logic separated from state
- `stores/` - State management using Zustand
- `components/` - React components
- `managers/` - Domain-specific managers

### 2. Service Container Pattern

Implemented dependency injection to eliminate circular dependencies:

```typescript
// src/core/ServiceContainer.ts
const container = ServiceContainer.getInstance();
container.register(ServiceKeys.PLAYER_SERVICE, new PlayerService(config));
container.register(ServiceKeys.GAME_LOOP, new GameLoop(container));
```

Benefits:
- No circular dependencies
- Easy testing with mock services
- Clear service interfaces
- Lazy loading of services

### 3. Separation of Concerns

#### Before:
- GameManager: 848 lines handling everything
- Store containing business logic
- Mixed responsibilities

#### After:
- GameLoop: Coordinates subsystems (~200 lines)
- Services: Handle business logic
- Stores: Pure state management
- Managers: Specialized responsibilities

### 4. Improved Asset Loading

Created an asynchronous asset loading system:

```typescript
// src/core/AssetLoader.ts
const loader = new AssetLoader('/assets');
await loader.loadManifest(gameAssetManifest, (progress) => {
  console.log(`Loading: ${progress.percentage}%`);
});
```

Benefits:
- Async loading with progress tracking
- Centralized asset management
- No more synchronous image loading
- Easy asset preloading

### 5. Type Safety Improvements

- Eliminated `any` types where possible
- Domain-specific type definitions
- Proper type guards
- Strict null checks

### 6. Store Architecture

Replaced monolithic store with domain stores:

```typescript
// Before: Everything in one store
const useGameStore = create<AllState>(...);

// After: Domain-specific stores
const useRootStore = create<RootStore>({
  player: createPlayerStore(),
  coins: createCoinStore(),
  // ... other domains
});
```

### 7. Service Layer

Business logic moved to services:

```typescript
// src/domains/player/services/PlayerService.ts
class PlayerService {
  updateMovement(player: PlayerState, input: PlayerInput): PlayerState
  applyPhysics(player: PlayerState, deltaTime: number): PlayerState
  handleJump(player: PlayerState, input: PlayerInput): PlayerState
}
```

## Migration Guide

### 1. Update Imports

```typescript
// Before
import { useGameStore } from '../stores/gameStore';

// After
import { usePlayerStore, useCoinStore } from '../stores/RootStore';
```

### 2. Access State

```typescript
// Before
const { player, coins, bombs } = useGameStore();

// After
const player = usePlayerStore();
const coins = useCoinStore();
```

### 3. Service Usage

```typescript
// Before: Logic in GameManager
gameManager.updatePlayer(deltaTime);

// After: Logic in services
const playerService = container.get<IPlayerService>(ServiceKeys.PLAYER_SERVICE);
const updatedPlayer = playerService.updateMovement(player, input);
```

## Benefits

1. **Maintainability**: Clear module boundaries make code easier to understand
2. **Testability**: Services can be tested in isolation
3. **Scalability**: New features can be added as new domains
4. **Performance**: Async asset loading, better state updates
5. **Type Safety**: Stronger typing reduces runtime errors

## Next Steps

1. Complete migration of all existing code to new architecture
2. Add unit tests for services
3. Implement loading screen with asset preloading
4. Add performance monitoring
5. Create developer documentation

## Code Examples

### Creating a New Domain

1. Create domain structure:
```bash
mkdir -p src/domains/newfeature/{types,services,stores,components}
```

2. Define types:
```typescript
// src/domains/newfeature/types/index.ts
export interface NewFeatureState {
  // ... state definition
}
```

3. Create service:
```typescript
// src/domains/newfeature/services/NewFeatureService.ts
export class NewFeatureService {
  // Business logic here
}
```

4. Create store:
```typescript
// src/domains/newfeature/stores/NewFeatureStore.ts
export const createNewFeatureStore = (set, get) => ({
  // State and actions
});
```

5. Register in container:
```typescript
container.register(ServiceKeys.NEW_FEATURE, new NewFeatureService());
```

## Performance Improvements

1. **Object Pooling**: Can be added for frequently created/destroyed objects
2. **Render Optimization**: Only render changed elements
3. **State Updates**: Use immer for immutable updates
4. **Asset Caching**: Implemented in AssetLoader

## Conclusion

These architectural improvements provide a solid foundation for future development. The codebase is now more modular, testable, and maintainable, making it easier to add new features and fix bugs.