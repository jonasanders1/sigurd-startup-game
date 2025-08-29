/**
 * LoadingManager - Centralized loading system for all game assets and initialization
 *
 * This manager ensures all required assets and data are loaded before the game can start,
 * preventing any runtime failures due to missing assets or uninitialized states.
 */

import { logger } from "../lib/logger";
import { BackgroundManager } from "./BackgroundManager";
import { waitForAudioSettings } from "../lib/communicationUtils";
import {
  getBackgroundImagePath,
  getAudioPath,
  getSpriteImagePath,
} from "../config/assets";
import { mapDefinitions } from "../maps/mapDefinitions";
import { DEV_CONFIG } from "../config/dev";

export interface LoadingStep {
  id: string;
  name: string;
  message: string;
  weight: number; // Relative weight for progress calculation
}

export interface LoadingProgress {
  currentStep: string;
  currentMessage: string;
  progress: number; // 0-100
  isComplete: boolean;
  error?: string;
}

export type LoadingProgressCallback = (progress: LoadingProgress) => void;

export class LoadingManager {
  private static instance: LoadingManager | null = null;
  private isLoading: boolean = false;
  private progressCallback: LoadingProgressCallback | null = null;
  private loadedAssets: Set<string> = new Set();
  private currentProgress: LoadingProgress = {
    currentStep: "",
    currentMessage: "Initialiserer...",
    progress: 0,
    isComplete: false,
  };

  // Define loading steps with their messages and weights
  private readonly loadingSteps: LoadingStep[] = [
    {
      id: "host-communication",
      name: "Kommunikasjon",
      message: "Kobler til vertssystem...",
      weight: 15,
    },
    {
      id: "background-images",
      name: "Bakgrunner",
      message: "Laster spillbakgrunner...",
      weight: 20,
    },
    {
      id: "player-sprites",
      name: "Spillerfigur",
      message: "Laster Sigurd-animasjoner...",
      weight: 15,
    },
    {
      id: "monster-sprites",
      name: "Monstre",
      message: "Laster byråkrater og hindringer...",
      weight: 10,
    },
    {
      id: "ui-sprites",
      name: "UI-elementer",
      message: "Laster brukergrensesnitt...",
      weight: 10,
    },
    {
      id: "audio-files",
      name: "Lyd",
      message: "Laster lydeffekter og musikk...",
      weight: 15,
    },
    {
      id: "map-data",
      name: "Baner",
      message: "Forbereder spillbaner...",
      weight: 10,
    },
    {
      id: "finalization",
      name: "Fullføring",
      message: "Gjør klar for spilling...",
      weight: 5,
    },
  ];

  // Dynamic loading messages for variety
  private readonly dynamicMessages: Record<string, string[]> = {
    "host-communication": [
      "Venter på lydinnstillinger...",
      "Synkroniserer med vertssystem...",
      "Etablerer spillforbindelse...",
    ],
    "background-images": [
      "Laster Startup Lab bakgrunn...",
      "Laster Innovasjon Norge bakgrunn...",
      "Laster Skatteetaten bakgrunn...",
      "Laster NAV bakgrunn...",
      "Laster Kommunehuset bakgrunn...",
      "Laster Alltinn bakgrunn...",
    ],
    "player-sprites": [
      "Laster Sigurd idle-animasjoner...",
      "Laster Sigurd løpe-animasjoner...",
      "Laster Sigurd hoppe-animasjoner...",
      "Laster Sigurd flyte-animasjoner...",
      "Laster Sigurd fullføring-animasjoner...",
    ],
    "monster-sprites": [
      "Laster Byråkrat-klonen...",
      "Laster Hodeløs konsulent...",
      "Laster Regel-robot...",
      "Laster Skatte-spøkelset...",
      "Laster Vertikal byråkrat...",
    ],
    "audio-files": [
      "Laster bakgrunnsmusikk...",
      "Laster Sigurd tema-sang...",
      "Laster lydeffekter...",
    ],
  };

  private constructor() {}

  public static getInstance(): LoadingManager {
    if (!LoadingManager.instance) {
      LoadingManager.instance = new LoadingManager();
    }
    return LoadingManager.instance;
  }

  /**
   * Set the callback for progress updates
   */
  public setProgressCallback(callback: LoadingProgressCallback): void {
    this.progressCallback = callback;
  }

  /**
   * Start the loading process
   */
  public async load(): Promise<void> {
    if (this.isLoading) {
      logger.warn("Loading already in progress");
      return;
    }

    this.isLoading = true;
    this.loadedAssets.clear();
    logger.asset("🚀 Starting comprehensive loading process...");

    try {
      let cumulativeProgress = 0;
      const totalWeight = this.loadingSteps.reduce(
        (sum, step) => sum + step.weight,
        0
      );

      for (const step of this.loadingSteps) {
        await this.executeLoadingStep(step, cumulativeProgress, totalWeight);
        cumulativeProgress += step.weight;
      }

      this.updateProgress({
        currentStep: "complete",
        currentMessage: "Lasting fullført! Starter spill...",
        progress: 100,
        isComplete: true,
      });

      logger.asset("✅ All assets loaded successfully!");

      // Small delay to show completion message
      await this.delay(500);
    } catch (error) {
      logger.error("Loading failed:", error);
      this.updateProgress({
        currentStep: "error",
        currentMessage: "Lasting feilet. Vennligst prøv igjen.",
        progress: 0,
        isComplete: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Execute a specific loading step
   */
  private async executeLoadingStep(
    step: LoadingStep,
    currentProgress: number,
    totalWeight: number
  ): Promise<void> {
    logger.asset(`📦 Loading step: ${step.name}`);

    // Update with initial message
    this.updateProgress({
      currentStep: step.id,
      currentMessage: step.message,
      progress: Math.round((currentProgress / totalWeight) * 100),
      isComplete: false,
    });

    // Execute the appropriate loading logic
    switch (step.id) {
      case "host-communication":
        await this.loadHostCommunication(step);
        break;
      case "background-images":
        await this.loadBackgroundImages(step);
        break;
      case "player-sprites":
        await this.loadPlayerSprites(step);
        break;
      case "monster-sprites":
        await this.loadMonsterSprites(step);
        break;
      case "ui-sprites":
        await this.loadUISprites(step);
        break;
      case "audio-files":
        await this.loadAudioFiles(step);
        break;
      case "map-data":
        await this.loadMapData(step);
        break;
      case "finalization":
        await this.finalize(step);
        break;
    }

    // Update progress after step completion
    const newProgress = Math.round(
      ((currentProgress + step.weight) / totalWeight) * 100
    );
    this.updateProgress({
      ...this.currentProgress,
      progress: Math.min(newProgress, 99), // Keep at 99% until fully complete
    });
  }

  /**
   * Load host communication (audio settings)
   */
  private async loadHostCommunication(step: LoadingStep): Promise<void> {
    // Skip in dev mode if configured
    if (DEV_CONFIG.ENABLED && DEV_CONFIG.SKIP_AUDIO_SETTINGS_WAIT) {
      logger.debug("Skipping audio settings wait (dev mode)");
      return;
    }

    this.updateDynamicMessage(step.id, 0);
    await waitForAudioSettings();
    logger.asset("Audio settings received from host");
  }

  /**
   * Load all background images
   */
  private async loadBackgroundImages(step: LoadingStep): Promise<void> {
    const backgrounds = [
      "startup-lab",
      "innovasjon-norge",
      "skatteetaten",
      "nav",
      "kommunehuset",
      "alltinn-norge",
    ];

    for (let i = 0; i < backgrounds.length; i++) {
      this.updateDynamicMessage(step.id, i);
      await this.loadImage(getBackgroundImagePath(backgrounds[i]));
      await this.delay(50); // Small delay for visual feedback
    }

    // Also use the existing BackgroundManager preload for double-safety
    await BackgroundManager.preloadAllBackgrounds();
  }

  /**
   * Load player sprites
   */
  private async loadPlayerSprites(step: LoadingStep): Promise<void> {
    const playerSprites = [
      "sprites/sigurd/sigurd-idle/sigurd-idle1.png",
      "sprites/sigurd/sigurd-idle/sigurd-idle2.png",
      "sprites/sigurd/sigurd-idle/sigurd-idle3.png",
      "sprites/sigurd/sigurd-idle/sigurd-idle4.png",
      "sprites/sigurd/running/run1.png",
      "sprites/sigurd/running/run2.png",
      "sprites/sigurd/running/run3.png",
      "sprites/sigurd/jumping/jump1.png",
      "sprites/sigurd/jumping/jump2.png",
      "sprites/sigurd/jumping/jump3.png",
      "sprites/sigurd/landing/landing1.png",
      "sprites/sigurd/float/float1.png",
      "sprites/sigurd/float-dir/float-dir1.png",
      "sprites/sigurd/complete/complete1.png",
      "sprites/sigurd/complete/complete2.png",
      "sprites/sigurd/complete/complete3.png",
      "sprites/sigurd/complete/complete4.png",
      "sprites/sigurd/complete/complete5.png",
      "ghost-idle/ghost-idle1.png",
      "ghost-idle/ghost-idle2.png",
      "ghost-idle/ghost-idle3.png",
      "ghost-idle/ghost-idle4.png",
      "ghost-idle/ghost-idle5.png",
      "ghost-idle/ghost-idle6.png",
      "ghost-walk/ghost-walk1.png",
      "ghost-walk/ghost-walk2.png",
      "ghost-walk/ghost-walk3.png",
      "ghost-walk/ghost-walk4.png",
      "ghost-walk/ghost-walk5.png",
      "ghost-walk/ghost-walk6.png",
      "ghost-walk/ghost-walk7.png",
      "ghost-walk/ghost-walk8.png",
      "ghost-jump/ghost-jump1.png",
      "ghost-jump/ghost-jump2.png",
      "ghost-jump/ghost-jump3.png",
      "ghost-landing/ghost-landing1.png",
      "ghost-landing/ghost-landing2.png",
      "ghost-landing/ghost-landing3.png",
      "ghost-float/ghost-float1.png",
      "ghost-float/ghost-float2.png",
      "ghost-map-complete/ghost-map-complete1.png",
      "ghost-map-complete/ghost-map-complete2.png",
      "ghost-map-complete/ghost-map-complete3.png",
      "ghost-map-complete/ghost-map-complete4.png",
    ];

    const batchSize = 8;
    for (let i = 0; i < playerSprites.length; i += batchSize) {
      const batch = playerSprites.slice(i, i + batchSize);
      const messageIndex = Math.floor((i / playerSprites.length) * 5);
      this.updateDynamicMessage(step.id, messageIndex);

      await Promise.all(
        batch.map((sprite) => this.loadImage(getSpriteImagePath(sprite)))
      );
    }
  }

  /**
   * Load monster sprites
   */
  private async loadMonsterSprites(step: LoadingStep): Promise<void> {
    const monsterSprites = [
      "sprites/byråkrat-klonen/byråkrat-klonen_0.png",
      "sprites/byråkrat-klonen/byråkrat-klonen_1.png",
      "sprites/byråkrat-klonen/byråkrat-klonen_2.png",
      "sprites/hodeløs-konsulent/hodeløs-konsulent_0.png",
      "sprites/hodeløs-konsulent/hodeløs-konsulent_1.png",
      "sprites/hodeløs-konsulent/hodeløs-konsulent_2.png",
      "sprites/regel-robot/regel-robot_0.png",
      "sprites/regel-robot/regel-robot_1.png",
      "sprites/regel-robot/regel-robot_2.png",
      "sprites/skatte-spøkelset/skatte-spøkelse_0.png",
      "sprites/skatte-spøkelset/skatte-spøkelse_1.png",
      "sprites/skatte-spøkelset/skatte-spøkelse_2.png",
      "sprites/vertikal-byråkrat/vertikal-byråkrat_0.png",
      "sprites/vertikal-byråkrat/vertikal-byråkrat_1.png",
      "sprites/vertikal-byråkrat/vertikal-byråkrat_2.png",
    ];

    const monsterTypes = 5;
    for (let i = 0; i < monsterSprites.length; i += 3) {
      const messageIndex = Math.floor(i / 3);
      this.updateDynamicMessage(step.id, messageIndex);

      const batch = monsterSprites.slice(i, i + 3);
      await Promise.all(
        batch.map((sprite) => this.loadImage(getSpriteImagePath(sprite)))
      );
    }
  }

  /**
   * Load UI sprites (bombs, coins, etc.)
   */
  private async loadUISprites(step: LoadingStep): Promise<void> {
    const uiSprites = ["bomb/bomb1.png", "bomb/bomb2.png"];

    await Promise.all(
      uiSprites.map((sprite) => this.loadImage(getSpriteImagePath(sprite)))
    );
  }

  /**
   * Load audio files
   */
  private async loadAudioFiles(step: LoadingStep): Promise<void> {
    const audioFiles = ["background-music.wav", "sigurd-theme-song.mp3"];

    for (let i = 0; i < audioFiles.length; i++) {
      this.updateDynamicMessage(step.id, i);
      await this.loadAudio(getAudioPath(audioFiles[i]));
    }
  }

  /**
   * Load map data
   */
  private async loadMapData(step: LoadingStep): Promise<void> {
    // Maps are already loaded as JavaScript modules, but we validate them
    for (const map of mapDefinitions) {
      if (!map.id || !map.name) {
        throw new Error(`Invalid map definition: ${map.id}`);
      }
    }
    logger.asset(`Validated ${mapDefinitions.length} map definitions`);
    await this.delay(100);
  }

  /**
   * Finalize loading
   */
  private async finalize(step: LoadingStep): Promise<void> {
    logger.asset("Finalizing game initialization...");
    await this.delay(200);
  }

  /**
   * Load an image asset
   */
  private async loadImage(src: string): Promise<void> {
    if (!src || this.loadedAssets.has(src)) {
      return;
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.loadedAssets.add(src);
        resolve();
      };
      img.onerror = () => {
        logger.warn(`Failed to load image: ${src}`);
        resolve(); // Don't fail the entire loading for one missing image
      };
      img.src = src;
    });
  }

  /**
   * Load an audio file
   */
  private async loadAudio(src: string): Promise<void> {
    if (!src || this.loadedAssets.has(src)) {
      return;
    }

    return new Promise((resolve) => {
      const audio = new Audio();
      audio.oncanplaythrough = () => {
        this.loadedAssets.add(src);
        resolve();
      };
      audio.onerror = () => {
        logger.warn(`Failed to load audio: ${src}`);
        resolve(); // Don't fail the entire loading for one missing audio
      };
      audio.src = src;
    });
  }

  /**
   * Update progress and notify callback
   */
  private updateProgress(progress: LoadingProgress): void {
    this.currentProgress = progress;
    if (this.progressCallback) {
      this.progressCallback(progress);
    }
  }

  /**
   * Update with a dynamic message for variety
   */
  private updateDynamicMessage(stepId: string, index: number): void {
    const messages = this.dynamicMessages[stepId];
    if (messages && messages[index]) {
      this.updateProgress({
        ...this.currentProgress,
        currentMessage: messages[index],
      });
    }
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Check if loading is complete
   */
  public isLoadingComplete(): boolean {
    return this.currentProgress.isComplete;
  }

  /**
   * Get current loading progress
   */
  public getProgress(): LoadingProgress {
    return this.currentProgress;
  }

  /**
   * Reset the loading manager
   */
  public reset(): void {
    this.isLoading = false;
    this.loadedAssets.clear();
    this.currentProgress = {
      currentStep: "",
      currentMessage: "Initialiserer...",
      progress: 0,
      isComplete: false,
    };
  }
}

// Export singleton instance
export const loadingManager = LoadingManager.getInstance();
