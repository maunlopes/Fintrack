"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, Suspense, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { MonthSelector } from "@/components/shared/month-selector";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowUpRight,
  Wallet,
  TrendUp,
  TrendDown,
  Tag,
  CreditCard,
  ChartLineUp,
  Scales,
  Warning,
} from "@phosphor-icons/react";

const ScalesFill = ({ className }: { className?: string }) => <Scales weight="fill" className={className} />;

// Ícones pré-configurados com weight="fill" para os KPI cards
const WalletFill       = ({ className }: { className?: string }) => <Wallet       weight="fill" className={className} />;
const ChartLineUpFill  = ({ className }: { className?: string }) => <ChartLineUp  weight="fill" className={className} />;
const ArrowUpFill      = ({ className }: { className?: string }) => <ArrowUpRight weight="fill" className={className} />;
const ArrowDownFill    = ({ className }: { className?: string }) => <ArrowDownRight weight="fill" className={className} />;

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { BudgetAlertBanner } from "@/components/shared/budget-alert-banner";
import { InsightsCard } from "@/components/ia/insights-card";

/* =============================================
   Dynamic Chart Imports
   ============================================= */

const ChartSkeleton = ({ height }: { height: number }) => (
  <Skeleton className="w-full rounded-lg" style={{ height }} />
);

const IncomeExpensesChart = dynamic(
  () => import("@/components/dashboard/income-expenses-chart").then((m) => m.IncomeExpensesChart),
  { ssr: false, loading: () => <ChartSkeleton height={280} /> }
);

const CategoryPieChart = dynamic(
  () => import("@/components/dashboard/category-pie-chart").then((m) => m.CategoryPieChart),
  { ssr: false, loading: () => <ChartSkeleton height={280} /> }
);

const BalanceForecastChart = dynamic(
  () => import("@/components/dashboard/balance-forecast-chart").then((m) => m.BalanceForecastChart),
  { ssr: false, loading: () => <ChartSkeleton height={260} /> }
);

const MiniTrendChart = dynamic(
  () => import("@/components/dashboard/mini-trend-chart").then((m) => m.MiniTrendChart),
  { ssr: false, loading: () => <ChartSkeleton height={90} /> }
);

/* =============================================
   Helpers
   ============================================= */

function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function getCategoryInitials(category: string): string {
  return category.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

/* =============================================
   Motion Variants
   ============================================= */

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

const tabVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" as const } },
};

/* =============================================
   Dashboard Page
   ============================================= */

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="p-8 flex items-center justify-center animate-pulse">Carregando Dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    const name = session?.user?.name?.split(" ")[0];
    const salutation = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
    return name ? `${salutation}, ${name}` : salutation;
  }, [session?.user?.name]);

  const periodLabel = useMemo(() => {
    const m = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1));
    const y = parseInt(searchParams.get("year") || String(new Date().getFullYear()));
    return new Date(y, m - 1, 1).toLocaleString("pt-BR", { month: "long", year: "numeric" });
  }, [searchParams]);

  const [filter, setFilter] = useState<"ALL" | "PENDING">("ALL");
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [budgetAlerts, setBudgetAlerts] = useState<any[]>([]);

  const activeTab = searchParams.get("tab") ?? "resumo";

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.replace(`${pathname}?${params.toString()}`);
  };

  useEffect(() => {
    setLoading(true);
    setError(null);

    // Preload chart chunks in parallel with API call
    import("@/components/dashboard/income-expenses-chart");
    import("@/components/dashboard/category-pie-chart");
    import("@/components/dashboard/balance-forecast-chart");

    // Strip ?tab param before sending to API
    const apiParams = new URLSearchParams(searchParams.toString());
    apiParams.delete("tab");
    const endpoint = `/api/dashboard${apiParams.toString() ? `?${apiParams.toString()}` : ""}`;
    const budgetEndpoint = `/api/orcamentos${apiParams.toString() ? `?${apiParams.toString()}` : ""}`;

    // Fetch budget alerts in parallel (non-blocking — dashboard doesn't wait for it)
    fetch(budgetEndpoint)
      .then((r) => r.json())
      .then((json: any[]) => setBudgetAlerts(json.filter((c) => c.status === "warning" || c.status === "danger")))
      .catch(() => {});

    fetch(endpoint)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || `Erro ${res.status}`);
        return json;
      })
      .then((json) => {
        const formattedHistory = json.historicalData?.map((item: any) => ({
          ...item,
          month: (() => {
            const [y, m] = item.month.split("T")[0].split("-").map(Number);
            return new Date(y, m - 1, 1).toLocaleString("pt-BR", { month: "short" });
          })(),
        })) || [];
        setData({ ...json, historicalData: formattedHistory });
        setLoading(false);
      })
      .catch((err) => {
        console.error("Dashboard Fetch Error:", err);
        setError(err.message || "Erro ao carregar dashboard");
        setLoading(false);
      });
  }, [searchParams]);

  /* ── Loading skeleton ─────────────────────── */
  if (loading) {
    return (
      <div className="p-4 pb-24 lg:p-6 lg:pb-6 space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <Skeleton className="h-7 w-36" />
            <Skeleton className="h-4 w-52" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>
        {/* Tab strip */}
        <div className="flex gap-6 border-b pb-0">
          {["w-16", "w-14", "w-32"].map((w, i) => (
            <Skeleton key={i} className={`h-8 ${w} rounded`} />
          ))}
        </div>
        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        {/* Two cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  /* ── Error state ──────────────────────────── */
  if (error) {
    return (
      <div className="p-8 flex flex-col items-center justify-center text-center gap-4">
        <h2 className="text-xl font-bold tracking-tight text-destructive">Erro ao carregar dashboard</h2>
        <p className="text-muted-foreground text-sm font-mono bg-muted px-3 py-1.5 rounded">{error}</p>
        <Button variant="link" size="sm" onClick={() => window.location.reload()}>Tentar Novamente</Button>
      </div>
    );
  }

  if (!data) return null;

  const { kpis, historicalData, categoryData, upcomingExpenses } = data;

  const topCategory = categoryData?.length > 0
    ? categoryData.reduce((prev: any, current: any) => (prev.value > current.value) ? prev : current)
    : null;

  const topExpense = upcomingExpenses?.length > 0
    ? upcomingExpenses.reduce((prev: any, current: any) => (Number(prev.amount) > Number(current.amount)) ? prev : current)
    : null;

  const prevMonth = historicalData?.length >= 2 ? historicalData[historicalData.length - 2] : null;

  function vsLastMonth(current: number, previous: number | undefined) {
    if (!previous || previous === 0) return null;
    const pct = ((current - previous) / previous) * 100;
    return { pct: Math.abs(pct).toFixed(1), up: pct >= 0 };
  }

  const incomeVsPrev = vsLastMonth(kpis.monthIncome, prevMonth?.income);
  const expensesVsPrev = vsLastMonth(kpis.monthExpenses, prevMonth?.expenses);

  const balanceVsPrev = vsLastMonth(kpis.balance, prevMonth ? (prevMonth.income - prevMonth.expenses) : undefined);

  const summaryCards = [
    {
      title: "Resultado do Mês",
      value: (kpis.balance >= 0 ? "+" : "") + formatBRL(kpis.balance),
      icon: ScalesFill,
      trend: kpis.balance >= 0 ? "Saldo positivo no período" : "Saldo negativo no período",
      subtitle: "Receitas menos despesas",
      vsMonth: balanceVsPrev,
      highlight: true,
      valueColor: kpis.balance >= 0 ? "text-success" : "text-destructive",
    },
    {
      title: "Receita do Mês",
      value: formatBRL(kpis.monthIncome),
      icon: ArrowUpFill,
      trend: incomeVsPrev ? (incomeVsPrev.up ? "Acima do mês anterior" : "Abaixo do mês anterior") : "Entradas no período",
      subtitle: "Entradas no período",
      vsMonth: incomeVsPrev,
      highlight: false,
      valueColor: "",
    },
    {
      title: "Despesas do Mês",
      value: formatBRL(kpis.monthExpenses),
      icon: ArrowDownFill,
      trend: expensesVsPrev ? (expensesVsPrev.up ? "Acima do mês anterior" : "Abaixo do mês anterior") : "Saídas no período",
      subtitle: "Saídas no período",
      vsMonth: expensesVsPrev,
      highlight: false,
      valueColor: "",
    },
    {
      title: "Patrimônio Total",
      value: formatBRL(kpis.totalBalance + (kpis.totalInvested || 0)),
      icon: WalletFill,
      trend: "Contas + investimentos",
      subtitle: "Patrimônio líquido total",
      vsMonth: null,
      highlight: false,
      valueColor: "",
    },
  ];

  /* ── Expense table row ────────────────────── */
  const ExpenseRow = ({ tx, i }: { tx: any; i: number }) => (
    <TableRow key={tx.id || i} className="border-b transition-colors hover:bg-muted/50">
      <TableCell className="font-medium">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback
              className="text-xs font-semibold text-white"
              style={{ backgroundColor: tx.category?.color || "var(--primary)" }}
            >
              {getCategoryInitials(tx.category?.name || "Despesa")}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-0.5">
            <span className="leading-tight">{tx.description}</span>
            <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
              {tx.cardId ? (
                <><CreditCard weight="fill" className="w-3 h-3 shrink-0" />{tx.cardName}</>
              ) : tx.bankAccount ? (
                <><Wallet weight="fill" className="w-3 h-3 shrink-0" />{tx.bankAccount.nickname}</>
              ) : null}
            </span>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="font-normal text-xs bg-muted">
          {tx.category?.name || "Despesa"}
        </Badge>
      </TableCell>
      <TableCell className="text-muted-foreground whitespace-nowrap">
        {new Date(tx.dueDate).toLocaleDateString("pt-BR")}
      </TableCell>
      <TableCell className="text-right font-medium whitespace-nowrap text-destructive">
        {formatBRL(Number(tx.amount))}
      </TableCell>
    </TableRow>
  );

  const tableColumns = (
    <TableHeader>
      <TableRow>
        <TableHead className="w-[280px]">Descrição</TableHead>
        <TableHead>Categoria</TableHead>
        <TableHead>Data</TableHead>
        <TableHead className="text-right">Valor</TableHead>
      </TableRow>
    </TableHeader>
  );

  /* ── Main render ──────────────────────────── */
  return (
    <motion.div
      className="p-4 pb-24 lg:p-6 lg:pb-6 space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-row justify-between items-center gap-2">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold tracking-tight">{greeting}</h1>
          <p className="text-muted-foreground text-xs sm:text-sm capitalize">{periodLabel}</p>
        </div>
        <div data-tour="month-selector" className="shrink-0">
          <Suspense fallback={<div className="h-10 w-40 bg-muted animate-pulse rounded-md" />}>
            <MonthSelector />
          </Suspense>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={itemVariants}>
        <Tabs value={activeTab} onValueChange={handleTabChange}>

          <TabsList className="w-full">
            <TabsTrigger value="resumo" className="flex-1">Resumo</TabsTrigger>
            <TabsTrigger value="analise" className="flex-1">Análise</TabsTrigger>
            <TabsTrigger value="despesas" className="flex-1">Próximas Despesas</TabsTrigger>
          </TabsList>

          {/* ── Tab 1: Resumo ─────────────────────────── */}
          <TabsContent value="resumo">
            <motion.div key="resumo" variants={tabVariants} initial="hidden" animate="show" className="space-y-6 pt-6">

              {/* Alertas contextuais — despesas vencendo hoje/amanhã */}
              {(() => {
                const today = new Date(); today.setHours(0, 0, 0, 0);
                const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
                const urgent = (upcomingExpenses || []).filter((e: any) => {
                  const d = new Date(e.dueDate); d.setHours(0, 0, 0, 0);
                  return e.status === "PENDING" && (d.getTime() === today.getTime() || d.getTime() === tomorrow.getTime());
                });
                if (urgent.length === 0) return null;
                const total = urgent.reduce((s: number, e: any) => s + Number(e.amount), 0);
                const todayCount = urgent.filter((e: any) => { const d = new Date(e.dueDate); d.setHours(0,0,0,0); return d.getTime() === today.getTime(); }).length;
                return (
                  <motion.div variants={itemVariants} className="flex items-center gap-3 p-3.5 bg-warning/10 border border-warning/30 rounded-xl text-sm">
                    <Warning weight="fill" className="w-4 h-4 text-warning shrink-0" />
                    <span className="flex-1">
                      <span className="font-semibold">{urgent.length} despesa{urgent.length > 1 ? "s" : ""}</span>
                      {todayCount > 0 ? ` vence${todayCount > 1 ? "m" : ""} hoje` : " vence amanhã"}
                      {urgent.length > 1 && todayCount > 0 && todayCount < urgent.length ? ` e ${urgent.length - todayCount} amanhã` : ""}
                      {" · "}
                      <span className="font-semibold text-warning">{formatBRL(total)}</span>
                    </span>
                    <Button variant="ghost" size="sm" className="text-xs h-7 px-2 text-warning hover:text-warning" onClick={() => handleTabChange("despesas")}>
                      Ver →
                    </Button>
                  </motion.div>
                );
              })()}

              {/* KPI Cards */}
              <div data-tour="dashboard-kpis" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {summaryCards.map((card) => {
                  const Icon = card.icon;
                  return (
                    <motion.div key={card.title} variants={itemVariants}>
                      <Card className="@container/card">
                        <CardHeader>
                          <CardDescription>{card.title}</CardDescription>
                          <CardTitle className="text-xl font-semibold tabular-nums @[250px]/card:text-2xl">
                            {card.value}
                          </CardTitle>
                          {card.vsMonth && (
                            <CardAction>
                              <Badge variant="outline" className={card.vsMonth.up ? "text-success border-success/30" : "text-destructive border-destructive/30"}>
                                {card.vsMonth.up
                                  ? <TrendUp weight="fill" className="size-3" />
                                  : <TrendDown weight="fill" className="size-3" />}
                                {card.vsMonth.up ? "+" : "-"}{card.vsMonth.pct}%
                              </Badge>
                            </CardAction>
                          )}
                        </CardHeader>
                        <CardFooter className="flex-col items-start gap-1.5 text-sm">
                          <div className="line-clamp-1 flex gap-2 font-medium">
                            {card.trend}
                            {card.vsMonth
                              ? card.vsMonth.up
                                ? <TrendUp weight="fill" className="size-4" />
                                : <TrendDown weight="fill" className="size-4" />
                              : <Icon className="size-4" />}
                          </div>
                          <div className="text-muted-foreground">{card.subtitle}</div>
                        </CardFooter>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>

              {/* AI Insights + Budget Alerts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <InsightsCard />
                {budgetAlerts.length > 0 && (
                  <BudgetAlertBanner items={budgetAlerts} />
                )}
              </div>

              {/* Balanço do Mês + Mini Upcoming */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                {/* Balanço do Mês */}
                <Card className="p-6 h-full flex flex-col justify-between shadow-sm">
                  <CardHeader className="p-0 pb-4">
                    <CardTitle className="text-muted-foreground font-semibold">Balanço do Mês</CardTitle>
                    <CardDescription>Resultado do período</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0 flex flex-col gap-5">
                    <div>
                      <div className={`money text-3xl font-black tracking-tight ${kpis.balance >= 0 ? "text-success" : "text-destructive"}`}>
                        {kpis.balance >= 0 ? "+" : ""}{formatBRL(kpis.balance)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {kpis.balance >= 0 ? "Resultado positivo este mês" : "Resultado negativo este mês"}
                      </p>
                    </div>
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <ArrowUpRight weight="fill" className="h-4 w-4 text-success" />
                          <span className="text-muted-foreground">Receitas</span>
                        </div>
                        <span className="font-semibold text-success">+{formatBRL(kpis.monthIncome)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <ArrowDownRight weight="fill" className="h-4 w-4 text-destructive" />
                          <span className="text-muted-foreground">Despesas</span>
                        </div>
                        <span className="font-semibold text-destructive">-{formatBRL(kpis.monthExpenses)}</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                        <span>Taxa de gasto</span>
                        <span className="font-medium">
                          {kpis.monthIncome > 0 ? Math.min(Math.round((kpis.monthExpenses / kpis.monthIncome) * 100), 100) : 0}%
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${kpis.monthExpenses / kpis.monthIncome > 0.8 ? "bg-destructive" : kpis.monthExpenses / kpis.monthIncome > 0.5 ? "bg-warning" : "bg-success"}`}
                          style={{ width: `${kpis.monthIncome > 0 ? Math.min((kpis.monthExpenses / kpis.monthIncome) * 100, 100) : 0}%` }}
                        />
                      </div>
                    </div>
                    {(topCategory || topExpense) && (
                      <div className="pt-4 border-t flex flex-col gap-2.5 mt-2">
                        {topCategory && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: topCategory.color || "var(--muted)" }} />
                              Categoria de maior gasto
                            </span>
                            <span className="font-semibold truncate max-w-[150px] text-right" title={topCategory.name}>
                              {topCategory.name} <span className="text-muted-foreground font-normal ml-0.5">({formatBRL(topCategory.value)})</span>
                            </span>
                          </div>
                        )}
                        {topExpense && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground flex items-center gap-1.5">
                              <Tag weight="fill" className="w-3 h-3" />
                              Despesa mais cara
                            </span>
                            <span className="font-semibold truncate max-w-[150px] text-right" title={topExpense.description}>
                              {topExpense.description} <span className="text-muted-foreground font-normal ml-0.5">({formatBRL(Number(topExpense.amount))})</span>
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Mini Upcoming Expenses */}
                <Card className="p-6 shadow-sm">
                  <CardHeader className="p-0 pb-4 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-muted-foreground font-semibold">Próximas Despesas</CardTitle>
                      <CardDescription>Mais urgentes a pagar</CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" className="text-xs" onClick={() => handleTabChange("despesas")}>
                      Ver todas →
                    </Button>
                  </CardHeader>
                  <CardContent className="p-0">
                    {(() => {
                      const top3 = upcomingExpenses
                        .filter((t: any) => t.status === "PENDING")
                        .slice(0, 3);
                      if (top3.length === 0) {
                        return (
                          <div className="h-40 flex items-center justify-center">
                            <EmptyState
                              illustration="transactions"
                              title="Sem pendências"
                              description="Nenhuma despesa pendente."
                            />
                          </div>
                        );
                      }
                      return (
                        <div className="overflow-x-auto">
                          <Table>
                            {tableColumns}
                            <TableBody>
                              {top3.map((tx: any, i: number) => <ExpenseRow key={tx.id || i} tx={tx} i={i} />)}
                            </TableBody>
                          </Table>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              </div>

              {/* Mini sparkline — tendência dos últimos meses */}
              {historicalData?.length >= 2 && (
                <Card className="p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground">Tendência dos Últimos Meses</p>
                      <p className="text-xs text-muted-foreground/70 mt-0.5">
                        <span className="inline-flex items-center gap-1 mr-3">
                          <span className="w-2 h-2 rounded-full bg-success inline-block" /> Receitas
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-destructive inline-block" /> Despesas
                        </span>
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" className="text-xs" onClick={() => handleTabChange("analise")}>
                      Ver análise completa →
                    </Button>
                  </div>
                  <MiniTrendChart data={historicalData} />
                </Card>
              )}

            </motion.div>
          </TabsContent>

          {/* ── Tab 2: Análise ────────────────────────── */}
          <TabsContent value="analise">
            <motion.div key="analise" variants={tabVariants} initial="hidden" animate="show" className="space-y-4 pt-6">

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="p-6 shadow-sm">
                  <CardHeader className="p-0 pb-4">
                    <CardTitle className="text-muted-foreground font-semibold">Receita vs Despesas</CardTitle>
                    <CardDescription>Últimos 12 meses</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <IncomeExpensesChart data={historicalData} />
                  </CardContent>
                </Card>

                <Card className="p-6 shadow-sm">
                  <CardHeader className="p-0 pb-4 flex flex-row items-start justify-between">
                    <div>
                      <CardTitle className="text-muted-foreground font-semibold">Gastos por Categoria</CardTitle>
                      <CardDescription className="capitalize">{periodLabel}</CardDescription>
                    </div>
                    <Link href="/orcamentos" className="text-xs text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline shrink-0 mt-1">
                      Ver orçamentos →
                    </Link>
                  </CardHeader>
                  <CardContent className="p-0">
                    <CategoryPieChart data={categoryData} />
                  </CardContent>
                </Card>
              </div>

              <Card className="p-6 shadow-sm">
                <CardHeader className="p-0 pb-4">
                  <CardTitle className="text-muted-foreground font-semibold">Previsão de Saldo</CardTitle>
                  <CardDescription>Próximos 6 meses</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <BalanceForecastChart data={data.forecastData} />
                </CardContent>
              </Card>

            </motion.div>
          </TabsContent>

          {/* ── Tab 3: Próximas Despesas ──────────────── */}
          <TabsContent value="despesas">
            <motion.div key="despesas" variants={tabVariants} initial="hidden" animate="show" className="pt-6">
              <Card className="p-6 shadow-sm">
                <Tabs value={filter} onValueChange={(val) => setFilter(val as any)}>
                  <CardHeader className="p-0 pb-4 flex flex-row items-start justify-between gap-4">
                    <div>
                      <CardTitle className="text-muted-foreground font-semibold">Próximas Despesas</CardTitle>
                      <CardDescription>Contas a pagar e despesas futuras</CardDescription>
                    </div>
                    <TabsList className="grid w-[220px] grid-cols-2 shrink-0">
                      <TabsTrigger value="ALL">Todas</TabsTrigger>
                      <TabsTrigger value="PENDING">Pendentes</TabsTrigger>
                    </TabsList>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        {tableColumns}
                        <TableBody>
                          {(() => {
                            const filtered = upcomingExpenses.filter((t: any) =>
                              filter === "ALL" ? true : t.status === "PENDING"
                            );
                            if (filtered.length === 0) {
                              return (
                                <TableRow>
                                  <TableCell colSpan={4} className="h-48">
                                    <EmptyState
                                      illustration="transactions"
                                      title="Sem próximas despesas"
                                      description="Você não tem nenhuma despesa agendada ou pendente para exibir."
                                    />
                                  </TableCell>
                                </TableRow>
                              );
                            }
                            return filtered.map((tx: any, i: number) => <ExpenseRow key={tx.id || i} tx={tx} i={i} />);
                          })()}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Tabs>
              </Card>
            </motion.div>
          </TabsContent>

        </Tabs>
      </motion.div>
    </motion.div>
  );
}
