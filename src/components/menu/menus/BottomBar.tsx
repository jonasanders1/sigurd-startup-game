import React from "react";
import { useStateStore } from "../../../stores/gameStore";
import { VERSION_STRING } from "../../../version";
import coffeeIcon from "../../../assets/sprites/coffee/sprite_0.png";

/**
 * Bottom HUD bar — mirrors the top InGameMenu bar's container styling.
 *  - Left:  coffee-cup lives indicator (lost lives dimmed).
 *  - Right: game name + version.
 * Always rendered alongside the top bar so the canvas is sandwiched
 * between two HUD strips of identical height.
 */
const BottomBar: React.FC = () => {
  // Selector keeps re-renders scoped to the lives field; subscribing to
  // the whole store would trigger on every player-position change at 60Hz.
  const lives = useStateStore((s) => s.lives);

  return (
    <div
      className="w-full relative flex items-center gap-3 px-3 py-2.5 bg-[var(--background-deep)] border-t border-[var(--surface-line)] rounded-b-lg"
      style={{ minHeight: 56 }}
    >
      {/* ── Lives (coffee cups) ── */}
      <div className="flex items-center gap-1 shrink-0">
        {Array.from({ length: Math.min(lives, 3) }).map((_, i) => (
          <img
            key={i}
            src={coffeeIcon}
            alt=""
            width={28}
            height={28}
            style={{ imageRendering: "pixelated" }}
            draggable={false}
          />
        ))}
        {lives > 3 && (
          <span className="text-[var(--accent-pink)] font-pixel text-sm ml-1">
            +{lives - 3}
          </span>
        )}
      </div>

      <div className="flex-1" />

      {/* ── Version label ── */}
      <div className="text-[10px] text-[var(--foreground-dim)] tracking-wide shrink-0">
        Sigurd Startup {VERSION_STRING}
      </div>
    </div>
  );
};

export default BottomBar;
