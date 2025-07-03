import { GameState } from '../types/enums';

interface ScoreData {
  score: number;
  level: string;
  levelNumber: number;
  lives: number;
  multiplier: number;
}

interface GameCompletionData {
  finalScore: number;
  totalLevels: number;
  completedLevels: number;
  timestamp: number;
  lives: number;
  multiplier: number;
  levelHistory: any[];
  totalCoinsCollected: number;
  totalPowerModeActivations: number;
}

interface MapCompletionData {
  levelName: string;
  completionTime: number;
  score: number;
  bombsCollected: number;
  correctBombs: number;
}

export class CommunicationManager {
  private static instance: CommunicationManager;
  
  private constructor() {}
  
  static getInstance(): CommunicationManager {
    if (!CommunicationManager.instance) {
      CommunicationManager.instance = new CommunicationManager();
    }
    return CommunicationManager.instance;
  }

  sendGameReady(): void {
    this.postMessage('GAME_READY', { timestamp: Date.now() });
  }

  sendScoreToHost(data: ScoreData): void {
    this.postMessage('SCORE_UPDATE', data);
  }

  sendGameStateUpdate(state: GameState, currentMap?: string): void {
    this.postMessage('GAME_STATE_UPDATE', {
      state,
      currentMap,
      timestamp: Date.now(),
    });
  }

  sendMapCompletionData(data: MapCompletionData): void {
    this.postMessage('MAP_COMPLETED', data);
  }

  sendGameCompletionData(data: GameCompletionData): void {
    this.postMessage('GAME_COMPLETED', data);
  }

  private postMessage(type: string, data: any): void {
    try {
      // Check if we're in an iframe
      if (window.parent !== window) {
        window.parent.postMessage(
          {
            type: `SIGURD_${type}`,
            data: data,
          },
          '*'
        );
      }
      
      // Also dispatch as custom event for local listening
      window.dispatchEvent(
        new CustomEvent(`sigurd-${type.toLowerCase().replace(/_/g, '-')}`, {
          detail: data,
        })
      );
    } catch (error) {
      console.error(`Failed to send ${type} message:`, error);
    }
  }
}