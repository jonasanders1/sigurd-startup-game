import React from "react";
import {
  useGameStore,
  useStateStore,
  useScoreStore,
  useLevelStore,
  useCoinStore,
  useMonsterStore,
  usePlayerStore,
} from "../../../stores/gameStore";
import { GAME_CONFIG, DEV_CONFIG } from "../../../types/constants";
import { mapDefinitions } from "../../../maps/mapDefinitions";
import { log } from "../../../lib/logger";

import { useAnimatedCounter } from "../../../hooks/useAnimatedCounter";

const BonusScreen: React.FC = () => {
  const { currentLevel, correctOrderCount, lives } = useStateStore();
  const { score } = useScoreStore();
  const { setBonusAnimationComplete, gameStateManager } = useStateStore();
  const { currentMap } = useLevelStore();

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
    onComplete: () => {
      log.debug("Bonus animation completed, setting flag for transition");
      setBonusAnimationComplete(true);
    }, // Notify game store when animation is done
  });

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
