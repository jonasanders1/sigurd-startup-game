import { create } from "zustand";
import { EditorEntity, MapMeta, Tool } from "./types";
import {
  blankMapEntities,
  defaultMapMeta,
} from "./defaults";

const HISTORY_LIMIT = 50;
const STORAGE_KEY = "sigurd-editor-saves-v1";

interface Snapshot {
  entities: EditorEntity[];
  meta: MapMeta;
}

export interface SavedMap {
  key: string;        // unique storage key
  name: string;       // user-facing name
  savedAt: number;    // ms timestamp
  snapshot: Snapshot;
}

interface EditorState {
  entities: EditorEntity[];
  meta: MapMeta;
  selectedIds: Set<string>;
  tool: Tool;
  showGrid: boolean;
  gridSize: number;
  snapToGrid: boolean;
  showBackground: boolean;
  past: Snapshot[];
  future: Snapshot[];
  savedMaps: SavedMap[];

  // Actions
  setTool: (tool: Tool) => void;
  setSelected: (ids: string[] | null) => void;
  toggleSelected: (id: string) => void;
  selectAll: () => void;
  selectAllLike: (id: string) => void;
  addEntity: (entity: EditorEntity) => void;
  updateEntity: (id: string, patch: Partial<EditorEntity>) => void;
  moveSelected: (dx: number, dy: number) => void;
  deleteSelected: () => void;
  duplicateSelected: () => void;
  setMeta: (patch: Partial<MapMeta>) => void;
  loadSnapshot: (snap: Snapshot) => void;
  resetBlank: () => void;
  toggleGrid: () => void;
  setGridSize: (n: number) => void;
  toggleSnap: () => void;
  toggleBackground: () => void;
  undo: () => void;
  redo: () => void;
  // Saved maps
  refreshSaved: () => void;
  saveCurrent: (name: string) => void;
  deleteSaved: (key: string) => void;
}

const cloneSnap = (s: Pick<EditorState, "entities" | "meta">): Snapshot => ({
  entities: JSON.parse(JSON.stringify(s.entities)),
  meta: JSON.parse(JSON.stringify(s.meta)),
});

const loadSaved = (): SavedMap[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedMap[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeSaved = (maps: SavedMap[]) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(maps));
  } catch {
    // quota exceeded — silently fail
  }
};

export const useEditorStore = create<EditorState>((set, get) => {
  const pushHistory = () => {
    const { entities, meta, past } = get();
    const next = [...past, cloneSnap({ entities, meta })];
    if (next.length > HISTORY_LIMIT) next.shift();
    set({ past: next, future: [] });
  };

  return {
    entities: blankMapEntities(),
    meta: defaultMapMeta(),
    selectedIds: new Set<string>(),
    tool: { kind: "select" },
    showGrid: true,
    gridSize: 25,
    snapToGrid: true,
    showBackground: true,
    past: [],
    future: [],
    savedMaps: loadSaved(),

    setTool: (tool) => set({ tool, selectedIds: new Set() }),

    setSelected: (ids) =>
      set({ selectedIds: ids ? new Set(ids) : new Set() }),

    toggleSelected: (id) =>
      set((s) => {
        const next = new Set(s.selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return { selectedIds: next };
      }),

    selectAll: () =>
      set((s) => ({ selectedIds: new Set(s.entities.map((e) => e.id)) })),

    selectAllLike: (id) =>
      set((s) => {
        const ref = s.entities.find((e) => e.id === id);
        if (!ref) return {};
        const matches = s.entities.filter((e) => {
          if (e.kind !== ref.kind) return false;
          if (ref.kind === "monster" && e.kind === "monster") {
            return e.monsterType === ref.monsterType;
          }
          if (ref.kind === "coinSpawn" && e.kind === "coinSpawn") {
            return e.coinType === ref.coinType;
          }
          return true;
        });
        return { selectedIds: new Set(matches.map((m) => m.id)) };
      }),

    addEntity: (entity) => {
      pushHistory();
      set((s) => ({
        entities: [...s.entities, entity],
        selectedIds: new Set([entity.id]),
      }));
    },

    updateEntity: (id, patch) => {
      set((s) => ({
        entities: s.entities.map((e) =>
          e.id === id ? ({ ...e, ...patch } as EditorEntity) : e
        ),
      }));
    },

    moveSelected: (dx, dy) => {
      set((s) => ({
        entities: s.entities.map((e) =>
          s.selectedIds.has(e.id) ? ({ ...e, x: e.x + dx, y: e.y + dy } as EditorEntity) : e
        ),
      }));
    },

    deleteSelected: () => {
      const { selectedIds } = get();
      if (selectedIds.size === 0) return;
      pushHistory();
      set((s) => ({
        entities: s.entities.filter((e) => !s.selectedIds.has(e.id)),
        selectedIds: new Set(),
      }));
    },

    duplicateSelected: () => {
      const { selectedIds, entities } = get();
      if (selectedIds.size === 0) return;
      pushHistory();
      const stamp = Date.now().toString(36);
      const newOnes: EditorEntity[] = [];
      const newIds: string[] = [];
      for (const orig of entities) {
        if (!selectedIds.has(orig.id)) continue;
        const copy = {
          ...JSON.parse(JSON.stringify(orig)),
          id: `${orig.id}_copy_${stamp}_${newOnes.length}`,
          x: orig.x + 20,
          y: orig.y + 20,
        } as EditorEntity;
        newOnes.push(copy);
        newIds.push(copy.id);
      }
      set((s) => ({
        entities: [...s.entities, ...newOnes],
        selectedIds: new Set(newIds),
      }));
    },

    setMeta: (patch) => {
      pushHistory();
      set((s) => ({ meta: { ...s.meta, ...patch } }));
    },

    loadSnapshot: (snap) => {
      pushHistory();
      set({
        entities: JSON.parse(JSON.stringify(snap.entities)),
        meta: JSON.parse(JSON.stringify(snap.meta)),
        selectedIds: new Set(),
      });
    },

    resetBlank: () => {
      pushHistory();
      set({
        entities: blankMapEntities(),
        meta: defaultMapMeta(),
        selectedIds: new Set(),
      });
    },

    toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),
    setGridSize: (n) => set({ gridSize: Math.max(1, n) }),
    toggleSnap: () => set((s) => ({ snapToGrid: !s.snapToGrid })),
    toggleBackground: () => set((s) => ({ showBackground: !s.showBackground })),

    undo: () => {
      const { past, future, entities, meta } = get();
      if (past.length === 0) return;
      const prev = past[past.length - 1];
      set({
        past: past.slice(0, -1),
        future: [...future, cloneSnap({ entities, meta })],
        entities: prev.entities,
        meta: prev.meta,
        selectedIds: new Set(),
      });
    },

    redo: () => {
      const { past, future, entities, meta } = get();
      if (future.length === 0) return;
      const next = future[future.length - 1];
      set({
        past: [...past, cloneSnap({ entities, meta })],
        future: future.slice(0, -1),
        entities: next.entities,
        meta: next.meta,
        selectedIds: new Set(),
      });
    },

    refreshSaved: () => set({ savedMaps: loadSaved() }),

    saveCurrent: (name) => {
      const { entities, meta } = get();
      const trimmed = name.trim() || meta.name || "untitled";
      const all = loadSaved();
      const key =
        all.find((m) => m.name === trimmed)?.key ??
        `save_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
      const entry: SavedMap = {
        key,
        name: trimmed,
        savedAt: Date.now(),
        snapshot: cloneSnap({ entities, meta }),
      };
      const filtered = all.filter((m) => m.key !== key);
      const next = [...filtered, entry].sort((a, b) => b.savedAt - a.savedAt);
      writeSaved(next);
      set({ savedMaps: next });
    },

    deleteSaved: (key) => {
      const next = loadSaved().filter((m) => m.key !== key);
      writeSaved(next);
      set({ savedMaps: next });
    },
  };
});

export const commitHistory = () => {
  const s = useEditorStore.getState();
  const next = [...s.past, cloneSnap({ entities: s.entities, meta: s.meta })];
  if (next.length > HISTORY_LIMIT) next.shift();
  useEditorStore.setState({ past: next, future: [] });
};
