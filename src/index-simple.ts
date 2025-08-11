// Simple exports for testing - no React components
import './game-wrapper';

// Basic exports
export { GameElement } from './game-wrapper';
export type { GameElementInterface } from './game-wrapper';
export { getVersion, logVersion } from './version';

// Export the custom element name for reference
export const CUSTOM_ELEMENT_NAME = 'sigurd-startup'; 