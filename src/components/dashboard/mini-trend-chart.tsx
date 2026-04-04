"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/lib/format";

function shortValue(v: number) {
  if (v >= 1000) return `${(v / 1000).toFixed(0)}k`;
  return v.toString();
}

export function MiniTrendChart({ data, height = "100%" }: { data: { month: string; income: number; expenses: number }[]; height?: number | string }) {
  const last6 = data.slice(-6);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={last6} margin={{ top: 8, right: 8, bottom: 4, left: -12 }}>
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
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => {
            const s = String(v);
            return s.charAt(0).toUpperCase() + s.slice(1, 3);
          }}
        />
        <YAxis
          tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={shortValue}
          width={40}
        />
        <Tooltip
          contentStyle={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            fontSize: "12px",
          }}
          formatter={(value: number, name: string) => [
            formatCurrency(value),
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
