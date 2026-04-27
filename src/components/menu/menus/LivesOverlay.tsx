import React from "react";
import { Heart } from "lucide-react";
import { useStateStore } from "../../../stores/gameStore";
import { useFullscreen } from "../../../hooks/useFullscreen";

const LivesOverlay: React.FC = () => {
  const { lives } = useStateStore();
  const { isFullscreen } = useFullscreen();

  return (
    <div
      className={`absolute left-3 z-50 pointer-events-none ${
        isFullscreen ? "bottom-4" : "bottom-2"
      }`}
    >
      <div className="flex items-center gap-1">
        {Array.from({ length: 3 }).map((_, i) => (
          <Heart
            key={i}
            color="#ee90cb"
            size={isFullscreen ? 22 : 18}
            fill={i < lives ? "#ee90cb" : "none"}
            strokeWidth={i < lives ? 0 : 1.5}
          />
        ))}
        {lives > 3 && (
          <span className="text-[var(--accent-pink)] font-pixel text-sm ml-1">
            +{lives - 3}
          </span>
        )}
      </div>
    </div>
  );
};

export default LivesOverlay;
