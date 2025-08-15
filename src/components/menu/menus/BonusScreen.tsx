import React from "react";
import { useGameStore } from "../../../stores/gameStore";
import { GameState, MenuType } from "../../../types/enums";
import { GAME_CONFIG, DEV_CONFIG } from "../../../types/constants";
import { mapDefinitions } from "../../../maps/mapDefinitions";

import { useAnimatedCounter } from "../../../hooks/useAnimatedCounter";

import { CircleDollarSign, Map, Zap } from "lucide-react";

const BonusScreen: React.FC = () => {
  const {
    correctOrderCount,
    currentMap,
    currentLevel,
    lives,
    score,
    setBonusAnimationComplete,
  } = useGameStore();

  // Calculate effective bomb count by subtracting lives lost
  // Each life lost is equivalent to missing one bomb
  const livesLost = GAME_CONFIG.STARTING_LIVES - lives;
  const effectiveCount = Math.max(0, correctOrderCount - livesLost);

  const bonusPoints =
    GAME_CONFIG.BONUS_POINTS[
      effectiveCount as keyof typeof GAME_CONFIG.BONUS_POINTS
    ] || 0;

  // Use the animated counter hook
  const animatedBonusPoints = useAnimatedCounter(bonusPoints, {
    duration: 6000, // 6 seconds for slower overall animation
    steps: 120, // More steps for smoother animation
    easing: "gentle-ease-out", // Less dramatic at start, still slows down
    delay: 200, // Small delay to let the screen settle
    onComplete: () => setBonusAnimationComplete(true), // Notify game store when animation is done
  });

  // const continueGame = () => {
  //   const nextLevelNum = currentLevel + 1;

  //   if (nextLevelNum <= mapDefinitions.length) {
  //     // More levels available
  //     nextLevel();

  //     // Load the next level's map data
  //     const nextMapIndex = nextLevelNum - 1;
  //     const nextMap = mapDefinitions[nextMapIndex];
  //     if (nextMap) {
  //       initializeLevel(nextMap);
  //     }

  //     setMenuType(MenuType.COUNTDOWN);
  //     setState(GameState.COUNTDOWN);

  //     setTimeout(() => {
  //       setState(GameState.PLAYING);
  //     }, 3000);
  //   } else {
  //     // All levels completed - send comprehensive victory completion data
  //     const gameStore = useGameStore.getState();
  //     const levelResults = gameStore.getLevelResults();
  //     const multiplier = gameStore.multiplier;
  //     const gameStartTime = gameStore.getGameStartTime();
  //     const sessionId = gameStore.getSessionId();

  //     // Calculate comprehensive game statistics
  //     const gameStats = calculateGameStats(
  //       levelResults,
  //       gameStore.score,
  //       gameStore.lives,
  //       multiplier,
  //       "completed",
  //       gameStartTime,
  //       Date.now()
  //     );

  //     const gameCompletionData: GameCompletionData = {
  //       finalScore: gameStore.score,
  //       totalLevels: mapDefinitions.length,
  //       completedLevels: levelResults.length,
  //       timestamp: Date.now(),
  //       lives: gameStore.lives,
  //       multiplier,
  //       levelHistory: levelResults,
  //       totalCoinsCollected: gameStats.totalCoinsCollected,
  //       totalPowerModeActivations: gameStats.totalPowerModeActivations,
  //       totalBombs: gameStats.totalBombs,
  //       totalCorrectOrders: gameStats.totalCorrectOrders,
  //       averageCompletionTime: gameStats.averageCompletionTime,
  //       gameEndReason: "completed",
  //       sessionId,
  //       startTime: gameStartTime,
  //       endTime: Date.now(),
  //     };

  //     sendGameCompletionData(gameCompletionData);

  //     setState(GameState.VICTORY);
  //     setMenuType(MenuType.VICTORY);
  //   }
  // };

  return (
    <div className="text-center max-w-md">
      <h1 className="text-4xl font-bold text-primary mb-4 uppercase">
        {currentMap?.name} Fullført!
      </h1>

      <div className="text-white mb-6 space-y-4">
        {bonusPoints > 0 && (
          <div className="flex flex-col items-center justify-center gap-5">
            <div className="text-2xl">
              Bra jobba! Du samlet{" "}
              <span className="font-bold text-primary animate-pulse">
                {effectiveCount}
              </span>{" "}
              av 23 finansieringer og unngikk byrokratiet!
            </div>
            <div className="text-4xl font-bold animate-pulse">
              {animatedBonusPoints.toLocaleString()} kr
            </div>
            {!DEV_CONFIG.ENABLED && (
              <div className="text-sm text-muted-foreground mt-2">
                {mapDefinitions.length > currentLevel
                  ? `Fortsetter til ${
                      mapDefinitions[currentLevel]?.name || "Neste nivå"
                    }...`
                  : ""}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BonusScreen;
