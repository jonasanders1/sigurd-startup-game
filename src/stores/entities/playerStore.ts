import { create } from "zustand";
import { Player } from "../../types/interfaces";
import { GAME_CONFIG, COLORS } from "../../types/constants";
import { GRAVITY_APEX_INDEX } from "../../lib/gravityLUT";

interface PlayerState {
  player: Player;
}

interface PlayerActions {
  updatePlayer: (player: Partial<Player>) => void;
  resetPlayer: () => void;
  setPlayerPosition: (x: number, y: number) => void;
}

export type PlayerStore = PlayerState & PlayerActions;

const createInitialPlayer = (): Player => ({
  x: GAME_CONFIG.CANVAS_WIDTH / 2,
  y: GAME_CONFIG.CANVAS_HEIGHT - 100,
  width: GAME_CONFIG.PLAYER_WIDTH,
  height: GAME_CONFIG.PLAYER_HEIGHT,
  color: COLORS.PLAYER,
  velocityX: 0,
  velocityY: 0,
  isGrounded: false,
  isFloating: false,
  isJumping: false,
  isFastFalling: false,
  jumpStartTime: 0,
  moveSpeed: GAME_CONFIG.MOVE_SPEED,
  jumpPower: GAME_CONFIG.JUMP_POWER,
  // BJ gravity LUT index (game-specs §4.3). Apex = neutral grounded state;
  // walking off a platform advances naturally toward terminal velocity.
  gravityIndex: GRAVITY_APEX_INDEX,
  jumpAdvanceRate: 1.0,
  gravity: GAME_CONFIG.GRAVITY,
  floatGravity: GAME_CONFIG.FLOAT_GRAVITY,
});

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  // State
  player: createInitialPlayer(),

  // Actions
  updatePlayer: (playerUpdate: Partial<Player>) => {
    set({ player: { ...get().player, ...playerUpdate } });
  },

  resetPlayer: () => {
    set({ player: createInitialPlayer() });
  },

  setPlayerPosition: (x: number, y: number) => {
    set({
      player: {
        ...get().player,
        x,
        y,
        velocityX: 0,
        velocityY: 0,
        isGrounded: false,
        isFloating: false,
        isJumping: false,
        isFastFalling: false,
        jumpStartTime: 0,
        gravityIndex: GRAVITY_APEX_INDEX,
        jumpAdvanceRate: 1.0,
      },
    });
  },
}));
