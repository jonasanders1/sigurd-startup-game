import { StateCreator } from 'zustand';
import { Bomb } from '../../types/interfaces';
import { BombManager } from '../../managers/bombManager';
import { calculateBombScore, formatScoreLog } from '../../lib/scoringUtils';

export interface BombSlice {
  bombs: Bomb[];
  collectedBombs: number[];
  correctOrderCount: number;
  nextBombOrder: number;
  bombManager: BombManager | null;
  
  collectBomb: (bombOrder: number) => void;
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
    
    const bomb = bombs.find(b => b.order === bombOrder);
    if (!bomb || !bombManager) {
      console.warn('Bomb or bomb manager not found');
      return;
    }

    const result = bombManager.handleBombClick(bomb.group, bomb.order);
    
    if (!result.isValid) {
      return;
    }

    // Determine if this is a firebomb (next correct bomb in sequence)
    const isFirebomb = result.isCorrect;
    
    // Get current multiplier from the store
    const api = get();
    const currentMultiplier = 'multiplier' in api ? (api as any).multiplier : 1;
    
    // Calculate score using utility function
    const scoreCalculation = calculateBombScore(isFirebomb, currentMultiplier);
    
    // Add score to game state
    if ('addScore' in api) {
      (api as any).addScore(scoreCalculation.actualPoints);
    }
    
    // Add points to multiplier system
    if ('addMultiplierScore' in api) {
      (api as any).addMultiplierScore(scoreCalculation.actualPoints);
    }
    
    // Log the score
    console.log(formatScoreLog(scoreCalculation));

    const updatedBombs = bombs.map(b => {
      if (b.order === bombOrder) {
        return { ...b, isCollected: true, isCorrect: result.isCorrect };
      }
      
      const nextGroup = bombManager.getActiveGroup();
      const nextOrder = bombManager.getNextBombOrder();
      const isNextBomb = nextGroup !== null && nextOrder !== null && 
                         b.group === nextGroup && b.order === nextOrder && !b.isCollected;
      
      return { ...b, isBlinking: isNextBomb };
    });
    
    set({
      bombs: updatedBombs,
      correctOrderCount: bombManager.getCorrectOrderCount(),
      collectedBombs: Array.from(bombManager.getCollectedBombs()).map(id => {
        const [group, order] = id.split('-').map(Number);
        return order;
      })
    });
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
      bombManager: null
    });
  }
});
