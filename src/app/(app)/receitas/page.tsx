"use client";

import { useState, useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { MonthSelector } from "@/components/shared/month-selector";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, TrendingUp, Trash2, Pencil, Search, Tag, Wallet, RotateCcw, X, MoreHorizontal, CircleCheck } from "lucide-react";
type RecurrenceFrequency = "WEEKLY" | "BIWEEKLY" | "MONTHLY";
import { PageTransition } from "@/components/shared/page-transition";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { ViewToggle } from "@/components/shared/view-toggle";
import { useViewMode } from "@/hooks/use-view-mode";
import { listVariants, listItemVariants } from "@/components/shared/animated-card";
import { MoneyValue } from "@/components/shared/money-value";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/shared/currency-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { incomeSchema, IncomeInput } from "@/lib/validations/income";
import { formatDate, formatCurrency } from "@/lib/format";
import { cn, radialGradient } from "@/lib/utils";
import { CATEGORY_ICONS } from "@/lib/category-icons";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ConfirmReceiveDialog } from "@/components/receitas/confirm-receive-dialog";

const freqLabels: Record<RecurrenceFrequency, string> = {
  WEEKLY: "Semanal",
  BIWEEKLY: "Quinzenal",
  MONTHLY: "Mensal",
};

interface Category { id: string; name: string; type: string; color?: string; icon?: string; }
interface BankAccount { id: string; nickname: string; balance?: string; }
interface Income {
  id: string;
  description: string;
  amount: string;
  receiveDate: string;
  status: "PENDING" | "PAID" | "OVERDUE";
  isRecurring: boolean;
  recurrenceFrequency: RecurrenceFrequency | null;
  parentIncomeId?: string | null;
  category: Category;
  bankAccount: BankAccount;
}

function IncomeForm({
  onSuccess,
  categories,
  bankAccounts,
  defaultValues,
}: {
  onSuccess: () => void;
  categories: Category[];
  bankAccounts: BankAccount[];
  defaultValues?: Partial<IncomeInput & { id: string }>;
}) {
  const form = useForm<IncomeInput, any, IncomeInput>({
    resolver: zodResolver(incomeSchema) as any,
    defaultValues: {
      description: defaultValues?.description ?? "",
      amount: defaultValues?.amount ?? 0,
      receiveDate: defaultValues?.receiveDate ? new Date(defaultValues.receiveDate) : new Date(),
      categoryId: defaultValues?.categoryId ?? "",
      bankAccountId: defaultValues?.bankAccountId ?? "",
      isRecurring: defaultValues?.isRecurring ?? false,
      recurrenceFrequency: defaultValues?.recurrenceFrequency ?? undefined,
      notes: defaultValues?.notes ?? "",
    },
  });

  const isRecurring = form.watch("isRecurring");

  async function onSubmit(data: IncomeInput) {
    const url = defaultValues?.id ? `/api/receitas/${defaultValues.id}` : "/api/receitas";
    const method = defaultValues?.id ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) { toast.error("Erro ao salvar receita"); return; }
    toast.success(defaultValues?.id ? "Receita atualizada!" : "Receita cadastrada!");
    onSuccess();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem>
            <FormLabel>Descrição</FormLabel>
            <FormControl><Input placeholder="Ex: Salário, Freelance..." {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="amount" render={({ field }) => (
            <FormItem>
              <FormLabel>Valor</FormLabel>
              <FormControl>
                <CurrencyInput
                  value={field.value}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="receiveDate" render={({ field }) => (
            <FormItem>
              <FormLabel>Data recebimento</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  value={field.value instanceof Date ? field.value.toISOString().split("T")[0] : String(field.value)}
                  onChange={(e) => { if (e.target.value) { const [y,m,d] = e.target.value.split("-").map(Number); field.onChange(new Date(y, m-1, d, 12)); } else { field.onChange(new Date()); } }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>
        <FormField control={form.control} name="categoryId" render={({ field }) => (
          <FormItem>
            <FormLabel>Categoria</FormLabel>
            <FormControl>
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger><SelectValue>{categories.find((c) => c.id === field.value)?.name || "Selecione..."}</SelectValue></SelectTrigger>
                <SelectContent>
                  {categories.filter((c) => c.type === "INCOME").map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="bankAccountId" render={({ field }) => (
          <FormItem>
            <FormLabel>Conta destino</FormLabel>
            <FormControl>
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger><SelectValue>{bankAccounts.find((a) => a.id === field.value)?.nickname || "Selecione..."}</SelectValue></SelectTrigger>
                <SelectContent>
                  {bankAccounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.nickname}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="isRecurring" render={({ field }) => (
          <FormItem className="flex items-center gap-3">
            <FormLabel className="mt-0">Recorrente?</FormLabel>
            <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
          </FormItem>
        )} />
        {isRecurring && (
          <>
            <FormField control={form.control} name="recurrenceFrequency" render={({ field }) => (
              <FormItem>
                <FormLabel>Frequência</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <SelectTrigger><SelectValue>{field.value ? freqLabels[field.value as RecurrenceFrequency] : "Selecione..."}</SelectValue></SelectTrigger>
                    <SelectContent>
                      {Object.entries(freqLabels).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="recurrenceEnd" render={({ field }) => (
              <FormItem>
                <FormLabel>Repete até (opcional)</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    value={field.value instanceof Date ? field.value.toISOString().split("T")[0] : field.value || ""}
                    onChange={(e) => { if (e.target.value) { const [y,m,d] = e.target.value.split("-").map(Number); field.onChange(new Date(y, m-1, d, 12)); } else { field.onChange(undefined); } }}
                  />
                </FormControl>
                <p className="text-xs text-muted-foreground">Deixe vazio para repetir indefinidamente</p>
                <FormMessage />
              </FormItem>
            )} />
          </>
        )}
        <FormField control={form.control} name="notes" render={({ field }) => (
          <FormItem>
            <FormLabel>Observações (opcional)</FormLabel>
            <FormControl><Textarea placeholder="..." {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <motion.div whileTap={{ scale: 0.97 }}>
          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Salvando..." : "Salvar"}
          </Button>
        </motion.div>
      </form>
    </Form>
  );
}

function ReceitasContent() {
  const searchParams = useSearchParams();
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editIncome, setEditIncome] = useState<Income | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [confirmReceiveOpen, setConfirmReceiveOpen] = useState(false);
  const [confirmReceiveIncome, setConfirmReceiveIncome] = useState<Income | null>(null);
  const [filter, setFilter] = useState<"ALL" | "PAID" | "PENDING">("ALL");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  async function fetchData() {
    try {
      const params = new URLSearchParams(searchParams.toString());
      if (!params.has("month")) params.set("month", (new Date().getMonth() + 1).toString());
      if (!params.has("year")) params.set("year", new Date().getFullYear().toString());

      const [incRes, catRes, accRes] = await Promise.all([
        fetch(`/api/receitas?${params.toString()}`),
        fetch("/api/categorias"),
        fetch("/api/contas"),
      ]);
      const incData = incRes.ok ? await incRes.json() : [];
      const catData = catRes.ok ? await catRes.json() : [];
      const accData = accRes.ok ? await accRes.json() : [];
      setIncomes(incData);
      setCategories(catData);
      setBankAccounts(accData);
    } catch {
      setIncomes([]);
      setCategories([]);
      setBankAccounts([]);
    }
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, [searchParams]);

  // Auto-open dialog when navigated with ?new=true (e.g. from QuickAddFAB)
  useEffect(() => {
    if (searchParams.get("new") === "true") {
      setEditIncome(null);
      setDialogOpen(true);
    }
  }, []);

  function openConfirmReceive(income: Income) {
    setConfirmReceiveIncome(income);
    setConfirmReceiveOpen(true);
  }

  async function handleConfirmReceive(id: string, data: { amount: number; bankAccountId: string; receiveDate: string }) {
    const res = await fetch(`/api/receitas/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "PAID", ...data }),
    });
    if (res.ok) { toast.success("Receita confirmada!"); fetchData(); }
    else toast.error("Erro ao confirmar recebimento");
  }

  async function handleRevertReceive(id: string) {
    const res = await fetch(`/api/receitas/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "PENDING" }),
    });
    if (res.ok) { toast.success("Recebimento revertido"); fetchData(); }
    else toast.error("Erro ao reverter");
  }

  const [deleteAll, setDeleteAll] = useState(false);

  async function handleDelete() {
    if (!deleteId) return;
    const query = deleteAll ? "?deleteAll=true" : "";
    const res = await fetch(`/api/receitas/${deleteId}${query}`, { method: "DELETE" });
    if (res.ok) { toast.success(deleteAll ? "Todas as ocorrências removidas" : "Receita removida"); fetchData(); }
    else toast.error("Erro ao remover");
    setDeleteId(null);
    setDeleteAll(false);
  }

  const totalIncome = incomes.filter((i) => i.status === "PAID").reduce((s, i) => s + parseFloat(i.amount), 0);
  const totalPending = incomes.filter((i) => i.status !== "PAID").reduce((s, i) => s + parseFloat(i.amount), 0);

  const topIncomeCategory = (() => {
    const byCategory = incomes.reduce((acc, i) => {
      const key = i.category.id;
      if (!acc[key]) acc[key] = { ...i.category, total: 0 };
      acc[key].total += parseFloat(i.amount);
      return acc;
    }, {} as Record<string, { id: string; name: string; color?: string; icon?: string; total: number }>);
    return Object.values(byCategory).sort((a, b) => b.total - a.total)[0] ?? null;
  })();

  const topIncome = incomes.length > 0
    ? incomes.reduce((prev, curr) => parseFloat(curr.amount) > parseFloat(prev.amount) ? curr : prev)
    : null;

  const uniqueCategories = Array.from(
    new Map(incomes.map((i) => [i.category.id, i.category])).values()
  ).sort((a, b) => a.name.localeCompare(b.name));

  const selectedCategory = uniqueCategories.find((c) => c.id === categoryFilter) ?? null;

  const filteredIncomes = incomes.filter((i) => {
    const statusOk = filter === "ALL" ? true : filter === "PAID" ? i.status === "PAID" : i.status !== "PAID";
    const searchOk = !search || i.description.toLowerCase().includes(search.toLowerCase());
    const categoryOk = categoryFilter === "ALL" || i.category.id === categoryFilter;
    return statusOk && searchOk && categoryOk;
  });

  const { mode: viewMode, setMode: setViewMode } = useViewMode("receitas");

  const activeFiltersCount = [
    filter !== "ALL",
    categoryFilter !== "ALL",
    search !== "",
  ].filter(Boolean).length;

  function clearFilters() {
    setFilter("ALL");
    setCategoryFilter("ALL");
    setSearch("");
  }

  return (
    <PageTransition>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Receitas</h1>
          <p className="text-sm text-muted-foreground">Acompanhe suas entradas do mês.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <ViewToggle mode={viewMode} onChange={setViewMode} />
          <motion.div whileTap={{ scale: 0.97 }}>
            <Button onClick={() => { setEditIncome(null); setDialogOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" /> Nova Receita
            </Button>
          </motion.div>
          <div className="flex-1 flex justify-end">
            <MonthSelector />
          </div>
        </div>
      </div>

      {/* SUMMARY */}
      {!loading && incomes.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {/* Total do mês */}
          <Card className="border-l-4 border-l-success" style={radialGradient("success")}>
            <CardHeader>
              <CardDescription className="text-success-label">Total do mês</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums font-numbers text-success-dark">
                {formatCurrency(totalIncome + totalPending)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Recebido</span>
                <span className="font-semibold text-success">{formatCurrency(totalIncome)}</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-success transition-all duration-700"
                  style={{ width: `${(totalIncome + totalPending) > 0 ? (totalIncome / (totalIncome + totalPending)) * 100 : 0}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">A receber</span>
                <span className="font-semibold text-muted-foreground">{formatCurrency(totalPending)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Maior categoria + Maior receita empilhados */}
          <div className="flex flex-col gap-3">
            {topIncomeCategory && (() => {
              const CatIcon = CATEGORY_ICONS[topIncomeCategory.icon || ""] ?? CATEGORY_ICONS["circle"];
              const catColor = topIncomeCategory.color || "var(--success)";
              return (
                <Card
                  className="border-l-4 flex-1 relative overflow-hidden"
                  style={{
                    borderLeftColor: catColor,
                    background: `radial-gradient(circle 120px at calc(100% - 16px) 16px, color-mix(in srgb, ${catColor} 16%, transparent) 0%, transparent 100%) var(--card)`,
                  }}
                >
                  {CatIcon && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-10">
                      <CatIcon className="w-16 h-16" style={{ color: catColor }} />
                    </div>
                  )}
                  <CardHeader className="relative z-10">
                    <CardDescription>Maior categoria</CardDescription>
                    <div className="flex items-baseline gap-2">
                      <CardTitle className="text-2xl font-semibold tabular-nums font-numbers" style={{ color: catColor }}>
                        {formatCurrency(topIncomeCategory.total)}
                      </CardTitle>
                      <span className="text-sm text-muted-foreground truncate">{topIncomeCategory.name}</span>
                    </div>
                  </CardHeader>
                </Card>
              );
            })()}

            {topIncome && (
              <Card className="border-l-4 border-l-success flex-1" style={radialGradient("success")}>
                <CardHeader>
                  <CardDescription>Maior receita</CardDescription>
                  <div className="flex items-baseline gap-2">
                    <CardTitle className="text-2xl font-semibold tabular-nums font-numbers text-success">
                      {formatCurrency(parseFloat(topIncome.amount))}
                    </CardTitle>
                    <span className="text-sm text-muted-foreground truncate">{topIncome.description}</span>
                  </div>
                </CardHeader>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* FILTERS + SEARCH */}
      <div className="mb-6 flex flex-col sm:flex-row gap-3 flex-wrap">
        <Tabs value={filter} onValueChange={(val) => setFilter(val as any)}>
          <TabsList>
            <TabsTrigger value="ALL">Tudo</TabsTrigger>
            <TabsTrigger value="PAID">Recebido</TabsTrigger>
            <TabsTrigger value="PENDING">A Receber</TabsTrigger>
          </TabsList>
        </Tabs>
        <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v ?? "ALL")}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue>
              {categoryFilter === "ALL" ? (
                "Todas as categorias"
              ) : selectedCategory ? (
                <span className="flex items-center gap-1.5">
                  <span
                    className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: selectedCategory.color }}
                  />
                  {selectedCategory.name}
                </span>
              ) : (
                "Categoria"
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todas as categorias</SelectItem>
            {uniqueCategories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                <span className="inline-block w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar receita..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {activeFiltersCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground hover:text-foreground h-10">
            <X className="w-3.5 h-3.5 mr-1" /> Limpar filtros
            <Badge variant="secondary" className="ml-1.5 text-xs px-1.5">{activeFiltersCount}</Badge>
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />)}
        </div>
      ) : filteredIncomes.length === 0 ? (
        <EmptyState
          illustration="transactions"
          title="Nenhuma receita este mês"
          description="Cadastre suas receitas para acompanhar seus ganhos."
          actionLabel="Nova Receita"
          onAction={() => setDialogOpen(true)}
        />
      ) : viewMode === "grid" ? (
        /* ── CARD / GRID VIEW ── */
        <motion.div variants={listVariants} initial="hidden" animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredIncomes.map((income) => (
            <motion.div key={income.id} variants={listItemVariants}>
              <Card className="hover:shadow-sm transition-shadow h-full">
                <CardHeader className="flex flex-row items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {(() => {
                      const CatIcon = CATEGORY_ICONS[income.category?.icon || ""] ?? CATEGORY_ICONS["circle"];
                      return (
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                             style={{ backgroundColor: `color-mix(in srgb, ${income.category?.color || "var(--success)"} 15%, transparent)` }}>
                          <CatIcon className="w-4 h-4" style={{ color: income.category?.color || "var(--success)" }} />
                        </div>
                      );
                    })()}
                    <span className="text-xs text-muted-foreground truncate">{income.category?.name || "Sem categoria"}</span>
                  </div>
                  <StatusBadge status={income.status} type="income" />
                </CardHeader>
                <CardContent className="flex flex-col gap-2 flex-1">
                  <p className="text-sm font-semibold leading-tight">{income.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(income.receiveDate)}
                    {income.bankAccount ? ` · ${income.bankAccount.nickname}` : ""}
                  </p>
                  <p className="text-sm sm:text-lg font-bold tabular-nums font-numbers text-success mt-1">+{formatCurrency(parseFloat(income.amount))}</p>
                </CardContent>
                <CardFooter className="flex items-center justify-end border-t pt-4">
                  <div className="flex items-center gap-1">
                    <Tooltip>
                      <TooltipTrigger>
                        <Button variant="ghost" size="icon" className={cn("h-8 w-8 sm:h-9 sm:w-9 rounded-lg", income.status === "PAID" ? "text-warning hover:text-warning hover:bg-warning/10" : "text-success hover:text-success hover:bg-success/10")} onClick={() => income.status === "PAID" ? handleRevertReceive(income.id) : openConfirmReceive(income)}>
                          {income.status === "PAID" ? <RotateCcw className="w-5 h-5 sm:w-7 sm:h-7" /> : <CircleCheck className="w-5 h-5 sm:w-7 sm:h-7" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{income.status === "PAID" ? "Reverter recebimento" : "Confirmar recebimento"}</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger>
                        <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg hover:bg-muted" onClick={() => { setEditIncome(income); setDialogOpen(true); }}>
                          <Pencil className="w-5 h-5 sm:w-7 sm:h-7" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Editar</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger>
                        <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setDeleteId(income.id)}>
                          <Trash2 className="w-5 h-5 sm:w-7 sm:h-7" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Excluir</TooltipContent>
                    </Tooltip>
                  </div>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        /* ── LIST VIEW (default) ── */
        <motion.div variants={listVariants} initial="hidden" animate="show" className="space-y-2">
          {filteredIncomes.map((income) => {
            const statusColor =
              income.status === "PAID"
                ? "var(--success)"
                : income.status === "OVERDUE"
                ? "var(--destructive)"
                : "var(--warning)";
            return (
              <motion.div key={income.id} variants={listItemVariants}>
                <Card className="hover:shadow-sm transition-shadow">
                  <CardContent className="flex items-center gap-3">

                    {/* Category avatar */}
                    {(() => {
                      const CatIcon = CATEGORY_ICONS[income.category?.icon || ""] ?? CATEGORY_ICONS["circle"];
                      return (
                        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                             style={{ backgroundColor: `color-mix(in srgb, ${income.category?.color || "var(--success)"} 15%, transparent)` }}>
                          <CatIcon className="w-5 h-5" style={{ color: income.category?.color || "var(--success)" }} />
                        </div>
                      );
                    })()}

                    {/* Description + metadata */}
                    <div className="flex-1 min-w-0">
                      <StatusBadge status={income.status} type="income" />
                      <p className="text-sm font-semibold leading-tight truncate mt-0.5">{income.description}</p>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span className="text-xs text-muted-foreground">{formatDate(income.receiveDate)}</span>

                        {income.bankAccount && (
                          <>
                            <span className="text-muted-foreground/40 text-xs">·</span>
                            <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                              <Wallet className="w-3 h-3 shrink-0" />
                              {income.bankAccount.nickname}
                            </span>
                          </>
                        )}

                        {income.isRecurring && income.recurrenceFrequency && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold bg-muted text-muted-foreground rounded-full px-1.5 py-0.5 leading-none">
                            <RotateCcw className="w-2.5 h-2.5" />
                            {freqLabels[income.recurrenceFrequency]}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="shrink-0 min-w-[80px] sm:min-w-[120px] text-right">
                      <span className="text-sm sm:text-lg font-bold tabular-nums font-numbers text-success">
                        +{formatCurrency(parseFloat(income.amount))}
                      </span>
                    </div>

                    {/* Actions — fixed width */}
                    <div className="flex items-center justify-end gap-1 shrink-0 pl-2 sm:pl-3 border-l w-auto sm:w-[124px]">
                      <Tooltip>
                        <TooltipTrigger>
                          <Button variant="ghost" size="icon" className={cn("h-8 w-8 sm:h-9 sm:w-9 rounded-lg", income.status === "PAID" ? "text-warning hover:text-warning hover:bg-warning/10" : "text-success hover:text-success hover:bg-success/10")} onClick={() => income.status === "PAID" ? handleRevertReceive(income.id) : openConfirmReceive(income)}>
                            {income.status === "PAID" ? <RotateCcw className="w-5 h-5 sm:w-7 sm:h-7" /> : <CircleCheck className="w-5 h-5 sm:w-7 sm:h-7" />}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{income.status === "PAID" ? "Reverter recebimento" : "Confirmar recebimento"}</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger>
                          <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg hover:bg-muted" onClick={() => { setEditIncome(income); setDialogOpen(true); }}>
                            <Pencil className="w-5 h-5 sm:w-7 sm:h-7" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Editar</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger>
                          <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setDeleteId(income.id)}>
                            <Trash2 className="w-5 h-5 sm:w-7 sm:h-7" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Excluir</TooltipContent>
                      </Tooltip>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <DialogHeader>
              <DialogTitle>{editIncome ? "Editar Receita" : "Nova Receita"}</DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              <IncomeForm
                categories={categories}
                bankAccounts={bankAccounts}
                defaultValues={editIncome ? { ...editIncome, amount: parseFloat(editIncome.amount), receiveDate: new Date(editIncome.receiveDate), categoryId: editIncome.category?.id ?? "" } as any : undefined}
                onSuccess={() => { setDialogOpen(false); fetchData(); }}
              />
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover receita?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          {(() => {
            const del = deleteId ? incomes.find((i) => i.id === deleteId) : null;
            return del?.isRecurring ? (
              <div className="flex items-center justify-between py-3 px-1">
                <label htmlFor="delete-all-income" className="text-sm text-muted-foreground">
                  Remover <strong className="text-foreground">todas as ocorrências</strong>?
                </label>
                <Switch id="delete-all-income" checked={deleteAll} onCheckedChange={setDeleteAll} />
              </div>
            ) : null;
          })()}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white">
              {deleteAll ? "Remover todas" : "Remover esta"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <ConfirmReceiveDialog
        income={confirmReceiveIncome}
        bankAccounts={bankAccounts}
        open={confirmReceiveOpen}
        onOpenChange={setConfirmReceiveOpen}
        onConfirm={handleConfirmReceive}
      />
    </PageTransition>
  );
}

export default function ReceitasPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Carregando...</div>}>
      <ReceitasContent />
    </Suspense>
  );
}
