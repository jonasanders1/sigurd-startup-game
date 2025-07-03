/**
 * ServiceContainer provides dependency injection for the game.
 * This prevents circular dependencies and makes testing easier.
 */
export class ServiceContainer {
  private static instance: ServiceContainer;
  private services: Map<string, any> = new Map();
  private factories: Map<string, () => any> = new Map();

  private constructor() {}

  static getInstance(): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer();
    }
    return ServiceContainer.instance;
  }

  /**
   * Register a service instance
   */
  register<T>(key: string, service: T): void {
    this.services.set(key, service);
  }

  /**
   * Register a factory function that creates the service lazily
   */
  registerFactory<T>(key: string, factory: () => T): void {
    this.factories.set(key, factory);
  }

  /**
   * Get a service by key
   */
  get<T>(key: string): T {
    // Check if we have an instance
    if (this.services.has(key)) {
      return this.services.get(key);
    }

    // Check if we have a factory
    if (this.factories.has(key)) {
      const factory = this.factories.get(key);
      const service = factory();
      this.services.set(key, service);
      return service;
    }

    throw new Error(`Service not found: ${key}`);
  }

  /**
   * Check if a service exists
   */
  has(key: string): boolean {
    return this.services.has(key) || this.factories.has(key);
  }

  /**
   * Clear all services (useful for testing)
   */
  clear(): void {
    this.services.clear();
    this.factories.clear();
  }
}

// Service keys as constants to avoid typos
export const ServiceKeys = {
  GAME_MANAGER: 'GameManager',
  INPUT_MANAGER: 'InputManager',
  RENDER_MANAGER: 'RenderManager',
  AUDIO_MANAGER: 'AudioManager',
  COLLISION_MANAGER: 'CollisionManager',
  COIN_MANAGER: 'CoinManager',
  BOMB_MANAGER: 'BombManager',
  ANIMATION_CONTROLLER: 'AnimationController',
  ASSET_LOADER: 'AssetLoader',
  PLAYER_SERVICE: 'PlayerService',
  LEVEL_SERVICE: 'LevelService',
  GAME_STORE: 'GameStore',
} as const;

export type ServiceKey = typeof ServiceKeys[keyof typeof ServiceKeys];