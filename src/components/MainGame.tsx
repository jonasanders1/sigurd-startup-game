import React, { useState } from "react";
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
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";
import { useFullscreen } from "../hooks/useFullscreen";
import { useBackgroundPreloading } from "../hooks/useBackgroundPreloading";
import { VERSION_STRING, getVersion } from "../version";

const MainGame: React.FC = () => {
  const { currentState, showMenu } = useGameStore();
  const gameContainerRef = React.useRef<HTMLDivElement>(null);
  const { toggleFullscreen } = useFullscreen();
  const { isFullscreen } = useFullscreen();
  const { isPreloading } = useBackgroundPreloading();
  
  const handleFullscreenToggle = () => {
    const gameElement = gameContainerRef.current?.closest(
      "sigurd-startup"
    ) as HTMLElement;
    if (gameElement) {
      toggleFullscreen(gameElement);
    } else {
      toggleFullscreen();
    }
  };

  // Set up keyboard shortcuts
  useKeyboardShortcuts(handleFullscreenToggle);

  return (
    <div ref={gameContainerRef} className="relative rounded-lg">
      <GameCanvas />

      {/* Loading overlay */}
      {isPreloading && (
        <Menu>
          <div className="text-white text-center">
            <div className="text-lg font-bold mb-2">Loading Backgrounds...</div>
            <div className="text-sm text-gray-300">
              Please wait while we prepare your game
            </div>
          </div>
        </Menu>
      )}

      {DEV_CONFIG.ENABLED && (
        <div className="text-white text-2xl absolute top-1 left-1 bg-red-500 rounded-full p-1 flex items-center justify-center gap-1 z-50">
          <span className="text-xs font-bold uppercase">Dev</span>
          <Circle className="w-4 h-4" fill="white" />
        </div>
      )}

      {/* Version display */}
      <div
        className={`absolute bottom-3 right-3 ${
          isFullscreen ? "text-md" : "text-xs"
        } text-muted-foreground z-40 ${isFullscreen ? "bottom-4" : "bottom-3"}`}
      >
        v{VERSION_STRING} (Build {getVersion().build})
      </div>

      {/* Menu overlays positioned relative to the canvas */}
      {!isPreloading && (
        <>
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
        </>
      )}
    </div>
  );
};

export default MainGame;
