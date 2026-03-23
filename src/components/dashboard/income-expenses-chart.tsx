"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";

const chartConfig = {
  income:      { label: "Receitas",      color: "var(--chart-2)" },
  investments: { label: "Aportes",       color: "var(--chart-1)" },
  expenses:    { label: "Despesas",      color: "var(--chart-5)" },
} satisfies ChartConfig;

export function IncomeExpensesChart({ data }: { data: any[] }) {
  return (
    <ChartContainer config={chartConfig} className="h-[280px] w-full">
      <BarChart data={data} barGap={4}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tick={{ fontSize: 12 }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tick={{ fontSize: 12 }}
          tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
        />
        <ChartTooltip content={<ChartTooltipContent />} cursor={{ fill: "var(--muted)", opacity: 0.5 }} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="income"      fill="var(--color-income)"      radius={[6, 6, 0, 0]} />
        <Bar dataKey="investments" fill="var(--color-investments)" radius={[6, 6, 0, 0]} />
        <Bar dataKey="expenses"    fill="var(--color-expenses)"    radius={[6, 6, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}
