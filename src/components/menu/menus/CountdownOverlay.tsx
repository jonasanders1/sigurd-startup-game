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
      <div className="text-8xl font-pixel text-primary" style={{ textShadow: "0 0 24px rgba(239,51,64,.5)" }}>
        {count}
      </div>
      <div className="flex items-center justify-center gap-2 mt-2">
        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
        <p className="text-xl text-foreground uppercase font-pixel tracking-wider">
          {currentMap?.name}
        </p>
        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
      </div>
    </div>
  );
};

export default CountdownOverlay;
