import {
  useCoinStore,
  useGameStore,
  useLevelStore,
  useRenderStore,
  useScoreStore,
  useStateStore,
} from "../stores/gameStore";
import { GAME_CONFIG } from "../types/constants";
import { log } from "../lib/logger";
import { sendScoreToHost } from "../lib/communicationUtils";
import type { Monster } from "../types/interfaces";
import { getTuned } from "../stores/systems/tuningStore";

export class ScoreManager {
  public addScore(points: number): void {
    const { addScore, score, multiplier } = useScoreStore.getState();
    const { currentLevel } = useStateStore.getState();
    const { currentMap } = useLevelStore.getState();
    const { lives } = useStateStore.getState();
    
    addScore(points);
    
    // Send real-time score update to host
    const updatedScore = score + points;
    const mapName = currentMap?.name || "";
    sendScoreToHost(updatedScore, mapName, currentLevel, lives, multiplier);
  }

  public calculateBonus(correctCount: number, livesLost: number): number {
    // Calculate effective founding count by subtracting lives lost
    // Each life lost is equivalent to missing one founding
    const effectiveCount = Math.max(0, correctCount - livesLost);

    return (
      GAME_CONFIG.BONUS_POINTS[
        effectiveCount as keyof typeof GAME_CONFIG.BONUS_POINTS
      ] || 0
    );
  }

  public calculateEffectiveFoundingCount(
    correctCount: number,
    lives: number
  ): number {
    const livesLost = getTuned("STARTING_LIVES") - lives;
    return Math.max(0, correctCount - livesLost);
  }

  public calculateMonsterKillPoints(multiplier: number): number {
    // Use the coin store for monster kill point calculation
    const { calculateMonsterKillPoints } = useCoinStore.getState();
    return calculateMonsterKillPoints(multiplier);
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

  public handleFoundingCollection(founding: any): any {
    const { collectFounding } = useStateStore.getState();
    const { coinManager } = useCoinStore.getState();
    const result = collectFounding(founding.order);

    // BJ P-coin tokens count BOTH firefoundings (2) and normal foundings (1).
    if (result && result.isValid && coinManager) {
      coinManager.onFoundingCollected(result.isCorrect);
    }

    return result;
  }

  public handleMonsterKill(monster: Monster): void {
    const { multiplier } = useScoreStore.getState();
    const { onPointsEarned } = useCoinStore.getState();

    // Calculate points using progressive bonus system
    const points = this.calculateMonsterKillPoints(multiplier);
    this.addScore(points);

    // Show floating text for monster kill points
    this.showFloatingText(
      points.toString(),
      monster.x + monster.width / 2,
      monster.y + monster.height / 2
    );

    // BJ canonical: monster kills DO count toward B-coin threshold (only
    // coin pickups and end-of-level bonus are excluded).
    onPointsEarned(points, false);

    log.debug(`Monster killed during power mode: ${points} points (counted toward B-coin threshold)`);
  }

  public handleBonusPoints(bonusPoints: number): void {
    const { onPointsEarned } = useCoinStore.getState();

    this.addScore(bonusPoints);

    // Notify coin manager about bonus points (should not trigger B-coin spawning)
    onPointsEarned(bonusPoints, true);
  }

  public getScore(): number {
    return useScoreStore.getState().score;
  }

  public getLevelScore(): number {
    return useScoreStore.getState().levelScore;
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
