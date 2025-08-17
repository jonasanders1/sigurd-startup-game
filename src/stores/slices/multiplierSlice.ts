import { StateCreator } from "zustand";
import { GAME_CONFIG } from "../../types/constants";

export interface MultiplierSlice {
  multiplier: number;
  multiplierScore: number;

  calculateMultiplier: (multiplierScore: number) => number;
  addMultiplierScore: (points: number) => {
    newMultiplier: number;
    multiplierIncreased: boolean;
  };
  resetMultiplier: () => void;
  setMultiplier: (multiplier: number, multiplierScore: number) => void;
}

export const createMultiplierSlice: StateCreator<MultiplierSlice> = (
  set,
  get
) => ({
  multiplier: 1,
  multiplierScore: 0,

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

  resetMultiplier: () => {
    set({ multiplier: 1, multiplierScore: 0 });
  },

  setMultiplier: (multiplier: number, multiplierScore: number) => {
    set({ multiplier, multiplierScore });
  },
});
