import React from "react";
import { useGameStore } from "../stores/gameStore";
import { GameState, MenuType } from "../types/enums";
import GameCanvas from "./GameCanvas";
import StartMenu from "./menu/menus/StartMenu";
import CountdownOverlay from "./menu/menus/CountdownOverlay";
import InGameMenu from "./menu/menus/InGameMenu";
import PauseMenu from "./menu/menus/PauseMenu";
import SettingsMenu from "./menu/menus/SettingsMenu";
import BonusScreen from "./menu/menus/BonusScreen";
import VictoryMenu from "./menu/menus/VictoryMenu";
import GameOverScreen from "./menu/menus/GameOverScreen";
import AudioSettingsMenu from "./menu/menus/AudioSettingsMenu";
import Menu from "./menu/Menu";
import { DEV_CONFIG } from "@/types/constants";
import { Circle } from "lucide-react";

const MainGame: React.FC = () => {
  const { currentState, showMenu } = useGameStore();

  return (
    <div className="relative w-full h-screen bg-background flex items-center justify-center">
      {/* Game Canvas Container */}
      <div className="relative">
        <GameCanvas />

        {DEV_CONFIG.ENABLED && (
          <div className="text-white text-2xl absolute top-1 left-1 bg-red-500 rounded-full p-1 flex items-center justify-center gap-1">
            <span className="text-xs font-bold uppercase">Dev</span>
            <Circle className="w-4 h-4" fill="white" />
          </div>
        )}

        {/* Menu overlays positioned relative to the canvas */}
        {showMenu === MenuType.START && (
          <Menu>
            <StartMenu />
          </Menu>
        )}
        {showMenu === MenuType.COUNTDOWN && (
          <Menu>
            <CountdownOverlay />
          </Menu>
        )}
        {showMenu === MenuType.PAUSE && (
          <Menu>
            <PauseMenu />
          </Menu>
        )}
        {showMenu === MenuType.SETTINGS && (
          <Menu>
            <SettingsMenu />
          </Menu>
        )}
        {currentState === GameState.PLAYING && (
          <Menu transparent={true}>
            <InGameMenu />
          </Menu>
        )}
        {showMenu === MenuType.BONUS && (
          <Menu>
            <BonusScreen />
          </Menu>
        )}
        {showMenu === MenuType.VICTORY && (
          <Menu>
            <VictoryMenu />
          </Menu>
        )}
        {showMenu === MenuType.GAME_OVER && (
          <Menu>
            <GameOverScreen />
          </Menu>
        )}
        {showMenu === MenuType.AUDIO_SETTINGS && (
          <Menu>
            <AudioSettingsMenu />
          </Menu>
        )}
      </div>
    </div>
  );
};

export default MainGame;
