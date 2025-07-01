import React from "react";
import { Button } from "@/components/ui/button";
import { useGameStore } from "../../../stores/gameStore";
import { GameState, MenuType } from "../../../types/enums";
import { Play, Settings } from "lucide-react";

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

  const openSettings = () => {
    setMenuType(MenuType.SETTINGS);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Sigurd Startup</h1>
        <p className="text-muted-foreground">
          Samle så mye finansiering som mulig!
        </p>
      </div>

      <div className="space-y-4 w-[70%]">
        <Button
          onClick={startGame}
          className="w-full bg-primary hover:bg-primary-80 text-white font-bold py-3 text-lg transition-all duration-200 uppercase flex items-center justify-center gap-2"
        >
          <Play size={20} />
          Start
        </Button>

        <Button
          onClick={openSettings}
          variant="outline"
          className="w-full border-secondary text-muted-foreground hover:bg-secondary hover:text-white font-bold py-3 text-lg transition-all duration-200 uppercase flex items-center justify-center gap-2"
        >
          <Settings size={20} />
          Innstillinger
        </Button>
      </div>
    </div>
  );
};

export default StartMenu;
