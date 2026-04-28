import React, { useEffect } from "react";
import { useEditorStore } from "./store";
import { EditorCanvas } from "./EditorCanvas";
import { ToolPalette } from "./ToolPalette";
import { PropertiesPanel } from "./PropertiesPanel";
import { Toolbar } from "./Toolbar";

export const EditorRoot: React.FC = () => {
  const {
    selectedId,
    deleteEntity,
    duplicateSelected,
    undo,
    redo,
    setTool,
    tool,
    updateEntity,
    entities,
  } = useEditorStore();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const inField =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);
      if (inField) return;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "d") {
        e.preventDefault();
        duplicateSelected();
        return;
      }
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        e.preventDefault();
        deleteEntity(selectedId);
        return;
      }
      if (e.key === "Escape") {
        if (tool.kind !== "select") setTool({ kind: "select" });
        return;
      }
      // Nudge selected entity with arrow keys
      if (selectedId && ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
        e.preventDefault();
        const ent = entities.find((en) => en.id === selectedId);
        if (!ent) return;
        const step = e.shiftKey ? 10 : 1;
        const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
        const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
        updateEntity(selectedId, { x: ent.x + dx, y: ent.y + dy });
        return;
      }
      // Tool shortcuts
      const map: Record<string, () => void> = {
        v: () => setTool({ kind: "select" }),
        p: () => setTool({ kind: "place", entity: "platform" }),
        w: () => setTool({ kind: "place", entity: "platform", subType: "vertical" }),
        b: () => setTool({ kind: "place", entity: "bomb" }),
        s: () => setTool({ kind: "place", entity: "playerStart" }),
      };
      const fn = map[e.key.toLowerCase()];
      if (fn) {
        e.preventDefault();
        fn();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    selectedId,
    deleteEntity,
    duplicateSelected,
    undo,
    redo,
    setTool,
    tool,
    updateEntity,
    entities,
  ]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#020617",
        display: "flex",
        flexDirection: "column",
        color: "#e5e7eb",
      }}
    >
      <Toolbar />
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <ToolPalette />
        <div
          style={{
            flex: 1,
            overflow: "auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            background:
              "repeating-conic-gradient(#0b1220 0% 25%, #0f172a 0% 50%) 0 0 / 30px 30px",
          }}
        >
          <EditorCanvas />
        </div>
        <PropertiesPanel />
      </div>
    </div>
  );
};
