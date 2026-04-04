"use client";

import { useState, useEffect, use } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { format, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, CreditCard, ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { PageTransition } from "@/components/shared/page-transition";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { EmptyState } from "@/components/shared/empty-state";
import { AnimatedCard, listVariants, listItemVariants } from "@/components/shared/animated-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CATEGORY_ICONS } from "@/lib/category-icons";
import { radialGradient } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cardTransactionSchema, CardTransactionInput } from "@/lib/validations/credit-card";
import { formatCurrency, formatDate } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { getCardBrandIcon, getBankIcon } from "@/components/ui/brand-icons";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface Category { id: string; name: string; icon: string; color: string; }

interface CardDetail {
  id: string;
  name: string;
  brand: string;
  creditLimit: string;
  closingDay: number;
  dueDay: number;
  color: string;
  bankAccount?: { id: string; nickname: string; name?: string } | null;
  transactions: unknown[];
}

interface InvoiceTx {
  id: string;
  description: string;
  amount: number;
  purchaseDate: string;
  isInstallment: boolean;
  currentInstallment: number | null;
  totalInstallments: number | null;
  category: { id: string; name: string; color: string; icon?: string };
}

interface InvoicePaymentInfo {
  paidAt: string;
  amount: number;
  bankAccount: { id: string; nickname: string };
}

interface Invoice {
  invoiceKey: string;
  month: number;
  year: number;
  dueDate: string;
  totalAmount: number;
  status: "PENDING" | "PAID" | "OVERDUE";
  payment: InvoicePaymentInfo | null;
  transactions: InvoiceTx[];
}

interface BankAccountOption {
  id: string;
  nickname: string;
  name: string;
  balance: string;
}

function getLimitColor(pct: number) {
  if (pct < 50) return "var(--success)";
  if (pct < 80) return "var(--warning)";
  if (pct < 95) return "var(--warning)";
  return "var(--destructive)";
}

function TransactionForm({ cardId, categories, onSuccess }: {
  cardId: string;
  categories: Category[];
  onSuccess: () => void;
}) {
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
    const res = await fetch(`/api/cartoes/${cardId}/transacoes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) { toast.error("Erro ao lançar transação"); return; }
    toast.success("Transação lançada!");
    onSuccess();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem>
            <FormLabel>Descrição</FormLabel>
            <FormControl><Input placeholder="Nome da compra" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
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
                {...field}
                value={field.value instanceof Date
                  ? field.value.toISOString().split("T")[0]
                  : String(field.value)}
                onChange={(e) => field.onChange(new Date(e.target.value))}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="categoryId" render={({ field }) => (
          <FormItem>
            <FormLabel>Categoria</FormLabel>
            <FormControl>
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger><SelectValue>{categories.find((c) => c.id === field.value)?.name || "Selecione..."}</SelectValue></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
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
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
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
          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Lançando..." : "Lançar transação"}
          </Button>
        </motion.div>
      </form>
    </Form>
  );
}

function fmt(month: number, year: number) {
  const d = new Date(year, month - 1, 1);
  const s = format(d, "MMMM yyyy", { locale: ptBR });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function FaturasView({ invoices, limit, totalCommitted, navDate, onNav, today, cardId, closingDay, dueDay, cardColor, cardBankName, onRefresh, onNewTransaction }: {
  invoices: Invoice[];
  limit: number;
  totalCommitted: number;
  navDate: Date;
  onNav: (d: Date) => void;
  today: Date;
  cardId: string;
  closingDay: number;
  dueDay: number;
  cardColor: string;
  cardBankName: string;
  onRefresh: () => void;
  onNewTransaction: () => void;
}) {
  const [txSearch, setTxSearch] = useState("");
  const [txCategoryFilter, setTxCategoryFilter] = useState("ALL");

  // On first render: jump to nearest invoice month
  useEffect(() => {
    if (invoices.length === 0) return;
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
    const sorted = [...invoices].sort((a, b) => {
      const ka = `${a.year}-${String(a.month).padStart(2, "0")}`;
      const kb = `${b.year}-${String(b.month).padStart(2, "0")}`;
      return ka.localeCompare(kb);
    });
    const upcoming = sorted.find((inv) => `${inv.year}-${String(inv.month).padStart(2, "0")}` >= todayKey);
    const target = upcoming ?? sorted[sorted.length - 1];
    onNav(new Date(target.year, target.month - 1, 1));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoices.length > 0 ? invoices[0].invoiceKey : null]);

  const navMonth = navDate.getMonth() + 1;
  const navYear = navDate.getFullYear();
  const invoice = invoices.find((inv) => inv.month === navMonth && inv.year === navYear) ?? null;

  const invoiceKeys = new Set(invoices.map((inv) => `${inv.year}-${String(inv.month).padStart(2, "0")}`));
  const prevKey = `${subMonths(navDate, 1).getFullYear()}-${String(subMonths(navDate, 1).getMonth() + 1).padStart(2, "0")}`;
  const nextKey = `${addMonths(navDate, 1).getFullYear()}-${String(addMonths(navDate, 1).getMonth() + 1).padStart(2, "0")}`;
  const currentKey = `${navYear}-${String(navMonth).padStart(2, "0")}`;

  const isCurrentMonth = navDate.getMonth() === today.getMonth() && navDate.getFullYear() === today.getFullYear();
  const now = new Date(today.getFullYear(), today.getMonth(), 1);
  const isPast = navDate < now;

  const status = invoice?.status ?? null;
  const isOverdue = status === "OVERDUE";
  const isPaid = status === "PAID";

  // Limit calculations
  const pct = invoice && limit > 0 ? Math.round((invoice.totalAmount / limit) * 100) : 0;
  const available = Math.max(0, limit - totalCommitted);
  const barColor = getLimitColor(pct);

  // Payment dialog state
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [bankAccounts, setBankAccounts] = useState<BankAccountOption[]>([]);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [paying, setPaying] = useState(false);
  const [undoing, setUndoing] = useState(false);

  async function openPayDialog() {
    const res = await fetch("/api/contas");
    if (res.ok) setBankAccounts(await res.json());
    setSelectedAccount("");
    setPayDialogOpen(true);
  }

  async function handlePay() {
    if (!selectedAccount || !invoice) return;
    setPaying(true);
    const res = await fetch(`/api/cartoes/${cardId}/faturas/pagar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ month: invoice.month, year: invoice.year, bankAccountId: selectedAccount }),
    });
    setPaying(false);
    if (!res.ok) {
      const err = await res.json();
      toast.error(err.error || "Erro ao pagar fatura");
      return;
    }
    toast.success("Fatura paga com sucesso!");
    setPayDialogOpen(false);
    onRefresh();
  }

  async function handleUndoPay() {
    if (!invoice) return;
    setUndoing(true);
    const res = await fetch(
      `/api/cartoes/${cardId}/faturas/pagar?month=${invoice.month}&year=${invoice.year}`,
      { method: "DELETE" }
    );
    setUndoing(false);
    if (!res.ok) { toast.error("Erro ao desfazer pagamento"); return; }
    toast.success("Pagamento desfeito");
    onRefresh();
  }

  return (
    <div className="space-y-4">
      {/* ── Invoice content ── */}
      <AnimatePresence mode="wait">
        {invoice ? (
          <motion.div
            key={invoice.invoiceKey}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="space-y-3"
          >
            {/* Summary cards */}
            {(() => {
              const txs = invoice.transactions;
              const topTx = txs.length > 0 ? txs.reduce((a, b) => a.amount > b.amount ? a : b) : null;
              const byCategory = txs.reduce<Record<string, { name: string; color: string; icon: string; total: number }>>((acc, tx) => {
                const key = tx.category.name;
                if (!acc[key]) acc[key] = { name: tx.category.name, color: tx.category.color, icon: tx.category.icon, total: 0 };
                acc[key].total += tx.amount;
                return acc;
              }, {});
              const topCat = Object.values(byCategory).sort((a, b) => b.total - a.total)[0] ?? null;

              return (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Left: main invoice card */}
                  <Card
                    className={`border-l-4 relative overflow-hidden ${isPaid ? "border-l-success" : isOverdue ? "border-l-destructive" : "border-l-warning"}`}
                  >
                    {/* Bank logo — aligned with header */}
                    <div className="absolute right-6 top-7 pointer-events-none">
                      {getBankIcon(cardBankName, "w-16 h-16")}
                    </div>
              <CardHeader className="relative z-10">
                <CardDescription className={isPaid ? "text-success-label" : isOverdue ? "text-destructive-label" : ""}>
                  Total da fatura · Fecha dia {closingDay}
                </CardDescription>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className={`text-3xl font-black tabular-nums font-numbers ${isPaid ? "text-success" : isOverdue ? "text-destructive" : ""}`}>
                      {formatCurrency(invoice.totalAmount)}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                      Vencimento {formatDate(invoice.dueDate)}
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        isPaid ? "bg-success/15 text-success"
                        : isOverdue ? "bg-destructive/15 text-destructive"
                        : "bg-warning/15 text-warning"
                      }`}>
                        {isPaid ? "Pago" : isOverdue ? "Em atraso" : isPast ? "Não pago" : "Pendente"}
                      </span>
                    </p>
                  </div>
                </div>
              </CardHeader>

              {limit > 0 && (
                <CardContent className="space-y-1.5 relative z-10">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{pct}% do limite</span>
                    <span className="tabular-nums">{formatCurrency(available)} disponível</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: isPaid ? "var(--success)" : barColor }}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(pct, 100)}%` }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {formatCurrency(invoice.totalAmount)} de {formatCurrency(limit)}
                    {totalCommitted > invoice.totalAmount && (
                      <span className="text-warning font-medium">
                        {" "}· {formatCurrency(totalCommitted)} comprometido
                      </span>
                    )}
                  </p>
                </CardContent>
              )}

              <CardFooter className="border-t pt-4 relative z-10">
                {isPaid && invoice.payment ? (
                  <div className="flex items-center justify-between w-full">
                    <p className="text-xs text-success">
                      Pago em {formatDate(invoice.payment.paidAt)} via {invoice.payment.bankAccount.nickname}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-muted-foreground hover:text-destructive"
                      onClick={handleUndoPay}
                      disabled={undoing}
                    >
                      {undoing ? "Desfazendo..." : "Desfazer pagamento"}
                    </Button>
                  </div>
                ) : (
                  <Button
                    className="w-full"
                    variant={isOverdue ? "destructive" : "default"}
                    onClick={openPayDialog}
                  >
                    Pagar fatura
                  </Button>
                )}
              </CardFooter>
                  </Card>

                  {/* Right: top category + top transaction */}
                  <div className="flex flex-col gap-4">
                    {topCat && (() => {
                      const CatIcon = CATEGORY_ICONS[topCat.icon || ""] ?? CATEGORY_ICONS["circle"];
                      return (
                        <Card
                          className="border-l-4 flex-1 relative overflow-hidden"
                          style={{
                            borderLeftColor: topCat.color,
                            background: `radial-gradient(circle 120px at calc(100% - 16px) 16px, color-mix(in srgb, ${topCat.color} 16%, transparent) 0%, transparent 100%) var(--card)`,
                          }}
                        >
                          {CatIcon && (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-10">
                              <CatIcon className="w-16 h-16" style={{ color: topCat.color }} />
                            </div>
                          )}
                          <CardHeader className="relative z-10">
                            <CardDescription>Maior categoria</CardDescription>
                            <div className="flex items-baseline gap-2">
                              <CardTitle className="text-2xl font-semibold tabular-nums font-numbers" style={{ color: topCat.color }}>
                                {formatCurrency(topCat.total)}
                              </CardTitle>
                              <span className="text-sm text-muted-foreground truncate">{topCat.name}</span>
                            </div>
                          </CardHeader>
                        </Card>
                      );
                    })()}

                    {topTx && (
                      <Card className="border-l-4 border-l-destructive flex-1" style={radialGradient("destructive")}>
                        <CardHeader>
                          <CardDescription>Maior compra</CardDescription>
                          <div className="flex items-baseline gap-2">
                            <CardTitle className="text-2xl font-semibold tabular-nums font-numbers text-destructive">
                              {formatCurrency(topTx.amount)}
                            </CardTitle>
                            <span className="text-sm text-muted-foreground truncate">{topTx.description}</span>
                          </div>
                        </CardHeader>
                      </Card>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Transactions list */}
            {invoice.transactions.length > 0 && (() => {
              const uniqueCategories = Array.from(
                new Map(invoice.transactions.map((tx) => [tx.category.id, tx.category])).values()
              ).sort((a, b) => a.name.localeCompare(b.name));

              const filteredTxs = invoice.transactions.filter((tx) => {
                const searchOk = !txSearch || tx.description.toLowerCase().includes(txSearch.toLowerCase());
                const catOk = txCategoryFilter === "ALL" || tx.category.id === txCategoryFilter;
                return searchOk && catOk;
              });

              return (
              <>
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
                  {uniqueCategories.length > 1 && (
                    <Select value={txCategoryFilter} onValueChange={(v) => setTxCategoryFilter(v ?? "ALL")}>
                      <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue>{txCategoryFilter === "ALL" ? "Todas categorias" : uniqueCategories.find((c) => c.id === txCategoryFilter)?.name}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">Todas categorias</SelectItem>
                        {uniqueCategories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <div className="relative flex-1 sm:max-w-[240px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar lançamento..."
                      value={txSearch}
                      onChange={(e) => setTxSearch(e.target.value)}
                      className="pl-9 pr-8"
                    />
                    {txSearch && (
                      <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6" onClick={() => setTxSearch("")}>
                        <X className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground self-center">
                    {filteredTxs.length} de {invoice.transactions.length} lançamento{invoice.transactions.length !== 1 ? "s" : ""}
                  </p>
                </div>

                <motion.div variants={listVariants} initial="hidden" animate="show" className="space-y-2">
                  {filteredTxs.map((tx) => {
                    const CatIcon = CATEGORY_ICONS[tx.category.icon || ""] ?? CATEGORY_ICONS["circle"];
                    return (
                      <motion.div key={tx.id} variants={listItemVariants}>
                        <Card>
                          <CardContent className="flex items-center gap-3">
                            {/* Category icon */}
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                              style={{ backgroundColor: `color-mix(in srgb, ${tx.category.color} 15%, transparent)` }}
                            >
                              <CatIcon className="w-5 h-5" style={{ color: tx.category.color }} />
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold truncate">{tx.description}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatDate(tx.purchaseDate)} · {tx.category.name}
                                {tx.isInstallment && tx.currentInstallment && tx.totalInstallments && (
                                  <span className="ml-1 inline-flex items-center text-[10px] font-semibold bg-primary/10 text-primary rounded-full px-1.5 py-0.5 leading-none">
                                    {tx.currentInstallment}/{tx.totalInstallments}x
                                  </span>
                                )}
                              </p>
                            </div>

                            {/* Amount */}
                            <span className="text-lg font-bold tabular-nums font-numbers shrink-0">
                              {formatCurrency(tx.amount)}
                            </span>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </motion.div>
              </>
              );
            })()}
          </motion.div>
        ) : (
          <motion.div
            key={`empty-${navMonth}-${navYear}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <Card className="border-dashed">
              <CardContent className="py-12 flex flex-col items-center justify-center gap-3 text-center">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">Sem lançamentos em {fmt(navMonth, navYear)}</p>
                  <p className="text-sm text-muted-foreground">Nenhuma compra com vencimento neste mês.</p>
                </div>
                <Button size="sm" variant="outline" onClick={onNewTransaction}>
                  <Plus className="w-3.5 h-3.5 mr-1.5" /> Lançar compra
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pay dialog */}
      <Dialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pagar Fatura — {fmt(navMonth, navYear)}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="rounded-lg bg-muted px-4 py-3 flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Valor da fatura</span>
              <span className="font-bold text-lg tabular-nums">{formatCurrency(invoice?.totalAmount ?? 0)}</span>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Debitar de qual conta?</p>
              {bankAccounts.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma conta encontrada.</p>
              ) : (
                <div className="space-y-2">
                  {bankAccounts.map((acc) => (
                    <Button
                      key={acc.id}
                      type="button"
                      variant="outline"
                      onClick={() => setSelectedAccount(acc.id)}
                      className={`w-full justify-between h-auto px-4 py-3 ${
                        selectedAccount === acc.id ? "border-primary bg-primary/5" : ""
                      }`}
                    >
                      <div className="text-left">
                        <p className="text-sm font-medium">{acc.nickname}</p>
                        <p className="text-xs text-muted-foreground">{acc.name}</p>
                      </div>
                      <span className="text-sm font-semibold tabular-nums">
                        {formatCurrency(parseFloat(acc.balance))}
                      </span>
                    </Button>
                  ))}
                </div>
              )}
            </div>
            <Button
              className="w-full"
              disabled={!selectedAccount || paying}
              onClick={handlePay}
            >
              {paying ? "Pagando..." : "Confirmar pagamento"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function CardDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;

  const [card, setCard] = useState<CardDetail | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const today = new Date();
  const [navDate, setNavDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  async function fetchData() {
    try {
      const [cardRes, catRes, fatRes] = await Promise.all([
        fetch(`/api/cartoes/${id}`),
        fetch("/api/categorias"),
        fetch(`/api/cartoes/${id}/faturas`),
      ]);

      if (cardRes.ok) setCard(await cardRes.json());
      else setCard(null);

      if (catRes.ok) {
        const cats = await catRes.json();
        setCategories(cats.filter((c: Category & { type: string }) => c.type === "EXPENSE"));
      }

      if (fatRes.ok) {
        const fatData = await fatRes.json();
        setInvoices(fatData.invoices || []);
      }
    } catch {
      setCard(null);
    }
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, [id]);

  if (loading) {
    return (
      <PageTransition>
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-40 w-full mb-4" />
        <Skeleton className="h-64 w-full" />
      </PageTransition>
    );
  }

  if (!card) return <PageTransition><p>Cartão não encontrado.</p></PageTransition>;

  const limit = parseFloat(card.creditLimit);

  // Total committed = all unpaid invoices from current month forward
  const now = new Date();
  const totalCommitted = invoices
    .filter((inv) => {
      const d = new Date(inv.dueDate);
      return d >= new Date(now.getFullYear(), now.getMonth(), 1) && inv.status !== "PAID";
    })
    .reduce((sum, inv) => sum + inv.totalAmount, 0);

  return (
    <PageTransition>
      <div className="mb-6">
        <Breadcrumb items={[
          { label: "Cartões", href: "/cartoes" },
          { label: card.name },
        ]} />
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              {card.name}
              {card.brand && getCardBrandIcon(card.brand, "w-10 h-6 ml-2")}
            </h1>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {/* Month navigator */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setNavDate(subMonths(navDate, 1))}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm font-semibold min-w-[100px] text-center capitalize">
                {format(navDate, "MMM yyyy", { locale: ptBR })}
              </span>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setNavDate(addMonths(navDate, 1))}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <motion.div whileTap={{ scale: 0.97 }}>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" /> Nova transação
              </Button>
            </motion.div>
          </div>
        </div>
      </div>

      {invoices.length === 0 && !loading ? (
        <AnimatedCard>
          <EmptyState
            illustration="transactions"
            title="Nenhuma fatura ainda"
            description="Lance uma compra para ver a fatura do cartão."
            actionLabel="Nova transação"
            onAction={() => setDialogOpen(true)}
          />
        </AnimatedCard>
      ) : (
        <FaturasView
          invoices={invoices}
          limit={limit}
          totalCommitted={totalCommitted}
          navDate={navDate}
          onNav={setNavDate}
          today={today}
          cardId={id}
          closingDay={card.closingDay}
          dueDay={card.dueDay}
          cardColor={card.color || "#075056"}
          cardBankName={card.bankAccount?.name || card.name}
          onRefresh={fetchData}
          onNewTransaction={() => setDialogOpen(true)}
        />
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <DialogHeader>
              <DialogTitle>Nova Transação</DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              <TransactionForm
                cardId={id}
                categories={categories}
                onSuccess={() => { setDialogOpen(false); fetchData(); }}
              />
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}
