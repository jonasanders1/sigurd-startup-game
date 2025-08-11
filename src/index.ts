// Import to register the custom element first
import './game-wrapper';

// Main library exports
export { GameElement } from './game-wrapper';
export type { GameElementInterface } from './game-wrapper';
export { getVersion, logVersion } from './version';

// React-specific exports
export { default as SigurdGameReact } from './components/SigurdGameReact';
export { default as SigurdGame } from './components/MainGame'; 