import { StateCreator } from 'zustand';
import { Player } from '../../types/interfaces';
import { GAME_CONFIG, COLORS } from '../../types/constants';

export interface PlayerSlice {
  player: Player;
  updatePlayer: (player: Partial<Player>) => void;
  resetPlayer: () => void;
  setPlayerPosition: (x: number, y: number) => void;
}

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
  jumpStartTime: 0,
  moveSpeed: GAME_CONFIG.MOVE_SPEED,
  jumpPower: GAME_CONFIG.JUMP_POWER,
  gravity: GAME_CONFIG.GRAVITY,
  floatGravity: GAME_CONFIG.FLOAT_GRAVITY
});

export const createPlayerSlice: StateCreator<PlayerSlice> = (set, get) => ({
  player: createInitialPlayer(),
  
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
        jumpStartTime: 0
      } 
    });
  }
});