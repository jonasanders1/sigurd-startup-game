export interface AssetManifest {
  images: Record<string, string>;
  audio: Record<string, string>;
  json?: Record<string, string>;
}

export interface LoadProgress {
  loaded: number;
  total: number;
  percentage: number;
  currentAsset: string;
}

export type LoadProgressCallback = (progress: LoadProgress) => void;

/**
 * AssetLoader handles asynchronous loading of game assets
 */
export class AssetLoader {
  private images: Map<string, HTMLImageElement> = new Map();
  private audio: Map<string, HTMLAudioElement> = new Map();
  private json: Map<string, any> = new Map();
  private basePath: string = '';

  constructor(basePath: string = '') {
    this.basePath = basePath;
  }

  /**
   * Load all assets from a manifest
   */
  async loadManifest(
    manifest: AssetManifest,
    onProgress?: LoadProgressCallback
  ): Promise<void> {
    const totalAssets = 
      Object.keys(manifest.images).length + 
      Object.keys(manifest.audio).length +
      (manifest.json ? Object.keys(manifest.json).length : 0);
    
    let loadedAssets = 0;

    const updateProgress = (assetName: string) => {
      loadedAssets++;
      if (onProgress) {
        onProgress({
          loaded: loadedAssets,
          total: totalAssets,
          percentage: (loadedAssets / totalAssets) * 100,
          currentAsset: assetName,
        });
      }
    };

    // Load images
    const imagePromises = Object.entries(manifest.images).map(
      async ([key, path]) => {
        const img = await this.loadImage(key, path);
        updateProgress(`image:${key}`);
        return img;
      }
    );

    // Load audio
    const audioPromises = Object.entries(manifest.audio).map(
      async ([key, path]) => {
        const audio = await this.loadAudio(key, path);
        updateProgress(`audio:${key}`);
        return audio;
      }
    );

    // Load JSON
    const jsonPromises = manifest.json
      ? Object.entries(manifest.json).map(async ([key, path]) => {
          const data = await this.loadJSON(key, path);
          updateProgress(`json:${key}`);
          return data;
        })
      : [];

    // Wait for all assets to load
    await Promise.all([
      ...imagePromises,
      ...audioPromises,
      ...jsonPromises,
    ]);
  }

  /**
   * Load a single image
   */
  async loadImage(key: string, path: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.images.set(key, img);
        resolve(img);
      };
      img.onerror = () => reject(new Error(`Failed to load image: ${path}`));
      img.src = `${this.basePath}${path}`;
    });
  }

  /**
   * Load a single audio file
   */
  async loadAudio(key: string, path: string): Promise<HTMLAudioElement> {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      audio.addEventListener('canplaythrough', () => {
        this.audio.set(key, audio);
        resolve(audio);
      }, { once: true });
      audio.onerror = () => reject(new Error(`Failed to load audio: ${path}`));
      audio.src = `${this.basePath}${path}`;
      audio.load();
    });
  }

  /**
   * Load JSON data
   */
  async loadJSON(key: string, path: string): Promise<any> {
    try {
      const response = await fetch(`${this.basePath}${path}`);
      const data = await response.json();
      this.json.set(key, data);
      return data;
    } catch (error) {
      throw new Error(`Failed to load JSON: ${path}`);
    }
  }

  /**
   * Get a loaded image
   */
  getImage(key: string): HTMLImageElement | undefined {
    return this.images.get(key);
  }

  /**
   * Get a loaded audio element
   */
  getAudio(key: string): HTMLAudioElement | undefined {
    return this.audio.get(key);
  }

  /**
   * Get loaded JSON data
   */
  getJSON(key: string): any {
    return this.json.get(key);
  }

  /**
   * Check if an asset is loaded
   */
  hasAsset(type: 'image' | 'audio' | 'json', key: string): boolean {
    switch (type) {
      case 'image':
        return this.images.has(key);
      case 'audio':
        return this.audio.has(key);
      case 'json':
        return this.json.has(key);
      default:
        return false;
    }
  }

  /**
   * Clear all loaded assets
   */
  clear(): void {
    this.images.clear();
    this.audio.clear();
    this.json.clear();
  }
}