import React from "react";
import { Button } from "@/components/ui/button";
import { useGameStore } from "../../../stores/gameStore";
import { GameState, MenuType } from "../../../types/enums";
import { GAME_CONFIG, DEV_CONFIG } from "../../../types/constants";
import { mapDefinitions } from "../../../maps/mapDefinitions";
import { useAnimatedCounter } from "../../../hooks/useAnimatedCounter";

const BonusScreen: React.FC = () => {
  const {
    correctOrderCount,
    currentMap,
    currentLevel,
    nextLevel,
    setState,
    setMenuType,
    initializeLevel,
    setBonusAnimationComplete,
  } = useGameStore();

  const bonusPoints =
    GAME_CONFIG.BONUS_POINTS[
      correctOrderCount as keyof typeof GAME_CONFIG.BONUS_POINTS
    ] || 50000;

  // Use the animated counter hook
  const animatedBonusPoints = useAnimatedCounter(bonusPoints, {
    duration: 6000, // 6 seconds for slower overall animation
    steps: 120, // More steps for smoother animation
    easing: 'gentle-ease-out', // Less dramatic at start, still slows down
    delay: 200, // Small delay to let the screen settle
    onComplete: () => setBonusAnimationComplete(true) // Notify game store when animation is done
  });

  const continueGame = () => {
    const nextLevelNum = currentLevel + 1;

    if (nextLevelNum <= mapDefinitions.length) {
      // More levels available
      nextLevel();

      // Load the next level's map data
      const nextMapIndex = nextLevelNum - 1;
      const nextMap = mapDefinitions[nextMapIndex];
      if (nextMap) {
        initializeLevel(nextMap);
      }

      setMenuType(MenuType.COUNTDOWN);
      setState(GameState.COUNTDOWN);

      setTimeout(() => {
        setState(GameState.PLAYING);
      }, 3000);
    } else {
      // All levels completed
      setState(GameState.VICTORY);
      setMenuType(MenuType.VICTORY);
    }
  };

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
                {correctOrderCount}
              </span>{" "}
              av 23 finansiering og unngikk byrokratet!{" "}
            </div>
            <div className="text-4xl font-bold animate-pulse">
              {animatedBonusPoints.toLocaleString()} kr
            </div>
            {!DEV_CONFIG.ENABLED && (
              <div className="text-sm text-gray-400 mt-2">
                Fortsetter til neste bane...
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BonusScreen;
