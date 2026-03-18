"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ChartTooltip } from "./chart-tooltip";

const CHART_COLOR = "#3b82f6";

export function BalanceForecastChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="saldoGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={CHART_COLOR} stopOpacity={0.3} />
            <stop offset="95%" stopColor={CHART_COLOR} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="month" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
        <Tooltip content={<ChartTooltip />} />
        <Area
          type="monotone"
          dataKey="saldo"
          name="Saldo"
          stroke={CHART_COLOR}
          strokeWidth={2.5}
          fill="url(#saldoGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
