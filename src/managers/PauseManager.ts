import { logger } from "../lib/logger";

export interface PauseState {
  isPaused: boolean;
  pauseStartTime: number;
  totalPausedTime: number;
  pauseReasons: Set<string>;
}

export class PauseManager {
  private static instance: PauseManager;
  private pauseState: PauseState;
  private startTime: number = 0;

  private constructor() {
    this.pauseState = this.createPauseState();
  }

  public static getInstance(): PauseManager {
    if (!PauseManager.instance) {
      PauseManager.instance = new PauseManager();
    }
    return PauseManager.instance;
  }

  // ===== INITIALIZATION =====
  public start(): void {
    this.startTime = Date.now();
    this.pauseState = this.createPauseState();
    logger.debug("PauseManager: Started");
  }

  private createPauseState(): PauseState {
    return {
      isPaused: false,
      pauseStartTime: 0,
      totalPausedTime: 0,
      pauseReasons: new Set(),
    };
  }

  // ===== PAUSE MANAGEMENT =====
  public pause(reason: string = "default"): void {
    if (!this.pauseState.isPaused) {
      this.pauseState.isPaused = true;
      this.pauseState.pauseStartTime = Date.now();
      logger.debug(`PauseManager: Paused (reason: ${reason})`);
    }
    this.pauseState.pauseReasons.add(reason);
  }

  public resume(reason: string = "default"): void {
    this.pauseState.pauseReasons.delete(reason);
    
    if (this.pauseState.pauseReasons.size === 0 && this.pauseState.isPaused) {
      const pauseDuration = Date.now() - this.pauseState.pauseStartTime;
      this.pauseState.totalPausedTime += pauseDuration;
      this.pauseState.isPaused = false;
      logger.debug(`PauseManager: Resumed (paused for ${(pauseDuration / 1000).toFixed(1)}s)`);
    }
  }

  public isPaused(): boolean {
    return this.pauseState.isPaused;
  }

  public getPauseReasons(): string[] {
    return Array.from(this.pauseState.pauseReasons);
  }

  public hasPauseReason(reason: string): boolean {
    return this.pauseState.pauseReasons.has(reason);
  }

  // ===== TIME CALCULATIONS =====
  public getAdjustedTime(): number {
    const currentTime = Date.now();
    const actualElapsed = currentTime - this.startTime;
    return actualElapsed - this.pauseState.totalPausedTime;
  }

  public getTimeElapsed(): number {
    return this.getAdjustedTime() / 1000; // Return in seconds
  }

  public getTotalPausedTime(): number {
    return this.pauseState.totalPausedTime;
  }

  // ===== UTILITY METHODS =====
  public reset(): void {
    this.startTime = Date.now();
    this.pauseState = this.createPauseState();
    logger.debug("PauseManager: Reset");
  }

  public cleanup(): void {
    this.pauseState = this.createPauseState();
    this.startTime = 0;
  }

  public getStatus(): any {
    return {
      isPaused: this.pauseState.isPaused,
      pauseReasons: this.getPauseReasons(),
      totalPausedTime: this.pauseState.totalPausedTime,
      timeElapsed: this.getTimeElapsed(),
    };
  }
} 