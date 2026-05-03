import React from "react";
import {
  useStateStore,
  useScoreStore,
  useLevelStore,
} from "../../../stores/gameStore";
import { GAME_CONFIG, DEV_CONFIG } from "../../../types/constants";
import { mapDefinitions } from "../../../maps/mapDefinitions";
import { log } from "../../../lib/logger";
import { getTuned } from "../../../stores/systems/tuningStore";

import { useAnimatedCounter } from "../../../hooks/useAnimatedCounter";

const BonusScreen: React.FC = () => {
  const { currentLevel, correctOrderCount, lives } = useStateStore();
  const { score } = useScoreStore();
  const { setBonusAnimationComplete } = useStateStore();
  const { currentMap } = useLevelStore();

  const livesLost = getTuned("STARTING_LIVES") - lives;
  const effectiveCount = Math.max(0, correctOrderCount - livesLost);

  const bonusPoints =
    GAME_CONFIG.BONUS_POINTS[
      effectiveCount as keyof typeof GAME_CONFIG.BONUS_POINTS
    ] || 0;

  const animatedBonusPoints = useAnimatedCounter(bonusPoints, {
    duration: 6000,
    steps: 120,
    easing: "gentle-ease-out",
    delay: 200,
    onComplete: () => {
      log.debug("Bonus animation completed, setting flag for transition");
      setBonusAnimationComplete(true);
    },
  });

  return (
    <div className="text-center max-w-md">
      <h1
        className="flicker font-pixel leading-none relative z-10 text-5xl uppercase whitespace-nowrap mb-6"
        style={{
          textShadow: "3px 1px 0 var(--primary-dark)",
        }}
      >
        {currentMap?.name}
        <span className="text-primary ml-4">FULLFØRT</span>
      </h1>

      <div className="text-foreground mb-6 space-y-4">
        {bonusPoints > 0 && (
          <div className="flex flex-col items-center justify-center gap-5">
            <div className="text-xl font-pixel text-[var(--foreground-muted)]">
              Du samlet{" "}
              <span className="text-primary">{effectiveCount}</span>{" "}
              av 23 finansieringer!
            </div>
            <div className="text-5xl font-pixel text-primary animate-pulse" style={{ textShadow: "0 0 12px rgba(171,221,100,.5)" }}>
              {animatedBonusPoints.toLocaleString()} kr
            </div>
            {!DEV_CONFIG.ENABLED && (
              <div className="text-sm text-[var(--foreground-dim)] mt-2 font-mono">
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
