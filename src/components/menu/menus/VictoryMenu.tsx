import React, { useState, useEffect } from "react";

import { useScoreStore, useStateStore } from "../../../stores/gameStore";
import { waitForGameSaveConfirmation } from "../../../lib/communicationUtils";

import { Home, Loader2 } from "lucide-react";

const VictoryMenu: React.FC = () => {
  const { gameStateManager } = useStateStore.getState();
  const { score } = useScoreStore.getState();
  const [isSaving, setIsSaving] = useState(true);

  useEffect(() => {
    // Wait for the game to be saved before allowing restart
    waitForGameSaveConfirmation().then(() => {
      setIsSaving(false);
    });
  }, []);

  const handleRestart = () => {
    if (!isSaving) {
      gameStateManager?.restartGame();
    }
  };

  return (
    <div className="text-center max-w-md flex flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-bold uppercase">slutt</h1>

      <div className="text-white mb-6 space-y-4">
        <div className="text-2xl text-primary">Du har klart det umulige!</div>
        <div className="text-lg">
          Du hjalp Sigurd med å unngå byrokratiske hindringer og samle
          finansiering.
        </div>

        <div className="text-2xl flex flex-col items-center justify-center gap-2">
          <div className="text-foreground">Total finansiering samlet:</div>
          <div className="font-bold text-3xl text-primary">
            {score.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center gap-2">
        {isSaving && (
          <div className="text-sm text-gray-400 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Lagrer spillet...
          </div>
        )}
        <button
          onClick={handleRestart}
          disabled={isSaving}
          className={`${
            isSaving 
              ? "bg-gray-500 cursor-not-allowed" 
              : "bg-primary hover:bg-primary-dark"
          } text-white font-bold rounded-lg py-1 px-3 text-lg transition-all duration-200 flex items-center justify-center gap-2`}
        >
          <Home className="w-7 h-7" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
};

export default VictoryMenu;
