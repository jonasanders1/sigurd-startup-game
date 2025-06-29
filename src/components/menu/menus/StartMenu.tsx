import React from "react";
import { Button } from "@/components/ui/button";
import { useGameStore } from "../../../stores/gameStore";
import { GameState, MenuType } from "../../../types/enums";
import { Play, Settings, HelpCircle } from "lucide-react";

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

  const openHowToPlay = () => {
    console.log('How to play clicked');
  };

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <h1 className="text-4xl font-bold text-primary mb-4 uppercase">
        Sigurd Startup
      </h1>

      <div className="text-white mb-8 space-y-2">
        <p className="text-lg">
          Sample så mye finansiering som mulig og unngå byrokrati
        </p>
      </div>

      <div className="space-y-4 w-full max-w-sm">
        <Button
          onClick={startGame}
          className="w-full bg-primary hover:bg-primary/80 text-white font-bold py-3 px-8 text-lg transition-all duration-200 transform hover:scale-105 uppercase flex items-center justify-center gap-2"
        >
          <Play size={20} />
          Start Forretningsidé
        </Button>
        
        <Button
          onClick={openHowToPlay}
          variant="outline"
          className="w-full border-[#484744] text-[#cbcbca] hover:bg-[#484744] hover:text-white font-bold py-3 text-lg transition-all duration-200 uppercase flex items-center justify-center gap-2"
        >
          <HelpCircle size={20} />
          How to Play
        </Button>
        
        <Button
          onClick={openSettings}
          variant="outline"
          className="w-full border-[#484744] text-[#cbcbca] hover:bg-[#484744] hover:text-white font-bold py-3 text-lg transition-all duration-200 uppercase flex items-center justify-center gap-2"
        >
          <Settings size={20} />
          Settings
        </Button>
      </div>
    </div>
  );
};

export default StartMenu;
