"use client";

import { AreaChart, Area, Tooltip, ResponsiveContainer } from "recharts";

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export function MiniTrendChart({ data }: { data: { month: string; income: number; expenses: number }[] }) {
  const last6 = data.slice(-6);

  return (
    <ResponsiveContainer width="100%" height={90}>
      <AreaChart data={last6} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
        <defs>
          <linearGradient id="trendInc" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--success)" stopOpacity={0.25} />
            <stop offset="95%" stopColor="var(--success)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="trendExp" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--destructive)" stopOpacity={0.25} />
            <stop offset="95%" stopColor="var(--destructive)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <Tooltip
          contentStyle={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            fontSize: "12px",
          }}
          formatter={(value: number, name: string) => [
            formatBRL(value),
            name === "income" ? "Receitas" : "Despesas",
          ]}
          labelFormatter={(label) => {
            const s = String(label);
            return s.charAt(0).toUpperCase() + s.slice(1);
          }}
        />
        <Area
          type="monotone"
          dataKey="income"
          stroke="var(--success)"
          strokeWidth={2}
          fill="url(#trendInc)"
          dot={false}
          activeDot={{ r: 3, fill: "var(--success)" }}
        />
        <Area
          type="monotone"
          dataKey="expenses"
          stroke="var(--destructive)"
          strokeWidth={2}
          fill="url(#trendExp)"
          dot={false}
          activeDot={{ r: 3, fill: "var(--destructive)" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
