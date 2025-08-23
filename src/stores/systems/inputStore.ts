import { create } from 'zustand';

export interface InputState {
  left: boolean;
  right: boolean;
  jump: boolean;
  fastFall: boolean;
  superJump: boolean;
  float: boolean;
  restart: boolean;
}

interface InputActions {
  setInput: (key: keyof InputState, pressed: boolean) => void;
  clearInput: () => void;
  resetInput: () => void;
}

export type InputStore = { input: InputState } & InputActions;

const createInitialInputState = (): InputState => ({
  left: false,
  right: false,
  jump: false,
  fastFall: false,
  superJump: false,
  float: false,
  restart: false,
});

export const useInputStore = create<InputStore>((set, get) => ({
  // State
  input: createInitialInputState(),

  // Actions
  setInput: (key: keyof InputState, pressed: boolean) => {
    set({
      input: {
        ...get().input,
        [key]: pressed,
      },
    });
  },

  clearInput: () => {
    set({ input: createInitialInputState() });
  },

  resetInput: () => {
    set({ input: createInitialInputState() });
  },
}));