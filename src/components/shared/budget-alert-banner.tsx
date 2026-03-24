"use client";

import Link from "next/link";
import { AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { BudgetProgressBar } from "./budget-progress-bar";
import { CATEGORY_ICONS } from "@/lib/category-icons";
import { cn } from "@/lib/utils";

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

function formatBRL(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

export function BudgetAlertBanner({ items }: BudgetAlertBannerProps) {
  if (items.length === 0) return null;

  const dangers = items.filter((i) => i.status === "danger");
  const warnings = items.filter((i) => i.status === "warning");
  const sorted = [...dangers, ...warnings];
  const hasDanger = dangers.length > 0;

  return (
    <Card
      className={cn(
        "gap-0 shadow-sm",
        hasDanger
          ? "border-destructive/30 bg-destructive/5"
          : "border-warning/40 bg-warning/5"
      )}
    >
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <AlertTriangle
              className={cn(
                "w-4 h-4 shrink-0",
                hasDanger ? "text-destructive" : "text-warning"
              )}
            />
            <span className="text-sm font-semibold text-foreground">
              Alertas de Orçamento
            </span>
            {dangers.length > 0 && (
              <Badge
                variant="outline"
                className="bg-destructive/10 text-destructive border-destructive/30 tabular-nums"
              >
                {dangers.length} {dangers.length === 1 ? "estourado" : "estourados"}
              </Badge>
            )}
            {warnings.length > 0 && (
              <Badge
                variant="outline"
                className="bg-warning/15 text-warning border-warning/30 tabular-nums"
              >
                {warnings.length} {warnings.length === 1 ? "alerta" : "alertas"}
              </Badge>
            )}
          </div>
          <Link
            href="/orcamentos"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "text-muted-foreground shrink-0 h-7 px-2 text-xs"
            )}
          >
            Ver orçamentos →
          </Link>
        </div>

        {/* Alert rows */}
        <div className="space-y-2">
          {sorted.map((item) => {
            const Icon = CATEGORY_ICONS[item.icon] ?? CATEGORY_ICONS["circle"];
            const isOver = item.status === "danger";
            const overAmount = item.spent - item.monthlyLimit;
            const remaining = item.monthlyLimit - item.spent;

            return (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-md border-l-2 bg-background/50 px-3 py-2"
                style={{ borderLeftColor: isOver ? "var(--destructive)" : "var(--warning)" }}
              >
                {/* Icon — 30% opacity */}
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md"
                  style={{ backgroundColor: item.color + "4D" }}
                >
                  {Icon && <Icon className="w-4 h-4" style={{ color: item.color }} />}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-1">
                  {/* Name + percentage */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium truncate">{item.name}</span>
                    <span
                      className={cn(
                        "shrink-0 text-xs font-semibold tabular-nums",
                        isOver ? "text-destructive" : "text-warning"
                      )}
                    >
                      {item.percentage.toFixed(0)}%
                    </span>
                  </div>

                  {/* Spent / limit + delta — always visible */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {formatBRL(item.spent)} de {formatBRL(item.monthlyLimit)}
                    </span>
                    <span
                      className={cn(
                        "shrink-0 text-xs font-medium tabular-nums flex items-center gap-0.5",
                        isOver ? "text-destructive" : "text-warning"
                      )}
                    >
                      {isOver ? (
                        <>
                          <TrendingUp className="w-3 h-3" />
                          {formatBRL(overAmount)} acima
                        </>
                      ) : (
                        <>
                          <TrendingDown className="w-3 h-3" />
                          {formatBRL(remaining)} restantes
                        </>
                      )}
                    </span>
                  </div>

                  {/* Progress bar — md = 8px */}
                  <BudgetProgressBar spent={item.spent} limit={item.monthlyLimit} size="md" />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
