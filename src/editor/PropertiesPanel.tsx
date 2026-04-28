import React from "react";
import { useEditorStore, commitHistory } from "./store";
import { EditorEntity, MonsterEntity } from "./types";
import { MonsterType, CoinType } from "../types/enums";
import { Trash2, Copy } from "lucide-react";

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 10,
  textTransform: "uppercase",
  letterSpacing: 1,
  color: "#94a3b8",
  marginBottom: 3,
  fontWeight: 700,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "6px 8px",
  background: "#1f2937",
  border: "1px solid #374151",
  color: "#fff",
  borderRadius: 3,
  fontSize: 12,
  fontFamily: "inherit",
  boxSizing: "border-box",
};

const fieldStyle: React.CSSProperties = { marginBottom: 10 };
const rowStyle: React.CSSProperties = { display: "flex", gap: 8 };

interface NumProps {
  label: string;
  value: number;
  onChange: (n: number) => void;
  step?: number;
  min?: number;
  max?: number;
}
const NumField: React.FC<NumProps> = ({ label, value, onChange, step = 1, min, max }) => (
  <div style={fieldStyle}>
    <label style={labelStyle}>{label}</label>
    <input
      type="number"
      style={inputStyle}
      value={value}
      step={step}
      min={min}
      max={max}
      onChange={(e) => onChange(Number(e.target.value))}
      onBlur={commitHistory}
    />
  </div>
);

interface TxtProps {
  label: string;
  value: string;
  onChange: (s: string) => void;
}
const TxtField: React.FC<TxtProps> = ({ label, value, onChange }) => (
  <div style={fieldStyle}>
    <label style={labelStyle}>{label}</label>
    <input
      type="text"
      style={inputStyle}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={commitHistory}
    />
  </div>
);

interface ColorProps {
  label: string;
  value: string;
  onChange: (s: string) => void;
}
const ColorField: React.FC<ColorProps> = ({ label, value, onChange }) => (
  <div style={fieldStyle}>
    <label style={labelStyle}>{label}</label>
    <div style={rowStyle}>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={commitHistory}
        style={{ width: 36, height: 30, padding: 0, border: "1px solid #374151", background: "transparent" }}
      />
      <input
        type="text"
        style={{ ...inputStyle, flex: 1 }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={commitHistory}
      />
    </div>
  </div>
);

interface SelProps<T extends string> {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}
function SelectField<T extends string>({ label, value, options, onChange }: SelProps<T>) {
  return (
    <div style={fieldStyle}>
      <label style={labelStyle}>{label}</label>
      <select
        style={inputStyle}
        value={value}
        onChange={(e) => {
          onChange(e.target.value as T);
          commitHistory();
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

const CheckField: React.FC<{ label: string; value: boolean; onChange: (b: boolean) => void }> = ({
  label,
  value,
  onChange,
}) => (
  <label style={{ ...fieldStyle, display: "flex", gap: 6, alignItems: "center", cursor: "pointer" }}>
    <input
      type="checkbox"
      checked={value}
      onChange={(e) => {
        onChange(e.target.checked);
        commitHistory();
      }}
    />
    <span style={{ fontSize: 12 }}>{label}</span>
  </label>
);

const MonsterEditor: React.FC<{
  entity: MonsterEntity;
  update: (patch: Partial<EditorEntity>) => void;
}> = ({ entity, update }) => {
  return (
    <>
      <NumField
        label="Speed"
        value={entity.speed}
        step={0.1}
        onChange={(v) => update({ speed: v } as Partial<EditorEntity>)}
      />
      <CheckField
        label="Delayed spawn"
        value={entity.delayed}
        onChange={(b) => update({ delayed: b } as Partial<EditorEntity>)}
      />
      {entity.delayed && (
        <NumField
          label="Spawn delay (ms)"
          value={entity.spawnDelay}
          step={500}
          min={0}
          onChange={(v) => update({ spawnDelay: v } as Partial<EditorEntity>)}
        />
      )}

      {entity.monsterType === MonsterType.HORIZONTAL_PATROL && (
        <>
          <NumField
            label="Platform X"
            value={entity.platformX ?? entity.x}
            onChange={(v) => update({ platformX: v } as Partial<EditorEntity>)}
          />
          <NumField
            label="Platform Y"
            value={entity.platformY ?? entity.y}
            onChange={(v) => update({ platformY: v } as Partial<EditorEntity>)}
          />
          <NumField
            label="Platform Width"
            value={entity.platformWidth ?? 150}
            onChange={(v) => update({ platformWidth: v } as Partial<EditorEntity>)}
          />
          <SelectField
            label="Spawn Side"
            value={entity.spawnSide ?? "left"}
            options={[
              { value: "left", label: "Left" },
              { value: "right", label: "Right" },
            ]}
            onChange={(v) => update({ spawnSide: v } as Partial<EditorEntity>)}
          />
          <SelectField
            label="Variant"
            value={entity.variant ?? "green"}
            options={[
              { value: "green", label: "Green" },
              { value: "black", label: "Black" },
            ]}
            onChange={(v) => update({ variant: v } as Partial<EditorEntity>)}
          />
        </>
      )}

      {entity.monsterType === MonsterType.VERTICAL_PATROL && (
        <>
          <NumField
            label="Platform X"
            value={entity.platformX ?? entity.x}
            onChange={(v) => update({ platformX: v } as Partial<EditorEntity>)}
          />
          <NumField
            label="Patrol Height"
            value={entity.patrolHeight ?? 200}
            onChange={(v) => update({ patrolHeight: v } as Partial<EditorEntity>)}
          />
          <SelectField
            label="Side"
            value={entity.side ?? "left"}
            options={[
              { value: "left", label: "Left" },
              { value: "right", label: "Right" },
            ]}
            onChange={(v) => update({ side: v } as Partial<EditorEntity>)}
          />
          <NumField
            label="Direction (1=down,-1=up)"
            value={entity.direction ?? 1}
            onChange={(v) => update({ direction: v } as Partial<EditorEntity>)}
          />
        </>
      )}

      {entity.monsterType === MonsterType.FLOATER && (
        <NumField
          label="Start Angle (deg)"
          value={entity.startAngle ?? 45}
          onChange={(v) => update({ startAngle: v } as Partial<EditorEntity>)}
        />
      )}

      {entity.monsterType === MonsterType.CHASER && (
        <>
          <NumField
            label="Directness (0-1)"
            value={entity.directness ?? 0.2}
            step={0.05}
            min={0}
            max={1}
            onChange={(v) => update({ directness: v } as Partial<EditorEntity>)}
          />
          <NumField
            label="Update Interval (ms)"
            value={entity.updateInterval ?? 500}
            step={50}
            onChange={(v) => update({ updateInterval: v } as Partial<EditorEntity>)}
          />
        </>
      )}

      {entity.monsterType === MonsterType.AMBUSHER && (
        <NumField
          label="Ambush Interval (ms)"
          value={entity.ambushInterval ?? 8000}
          step={500}
          onChange={(v) => update({ ambushInterval: v } as Partial<EditorEntity>)}
        />
      )}
    </>
  );
};

export const PropertiesPanel: React.FC = () => {
  const {
    entities,
    selectedIds,
    updateEntity,
    deleteSelected,
    duplicateSelected,
    meta,
    setMeta,
  } = useEditorStore();

  const selected =
    selectedIds.size === 1
      ? entities.find((e) => selectedIds.has(e.id)) ?? null
      : null;

  const update = (patch: Partial<EditorEntity>) => {
    if (!selected) return;
    updateEntity(selected.id, patch);
  };

  return (
    <div
      style={{
        width: 280,
        height: "100%",
        overflowY: "auto",
        background: "#0f172a",
        borderLeft: "1px solid #334155",
        padding: 12,
        color: "#e5e7eb",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {selectedIds.size > 1 && (
        <>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 1,
              color: "#94a3b8",
              marginBottom: 8,
            }}
          >
            {selectedIds.size} entities selected
          </div>
          <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
            <button
              onClick={duplicateSelected}
              title="Duplicate (Cmd+D)"
              style={{
                flex: 1,
                padding: "6px 8px",
                background: "#1f2937",
                border: "1px solid #374151",
                color: "#cbd5e1",
                borderRadius: 3,
                cursor: "pointer",
                fontSize: 11,
                display: "flex",
                alignItems: "center",
                gap: 4,
                justifyContent: "center",
              }}
            >
              <Copy size={12} /> Duplicate
            </button>
            <button
              onClick={deleteSelected}
              title="Delete (Del)"
              style={{
                flex: 1,
                padding: "6px 8px",
                background: "#7f1d1d",
                border: "1px solid #b91c1c",
                color: "#fff",
                borderRadius: 3,
                cursor: "pointer",
                fontSize: 11,
                display: "flex",
                alignItems: "center",
                gap: 4,
                justifyContent: "center",
              }}
            >
              <Trash2 size={12} /> Delete
            </button>
          </div>
          <div style={{ fontSize: 11, color: "#64748b" }}>
            Drag any selected entity to move them all together. Click an empty
            spot to deselect, or click a single entity for property editing.
          </div>
        </>
      )}

      {selectedIds.size === 0 && (
        <>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 1,
              color: "#94a3b8",
              marginBottom: 8,
            }}
          >
            Map Settings
          </div>
          <TxtField
            label="ID (variable name prefix)"
            value={meta.id}
            onChange={(v) => setMeta({ id: v })}
          />
          <TxtField
            label="Name"
            value={meta.name}
            onChange={(v) => setMeta({ name: v })}
          />
          <TxtField
            label="Background"
            value={meta.background}
            onChange={(v) => setMeta({ background: v })}
          />
          <ColorField
            label="Spawn Indicator Color"
            value={meta.spawnIndicatorColor}
            onChange={(v) => setMeta({ spawnIndicatorColor: v })}
          />
          <TxtField
            label="Group Sequence (comma-sep)"
            value={meta.groupSequence.join(", ")}
            onChange={(v) =>
              setMeta({
                groupSequence: v
                  .split(",")
                  .map((s) => Number(s.trim()))
                  .filter((n) => !isNaN(n)),
              })
            }
          />
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 16 }}>
            Click any entity on the canvas to edit its properties.
          </div>
        </>
      )}

      {selected && (
        <>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: 1,
                color: "#94a3b8",
              }}
            >
              {selected.kind}
              {selected.kind === "monster" ? ` · ${selected.monsterType}` : ""}
              {selected.kind === "coinSpawn" ? ` · ${selected.coinType}` : ""}
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              <button
                onClick={duplicateSelected}
                title="Duplicate (Cmd+D)"
                style={{
                  padding: 4,
                  background: "#1f2937",
                  border: "1px solid #374151",
                  color: "#cbd5e1",
                  borderRadius: 3,
                  cursor: "pointer",
                }}
              >
                <Copy size={12} />
              </button>
              <button
                onClick={deleteSelected}
                title="Delete (Del)"
                style={{
                  padding: 4,
                  background: "#7f1d1d",
                  border: "1px solid #b91c1c",
                  color: "#fff",
                  borderRadius: 3,
                  cursor: "pointer",
                }}
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>

          <NumField
            label="X"
            value={selected.x}
            onChange={(v) => update({ x: v })}
          />
          <NumField
            label="Y"
            value={selected.y}
            onChange={(v) => update({ y: v })}
          />

          {(selected.kind === "platform" || selected.kind === "ground") && (
            <>
              <NumField
                label="Width"
                value={selected.width}
                onChange={(v) => update({ width: v } as Partial<EditorEntity>)}
              />
              <NumField
                label="Height"
                value={selected.height}
                onChange={(v) => update({ height: v } as Partial<EditorEntity>)}
              />
              <ColorField
                label="Color"
                value={selected.color}
                onChange={(v) => update({ color: v } as Partial<EditorEntity>)}
              />
              {selected.kind === "platform" && (
                <>
                  <ColorField
                    label="Border Color"
                    value={selected.borderColor ?? "#000000"}
                    onChange={(v) => update({ borderColor: v } as Partial<EditorEntity>)}
                  />
                  <CheckField
                    label="Vertical wall"
                    value={selected.isVertical ?? false}
                    onChange={(b) => update({ isVertical: b } as Partial<EditorEntity>)}
                  />
                </>
              )}
            </>
          )}

          {selected.kind === "bomb" && (
            <>
              <NumField
                label="Order (1-23)"
                value={selected.order}
                min={1}
                max={23}
                onChange={(v) => update({ order: v } as Partial<EditorEntity>)}
              />
              <NumField
                label="Group"
                value={selected.group}
                min={1}
                onChange={(v) => update({ group: v } as Partial<EditorEntity>)}
              />
            </>
          )}

          {selected.kind === "monster" && (
            <MonsterEditor entity={selected} update={update} />
          )}

          {selected.kind === "coinSpawn" && (
            <>
              <SelectField
                label="Coin Type"
                value={selected.coinType}
                options={[
                  { value: CoinType.POWER, label: "Power (freezes monsters)" },
                  { value: CoinType.BONUS_MULTIPLIER, label: "Bonus Mult." },
                  { value: CoinType.EXTRA_LIFE, label: "Extra Life" },
                ]}
                onChange={(v) => update({ coinType: v } as Partial<EditorEntity>)}
              />
              {selected.coinType === CoinType.POWER && (
                <NumField
                  label="Spawn Angle (deg)"
                  value={selected.spawnAngle ?? 65}
                  onChange={(v) => update({ spawnAngle: v } as Partial<EditorEntity>)}
                />
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};
