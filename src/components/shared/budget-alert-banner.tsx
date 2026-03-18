"use client";

import Link from "next/link";
import { AlertTriangle, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { BudgetProgressBar } from "./budget-progress-bar";
import { CATEGORY_ICONS } from "@/lib/category-icons";

interface BudgetItem {
  id: string;
  name: string;
  icon: string;
  color: string;
  spent: number;
  monthlyLimit: number;
  percentage: number;
  status: "warning" | "danger";
}

interface BudgetAlertBannerProps {
  items: BudgetItem[];
}

export function BudgetAlertBanner({ items }: BudgetAlertBannerProps) {
  if (items.length === 0) return null;

  const dangers = items.filter((i) => i.status === "danger");
  const warnings = items.filter((i) => i.status === "warning");

  return (
    <Card className="border-warning/40 bg-warning/5 shadow-sm">
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-warning-foreground">
            <AlertTriangle className="w-4 h-4 text-warning" />
            <span>
              Alertas de Orçamento
              {dangers.length > 0 && (
                <span className="ml-2 text-destructive">
                  · {dangers.length} {dangers.length === 1 ? "estourado" : "estourados"}
                </span>
              )}
              {warnings.length > 0 && (
                <span className="ml-2 text-warning">
                  · {warnings.length} próximo{warnings.length > 1 ? "s" : ""} do limite
                </span>
              )}
            </span>
          </div>
          <Link
            href="/orcamentos"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline"
          >
            Ver orçamentos →
          </Link>
        </div>

        {/* Alert rows */}
        <div className="space-y-2.5">
          {items.map((item) => {
            const Icon = CATEGORY_ICONS[item.icon] ?? CATEGORY_ICONS["circle"];
            const isOver = item.status === "danger";
            return (
              <div key={item.id} className="flex items-center gap-3">
                <div
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
                  style={{ backgroundColor: item.color + "22" }}
                >
                  {Icon && <Icon className="w-3.5 h-3.5" style={{ color: item.color }} />}
                </div>
                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-medium truncate">{item.name}</span>
                    <span
                      className={`shrink-0 font-semibold tabular-nums ${
                        isOver ? "text-destructive" : "text-warning"
                      }`}
                    >
                      {isOver ? <XCircle className="w-3 h-3 inline mr-0.5" /> : null}
                      {item.percentage.toFixed(0)}%
                    </span>
                  </div>
                  <BudgetProgressBar spent={item.spent} limit={item.monthlyLimit} size="sm" />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
