import React from "react";
import ShortcutControls from "../ShortcutControls";
import { useGameStore, useStateStore } from "../../stores/gameStore";
import { GameState } from "@/types/enums";

const Menu = ({
  children,
  transparent,
  showShortcuts = true,
}: {
  children: React.ReactNode;
  transparent?: boolean;
  showShortcuts?: boolean;
}) => {
  const { currentState } = useStateStore();

  return (
    <div
      className={`absolute inset-0 flex items-center justify-center z-50 rounded-lg ${
        transparent ? "bg-transparent" : "bg-menu backdrop-blur-sm"
      }`}
    >
      {children}
      {currentState !== GameState.PLAYING &&
        currentState !== GameState.COUNTDOWN &&
        currentState !== GameState.GAME_OVER &&
        currentState !== GameState.VICTORY &&
        showShortcuts && <ShortcutControls />}
    </div>
  );
};

export default Menu;
