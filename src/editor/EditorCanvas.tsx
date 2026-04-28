import React, { useRef, useState, useCallback, useEffect } from "react";
import { useEditorStore, commitHistory } from "./store";
import { GAME_CONFIG } from "../types/constants";
import { MonsterType, CoinType } from "../types/enums";
import { EditorEntity } from "./types";
import {
  defaultPlatform,
  defaultVerticalWall,
  defaultBomb,
  defaultPlayerStart,
  defaultMonster,
  defaultCoinSpawn,
  defaultGround,
} from "./defaults";

const CANVAS_W = GAME_CONFIG.CANVAS_WIDTH;
const CANVAS_H = GAME_CONFIG.CANVAS_HEIGHT;

const MONSTER_COLORS: Record<MonsterType, string> = {
  [MonsterType.HORIZONTAL_PATROL]: "#22c55e",
  [MonsterType.VERTICAL_PATROL]: "#3b82f6",
  [MonsterType.CHASER]: "#ef4444",
  [MonsterType.AMBUSHER]: "#a855f7",
  [MonsterType.FLOATER]: "#f59e0b",
};

const COIN_COLORS: Record<CoinType, string> = {
  [CoinType.POWER]: "#fbbf24",
  [CoinType.BONUS_MULTIPLIER]: "#34d399",
  [CoinType.EXTRA_LIFE]: "#f472b6",
  [CoinType.MONSTER_FREEZE]: "#67e8f9",
};

const snap = (value: number, gridSize: number, enabled: boolean) =>
  enabled ? Math.round(value / gridSize) * gridSize : Math.round(value);

const getEntityRect = (e: EditorEntity) => {
  switch (e.kind) {
    case "platform":
    case "ground":
      return { x: e.x, y: e.y, width: e.width, height: e.height };
    case "bomb":
      return {
        x: e.x,
        y: e.y,
        width: GAME_CONFIG.BOMB_SIZE,
        height: GAME_CONFIG.BOMB_SIZE,
      };
    case "monster":
      return {
        x: e.x,
        y: e.y,
        width: GAME_CONFIG.MONSTER_SIZE,
        height: GAME_CONFIG.MONSTER_SIZE,
      };
    case "coinSpawn":
      return {
        x: e.x,
        y: e.y,
        width: GAME_CONFIG.COIN_SIZE,
        height: GAME_CONFIG.COIN_SIZE,
      };
    case "playerStart":
      return {
        x: e.x,
        y: e.y,
        width: GAME_CONFIG.PLAYER_WIDTH,
        height: GAME_CONFIG.PLAYER_HEIGHT,
      };
  }
};

interface EntityVisualProps {
  entity: EditorEntity;
  selected: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
}

const EntityVisual: React.FC<EntityVisualProps> = ({
  entity,
  selected,
  onMouseDown,
}) => {
  const rect = getEntityRect(entity);
  const baseStyle: React.CSSProperties = {
    position: "absolute",
    left: rect.x,
    top: rect.y,
    width: rect.width,
    height: rect.height,
    cursor: "move",
    boxSizing: "border-box",
    outline: selected ? "2px solid #00f0ff" : "none",
    outlineOffset: 1,
  };

  if (entity.kind === "platform" || entity.kind === "ground") {
    return (
      <div
        onMouseDown={onMouseDown}
        style={{
          ...baseStyle,
          background: entity.color,
          border: `1px solid ${
            entity.kind === "platform" ? entity.borderColor ?? "#000" : "#000"
          }`,
        }}
      />
    );
  }

  if (entity.kind === "bomb") {
    return (
      <div onMouseDown={onMouseDown} style={baseStyle}>
        <div
          style={{
            width: "100%",
            height: "100%",
            background: "#1a1a1a",
            borderRadius: "50%",
            border: "1px solid #f87171",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontSize: 9,
            fontWeight: 700,
          }}
          title={`Bomb #${entity.order} (group ${entity.group})`}
        >
          {entity.order}
        </div>
      </div>
    );
  }

  if (entity.kind === "monster") {
    return (
      <div
        onMouseDown={onMouseDown}
        style={{
          ...baseStyle,
          background: MONSTER_COLORS[entity.monsterType],
          border: "1px solid #000",
          opacity: entity.delayed ? 0.6 : 1,
        }}
        title={`${entity.monsterType}${entity.delayed ? ` (${entity.spawnDelay}ms)` : ""}`}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#000",
            fontSize: 8,
            fontWeight: 700,
          }}
        >
          {entity.monsterType.charAt(0)}
        </div>
      </div>
    );
  }

  if (entity.kind === "coinSpawn") {
    return (
      <div onMouseDown={onMouseDown} style={baseStyle}>
        <div
          style={{
            width: "100%",
            height: "100%",
            background: COIN_COLORS[entity.coinType],
            borderRadius: "50%",
            border: "2px dashed #000",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#000",
            fontSize: 9,
            fontWeight: 700,
          }}
          title={`Coin spawn: ${entity.coinType}`}
        >
          {entity.coinType.charAt(0)}
        </div>
      </div>
    );
  }

  if (entity.kind === "playerStart") {
    return (
      <div
        onMouseDown={onMouseDown}
        style={{
          ...baseStyle,
          background: "rgba(34, 197, 94, 0.4)",
          border: "2px dashed #22c55e",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          fontSize: 10,
          fontWeight: 700,
          textShadow: "1px 1px 0 #000",
        }}
        title="Player spawn"
      >
        SIG
      </div>
    );
  }

  return null;
};

interface DragState {
  id: string;
  startX: number;
  startY: number;
  origX: number;
  origY: number;
  moved: boolean;
}

export const EditorCanvas: React.FC = () => {
  const {
    entities,
    selectedId,
    tool,
    showGrid,
    gridSize,
    snapToGrid,
    showBackground,
    meta,
    setSelected,
    addEntity,
    updateEntity,
    setTool,
  } = useEditorStore();

  const stageRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<DragState | null>(null);

  const stageCoords = useCallback(
    (clientX: number, clientY: number) => {
      const r = stageRef.current?.getBoundingClientRect();
      if (!r) return { x: 0, y: 0 };
      return {
        x: ((clientX - r.left) / r.width) * CANVAS_W,
        y: ((clientY - r.top) / r.height) * CANVAS_H,
      };
    },
    []
  );

  const handleStageMouseDown = (e: React.MouseEvent) => {
    if (e.target !== stageRef.current && e.target !== e.currentTarget) {
      // click on entity handled by entity onMouseDown
      return;
    }
    if (tool.kind === "select") {
      setSelected(null);
      return;
    }
    const { x, y } = stageCoords(e.clientX, e.clientY);
    const sx = snap(x, gridSize, snapToGrid);
    const sy = snap(y, gridSize, snapToGrid);
    let entity: EditorEntity | null = null;
    if (tool.entity === "platform") {
      entity =
        tool.subType === "vertical"
          ? defaultVerticalWall(sx, sy)
          : defaultPlatform(sx, sy);
    } else if (tool.entity === "ground") {
      entity = { ...defaultGround(), x: sx, y: sy };
    } else if (tool.entity === "bomb") {
      const existingBombs = entities.filter((en) => en.kind === "bomb").length;
      const next = defaultBomb(sx, sy);
      next.order = existingBombs + 1;
      next.group = Math.min(
        meta.groupSequence.length,
        Math.ceil((existingBombs + 1) / 3)
      );
      entity = next;
    } else if (tool.entity === "playerStart") {
      const existing = entities.find((en) => en.kind === "playerStart");
      if (existing) {
        updateEntity(existing.id, { x: sx, y: sy });
        setSelected(existing.id);
        setTool({ kind: "select" });
        return;
      }
      entity = defaultPlayerStart(sx, sy);
    } else if (tool.entity === "monster" && tool.subType) {
      entity = defaultMonster(tool.subType as MonsterType, sx, sy);
    } else if (tool.entity === "coinSpawn" && tool.subType) {
      entity = defaultCoinSpawn(tool.subType as CoinType, sx, sy);
    }
    if (entity) {
      addEntity(entity);
      setTool({ kind: "select" });
    }
  };

  const handleEntityMouseDown = (entityId: string) => (e: React.MouseEvent) => {
    e.stopPropagation();
    if (tool.kind !== "select") {
      setTool({ kind: "select" });
    }
    setSelected(entityId);
    const ent = entities.find((en) => en.id === entityId);
    if (!ent) return;
    setDrag({
      id: entityId,
      startX: e.clientX,
      startY: e.clientY,
      origX: ent.x,
      origY: ent.y,
      moved: false,
    });
  };

  useEffect(() => {
    if (!drag) return;
    const onMove = (e: MouseEvent) => {
      const r = stageRef.current?.getBoundingClientRect();
      if (!r) return;
      const dx = ((e.clientX - drag.startX) / r.width) * CANVAS_W;
      const dy = ((e.clientY - drag.startY) / r.height) * CANVAS_H;
      const nx = snap(drag.origX + dx, gridSize, snapToGrid);
      const ny = snap(drag.origY + dy, gridSize, snapToGrid);
      updateEntity(drag.id, { x: nx, y: ny });
      if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
        if (!drag.moved) {
          setDrag({ ...drag, moved: true });
        }
      }
    };
    const onUp = () => {
      if (drag.moved) commitHistory();
      setDrag(null);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [drag, gridSize, snapToGrid, updateEntity]);

  const cursor =
    tool.kind === "place" ? "crosshair" : drag ? "grabbing" : "default";

  const bgImage = showBackground
    ? `url(/maps-bg-images/${meta.background}.png)`
    : "none";

  return (
    <div
      ref={stageRef}
      onMouseDown={handleStageMouseDown}
      style={{
        position: "relative",
        width: CANVAS_W,
        height: CANVAS_H,
        background: "#1a1a2e",
        backgroundImage: bgImage,
        backgroundSize: "cover",
        backgroundPosition: "center",
        cursor,
        userSelect: "none",
        boxShadow: "0 0 0 2px #444",
      }}
    >
      {showGrid && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            backgroundImage: `
              linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)
            `,
            backgroundSize: `${gridSize}px ${gridSize}px`,
          }}
        />
      )}

      {entities.map((entity) => (
        <EntityVisual
          key={entity.id}
          entity={entity}
          selected={entity.id === selectedId}
          onMouseDown={handleEntityMouseDown(entity.id)}
        />
      ))}

      {/* Coordinate readout for placement */}
      {tool.kind === "place" && (
        <div
          style={{
            position: "absolute",
            bottom: 8,
            left: 8,
            background: "rgba(0,0,0,0.7)",
            color: "#0ff",
            padding: "4px 8px",
            fontSize: 11,
            fontFamily: "monospace",
            pointerEvents: "none",
          }}
        >
          Placing: {tool.entity}
          {tool.subType ? ` / ${tool.subType}` : ""}
        </div>
      )}
    </div>
  );
};
