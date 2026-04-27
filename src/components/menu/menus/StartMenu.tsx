import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useStateStore } from "../../../stores/gameStore";
import { useBalanceStore } from "../../../stores/systems/balanceStore";
import { deductCredits } from "../../../lib/gameBridge";

import { Joystick, Play, Settings, Coins } from "lucide-react";

const StartMenu: React.FC = () => {
  const { gameStateManager } = useStateStore.getState();
  const { balance, hasBridge, insufficientFunds } = useBalanceStore();
  const [isDeducting, setIsDeducting] = useState(false);

  const startGame = async () => {
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

    gameStateManager?.startNewGame();
  };

  const openSettings = () => {
    gameStateManager?.openSettings();
  };

  const openControls = () => {
    gameStateManager?.openControls();
  };

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-pixel text-foreground tracking-wide mb-2">
          SIGURD STARTUP
        </h1>
        <p className="text-sm text-[var(--foreground-dim)]">
          Samle så mye finansiering som mulig!
        </p>
        {hasBridge && balance !== null && (
          <div className="mt-3 flex items-center justify-center gap-2 text-sm font-mono">
            <Coins size={16} className="text-primary" />
            <span className="text-foreground">
              {balance} {balance === 1 ? "mynt" : "mynter"}
            </span>
          </div>
        )}
      </div>

      <div className="space-y-3 w-[70%]">
        {insufficientFunds && hasBridge ? (
          <div className="text-center py-3 px-4 bg-[var(--accent-red)]/10 border border-[var(--accent-red)]/30 rounded-sm">
            <p className="text-[var(--accent-red)] font-pixel text-sm">IKKE NOK MYNTER</p>
            <p className="text-[var(--foreground-dim)] text-xs font-mono mt-1">
              Kjøp flere mynter for å spille
            </p>
          </div>
        ) : (
          <Button
            onClick={startGame}
            disabled={isDeducting || (hasBridge && insufficientFunds)}
            className={`w-full uppercase text-lg ${isDeducting ? "opacity-70" : ""}`}
          >
            <Play size={20} />
            {isDeducting ? "Venter..." : hasBridge ? "Spill (1 mynt)" : "Press Start"}
          </Button>
        )}

        <Button onClick={openSettings} variant="secondary" className="w-full uppercase">
          <Settings size={20} />
          Innstillinger
        </Button>

        <Button onClick={openControls} variant="secondary" className="w-full uppercase">
          <Joystick size={20} />
          Kontroller
        </Button>
      </div>
    </div>
  );
};

export default StartMenu;
