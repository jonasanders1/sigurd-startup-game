// Import to register the custom element first
import './game-wrapper';

// Import non-React exports only
import { getVersion, logVersion } from './game-wrapper';
import { ASSET_PATHS, getBackgroundImagePath } from './config/assets';

// Main library exports (non-React only)
export { getVersion, logVersion } from './game-wrapper';
export { ASSET_PATHS, getBackgroundImagePath } from './config/assets';

// Re-export types for convenience
export type { GameState, MenuType } from './types/enums';
export type { 
  GameStateInterface, 
  CoinState, 
  BombCollectionState,
  CoinPhysicsConfig,
  CoinTypeConfig,
  MonsterSpawnConfig
} from './types/interfaces';

// Default export for easy importing
const SigurdStartupGame = {
  getVersion,
  ASSET_PATHS,
  getBackgroundImagePath,
};

export default SigurdStartupGame; 