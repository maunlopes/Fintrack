"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const CHART_COLORS = ["#00D68F", "#6366F1", "#FF5F5F", "#FFB800", "#00A870", "#818CF8"];

function DarkTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div
      style={{
        background: "#0D1B2A",
        borderRadius: 10,
        padding: "10px 14px",
        boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
        fontFamily: "var(--font-dm-sans), DM Sans, sans-serif",
      }}
    >
      <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, marginBottom: 4 }}>{d.name}</div>
      <div style={{ color: d.payload.fill, fontSize: 13, fontWeight: 700 }}>
        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(d.value)}
      </div>
    </div>
  );
}

export function CategoryPieChart({ data }: { data: any[] }) {
  if (!data?.length) return (
    <div style={{ height: 280, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-tertiary)", fontSize: 13 }}>
      Sem dados
    </div>
  );

  const total = data.reduce((s: number, d: any) => s + d.value, 0);

  return (
    <div style={{ position: "relative", height: 280 }}>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <defs>
            {CHART_COLORS.map((color, i) => (
              <linearGradient key={i} id={`catGrad${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={1} />
                <stop offset="100%" stopColor={color} stopOpacity={0.8} />
              </linearGradient>
            ))}
          </defs>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={72}
            outerRadius={108}
            paddingAngle={3}
            dataKey="value"
            strokeWidth={2}
            stroke="var(--bg-surface)"
            isAnimationActive={true}
            animationBegin={0}
            animationDuration={800}
            animationEasing="ease-out"
          >
            {data.map((_entry: any, i: number) => (
              <Cell
                key={i}
                fill={`url(#catGrad${i % CHART_COLORS.length})`}
                style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))" }}
              />
            ))}
          </Pie>
          <Tooltip content={<DarkTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Center total */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          textAlign: "center",
          pointerEvents: "none",
        }}
      >
        <div className="eyebrow" style={{ marginBottom: 2 }}>Total</div>
        <div
          className="money"
          style={{ fontSize: 15, color: "var(--text-primary)", letterSpacing: "-0.02em" }}
        >
          {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(total)}
        </div>
      </div>

      {/* Legend below chart */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 12px", marginTop: 0, justifyContent: "center" }}>
        {data.slice(0, 5).map((d: any, i: number) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{
              width: 8, height: 8, borderRadius: "50%",
              background: CHART_COLORS[i % CHART_COLORS.length],
              flexShrink: 0,
            }} />
            <span style={{ fontSize: 11, color: "var(--text-secondary)", fontFamily: "var(--font-dm-sans)" }}>
              {d.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
