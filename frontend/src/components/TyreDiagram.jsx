/**
 * TyreDiagram — top-down SVG of a 6-wheel truck.
 * Each wheel is coloured by tyre status and clickable.
 *
 * Props:
 *   tyres    – array of adapted tyre objects for ONE piece of equipment
 *   onOpen   – function(tyre) called when a wheel is clicked
 */
import { useState } from "react";

/* Map tyre status -> colour */
const STATUS_COLOR = {
  "Good": "#22c55e",          // green
  "Monitor": "#f59e0b",       // amber
  "Replace Soon": "#ef4444",  // red
  "Replaced": "#6b7280"       // grey
};
const STATUS_LABEL_COLOR = {
  "Good": "#15803d",
  "Monitor": "#92400e",
  "Replace Soon": "#991b1b",
  "Replaced": "#374151"
};

/* Six canonical positions for a standard mining truck */
const POSITIONS = [
  "Front-Left",
  "Front-Right",
  "Rear-Left-Inner",
  "Rear-Right-Inner",
  "Rear-Left",
  "Rear-Right"
];

/* SVG layout coordinates for each wheel [cx, cy, width, height] */
const WHEEL_LAYOUT = {
  "Front-Left":        { x: 58,  y: 62,  w: 28, h: 44 },
  "Front-Right":       { x: 158, y: 62,  w: 28, h: 44 },
  "Rear-Left-Inner":   { x: 62,  y: 168, w: 22, h: 38 },
  "Rear-Right-Inner":  { x: 160, y: 168, w: 22, h: 38 },
  "Rear-Left":         { x: 44,  y: 168, w: 22, h: 38 },
  "Rear-Right":        { x: 178, y: 168, w: 22, h: 38 }
};

function Wheel({ pos, tyre, onClick }) {
  const [hovered, setHovered] = useState(false);
  const layout = WHEEL_LAYOUT[pos];
  if (!layout) return null;

  const status = tyre?.status || "Good";
  const fill = STATUS_COLOR[status] || STATUS_COLOR["Good"];
  const pct = tyre ? Math.round((tyre.hours / tyre.threshold) * 100) : 0;
  const label = tyre ? `${tyre.id}\n${status}\n${pct}% worn` : pos;

  return (
    <g
      style={{ cursor: tyre ? "pointer" : "default" }}
      onClick={() => tyre && onClick(tyre)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <title>{label}</title>
      {/* Wheel shadow */}
      <rect
        x={layout.x - layout.w / 2 + 2}
        y={layout.y - layout.h / 2 + 3}
        width={layout.w}
        height={layout.h}
        rx={6}
        fill="rgba(0,0,0,0.25)"
      />
      {/* Wheel body */}
      <rect
        x={layout.x - layout.w / 2}
        y={layout.y - layout.h / 2}
        width={layout.w}
        height={layout.h}
        rx={6}
        fill={fill}
        stroke={hovered ? "#fff" : "rgba(0,0,0,0.3)"}
        strokeWidth={hovered ? 2.5 : 1.5}
        style={{ transition: "all 0.15s" }}
      />
      {/* Rim highlight */}
      <rect
        x={layout.x - layout.w / 2 + 5}
        y={layout.y - layout.h / 2 + 7}
        width={layout.w - 10}
        height={layout.h - 14}
        rx={3}
        fill="rgba(255,255,255,0.18)"
      />
      {/* Tooltip on hover */}
      {hovered && tyre && (
        <foreignObject
          x={layout.x - 56}
          y={layout.y - layout.h / 2 - 66}
          width={112}
          height={62}
          style={{ pointerEvents: "none" }}
        >
          <div
            xmlns="http://www.w3.org/1999/xhtml"
            style={{
              background: "rgba(17,24,39,0.95)",
              color: "#f9fafb",
              fontSize: 10,
              borderRadius: 6,
              padding: "5px 8px",
              lineHeight: 1.5,
              border: `1px solid ${fill}`,
              whiteSpace: "nowrap"
            }}
          >
            <div style={{ fontWeight: 700, color: fill }}>{pos.replace(/-/g, " ")}</div>
            <div>{tyre.id} · {tyre.brand}</div>
            <div style={{ color: fill }}>{status} · {pct}% worn</div>
          </div>
        </foreignObject>
      )}
    </g>
  );
}

export default function TyreDiagram({ tyres = [], onOpen }) {
  /* Match tyres to canonical positions */
  const byPos = {};
  tyres.forEach((t) => { byPos[t.position] = t; });

  /* Legend counts */
  const counts = { "Good": 0, "Monitor": 0, "Replace Soon": 0, "Replaced": 0 };
  tyres.forEach((t) => { if (counts[t.status] !== undefined) counts[t.status]++; });

  return (
    <div className="tyre-diagram-wrap">
      <svg
        viewBox="0 0 246 260"
        xmlns="http://www.w3.org/2000/svg"
        className="tyre-diagram-svg"
        aria-label="Top-down truck tyre layout"
      >
        {/* Truck cab */}
        <rect x="72" y="18" width="100" height="62" rx="12" fill="var(--surface-raised, #1e2533)" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />
        {/* Cab windshield highlight */}
        <rect x="84" y="26" width="76" height="32" rx="7" fill="rgba(99,179,237,0.15)" stroke="rgba(99,179,237,0.3)" strokeWidth="1" />
        {/* Truck body */}
        <rect x="68" y="76" width="108" height="130" rx="8" fill="var(--surface-raised, #1e2533)" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" />
        {/* Centre line */}
        <line x1="122" y1="80" x2="122" y2="200" stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="4 4" />
        {/* Axle lines */}
        <line x1="40" y1="84" x2="204" y2="84" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        <line x1="30" y1="168" x2="214" y2="168" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />

        {/* Truck label */}
        <text x="122" y="140" textAnchor="middle" fill="rgba(255,255,255,0.25)" fontSize="9" fontFamily="sans-serif" letterSpacing="2">TRUCK</text>

        {/* Wheels */}
        {POSITIONS.map((pos) => (
          <Wheel key={pos} pos={pos} tyre={byPos[pos] || null} onClick={onOpen} />
        ))}
      </svg>

      {/* Legend */}
      <div className="tyre-diagram-legend">
        {Object.entries(counts).map(([status, count]) => (
          <div key={status} className="tyre-diagram-legend-item">
            <span className="tyre-diagram-dot" style={{ background: STATUS_COLOR[status] }} />
            <span style={{ color: "var(--text-muted, #9ca3af)", fontSize: 11 }}>
              {status} <strong style={{ color: STATUS_LABEL_COLOR[status] }}>{count}</strong>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
