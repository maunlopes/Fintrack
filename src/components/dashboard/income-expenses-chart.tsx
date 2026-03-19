"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const C_INCOME   = "#00D68F";
const C_EXPENSES = "#FF5F5F";
const C_INVEST   = "#6366F1";

function DarkTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "#0D1B2A",
        borderRadius: 10,
        padding: "10px 14px",
        boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
        fontFamily: "var(--font-dm-sans), DM Sans, sans-serif",
        minWidth: 140,
      }}
    >
      <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, marginBottom: 8, fontWeight: 600, letterSpacing: "0.05em" }}>
        {label?.toUpperCase()}
      </p>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ display: "flex", justifyContent: "space-between", gap: 16, marginBottom: 4 }}>
          <span style={{ color: "rgba(255,255,255,0.65)", fontSize: 12 }}>{p.name}</span>
          <span style={{ color: p.fill, fontSize: 12, fontWeight: 700 }}>
            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function IncomeExpensesChart({ data }: { data: any[] }) {
  if (!data?.length) return (
    <div style={{ height: 280, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-tertiary)", fontSize: 13 }}>
      Sem dados
    </div>
  );

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} barGap={3} barCategoryGap="28%">
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
        <Tooltip content={<DarkTooltip />} cursor={{ fill: "rgba(0,0,0,0.04)", radius: 8 } as any} />
        <Bar dataKey="income" name="Receita" fill={C_INCOME} radius={[6, 6, 0, 0]} />
        <Bar dataKey="investments" name="Aportes" fill={C_INVEST} radius={[6, 6, 0, 0]} />
        <Bar dataKey="expenses" name="Despesas" fill={C_EXPENSES} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
