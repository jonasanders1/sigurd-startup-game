import React, { useState } from "react";
import { useStateStore, useLevelStore } from "../../../stores/gameStore";
import { DEV_CONFIG } from "../../../types/constants";
import { mapDefinitions } from "../../../maps/mapDefinitions";
import { log } from "../../../lib/logger";
import { endOfLevelBonus } from "../../../lib/bjRules";
import byrokratiData from "../../../data/byrokrati.json";

import { useAnimatedCounter } from "../../../hooks/useAnimatedCounter";

const BonusScreen: React.FC = () => {
  const { currentLevel, correctOrderCount } = useStateStore();
  const { setBonusAnimationComplete } = useStateStore();
  const { currentMap } = useLevelStore();
  const [flavorFact] = useState(
    () =>
      byrokratiData.facts[
        Math.floor(Math.random() * byrokratiData.facts.length)
      ]
  );

  // Same source of truth as LevelManager.proceedAfterMapCleared so the
  // displayed bonus matches what scoreStore.addRawScore actually pays.
  // BJ canonical: no livesLost penalty (bjRules:64).
  const bonusPoints = endOfLevelBonus(correctOrderCount);

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
    // Outer wrapper spans the full Menu container so the heading can
    // center against the game canvas (800px), independent of the inner
    // bonus block's max-w-md constraint. Otherwise long level names like
    // "INNOVASJON NORGE FULLFØRT" overflow a 448px block and look offset.
    <div className="flex flex-col items-center text-center w-full">
      <h1
        className="flicker font-pixel leading-none relative z-10 text-5xl whitespace-nowrap mb-6"
        style={{
          textShadow: "3px 1px 0 var(--primary-dark)",
          textTransform: "uppercase",
        }}
      >
        {currentMap?.name?.toUpperCase()}{" "}
        <span className="text-primary">FULLFØRT</span>
      </h1>

      <p className="text-sm italic text-[var(--foreground-dim)] mb-4 max-w-xl">
        {flavorFact}
      </p>

      <div className="text-foreground mb-6 space-y-4 max-w-md">
        {bonusPoints > 0 && (
          <div className="flex flex-col items-center justify-center gap-5">
            <div className="text-xl font-pixel text-[var(--foreground-muted)]">
              Du samlet{" "}
              <span className="text-primary">{correctOrderCount}</span>{" "}
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
