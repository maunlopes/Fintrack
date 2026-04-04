"use client";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatCurrency } from "@/lib/format";

interface BudgetProgressBarProps {
  spent: number;
  limit: number;
  showValues?: boolean;
  size?: "sm" | "md";
}

export function BudgetProgressBar({ spent, limit, showValues = false, size = "md" }: BudgetProgressBarProps) {
  const pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
  const rawPct = limit > 0 ? (spent / limit) * 100 : 0;
  const isOver = rawPct >= 100;
  const isWarn = rawPct >= 80 && !isOver;

  const barColor = isOver
    ? "bg-destructive"
    : isWarn
    ? "bg-warning"
    : "bg-success";

  const trackH = size === "sm" ? "h-1.5" : "h-2";

  return (
    <div className="w-full space-y-1">
      <Tooltip>
        <TooltipTrigger>
          <div className={`w-full rounded-full bg-muted overflow-hidden cursor-default ${trackH}`}>
            <div
              className={`h-full rounded-full transition-all duration-500 ${barColor}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          {formatCurrency(spent)} gastos de {formatCurrency(limit)} ({rawPct.toFixed(1)}%)
        </TooltipContent>
      </Tooltip>

      {showValues && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{formatCurrency(spent)}</span>
          <span>{formatCurrency(limit)}</span>
        </div>
      )}
    </div>
  );
}
