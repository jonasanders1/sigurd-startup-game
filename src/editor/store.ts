import { create } from "zustand";
import { EditorEntity, MapMeta, Tool } from "./types";
import {
  blankMapEntities,
  defaultMapMeta,
} from "./defaults";

const HISTORY_LIMIT = 50;

interface Snapshot {
  entities: EditorEntity[];
  meta: MapMeta;
}

interface EditorState {
  entities: EditorEntity[];
  meta: MapMeta;
  selectedId: string | null;
  tool: Tool;
  showGrid: boolean;
  gridSize: number;
  snapToGrid: boolean;
  showBackground: boolean;
  past: Snapshot[];
  future: Snapshot[];

  // Actions
  setTool: (tool: Tool) => void;
  setSelected: (id: string | null) => void;
  addEntity: (entity: EditorEntity) => void;
  updateEntity: (id: string, patch: Partial<EditorEntity>) => void;
  deleteEntity: (id: string) => void;
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
}

const snapshot = (s: Pick<EditorState, "entities" | "meta">): Snapshot => ({
  entities: JSON.parse(JSON.stringify(s.entities)),
  meta: JSON.parse(JSON.stringify(s.meta)),
});

export const useEditorStore = create<EditorState>((set, get) => {
  const pushHistory = () => {
    const { entities, meta, past } = get();
    const next = [...past, snapshot({ entities, meta })];
    if (next.length > HISTORY_LIMIT) next.shift();
    set({ past: next, future: [] });
  };

  return {
    entities: blankMapEntities(),
    meta: defaultMapMeta(),
    selectedId: null,
    tool: { kind: "select" },
    showGrid: true,
    gridSize: 25,
    snapToGrid: true,
    showBackground: true,
    past: [],
    future: [],

    setTool: (tool) => set({ tool, selectedId: null }),
    setSelected: (id) => set({ selectedId: id }),

    addEntity: (entity) => {
      pushHistory();
      set((s) => ({ entities: [...s.entities, entity], selectedId: entity.id }));
    },

    updateEntity: (id, patch) => {
      // Don't push history on every drag-frame; caller throttles via commitMove.
      set((s) => ({
        entities: s.entities.map((e) =>
          e.id === id ? ({ ...e, ...patch } as EditorEntity) : e
        ),
      }));
    },

    deleteEntity: (id) => {
      pushHistory();
      set((s) => ({
        entities: s.entities.filter((e) => e.id !== id),
        selectedId: s.selectedId === id ? null : s.selectedId,
      }));
    },

    duplicateSelected: () => {
      const { selectedId, entities } = get();
      if (!selectedId) return;
      const orig = entities.find((e) => e.id === selectedId);
      if (!orig) return;
      pushHistory();
      const copy = {
        ...JSON.parse(JSON.stringify(orig)),
        id: `${orig.id}_copy_${Date.now().toString(36)}`,
        x: orig.x + 20,
        y: orig.y + 20,
      } as EditorEntity;
      set((s) => ({ entities: [...s.entities, copy], selectedId: copy.id }));
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
        selectedId: null,
      });
    },

    resetBlank: () => {
      pushHistory();
      set({
        entities: blankMapEntities(),
        meta: defaultMapMeta(),
        selectedId: null,
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
        future: [...future, snapshot({ entities, meta })],
        entities: prev.entities,
        meta: prev.meta,
        selectedId: null,
      });
    },

    redo: () => {
      const { past, future, entities, meta } = get();
      if (future.length === 0) return;
      const next = future[future.length - 1];
      set({
        past: [...past, snapshot({ entities, meta })],
        future: future.slice(0, -1),
        entities: next.entities,
        meta: next.meta,
        selectedId: null,
      });
    },
  };
});

export const commitHistory = () => {
  const s = useEditorStore.getState();
  const next = [...s.past, snapshot({ entities: s.entities, meta: s.meta })];
  if (next.length > HISTORY_LIMIT) next.shift();
  useEditorStore.setState({ past: next, future: [] });
};
