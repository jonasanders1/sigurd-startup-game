# Refactoring Roadmap

This document outlines the remaining work to complete the architectural refactoring of the Sigurd Startup Game.

## Phase 1: Foundation (Completed) ✅

- [x] Created domain-driven folder structure
- [x] Implemented Service Container pattern
- [x] Created AssetLoader for async loading
- [x] Defined domain-specific types
- [x] Created example Player domain with service layer
- [x] Designed new store architecture
- [x] Split GameManager into GameLoop
- [x] Organized constants by domain

## Phase 2: Core Migration (In Progress) 🚧

### 1. Complete Domain Services
- [ ] Create CoinService for coin business logic
- [ ] Create BombService for bomb collection logic
- [ ] Create LevelService for level management
- [ ] Create CollisionService with improved architecture
- [ ] Create RenderService for rendering logic

### 2. Complete Domain Stores
- [ ] Implement GameStateStore
- [ ] Implement CoinStore
- [ ] Implement BombStore
- [ ] Implement LevelStore
- [ ] Implement UIStore

### 3. Migrate Existing Code
- [ ] Update all components to use new stores
- [ ] Replace useGameStore with domain stores
- [ ] Move business logic from stores to services
- [ ] Update imports throughout the codebase

## Phase 3: Asset System 🎮

### 1. Implement Asset Preloading
- [ ] Create LoadingScreen component
- [ ] Integrate AssetLoader into game initialization
- [ ] Convert sprite loading to use AssetLoader
- [ ] Add progress bar for asset loading

### 2. Sprite System Refactor
- [ ] Create SpriteManager service
- [ ] Move sprite definitions to config
- [ ] Implement sprite caching
- [ ] Add sprite animation config

## Phase 4: Performance Optimization ⚡

### 1. Object Pooling
- [ ] Implement ObjectPool class
- [ ] Use pooling for coins
- [ ] Use pooling for floating text
- [ ] Use pooling for particles (future)

### 2. Render Optimization
- [ ] Implement dirty rectangle rendering
- [ ] Add viewport culling
- [ ] Optimize sprite batch rendering
- [ ] Add performance monitoring

## Phase 5: Testing & Quality 🧪

### 1. Unit Tests
- [ ] Test all services
- [ ] Test store actions
- [ ] Test collision detection
- [ ] Test game rules

### 2. Integration Tests
- [ ] Test service interactions
- [ ] Test complete game flows
- [ ] Test state persistence

### 3. Code Quality
- [ ] Remove all `any` types
- [ ] Add JSDoc comments
- [ ] Implement error boundaries
- [ ] Add logging system

## Phase 6: Developer Experience 👨‍💻

### 1. Development Tools
- [ ] Add hot module replacement
- [ ] Create debug overlay
- [ ] Add performance profiler
- [ ] Create level editor

### 2. Documentation
- [ ] API documentation
- [ ] Architecture diagrams
- [ ] Contributing guide
- [ ] Code examples

## Implementation Priority

1. **High Priority** (Block other work)
   - Complete domain stores
   - Migrate existing components
   - Fix breaking changes

2. **Medium Priority** (Core functionality)
   - Asset preloading
   - Service implementations
   - Performance optimizations

3. **Low Priority** (Nice to have)
   - Developer tools
   - Advanced optimizations
   - Extra documentation

## Migration Checklist

When migrating a component:

1. [ ] Identify all store dependencies
2. [ ] Map to new domain stores
3. [ ] Move business logic to services
4. [ ] Update imports
5. [ ] Test functionality
6. [ ] Update types
7. [ ] Add error handling

## Breaking Changes

The following changes will break existing code:

1. `useGameStore` is replaced by domain stores
2. Direct state mutations must use store actions
3. Asset loading is now asynchronous
4. Some type names have changed
5. Constants are reorganized

## Rollback Plan

If issues arise:

1. Keep original files in `src/legacy/`
2. Use feature flags for gradual migration
3. Maintain compatibility layer during transition
4. Document all breaking changes

## Success Metrics

- [ ] All TypeScript errors resolved
- [ ] No `any` types in core code
- [ ] All tests passing
- [ ] Performance improved or maintained
- [ ] Code coverage > 80%
- [ ] Bundle size reduced
- [ ] Load time < 3 seconds

## Next Steps

1. Start with completing the domain stores
2. Migrate one component at a time
3. Test each migration thoroughly
4. Update documentation as you go
5. Get feedback from team

## Notes

- Prioritize maintaining game functionality
- Make incremental changes
- Test frequently
- Keep the game playable during refactoring
- Document decisions and trade-offs