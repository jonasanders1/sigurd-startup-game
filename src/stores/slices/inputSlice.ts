import { StateCreator } from "zustand";

export interface InputState {
  left: boolean;
  right: boolean;
  jump: boolean;
  fastFall: boolean;
  superJump: boolean;
  float: boolean;
  restart: boolean;
}

export interface InputSlice {
  input: InputState;
  setInput: (key: keyof InputState, pressed: boolean) => void;
  clearInput: () => void;
  resetInput: () => void;
}

const createInitialInputState = (): InputState => ({
  left: false,
  right: false,
  jump: false,
  fastFall: false,
  superJump: false,
  float: false,
  restart: false,
});

export const createInputSlice: StateCreator<InputSlice> = (set, get) => ({
  input: createInitialInputState(),

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
});
