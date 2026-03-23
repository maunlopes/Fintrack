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

const TYPE_COLORS: Record<string, string> = {
  FIXED_INCOME:    "var(--chart-1)",
  VARIABLE_INCOME: "var(--chart-2)",
  STOCKS:          "var(--chart-3)",
  FUNDS:           "var(--chart-4)",
  CRYPTO:          "var(--chart-5)",
  PENSION:         "var(--primary)",
};

interface AllocationEntry {
  name: string;
  value: number;
  type: string;
}

export function InvestmentAllocationChart({ data }: { data: AllocationEntry[] }) {
  const chartConfig = data.reduce<ChartConfig>((cfg, entry) => {
    cfg[entry.name] = {
      label: entry.name,
      color: TYPE_COLORS[entry.type] ?? "var(--chart-1)",
    };
    return cfg;
  }, {});

  return (
    <ChartContainer config={chartConfig} className="h-[260px] w-full">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={70}
          outerRadius={100}
          paddingAngle={3}
          dataKey="value"
          nameKey="name"
          strokeWidth={2}
          stroke="var(--card)"
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={TYPE_COLORS[entry.type] ?? "var(--chart-1)"} />
          ))}
        </Pie>
        <ChartTooltip
          content={
            <ChartTooltipContent
              hideLabel
              formatter={(value) =>
                new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(Number(value))
              }
            />
          }
        />
        <ChartLegend content={<ChartLegendContent nameKey="name" />} />
      </PieChart>
    </ChartContainer>
  );
}
