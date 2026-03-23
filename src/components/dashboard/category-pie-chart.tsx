"use client";

import { PieChart, Pie, Cell } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";

const FALLBACK_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export function CategoryPieChart({ data }: { data: any[] }) {
  // Build ChartConfig dynamically from category data
  const chartConfig = data.reduce<ChartConfig>((cfg, entry, i) => {
    cfg[entry.name] = {
      label: entry.name,
      color: entry.color ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length],
    };
    return cfg;
  }, {});

  return (
    <ChartContainer config={chartConfig} className="h-[280px] w-full">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={75}
          outerRadius={110}
          paddingAngle={2}
          dataKey="value"
          nameKey="name"
          strokeWidth={2}
          stroke="var(--card)"
        >
          {data.map((entry: any, i: number) => (
            <Cell
              key={i}
              fill={entry.color ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length]}
            />
          ))}
        </Pie>
        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
        <ChartLegend content={<ChartLegendContent nameKey="name" />} />
      </PieChart>
    </ChartContainer>
  );
}
