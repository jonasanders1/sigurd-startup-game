import React from "react";
import { useGameStore, useStateStore } from "../stores/gameStore";
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
import ControlsMenu from "./menu/menus/ControlsMenu";
import TutorialSelectMenu from "./menu/menus/TutorialSelectMenu";
import MissionBriefMenu from "./menu/menus/MissionBriefMenu";
import MissionCompleteMenu from "./menu/menus/MissionCompleteMenu";
import TutorialOverlay from "./menu/menus/TutorialOverlay";

const MainGame: React.FC = () => {
  // Fix: Use the store hooks properly to subscribe to state changes
  const { currentState, showMenu } = useStateStore();
  const gameContainerRef = React.useRef<HTMLDivElement>(null);
  const { toggleFullscreen } = useFullscreen();
  const { isFullscreen } = useFullscreen();

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
    <div ref={gameContainerRef} className="relative rounded-lg overflow-hidden shadow-lg shadow-black/10">
      {/* ── HUD top bar — separate strip above the canvas ── */}
      <div className="relative z-50">
        <InGameMenu />
      </div>

      {/* Game Canvas + overlays — bg prevents sub-pixel flicker at clipped edges */}
      <div className="relative bg-black">
        <GameCanvas />

        {/* Tutorial info card — top-right when a mission is active */}
        {currentState === GameState.PLAYING && <TutorialOverlay />}

        {/* Dev indicator */}
        {DEV_CONFIG.ENABLED && (
          <div className="text-white text-2xl absolute top-1 left-1 bg-red-500 rounded-full p-1 flex items-center justify-center gap-1 z-50">
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
        {showMenu === MenuType.CONTROLS && (
          <Menu>
            <ControlsMenu />
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
        {showMenu === MenuType.TUTORIAL_SELECT && (
          <Menu>
            <TutorialSelectMenu />
          </Menu>
        )}
        {showMenu === MenuType.TUTORIAL_BRIEF && (
          <Menu>
            <MissionBriefMenu />
          </Menu>
        )}
        {showMenu === MenuType.TUTORIAL_RESULT && (
          <Menu>
            <MissionCompleteMenu />
          </Menu>
        )}
      </div>
    </div>
  );
};

export default MainGame;
