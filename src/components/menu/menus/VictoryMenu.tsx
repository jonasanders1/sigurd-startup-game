import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PixelBezel } from "@/components/ui/pixel-bezel";
import { useLevelStore, useStateStore } from "../../../stores/gameStore";
import { useBalanceStore } from "../../../stores/systems/balanceStore";
import {
  deductCredits,
  openPurchasePage,
  openLeaderboardPage,
} from "../../../lib/gameBridge";
import { waitForGameSaveConfirmation } from "../../../lib/communicationUtils";
import { Loader2, Check, Trophy } from "lucide-react";

const VictoryMenu: React.FC = () => {
  const { gameStateManager } = useStateStore.getState();
  const { getLevelResults } = useLevelStore.getState();
  const [isSaving, setIsSaving] = useState(true);
  const [isDeducting, setIsDeducting] = useState(false);
  const { hasBridge, insufficientFunds } = useBalanceStore();

  const levelResults = getLevelResults();

  useEffect(() => {
    waitForGameSaveConfirmation().then(() => {
      setIsSaving(false);
    });
  }, []);

  const handleRestart = async () => {
    if (isSaving || isDeducting) return;

    if (hasBridge && insufficientFunds) {
      openPurchasePage();
      return;
    }

    if (hasBridge) {
      setIsDeducting(true);
      const result = await deductCredits(1);
      setIsDeducting(false);

      if (!result.success) {
        useBalanceStore.getState().setInsufficientFunds(true);
        return;
      }
    }

    gameStateManager?.restartGame();
  };

  const totalFinancing = levelResults.reduce(
    (sum, level) => sum + level.score,
    0,
  );

  const totalBonus = levelResults.reduce((sum, level) => sum + level.bonus, 0);

  return (
    <div className="text-center max-w-2xl">
      <h1 className="text-3xl font-pixel text-primary tracking-wide">
        UNICORN FOUNDER!
      </h1>
      <p className="text-xs text-[var(--foreground-dim)] mb-2">
        Du har bygget en billion-dollar idé
      </p>

      {levelResults.length > 0 && (
        <PixelBezel className="p-0 mb-3">
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-mono">
              <thead>
                <tr className="border-b border-[var(--surface-line)]">
                  <th className="text-left py-1 px-3 text-primary text-xs tracking-widest">
                    Bane
                  </th>
                  <th className="text-right py-1 px-3 text-primary text-xs tracking-widest">
                    Finansiering
                  </th>
                  <th className="text-right py-1 px-3 text-primary text-xs tracking-widest">
                    Bonus
                  </th>
                </tr>
              </thead>
              <tbody>
                {levelResults.map((level, index) => (
                  <tr
                    key={index}
                    className="border-b border-[var(--surface-line)]/30"
                  >
                    <td className="py-1 px-3 text-left text-foreground">
                      <Check className="w-3.5 h-3.5 text-primary inline mr-2" />
                      <span className="font-pixel font-medium capitalize">
                        {level.mapName}
                      </span>
                    </td>
                    <td className="py-1 px-3 text-right text-foreground font-pixel tabular-nums">
                      {level.score.toLocaleString()} kr
                    </td>
                    <td className="py-1 px-3 text-right">
                      {level.bonus > 0 ? (
                        <span className="text-[var(--coin-yellow)] font-semibold font-pixel tabular-nums">
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
                  <td className="py-2 px-3 text-left font-pixel text-primary tracking-wide">
                    TOTALT
                  </td>
                  <td className="py-2 px-3 text-right font-pixel text-primary text-base">
                    {totalFinancing.toLocaleString()} kr
                  </td>
                  <td className="py-2 px-3 text-right font-pixel text-[var(--coin-yellow)] text-base">
                    {totalBonus > 0 ? `${totalBonus.toLocaleString()} kr` : "-"}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-left font-pixel text-foreground tracking-wide">
                    TOTAL FINANSIERING
                  </td>
                  <td
                    colSpan={2}
                    className="py-2 px-3 text-right font-pixel text-foreground text-lg"
                  >
                    {(totalFinancing + totalBonus).toLocaleString()} kr
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </PixelBezel>
      )}

      <div className="flex flex-col items-center gap-2">
        {isSaving && (
          <div className="text-sm text-[var(--foreground-dim)] flex items-center gap-2 font-mono">
            <Loader2 className="w-4 h-4 animate-spin" />
            Lagrer spillet...
          </div>
        )}
        <div className="flex items-center gap-3 flex-wrap justify-center">
          <Button
            onClick={handleRestart}
            disabled={isSaving || isDeducting}
            className={`uppercase px-10 ${
              isSaving || isDeducting ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {isDeducting
              ? "Venter..."
              : hasBridge && insufficientFunds
                ? "Kjøp IDÉER"
                : hasBridge
                  ? "Spill igjen"
                  : "Spill igjen"}
          </Button>

          <Button
            onClick={openLeaderboardPage}
            variant="secondary"
            className="uppercase px-10"
          >
            <Trophy size={18} />
            Toppliste
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VictoryMenu;
