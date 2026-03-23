"use client";

import { useState, useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { PageTransition } from "@/components/shared/page-transition";
import { MonthSelector } from "@/components/shared/month-selector";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MoneyValue } from "@/components/shared/money-value";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { listVariants, listItemVariants } from "@/components/shared/animated-card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/format";
import { TrendingUp, TrendingDown, ListOrdered, Search, Wallet, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Transaction {
  id: string;
  originalId: string;
  type: "INCOME" | "EXPENSE";
  description: string;
  amount: number;
  date: string;
  status: "PENDING" | "PAID" | "OVERDUE";
  category: { id: string; name: string; color: string };
  bankAccount: { id: string; nickname: string } | null;
}

interface Summary {
  incomePaid: number;
  incomePending: number;
  expensePaid: number;
  expensePending: number;
  projectedBalance: number;
}
function ExtratoContent() {
  const searchParams = useSearchParams();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "PAID" | "PENDING">("ALL");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [periodFilter, setPeriodFilter] = useState<"ALL" | "1Q" | "2Q" | "W1" | "W2" | "W3" | "W4">("ALL");

  // Humanize date header
  function humanizeDate(dateStr: string): string {
    const date = new Date(dateStr + "T12:00:00"); // avoid timezone shift
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const isSameDay = (a: Date, b: Date) =>
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate();

    if (isSameDay(date, today)) return "Hoje";
    if (isSameDay(date, yesterday)) return "Ontem";
    return date.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "short" });
  }

  async function fetchData() {
    try {
      setLoading(true);
      const params = new URLSearchParams(searchParams.toString());
      if (!params.has("month")) params.set("month", (new Date().getMonth() + 1).toString());
      if (!params.has("year")) params.set("year", new Date().getFullYear().toString());

      const res = await fetch(`/api/extrato?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
        setSummary(data.summary || null);
      } else {
        setTransactions([]);
        setSummary(null);
      }
    } catch {
      setTransactions([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, [searchParams]);

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const viewYear = parseInt(searchParams.get("year") || currentYear.toString());
  const viewMonth = parseInt(searchParams.get("month") || currentMonth.toString());
  const isPastMonth = viewYear < currentYear || (viewYear === currentYear && viewMonth < currentMonth);

  // Categorias únicas para o filtro
  const categories = Array.from(
    new Map(transactions.map((t) => [t.category.id, t.category])).values()
  ).sort((a, b) => a.name.localeCompare(b.name));

  // Categoria com maior gasto
  const topExpenseCategory = (() => {
    const byCategory = transactions
      .filter((t) => t.type === "EXPENSE")
      .reduce((acc, t) => {
        const key = t.category.id;
        if (!acc[key]) acc[key] = { ...t.category, total: 0 };
        acc[key].total += t.amount;
        return acc;
      }, {} as Record<string, { id: string; name: string; color: string; total: number }>);
    return Object.values(byCategory).sort((a, b) => b.total - a.total)[0] ?? null;
  })();

  // Categoria selecionada (para exibição no trigger)
  const selectedCategory = categories.find((c) => c.id === categoryFilter) ?? null;

  // Filtragem
  const filteredTransactions = transactions.filter((t) => {
    const statusOk = filter === "ALL" || (filter === "PAID" ? t.status === "PAID" : t.status !== "PAID");
    const searchOk = !search || t.description.toLowerCase().includes(search.toLowerCase());
    const categoryOk = categoryFilter === "ALL" || t.category.id === categoryFilter;
    const periodOk = (() => {
      if (periodFilter === "ALL") return true;
      const day = parseInt(t.date.split("T")[0].split("-")[2], 10);
      if (periodFilter === "1Q") return day <= 15;
      if (periodFilter === "2Q") return day > 15;
      if (periodFilter === "W1") return day >= 1  && day <= 7;
      if (periodFilter === "W2") return day >= 8  && day <= 14;
      if (periodFilter === "W3") return day >= 15 && day <= 21;
      if (periodFilter === "W4") return day >= 22;
      return true;
    })();
    return statusOk && searchOk && categoryOk && periodOk;
  });

  // Agrupamento por dia para a interface
  const groupedByDay = filteredTransactions.reduce((acc, t) => {
    const day = t.date.split("T")[0]; // YYYY-MM-DD
    if (!acc[day]) acc[day] = [];
    acc[day].push(t);
    return acc;
  }, {} as Record<string, Transaction[]>);

  const sortedDays = Object.keys(groupedByDay).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  const activeFiltersCount = [
    filter !== "ALL",
    categoryFilter !== "ALL",
    periodFilter !== "ALL",
    search !== "",
  ].filter(Boolean).length;

  function clearFilters() {
    setFilter("ALL");
    setCategoryFilter("ALL");
    setPeriodFilter("ALL");
    setSearch("");
  }

  return (
    <PageTransition>
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Extrato Mensal</h1>
          <p className="text-sm text-muted-foreground">O fluxo detalhado do seu dinheiro.</p>
        </div>
        <div className="flex-1 flex justify-end">
          <MonthSelector />
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
        <Card className="p-6 border-success/30 bg-success/5 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between p-0 pb-3">
            <CardTitle className="text-success font-semibold">Recebido</CardTitle>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-success/10">
              <TrendingUp className="h-4 w-4 text-success" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <MoneyValue value={summary?.incomePaid || 0} className="text-2xl font-bold" />
          </CardContent>
        </Card>
        <Card className="p-6 border-dashed border-success/40 bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between p-0 pb-3">
            <CardTitle className="text-muted-foreground font-semibold">A Receber</CardTitle>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-success/10">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <MoneyValue value={summary?.incomePending || 0} className="text-2xl font-semibold" />
          </CardContent>
        </Card>

        <Card className="p-6 border-destructive/30 bg-destructive/5 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between p-0 pb-3">
            <CardTitle className="text-destructive font-semibold">Pago</CardTitle>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
              <TrendingDown className="h-4 w-4 text-destructive" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <MoneyValue value={summary?.expensePaid || 0} className="text-2xl font-bold" />
            {!loading && topExpenseCategory && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-destructive/20">
                <span
                  className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: topExpenseCategory.color }}
                />
                <span className="text-xs text-muted-foreground truncate flex-1">{topExpenseCategory.name}</span>
                <span className="text-xs font-semibold text-destructive shrink-0">{formatCurrency(topExpenseCategory.total)}</span>
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="p-6 border-dashed border-destructive/40 bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between p-0 pb-3">
            <CardTitle className="text-muted-foreground font-semibold">A Pagar / Previsto</CardTitle>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <MoneyValue value={summary?.expensePending || 0} className="text-2xl font-semibold" />
          </CardContent>
        </Card>

        <Card className="p-6 bg-primary text-primary-foreground border-primary shadow-sm md:col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between p-0 pb-3">
            <CardTitle className="font-extrabold text-primary-foreground/90 text-sm">
              {isPastMonth ? "Saldo Final" : "Saldo Final Projetado"}
            </CardTitle>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-foreground/20">
              <Wallet className="h-4 w-4 text-primary-foreground" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <MoneyValue value={summary?.projectedBalance || 0} className="text-3xl font-bold drop-shadow-sm" />
          </CardContent>
        </Card>
      </div>

      {/* FILTERS + SEARCH */}
      <div className="mb-6 flex flex-col sm:flex-row gap-3 flex-wrap">
        <Tabs value={filter} onValueChange={(val) => setFilter(val as any)}>
          <TabsList>
            <TabsTrigger value="ALL">Tudo</TabsTrigger>
            <TabsTrigger value="PAID">Realizado</TabsTrigger>
            <TabsTrigger value="PENDING">Previsto</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Period filter */}
        <Select value={periodFilter} onValueChange={(v) => setPeriodFilter(v as typeof periodFilter)}>
          <SelectTrigger className="w-full sm:w-[170px]">
            <SelectValue>
              {periodFilter === "ALL" ? "Todo o mês" :
               periodFilter === "1Q"  ? "1ª quinzena" :
               periodFilter === "2Q"  ? "2ª quinzena" :
               periodFilter === "W1"  ? "Semana 1 (1–7)" :
               periodFilter === "W2"  ? "Semana 2 (8–14)" :
               periodFilter === "W3"  ? "Semana 3 (15–21)" :
                                        "Semana 4 (22+)"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todo o mês</SelectItem>
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Quinzenas</div>
            <SelectItem value="1Q">1ª quinzena (1–15)</SelectItem>
            <SelectItem value="2Q">2ª quinzena (16–fim)</SelectItem>
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Semanas</div>
            <SelectItem value="W1">Semana 1 (1–7)</SelectItem>
            <SelectItem value="W2">Semana 2 (8–14)</SelectItem>
            <SelectItem value="W3">Semana 3 (15–21)</SelectItem>
            <SelectItem value="W4">Semana 4 (22+)</SelectItem>
          </SelectContent>
        </Select>

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
            {categories.map((c) => (
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
            placeholder="Buscar transação..."
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

      {/* TIMELINE LIST */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : filteredTransactions.length === 0 ? (
        <EmptyState
          illustration="no-results"
          title="Sem movimentações"
          description="Nenhuma transação encontrada para este filtro no mês selecionado."
        />
      ) : (
        <motion.div variants={listVariants} initial="hidden" animate="show" className="space-y-6">
          {sortedDays.map((dateStr) => {
            const dayTransactions = groupedByDay[dateStr];

            // Daily totals
            const dayIncome = dayTransactions.filter(t => t.type === "INCOME").reduce((s, t) => s + t.amount, 0);
            const dayExpense = dayTransactions.filter(t => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0);

            return (
              <motion.div key={dateStr} variants={listItemVariants} className="space-y-2">
                <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
                  {/* Date label */}
                  <span className="text-sm font-semibold capitalize flex-1 truncate">
                    {humanizeDate(dateStr)}
                  </span>

                  {/* Transaction count pill */}
                  <span className="inline-flex items-center text-[10px] font-semibold bg-background border rounded-full px-2 py-0.5 leading-none text-muted-foreground shrink-0">
                    {dayTransactions.length}
                  </span>

                  {/* Income / expense breakdown */}
                  <div className="flex items-center gap-3 shrink-0">
                    {dayIncome > 0 && (
                      <span className="text-xs font-semibold text-success tabular-nums">
                        +{formatCurrency(dayIncome)}
                      </span>
                    )}
                    {dayExpense > 0 && (
                      <span className="text-xs font-semibold text-destructive tabular-nums">
                        -{formatCurrency(dayExpense)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  {dayTransactions.map((t) => {
                    const accentColor = t.type === "INCOME" ? "var(--success)" : t.status === "OVERDUE" ? "var(--destructive)" : t.status === "PAID" ? "var(--destructive)" : "var(--warning)";
                    return (
                      <Card key={t.id} className="hover:shadow-sm transition-shadow">
                        <CardContent className="py-3 px-4 flex items-center gap-3">
                          {/* Type/status accent bar */}
                          <div
                            className="w-[3px] self-stretch rounded-full flex-shrink-0"
                            style={{ backgroundColor: accentColor }}
                          />

                          {/* Category avatar */}
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                            style={{ backgroundColor: t.category?.color || "#8A9AA3" }}
                          >
                            {t.category?.name?.[0]?.toUpperCase() || "?"}
                          </div>

                          {/* Description + metadata */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold leading-tight truncate">{t.description}</p>
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                              <span className="text-xs text-muted-foreground">{t.category?.name || "Sem Categoria"}</span>
                              {t.bankAccount && (
                                <>
                                  <span className="text-muted-foreground/40 text-xs">·</span>
                                  <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                                    <Wallet className="w-3 h-3 shrink-0" />
                                    {t.bankAccount.nickname}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Amount + status */}
                          <div className="text-right shrink-0 min-w-[96px]">
                            <p className={`text-base font-bold tabular-nums money ${t.type === "INCOME" ? "text-success" : ""}`}>
                              {t.type === "INCOME" ? "+" : "-"}{formatCurrency(t.amount)}
                            </p>
                            <div className="mt-0.5 flex justify-end">
                              <StatusBadge status={t.status} />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </PageTransition>
  );
}

export default function ExtratoPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Carregando Fluxo de Caixa...</div>}>
      <ExtratoContent />
    </Suspense>
  );
}
