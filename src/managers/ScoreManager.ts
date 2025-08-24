import {
  useCoinStore,
  useGameStore,
  useRenderStore,
  useScoreStore,
  useStateStore,
} from "../stores/gameStore";
import { GAME_CONFIG } from "../types/constants";
import { log } from "../lib/logger";
import { sendScoreToHost } from "../lib/communicationUtils";

export class ScoreManager {
  public addScore(points: number): void {
    const { addScore, score, multiplier } = useScoreStore.getState();
    const { currentLevel } = useStateStore.getState();
    const { currentMap } = useGameStore.getState();
    const { lives } = useStateStore.getState();
    
    addScore(points);
    
    // Send real-time score update to host
    const updatedScore = score + points;
    const mapName = currentMap?.name || "";
    sendScoreToHost(updatedScore, mapName, currentLevel, lives, multiplier);
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

  public calculateEffectiveBombCount(
    correctCount: number,
    lives: number
  ): number {
    const livesLost = GAME_CONFIG.STARTING_LIVES - lives;
    return Math.max(0, correctCount - livesLost);
  }

  public calculateMonsterKillPoints(multiplier: number): number {
    // Use the score store for multiplier and fallback to default calculation
    const { activeEffects, coinManager } = useCoinStore.getState();

    if (activeEffects) {
      return coinManager.calculateMonsterKillPoints(multiplier);
    }
  }

  public showFloatingText(
    text: string,
    x: number,
    y: number,
    duration: number = 1000,
    color: string = "#fff",
    fontSize: number = 15
  ): void {
    const { addFloatingText } = useRenderStore.getState();

    if (addFloatingText) {
      addFloatingText(text, x, y, duration, color, fontSize);
    }
  }

  public handleCoinCollection(coin: any): void {
    const { collectCoin } = useCoinStore.getState();

    // Let the coin slice handle the collection
    collectCoin(coin);
  }

  public handleBombCollection(bomb: any): any {
    const { collectBomb } = useStateStore.getState();
    const { onFirebombCollected } = useCoinStore.getState();
    const result = collectBomb(bomb.order);

    // Check if this was a firebomb (correct order)
    if (result && result.isCorrect) {
      onFirebombCollected();
    }

    return result;
  }

  public handleMonsterKill(monster: any): void {
    const { multiplier } = useScoreStore.getState();
    const { activeEffects, coinManager } = useCoinStore.getState();

    // Calculate points using progressive bonus system
    const points = this.calculateMonsterKillPoints(multiplier);
    this.addScore(points);

    // Show floating text for monster kill points
    this.showFloatingText(
      points.toString(),
      monster.x + monster.width / 2,
      monster.y + monster.height / 2
    );

    // Notify coin manager about points earned
    if (activeEffects) {
      coinManager.onPointsEarned(points, false);
    }

    log.debug(`Monster killed during power mode: ${points} points`);
  }

  public handleBonusPoints(bonusPoints: number): void {
    const { activeEffects, coinManager } = useCoinStore.getState();

    this.addScore(bonusPoints);

    // Notify coin manager about bonus points (should not trigger B-coin spawning)
    if (activeEffects) {
      coinManager.onPointsEarned(bonusPoints, true);
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
    const { resetScore } = useScoreStore.getState();
    resetScore();
  }
}
