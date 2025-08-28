import { StateCreator } from "zustand";
import { Bomb } from "../../types/interfaces";
import { BombManager } from "../../managers/bombManager";
import { calculateBombScore, formatScoreLog } from "../../lib/scoringUtils";
import { log } from "../../lib/logger";

export interface BombSlice {
  bombs: Bomb[];
  collectedBombs: number[];
  correctOrderCount: number;
  nextBombOrder: number;
  bombManager: BombManager | null;
  
  collectBomb: (bombOrder: number) => { isValid: boolean; isCorrect: boolean };
  setBombs: (bombs: Bomb[]) => void;
  setBombManager: (bombManager: BombManager) => void;
  resetBombState: () => void;
}

export const createBombSlice: StateCreator<BombSlice> = (set, get) => ({
  bombs: [],
  collectedBombs: [],
  correctOrderCount: 0,
  nextBombOrder: 1,
  bombManager: null,
  
  collectBomb: (bombOrder: number) => {
    const { bombs, bombManager } = get();
    
    const bomb = bombs.find((b) => b.order === bombOrder);
    if (!bomb || !bombManager) {
      log.warn("Bomb or bomb manager not found");
      return { isValid: false, isCorrect: false };
    }

    const result = bombManager.handleBombClick(bomb.group, bomb.order);
    
    if (!result.isValid) {
      return { isValid: false, isCorrect: false };
    }

    // Determine if this is a firebomb (next correct bomb in sequence)
    const isFirebomb = result.isCorrect;
    
    // Get current multiplier from the store
    const api = get();
    const currentMultiplier = "multiplier" in api ? (api as { multiplier: number }).multiplier : 1;
    
    // Calculate score using utility function
    const scoreCalculation = calculateBombScore(isFirebomb, currentMultiplier);
    
    // Add score to game state
    if ("addScore" in api) {
      (api as { addScore: (points: number) => void }).addScore(scoreCalculation.actualPoints);
    }
    
    // Add points to multiplier system
    if ("addMultiplierScore" in api) {
      (api as { addMultiplierScore: (points: number) => void }).addMultiplierScore(scoreCalculation.actualPoints);
    }

    // Points are now automatically tracked via total score for B-coin spawning
    
    // Log the score (only for firebombs or high scores to reduce spam)
    if (isFirebomb || scoreCalculation.actualPoints >= 400) {
      log.score(formatScoreLog(scoreCalculation));
    }

    // Add floating text for correct bomb collection
    if (isFirebomb && "addFloatingText" in api) {
      const bomb = bombs.find((b) => b.order === bombOrder);
      if (bomb) {
        const text = `${scoreCalculation.actualPoints}`;
        (api as { addFloatingText: (text: string, x: number, y: number, duration: number, color: string, fontSize: number) => void }).addFloatingText(
          text,
          bomb.x + bomb.width / 2,
          bomb.y + bomb.height / 2,
          1000, // duration
          '#FFD700', // color
          15 // fontSize
        );
      }
    }

    const updatedBombs = bombs.map((b) => {
      if (b.order === bombOrder) {
        return { ...b, isCollected: true, isCorrect: result.isCorrect };
      }
      
      const nextGroup = bombManager.getActiveGroup();
      const nextOrder = bombManager.getNextBombOrder();
      const isNextBomb =
        nextGroup !== null &&
        nextOrder !== null &&
        b.group === nextGroup &&
        b.order === nextOrder &&
        !b.isCollected;
      
      return { ...b, isBlinking: isNextBomb };
    });
    
    set({
      bombs: updatedBombs,
      correctOrderCount: bombManager.getCorrectOrderCount(),
      collectedBombs: Array.from(bombManager.getCollectedBombs()).map((id) => {
        const [group, order] = id.split("-").map(Number);
        return order;
      }),
    });

    return { isValid: true, isCorrect: result.isCorrect };
  },
  
  setBombs: (bombs: Bomb[]) => {
    set({ bombs });
  },
  
  setBombManager: (bombManager: BombManager) => {
    set({ bombManager });
  },
  
  resetBombState: () => {
    set({
      bombs: [],
      collectedBombs: [],
      correctOrderCount: 0,
      nextBombOrder: 1,
      bombManager: null,
    });
  },
});
