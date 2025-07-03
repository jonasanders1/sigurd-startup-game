# Game Architecture

This document describes the improved architecture of the Sigurd Startup Game.

## Overview

The game is built using React for UI/menus and Canvas for game rendering, with TypeScript for type safety. The architecture follows clean code principles with clear separation of concerns.

## Directory Structure

```
src/
├── components/          # React components
│   ├── core/           # Core game components
│   │   └── GameWrapper.tsx
│   ├── menu/           # Menu components
│   └── ui/             # Reusable UI components
├── config/             # Configuration files
│   ├── gameConfig.ts   # Core game settings
│   ├── entityConfig.ts # Entity-specific settings
│   ├── uiConfig.ts     # UI and visual settings
│   └── scoringConfig.ts # Scoring and multiplier settings
├── core/               # Core game systems
│   ├── Game.ts         # Main game loop
│   ├── EntityManager.ts # Entity management
│   └── PhysicsSystem.ts # Physics and collisions
├── entities/           # Game entities (ECS pattern)
│   ├── BaseEntity.ts   # Abstract base class
│   ├── PlayerEntity.ts # Player implementation
│   ├── MonsterEntity.ts # Monster implementation
│   ├── CoinEntity.ts   # Coin implementation
│   └── BombEntity.ts   # Bomb implementation
├── managers/           # Specialized managers
│   ├── AudioManager.ts # Audio playback
│   ├── InputManager.ts # Input handling
│   ├── RenderManager.ts # Canvas rendering
│   └── CommunicationManager.ts # External communication
├── stores/             # State management (Zustand)
│   ├── gameStore.ts    # Main store
│   └── slices/         # Store slices
├── types/              # TypeScript types
└── lib/                # Utility libraries
```

## Core Concepts

### 1. Entity-Component-System (ECS) Pattern

All game objects inherit from `BaseEntity`, providing:
- Common properties (position, velocity, dimensions)
- Standard methods (update, render, collision detection)
- Consistent behavior across all entities

```typescript
class PlayerEntity extends BaseEntity {
  update(deltaTime: number): void {
    // Player-specific update logic
  }
  
  render(ctx: CanvasRenderingContext2D): void {
    // Player-specific rendering
  }
}
```

### 2. Separation of Concerns

The `GameManager` has been split into focused systems:

- **Game**: Core game loop and orchestration
- **EntityManager**: Entity lifecycle management
- **PhysicsSystem**: Physics simulation and collision detection
- **RenderManager**: Canvas rendering
- **InputManager**: Input processing
- **AudioManager**: Sound playback
- **CommunicationManager**: External messaging (iframe, events)

### 3. Configuration Management

Configuration is organized by domain:

- **gameConfig**: Core settings (canvas size, physics, dev mode)
- **entityConfig**: Entity-specific settings (sizes, speeds, points)
- **uiConfig**: Visual settings (colors, fonts, animations)
- **scoringConfig**: Scoring rules and multipliers

### 4. State Management

Zustand store with slice pattern for modularity:
- Each slice manages a specific domain
- Clear interfaces between slices
- Minimal coupling with game logic

## Data Flow

1. **Input** → InputManager → Game → EntityManager → Entities
2. **Physics** → PhysicsSystem → Entities → State Updates
3. **Rendering** → EntityManager → RenderManager → Canvas
4. **State Changes** → Store → React Components → UI Updates

## Benefits of New Architecture

1. **Maintainability**: Clear file organization and single responsibility
2. **Scalability**: Easy to add new entities, systems, or features
3. **Testability**: Isolated components with clear interfaces
4. **Performance**: Efficient entity management and rendering
5. **Type Safety**: Strong TypeScript types throughout

## Future Improvements

1. **Component System**: Add components to entities for more flexibility
2. **Scene Management**: Add scene/level management system
3. **Asset Pipeline**: Improve asset loading and caching
4. **Pooling**: Object pooling for performance
5. **Debug Tools**: In-game debug overlay and tools