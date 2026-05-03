import React, { useMemo, useState } from "react";
import { X, RotateCcw, Sliders, AlertCircle } from "lucide-react";
import {
  TUNING_FIELDS,
  TUNING_SECTIONS,
  type TuningField,
  type TuningSection,
} from "../config/tuningDefaults";
import { useTuningStore } from "../stores/systems/tuningStore";

const styles = {
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    fontFamily: "system-ui, sans-serif",
    color: "#e5e7eb",
  } as React.CSSProperties,
  modal: {
    width: "min(900px, 95vw)",
    height: "min(85vh, 720px)",
    background: "#0f172a",
    border: "1px solid #334155",
    borderRadius: 8,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  } as React.CSSProperties,
  header: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 16px",
    background: "#0b0f1a",
    borderBottom: "1px solid #334155",
  } as React.CSSProperties,
  body: {
    display: "flex",
    flex: 1,
    minHeight: 0,
  } as React.CSSProperties,
  sidebar: {
    width: 160,
    background: "#0b0f1a",
    borderRight: "1px solid #1e293b",
    overflowY: "auto",
  } as React.CSSProperties,
  tabBtn: (active: boolean): React.CSSProperties => ({
    display: "block",
    width: "100%",
    padding: "10px 14px",
    textAlign: "left",
    background: active ? "#1e293b" : "transparent",
    color: active ? "#fff" : "#cbd5e1",
    border: "none",
    borderLeft: active ? "3px solid #3b82f6" : "3px solid transparent",
    cursor: "pointer",
    fontSize: 13,
    fontFamily: "inherit",
  }),
  content: {
    flex: 1,
    padding: 16,
    overflowY: "auto",
  } as React.CSSProperties,
  fieldRow: {
    display: "grid",
    gridTemplateColumns: "1fr 200px 70px 28px",
    alignItems: "center",
    gap: 10,
    padding: "8px 0",
    borderBottom: "1px solid #1e293b",
  } as React.CSSProperties,
  fieldLabel: {
    fontSize: 12,
    color: "#cbd5e1",
  } as React.CSSProperties,
  fieldDesc: {
    fontSize: 10,
    color: "#64748b",
    marginTop: 2,
  } as React.CSSProperties,
  numberInput: {
    width: "100%",
    background: "#1f2937",
    border: "1px solid #374151",
    color: "#fff",
    borderRadius: 3,
    padding: "4px 6px",
    fontSize: 12,
    fontFamily: "inherit",
    boxSizing: "border-box",
  } as React.CSSProperties,
  iconBtn: {
    background: "transparent",
    border: "1px solid transparent",
    color: "#94a3b8",
    cursor: "pointer",
    padding: 4,
    borderRadius: 3,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  } as React.CSSProperties,
  iconBtnActive: {
    background: "transparent",
    border: "1px solid transparent",
    color: "#f59e0b",
    cursor: "pointer",
    padding: 4,
    borderRadius: 3,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  } as React.CSSProperties,
  primaryBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 12px",
    background: "#2563eb",
    border: "1px solid #3b82f6",
    borderRadius: 4,
    color: "#fff",
    fontSize: 12,
    cursor: "pointer",
    fontFamily: "inherit",
  } as React.CSSProperties,
  ghostBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 12px",
    background: "transparent",
    border: "1px solid #475569",
    borderRadius: 4,
    color: "#cbd5e1",
    fontSize: 12,
    cursor: "pointer",
    fontFamily: "inherit",
  } as React.CSSProperties,
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 3,
    fontSize: 9,
    color: "#f59e0b",
    background: "rgba(245, 158, 11, 0.1)",
    padding: "2px 6px",
    borderRadius: 3,
    marginLeft: 6,
  } as React.CSSProperties,
};

const FieldRow: React.FC<{ field: TuningField }> = ({ field }) => {
  const overrides = useTuningStore((s) => s.overrides);
  const setVal = useTuningStore((s) => s.set);
  const resetKey = useTuningStore((s) => s.resetKey);

  const isOverridden = field.key in overrides;
  const value = isOverridden ? overrides[field.key] : field.default;

  return (
    <div style={styles.fieldRow}>
      <div>
        <div style={styles.fieldLabel}>
          {field.label}
          {!field.liveReload && (
            <span style={styles.badge}>
              <AlertCircle size={9} /> restart
            </span>
          )}
        </div>
        {field.description && (
          <div style={styles.fieldDesc}>{field.description}</div>
        )}
      </div>
      <input
        type="range"
        min={field.min}
        max={field.max}
        step={field.step}
        value={value}
        onChange={(e) => setVal(field.key, Number(e.target.value))}
        style={{ width: "100%" }}
      />
      <input
        type="number"
        min={field.min}
        max={field.max}
        step={field.step}
        value={value}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (!Number.isNaN(n)) setVal(field.key, n);
        }}
        style={styles.numberInput}
      />
      <button
        onClick={() => resetKey(field.key)}
        style={isOverridden ? styles.iconBtnActive : styles.iconBtn}
        title={isOverridden ? "Reset to default" : "(at default)"}
        disabled={!isOverridden}
      >
        <RotateCcw size={14} />
      </button>
    </div>
  );
};

interface Props {
  open: boolean;
  onClose: () => void;
}

export const TuningPanel: React.FC<Props> = ({ open, onClose }) => {
  const [activeSection, setActiveSection] = useState<TuningSection>(
    TUNING_SECTIONS[0]
  );
  const resetSection = useTuningStore((s) => s.resetSection);
  const resetAll = useTuningStore((s) => s.resetAll);

  const fieldsBySection = useMemo(
    () => TUNING_FIELDS.filter((f) => f.section === activeSection),
    [activeSection]
  );

  if (!open) return null;

  return (
    <div style={styles.backdrop} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <Sliders size={18} />
          <div style={{ fontWeight: 700, fontSize: 14 }}>Tuning Panel</div>
          <div style={{ fontSize: 11, color: "#64748b", marginLeft: 8 }}>
            Global game-physics & rule overrides — persists in localStorage.
            Scoring values are fixed.
          </div>
          <div style={{ flex: 1 }} />
          <button
            style={styles.ghostBtn}
            onClick={() => {
              if (confirm("Reset every tuned value to defaults?")) resetAll();
            }}
          >
            <RotateCcw size={12} /> Reset all
          </button>
          <button style={styles.iconBtn} onClick={onClose} title="Close">
            <X size={18} />
          </button>
        </div>
        <div style={styles.body}>
          <div style={styles.sidebar}>
            {TUNING_SECTIONS.map((s) => (
              <button
                key={s}
                style={styles.tabBtn(s === activeSection)}
                onClick={() => setActiveSection(s)}
              >
                {s}
              </button>
            ))}
          </div>
          <div style={styles.content}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: 10,
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 700 }}>
                {activeSection}
              </div>
              <div style={{ flex: 1 }} />
              <button
                style={styles.ghostBtn}
                onClick={() => resetSection(activeSection)}
              >
                <RotateCcw size={12} /> Reset section
              </button>
            </div>
            {fieldsBySection.map((f) => (
              <FieldRow key={f.key} field={f} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
