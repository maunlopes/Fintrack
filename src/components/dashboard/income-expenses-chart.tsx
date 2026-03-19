"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ChartTooltip } from "./chart-tooltip";

const C_INCOME      = "#10b981";
const C_EXPENSES    = "#ec4564";
const C_INVESTMENTS = "#3b82f6";

export function IncomeExpensesChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} barGap={4}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="month" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.5 }} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: "var(--muted-foreground)", paddingTop: "12px" }} />
        <Bar dataKey="income" name="Receita" fill={C_INCOME} radius={[6, 6, 0, 0]} />
        <Bar dataKey="investments" name="Aportes" fill={C_INVESTMENTS} radius={[6, 6, 0, 0]} />
        <Bar dataKey="expenses" name="Despesas" fill={C_EXPENSES} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
