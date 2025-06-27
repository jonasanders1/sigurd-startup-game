import React from "react";
import { Button } from "@/components/ui/button";
import { useGameStore } from "../../../stores/gameStore";
import { GameState, MenuType } from "../../../types/enums";

const StartMenu: React.FC = () => {
  const { setState, setMenuType } = useGameStore();

  const startGame = () => {
    // First hide the start menu
    setMenuType(MenuType.COUNTDOWN);
    // Then set countdown state
    setState(GameState.COUNTDOWN);

    // After 3 seconds, start the game
    setTimeout(() => {
      setState(GameState.PLAYING);
    }, 3000);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <h1 className="text-4xl font-bold text-primary mb-4 uppercase">
        Sigurd Startup
      </h1>

      <div className="text-white mb-6 space-y-2">
        <p className="text-lg">Sample finansiering og unngå byrokratier</p>
        <p className="text-sm">Follow the order for bonus points</p>
      </div>

      <Button
        onClick={startGame}
        className="bg-primary hover:bg-primary/80 text-white font-bold py-3 px-8 text-lg transition-all duration-200 transform hover:scale-105"
      >
        START GAME
      </Button>
    </div>
  );
};

export default StartMenu;
