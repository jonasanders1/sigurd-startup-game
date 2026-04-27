import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  useScoreStore,
  useStateStore,
} from "../../../stores/gameStore";
import { GameState } from "../../../types/enums";

import {
  Pause,
  Play,
  Maximize,
  Minimize,
} from "lucide-react";
import { calculateMultiplierProgress } from "../../../lib/scoringUtils";
import { useFullscreen } from "../../../hooks/useFullscreen";
import { useAnimatedScore } from "../../../hooks/useAnimatedScore";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TooltipProvider } from "@radix-ui/react-tooltip";

/** Gradient per multiplier level */
const MULT_GRADIENT: Record<number, string> = {
  1: "linear-gradient(90deg, #7fb33d, #abdd64, #c2eb83)",
  2: "linear-gradient(90deg, #0e9fb8, #22d3ee, #67e8f9)",
  3: "linear-gradient(90deg, #ca8a04, #eab308, #fde047)",
  4: "linear-gradient(90deg, #e8856e, #f2ae99, #fcd5c8)",
  5: "linear-gradient(90deg, #d56aaf, #ee90cb, #8465ec)",
};
const MULT_GLOW: Record<number, string> = {
  1: "rgba(171,221,100,0.35)",
  2: "rgba(34,211,238,0.35)",
  3: "rgba(234,179,8,0.4)",
  4: "rgba(242,174,153,0.4)",
  5: "rgba(238,144,203,0.45)",
};

const InGameMenu: React.FC = () => {
  const { currentState, currentLevel, gameStateManager, isPaused } = useStateStore();
  const { score, multiplier, multiplierScore } = useScoreStore();

  const gameContainerRef = useRef<HTMLDivElement>(null);
  const { isFullscreen, toggleFullscreen } = useFullscreen();

  const animatedScore = useAnimatedScore(score, 0.14);

  const handleFullscreenToggle = () => {
    const gameElement = gameContainerRef.current?.closest(
      "sigurd-startup"
    ) as HTMLElement;
    if (gameElement) {
      toggleFullscreen(gameElement);
    } else {
      toggleFullscreen();
    }
  };

  const handlePlayPause = () => {
    if (currentState === GameState.PLAYING) {
      gameStateManager?.pauseGame();
    } else if (currentState === GameState.PAUSED) {
      gameStateManager?.resumeGame();
    }
  };

  const progress = calculateMultiplierProgress(multiplierScore, multiplier);
  const isScoreAnimating = animatedScore !== score;
  const showPlayPause = currentState === GameState.PLAYING || currentState === GameState.PAUSED;

  const multGradient = MULT_GRADIENT[multiplier] ?? MULT_GRADIENT[1];
  const multGlow = MULT_GLOW[multiplier] ?? MULT_GLOW[1];
  const isMax = multiplier >= 5;
  const fillPct = isMax ? 100 : progress * 100;

  return (
    <div
      ref={gameContainerRef}
      className="w-full relative flex items-center gap-3 px-3 py-1.5 bg-[var(--background-deep)] border-b border-[var(--surface-line)] rounded-t-lg"
      style={{ minHeight: 40 }}
    >
      {/* ── Level ── */}
      <div className="text-[var(--foreground-dim)] font-mono text-xs shrink-0 uppercase tracking-wide">
        Lvl <span className="text-foreground font-pixel">{currentLevel}</span>
      </div>

      <div className="w-px h-5 bg-[var(--surface-line)] shrink-0" />

      {/* ── Score ── */}
      <div className="shrink-0 min-w-[90px]">
        <div
          className={`font-pixel text-sm tabular-nums transition-colors duration-150 ${
            isScoreAnimating ? "text-[var(--primary-light)]" : "text-primary"
          }`}
          style={isScoreAnimating ? { textShadow: "0 0 8px rgba(171,221,100,.5)" } : undefined}
        >
          {animatedScore.toLocaleString()}
        </div>
      </div>

      {/* ── Multiplier bar — absolute centered ── */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-60"
        style={{ width: 200 }}
      >
        <div className="relative h-5 rounded-full overflow-hidden bg-[var(--surface)] border border-[var(--surface-line)]">
          {/* Gradient fill */}
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${fillPct}%`,
              background: multGradient,
              boxShadow: `0 0 8px ${multGlow}, inset 0 1px 0 rgba(255,255,255,0.2)`,
            }}
          />

          {/* Centered label */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className="font-pixel text-[11px] leading-none"
              style={{
                color: "#fff",
                textShadow: "0 1px 3px rgba(0,0,0,0.5)",
              }}
            >
              x{multiplier}{isMax ? " MAX" : ""}
            </span>
          </div>
        </div>
      </div>

      {/* ── Right-side spacer ── */}
      <div className="flex-1" />

      {/* ── Action buttons ── */}
      <div className="flex items-center gap-1 shrink-0">
        {showPlayPause && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handlePlayPause}
                  variant="ghost"
                  size="icon"
                  className="text-[var(--foreground-dim)] hover:text-primary h-7 w-7"
                >
                  {isPaused ? <Play size={15} /> : <Pause size={15} />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isPaused ? "Resume (P)" : "Pause (P)"}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={handleFullscreenToggle}
                variant="ghost"
                size="icon"
                className="text-[var(--foreground-dim)] hover:text-primary h-7 w-7"
              >
                {isFullscreen ? <Minimize size={15} /> : <Maximize size={15} />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isFullscreen ? "Exit fullscreen (F)" : "Fullscreen (F)"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};

export default InGameMenu;
