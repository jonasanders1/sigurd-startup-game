import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useStateStore } from "../../../stores/gameStore";
import { useBalanceStore } from "../../../stores/systems/balanceStore";
import { deductCredits, openPurchasePage } from "../../../lib/gameBridge";

import { Joystick, Play, Settings, Lightbulb, Box } from "lucide-react";
import { VERSION_STRING } from "../../../version";

const StartMenu: React.FC = () => {
  const { gameStateManager } = useStateStore.getState();
  const { balance, hasBridge, insufficientFunds } = useBalanceStore();
  const [isDeducting, setIsDeducting] = useState(false);

  const startGame = async () => {
    if (isDeducting) return;

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

    gameStateManager?.startNewGame();
  };

  const openSettings = () => {
    gameStateManager?.openSettings();
  };

  const openControls = () => {
    gameStateManager?.openControls();
  };

  const openTutorial = () => {
    gameStateManager?.openTutorialSelect?.();
  };

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="text-center mb-8">
        <h1
          className="flicker font-pixel leading-none m-0 relative z-10 text-6xl"
          style={{
            textShadow: "3px 1px 0 var(--primary-dark)",
          }}
        >
          SIGURD
          <span className="text-primary ml-4">STARTUP</span>
        </h1>
        <p className="text-sm text-[var(--foreground-dim)]">
          Samle så mye finansiering som mulig!
        </p>
        {hasBridge && balance !== null && (
          <div className="mt-3 flex items-center justify-center gap-2 text-sm font-mono">
            <Lightbulb size={16} className="text-primary" />
            <span className="text-foreground">
              {balance} {balance === 1 ? "forretningsidé" : "forretningsidéer"}
            </span>
          </div>
        )}
      </div>

      <div className="space-y-3 w-[50%]">
        <Button
          onClick={startGame}
          disabled={isDeducting}
          className={`w-full uppercase text-lg ${isDeducting ? "opacity-70" : ""}`}
        >
          <Play size={20} />
          {isDeducting
            ? "Venter..."
            : hasBridge && insufficientFunds
              ? "Kjøp FORRETNINGSIDÉER"
              : hasBridge
                ? "Spill (1 forretningsidé)"
                : "Press Start"}
        </Button>

        <Button
          onClick={openSettings}
          variant="secondary"
          className="w-full uppercase"
        >
          <Settings size={20} />
          Innstillinger
        </Button>

        <Button
          onClick={openControls}
          variant="secondary"
          className="w-full uppercase"
        >
          <Joystick size={20} />
          Kontroller
        </Button>

        <Button
          onClick={openTutorial}
          variant="secondary"
          className="w-full uppercase"
        >
          <Box size={20} />
          Sandkassa
        </Button>
      </div>

      <div className="mt-8 text-[10px] font-mono tracking-wide text-[var(--foreground-dim)]">
        Sigurd Startup {VERSION_STRING}
      </div>
    </div>
  );
};

export default StartMenu;
