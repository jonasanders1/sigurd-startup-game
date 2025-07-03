import { AssetManifest } from '../core/AssetLoader';
import { ASSET_PATHS } from './assets';

export const gameAssetManifest: AssetManifest = {
  images: {
    // Player sprites - Idle
    'player-idle-1': `${ASSET_PATHS.images}/sigurd-idle/sigurd-idle1.png`,
    'player-idle-2': `${ASSET_PATHS.images}/sigurd-idle/sigurd-idle2.png`,
    'player-idle-3': `${ASSET_PATHS.images}/sigurd-idle/sigurd-idle3.png`,
    'player-idle-4': `${ASSET_PATHS.images}/sigurd-idle/sigurd-idle4.png`,
    
    // Player sprites - Running
    'player-run-1': `${ASSET_PATHS.images}/running/run1.png`,
    'player-run-2': `${ASSET_PATHS.images}/running/run2.png`,
    'player-run-3': `${ASSET_PATHS.images}/running/run3.png`,
    
    // Player sprites - Jumping
    'player-jump-1': `${ASSET_PATHS.images}/jumping/jump1.png`,
    'player-jump-2': `${ASSET_PATHS.images}/jumping/jump2.png`,
    'player-jump-3': `${ASSET_PATHS.images}/jumping/jump3.png`,
    
    // Player sprites - Landing
    'player-landing-1': `${ASSET_PATHS.images}/landing/landing1.png`,
    
    // Player sprites - Floating
    'player-float-1': `${ASSET_PATHS.images}/float/float1.png`,
    'player-float-dir-1': `${ASSET_PATHS.images}/float-dir/float-dir1.png`,
    
    // Player sprites - Complete
    'player-complete-1': `${ASSET_PATHS.images}/complete/complete1.png`,
    'player-complete-2': `${ASSET_PATHS.images}/complete/complete2.png`,
    'player-complete-3': `${ASSET_PATHS.images}/complete/complete3.png`,
    'player-complete-4': `${ASSET_PATHS.images}/complete/complete4.png`,
    'player-complete-5': `${ASSET_PATHS.images}/complete/complete5.png`,
    
    // Ghost sprites (if needed in future)
    'ghost-idle-1': `${ASSET_PATHS.images}/ghost-Idle/ghost-idle1.png`,
    'ghost-idle-2': `${ASSET_PATHS.images}/ghost-Idle/ghost-idle2.png`,
    'ghost-idle-3': `${ASSET_PATHS.images}/ghost-Idle/ghost-idle3.png`,
    'ghost-idle-4': `${ASSET_PATHS.images}/ghost-Idle/ghost-idle4.png`,
    'ghost-idle-5': `${ASSET_PATHS.images}/ghost-Idle/ghost-idle5.png`,
    'ghost-idle-6': `${ASSET_PATHS.images}/ghost-Idle/ghost-idle6.png`,
    
    // Map backgrounds
    ...Object.fromEntries(
      Array.from({ length: 8 }, (_, i) => {
        const cityNum = i + 1;
        return [
          `city-${cityNum}-bg`,
          `${ASSET_PATHS.images}/map-images/city ${cityNum}/1.png`
        ];
      })
    ),
  },
  
  audio: {
    'background-music': `${ASSET_PATHS.audio}/background-music.wav`,
  },
  
  json: {
    'byrokrati': '/src/data/byrokrati.json',
    'gameover': '/src/data/gameover.json',
  }
};

// Helper to get sprite animation frames
export const getSpriteFrames = (prefix: string, count: number): string[] => {
  return Array.from({ length: count }, (_, i) => `${prefix}-${i + 1}`);
};