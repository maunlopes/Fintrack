"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ChartTooltip } from "./chart-tooltip";

const CHART_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#06b6d4", "#ec4564"];

export function CategoryPieChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={75}
          outerRadius={110}
          paddingAngle={2}
          dataKey="value"
          strokeWidth={2}
          stroke="var(--card)"
        >
          {data.map((_entry: any, i: number) => (
            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<ChartTooltip />} />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 12, color: "var(--muted-foreground)", paddingTop: "12px" }}
          formatter={(value: string) => <span className="text-muted-foreground ml-1">{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
