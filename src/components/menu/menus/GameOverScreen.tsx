import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  useLevelStore,
  useScoreStore,
  useStateStore,
} from "../../../stores/gameStore";
import { waitForGameSaveConfirmation } from "../../../lib/communicationUtils";
import { Loader2 } from "lucide-react";

const GameOverScreen: React.FC = () => {
  const { gameStateManager } = useStateStore.getState();
  const { score } = useScoreStore.getState();
  const { levelHistory } = useLevelStore.getState();
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
    <div className="bg-gradient-to-b rounded-lg text-center max-w-md">
      <h1 className="text-4xl font-bold mb-4 uppercase">konkurs</h1>

      <div className="text-white mb-6 space-y-3">
        <div className="text-2xl">
          <span className="">
            Total finansiering:{" "}
            <span className="font-bold text-primary">
              {score.toLocaleString()} kr
            </span>
          </span>
        </div>

        {/* Level History */}
        {levelHistory.length > 0 && (
          <div className="mt-6 border-t border-gray-600 pt-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-600">
                    <th className="text-left py-2 px-2 text-primary font-semibold">
                      Bane
                    </th>
                    <th className="text-left py-2 px-2 text-primary font-semibold">
                      Mynter
                    </th>
                    <th className="text-left py-2 px-2 text-primary font-semibold">
                      Finansiering
                    </th>
                    <th className="text-left py-2 px-2 text-primary font-semibold">
                      Bonus
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {levelHistory.map((level, index) => (
                    <tr key={index} className="border-b border-gray-700/50">
                      <td className="py-2 px-2 text-gray-300">
                        {level.level} ({level.mapName})
                      </td>
                      <td className="py-2 px-2 text-gray-300">
                        {level.coinsCollected}
                      </td>
                      <td className="py-2 px-2 text-gray-300">
                        {level.score.toLocaleString()}
                      </td>
                      <td className="py-2 px-2">
                        {level.bonus > 0 ? (
                          <span className="text-yellow-400 font-semibold">
                            {level.bonus.toLocaleString()} kr
                          </span>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col items-center gap-3">
        {isSaving && (
          <div className="text-sm text-gray-400 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Lagrer spillet...
          </div>
        )}
        <Button
          onClick={handleRestart}
          disabled={isSaving}
          className={`${
            isSaving
              ? "bg-gray-500 hover:bg-gray-500 cursor-not-allowed"
              : "bg-primary hover:bg-primary-dark"
          } text-white font-bold py-3 px-8 text-lg transition-all duration-200 uppercase`}
        >
          prøv igjen
        </Button>
      </div>
    </div>
  );
};

export default GameOverScreen;
