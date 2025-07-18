// Detect if we're in the game's own development environment
// import.meta.env.DEV is true when running the game directly with npm run dev
const isDev = import.meta.env.DEV;

export const ASSET_PATHS = {
  audio: isDev ? '/audio' : '/dist/audio',
  images: isDev ? '/assets' : '/dist/assets'
}; 