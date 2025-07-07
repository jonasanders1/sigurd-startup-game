import { GAME_CONFIG } from '../types/constants';

interface ParallaxLayer {
  image: HTMLImageElement;
  speed: number; // How fast this layer moves relative to player (0 = static, 1 = same as player)
  x: number;
  y: number;
  width: number;
  height: number;
  layerNumber: number; // Original layer number for speed calculation
}

// Map human-readable map names to folder names (sanitized for file system)
const MAP_NAME_TO_FOLDER_MAP: Record<string, string> = {
  'Taco Street': 'taco-street',
  'The Future City': 'future-city',
  'Mountain Peak': 'mountain',
  'Valley of Shadows': 'valley',
  'Future City 2': 'future-city-2',
  'Ocean Depths': 'ocean',
};

export class ParallaxManager {
  private layers: ParallaxLayer[] = [];
  private cityTheme: string = 'city 1';
  private isLoaded: boolean = false;
  private isLoading: boolean = false;
  private canvasWidth: number;
  private canvasHeight: number;

  constructor(canvasWidth: number, canvasHeight: number) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
  }

  // Load background based on map name
  loadMapBackground(mapName: string): void {
    // If the mapName is already a folder name (like 'taco-street', 'future-city', etc.), use it directly
    // Otherwise, look it up in the mapping
    const folderName = MAP_NAME_TO_FOLDER_MAP[mapName] || mapName || 'taco-street'; // Default to taco-street if not found
    this.loadCityTheme(folderName);
  }

  // Preload all map backgrounds to prevent flashing
  static async preloadAllBackgrounds(): Promise<void> {
    console.log('Starting background preloading...');
    const themes = Object.values(MAP_NAME_TO_FOLDER_MAP);
    let loadedCount = 0;
    
    const preloadPromises = themes.map(async (theme) => {
      try {
        const manager = new ParallaxManager(800, 600); // Default size for preloading
        manager.cityTheme = theme; // Set the theme before loading
        await manager.loadCityThemeAsync(theme);
        loadedCount++;
        console.log(`Preloaded background: ${theme} (${loadedCount}/${themes.length})`);
      } catch (error) {
        console.warn(`Failed to preload background: ${theme}`, error);
      }
    });
    
    await Promise.all(preloadPromises);
    console.log(`Background preloading complete! Loaded ${loadedCount}/${themes.length} themes.`);
  }

  // Non-blocking async loading - doesn't affect game loop
  loadCityTheme(cityName: string): void {
    if (this.isLoading) return; // Prevent multiple simultaneous loads
    
    // Clear existing layers before loading new ones
    this.clearLayers();
    
    this.cityTheme = cityName;
    this.isLoading = true;
    this.isLoaded = false;

    // Start loading in background - doesn't block game loop
    this.loadCityThemeAsync(cityName).catch(error => {
      console.error('ParallaxManager: Failed to load city theme:', error);
      this.isLoaded = false;
      this.isLoading = false;
    });
  }

  private async loadCityThemeAsync(cityName: string): Promise<void> {
    try {
      // First, detect which layers exist for this city
      const existingLayers = await this.detectExistingLayers();
      
      if (existingLayers.length === 0) {
        throw new Error(`No layers found for city theme: ${cityName}`);
      }

      // Load only the layers that exist
      const layerPromises = existingLayers.map(layerNumber => this.createLayer(layerNumber));
      await Promise.all(layerPromises);
      
      // Calculate speeds based on layer numbers and total count
      this.calculateLayerSpeeds();
      
      this.isLoaded = true;
      this.isLoading = false;
      console.log(`ParallaxManager: Loaded ${this.layers.length} layers for ${cityName} (layers: ${existingLayers.join(', ')})`);
    } catch (error) {
      console.error('ParallaxManager: Failed to load city theme:', error);
      this.isLoaded = false;
      this.isLoading = false;
    }
  }

  private async detectExistingLayers(): Promise<number[]> {
    const existingLayers: number[] = [];
    
    // Check layers 1-10 to see which ones exist
    const checkPromises = [];
    for (let i = 1; i <= 10; i++) {
      checkPromises.push(this.checkLayerExists(i));
    }
    
    const results = await Promise.all(checkPromises);
    
    for (let i = 0; i < results.length; i++) {
      if (results[i]) {
        existingLayers.push(i + 1);
      }
    }
    
    return existingLayers;
  }

  private async checkLayerExists(layerNumber: number): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = `/assets/map-images/${this.cityTheme}/${layerNumber}.png`;
    });
  }

  private calculateLayerSpeeds(): void {
    if (this.layers.length === 0) return;
    
    // Sort layers by layer number to ensure proper ordering
    this.layers.sort((a, b) => a.layerNumber - b.layerNumber);
    
    // Calculate speeds based on layer position with very subtle range
    // First layer (lowest number) = slowest, last layer (highest number) = fastest
    const totalLayers = this.layers.length;
    
    this.layers.forEach((layer, index) => {
      // Calculate speed from 0 to 0.08 (very subtle effect)
      // This ensures layers move very slowly relative to player
      layer.speed = (index / (totalLayers - 1)) * 0.05;
    });
  }

  private clearLayers(): void {
    // Clear all existing layers and their images
    this.layers.forEach(layer => {
      // Clear the image source to help with garbage collection
      if (layer.image) {
        layer.image.src = '';
      }
    });
    this.layers = [];
    this.isLoaded = false;
  }

  private async createLayer(layerNumber: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.layers.push({
          image: img,
          speed: 0, // Will be calculated after all layers are loaded
          x: 0,
          y: 0,
          width: img.width,
          height: img.height,
          layerNumber: layerNumber
        });
        resolve();
      };
      img.onerror = () => {
        console.warn(`ParallaxManager: Failed to load layer ${layerNumber} for ${this.cityTheme}`);
        reject(new Error(`Failed to load layer ${layerNumber}`));
      };
      
      img.src = `/assets/map-images/${this.cityTheme}/${layerNumber}.png`;
    });
  }

  update(playerX: number, playerY: number): void {
    if (!this.isLoaded) return;

    // Calculate how much the player has moved from center
    const centerX = this.canvasWidth / 2;
    const centerY = this.canvasHeight / 2;
    
    const playerOffsetX = playerX - centerX;
    const playerOffsetY = playerY - centerY;

    // Update each layer's position based on its speed
    this.layers.forEach(layer => {
      // Move layers in opposite direction of player movement for parallax effect
      layer.x = -playerOffsetX * layer.speed;
      layer.y = -playerOffsetY * layer.speed * 0.1; // Very subtle vertical movement
    });
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.isLoaded || this.layers.length === 0) {
      // Show a loading state instead of fallback
      if (this.isLoading) {
        this.renderLoading(ctx);
      } else {
        // Fallback: render a simple gradient background
        this.renderFallback(ctx);
      }
      return;
    }

    // Render layers from back to front (sorted by layer number)
    const sortedLayers = [...this.layers].sort((a, b) => a.layerNumber - b.layerNumber);
    
    sortedLayers.forEach((layer) => {
      // Calculate scale to fit the canvas exactly (crop if necessary)
      const scaleX = this.canvasWidth / layer.width;
      const scaleY = this.canvasHeight / layer.height;
      const scale = Math.max(scaleX, scaleY); // Use max to ensure full coverage
      
      const scaledWidth = layer.width * scale;
      const scaledHeight = layer.height * scale;
      
      // Calculate offset to center the image if it's larger than canvas
      const offsetX = (scaledWidth - this.canvasWidth) / 2;
      const offsetY = (scaledHeight - this.canvasHeight) / 2;
      
      // Calculate parallax offset
      const parallaxX = layer.x * scale;
      const parallaxY = layer.y * scale;
      
      // Calculate final drawing position
      const drawX = -offsetX + parallaxX;
      const drawY = -offsetY + parallaxY;
      
      // Draw the image cropped to canvas dimensions
      ctx.drawImage(
        layer.image,
        drawX, drawY, scaledWidth, scaledHeight
      );
    });
  }

  private renderLoading(ctx: CanvasRenderingContext2D): void {
    // Create a loading background that matches the game's theme
    const gradient = ctx.createLinearGradient(0, 0, 0, this.canvasHeight);
    gradient.addColorStop(0, '#262521'); // Dark background
    gradient.addColorStop(1, '#484744'); // Slightly lighter
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
    
    // Add loading text
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Loading background...', this.canvasWidth / 2, this.canvasHeight / 2);
  }

  private renderFallback(ctx: CanvasRenderingContext2D): void {
    // Create a simple gradient background as fallback
    const gradient = ctx.createLinearGradient(0, 0, 0, this.canvasHeight);
    gradient.addColorStop(0, '#87CEEB'); // Sky blue
    gradient.addColorStop(1, '#4682B4'); // Steel blue
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
  }

  isReady(): boolean {
    return this.isLoaded;
  }

  isCurrentlyLoading(): boolean {
    return this.isLoading;
  }

  getCurrentTheme(): string {
    return this.cityTheme;
  }

  // Get the current map name (e.g., 'Bomb Jack Level 1', 'NAV', etc.)
  getCurrentMapName(): string {
    // Reverse lookup from folder name to map name
    for (const [mapName, folderName] of Object.entries(MAP_NAME_TO_FOLDER_MAP)) {
      if (folderName === this.cityTheme) {
        return mapName;
      }
    }
    return 'unknown'; // Fallback if not found
  }

  // Get list of available city themes
  static getAvailableThemes(): string[] {
    return [
      'city 1', 'city 2', 'city 3', 'city 4', 
      'city 5', 'city 6', 'city 7', 'city 8'
    ];
  }

  // Check if a theme exists
  static async themeExists(themeName: string): Promise<boolean> {
    return new Promise((resolve) => {
      const testImg = new Image();
      testImg.onload = () => resolve(true);
      testImg.onerror = () => resolve(false);
      testImg.src = `/assets/map-images/${themeName}/1.png`;
    });
  }

  // Get the map name mapping for debugging
  static getMapNameMapping(): Record<string, string> {
    return { ...MAP_NAME_TO_FOLDER_MAP };
  }
} 