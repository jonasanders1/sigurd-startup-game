import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PixelBezel } from "@/components/ui/pixel-bezel";
import {
  useLevelStore,
  useStateStore,
} from "../../../stores/gameStore";
import { waitForGameSaveConfirmation } from "../../../lib/communicationUtils";
import { Loader2, Check } from "lucide-react";

const VictoryMenu: React.FC = () => {
  const { gameStateManager } = useStateStore.getState();
  const { getLevelResults } = useLevelStore.getState();
  const [isSaving, setIsSaving] = useState(true);

  const levelResults = getLevelResults();

  useEffect(() => {
    waitForGameSaveConfirmation().then(() => {
      setIsSaving(false);
    });
  }, []);

  const handleRestart = () => {
    if (!isSaving) {
      gameStateManager?.restartGame();
    }
  };

  const totalFinancing = levelResults.reduce(
    (sum, level) => sum + level.score,
    0
  );

  const totalBonus = levelResults.reduce(
    (sum, level) => sum + level.bonus,
    0
  );

  return (
    <div className="text-center max-w-2xl">
      <h1 className="text-4xl font-pixel text-primary tracking-wide mb-1">
        UNICORN FOUNDER!
      </h1>
      <p className="text-sm text-[var(--foreground-dim)] mb-4">
        Du har bygget en billion-dollar idé
      </p>

      {levelResults.length > 0 && (
        <PixelBezel className="p-0 mb-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-mono">
              <thead>
                <tr className="border-b border-[var(--surface-line)]">
                  <th className="text-left py-2 px-3 text-primary font-pixel text-xs tracking-widest">
                    Bane
                  </th>
                  <th className="text-right py-2 px-3 text-primary font-pixel text-xs tracking-widest">
                    Finansiering
                  </th>
                  <th className="text-right py-2 px-3 text-primary font-pixel text-xs tracking-widest">
                    Bonus
                  </th>
                </tr>
              </thead>
              <tbody>
                {levelResults.map((level, index) => (
                  <tr key={index} className="border-b border-[var(--surface-line)]/30">
                    <td className="py-2 px-3 text-left text-foreground">
                      <Check className="w-4 h-4 text-primary inline mr-2" />
                      <span className="font-medium">{level.mapName}</span>
                      <span className="text-xs text-[var(--foreground-dim)] ml-2">
                        (Nivå {level.level})
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right text-foreground">
                      {level.score.toLocaleString()} kr
                    </td>
                    <td className="py-2 px-3 text-right">
                      {level.bonus > 0 ? (
                        <span className="text-amber-700 font-semibold">
                          {level.bonus.toLocaleString()} kr
                        </span>
                      ) : (
                        <span className="text-[var(--foreground-dim)]">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-primary">
                  <td className="py-3 px-3 text-left font-pixel text-primary tracking-wide">
                    TOTALT
                  </td>
                  <td className="py-3 px-3 text-right font-pixel text-primary text-lg">
                    {totalFinancing.toLocaleString()} kr
                  </td>
                  <td className="py-3 px-3 text-right font-pixel text-amber-700 text-lg">
                    {totalBonus > 0 ? `${totalBonus.toLocaleString()} kr` : "-"}
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-3 text-left font-pixel text-foreground text-base tracking-wide">
                    TOTAL FINANSIERING
                  </td>
                  <td colSpan={2} className="py-3 px-3 text-right font-pixel text-foreground text-xl">
                    {(totalFinancing + totalBonus).toLocaleString()} kr
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </PixelBezel>
      )}

      <div className="flex flex-col items-center gap-3 mt-4">
        {isSaving && (
          <div className="text-sm text-[var(--foreground-dim)] flex items-center gap-2 font-mono">
            <Loader2 className="w-4 h-4 animate-spin" />
            Lagrer spillet...
          </div>
        )}
        <Button
          onClick={handleRestart}
          disabled={isSaving}
          className={`uppercase px-10 ${
            isSaving ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          Spill igjen
        </Button>
      </div>
    </div>
  );
};

export default VictoryMenu;
