import React, { useRef, useState, useCallback, useEffect } from "react";
import { useEditorStore, commitHistory } from "./store";
import { GAME_CONFIG } from "../types/constants";
import { MonsterType, CoinType } from "../types/enums";
import { EditorEntity, MonsterEntity, PlatformEntity } from "./types";
import {
  DEFAULT_PLATFORM_THEME,
  getPlatformTileUrls,
  layoutPlatformTiles,
  type PlatformTheme,
} from "../config/platformTiles";
import { getSpriteImagePath } from "../config/assets";
import {
  defaultPlatform,
  defaultVerticalWall,
  defaultBomb,
  defaultPlayerStart,
  defaultMonster,
  defaultCoinSpawn,
} from "./defaults";

const CANVAS_W = GAME_CONFIG.CANVAS_WIDTH;
const CANVAS_H = GAME_CONFIG.CANVAS_HEIGHT;

const MONSTER_COLORS: Record<MonsterType, string> = {
  [MonsterType.MUMMY]: "#22c55e",
  [MonsterType.VERTICAL_PATROL]: "#3b82f6",
  [MonsterType.BIRD]: "#ef4444",
  [MonsterType.UFO]: "#a855f7",
  [MonsterType.HORN]: "#f59e0b",
  [MonsterType.SPHERE]: "#fbbf24",
  [MonsterType.ORB]: "#a78bfa",
};

const COIN_COLORS: Record<CoinType, string> = {
  [CoinType.POWER]: "#fbbf24",
  [CoinType.BONUS_MULTIPLIER]: "#34d399",
  [CoinType.EXTRA_LIFE]: "#f472b6",
  [CoinType.MONSTER_FREEZE]: "#67e8f9",
  [CoinType.SPECIAL]: "#f97316",
};

const snap = (value: number, gridSize: number, enabled: boolean) =>
  enabled ? Math.round(value / gridSize) * gridSize : Math.round(value);

const getEntityRect = (e: EditorEntity) => {
  switch (e.kind) {
    case "platform":
      return { x: e.x, y: e.y, width: e.width, height: e.height };
    case "bomb":
      return { x: e.x, y: e.y, width: GAME_CONFIG.BOMB_SIZE, height: GAME_CONFIG.BOMB_SIZE };
    case "monster":
      return { x: e.x, y: e.y, width: GAME_CONFIG.MONSTER_SIZE, height: GAME_CONFIG.MONSTER_SIZE };
    case "coinSpawn":
      return { x: e.x, y: e.y, width: GAME_CONFIG.COIN_SIZE, height: GAME_CONFIG.COIN_SIZE };
    case "playerStart":
      return { x: e.x, y: e.y, width: GAME_CONFIG.PLAYER_WIDTH, height: GAME_CONFIG.PLAYER_HEIGHT };
  }
};

const rectsIntersect = (
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number }
): boolean =>
  a.x < b.x + b.width &&
  a.x + a.width > b.x &&
  a.y < b.y + b.height &&
  a.y + a.height > b.y;

interface ArrowProps {
  /** Origin in entity-local pixels (relative to entity's top-left). */
  fromX: number;
  fromY: number;
  /** Direction angle in degrees (0 = right, 90 = down). */
  angleDeg: number;
  length: number;
  color: string;
}

const ArrowOverlay: React.FC<ArrowProps> = ({ fromX, fromY, angleDeg, length, color }) => {
  // Render as an absolutely-positioned div with a rotation transform
  const rad = (angleDeg * Math.PI) / 180;
  const dx = Math.cos(rad) * length;
  const dy = Math.sin(rad) * length;
  return (
    <svg
      style={{
        position: "absolute",
        left: -CANVAS_W,
        top: -CANVAS_H,
        width: CANVAS_W * 2,
        height: CANVAS_H * 2,
        pointerEvents: "none",
        overflow: "visible",
      }}
    >
      <defs>
        <marker
          id={`arrow-${color.replace("#", "")}`}
          markerWidth="6"
          markerHeight="6"
          refX="5"
          refY="3"
          orient="auto"
        >
          <path d="M0,0 L0,6 L6,3 z" fill={color} />
        </marker>
      </defs>
      <line
        x1={CANVAS_W + fromX}
        y1={CANVAS_H + fromY}
        x2={CANVAS_W + fromX + dx}
        y2={CANVAS_H + fromY + dy}
        stroke={color}
        strokeWidth={2}
        markerEnd={`url(#arrow-${color.replace("#", "")})`}
      />
    </svg>
  );
};

const monsterArrowAngle = (m: MonsterEntity): number | null => {
  switch (m.monsterType) {
    case MonsterType.HORN:
      return m.startAngle ?? 45;
    case MonsterType.MUMMY:
      return (m.spawnSide ?? "left") === "left" ? 0 : 180;
    case MonsterType.VERTICAL_PATROL:
      return (m.direction ?? 1) >= 0 ? 90 : -90;
    default:
      return null;
  }
};

interface PatrolOverlayProps {
  monster: MonsterEntity;
  onStartHandle: (e: React.MouseEvent) => void;
  onEndHandle: (e: React.MouseEvent) => void;
}

const PatrolOverlay: React.FC<PatrolOverlayProps> = ({
  monster,
  onStartHandle,
  onEndHandle,
}) => {
  const isHoriz = monster.monsterType === MonsterType.MUMMY;
  const color = isHoriz ? "#22c55e" : "#3b82f6";

  let x1: number, y1: number, x2: number, y2: number;
  if (isHoriz) {
    const startX = monster.platformX ?? monster.x;
    const width = monster.platformWidth ?? 150;
    const trackY = (monster.platformY ?? monster.y + GAME_CONFIG.MONSTER_SIZE) - 1;
    x1 = startX;
    y1 = trackY;
    x2 = startX + width;
    y2 = trackY;
  } else {
    const startY = monster.y;
    const height = monster.patrolHeight ?? 200;
    const trackX = monster.x + GAME_CONFIG.MONSTER_SIZE / 2;
    x1 = trackX;
    y1 = startY;
    x2 = trackX;
    y2 = startY + height;
  }

  return (
    <svg
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        overflow: "visible",
      }}
    >
      {/* Patrol band — a thicker translucent stripe so it's readable */}
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={color}
        strokeWidth={isHoriz ? 4 : 4}
        strokeOpacity={0.35}
        strokeLinecap="round"
        strokeDasharray="6 4"
      />
      {/* Endpoint ticks for clarity */}
      <line
        x1={isHoriz ? x1 : x1 - 8}
        y1={isHoriz ? y1 - 8 : y1}
        x2={isHoriz ? x1 : x1 + 8}
        y2={isHoriz ? y1 + 8 : y1}
        stroke={color}
        strokeWidth={2}
      />
      <line
        x1={isHoriz ? x2 : x2 - 8}
        y1={isHoriz ? y2 - 8 : y2}
        x2={isHoriz ? x2 : x2 + 8}
        y2={isHoriz ? y2 + 8 : y2}
        stroke={color}
        strokeWidth={2}
      />
      {/* Drag handles — hit boxes have pointer events */}
      <circle
        cx={x1}
        cy={y1}
        r={7}
        fill="#0c4a6e"
        stroke={color}
        strokeWidth={2}
        style={{ pointerEvents: "auto", cursor: isHoriz ? "ew-resize" : "ns-resize" }}
        onMouseDown={onStartHandle}
      />
      <circle
        cx={x2}
        cy={y2}
        r={7}
        fill="#0c4a6e"
        stroke={color}
        strokeWidth={2}
        style={{ pointerEvents: "auto", cursor: isHoriz ? "ew-resize" : "ns-resize" }}
        onMouseDown={onEndHandle}
      />
    </svg>
  );
};

const PIXEL_IMG: React.CSSProperties = {
  imageRendering: "pixelated",
  display: "block",
  pointerEvents: "none",
};

const PlatformSprite: React.FC<{ entity: PlatformEntity }> = ({ entity }) => {
  const theme = entity.tileTheme || DEFAULT_PLATFORM_THEME;
  const urls = getPlatformTileUrls(theme);
  const slots = layoutPlatformTiles(
    entity.width,
    entity.height,
    entity.isVertical ?? false
  );
  return (
    <>
      {slots.map((slot) => {
        const src = urls[slot.piece];
        if (entity.isVertical) {
          // 90° CW rotation around the cell center.
          return (
            <img
              key={slot.index}
              src={src}
              draggable={false}
              alt=""
              style={{
                ...PIXEL_IMG,
                position: "absolute",
                left: slot.localX + slot.width / 2 - slot.height / 2,
                top: slot.localY + slot.height / 2 - slot.width / 2,
                width: slot.height,
                height: slot.width,
                transform: "rotate(90deg)",
              }}
            />
          );
        }
        return (
          <img
            key={slot.index}
            src={src}
            draggable={false}
            alt=""
            style={{
              ...PIXEL_IMG,
              position: "absolute",
              left: slot.localX,
              top: slot.localY,
              width: slot.width,
              height: slot.height,
            }}
          />
        );
      })}
    </>
  );
};

interface EntityVisualProps {
  entity: EditorEntity;
  selected: boolean;
  showSprites: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onResizeStart?: (e: React.MouseEvent, axis: "x" | "y") => void;
}

const EntityVisual: React.FC<EntityVisualProps> = ({
  entity,
  selected,
  showSprites,
  onMouseDown,
  onResizeStart,
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

  const renderResizeHandle = () => {
    if (!selected || entity.kind !== "platform") return null;
    const isVert = entity.isVertical ?? false;
    return (
      <div
        onMouseDown={(e) => {
          e.stopPropagation();
          onResizeStart?.(e, isVert ? "y" : "x");
        }}
        style={{
          position: "absolute",
          ...(isVert
            ? {
                left: "50%",
                bottom: -6,
                transform: "translateX(-50%)",
                width: 12,
                height: 12,
                cursor: "ns-resize",
              }
            : {
                right: -6,
                top: "50%",
                transform: "translateY(-50%)",
                width: 12,
                height: 12,
                cursor: "ew-resize",
              }),
          background: "#00f0ff",
          border: "2px solid #0c4a6e",
          borderRadius: 2,
          zIndex: 10,
        }}
      />
    );
  };

  if (entity.kind === "platform") {
    if (showSprites) {
      return (
        <div
          onMouseDown={onMouseDown}
          style={{
            ...baseStyle,
            background: "transparent",
            border: "none",
            overflow: "hidden",
          }}
        >
          <PlatformSprite entity={entity} />
          {renderResizeHandle()}
        </div>
      );
    }
    return (
      <div
        onMouseDown={onMouseDown}
        style={{
          ...baseStyle,
          background: entity.color,
          border: `1px solid ${entity.borderColor ?? "#000"}`,
        }}
      >
        {renderResizeHandle()}
      </div>
    );
  }

  if (entity.kind === "bomb") {
    if (showSprites) {
      const fundingSrc = getSpriteImagePath("funding/funding_0.png");
      return (
        <div onMouseDown={onMouseDown} style={baseStyle}>
          <img
            src={fundingSrc}
            draggable={false}
            alt=""
            style={{
              ...PIXEL_IMG,
              width: "190%",
              height: "190%",
              position: "absolute",
              left: "-45%",
              top: "-45%",
            }}
            title={`Bomb #${entity.order} (group ${entity.group})`}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 10,
              fontWeight: 700,
              textShadow: "1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000",
              pointerEvents: "none",
            }}
          >
            {entity.order}
          </div>
        </div>
      );
    }
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
    const angle = monsterArrowAngle(entity);
    return (
      <>
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
        {angle !== null && (
          <ArrowOverlay
            fromX={entity.x + GAME_CONFIG.MONSTER_SIZE / 2}
            fromY={entity.y + GAME_CONFIG.MONSTER_SIZE / 2}
            angleDeg={angle}
            length={28}
            color={MONSTER_COLORS[entity.monsterType]}
          />
        )}
      </>
    );
  }

  if (entity.kind === "coinSpawn") {
    return (
      <>
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
        {entity.coinType === CoinType.POWER && entity.spawnAngle !== undefined && (
          <ArrowOverlay
            fromX={entity.x + GAME_CONFIG.COIN_SIZE / 2}
            fromY={entity.y + GAME_CONFIG.COIN_SIZE / 2}
            angleDeg={entity.spawnAngle}
            length={32}
            color={COIN_COLORS[entity.coinType]}
          />
        )}
      </>
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

interface DragMoveState {
  startX: number;
  startY: number;
  /** Per-entity origin snapshot: position + (for patrol monsters) patrol origin. */
  origPositions: Map<
    string,
    { x: number; y: number; platformX?: number; platformY?: number }
  >;
  moved: boolean;
}

interface ResizeState {
  id: string;
  axis: "x" | "y";
  startClient: number;
  origLength: number;
  moved: boolean;
}

interface PatrolResizeState {
  id: string;
  edge: "start" | "end";
  axis: "x" | "y"; // x = horizontal patrol, y = vertical patrol
  startClient: number;
  /** Original anchor that won't move (the opposite edge). */
  fixedAnchor: number;
  /** Original moving edge position. */
  origMovingEdge: number;
  /** Original monster x/y (only relevant when dragging start handle). */
  origMonsterPos: number;
  moved: boolean;
}

interface MarqueeState {
  startX: number;
  startY: number;
  curX: number;
  curY: number;
  additive: boolean;
  preExisting: Set<string>;
}

export const EditorCanvas: React.FC = () => {
  const {
    entities,
    selectedIds,
    tool,
    showGrid,
    gridSize,
    snapToGrid,
    showBackground,
    showSprites,
    meta,
    setSelected,
    toggleSelected,
    addEntity,
    updateEntity,
    moveSelected,
    setTool,
  } = useEditorStore();

  const stageRef = useRef<HTMLDivElement>(null);
  const [dragMove, setDragMove] = useState<DragMoveState | null>(null);
  const [resize, setResize] = useState<ResizeState | null>(null);
  const [patrolResize, setPatrolResize] = useState<PatrolResizeState | null>(null);
  const [marquee, setMarquee] = useState<MarqueeState | null>(null);
  const marqueeRef = useRef<MarqueeState | null>(null);
  marqueeRef.current = marquee;

  const stageCoords = useCallback((clientX: number, clientY: number) => {
    const r = stageRef.current?.getBoundingClientRect();
    if (!r) return { x: 0, y: 0 };
    return {
      x: ((clientX - r.left) / r.width) * CANVAS_W,
      y: ((clientY - r.top) / r.height) * CANVAS_H,
    };
  }, []);

  const placeEntity = (clientX: number, clientY: number) => {
    if (tool.kind !== "place") return;
    const { x, y } = stageCoords(clientX, clientY);
    const sx = snap(x, gridSize, snapToGrid);
    const sy = snap(y, gridSize, snapToGrid);
    let entity: EditorEntity | null = null;
    if (tool.entity === "platform") {
      entity = tool.subType === "vertical" ? defaultVerticalWall(sx, sy) : defaultPlatform(sx, sy);
    } else if (tool.entity === "bomb") {
      const existing = entities.filter((en) => en.kind === "bomb").length;
      const next = defaultBomb(sx, sy);
      next.order = existing + 1;
      next.group = Math.min(meta.groupSequence.length, Math.ceil((existing + 1) / 3));
      entity = next;
    } else if (tool.entity === "playerStart") {
      const existing = entities.find((en) => en.kind === "playerStart");
      if (existing) {
        updateEntity(existing.id, { x: sx, y: sy });
        setSelected([existing.id]);
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

  const handleStageMouseDown = (e: React.MouseEvent) => {
    if (e.target !== stageRef.current && e.target !== e.currentTarget) return;
    if (tool.kind === "place") {
      placeEntity(e.clientX, e.clientY);
      return;
    }
    // Select tool: start marquee
    const { x, y } = stageCoords(e.clientX, e.clientY);
    const additive = e.shiftKey || e.metaKey || e.ctrlKey;
    if (!additive) setSelected(null);
    setMarquee({
      startX: x,
      startY: y,
      curX: x,
      curY: y,
      additive,
      preExisting: new Set(selectedIds),
    });
  };

  const handleEntityMouseDown =
    (entityId: string) => (e: React.MouseEvent) => {
      e.stopPropagation();
      if (tool.kind !== "select") setTool({ kind: "select" });

      const additive = e.shiftKey || e.metaKey || e.ctrlKey;
      let nextSelection: Set<string>;
      if (additive) {
        const next = new Set(selectedIds);
        if (next.has(entityId)) next.delete(entityId);
        else next.add(entityId);
        toggleSelected(entityId);
        nextSelection = next;
      } else if (!selectedIds.has(entityId)) {
        setSelected([entityId]);
        nextSelection = new Set([entityId]);
      } else {
        nextSelection = new Set(selectedIds);
      }

      // Begin drag-move for all currently-selected entities
      if (nextSelection.size === 0) return;
      const positions = new Map<
        string,
        { x: number; y: number; platformX?: number; platformY?: number }
      >();
      for (const ent of entities) {
        if (!nextSelection.has(ent.id)) continue;
        if (ent.kind === "monster") {
          positions.set(ent.id, {
            x: ent.x,
            y: ent.y,
            platformX: ent.platformX,
            platformY: ent.platformY,
          });
        } else {
          positions.set(ent.id, { x: ent.x, y: ent.y });
        }
      }
      setDragMove({
        startX: e.clientX,
        startY: e.clientY,
        origPositions: positions,
        moved: false,
      });
    };

  const handleResizeStart =
    (entityId: string) => (e: React.MouseEvent, axis: "x" | "y") => {
      const ent = entities.find((en) => en.id === entityId);
      if (!ent || ent.kind !== "platform") return;
      setResize({
        id: entityId,
        axis,
        startClient: axis === "x" ? e.clientX : e.clientY,
        origLength: axis === "x" ? ent.width : ent.height,
        moved: false,
      });
    };

  const beginPatrolResize = (
    monster: MonsterEntity,
    edge: "start" | "end",
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    e.preventDefault();
    const isHoriz = monster.monsterType === MonsterType.MUMMY;
    if (isHoriz) {
      const startX = monster.platformX ?? monster.x;
      const width = monster.platformWidth ?? 150;
      const endX = startX + width;
      const fixed = edge === "start" ? endX : startX;
      const moving = edge === "start" ? startX : endX;
      setPatrolResize({
        id: monster.id,
        edge,
        axis: "x",
        startClient: e.clientX,
        fixedAnchor: fixed,
        origMovingEdge: moving,
        origMonsterPos: monster.x,
        moved: false,
      });
    } else {
      const startY = monster.y;
      const height = monster.patrolHeight ?? 200;
      const endY = startY + height;
      const fixed = edge === "start" ? endY : startY;
      const moving = edge === "start" ? startY : endY;
      setPatrolResize({
        id: monster.id,
        edge,
        axis: "y",
        startClient: e.clientY,
        fixedAnchor: fixed,
        origMovingEdge: moving,
        origMonsterPos: monster.y,
        moved: false,
      });
    }
  };

  // Drag-move effect
  useEffect(() => {
    if (!dragMove) return;
    const onMove = (e: MouseEvent) => {
      const r = stageRef.current?.getBoundingClientRect();
      if (!r) return;
      const dx = ((e.clientX - dragMove.startX) / r.width) * CANVAS_W;
      const dy = ((e.clientY - dragMove.startY) / r.height) * CANVAS_H;
      let moved = dragMove.moved;
      if (!moved && (Math.abs(dx) > 1 || Math.abs(dy) > 1)) moved = true;
      // Apply per-entity using its original snapped position so drag stays consistent
      for (const [id, orig] of dragMove.origPositions) {
        const nx = snap(orig.x + dx, gridSize, snapToGrid);
        const ny = snap(orig.y + dy, gridSize, snapToGrid);
        const realDx = nx - orig.x;
        const realDy = ny - orig.y;
        const patch: Partial<EditorEntity> = { x: nx, y: ny };
        if (orig.platformX !== undefined) {
          (patch as Partial<MonsterEntity>).platformX = orig.platformX + realDx;
        }
        if (orig.platformY !== undefined) {
          (patch as Partial<MonsterEntity>).platformY = orig.platformY + realDy;
        }
        updateEntity(id, patch);
      }
      if (moved !== dragMove.moved) setDragMove({ ...dragMove, moved });
    };
    const onUp = () => {
      if (dragMove.moved) commitHistory();
      setDragMove(null);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [dragMove, gridSize, snapToGrid, updateEntity]);

  // Resize effect
  useEffect(() => {
    if (!resize) return;
    const onMove = (e: MouseEvent) => {
      const r = stageRef.current?.getBoundingClientRect();
      if (!r) return;
      const client = resize.axis === "x" ? e.clientX : e.clientY;
      const scale = resize.axis === "x" ? r.width / CANVAS_W : r.height / CANVAS_H;
      const delta = (client - resize.startClient) / scale;
      const raw = Math.max(15, resize.origLength + delta);
      const snapped = snapToGrid ? Math.max(gridSize, Math.round(raw / gridSize) * gridSize) : Math.round(raw);
      if (resize.axis === "x") updateEntity(resize.id, { width: snapped } as Partial<EditorEntity>);
      else updateEntity(resize.id, { height: snapped } as Partial<EditorEntity>);
      if (!resize.moved) setResize({ ...resize, moved: true });
    };
    const onUp = () => {
      if (resize.moved) commitHistory();
      setResize(null);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [resize, gridSize, snapToGrid, updateEntity]);

  // Patrol resize effect
  useEffect(() => {
    if (!patrolResize) return;
    const onMove = (e: MouseEvent) => {
      const r = stageRef.current?.getBoundingClientRect();
      if (!r) return;
      const client = patrolResize.axis === "x" ? e.clientX : e.clientY;
      const scale = patrolResize.axis === "x" ? r.width / CANVAS_W : r.height / CANVAS_H;
      const delta = (client - patrolResize.startClient) / scale;
      const newMoving = snap(
        patrolResize.origMovingEdge + delta,
        gridSize,
        snapToGrid
      );

      const ent = useEditorStore
        .getState()
        .entities.find((en) => en.id === patrolResize.id);
      if (!ent || ent.kind !== "monster") return;

      if (patrolResize.axis === "x") {
        // H. Patrol — fixedAnchor and newMoving define platform range.
        const startX = Math.min(patrolResize.fixedAnchor, newMoving);
        const endX = Math.max(patrolResize.fixedAnchor, newMoving);
        const width = Math.max(GAME_CONFIG.MONSTER_SIZE, endX - startX);
        const patch: Partial<MonsterEntity> = {
          platformX: startX,
          platformWidth: width,
        };
        if (patrolResize.edge === "start") {
          // Monster sits at the start; its x follows the start anchor.
          patch.x = startX;
        }
        updateEntity(patrolResize.id, patch as Partial<EditorEntity>);
      } else {
        // V. Patrol
        const startY = Math.min(patrolResize.fixedAnchor, newMoving);
        const endY = Math.max(patrolResize.fixedAnchor, newMoving);
        const height = Math.max(GAME_CONFIG.MONSTER_SIZE, endY - startY);
        const patch: Partial<MonsterEntity> = { patrolHeight: height };
        if (patrolResize.edge === "start") {
          patch.y = startY;
        }
        updateEntity(patrolResize.id, patch as Partial<EditorEntity>);
      }

      if (!patrolResize.moved) setPatrolResize({ ...patrolResize, moved: true });
    };
    const onUp = () => {
      if (patrolResize.moved) commitHistory();
      setPatrolResize(null);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [patrolResize, gridSize, snapToGrid, updateEntity]);

  // Marquee effect
  useEffect(() => {
    if (!marquee) return;
    const onMove = (e: MouseEvent) => {
      const { x, y } = stageCoords(e.clientX, e.clientY);
      setMarquee((m) => (m ? { ...m, curX: x, curY: y } : m));
    };
    const onUp = () => {
      const m = marqueeRef.current;
      setMarquee(null);
      if (!m) return;
      const x1 = Math.min(m.startX, m.curX);
      const y1 = Math.min(m.startY, m.curY);
      const x2 = Math.max(m.startX, m.curX);
      const y2 = Math.max(m.startY, m.curY);
      const box = { x: x1, y: y1, width: x2 - x1, height: y2 - y1 };
      if (box.width < 2 && box.height < 2) return;
      const hits = entities
        .filter((ent) => rectsIntersect(getEntityRect(ent), box))
        .map((e) => e.id);
      const nextIds = m.additive
        ? Array.from(new Set([...m.preExisting, ...hits]))
        : hits;
      setSelected(nextIds);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [marquee, entities, stageCoords, setSelected]);

  const cursor =
    tool.kind === "place" ? "crosshair" : dragMove ? "grabbing" : "default";

  const bgImage = showBackground ? `url(/maps-bg-images/${meta.background}.png)` : "none";

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
        overflow: "hidden",
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
          selected={selectedIds.has(entity.id)}
          showSprites={showSprites}
          onMouseDown={handleEntityMouseDown(entity.id)}
          onResizeStart={handleResizeStart(entity.id)}
        />
      ))}

      {entities
        .filter(
          (e): e is MonsterEntity =>
            e.kind === "monster" &&
            selectedIds.has(e.id) &&
            (e.monsterType === MonsterType.MUMMY ||
              e.monsterType === MonsterType.VERTICAL_PATROL)
        )
        .map((m) => (
          <PatrolOverlay
            key={`patrol-${m.id}`}
            monster={m}
            onStartHandle={(e) => beginPatrolResize(m, "start", e)}
            onEndHandle={(e) => beginPatrolResize(m, "end", e)}
          />
        ))}

      {marquee && (
        <div
          style={{
            position: "absolute",
            left: Math.min(marquee.startX, marquee.curX),
            top: Math.min(marquee.startY, marquee.curY),
            width: Math.abs(marquee.curX - marquee.startX),
            height: Math.abs(marquee.curY - marquee.startY),
            border: "1px dashed #00f0ff",
            background: "rgba(0, 240, 255, 0.08)",
            pointerEvents: "none",
          }}
        />
      )}

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


      {selectedIds.size > 1 && (
        <div
          style={{
            position: "absolute",
            top: 8,
            left: 8,
            background: "rgba(0,0,0,0.7)",
            color: "#0ff",
            padding: "4px 8px",
            fontSize: 11,
            fontFamily: "monospace",
            pointerEvents: "none",
          }}
        >
          {selectedIds.size} selected
        </div>
      )}
    </div>
  );
};
