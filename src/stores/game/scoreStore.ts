import { create } from 'zustand';
import { GAME_CONFIG } from '../../types/constants';
import { log } from '../../lib/logger';

interface ScoreState {
  score: number;
  levelScore: number;
  multiplier: number;
  multiplierScore: number;
}

interface ScoreActions {
  addScore: (points: number) => void;
  addRawScore: (points: number) => void;  // Add score without multiplier
  addMultiplierScore: (points: number) => {
    newMultiplier: number;
    multiplierIncreased: boolean;
  };
  calculateMultiplier: (multiplierScore: number) => number;
  resetScore: () => void;
  resetLevelScore: () => void;
  resetMultiplier: () => void;
  setMultiplier: (multiplier: number, multiplierScore: number) => void;
}

export type ScoreStore = ScoreState & ScoreActions;

export const useScoreStore = create<ScoreStore>((set, get) => ({
  // State
  score: 0,
  levelScore: 0,
  multiplier: 1,
  multiplierScore: 0,
  
  // Actions
  addScore: (points: number) => {
    const { score, levelScore, multiplier } = get();
    const actualPoints = points * multiplier;
    
    log.score(`Adding score: ${points} × ${multiplier} = ${actualPoints}`);
    
    set({
      score: score + actualPoints,
      levelScore: levelScore + actualPoints
    });
  },
  
  addRawScore: (points: number) => {
    const { score, levelScore } = get();
    
    log.score(`Adding bonus score (no multiplier): ${points}`);
    
    set({
      score: score + points,
      levelScore: levelScore + points
    });
  },
  
  addMultiplierScore: (points: number) => {
    const { multiplier, multiplierScore, calculateMultiplier } = get();

    const newMultiplierScore = multiplierScore + points;
    const newMultiplier = calculateMultiplier(newMultiplierScore);
    const multiplierIncreased = newMultiplier > multiplier;

    set({
      multiplier: Math.max(multiplier, newMultiplier),
      multiplierScore: multiplierIncreased ? 0 : newMultiplierScore,
    });

    return {
      newMultiplier: Math.max(multiplier, newMultiplier),
      multiplierIncreased,
    };
  },
  
  calculateMultiplier: (multiplierScore: number) => {
    const { MULTIPLIER_THRESHOLDS, MAX_MULTIPLIER } = GAME_CONFIG;

    for (let multiplier = MAX_MULTIPLIER; multiplier >= 1; multiplier--) {
      if (
        multiplierScore >=
        MULTIPLIER_THRESHOLDS[multiplier as keyof typeof MULTIPLIER_THRESHOLDS]
      ) {
        return multiplier;
      }
    }
    return 1;
  },
  
  resetScore: () => {
    set({ score: 0, levelScore: 0 });
  },
  
  resetLevelScore: () => {
    set({ levelScore: 0 });
  },
  
  resetMultiplier: () => {
    set({ multiplier: 1, multiplierScore: 0 });
  },
  
  setMultiplier: (multiplier: number, multiplierScore: number) => {
    set({ multiplier, multiplierScore });
  },
}));