// Main library exports
export { GameElement } from './game-wrapper';
export type { GameElementInterface } from './game-wrapper';
export { getVersion, logVersion } from './version';

// Export types
export * from './types';

// Import to register the custom element
import './game-wrapper'; 