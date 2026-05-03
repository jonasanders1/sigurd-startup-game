import React, { useState, useEffect } from "react";
import { DEV_CONFIG } from "../../../types/constants";
import { useLevelStore } from "../../../stores/gameStore";

const CountdownOverlay: React.FC = () => {
  const [count, setCount] = useState(3);
  const { currentMap } = useLevelStore();
  useEffect(() => {
    if (!DEV_CONFIG.ENABLED) {
      const interval = setInterval(() => {
        setCount((prev) => (prev > 1 ? prev - 1 : 0));
      }, 1000);

      return () => clearInterval(interval);
    }
  }, []);

  if (count === 0 && !DEV_CONFIG.ENABLED) return null;

  return (
    <div className="text-center">
      <div className="text-8xl font-pixel text-primary" style={{ textShadow: "0 0 24px rgba(171,221,100,.4)" }}>
        {count}
      </div>
      <div className="flex items-center justify-center gap-3 mt-4">
        <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
        <p
          className="text-4xl text-foreground capitalize font-pixel tracking-wide"
          style={{ textShadow: "0 0 16px rgba(171,221,100,0.45)" }}
        >
          {currentMap?.name}
        </p>
        <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
      </div>
    </div>
  );
};

export default CountdownOverlay;
