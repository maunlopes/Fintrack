"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Target, CheckCircle2, AlertTriangle, XCircle, Pencil, Trash2, X, Check, CircleCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { BudgetProgressBar } from "@/components/shared/budget-progress-bar";
import { CurrencyInput } from "@/components/shared/currency-input";
import { MonthSelector } from "@/components/shared/month-selector";
import { EmptyState } from "@/components/shared/empty-state";
import { ViewToggle } from "@/components/shared/view-toggle";
import { useViewMode } from "@/hooks/use-view-mode";
import { listVariants, listItemVariants } from "@/components/shared/animated-card";
import { CATEGORY_ICONS } from "@/lib/category-icons";
import { formatCurrency } from "@/lib/format";
import { cn, radialGradient } from "@/lib/utils";

/* ─── Types ─────────────────────────────────────────────── */

interface BudgetCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  isDefault: boolean;
  monthlyLimit: number | null;
  spent: number;
  percentage: number | null;
  status: "none" | "ok" | "warning" | "danger";
}

type FilterType = "all" | "with" | "alert";

/* ─── Variants ───────────────────────────────────────────── */

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" as const } },
};

/* ─── Main Page ──────────────────────────────────────────── */

export default function OrcamentosPage() {
  return (
    <Suspense fallback={<div className="p-8 animate-pulse text-muted-foreground text-sm">Carregando...</div>}>
      <OrcamentosContent />
    </Suspense>
  );
}

function OrcamentosContent() {
  const searchParams = useSearchParams();

  const [data, setData] = useState<BudgetCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");

  const { mode: viewMode, setMode: setViewMode } = useViewMode("orcamentos");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number>(0);
  const [saving, setSaving] = useState(false);

  const fetchData = () => {
    setLoading(true);
    const params = new URLSearchParams(searchParams.toString());
    fetch(`/api/orcamentos?${params.toString()}`)
      .then((r) => r.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [searchParams]);

  const handleSave = async (categoryId: string) => {
    if (editValue <= 0) return;
    setSaving(true);
    await fetch(`/api/orcamentos/${categoryId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ monthlyLimit: editValue }),
    });
    setSaving(false);
    setEditingId(null);
    fetchData();
  };

  const handleDelete = async (categoryId: string) => {
    await fetch(`/api/orcamentos/${categoryId}`, { method: "DELETE" });
    fetchData();
  };

  const handleEdit = (cat: BudgetCategory) => {
    setEditingId(cat.id);
    setEditValue(cat.monthlyLimit ?? 0);
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValue(0);
  };

  /* ── Derived stats ── */
  const withBudget = data.filter((c) => c.monthlyLimit !== null);
  const alerts = data.filter((c) => c.status === "warning" || c.status === "danger");
  const overLimit = data.filter((c) => c.status === "danger");

  const filtered =
    filter === "with" ? withBudget : filter === "alert" ? alerts : data;

  if (loading) {
    return (
      <div className="p-4 pb-24 lg:p-6 lg:pb-6 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="p-4 pb-24 lg:p-6 lg:pb-6 space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Orçamentos</h1>
          <p className="text-muted-foreground text-sm">Defina limites mensais por categoria de despesa</p>
        </div>
        <div className="flex items-center gap-2">
          <ViewToggle mode={viewMode} onChange={setViewMode} />
          <Suspense fallback={<div className="h-10 w-40 bg-muted animate-pulse rounded-md" />}>
            <MonthSelector />
          </Suspense>
        </div>
      </motion.div>

      {/* KPI Summary — padrão dashboard */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader>
            <CardDescription>Com orçamento</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums font-numbers">
              {withBudget.length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-l-4 border-l-warning" style={radialGradient("warning")}>
          <CardHeader>
            <CardDescription className="text-warning">Em alerta (≥80%)</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums font-numbers text-warning">
              {alerts.length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-l-4 border-l-destructive" style={radialGradient("destructive")}>
          <CardHeader>
            <CardDescription className="text-destructive">Estourados (≥100%)</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums font-numbers text-destructive">
              {overLimit.length}
            </CardTitle>
          </CardHeader>
        </Card>
      </motion.div>

      {/* Filter Tabs + List */}
      <motion.div variants={itemVariants} className="space-y-4">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
          <TabsList>
            <TabsTrigger value="all">Todas ({data.length})</TabsTrigger>
            <TabsTrigger value="with">Com orçamento ({withBudget.length})</TabsTrigger>
            <TabsTrigger value="alert">Em alerta ({alerts.length})</TabsTrigger>
          </TabsList>
        </Tabs>

        {filtered.length === 0 ? (
          <EmptyState
            illustration="budget"
            title="Nenhuma categoria aqui"
            description={
              filter === "with"
                ? 'Você ainda não definiu nenhum orçamento. Clique em "Definir limite" em qualquer categoria.'
                : filter === "alert"
                ? "Nenhuma categoria em alerta. Bom trabalho!"
                : "Nenhuma categoria de despesa encontrada."
            }
          />
        ) : viewMode === "grid" ? (
          /* ── CARD / GRID VIEW ── */
          <motion.div variants={listVariants} initial="hidden" animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filtered.map((cat, i) => (
              <CategoryBudgetCard
                key={cat.id}
                cat={cat}
                index={i}
                isEditing={editingId === cat.id}
                editValue={editValue}
                saving={saving}
                onEdit={() => handleEdit(cat)}
                onCancel={handleCancel}
                onSave={() => handleSave(cat.id)}
                onDelete={() => handleDelete(cat.id)}
                onEditValueChange={setEditValue}
              />
            ))}
          </motion.div>
        ) : (
          /* ── LIST VIEW ── */
          <motion.div variants={listVariants} initial="hidden" animate="show" className="space-y-3">
            {filtered.map((cat, i) => (
              <CategoryBudgetRow
                key={cat.id}
                cat={cat}
                index={i}
                isEditing={editingId === cat.id}
                editValue={editValue}
                saving={saving}
                onEdit={() => handleEdit(cat)}
                onCancel={handleCancel}
                onSave={() => handleSave(cat.id)}
                onDelete={() => handleDelete(cat.id)}
                onEditValueChange={setEditValue}
              />
            ))}
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}

/* ─── Category Budget Row ────────────────────────────────── */

interface RowProps {
  cat: BudgetCategory;
  index: number;
  isEditing: boolean;
  editValue: number;
  saving: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  onDelete: () => void;
  onEditValueChange: (v: number) => void;
}

function CategoryBudgetRow({
  cat, index, isEditing, editValue, saving,
  onEdit, onCancel, onSave, onDelete, onEditValueChange,
}: RowProps) {
  const IconComponent = CATEGORY_ICONS[cat.icon] ?? CATEGORY_ICONS["circle"];
  const hasBudget = cat.monthlyLimit !== null;

  const borderColor =
    cat.status === "danger" ? "border-l-destructive"
    : cat.status === "warning" ? "border-l-warning"
    : cat.status === "ok" ? "border-l-success"
    : "border-l-border";

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 12 },
        show: { opacity: 1, y: 0, transition: { delay: index * 0.04, duration: 0.3, ease: "easeOut" } },
      }}
    >
      <Card className={cn("border-l-4", borderColor)}>
        <CardContent className="flex items-center gap-3">
          {/* Icon */}
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: `color-mix(in srgb, ${cat.color} 15%, transparent)` }}
          >
            {IconComponent && <IconComponent className="w-5 h-5" style={{ color: cat.color }} />}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold truncate">{cat.name}</p>
              {cat.status === "danger" && (
                <Badge variant="destructive" className="text-[10px] gap-0.5 px-1.5 py-0 shrink-0">
                  <XCircle className="w-2.5 h-2.5" /> Estourado
                </Badge>
              )}
              {cat.status === "warning" && (
                <Badge className="text-[10px] gap-0.5 px-1.5 py-0 shrink-0 bg-warning/20 text-warning border-warning/30">
                  <AlertTriangle className="w-2.5 h-2.5" /> Atenção
                </Badge>
              )}
              {cat.status === "ok" && (
                <Badge variant="outline" className="text-[10px] gap-0.5 px-1.5 py-0 shrink-0 text-success border-success/30">
                  <CheckCircle2 className="w-2.5 h-2.5" /> OK
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {hasBudget
                ? `${formatCurrency(cat.spent)} de ${formatCurrency(cat.monthlyLimit!)} · ${cat.percentage !== null ? `${cat.percentage.toFixed(0)}%` : ""}`
                : cat.spent > 0 ? `${formatCurrency(cat.spent)} gastos · sem limite` : "Sem limite definido"
              }
            </p>
            {/* Progress bar */}
            {hasBudget && !isEditing && (() => {
              const pct = cat.monthlyLimit! > 0 ? Math.min((cat.spent / cat.monthlyLimit!) * 100, 100) : 0;
              const barColor = pct >= 100 ? "bg-destructive" : pct >= 80 ? "bg-warning" : "bg-success";
              return (
                <div className="mt-1.5 w-full h-2 rounded-full bg-muted overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${pct}%` }} />
                </div>
              );
            })()}
            {/* Edit form */}
            {isEditing && (
              <div className="flex items-center gap-2 mt-2">
                <div className="w-48">
                  <CurrencyInput
                    value={editValue}
                    onChange={onEditValueChange}
                    placeholder="0,00"
                    className="h-8 text-sm"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") onSave();
                      if (e.key === "Escape") onCancel();
                    }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">/mês</span>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-success hover:text-success" onClick={onSave} disabled={saving || editValue <= 0}>
                  <Check className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onCancel}>
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}
          </div>

          {/* Amount */}
          {hasBudget && !isEditing && (
            <div className="shrink-0 min-w-[120px] text-right">
              <span className="text-lg font-bold tabular-nums font-numbers">
                {formatCurrency(cat.monthlyLimit!)}
              </span>
            </div>
          )}

          {/* Actions */}
          {!isEditing && (
            <div className="flex items-center justify-end gap-1 shrink-0 pl-3 border-l w-[84px]">
              <Tooltip>
                <TooltipTrigger>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-muted" onClick={onEdit}>
                    <Pencil className="w-7 h-7" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{hasBudget ? "Editar limite" : "Definir limite"}</TooltipContent>
              </Tooltip>
              {hasBudget ? (
                <Tooltip>
                  <TooltipTrigger>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10" onClick={onDelete}>
                      <Trash2 className="w-7 h-7" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Remover limite</TooltipContent>
                </Tooltip>
              ) : (
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-muted-foreground/30 pointer-events-none" disabled>
                  <Trash2 className="w-7 h-7" />
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ─── Category Budget Card (Grid View) ──────────────────── */

function CategoryBudgetCard({
  cat, index, isEditing, editValue, saving,
  onEdit, onCancel, onSave, onDelete, onEditValueChange,
}: RowProps) {
  const IconComponent = CATEGORY_ICONS[cat.icon] ?? CATEGORY_ICONS["circle"];
  const hasBudget = cat.monthlyLimit !== null;

  const borderColor =
    cat.status === "danger" ? "border-l-destructive"
    : cat.status === "warning" ? "border-l-warning"
    : cat.status === "ok" ? "border-l-success"
    : "border-l-border";

  const pct = hasBudget && cat.monthlyLimit! > 0 ? Math.min((cat.spent / cat.monthlyLimit!) * 100, 100) : 0;
  const barColor = pct >= 100 ? "bg-destructive" : pct >= 80 ? "bg-warning" : "bg-success";

  return (
    <motion.div variants={listItemVariants}>
      <Card className={cn("border-l-4 h-full hover:shadow-sm transition-shadow", borderColor)}>
        <CardHeader className="flex flex-row items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `color-mix(in srgb, ${cat.color} 15%, transparent)` }}
            >
              {IconComponent && <IconComponent className="w-4 h-4" style={{ color: cat.color }} />}
            </div>
            <span className="text-xs text-muted-foreground truncate">{cat.name}</span>
          </div>
          {cat.status === "danger" && (
            <Badge variant="destructive" className="text-[10px] gap-0.5 px-1.5 py-0 shrink-0">
              <XCircle className="w-2.5 h-2.5" /> Estourado
            </Badge>
          )}
          {cat.status === "warning" && (
            <Badge className="text-[10px] gap-0.5 px-1.5 py-0 shrink-0 bg-warning/20 text-warning border-warning/30">
              <AlertTriangle className="w-2.5 h-2.5" /> Atenção
            </Badge>
          )}
          {cat.status === "ok" && (
            <Badge variant="outline" className="text-[10px] gap-0.5 px-1.5 py-0 shrink-0 text-success border-success/30">
              <CheckCircle2 className="w-2.5 h-2.5" /> OK
            </Badge>
          )}
        </CardHeader>

        <CardContent className="flex flex-col gap-2 flex-1">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <CurrencyInput
                  value={editValue}
                  onChange={onEditValueChange}
                  placeholder="0,00"
                  className="h-8 text-sm"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onSave();
                    if (e.key === "Escape") onCancel();
                  }}
                />
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-success hover:text-success" onClick={onSave} disabled={saving || editValue <= 0}>
                <Check className="w-3.5 h-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onCancel}>
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          ) : (
            <>
              <p className="text-lg font-bold tabular-nums font-numbers">
                {hasBudget ? formatCurrency(cat.monthlyLimit!) : "Sem limite"}
              </p>
              <p className="text-xs text-muted-foreground">
                {hasBudget
                  ? `${formatCurrency(cat.spent)} gastos · ${cat.percentage !== null ? `${cat.percentage.toFixed(0)}%` : ""}`
                  : cat.spent > 0 ? `${formatCurrency(cat.spent)} gastos` : "Nenhum gasto"
                }
              </p>
              {hasBudget && (
                <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${pct}%` }} />
                </div>
              )}
            </>
          )}
        </CardContent>

        {!isEditing && (
          <CardFooter className="flex items-center justify-end border-t pt-4">
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-muted" onClick={onEdit}>
                    <Pencil className="w-7 h-7" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{hasBudget ? "Editar limite" : "Definir limite"}</TooltipContent>
              </Tooltip>
              {hasBudget ? (
                <Tooltip>
                  <TooltipTrigger>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10" onClick={onDelete}>
                      <Trash2 className="w-7 h-7" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Remover limite</TooltipContent>
                </Tooltip>
              ) : (
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-muted-foreground/30 pointer-events-none" disabled>
                  <Trash2 className="w-7 h-7" />
                </Button>
              )}
            </div>
          </CardFooter>
        )}
      </Card>
    </motion.div>
  );
}
