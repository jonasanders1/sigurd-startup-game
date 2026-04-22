import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useStateStore } from "../../../stores/gameStore";
import { useBalanceStore } from "../../../stores/systems/balanceStore";
import { deductCredits } from "../../../lib/gameBridge";

import { Play, Settings, RotateCcw } from "lucide-react";

const PauseMenu: React.FC = () => {
  const { gameStateManager } = useStateStore.getState();
  const { hasBridge, insufficientFunds } = useBalanceStore();
  const [isDeducting, setIsDeducting] = useState(false);

  const resumeGame = () => {
    gameStateManager?.resumeGame();
  };

  const openSettings = () => {
    gameStateManager?.openSettings();
  };

  const quitToMenu = () => {
    gameStateManager?.quitToMenu();
  };

  const restartGame = async () => {
    if (isDeducting) return;

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

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="text-center mb-6">
        <h1 className="text-5xl font-pixel text-foreground tracking-wide">PAUSE</h1>
        <p className="text-sm text-[var(--foreground-dim)] mt-2">Trykk P for å fortsette</p>
      </div>

      <div className="space-y-3 w-64">
        <Button onClick={resumeGame} className="w-full uppercase">
          <Play size={20} />
          Fortsett
        </Button>

        <Button onClick={openSettings} variant="secondary" className="w-full uppercase">
          <Settings size={20} />
          Innstillinger
        </Button>

        {insufficientFunds && hasBridge ? (
          <div className="text-center py-2 px-4 bg-[var(--accent-red)]/10 border border-[var(--accent-red)]/30 rounded-sm">
            <p className="text-[var(--accent-red)] font-pixel text-xs">IKKE NOK MYNTER</p>
          </div>
        ) : (
          <Button
            onClick={restartGame}
            variant="secondary"
            disabled={isDeducting}
            className={`w-full uppercase ${isDeducting ? "opacity-70" : ""}`}
          >
            <RotateCcw size={20} />
            {isDeducting ? "Venter..." : hasBridge ? "Start på nytt (1 mynt)" : "Start på nytt"}
          </Button>
        )}

        <button
          onClick={quitToMenu}
          className="w-full text-[var(--foreground-dim)] text-sm font-mono underline underline-offset-4 hover:text-primary py-2 cursor-pointer"
        >
          Avslutt til hovedmeny
        </button>
      </div>
    </div>
  );
};

export default PauseMenu;
