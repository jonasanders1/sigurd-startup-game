import { create } from "zustand";

interface BalanceState {
  balance: number | null; // null = bridge not available (standalone mode)
  hasBridge: boolean;
  insufficientFunds: boolean;

  setBalance: (balance: number) => void;
  setBridgeAvailable: (available: boolean) => void;
  setInsufficientFunds: (insufficient: boolean) => void;
}

export const useBalanceStore = create<BalanceState>((set) => ({
  balance: null,
  hasBridge: false,
  insufficientFunds: false,

  setBalance: (balance) => set({ balance, insufficientFunds: balance <= 0 }),
  setBridgeAvailable: (available) => set({ hasBridge: available }),
  setInsufficientFunds: (insufficient) => set({ insufficientFunds: insufficient }),
}));
