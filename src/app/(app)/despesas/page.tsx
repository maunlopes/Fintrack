"use client";

import { useState, useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { MonthSelector } from "@/components/shared/month-selector";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, TrendingDown, Trash2, Pencil, CircleCheck, Search, Tag, CreditCard, Wallet, X, RotateCcw, MoreHorizontal } from "lucide-react";
type ExpenseType = "FIXED_RECURRING" | "VARIABLE_RECURRING" | "ONE_TIME" | "INSTALLMENT";
import { PageTransition } from "@/components/shared/page-transition";
import { ConfirmPaymentDialog } from "@/components/despesas/confirm-payment-dialog";
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/shared/currency-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { expenseSchema, ExpenseInput } from "@/lib/validations/expense";
import { cardTransactionSchema, CardTransactionInput } from "@/lib/validations/credit-card";
import { formatDate, formatCurrency } from "@/lib/format";
import { cn, radialGradient } from "@/lib/utils";
import { CATEGORY_ICONS } from "@/lib/category-icons";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const typeLabels: Record<ExpenseType, string> = {
  FIXED_RECURRING: "Fixa Recorrente",
  VARIABLE_RECURRING: "Variável Recorrente",
  ONE_TIME: "Pontual",
  INSTALLMENT: "Parcelada",
};

interface Category { id: string; name: string; type: string; color?: string; icon?: string; }
interface BankAccount { id: string; nickname: string; name?: string; balance?: string; }
interface CardOption { id: string; name: string; brand: string; color: string; }

interface Expense {
  id: string;
  description: string;
  amount: string;
  dueDate: string;
  type: ExpenseType;
  status: "PENDING" | "PAID" | "OVERDUE";
  category: Category;
  bankAccount?: BankAccount | null;
  totalInstallments?: number | null;
  currentInstallment?: number | null;
  // Invoice-specific fields (from getInvoicesAsExpenses)
  cardId?: string;
  cardName?: string;
}

// ─── Account Expense Form ────────────────────────────────────────────────────

function AccountExpenseForm({
  onSuccess,
  categories,
  bankAccounts,
  defaultValues,
}: {
  onSuccess: () => void;
  categories: Category[];
  bankAccounts: BankAccount[];
  defaultValues?: Partial<ExpenseInput & { id: string }>;
}) {
  const form = useForm<ExpenseInput, any, ExpenseInput>({
    resolver: zodResolver(expenseSchema) as any,
    defaultValues: {
      description: defaultValues?.description ?? "",
      amount: defaultValues?.amount ?? 0,
      dueDate: defaultValues?.dueDate ? new Date(defaultValues.dueDate) : new Date(),
      categoryId: defaultValues?.categoryId ?? "",
      type: defaultValues?.type ?? "ONE_TIME",
      isRecurring: defaultValues?.isRecurring ?? false,
      bankAccountId: defaultValues?.bankAccountId ?? "",
      notes: defaultValues?.notes ?? "",
    },
  });

  const type = form.watch("type");

  async function onSubmit(data: ExpenseInput) {
    // Auto-set isRecurring for recurring types
    if (data.type === "FIXED_RECURRING" || data.type === "VARIABLE_RECURRING") {
      data.isRecurring = true;
    }

    const url = defaultValues?.id ? `/api/despesas/${defaultValues.id}` : "/api/despesas";
    const method = defaultValues?.id ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) { toast.error("Erro ao salvar despesa"); return; }
    toast.success(defaultValues?.id ? "Despesa atualizada!" : "Despesa cadastrada!");
    onSuccess();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem>
            <FormLabel>Descrição</FormLabel>
            <FormControl><Input placeholder="Nome da despesa" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="amount" render={({ field }) => (
            <FormItem>
              <FormLabel>Valor</FormLabel>
              <FormControl>
                <CurrencyInput value={field.value} onChange={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="dueDate" render={({ field }) => (
            <FormItem>
              <FormLabel>Vencimento</FormLabel>
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
                  {categories.filter((c) => c.type === "EXPENSE").map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="type" render={({ field }) => (
          <FormItem>
            <FormLabel>Tipo</FormLabel>
            <FormControl>
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger><SelectValue>{field.value ? typeLabels[field.value as ExpenseType] : "Selecione..."}</SelectValue></SelectTrigger>
                <SelectContent>
                  {Object.entries(typeLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        {type === "INSTALLMENT" && (
          <FormField control={form.control} name="totalInstallments" render={({ field }) => (
            <FormItem>
              <FormLabel>Nº de parcelas</FormLabel>
              <FormControl><Input type="number" min={2} max={60} {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        )}
        {(type === "FIXED_RECURRING" || type === "VARIABLE_RECURRING") && (
          <FormField control={form.control} name="recurrenceEnd" render={({ field }) => (
            <FormItem>
              <FormLabel>Fim da recorrência (opcional)</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  value={field.value instanceof Date ? field.value.toISOString().split("T")[0] : field.value || ""}
                  onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
        )}
        {bankAccounts.length > 0 && (
          <FormField control={form.control} name="bankAccountId" render={({ field }) => (
            <FormItem>
              <FormLabel>Conta de débito (opcional)</FormLabel>
              <FormControl>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <SelectTrigger><SelectValue>{bankAccounts.find((a) => a.id === field.value)?.nickname || "Selecione..."}</SelectValue></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhuma</SelectItem>
                    {bankAccounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.nickname}</SelectItem>
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

// ─── Card Transaction Form ───────────────────────────────────────────────────

function CardTransactionForm({
  onSuccess,
  categories,
  cards,
}: {
  onSuccess: () => void;
  categories: Category[];
  cards: CardOption[];
}) {
  const [selectedCardId, setSelectedCardId] = useState(cards[0]?.id ?? "");
  const form = useForm<CardTransactionInput, any, CardTransactionInput>({
    resolver: zodResolver(cardTransactionSchema) as any,
    defaultValues: {
      description: "",
      totalAmount: 0,
      purchaseDate: new Date(),
      categoryId: "",
      isInstallment: false,
      isRecurring: false,
      notes: "",
    },
  });

  const isInstallment = form.watch("isInstallment");

  async function onSubmit(data: CardTransactionInput) {
    if (!selectedCardId) { toast.error("Selecione um cartão"); return; }
    const res = await fetch(`/api/cartoes/${selectedCardId}/transacoes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) { toast.error("Erro ao lançar transação"); return; }
    toast.success("Compra no cartão lançada!");
    onSuccess();
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {/* Card selector */}
      <div className="space-y-1.5">
        <p className="text-sm font-medium">Cartão</p>
        {cards.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum cartão cadastrado.</p>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {cards.map((card) => (
              <Button
                key={card.id}
                type="button"
                variant="outline"
                onClick={() => setSelectedCardId(card.id)}
                className={`w-full justify-start gap-3 h-auto px-4 py-2.5 ${
                  selectedCardId === card.id ? "border-primary bg-primary/5" : ""
                }`}
              >
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: card.color }} />
                <span className="text-sm font-medium">{card.name}</span>
                <span className="text-xs text-muted-foreground ml-auto">{card.brand}</span>
              </Button>
            ))}
          </div>
        )}
      </div>

      <Form {...form}>
        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem>
            <FormLabel>Descrição</FormLabel>
            <FormControl><Input placeholder="Nome da compra" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="totalAmount" render={({ field }) => (
            <FormItem>
              <FormLabel>Valor total (R$)</FormLabel>
              <FormControl><Input type="number" step="0.01" min="0" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="purchaseDate" render={({ field }) => (
            <FormItem>
              <FormLabel>Data da compra</FormLabel>
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
                  {categories.filter((c) => c.type === "EXPENSE").map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="isInstallment" render={({ field }) => (
          <FormItem className="flex items-center gap-3">
            <FormLabel className="mt-0">Parcelado?</FormLabel>
            <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
          </FormItem>
        )} />
        {isInstallment && (
          <FormField control={form.control} name="totalInstallments" render={({ field }) => (
            <FormItem>
              <FormLabel>Nº de parcelas</FormLabel>
              <FormControl><Input type="number" min={2} max={48} {...field} /></FormControl>
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
          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting || !selectedCardId}>
            {form.formState.isSubmitting ? "Lançando..." : "Lançar no cartão"}
          </Button>
        </motion.div>
      </Form>
    </form>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

function DespesasContent() {
  const searchParams = useSearchParams();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [cards, setCards] = useState<CardOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newExpenseMode, setNewExpenseMode] = useState<"conta" | "cartao">("conta");
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [confirmPayExpense, setConfirmPayExpense] = useState<Expense | null>(null);
  const [filter, setFilter] = useState<"ALL" | "PAID" | "PENDING">("ALL");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [sourceFilter, setSourceFilter] = useState("ALL"); // "ALL" | "account:{id}" | "card:{id}"

  async function fetchData() {
    try {
      const params = new URLSearchParams(searchParams.toString());
      if (!params.has("month")) params.set("month", (new Date().getMonth() + 1).toString());
      if (!params.has("year")) params.set("year", new Date().getFullYear().toString());

      const [expRes, catRes, accRes, cardRes] = await Promise.all([
        fetch(`/api/despesas?${params.toString()}`),
        fetch("/api/categorias"),
        fetch("/api/contas"),
        fetch("/api/cartoes"),
      ]);
      const expData = expRes.ok ? await expRes.json() : [];
      const catData = catRes.ok ? await catRes.json() : [];
      const accData = accRes.ok ? await accRes.json() : [];
      const cardData = cardRes.ok ? await cardRes.json() : [];
      setExpenses(expData);
      setCategories(catData);
      setBankAccounts(accData);
      setCards(cardData.map((c: any) => ({ id: c.id, name: c.name, brand: c.brand, color: c.color })));
    } catch {
      setExpenses([]);
      setCategories([]);
      setBankAccounts([]);
      setCards([]);
    }
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, [searchParams]);

  // Auto-open dialog when navigated with ?new=true (e.g. from QuickAddFAB)
  useEffect(() => {
    if (searchParams.get("new") === "true") {
      setEditExpense(null);
      setNewExpenseMode("conta");
      setDialogOpen(true);
    }
  }, []);

  const [restoreBalance, setRestoreBalance] = useState(true);
  const [revertId, setRevertId] = useState<string | null>(null);

  const deleteExpense = deleteId ? expenses.find((e) => e.id === deleteId) : null;
  const deleteIsPaid = deleteExpense?.status === "PAID" && !!deleteExpense?.bankAccount;

  async function handleDelete() {
    if (!deleteId) return;
    const query = deleteIsPaid && restoreBalance ? "?restoreBalance=true" : "";
    const res = await fetch(`/api/despesas/${deleteId}${query}`, { method: "DELETE" });
    if (res.ok) {
      toast.success(deleteIsPaid && restoreBalance ? "Despesa removida e saldo restaurado" : "Despesa removida");
      fetchData();
    } else toast.error("Erro ao remover despesa");
    setDeleteId(null);
    setRestoreBalance(true);
  }

  function handlePay(id: string) {
    const expense = expenses.find((e) => e.id === id);
    if (!expense) return;
    if (expense.status === "PAID") {
      setRevertId(id);
    } else {
      setConfirmPayExpense(expense);
    }
  }

  async function handleRevertPay() {
    if (!revertId) return;
    const res = await fetch(`/api/despesas/${revertId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "PENDING" }),
    });
    if (res.ok) { toast.success("Pagamento revertido e saldo restaurado"); fetchData(); }
    else toast.error("Erro ao reverter pagamento");
    setRevertId(null);
  }

  const [invoicePayExpense, setInvoicePayExpense] = useState<Expense | null>(null);
  const [invoicePayAccount, setInvoicePayAccount] = useState("");

  function handlePayInvoice(expense: Expense) {
    setInvoicePayExpense(expense);
    setInvoicePayAccount(bankAccounts[0]?.id || "");
  }

  function handleRevertInvoice(expense: Expense) {
    if (!expense.cardId) return;
    const dueDate = new Date(expense.dueDate);
    const month = dueDate.getMonth() + 1;
    const year = dueDate.getFullYear();
    fetch(`/api/cartoes/${expense.cardId}/faturas/pagar?month=${month}&year=${year}`, { method: "DELETE" })
      .then((res) => {
        if (res.ok) { toast.success("Pagamento da fatura revertido"); fetchData(); }
        else res.json().then((e) => toast.error(e.error || "Erro ao reverter"));
      });
  }

  async function confirmPayInvoice() {
    if (!invoicePayExpense?.cardId || !invoicePayAccount) return;
    const dueDate = new Date(invoicePayExpense.dueDate);
    const res = await fetch(`/api/cartoes/${invoicePayExpense.cardId}/faturas/pagar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        month: dueDate.getMonth() + 1,
        year: dueDate.getFullYear(),
        bankAccountId: invoicePayAccount,
      }),
    });
    if (res.ok) { toast.success("Fatura paga!"); fetchData(); }
    else { const e = await res.json(); toast.error(e.error || "Erro ao pagar fatura"); }
    setInvoicePayExpense(null);
  }

  async function confirmPay(id: string, paidAt: string) {
    const res = await fetch(`/api/despesas/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "PAID", paidAt }),
    });
    if (res.ok) { toast.success("Despesa marcada como paga!"); fetchData(); }
    else toast.error("Erro ao atualizar status");
  }

  const totalPaid = expenses.filter((e) => e.status === "PAID").reduce((s, e) => s + parseFloat(e.amount), 0);
  const totalPending = expenses.filter((e) => e.status !== "PAID").reduce((s, e) => s + parseFloat(e.amount), 0);

  const topExpenseCategory = (() => {
    const byCategory = expenses.reduce((acc, e) => {
      const key = e.category.id;
      if (!acc[key]) acc[key] = { ...e.category, total: 0 };
      acc[key].total += parseFloat(e.amount);
      return acc;
    }, {} as Record<string, { id: string; name: string; color?: string; icon?: string; total: number }>);
    return Object.values(byCategory).sort((a, b) => b.total - a.total)[0] ?? null;
  })();

  const topExpense = expenses.length > 0
    ? expenses.reduce((prev, curr) => parseFloat(curr.amount) > parseFloat(prev.amount) ? curr : prev)
    : null;

  const uniqueCategories = Array.from(
    new Map(expenses.map((e) => [e.category.id, e.category])).values()
  ).sort((a, b) => a.name.localeCompare(b.name));

  const filteredExpenses = expenses.filter((e) => {
    const statusOk = filter === "ALL" ? true : filter === "PAID" ? e.status === "PAID" : e.status !== "PAID";
    const searchOk = !search || e.description.toLowerCase().includes(search.toLowerCase());
    const categoryOk = categoryFilter === "ALL" || e.category.id === categoryFilter;
    const sourceOk = (() => {
      if (sourceFilter === "ALL") return true;
      if (sourceFilter.startsWith("account:")) {
        const accId = sourceFilter.replace("account:", "");
        return e.bankAccount?.id === accId;
      }
      if (sourceFilter.startsWith("card:")) {
        const cardId = sourceFilter.replace("card:", "");
        return e.cardId === cardId;
      }
      return true;
    })();
    return statusOk && searchOk && categoryOk && sourceOk;
  });

  const { mode: viewMode, setMode: setViewMode } = useViewMode("despesas");

  const activeFiltersCount = [
    filter !== "ALL",
    categoryFilter !== "ALL",
    sourceFilter !== "ALL",
    search !== "",
  ].filter(Boolean).length;

  function clearFilters() {
    setFilter("ALL");
    setCategoryFilter("ALL");
    setSourceFilter("ALL");
    setSearch("");
  }

  const isInvoiceExpense = (e: Expense) => !!e.cardId;

  return (
    <PageTransition>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Despesas</h1>
          <p className="text-sm text-muted-foreground">Controle seus gastos do mês.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <ViewToggle mode={viewMode} onChange={setViewMode} />
          <motion.div whileTap={{ scale: 0.97 }}>
            <Button onClick={() => { setEditExpense(null); setNewExpenseMode("conta"); setDialogOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" /> Nova Despesa
            </Button>
          </motion.div>
          <div className="flex-1 flex justify-end">
            <MonthSelector />
          </div>
        </div>
      </div>

      {/* SUMMARY */}
      {!loading && expenses.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {/* Pago + A pagar */}
          <Card className="border-l-4 border-l-primary">
            <CardHeader>
              <CardDescription>Total do mês</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums font-numbers">
                {formatCurrency(totalPaid + totalPending)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Pago</span>
                <span className="font-semibold text-success">{formatCurrency(totalPaid)}</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-success transition-all duration-700"
                  style={{ width: `${(totalPaid + totalPending) > 0 ? (totalPaid / (totalPaid + totalPending)) * 100 : 0}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">A pagar / atrasado</span>
                <span className="font-semibold text-destructive">{formatCurrency(totalPending)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Maior categoria + Maior gasto empilhados */}
          <div className="flex flex-col gap-3">
            {topExpenseCategory && (() => {
              const CatIcon = CATEGORY_ICONS[topExpenseCategory.icon || ""] ?? CATEGORY_ICONS["circle"];
              const catColor = topExpenseCategory.color || "var(--destructive)";
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
                        {formatCurrency(topExpenseCategory.total)}
                      </CardTitle>
                      <span className="text-sm text-muted-foreground truncate">{topExpenseCategory.name}</span>
                    </div>
                  </CardHeader>
                </Card>
              );
            })()}

            {topExpense && (
              <Card className="border-l-4 border-l-destructive flex-1" style={radialGradient("destructive")}>
                <CardHeader>
                  <CardDescription>Maior gasto</CardDescription>
                  <div className="flex items-baseline gap-2">
                    <CardTitle className="text-2xl font-semibold tabular-nums font-numbers text-destructive">
                      {formatCurrency(parseFloat(topExpense.amount))}
                    </CardTitle>
                    <span className="text-sm text-muted-foreground truncate">{topExpense.description}</span>
                  </div>
                </CardHeader>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* FILTERS */}
      <div className="mb-4 flex flex-col sm:flex-row gap-3 flex-wrap">
        <Tabs value={filter} onValueChange={(val) => setFilter(val as any)}>
          <TabsList>
            <TabsTrigger value="ALL">Tudo</TabsTrigger>
            <TabsTrigger value="PAID">Pago</TabsTrigger>
            <TabsTrigger value="PENDING">A Pagar</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Category filter */}
        <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v ?? "ALL")}>
          <SelectTrigger className="w-full sm:w-[190px]">
            <SelectValue>
              {categoryFilter === "ALL" ? "Todas as categorias" : (
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: uniqueCategories.find((c) => c.id === categoryFilter)?.color }} />
                  {uniqueCategories.find((c) => c.id === categoryFilter)?.name}
                </span>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todas as categorias</SelectItem>
            {uniqueCategories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                  {c.name}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Source filter: accounts + cards */}
        <Select value={sourceFilter} onValueChange={(v) => setSourceFilter(v ?? "ALL")}>
          <SelectTrigger className="w-full sm:w-[190px]">
            <SelectValue>
              {sourceFilter === "ALL" ? (
                <span className="flex items-center gap-1.5"><Wallet className="w-3.5 h-3.5" /> Todas as origens</span>
              ) : sourceFilter.startsWith("account:") ? (
                <span className="flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5" />
                  {bankAccounts.find((a) => `account:${a.id}` === sourceFilter)?.nickname}
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5" />
                  {cards.find((c) => `card:${c.id}` === sourceFilter)?.name}
                </span>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">
              <span className="flex items-center gap-1.5"><Wallet className="w-3.5 h-3.5" /> Todas as origens</span>
            </SelectItem>
            {bankAccounts.length > 0 && (
              <>
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Contas</div>
                {bankAccounts.map((acc) => (
                  <SelectItem key={acc.id} value={`account:${acc.id}`}>
                    <span className="flex items-center gap-1.5"><Wallet className="w-3.5 h-3.5" /> {acc.nickname}</span>
                  </SelectItem>
                ))}
              </>
            )}
            {cards.length > 0 && (
              <>
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Cartões</div>
                {cards.map((card) => (
                  <SelectItem key={card.id} value={`card:${card.id}`}>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: card.color }} />
                      {card.name}
                    </span>
                  </SelectItem>
                ))}
              </>
            )}
          </SelectContent>
        </Select>

        {/* Search */}
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar despesa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Clear filters */}
        {activeFiltersCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground hover:text-foreground h-10">
            <X className="w-3.5 h-3.5 mr-1" /> Limpar filtros
            <Badge variant="secondary" className="ml-1.5 text-xs px-1.5">{activeFiltersCount}</Badge>
          </Button>
        )}
      </div>

      {/* LIST */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />)}
        </div>
      ) : filteredExpenses.length === 0 ? (
        <EmptyState
          illustration="transactions"
          title="Nenhuma despesa encontrada"
          description={activeFiltersCount > 0 ? "Tente limpar os filtros." : "Cadastre suas despesas para acompanhar seus gastos."}
          actionLabel="Nova Despesa"
          onAction={() => setDialogOpen(true)}
        />
      ) : viewMode === "grid" ? (
        /* ── CARD / GRID VIEW ── */
        <motion.div variants={listVariants} initial="hidden" animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredExpenses.map((expense) => {
            const isInvoice = isInvoiceExpense(expense);
            return (
              <motion.div key={expense.id} variants={listItemVariants}>
                <Card className="hover:shadow-sm transition-shadow h-full">
                  <CardHeader className="flex flex-row items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {(() => {
                        const CatIcon = CATEGORY_ICONS[expense.category?.icon || ""] ?? CATEGORY_ICONS["circle"];
                        return (
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                               style={{ backgroundColor: `color-mix(in srgb, ${expense.category?.color || "var(--muted-foreground)"} 15%, transparent)` }}>
                            <CatIcon className="w-4 h-4" style={{ color: expense.category?.color || "var(--muted-foreground)" }} />
                          </div>
                        );
                      })()}
                      <span className="text-xs text-muted-foreground truncate">{expense.category?.name || "Sem categoria"}</span>
                    </div>
                    <StatusBadge status={expense.status} />
                  </CardHeader>
                  <CardContent className="flex flex-col gap-2 flex-1">
                    <p className="text-sm font-semibold leading-tight">{expense.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(expense.dueDate)}
                      {isInvoice ? ` · ${expense.cardName}` : expense.bankAccount ? ` · ${expense.bankAccount.nickname}` : ""}
                    </p>
                    <p className="text-lg font-bold tabular-nums font-numbers mt-1">{formatCurrency(parseFloat(expense.amount))}</p>
                  </CardContent>
                  <CardFooter className="flex items-center justify-end border-t pt-4">
                    <div className="flex items-center gap-1">
                      <Tooltip>
                        <TooltipTrigger>
                          <Button variant="ghost" size="icon" className={cn("h-9 w-9 rounded-lg", expense.status === "PAID" ? "text-warning hover:text-warning hover:bg-warning/10" : "text-success hover:text-success hover:bg-success/10")} onClick={() => isInvoice ? (expense.status === "PAID" ? handleRevertInvoice(expense) : handlePayInvoice(expense)) : handlePay(expense.id)}>
                            {expense.status === "PAID" ? <RotateCcw className="w-7 h-7" /> : <CircleCheck className="w-7 h-7" />}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{expense.status === "PAID" ? "Reverter pagamento" : "Marcar como pago"}</TooltipContent>
                      </Tooltip>
                      {!isInvoice ? (
                        <>
                          <Tooltip>
                            <TooltipTrigger>
                              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-muted" onClick={() => { setEditExpense(expense); setDialogOpen(true); }}>
                                <Pencil className="w-7 h-7" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Editar</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger>
                              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setDeleteId(expense.id)}>
                                <Trash2 className="w-7 h-7" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Excluir</TooltipContent>
                          </Tooltip>
                        </>
                      ) : (
                        <>
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-muted-foreground/30 pointer-events-none" disabled>
                            <Pencil className="w-7 h-7" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-muted-foreground/30 pointer-events-none" disabled>
                            <Trash2 className="w-7 h-7" />
                          </Button>
                        </>
                      )}
                    </div>
                  </CardFooter>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      ) : (
        /* ── LIST VIEW (default) ── */
        <motion.div variants={listVariants} initial="hidden" animate="show" className="space-y-2">
          {filteredExpenses.map((expense) => {
            const isInvoice = isInvoiceExpense(expense);
            const statusColor =
              expense.status === "PAID"
                ? "var(--success)"
                : expense.status === "OVERDUE"
                ? "var(--destructive)"
                : "var(--warning)";
            return (
              <motion.div key={expense.id} variants={listItemVariants}>
                <Card className="hover:shadow-sm transition-shadow">
                  <CardContent className="flex items-center gap-3">

                    {/* Category avatar */}
                    {(() => {
                      const CatIcon = CATEGORY_ICONS[expense.category?.icon || ""] ?? CATEGORY_ICONS["circle"];
                      return (
                        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                             style={{ backgroundColor: `color-mix(in srgb, ${expense.category?.color || "var(--muted-foreground)"} 15%, transparent)` }}>
                          <CatIcon className="w-5 h-5" style={{ color: expense.category?.color || "var(--muted-foreground)" }} />
                        </div>
                      );
                    })()}

                    {/* Description + metadata */}
                    <div className="flex-1 min-w-0">
                      <StatusBadge status={expense.status} />
                      <p className="text-sm font-semibold leading-tight truncate mt-0.5">{expense.description}</p>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span className="text-xs text-muted-foreground">{formatDate(expense.dueDate)}</span>

                        {isInvoice ? (
                          <>
                            <span className="text-muted-foreground/40 text-xs">·</span>
                            <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                              <CreditCard className="w-3 h-3 shrink-0" />
                              {expense.cardName}
                            </span>
                          </>
                        ) : expense.bankAccount ? (
                          <>
                            <span className="text-muted-foreground/40 text-xs">·</span>
                            <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                              <Wallet className="w-3 h-3 shrink-0" />
                              {expense.bankAccount.nickname}
                            </span>
                          </>
                        ) : null}

                        {!isInvoice && expense.currentInstallment && expense.totalInstallments ? (
                          <span className="inline-flex items-center text-[10px] font-semibold bg-primary/10 text-primary rounded-full px-1.5 py-0.5 leading-none">
                            {expense.currentInstallment}/{expense.totalInstallments}x
                          </span>
                        ) : !isInvoice && (expense.type === "FIXED_RECURRING" || expense.type === "VARIABLE_RECURRING") ? (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold bg-muted text-muted-foreground rounded-full px-1.5 py-0.5 leading-none">
                            <RotateCcw className="w-2.5 h-2.5" />
                            {expense.type === "FIXED_RECURRING" ? "Fixa" : "Variável"}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="shrink-0 min-w-[120px] text-right">
                      <span className="text-lg font-bold tabular-nums font-numbers">
                        {formatCurrency(parseFloat(expense.amount))}
                      </span>
                    </div>

                    {/* Actions — fixed width */}
                    <div className="flex items-center justify-end gap-1 shrink-0 pl-3 border-l w-[124px]">
                      <Tooltip>
                        <TooltipTrigger>
                          <Button variant="ghost" size="icon" className={cn("h-9 w-9 rounded-lg", expense.status === "PAID" ? "text-warning hover:text-warning hover:bg-warning/10" : "text-success hover:text-success hover:bg-success/10")} onClick={() => isInvoice ? (expense.status === "PAID" ? handleRevertInvoice(expense) : handlePayInvoice(expense)) : handlePay(expense.id)}>
                            {expense.status === "PAID" ? <RotateCcw className="w-7 h-7" /> : <CircleCheck className="w-7 h-7" />}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{expense.status === "PAID" ? "Reverter pagamento" : "Marcar como pago"}</TooltipContent>
                      </Tooltip>
                      {!isInvoice ? (
                        <>
                          <Tooltip>
                            <TooltipTrigger>
                              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-muted" onClick={() => { setEditExpense(expense); setDialogOpen(true); }}>
                                <Pencil className="w-7 h-7" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Editar</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger>
                              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setDeleteId(expense.id)}>
                                <Trash2 className="w-7 h-7" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Excluir</TooltipContent>
                          </Tooltip>
                        </>
                      ) : (
                        <>
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-muted-foreground/30 pointer-events-none" disabled>
                            <Pencil className="w-7 h-7" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-muted-foreground/30 pointer-events-none" disabled>
                            <Trash2 className="w-7 h-7" />
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* NEW / EDIT DIALOG */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <DialogHeader>
              <DialogTitle>{editExpense ? "Editar Despesa" : "Nova Despesa"}</DialogTitle>
            </DialogHeader>

            {/* Mode toggle — only for new expense */}
            {!editExpense && (
              <div className="mt-4 mb-2">
                <Tabs value={newExpenseMode} onValueChange={(v) => setNewExpenseMode(v as any)}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="conta">
                      <Wallet className="w-3.5 h-3.5 mr-1.5" /> Via Conta
                    </TabsTrigger>
                    <TabsTrigger value="cartao">
                      <CreditCard className="w-3.5 h-3.5 mr-1.5" /> Via Cartão
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            )}

            <div className="mt-2">
              {editExpense || newExpenseMode === "conta" ? (
                <AccountExpenseForm
                  categories={categories}
                  bankAccounts={bankAccounts}
                  defaultValues={editExpense
                    ? { ...editExpense, amount: parseFloat(editExpense.amount), dueDate: new Date(editExpense.dueDate), categoryId: editExpense.category?.id ?? "" } as any
                    : undefined}
                  onSuccess={() => { setDialogOpen(false); fetchData(); }}
                />
              ) : (
                <CardTransactionForm
                  categories={categories}
                  cards={cards}
                  onSuccess={() => { setDialogOpen(false); fetchData(); }}
                />
              )}
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => { if (!o) { setDeleteId(null); setRestoreBalance(true); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover despesa?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita. Parcelas futuras também serão removidas.</AlertDialogDescription>
          </AlertDialogHeader>
          {deleteIsPaid && (
            <div className="flex items-center justify-between py-3 px-1">
              <label htmlFor="restore-balance" className="text-sm text-muted-foreground">
                Restaurar {formatCurrency(parseFloat(deleteExpense!.amount))} ao saldo de <strong className="text-foreground">{deleteExpense!.bankAccount!.nickname}</strong>?
              </label>
              <Switch id="restore-balance" checked={restoreBalance} onCheckedChange={setRestoreBalance} />
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white">Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Revert payment dialog */}
      <AlertDialog open={!!revertId} onOpenChange={(o) => !o && setRevertId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reverter pagamento?</AlertDialogTitle>
            <AlertDialogDescription>
              A despesa voltará ao status pendente{(() => {
                const exp = revertId ? expenses.find((e) => e.id === revertId) : null;
                return exp?.bankAccount ? ` e o saldo de ${formatCurrency(parseFloat(exp.amount))} será restaurado à conta ${exp.bankAccount.nickname}.` : ".";
              })()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRevertPay}>Reverter</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Invoice payment dialog */}
      <AlertDialog open={!!invoicePayExpense} onOpenChange={(o) => !o && setInvoicePayExpense(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Pagar fatura</AlertDialogTitle>
            <AlertDialogDescription>
              {invoicePayExpense && `Fatura de ${invoicePayExpense.cardName} — ${formatCurrency(parseFloat(invoicePayExpense.amount))}`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <label className="text-sm font-medium mb-2 block">Conta para débito</label>
            <Select onValueChange={setInvoicePayAccount} value={invoicePayAccount}>
              <SelectTrigger><SelectValue>{bankAccounts.find((a) => a.id === invoicePayAccount)?.nickname || "Selecione..."}</SelectValue></SelectTrigger>
              <SelectContent>
                {bankAccounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.nickname}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmPayInvoice} disabled={!invoicePayAccount}>Pagar fatura</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ConfirmPaymentDialog
        expense={confirmPayExpense}
        open={!!confirmPayExpense}
        onOpenChange={(o) => !o && setConfirmPayExpense(null)}
        onConfirm={confirmPay}
      />
    </PageTransition>
  );
}

export default function DespesasPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Carregando...</div>}>
      <DespesasContent />
    </Suspense>
  );
}
