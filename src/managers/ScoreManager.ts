import { useGameStore } from "../stores/gameStore";
import { useScoreStore } from "../stores/game/scoreStore";
import { useStateStore } from "../stores/game/stateStore";
import { useCoinStore } from "../stores/entities/coinStore";
import { useRenderStore } from "../stores/systems/renderStore";
import { GAME_CONFIG } from "../types/constants";
import { log } from "../lib/logger";

export class ScoreManager {
  public addScore(points: number): void {
    const scoreStore = useScoreStore.getState();
    scoreStore.addScore(points);
  }

  public calculateBonus(correctCount: number, livesLost: number): number {
    // Calculate effective bomb count by subtracting lives lost
    // Each life lost is equivalent to missing one bomb
    const effectiveCount = Math.max(0, correctCount - livesLost);

    return (
      GAME_CONFIG.BONUS_POINTS[
        effectiveCount as keyof typeof GAME_CONFIG.BONUS_POINTS
      ] || 0
    );
  }

  public calculateEffectiveBombCount(correctCount: number, lives: number): number {
    const livesLost = GAME_CONFIG.STARTING_LIVES - lives;
    return Math.max(0, correctCount - livesLost);
  }

  public calculateMonsterKillPoints(multiplier: number): number {
    const gameState = useGameStore.getState();
    
    if (gameState.coinManager) {
      return gameState.coinManager.calculateMonsterKillPoints(multiplier);
    }
    
    // Fallback if coin manager not available
    return GAME_CONFIG.MONSTER_KILL_POINTS * multiplier;
  }

  public showFloatingText(
    text: string,
    x: number,
    y: number,
    duration: number = 1000,
    color: string = "#fff",
    fontSize: number = 15
  ): void {
    const renderStore = useRenderStore.getState();
    
    if (renderStore.addFloatingText) {
      renderStore.addFloatingText(text, x, y, duration, color, fontSize);
    }
  }

  public handleCoinCollection(coin: any): void {
    const coinStore = useCoinStore.getState();
    
    // Let the coin slice handle the collection
    coinStore.collectCoin(coin);
  }

  public handleBombCollection(bomb: any): any {
    const stateStore = useStateStore.getState();
    const result = stateStore.collectBomb(bomb.order);
    
    // Check if this was a firebomb (correct order)
    if (result && result.isCorrect) {
      const scoreStore = useScoreStore.getState();
      scoreStore.onFirebombCollected();
    }
    
    return result;
  }

  public handleMonsterKill(monster: any): void {
    const scoreStore = useScoreStore.getState();
    const gameState = useGameStore.getState();
    
    // Calculate points using progressive bonus system
    const points = this.calculateMonsterKillPoints(scoreStore.multiplier);
    this.addScore(points);

    // Show floating text for monster kill points
    this.showFloatingText(
      points.toString(),
      monster.x + monster.width / 2,
      monster.y + monster.height / 2
    );

    // Notify coin manager about points earned
    if (gameState.coinManager) {
      gameState.coinManager.onPointsEarned(points, false);
    }

    log.debug(`Monster killed during power mode: ${points} points`);
  }

  public handleBonusPoints(bonusPoints: number): void {
    const gameState = useGameStore.getState();
    
    this.addScore(bonusPoints);
    
    // Notify coin manager about bonus points (should not trigger B-coin spawning)
    if (gameState.coinManager) {
      gameState.coinManager.onPointsEarned(bonusPoints, true);
    }
  }

  public getScore(): number {
    return useScoreStore.getState().score;
  }

  public getMultiplier(): number {
    return useScoreStore.getState().multiplier;
  }

  public getMultiplierProgress(): number {
    return useScoreStore.getState().multiplierScore;
  }

  public resetScore(): void {
    const stateStore = useStateStore.getState();
    const scoreStore = useScoreStore.getState();
    stateStore.resetGameState();
    scoreStore.resetScore();
  }
}