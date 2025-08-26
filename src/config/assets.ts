// Asset configuration using Vite's import.meta.glob
// Works in dev, local install, and production (Vercel CDN)

import { log } from '../lib/logger';

// Preload all backgrounds and audio as URLs
const backgrounds = import.meta.glob(
  '../assets/maps-bg-images/*.png',
  { eager: true }
) as Record<string, { default: string }>;

const audioFiles = import.meta.glob(
  '../assets/audio/*.{wav,mp3}',
  { eager: true }
) as Record<string, { default: string }>;

// Preload all sprite images as URLs
const spriteImages = import.meta.glob(
  '../assets/**/*.png',
  { eager: true }
) as Record<string, { default: string }>;

// Cache to avoid repeated lookups
const assetCache = new Map<string, string>();

// --- Backgrounds ---
export const getBackgroundImagePath = (theme: string): string => {
  const cacheKey = `bg-${theme}`;
  if (assetCache.has(cacheKey)) return assetCache.get(cacheKey)!;

  // console.log(`🔍 Looking for background theme: ${theme}`);
  // console.log(`🔍 Available background paths:`, Object.keys(backgrounds));

  // Find by filename (works after Vite build)
  const match = Object.entries(backgrounds).find(([path]) =>
    path.endsWith(`${theme}.png`)
  );

  // console.log(`🔍 Match found:`, match);

  if (match) {
    const url = match[1].default;
    assetCache.set(cacheKey, url);
    // console.log(`✅ Background image loaded for ${theme}:`, url);
    return url;
  }

  log.asset(`Background image not found for theme: ${theme}`);
  return '';
};

// --- Audio ---
export const getAudioPath = (name: string): string => {
  const cacheKey = `audio-${name}`;
  if (assetCache.has(cacheKey)) return assetCache.get(cacheKey)!;

  // console.log(`🔍 Looking for audio file: ${name}`);
  // console.log(`🔍 Available audio paths:`, Object.keys(audioFiles));

  // Find by filename with or without extension
  const match = Object.entries(audioFiles).find(([path]) => {
    const filename = path.split('/').pop() || '';
    const nameWithoutExt = filename.replace(/\.(wav|mp3)$/, '');
    return filename === name || 
           filename === `${name}.wav` || 
           filename === `${name}.mp3` || 
           nameWithoutExt === name ||
           filename.startsWith(name);
  });

  // console.log(`🔍 Audio match found:`, match);

  if (match) {
    const url = match[1].default;
    assetCache.set(cacheKey, url);
    // console.log(`✅ Audio file loaded for ${name}:`, url);
    return url;
  }

  log.asset(`Audio file not found: ${name}`);
  return '';
};

// --- Sprites ---
export const getSpriteImagePath = (path: string): string => {
  const cacheKey = `sprite-${path}`;
  if (assetCache.has(cacheKey)) return assetCache.get(cacheKey)!;

  // Find by path (e.g., "bomb/bomb1.png")
  const match = Object.entries(spriteImages).find(([filePath]) =>
    filePath.endsWith(path)
  );

  if (match) {
    const url = match[1].default;
    assetCache.set(cacheKey, url);
    return url;
  }

  log.asset(`Sprite not found: ${path}`);
  return '';
};

export const loadSpriteImage = (path: string): HTMLImageElement => {
  const url = getSpriteImagePath(path);
  const img = new Image();
  
  if (url) {
    img.src = url;
  } else {
    // Return a broken image as fallback
    img.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  }
  
  return img;
};

// --- Debug helper ---
export const debugAssetPaths = () => {
  log.debug('Asset Debug');
  log.debug('  Backgrounds loaded:', Object.keys(backgrounds));
  log.debug('  Audio loaded:', Object.keys(audioFiles));
  log.debug('  Sprites loaded:', Object.keys(spriteImages));
  log.debug('  Cache size:', assetCache.size);
  log.debug('  Backgrounds object:', backgrounds);
  log.debug('  Audio files object:', audioFiles);
  log.debug('  Sprites object:', spriteImages);
  log.debug('  Current working directory:', import.meta.url);
};

// Legacy support functions (for backward compatibility)
export const ASSET_PATHS = {
  audio: "/audio",
  images: "/assets",
};

export const getAssetPath = (path: string): string => {
  if (path.startsWith("/")) {
    path = path.substring(1);
  }
  return `/${path}`;
};

export const getImagePath = (path: string): string => {
  return getAssetPath(`assets/${path}`);
};
