import React, { useState, useEffect } from "react";
import { DEV_CONFIG } from "../../../types/constants";
import { useLevelStore } from "../../../stores/gameStore";

const CountdownOverlay: React.FC = () => {
  const [count, setCount] = useState(3);
  const { currentMap } = useLevelStore.getState();
  useEffect(() => {
    // Only run countdown if not in DEV_MODE
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
      <>
        <div className="text-8xl font-bold text-primary">{count}</div>
        <div className="flex items-center justify-center gap-2">
          <div className="w-2 h-2 bg-white rounded-full p-1 animate-pulse" />
          <p className="text-2xl text-white uppercase italic">
            {currentMap?.name}
          </p>
          <div className="w-2 h-2 bg-white rounded-full p-1 animate-pulse" />
        </div>
      </>
    </div>
  );
};

export default CountdownOverlay;
