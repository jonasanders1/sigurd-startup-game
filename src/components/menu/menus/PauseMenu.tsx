import React from "react";
import { Button } from "@/components/ui/button";
import { useGameStore } from "../../../stores/gameStore";
import { GameState, MenuType } from "../../../types/enums";
import { Play, Settings, Home, RotateCcw } from "lucide-react";
import { mapDefinitions } from "../../../maps/mapDefinitions";

const PauseMenu: React.FC = () => {
  const { setState, setMenuType, resetGame } = useGameStore();

  const resumeGame = () => {
    setState(GameState.PLAYING);
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
    
    // Reload the current level since resetGame() cleared the level data
    const gameState = useGameStore.getState();
    const currentLevel = gameState.currentLevel;
    
    // Reload the level data for the current level
    if (currentLevel <= mapDefinitions.length) {
      const mapDefinition = mapDefinitions[currentLevel - 1];
      gameState.initializeLevel(mapDefinition);
    }
    
    setMenuType(MenuType.COUNTDOWN);
    setState(GameState.COUNTDOWN);
    
    // After 3 seconds, start the game
    setTimeout(() => {
      setState(GameState.PLAYING);
    }, 3000);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="bg-[#262521] backdrop-blur-sm rounded-xl p-8 border border-[#484744] max-w-md w-full">
        <h2 className="text-2xl font-bold text-[#81b64c] text-center mb-6 uppercase">
          Paused
        </h2>
        
        <div className="space-y-4">
          <Button
            onClick={resumeGame}
            className="w-full bg-[#81b64c] hover:bg-[#81b64c]/80 text-black font-bold py-3 text-lg transition-all duration-200 transform hover:scale-105 uppercase flex items-center justify-center gap-2"
          >
            <Play size={20} />
            Resume
          </Button>
          
          <Button
            onClick={openSettings}
            variant="outline"
            className="w-full border-[#484744] text-[#cbcbca] hover:bg-[#484744] hover:text-white font-bold py-3 text-lg transition-all duration-200 uppercase flex items-center justify-center gap-2"
          >
            <Settings size={20} />
            Settings
          </Button>
          
          <Button
            onClick={restartGame}
            variant="outline"
            className="w-full border-[#484744] text-[#cbcbca] hover:bg-[#484744] hover:text-white font-bold py-3 text-lg transition-all duration-200 uppercase flex items-center justify-center gap-2"
          >
            <RotateCcw size={20} />
            Restart
          </Button>
          
          <Button
            onClick={quitToMenu}
            variant="outline"
            className="w-full border-red-600 text-red-400 hover:bg-red-600 hover:text-white font-bold py-3 text-lg transition-all duration-200 uppercase flex items-center justify-center gap-2"
          >
            <Home size={20} />
            Quit to Menu
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PauseMenu; 