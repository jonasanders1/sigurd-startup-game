import { create } from 'zustand';
import { FloatingText } from '../../types/interfaces';

interface RenderState {
  floatingTexts: FloatingText[];
}

interface RenderActions {
  addFloatingText: (text: string, x: number, y: number, duration?: number, color?: string, fontSize?: number) => void;
  removeFloatingText: (id: string) => void;
  updateFloatingTexts: () => void;
  clearAllFloatingTexts: () => void;
}

export type RenderStore = RenderState & RenderActions;

export const useRenderStore = create<RenderStore>((set, get) => ({
  // State
  floatingTexts: [],
  
  // Actions
  addFloatingText: (text: string, x: number, y: number, duration: number = 1000, color: string = '#FFFFFF', fontSize: number = 16) => {
    const id = `floating-text-${Date.now()}-${Math.random()}`;
    const floatingText: FloatingText = {
      id,
      text,
      x,
      y,
      startTime: Date.now(),
      duration,
      color,
      fontSize
    };
    
    set(state => ({
      floatingTexts: [...state.floatingTexts, floatingText]
    }));
  },
  
  removeFloatingText: (id: string) => {
    set(state => ({
      floatingTexts: state.floatingTexts.filter(text => text.id !== id)
    }));
  },
  
  updateFloatingTexts: () => {
    const currentTime = Date.now();
    set(state => ({
      floatingTexts: state.floatingTexts.filter(text => 
        currentTime - text.startTime < text.duration
      )
    }));
  },
  
  clearAllFloatingTexts: () => {
    set({ floatingTexts: [] });
  }
}));