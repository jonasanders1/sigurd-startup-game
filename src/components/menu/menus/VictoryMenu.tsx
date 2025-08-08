import React from "react";

import { useGameStore } from "../../../stores/gameStore";

import { Home, RotateCcw, Trophy } from "lucide-react";

const VictoryMenu: React.FC = () => {
  const { score, resetGame } = useGameStore();

  const handleRestart = () => {
    resetGame();
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

      <div className="flex items-center justify-center gap-2">
        <button
          onClick={handleRestart}
          className="bg-primary text-white font-bold hover:bg-primary/80 rounded-lg py-1 px-3 text-lg transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2"
        >
          <Home className="w-7 h-7" strokeWidth={2} />
        </button>
        {/* <button
          onClick={() => {}}
          className="bg-primary text-white font-bold hover:bg-primary/80 rounded-lg py-1 px-3 text-lg transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-7 h-7" strokeWidth={2} />
        </button>
        <button
          onClick={() => {}}
          className="bg-primary text-white font-bold hover:bg-primary/80 rounded-lg py-1 px-3 text-lg transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2"
        >
          <Trophy className="w-7 h-7" strokeWidth={2} />
        </button> */}
      </div>
    </div>
  );
};

export default VictoryMenu;
