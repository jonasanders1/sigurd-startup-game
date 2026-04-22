import React from "react";

const CORNER_POSITIONS = ["tl", "tr", "bl", "br"] as const;

function CornerBracket({ pos, accent }: { pos: string; accent: string }) {
  const style: React.CSSProperties = { position: "absolute", width: 12, height: 12, pointerEvents: "none" };
  if (pos === "tl") { style.top = -1; style.left = -1; }
  if (pos === "tr") { style.top = -1; style.right = -1; }
  if (pos === "bl") { style.bottom = -1; style.left = -1; }
  if (pos === "br") { style.bottom = -1; style.right = -1; }

  return (
    <svg width="12" height="12" viewBox="0 0 12 12" style={style} shapeRendering="crispEdges">
      <g fill={accent}>
        {pos === "tl" && <><rect x="0" y="0" width="12" height="3" /><rect x="0" y="0" width="3" height="12" /></>}
        {pos === "tr" && <><rect x="0" y="0" width="12" height="3" /><rect x="9" y="0" width="3" height="12" /></>}
        {pos === "bl" && <><rect x="0" y="9" width="12" height="3" /><rect x="0" y="0" width="3" height="12" /></>}
        {pos === "br" && <><rect x="0" y="9" width="12" height="3" /><rect x="9" y="0" width="3" height="12" /></>}
      </g>
    </svg>
  );
}

interface PixelBezelProps {
  children: React.ReactNode;
  className?: string;
  accent?: string;
  glow?: boolean;
}

export function PixelBezel({ children, className = "", accent = "var(--primary)", glow = false }: PixelBezelProps) {
  return (
    <div
      className={`relative bg-[var(--surface)] border border-[var(--surface-line)] ${className}`}
      style={{
        boxShadow: glow
          ? "var(--glow-red), var(--shadow-lg)"
          : "var(--shadow-lg)",
      }}
    >
      {children}
      {CORNER_POSITIONS.map((pos) => (
        <CornerBracket key={pos} pos={pos} accent={accent} />
      ))}
    </div>
  );
}
