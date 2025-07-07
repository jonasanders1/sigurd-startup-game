import React from "react";
import { Button } from "@/components/ui/button";
import { useGameStore } from "../../../stores/gameStore";
import { GameState, MenuType } from "../../../types/enums";
import { Play, Settings, Home, RotateCcw } from "lucide-react";


const PauseMenu: React.FC = () => {
  const { setState, setMenuType, resetGame } = useGameStore();

  const resumeGame = () => {
    // Show countdown before resuming
    setMenuType(MenuType.COUNTDOWN);
    setState(GameState.COUNTDOWN);
    
    // After 3 seconds, start the game
    setTimeout(() => {
      setState(GameState.PLAYING);
    }, 3000);
  };

  const openSettings = () => {
    setMenuType(MenuType.SETTINGS);
  };

  const quitToMenu = () => {
    resetGame();
    setState(GameState.MENU);
    setMenuType(MenuType.START);
  };

  const restartGame = () => {
    resetGame();

    // Set state to MENU with no current map to trigger level reload in GameManager
    setState(GameState.MENU);
    setMenuType(MenuType.COUNTDOWN);

    // Start countdown immediately, GameManager will handle the level reload
    setState(GameState.COUNTDOWN);
    
    // After 3 seconds, start the game
    setTimeout(() => {
      setState(GameState.PLAYING);
    }, 3000);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="space-y-4">
        <Button
          onClick={resumeGame}
          className="w-full bg-primary hover:bg-primary-80 text-white font-bold py-3 text-md transition-all duration-200 uppercase flex items-center justify-center gap-2"
        >
          <Play size={20} />
          Fortsett
        </Button>

        <Button
          onClick={openSettings}
          variant="outline"
          className="w-full border-secondary text-muted-foreground bg-secondary hover:text-white font-bold py-3 text-md transition-all duration-200 uppercase flex items-center justify-center gap-2"
        >
          <Settings size={20} />
          Innstillinger
        </Button>

        <Button
          onClick={restartGame}
          variant="outline"
          className="w-full border-secondary text-muted-foreground bg-secondary hover:text-white font-bold py-3 text-md transition-all duration-200 uppercase flex items-center justify-center gap-2"
        >
          <RotateCcw size={20} />
          Start på nytt
        </Button>

        <Button
          onClick={quitToMenu}
          variant="default"
          className="w-full bg-red-600 hover:bg-red-600/80 text-white font-bold py-3 text-md transition-all duration-200 uppercase flex items-center justify-center gap-2"
        >
          <Home size={20} />
          hovedmeny
        </Button>
      </div>
    </div>
  );
};

export default PauseMenu;
