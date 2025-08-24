import { logger } from "../lib/logger";
import { getBackgroundImagePath } from "../config/assets";
import { RENDERING_CONFIG } from "@/config/game";
import { DEV_CONFIG } from "@/config/dev";

interface BackgroundImage {
  image: HTMLImageElement;
  isLoaded: boolean;
}

// Map human-readable map names to custom background image files
const MAP_NAME_TO_BACKGROUND_MAP: Record<string, string> = {
  "startup lab": "startup-lab",
  nav: "nav",
  skatteetaten: "skatteetaten",
  "innovasjon norge": "innovasjon-norge",
  kommunehuset: "kommunehuset",
  "alltinn norge": "alltinn-norge",
  "silicone vally": "silicone-vally",
  default: "startup-lab",
};

export class BackgroundManager {
  private currentBackground: BackgroundImage | null = null;
  private isLoading: boolean = false;
  private canvasWidth: number;
  private canvasHeight: number;
  private currentMapName: string = "";

  constructor(canvasWidth: number, canvasHeight: number) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
  }

  // Load background based on map name
  loadMapBackground(mapName: string): void {
    if (this.isLoading) return; // Prevent multiple simultaneous loads

    this.currentMapName = mapName;
    this.isLoading = true;

    // Clear existing background
    if (this.currentBackground) {
      this.currentBackground.image.src = "";
      this.currentBackground = null;
    }

    // Start loading in background - doesn't block game loop
    this.loadBackgroundAsync(mapName).catch((error) => {
      logger.error("BackgroundManager: Failed to load background:", error);
      this.isLoading = false;
    });
  }

  private async loadBackgroundAsync(mapName: string): Promise<void> {
    try {
      this.isLoading = true;

      const themeName = MAP_NAME_TO_BACKGROUND_MAP[mapName];
      if (!themeName) {
        logger.warn(
          `BackgroundManager: No background image found for map: ${mapName}, using fallback`
        );
        this.isLoading = false;
        return;
      }

      const imagePath = await getBackgroundImagePath(themeName);
      const image = await this.loadImage(imagePath);

      this.currentBackground = {
        image: image,
        isLoaded: true,
      };

      this.isLoading = false;
      logger.asset(`Background loaded: ${mapName}`);
    } catch (error) {
      logger.error(
        "BackgroundManager: Failed to load background image:",
        error
      );
      this.isLoading = false;
    }
  }

  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
      img.src = src;
    });
  }

  render(ctx: CanvasRenderingContext2D): void {
    // Import RENDERING_CONFIG at the top of the file:
    // import { RENDERING_CONFIG } from "../config/game";

    if (
      !this.currentBackground ||
      !this.currentBackground.isLoaded ||
      !RENDERING_CONFIG.USE_SPRITES
    ) {
      // Show loading state
      if (this.isLoading) {
        this.renderLoading(ctx);
      } else {
        // Fallback: render a simple gradient background
        this.renderFallback(ctx);
      }
      return;
    }

    const image = this.currentBackground.image;

    // Calculate scale to fit the canvas exactly (crop if necessary)
    const scaleX = this.canvasWidth / image.width;
    const scaleY = this.canvasHeight / image.height;
    const scale = Math.max(scaleX, scaleY); // Use max to ensure full coverage

    const scaledWidth = image.width * scale;
    const scaledHeight = image.height * scale;

    // Calculate offset to center the image if it's larger than canvas
    const offsetX = (scaledWidth - this.canvasWidth) / 2;
    const offsetY = (scaledHeight - this.canvasHeight) / 2;

    // Draw the image cropped to canvas dimensions
    ctx.drawImage(image, -offsetX, -offsetY, scaledWidth, scaledHeight);
  }

  private renderLoading(ctx: CanvasRenderingContext2D): void {
    // Create a loading background that matches the game's theme
    const gradient = ctx.createLinearGradient(0, 0, 0, this.canvasHeight);
    gradient.addColorStop(0, "#262521"); // Dark background
    gradient.addColorStop(1, "#484744"); // Slightly lighter

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

    // Add loading text
    ctx.fillStyle = "#ffffff";
    ctx.font = "16px JetBrains Mono";
    ctx.textAlign = "center";
    ctx.fillText(
      "Laster bakgrunn...",
      this.canvasWidth / 2,
      this.canvasHeight / 2
    );
  }

  private renderFallback(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = DEV_CONFIG.COLORS.BACKGROUND;
    ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
  }

  isReady(): boolean {
    return this.currentBackground?.isLoaded || false;
  }

  isCurrentlyLoading(): boolean {
    return this.isLoading;
  }

  getCurrentTheme(): string {
    return this.currentMapName;
  }

  // Get the current map name
  getCurrentMapName(): string {
    return this.currentMapName;
  }

  // Get list of available background images
  static getAvailableBackgrounds(): string[] {
    return Object.values(MAP_NAME_TO_BACKGROUND_MAP);
  }

  // Get the map name mapping for debugging
  static getMapNameMapping(): Record<string, string> {
    return { ...MAP_NAME_TO_BACKGROUND_MAP };
  }

  // Preload all background images to prevent flashing
  static async preloadAllBackgrounds(): Promise<void> {
    logger.asset("Starting background preloading...");
    const backgrounds = Object.keys(MAP_NAME_TO_BACKGROUND_MAP);
    let loadedCount = 0;

    const preloadPromises = backgrounds.map(async (mapName) => {
      try {
        const themeName = MAP_NAME_TO_BACKGROUND_MAP[mapName];
        if (!themeName) return;

        // Use the new asset loading system
        const imagePath = getBackgroundImagePath(themeName);
        if (!imagePath) return;

        const img = new Image();
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = imagePath;
        });
        loadedCount++;
        // Only log every 2nd background to reduce spam
        if (loadedCount % 2 === 0 || loadedCount === backgrounds.length) {
          logger.asset(
            `Preloaded ${loadedCount}/${backgrounds.length} backgrounds`
          );
        }
      } catch (error) {
        logger.warn(`Failed to preload background: ${mapName}`);
      }
    });

    await Promise.all(preloadPromises);
    logger.asset(
      `Background preloading complete! Loaded ${loadedCount}/${backgrounds.length} backgrounds.`
    );
  }
}
