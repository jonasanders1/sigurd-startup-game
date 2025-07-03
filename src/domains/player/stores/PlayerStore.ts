import { StateCreator } from 'zustand';
import { PlayerState, DEFAULT_PLAYER_CONFIG } from '../types';
import { GAME_CONFIG } from '../../../types/constants';

export interface PlayerStore {
  // State
  position: { x: number; y: number };
  velocity: { x: number; y: number };
  physics: {
    isGrounded: boolean;
    isFloating: boolean;
    isJumping: boolean;
    jumpStartTime: number;
  };
  
  // Actions
  setPosition: (x: number, y: number) => void;
  setVelocity: (vx: number, vy: number) => void;
  updatePhysics: (updates: Partial<PlayerStore['physics']>) => void;
  reset: () => void;
  
  // Computed getters
  getState: () => PlayerState;
}

export const createPlayerStore: StateCreator<any, [], [], PlayerStore> = (set, get) => ({
  // Initial state
  position: { x: 100, y: 300 },
  velocity: { x: 0, y: 0 },
  physics: {
    isGrounded: false,
    isFloating: false,
    isJumping: false,
    jumpStartTime: 0,
  },
  
  // Actions
  setPosition: (x, y) => {
    set((state) => {
      state.player.position.x = x;
      state.player.position.y = y;
    });
  },
  
  setVelocity: (vx, vy) => {
    set((state) => {
      state.player.velocity.x = vx;
      state.player.velocity.y = vy;
    });
  },
  
  updatePhysics: (updates) => {
    set((state) => {
      Object.assign(state.player.physics, updates);
    });
  },
  
  reset: () => {
    set((state) => {
      state.player.position = { x: 100, y: 300 };
      state.player.velocity = { x: 0, y: 0 };
      state.player.physics = {
        isGrounded: false,
        isFloating: false,
        isJumping: false,
        jumpStartTime: 0,
      };
    });
  },
  
  // Computed getter that returns the full player state
  getState: () => {
    const state = get().player;
    return {
      x: state.position.x,
      y: state.position.y,
      width: DEFAULT_PLAYER_CONFIG.width,
      height: DEFAULT_PLAYER_CONFIG.height,
      velocityX: state.velocity.x,
      velocityY: state.velocity.y,
      isGrounded: state.physics.isGrounded,
      isFloating: state.physics.isFloating,
      isJumping: state.physics.isJumping,
      jumpStartTime: state.physics.jumpStartTime,
      moveSpeed: DEFAULT_PLAYER_CONFIG.moveSpeed,
      jumpPower: DEFAULT_PLAYER_CONFIG.jumpPower,
      gravity: DEFAULT_PLAYER_CONFIG.gravity,
      floatGravity: DEFAULT_PLAYER_CONFIG.floatGravity,
    };
  },
});