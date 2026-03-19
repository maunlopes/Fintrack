"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

function DarkTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const value = payload[0]?.value;
  const isNeg = value < 0;
  return (
    <div
      style={{
        background: "#0D1B2A",
        borderRadius: 10,
        padding: "10px 14px",
        boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
        fontFamily: "var(--font-dm-sans), DM Sans, sans-serif",
        minWidth: 130,
      }}
    >
      <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, marginBottom: 6, fontWeight: 600, letterSpacing: "0.05em" }}>
        {label?.toUpperCase()}
      </p>
      <p style={{ color: isNeg ? "#FF5F5F" : "#00D68F", fontSize: 14, fontWeight: 700 }}>
        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value)}
      </p>
    </div>
  );
}

export function BalanceForecastChart({ data }: { data: any[] }) {
  if (!data?.length) return (
    <div style={{ height: 260, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-tertiary)", fontSize: 13 }}>
      Sem dados
    </div>
  );

  const hasNeg = data.some((d: any) => d.saldo < 0);

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="balanceGradPos" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00D68F" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#00D68F" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="balanceGradNeg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FF5F5F" stopOpacity={0.2} />
            <stop offset="100%" stopColor="#FF5F5F" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="month"
          tick={{ fill: "var(--text-tertiary)", fontSize: 11, fontFamily: "var(--font-dm-sans)" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "var(--text-tertiary)", fontSize: 11, fontFamily: "var(--font-dm-sans)" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
          width={36}
        />
        <Tooltip content={<DarkTooltip />} cursor={{ stroke: "rgba(0,0,0,0.08)", strokeWidth: 1 }} />
        {hasNeg && <ReferenceLine y={0} stroke="rgba(0,0,0,0.1)" strokeDasharray="4 4" />}
        <Area
          type="monotone"
          dataKey="saldo"
          name="Saldo"
          stroke={hasNeg ? "#FF5F5F" : "#00D68F"}
          strokeWidth={2.5}
          fill={hasNeg ? "url(#balanceGradNeg)" : "url(#balanceGradPos)"}
          dot={false}
          activeDot={{ r: 4, fill: hasNeg ? "#FF5F5F" : "#00D68F", stroke: "white", strokeWidth: 2 }}
          isAnimationActive={true}
          animationBegin={0}
          animationDuration={800}
          animationEasing="ease-out"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
