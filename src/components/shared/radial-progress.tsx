"use client";

interface RadialProgressProps {
  value: number;       // 0–100
  size?: number;       // px, default 80
  stroke?: number;     // stroke width, default 8
  color?: string;      // default brand-accent
  trackColor?: string;
  label?: string;
  children?: React.ReactNode;
}

export function RadialProgress({
  value,
  size = 80,
  stroke = 8,
  color = "var(--brand-accent)",
  trackColor = "var(--bg-raised)",
  label,
  children,
}: RadialProgressProps) {
  const clamped = Math.min(Math.max(value, 0), 100);
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (clamped / 100) * circ;

  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)", position: "absolute" }}>
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={trackColor}
          strokeWidth={stroke}
        />
        {/* Fill */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1.4s var(--ease-quart, cubic-bezier(0.25,1,0.5,1))" }}
        />
      </svg>
      <div style={{ position: "relative", textAlign: "center" }}>
        {children ?? (
          <span
            className="money"
            style={{ fontSize: size * 0.18, color: "var(--text-primary)" }}
          >
            {Math.round(clamped)}%
          </span>
        )}
        {label && (
          <div className="eyebrow" style={{ marginTop: 2 }}>{label}</div>
        )}
      </div>
    </div>
  );
}
