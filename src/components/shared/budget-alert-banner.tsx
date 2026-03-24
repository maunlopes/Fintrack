"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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

  return (
    <Card className="p-6 h-full flex flex-col shadow-sm">
      <CardHeader className="p-0 pb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <AlertTriangle className="w-4 h-4 text-warning shrink-0" />
          <CardTitle className="text-muted-foreground font-semibold flex-1">Alertas de Orçamento</CardTitle>
          {dangers.length > 0 && (
            <Badge variant="destructive">
              {dangers.length} {dangers.length === 1 ? "estourado" : "estourados"}
            </Badge>
          )}
          {warnings.length > 0 && (
            <Badge variant="outline" className="text-warning border-warning/40">
              {warnings.length} {warnings.length === 1 ? "alerta" : "alertas"}
            </Badge>
          )}
          <Link
            href="/orcamentos"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors ml-1"
          >
            Ver →
          </Link>
        </div>
        <CardDescription>Categorias próximas ou acima do limite</CardDescription>
      </CardHeader>

      <CardContent className="p-0 flex-1">
        <Separator className="mb-4" />

        {/* Items — 2 rows each, compact */}
        <div className="space-y-2.5">
          {sorted.map((item) => {
            const isOver = item.status === "danger";
            const pct = Math.min(item.percentage, 100);
            const barColor = isOver ? "bg-destructive" : "bg-warning";

            return (
              <div key={item.id} className="space-y-1">
                {/* Row 1: dot + name + amounts + percentage */}
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: item.color }}
                  />
                  <span className="text-xs font-medium flex-1 truncate">{item.name}</span>
                  <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                    {formatBRL(item.spent)}&nbsp;/&nbsp;{formatBRL(item.monthlyLimit)}
                  </span>
                  <span
                    className={cn(
                      "text-xs font-semibold tabular-nums w-7 text-right shrink-0",
                      isOver ? "text-destructive" : "text-warning"
                    )}
                  >
                    {item.percentage.toFixed(0)}%
                  </span>
                </div>
                {/* Row 2: progress bar */}
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all duration-500", barColor)}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

