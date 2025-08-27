import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  useLevelStore, 
  useStateStore 
} from "../../../stores/gameStore";
import { waitForGameSaveConfirmation } from "../../../lib/communicationUtils";
import { Loader2, Check } from "lucide-react";

const VictoryMenu: React.FC = () => {
  const { gameStateManager } = useStateStore.getState();
  const { getLevelResults } = useLevelStore.getState();
  const [isSaving, setIsSaving] = useState(true);

  // Get the comprehensive level results
  const levelResults = getLevelResults();

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

  // Calculate total financing across all levels
  const totalFinancing = levelResults.reduce(
    (sum, level) => sum + level.score,
    0
  );

  return (
    <div className="text-center max-w-2xl">
      <h1 className="text-4xl font-bold text-white mb-2 font-pixel">
        Unicorn Founder!
      </h1>

      <div className="text-white mb-6 space-y-3">
        <div className="text-lg text-primary">
          Du har bygget en billion-dollar idé
        </div>

        {/* Level Results Table */}
        {levelResults.length > 0 && (
          <div className="mt-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-600">
                    <th className="text-left py-2 px-3 text-primary font-semibold">
                      Bane
                    </th>
                    <th className="text-right py-2 px-3 text-primary font-semibold">
                      Finansiering
                    </th>
                    <th className="text-right py-2 px-3 text-primary font-semibold">
                      Bonus
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {levelResults.map((level, index) => (
                    <tr key={index} className="border-b border-gray-700/50">
                      <td className="py-2 px-3 text-left text-gray-300">
                        <Check className="w-4 h-4 text-primary inline mr-2" />
                        <span className="font-medium">{level.mapName}</span>
                        <span className="text-xs text-gray-500 ml-2">
                          (Nivå {level.level})
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right text-gray-300">
                        {level.score.toLocaleString()} kr
                      </td>
                      <td className="py-2 px-3 text-right">
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
                <tfoot>
                  <tr className="border-t-2 border-primary">
                    <td className="py-3 px-3 text-left font-bold text-primary">
                      Total finansiering
                    </td>
                    <td
                      colSpan={2}
                      className="py-3 px-3 text-right font-bold text-primary text-xl"
                    >
                      {totalFinancing.toLocaleString()} kr
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col items-center gap-3 mt-6">
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

export default VictoryMenu;
