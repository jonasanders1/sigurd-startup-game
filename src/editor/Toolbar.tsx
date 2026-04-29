import React, { useState, useRef } from "react";
import { useEditorStore } from "./store";
import { serializeMap } from "./serialize";
import { mapToEditor } from "./deserialize";
import { mapDefinitions } from "../maps/mapDefinitions";
import { MapDefinition } from "../types/interfaces";
import {
  FilePlus2,
  FolderOpen,
  Download,
  Save,
  Upload,
  FileDown,
  Grid3x3,
  Magnet,
  Image as ImageIcon,
  Sparkles,
  Undo2,
  Redo2,
  AlertTriangle,
  CheckCircle2,
  X,
  Trash2,
  Play,
} from "lucide-react";

const buildBuiltinList = (): { id: string; map: MapDefinition; label: string }[] =>
  mapDefinitions.map((m, i) => ({
    id: `__builtin_${i}`,
    map: m,
    label: `${i + 1} — ${m.name}`,
  }));

const btn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "6px 10px",
  background: "#1f2937",
  border: "1px solid #374151",
  borderRadius: 4,
  color: "#e5e7eb",
  fontSize: 12,
  cursor: "pointer",
  fontFamily: "system-ui, sans-serif",
};

const btnActive: React.CSSProperties = {
  ...btn,
  background: "#2563eb",
  border: "1px solid #3b82f6",
};

interface ExportPayload {
  code: string;
  warnings: string[];
}

const ExportModal: React.FC<{ payload: ExportPayload; onClose: () => void }> = ({
  payload,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(payload.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // ignore
    }
  };
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#0f172a",
          border: "1px solid #334155",
          borderRadius: 8,
          padding: 16,
          width: "min(900px, 92vw)",
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          color: "#e5e7eb",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 700 }}>Exported Map (TypeScript)</div>
          <button onClick={onClose} style={btn}>
            <X size={14} />
          </button>
        </div>

        {payload.warnings.length > 0 && (
          <div
            style={{
              background: "#422006",
              border: "1px solid #b45309",
              padding: 8,
              borderRadius: 4,
              marginBottom: 12,
              fontSize: 12,
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 6,
                alignItems: "center",
                fontWeight: 700,
                marginBottom: 4,
              }}
            >
              <AlertTriangle size={14} /> Warnings
            </div>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {payload.warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
        )}

        <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 8 }}>
          Paste this into <code>src/maps/mapDefinitions.ts</code>. The factory
          functions (<code>createPlatform</code>, <code>createBomb</code>, etc.)
          and constants/imports are already declared at the top of that file.
        </div>

        <textarea
          readOnly
          value={payload.code}
          style={{
            flex: 1,
            minHeight: 400,
            padding: 12,
            background: "#020617",
            color: "#a5f3fc",
            border: "1px solid #334155",
            borderRadius: 4,
            fontFamily: "Menlo, monospace",
            fontSize: 11,
            resize: "vertical",
          }}
        />

        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button onClick={handleCopy} style={btnActive}>
            {copied ? <CheckCircle2 size={14} /> : <Download size={14} />}
            {copied ? "Copied!" : "Copy to clipboard"}
          </button>
          <button onClick={onClose} style={btn}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const formatDate = (ms: number): string => {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const Toolbar: React.FC = () => {
  const {
    showGrid,
    gridSize,
    snapToGrid,
    showBackground,
    showSprites,
    toggleGrid,
    setGridSize,
    toggleSnap,
    toggleBackground,
    toggleSprites,
    undo,
    redo,
    past,
    future,
    resetBlank,
    loadSnapshot,
    entities,
    meta,
    savedMaps,
    saveCurrent,
    deleteSaved,
    startPreview,
  } = useEditorStore();

  const [exportPayload, setExportPayload] = useState<ExportPayload | null>(null);
  const [loadOpen, setLoadOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportTs = () => {
    setExportPayload(serializeMap(entities, meta));
  };

  const builtins = buildBuiltinList();

  const handleLoadBuiltin = (mapId: string) => {
    const found = builtins.find((m) => m.id === mapId);
    if (!found) return;
    const { entities: ents, meta: m } = mapToEditor(found.map);
    loadSnapshot({ entities: ents, meta: m });
    setLoadOpen(false);
  };

  const handleLoadSaved = (key: string) => {
    const found = savedMaps.find((m) => m.key === key);
    if (!found) return;
    loadSnapshot(found.snapshot);
    setLoadOpen(false);
  };

  const handleSave = () => {
    const name = window.prompt("Save map as:", meta.name || "untitled");
    if (name === null) return;
    saveCurrent(name);
  };

  const handleExportJson = () => {
    const blob = new Blob(
      [JSON.stringify({ entities, meta }, null, 2)],
      { type: "application/json" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${meta.id || "map"}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (parsed && Array.isArray(parsed.entities) && parsed.meta) {
        loadSnapshot({ entities: parsed.entities, meta: parsed.meta });
      } else {
        alert("Invalid map JSON: expected { entities: [...], meta: {...} }");
      }
    } catch (err) {
      alert(`Failed to import: ${(err as Error).message}`);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: 10,
          background: "#0b0f1a",
          borderBottom: "1px solid #334155",
          flexWrap: "wrap",
          fontFamily: "system-ui, sans-serif",
          color: "#e5e7eb",
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 14, marginRight: 12 }}>
          🛠️ Map Editor
        </div>

        <button onClick={resetBlank} style={btn} title="New blank map">
          <FilePlus2 size={14} /> New
        </button>

        <div style={{ position: "relative" }}>
          <button
            onClick={() => setLoadOpen((v) => !v)}
            style={loadOpen ? btnActive : btn}
            title="Load existing map"
          >
            <FolderOpen size={14} /> Load
          </button>
          {loadOpen && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                marginTop: 4,
                background: "#0f172a",
                border: "1px solid #334155",
                borderRadius: 4,
                padding: 4,
                zIndex: 100,
                minWidth: 280,
                maxHeight: 460,
                overflowY: "auto",
              }}
            >
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: "#94a3b8",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  padding: "6px 10px 4px",
                }}
              >
                Built-in
              </div>
              {builtins.map((m) => (
                <button
                  key={m.id}
                  onClick={() => handleLoadBuiltin(m.id)}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: "6px 10px",
                    background: "transparent",
                    border: "none",
                    color: "#e5e7eb",
                    fontSize: 12,
                    cursor: "pointer",
                    borderRadius: 3,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#1f2937")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  {m.label}
                </button>
              ))}

              <div
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: "#94a3b8",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  padding: "10px 10px 4px",
                  borderTop: "1px solid #334155",
                  marginTop: 4,
                }}
              >
                Saved drafts ({savedMaps.length})
              </div>
              {savedMaps.length === 0 && (
                <div style={{ fontSize: 11, color: "#64748b", padding: "4px 10px 8px" }}>
                  None yet — use Save to store one.
                </div>
              )}
              {savedMaps.map((sm) => (
                <div
                  key={sm.key}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "0 4px",
                  }}
                >
                  <button
                    onClick={() => handleLoadSaved(sm.key)}
                    style={{
                      flex: 1,
                      textAlign: "left",
                      padding: "6px 6px",
                      background: "transparent",
                      border: "none",
                      color: "#e5e7eb",
                      fontSize: 12,
                      cursor: "pointer",
                      borderRadius: 3,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#1f2937")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <span style={{ fontWeight: 600 }}>{sm.name}</span>
                    <span style={{ fontSize: 10, color: "#64748b" }}>
                      {formatDate(sm.savedAt)}
                    </span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete saved map "${sm.name}"?`)) {
                        deleteSaved(sm.key);
                      }
                    }}
                    title="Delete"
                    style={{
                      padding: 4,
                      background: "transparent",
                      border: "none",
                      color: "#94a3b8",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button onClick={handleSave} style={btn} title="Save current map">
          <Save size={14} /> Save
        </button>

        <button
          onClick={startPreview}
          style={{
            ...btnActive,
            background: "#16a34a",
            border: "1px solid #22c55e",
          }}
          title="Play-test this map with full physics"
        >
          <Play size={14} /> Preview
        </button>

        <button onClick={handleExportTs} style={btnActive} title="Export to TypeScript code">
          <Download size={14} /> Export TS
        </button>

        <button onClick={handleExportJson} style={btn} title="Download as JSON file">
          <FileDown size={14} /> JSON
        </button>

        <button onClick={handleImportClick} style={btn} title="Import JSON file">
          <Upload size={14} /> Import
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          onChange={handleImportFile}
          style={{ display: "none" }}
        />

        <div style={{ width: 1, height: 24, background: "#334155", margin: "0 4px" }} />

        <button onClick={undo} disabled={past.length === 0} style={btn} title="Undo (Cmd+Z)">
          <Undo2 size={14} /> Undo
        </button>
        <button onClick={redo} disabled={future.length === 0} style={btn} title="Redo (Cmd+Shift+Z)">
          <Redo2 size={14} /> Redo
        </button>

        <div style={{ width: 1, height: 24, background: "#334155", margin: "0 4px" }} />

        <button onClick={toggleGrid} style={showGrid ? btnActive : btn} title="Toggle grid">
          <Grid3x3 size={14} /> Grid
        </button>
        <select
          value={gridSize}
          onChange={(e) => setGridSize(Number(e.target.value))}
          style={{ ...btn, padding: "6px 8px" }}
        >
          <option value={5}>5px</option>
          <option value={10}>10px</option>
          <option value={25}>25px</option>
          <option value={50}>50px</option>
        </select>
        <button onClick={toggleSnap} style={snapToGrid ? btnActive : btn} title="Snap to grid">
          <Magnet size={14} /> Snap
        </button>
        <button
          onClick={toggleBackground}
          style={showBackground ? btnActive : btn}
          title="Toggle background image"
        >
          <ImageIcon size={14} /> BG
        </button>
        <button
          onClick={toggleSprites}
          style={showSprites ? btnActive : btn}
          title="Toggle sprite preview (shows actual game sprites)"
        >
          <Sparkles size={14} /> Sprites
        </button>

        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 11, color: "#64748b" }}>
          {entities.length} entities · {meta.name}
        </div>
      </div>

      {exportPayload && (
        <ExportModal payload={exportPayload} onClose={() => setExportPayload(null)} />
      )}
    </>
  );
};
