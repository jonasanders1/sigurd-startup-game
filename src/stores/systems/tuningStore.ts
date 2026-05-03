/**
 * Global tuning store. Holds runtime overrides for every tunable parameter
 * (see src/config/tuningDefaults.ts). Values not present here fall back to
 * `TUNING_DEFAULTS`.
 *
 * Persists to localStorage under TUNING_LOCALSTORAGE_KEY so user-tweaked
 * values survive page reloads. Defaults are NEVER serialized — only
 * override entries are stored, so future changes to defaults propagate
 * cleanly.
 *
 * No SCORING values are tunable here — points/multipliers/bonus tables are
 * fixed per BJ ruleset.
 */

import { create } from "zustand";
import { TUNING_DEFAULTS, TUNING_FIELDS, type TuningSection } from "../../config/tuningDefaults";

const TUNING_LOCALSTORAGE_KEY = "sigurd-tuning-overrides-v1";

interface TuningState {
  /** Sparse overrides — only keys the user has changed. */
  overrides: Record<string, number>;
  /**
   * Bumped on every change. Consumers caching derived data (e.g. the gravity
   * LUT) read this to invalidate.
   */
  version: number;
}

interface TuningActions {
  set: (key: string, value: number) => void;
  resetKey: (key: string) => void;
  resetSection: (section: TuningSection) => void;
  resetAll: () => void;
}

export type TuningStore = TuningState & TuningActions;

const loadFromStorage = (): Record<string, number> => {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(TUNING_LOCALSTORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return parsed as Record<string, number>;
  } catch {
    /* corrupted entry — ignore and start fresh */
  }
  return {};
};

const saveToStorage = (overrides: Record<string, number>): void => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      TUNING_LOCALSTORAGE_KEY,
      JSON.stringify(overrides)
    );
  } catch {
    /* quota exceeded or storage disabled — silently drop */
  }
};

export const useTuningStore = create<TuningStore>((set, get) => ({
  overrides: loadFromStorage(),
  version: 0,

  set: (key, value) => {
    const next = { ...get().overrides, [key]: value };
    saveToStorage(next);
    set({ overrides: next, version: get().version + 1 });
  },

  resetKey: (key) => {
    const next = { ...get().overrides };
    delete next[key];
    saveToStorage(next);
    set({ overrides: next, version: get().version + 1 });
  },

  resetSection: (section) => {
    const sectionKeys = new Set(
      TUNING_FIELDS.filter((f) => f.section === section).map((f) => f.key)
    );
    const next = Object.fromEntries(
      Object.entries(get().overrides).filter(([k]) => !sectionKeys.has(k))
    );
    saveToStorage(next);
    set({ overrides: next, version: get().version + 1 });
  },

  resetAll: () => {
    saveToStorage({});
    set({ overrides: {}, version: get().version + 1 });
  },
}));

/**
 * Direct (non-React) read for the current value. Game-loop / movement code
 * uses this to avoid React re-render churn — they re-read every frame.
 */
export const getTuned = (key: string): number => {
  const override = useTuningStore.getState().overrides[key];
  if (typeof override === "number") return override;
  const def = TUNING_DEFAULTS[key];
  if (typeof def === "number") return def;
  // Programmer error — unknown key. Return 0 to fail loudly without crashing.
  console.warn(`[tuning] unknown key: ${key}`);
  return 0;
};

/** Get the current override version. Used by cache invalidation. */
export const getTuningVersion = (): number => useTuningStore.getState().version;
