// Export all public types and interfaces
export type { GameElementInterface } from '../game-wrapper';

// React component types
export interface SigurdGameReactProps {
  className?: string;
  style?: React.CSSProperties;
  onGameLoad?: () => void;
  onGameError?: (error: Error) => void;
} 