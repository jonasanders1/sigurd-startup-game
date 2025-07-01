import React from "react";
import { Button } from "@/components/ui/button";
import { useGameStore } from "../../../stores/gameStore";

const GameOverScreen: React.FC = () => {
  const { score, resetGame, levelHistory } = useGameStore();

  const handleRestart = () => {
    resetGame();
  };

  return (
    <div className="bg-gradient-to-b rounded-lg text-center max-w-md">
      <h1 className="text-4xl font-bold text-red-400 mb-4 uppercase">
        konkurs
      </h1>

      <div className="text-white mb-6 space-y-3">
        <div className="text-2xl">
          <span className="text-yellow-400">
            Total finansiering:{" "}
            <span className="font-bold text-white">
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
                      Korrekt
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
                        {level.correctOrderCount}/{level.totalBombs}
                      </td>
                      <td className="py-2 px-2 text-gray-300">
                        {level.score.toLocaleString()}
                      </td>
                      <td className="py-2 px-2">
                        {level.hasBonus ? (
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

      <Button
        onClick={handleRestart}
        className="bg-primary hover:bg-primary/80 text-white font-bold py-3 px-8 text-lg transition-all duration-200 transform hover:scale-105 uppercase"
      >
        prøv igjen
      </Button>
    </div>
  );
};

export default GameOverScreen;
