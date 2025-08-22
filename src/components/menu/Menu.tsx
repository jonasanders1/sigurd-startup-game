import React from "react";
import ShortcutControls from "../ShortcutControls";
import { useGameStore } from "../../stores/gameStore";
import { GameState } from "@/types/enums";

const Menu = ({
  children,
  transparent,
}: {
  children: React.ReactNode;
  transparent?: boolean;
}) => {
  const { currentState } = useGameStore();

  return (
    <div
      className={`absolute inset-0 flex items-center justify-center z-50 rounded-lg ${
        transparent ? "bg-transparent" : "bg-menu backdrop-blur-sm"
      }`}
    >
      {children}
      {currentState !== GameState.PLAYING && <ShortcutControls />}
    </div>
  );
};

export default Menu;
