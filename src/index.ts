// Main library exports
export { GameElement } from './game-wrapper';
export type { GameElementInterface } from './game-wrapper';
export { getVersion, logVersion } from './version';

// Export types
export * from './types';

// React-specific exports
export { default as SigurdGame } from './components/MainGame';
export { default as SigurdGameReact } from './components/SigurdGameReact';

// Import to register the custom element
import './game-wrapper'; 