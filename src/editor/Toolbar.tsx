import React, { useState } from "react";
import { useEditorStore } from "./store";
import { serializeMap } from "./serialize";
import { mapToEditor } from "./deserialize";
import {
  level1Map,
  level2Map,
  level3Map,
  level4Map,
  level5Map,
  level6Map,
  level7Map,
  level8Map,
} from "../maps/mapDefinitions";
import { MapDefinition } from "../types/interfaces";
import {
  FilePlus2,
  FolderOpen,
  Download,
  Grid3x3,
  Magnet,
  Image,
  Undo2,
  Redo2,
  AlertTriangle,
  CheckCircle2,
  X,
} from "lucide-react";

const MAPS: { id: string; map: MapDefinition; label: string }[] = [
  { id: "level1", map: level1Map, label: "1 — Soverommet" },
  { id: "level2", map: level2Map, label: "2 — Startup Lab" },
  { id: "level3", map: level3Map, label: "3 — Innovasjon Norge" },
  { id: "level4", map: level4Map, label: "4 — Skatteetaten" },
  { id: "level5", map: level5Map, label: "5 — NAV" },
  { id: "level6", map: level6Map, label: "6 — Kommunehuset" },
  { id: "level7", map: level7Map, label: "7 — Alltinn Norge" },
  { id: "level8", map: level8Map, label: "8 — Silicone Valley" },
];

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

export const Toolbar: React.FC = () => {
  const {
    showGrid,
    gridSize,
    snapToGrid,
    showBackground,
    toggleGrid,
    setGridSize,
    toggleSnap,
    toggleBackground,
    undo,
    redo,
    past,
    future,
    resetBlank,
    loadSnapshot,
    entities,
    meta,
  } = useEditorStore();

  const [exportPayload, setExportPayload] = useState<ExportPayload | null>(null);
  const [loadOpen, setLoadOpen] = useState(false);

  const handleExport = () => {
    setExportPayload(serializeMap(entities, meta));
  };

  const handleLoad = (mapId: string) => {
    const found = MAPS.find((m) => m.id === mapId);
    if (!found) return;
    const { entities: ents, meta: m } = mapToEditor(found.map);
    loadSnapshot({ entities: ents, meta: m });
    setLoadOpen(false);
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
                minWidth: 220,
              }}
            >
              {MAPS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => handleLoad(m.id)}
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
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "#1f2937")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  {m.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <button onClick={handleExport} style={btnActive} title="Export to TypeScript">
          <Download size={14} /> Export
        </button>

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
          <Image size={14} /> BG
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
