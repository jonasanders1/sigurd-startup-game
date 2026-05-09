import React, { useEffect, useRef, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import MainGame from "../components/MainGame";
import { TooltipProvider } from "../components/ui/tooltip";
import { useEditorStore } from "./store";
import { buildMapFromEditor } from "./buildMap";
import { mapDefinitions } from "../maps/mapDefinitions";
import { useStateStore } from "../stores/gameStore";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { MapDefinition } from "../types/interfaces";

const queryClient = new QueryClient();

const PREVIEW_LIVES = 99;

const overlayBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "8px 12px",
  background: "rgba(15, 23, 42, 0.92)",
  border: "1px solid #334155",
  borderRadius: 6,
  color: "#e5e7eb",
  fontSize: 12,
  cursor: "pointer",
  fontFamily: "system-ui, sans-serif",
  fontWeight: 600,
};

export const PreviewMode: React.FC = () => {
  const { entities, meta, stopPreview } = useEditorStore();
  const originalRef = useRef<MapDefinition | null>(null);
  const [statusMsg, setStatusMsg] = useState("Loading map…");

  // Mount: swap mapDefinitions[0] with the editor's preview map. GameCanvas's
  // GameManager.start() ran before this effect, so the spawn manager was
  // already configured against the ORIGINAL level0's monsterSpawnPoints — the
  // tryStart effect below calls gsm.restartGame() which routes through
  // levelManager.loadCurrentLevel and re-inits everything (foundings, monsters,
  // coins, spawn manager queue) from the swapped previewMap.
  useEffect(() => {
    const previewMap = buildMapFromEditor(entities, meta);
    previewMap.id = "level1";
    originalRef.current = mapDefinitions[0];
    mapDefinitions[0] = previewMap;
    return () => {
      if (originalRef.current) {
        mapDefinitions[0] = originalRef.current;
      }
    };
  }, [entities, meta]);

  // Wait for GameStateManager to be ready, then start the game directly
  // (skip menu, skip credit deduction — credit deduction already auto-skips
  // in standalone mode because window.sigurdGame is absent).
  useEffect(() => {
    let cancelled = false;
    let pollTimer: number | undefined;

    const tryStart = () => {
      if (cancelled) return;
      const state = useStateStore.getState();
      const gsm = state.gameStateManager as
        | { restartGame?: () => void }
        | undefined;
      if (!gsm || typeof gsm.restartGame !== "function") {
        pollTimer = window.setTimeout(tryStart, 50);
        return;
      }
      // restartGame is the only public API that does the full level reload
      // (resetGame → onRestartCallback = levelManager.loadCurrentLevel →
      // COUNTDOWN → PLAYING). The loadCurrentLevel step is what re-inits the
      // OptimizedSpawnManager queue from the swapped mapDefinitions[0] —
      // without that, ghost monsters from the original level keep spawning.
      try {
        gsm.restartGame();
        useStateStore.setState({ lives: PREVIEW_LIVES });
        setStatusMsg("");
      } catch (err) {
        setStatusMsg(`Failed to start: ${(err as Error).message}`);
      }
    };
    tryStart();

    return () => {
      cancelled = true;
      if (pollTimer !== undefined) window.clearTimeout(pollTimer);
    };
  }, []);

  const handleExit = () => {
    stopPreview();
  };

  const handleRestart = () => {
    const gsm = useStateStore.getState().gameStateManager as
      | { restartGame?: () => void; startNewGame?: () => void }
      | undefined;
    if (!gsm) return;
    if (typeof gsm.restartGame === "function") {
      gsm.restartGame();
      useStateStore.setState({ lives: PREVIEW_LIVES });
    } else if (typeof gsm.startNewGame === "function") {
      gsm.startNewGame();
      useStateStore.setState({ lives: PREVIEW_LIVES });
    }
  };

  // Esc to exit
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        stopPreview();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [stopPreview]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "#020617",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Game */}
          <div style={{ position: "relative" }}>
            <MainGame />
          </div>

          {/* Top-left controls overlay */}
          <div
            style={{
              position: "fixed",
              top: 12,
              left: 12,
              zIndex: 9999,
              display: "flex",
              gap: 8,
              alignItems: "center",
            }}
          >
            <button onClick={handleExit} style={overlayBtn} title="Esc to exit">
              <ArrowLeft size={14} /> Back to editor
            </button>
            <button onClick={handleRestart} style={overlayBtn} title="Restart preview">
              <RotateCcw size={14} /> Restart
            </button>
            <div
              style={{
                padding: "6px 10px",
                background: "rgba(22, 163, 74, 0.95)",
                color: "#fff",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 1,
                textTransform: "uppercase",
                borderRadius: 4,
                fontFamily: "system-ui, sans-serif",
                border: "1px solid #22c55e",
              }}
            >
              Preview · {meta.name}
            </div>
          </div>

          {/* Status */}
          {statusMsg && (
            <div
              style={{
                position: "fixed",
                top: 60,
                left: 12,
                zIndex: 9999,
                background: "rgba(15, 23, 42, 0.92)",
                color: "#94a3b8",
                fontSize: 11,
                padding: "6px 10px",
                borderRadius: 4,
                fontFamily: "system-ui, sans-serif",
              }}
            >
              {statusMsg}
            </div>
          )}
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
};
