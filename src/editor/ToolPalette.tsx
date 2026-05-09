import React from "react";
import { useEditorStore } from "./store";
import { MonsterType, CoinType } from "../types/enums";
import { Tool } from "./types";
import {
  MousePointer2,
  Square,
  RectangleVertical,
  Bomb as Founding,
  Coins,
  User,
  Bug,
} from "lucide-react";

interface ToolButtonProps {
  active: boolean;
  onClick: () => void;
  label: string;
  shortcut?: string;
  children: React.ReactNode;
  color?: string;
}

const ToolButton: React.FC<ToolButtonProps> = ({
  active,
  onClick,
  label,
  shortcut,
  children,
  color,
}) => (
  <button
    onClick={onClick}
    title={shortcut ? `${label} (${shortcut})` : label}
    style={{
      display: "flex",
      alignItems: "center",
      gap: 8,
      width: "100%",
      padding: "8px 10px",
      background: active ? "#2563eb" : "#1f2937",
      color: "#fff",
      border: `1px solid ${active ? "#3b82f6" : "#374151"}`,
      borderRadius: 4,
      cursor: "pointer",
      fontSize: 12,
      textAlign: "left",
    }}
  >
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 18,
        height: 18,
        color: color ?? "#cbd5e1",
        flexShrink: 0,
      }}
    >
      {children}
    </span>
    <span style={{ flex: 1 }}>{label}</span>
    {shortcut && (
      <span style={{ fontSize: 10, color: "#94a3b8", fontFamily: "monospace" }}>
        {shortcut}
      </span>
    )}
  </button>
);

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <div style={{ marginBottom: 16 }}>
    <div
      style={{
        fontSize: 10,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: 1,
        color: "#94a3b8",
        marginBottom: 6,
      }}
    >
      {title}
    </div>
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {children}
    </div>
  </div>
);

const isActiveTool = (current: Tool, target: Tool): boolean => {
  if (current.kind !== target.kind) return false;
  if (current.kind === "select" && target.kind === "select") return true;
  if (current.kind === "place" && target.kind === "place") {
    return (
      current.entity === target.entity && current.subType === target.subType
    );
  }
  return false;
};

export const ToolPalette: React.FC = () => {
  const { tool, setTool } = useEditorStore();

  const set = (next: Tool) => () => setTool(next);

  return (
    <div
      style={{
        width: 200,
        height: "100%",
        overflowY: "auto",
        background: "#0f172a",
        borderRight: "1px solid #334155",
        padding: 12,
        color: "#e5e7eb",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <Section title="Pointer">
        <ToolButton
          active={isActiveTool(tool, { kind: "select" })}
          onClick={set({ kind: "select" })}
          label="Select"
          shortcut="V"
        >
          <MousePointer2 size={16} />
        </ToolButton>
      </Section>

      <Section title="Terrain">
        <ToolButton
          active={isActiveTool(tool, { kind: "place", entity: "platform" })}
          onClick={set({ kind: "place", entity: "platform" })}
          label="Platform"
          shortcut="P"
          color="#ebb185"
        >
          <Square size={16} />
        </ToolButton>
        <ToolButton
          active={isActiveTool(tool, {
            kind: "place",
            entity: "platform",
            subType: "vertical",
          })}
          onClick={set({ kind: "place", entity: "platform", subType: "vertical" })}
          label="Vertical Wall"
          shortcut="W"
          color="#ebb185"
        >
          <RectangleVertical size={16} />
        </ToolButton>
      </Section>

      <Section title="Player">
        <ToolButton
          active={isActiveTool(tool, { kind: "place", entity: "playerStart" })}
          onClick={set({ kind: "place", entity: "playerStart" })}
          label="Spawn Point"
          shortcut="S"
          color="#22c55e"
        >
          <User size={16} />
        </ToolButton>
      </Section>

      <Section title="Foundings">
        <ToolButton
          active={isActiveTool(tool, { kind: "place", entity: "founding" })}
          onClick={set({ kind: "place", entity: "founding" })}
          label="Founding"
          shortcut="B"
          color="#f87171"
        >
          <Founding size={16} />
        </ToolButton>
      </Section>

      <Section title="Monsters">
        <ToolButton
          active={isActiveTool(tool, {
            kind: "place",
            entity: "monster",
            subType: MonsterType.BUREAUCRAT,
          })}
          onClick={set({
            kind: "place",
            entity: "monster",
            subType: MonsterType.BUREAUCRAT,
          })}
          label="Bureaucrat"
          color="#22c55e"
        >
          <Bug size={16} />
        </ToolButton>
        <ToolButton
          active={isActiveTool(tool, {
            kind: "place",
            entity: "monster",
            subType: MonsterType.WISP,
          })}
          onClick={set({
            kind: "place",
            entity: "monster",
            subType: MonsterType.WISP,
          })}
          label="Wisp"
          color="#ef4444"
        >
          <Bug size={16} />
        </ToolButton>
        <ToolButton
          active={isActiveTool(tool, {
            kind: "place",
            entity: "monster",
            subType: MonsterType.TAXGHOST,
          })}
          onClick={set({
            kind: "place",
            entity: "monster",
            subType: MonsterType.TAXGHOST,
          })}
          label="TAXGHOST"
          color="#a855f7"
        >
          <Bug size={16} />
        </ToolButton>
        <ToolButton
          active={isActiveTool(tool, {
            kind: "place",
            entity: "monster",
            subType: MonsterType.FOUNDER,
          })}
          onClick={set({
            kind: "place",
            entity: "monster",
            subType: MonsterType.FOUNDER,
          })}
          label="Founder"
          color="#f59e0b"
        >
          <Bug size={16} />
        </ToolButton>
        <ToolButton
          active={isActiveTool(tool, {
            kind: "place",
            entity: "monster",
            subType: MonsterType.CONSULTANT,
          })}
          onClick={set({
            kind: "place",
            entity: "monster",
            subType: MonsterType.CONSULTANT,
          })}
          label="Consultant"
          color="#fbbf24"
        >
          <Bug size={16} />
        </ToolButton>
        <ToolButton
          active={isActiveTool(tool, {
            kind: "place",
            entity: "monster",
            subType: MonsterType.ROBOT,
          })}
          onClick={set({
            kind: "place",
            entity: "monster",
            subType: MonsterType.ROBOT,
          })}
          label="Robot"
          color="#a78bfa"
        >
          <Bug size={16} />
        </ToolButton>
      </Section>

      <Section title="Coins">
        <ToolButton
          active={isActiveTool(tool, {
            kind: "place",
            entity: "coinSpawn",
            subType: CoinType.POWER,
          })}
          onClick={set({
            kind: "place",
            entity: "coinSpawn",
            subType: CoinType.POWER,
          })}
          label="Power"
          color="#fbbf24"
        >
          <Coins size={16} />
        </ToolButton>
        <ToolButton
          active={isActiveTool(tool, {
            kind: "place",
            entity: "coinSpawn",
            subType: CoinType.BONUS_MULTIPLIER,
          })}
          onClick={set({
            kind: "place",
            entity: "coinSpawn",
            subType: CoinType.BONUS_MULTIPLIER,
          })}
          label="Bonus Mult."
          color="#34d399"
        >
          <Coins size={16} />
        </ToolButton>
        <ToolButton
          active={isActiveTool(tool, {
            kind: "place",
            entity: "coinSpawn",
            subType: CoinType.EXTRA_LIFE,
          })}
          onClick={set({
            kind: "place",
            entity: "coinSpawn",
            subType: CoinType.EXTRA_LIFE,
          })}
          label="Extra Life"
          color="#f472b6"
        >
          <Coins size={16} />
        </ToolButton>
      </Section>
    </div>
  );
};
