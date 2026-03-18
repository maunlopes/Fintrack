"use client";

import { useState, useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { MonthSelector } from "@/components/shared/month-selector";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, TrendingUp, Trash2, Pencil, Search, Tag, Wallet, RotateCcw } from "lucide-react";
type RecurrenceFrequency = "WEEKLY" | "BIWEEKLY" | "MONTHLY";
import { PageTransition } from "@/components/shared/page-transition";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { listVariants, listItemVariants } from "@/components/shared/animated-card";
import { MoneyValue } from "@/components/shared/money-value";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/shared/currency-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { incomeSchema, IncomeInput } from "@/lib/validations/income";
import { formatDate, formatCurrency } from "@/lib/format";

const freqLabels: Record<RecurrenceFrequency, string> = {
  WEEKLY: "Semanal",
  BIWEEKLY: "Quinzenal",
  MONTHLY: "Mensal",
};

interface Category { id: string; name: string; type: string; color?: string; }
interface BankAccount { id: string; nickname: string; }
interface Income {
  id: string;
  description: string;
  amount: string;
  receiveDate: string;
  status: "PENDING" | "PAID" | "OVERDUE";
  isRecurring: boolean;
  recurrenceFrequency: RecurrenceFrequency | null;
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
                  onChange={(e) => field.onChange(new Date(e.target.value))}
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

  async function handleDelete() {
    if (!deleteId) return;
    const res = await fetch(`/api/receitas/${deleteId}`, { method: "DELETE" });
    if (res.ok) { toast.success("Receita removida"); fetchData(); }
    setDeleteId(null);
  }

  const totalIncome = incomes.filter((i) => i.status === "PAID").reduce((s, i) => s + parseFloat(i.amount), 0);
  const totalPending = incomes.filter((i) => i.status !== "PAID").reduce((s, i) => s + parseFloat(i.amount), 0);

  const topIncomeCategory = (() => {
    const byCategory = incomes.reduce((acc, i) => {
      const key = i.category.id;
      if (!acc[key]) acc[key] = { ...i.category, total: 0 };
      acc[key].total += parseFloat(i.amount);
      return acc;
    }, {} as Record<string, { id: string; name: string; color?: string; total: number }>);
    return Object.values(byCategory).sort((a, b) => b.total - a.total)[0] ?? null;
  })();

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

  return (
    <PageTransition>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Receitas</h1>
          <p className="text-sm text-muted-foreground">Acompanhe suas entradas do mês.</p>
        </div>
        <motion.div whileTap={{ scale: 0.97 }}>
          <Button onClick={() => { setEditIncome(null); setDialogOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" /> Nova Receita
          </Button>
        </motion.div>

        <div className="flex-1 flex justify-end">
          <MonthSelector />
        </div>
      </div>

      {/* SUMMARY */}
      {!loading && incomes.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <Card className="p-6 border-success/30 bg-success/5 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between p-0 pb-3">
              <CardTitle className="text-success font-semibold">Recebido</CardTitle>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-success/10">
                <TrendingUp className="h-4 w-4 text-success" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <MoneyValue value={totalIncome} className="text-2xl font-bold" />
            </CardContent>
          </Card>

          <Card className="p-6 border-dashed border-success/40 bg-card shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between p-0 pb-3">
              <CardTitle className="text-muted-foreground font-semibold">A Receber</CardTitle>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-success/5">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <MoneyValue value={totalPending} className="text-2xl font-semibold" />
            </CardContent>
          </Card>

          {topIncomeCategory && (
            <Card className="p-6 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between p-0 pb-3">
                <CardTitle className="text-muted-foreground font-semibold">Maior Categoria</CardTitle>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent className="p-0 flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block w-3 h-3 rounded-full shadow-sm"
                    style={{ backgroundColor: topIncomeCategory.color || "#10B981" }}
                  />
                  <span className="font-semibold text-foreground truncate max-w-[120px]">{topIncomeCategory.name}</span>
                </div>
                <span className="text-lg font-bold text-success">{formatCurrency(topIncomeCategory.total)}</span>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* FILTERS + SEARCH */}
      <div className="mb-6 flex flex-col sm:flex-row gap-3 flex-wrap">
        <Tabs value={filter} onValueChange={(val) => setFilter(val as any)}>
          <TabsList className="grid w-full grid-cols-3 sm:w-[320px]">
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
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />)}
        </div>
      ) : filteredIncomes.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title="Nenhuma receita este mês"
          description="Cadastre suas receitas para acompanhar seus ganhos."
          actionLabel="Nova Receita"
          onAction={() => setDialogOpen(true)}
        />
      ) : (
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
                  <CardContent className="py-3 px-4 flex items-center gap-3">
                    {/* Status accent bar */}
                    <div
                      className="w-[3px] self-stretch rounded-full flex-shrink-0"
                      style={{ backgroundColor: statusColor }}
                    />

                    {/* Category avatar */}
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                      style={{ backgroundColor: income.category?.color || "#10B981" }}
                    >
                      {income.category?.name?.[0]?.toUpperCase() || "R"}
                    </div>

                    {/* Description + metadata */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold leading-tight truncate">{income.description}</p>
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

                    {/* Amount + status + actions */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right min-w-[96px]">
                        <p className="text-base font-bold tabular-nums money text-success">
                          +{formatCurrency(parseFloat(income.amount))}
                        </p>
                        <div className="mt-0.5 flex justify-end">
                          <StatusBadge status={income.status} type="income" />
                        </div>
                      </div>

                      <div className="flex items-center pl-2 border-l border-border/60">
                        <Button
                          variant="ghost"
                          className="flex flex-col items-center gap-0.5 h-auto px-2 py-1.5 min-w-[44px] rounded-lg text-muted-foreground hover:text-foreground"
                          onClick={() => { setEditIncome(income); setDialogOpen(true); }}
                        >
                          <Pencil className="w-4 h-4" />
                          <span className="text-[9px] font-semibold leading-none">Editar</span>
                        </Button>
                        <Button
                          variant="ghost"
                          className="flex flex-col items-center gap-0.5 h-auto px-2 py-1.5 min-w-[44px] rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setDeleteId(income.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="text-[9px] font-semibold leading-none">Excluir</span>
                        </Button>
                      </div>
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
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white">Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
