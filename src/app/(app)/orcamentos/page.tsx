"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Target, CheckCircle2, AlertTriangle, XCircle, Pencil, Trash2, X, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { BudgetProgressBar } from "@/components/shared/budget-progress-bar";
import { CurrencyInput } from "@/components/shared/currency-input";
import { MonthSelector } from "@/components/shared/month-selector";
import { EmptyState } from "@/components/shared/empty-state";
import { CATEGORY_ICONS } from "@/lib/category-icons";

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
  const router = useRouter();
  const pathname = usePathname();

  const [data, setData] = useState<BudgetCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");

  // Track which category is in "edit" mode and its current input value
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
    filter === "with"
      ? withBudget
      : filter === "alert"
      ? alerts
      : data;

  /* ── KPI cards ── */
  const kpiCards = [
    {
      label: "Com orçamento",
      value: withBudget.length,
      icon: Target,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Em alerta (≥80%)",
      value: alerts.length,
      icon: AlertTriangle,
      color: "text-warning",
      bg: "bg-warning/10",
    },
    {
      label: "Estourados (≥100%)",
      value: overLimit.length,
      icon: XCircle,
      color: "text-destructive",
      bg: "bg-destructive/10",
    },
  ];

  if (loading) {
    return (
      <div className="p-4 lg:p-6 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid grid-cols-3 gap-4">
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
      className="p-4 lg:p-6 space-y-6"
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
        <div data-tour="month-selector">
          <Suspense fallback={<div className="h-10 w-40 bg-muted animate-pulse rounded-md" />}>
            <MonthSelector />
          </Suspense>
        </div>
      </motion.div>

      {/* KPI Summary */}
      <motion.div variants={itemVariants} className="grid grid-cols-3 gap-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className="p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${card.bg}`}>
                  <Icon className={`h-4 w-4 ${card.color}`} />
                </div>
                <div>
                  <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
                  <div className="text-xs text-muted-foreground">{card.label}</div>
                </div>
              </div>
            </Card>
          );
        })}
      </motion.div>

      {/* Filter Tabs + List */}
      <motion.div variants={itemVariants} className="space-y-4">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="all">Todas ({data.length})</TabsTrigger>
            <TabsTrigger value="with">Com orçamento ({withBudget.length})</TabsTrigger>
            <TabsTrigger value="alert">Em alerta ({alerts.length})</TabsTrigger>
          </TabsList>
        </Tabs>

        {filtered.length === 0 ? (
          <EmptyState
            icon={Target}
            title="Nenhuma categoria aqui"
            description={
              filter === "with"
                ? 'Você ainda não definiu nenhum orçamento. Clique em "Definir limite" em qualquer categoria.'
                : filter === "alert"
                ? "Nenhuma categoria em alerta. Bom trabalho!"
                : "Nenhuma categoria de despesa encontrada."
            }
          />
        ) : (
          <div className="space-y-3">
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
          </div>
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
  const Icon = CATEGORY_ICONS[cat.icon] ?? CATEGORY_ICONS["circle"];
  const hasBudget = cat.monthlyLimit !== null;

  const statusBadge =
    cat.status === "danger" ? (
      <Badge variant="destructive" className="text-xs gap-1 shrink-0">
        <XCircle className="w-3 h-3" /> Estourado
      </Badge>
    ) : cat.status === "warning" ? (
      <Badge className="text-xs gap-1 shrink-0 bg-warning/20 text-warning border-warning/30">
        <AlertTriangle className="w-3 h-3" /> Atenção
      </Badge>
    ) : cat.status === "ok" ? (
      <Badge variant="outline" className="text-xs gap-1 shrink-0 text-success border-success/30">
        <CheckCircle2 className="w-3 h-3" /> OK
      </Badge>
    ) : null;

  function formatBRL(v: number) {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
  }

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 12 },
        show: { opacity: 1, y: 0, transition: { delay: index * 0.04, duration: 0.3, ease: "easeOut" } },
      }}
    >
      <Card className="p-4 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: cat.color + "22" }}
          >
            {Icon && <Icon className="w-5 h-5" style={{ color: cat.color }} />}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-2">
            {/* Name + badge + actions */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-semibold text-sm truncate">{cat.name}</span>
                {statusBadge}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {!isEditing && (
                  <>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit} title="Editar limite">
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    {hasBudget && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={onDelete}
                        title="Remover limite"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </>
                )}
                {isEditing && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-success hover:text-success"
                      onClick={onSave}
                      disabled={saving || editValue <= 0}
                      title="Salvar"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={onCancel}
                      title="Cancelar"
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Edit form or progress */}
            {isEditing ? (
              <div className="flex items-center gap-2">
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
              </div>
            ) : hasBudget ? (
              <div className="space-y-1">
                <BudgetProgressBar
                  spent={cat.spent}
                  limit={cat.monthlyLimit!}
                  showValues
                  size="md"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{cat.percentage !== null ? `${cat.percentage.toFixed(1)}% utilizado` : ""}</span>
                  <span>Limite: {formatBRL(cat.monthlyLimit!)}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {cat.spent > 0
                    ? `${formatBRL(cat.spent)} gastos este mês · sem limite definido`
                    : "Sem limite definido"}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 text-xs px-2"
                  onClick={onEdit}
                >
                  Definir limite
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
