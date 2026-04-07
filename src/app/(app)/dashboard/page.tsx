"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, Suspense, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { MonthSelector } from "@/components/shared/month-selector";
import { formatCurrency } from "@/lib/format";
import { cn, radialGradient } from "@/lib/utils";
import {
  Wallet,
  TrendUp,
  TrendDown,
  Tag,
  Warning,
} from "@phosphor-icons/react";

// Ícones pré-configurados com weight="fill" para os KPI cards
const WalletFill       = ({ className }: { className?: string }) => <Wallet       weight="fill" className={className} />;
const TrendUpFill      = ({ className }: { className?: string }) => <TrendUp      weight="fill" className={className} />;

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
import { Badge } from "@/components/ui/badge";
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

const MiniTrendChart = dynamic(
  () => import("@/components/dashboard/mini-trend-chart").then((m) => m.MiniTrendChart),
  { ssr: false, loading: () => <ChartSkeleton height={90} /> }
);

/* =============================================
   Helpers
   ============================================= */


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
    <Suspense fallback={<div className="p-8 flex items-center justify-center animate-pulse">Preparando seu dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    const name = session?.user?.name?.split(" ")[0];
    const salutation = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
    return name ? `${salutation}, ${name}` : salutation;
  }, [session?.user?.name]);

  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [budgetAlerts, setBudgetAlerts] = useState<any[]>([]);

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
        setError(err.message || "Não conseguimos carregar o dashboard. Tente novamente.");
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
        <h2 className="text-xl font-bold tracking-tight text-destructive">Não conseguimos carregar o dashboard. Tente novamente.</h2>
        <p className="text-muted-foreground text-sm font-mono bg-muted px-3 py-1.5 rounded">{error}</p>
        <Button variant="link" size="sm" onClick={() => window.location.reload()}>Tentar Novamente</Button>
      </div>
    );
  }

  if (!data) return null;

  const { kpis, historicalData, categoryData, upcomingExpenses, topIncome } = data;

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

  const prevResult = prevMonth ? prevMonth.income - prevMonth.expenses : undefined;
  const currentResult = kpis.balance;
  const resultVsPrev = vsLastMonth(currentResult, prevResult);

  const summaryCards = [
    {
      title: "Saldo em contas",
      value: formatCurrency(kpis.totalBalance),
      icon: WalletFill,
      trend: resultVsPrev ? (resultVsPrev.up ? "Resultado melhor que o anterior" : "Resultado abaixo do anterior") : "Disponível nas contas",
      subtitle: "Contas bancárias ativas",
      vsMonth: resultVsPrev,
      highlight: false,
      valueColor: "",
    },
    {
      title: "Receita do mês",
      value: formatCurrency(kpis.monthIncome),
      icon: TrendUpFill,
      trend: incomeVsPrev ? (incomeVsPrev.up ? "Acima do mês anterior" : "Abaixo do mês anterior") : "Entradas no período",
      subtitle: "Entradas no período",
      vsMonth: incomeVsPrev,
      highlight: false,
      valueColor: "text-success-dark",
      labelColor: "text-success-label",
    },
    {
      title: "Investimentos",
      value: formatCurrency(kpis.totalInvested || 0),
      icon: TrendUp,
      trend: expensesVsPrev ? (expensesVsPrev.up ? "Gastos acima do anterior" : "Gastos abaixo do anterior") : "Total aplicado",
      subtitle: "Carteira de investimentos",
      vsMonth: expensesVsPrev,
      highlight: false,
      valueColor: "",
    },
    {
      title: "Patrimônio total",
      value: formatCurrency(kpis.totalBalance + (kpis.totalInvested || 0)),
      icon: WalletFill,
      trend: resultVsPrev ? (resultVsPrev.up ? "Crescimento no período" : "Queda no período") : "Contas + investimentos",
      subtitle: "Patrimônio líquido total",
      vsMonth: resultVsPrev,
      highlight: false,
      valueColor: "",
      labelColor: "",
    },
  ];

  /* ── Expense table row ────────────────────── */
  const ExpenseRow = ({ tx }: { tx: any }) => {
    const dueDate = new Date(tx.dueDate);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const isOverdue = dueDate < today && tx.status !== "PAID";
    const isToday = dueDate.toDateString() === today.toDateString();
    const isInvoice = !!tx.cardId;

    return (
      <div
        className={cn("flex items-center gap-3 py-2.5 border-b border-border/50 last:border-0", isInvoice && "cursor-pointer hover:bg-muted/50 rounded-lg -mx-2 px-2")}
        onClick={isInvoice ? () => router.push(`/cartoes/${tx.cardId}`) : undefined}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold text-white shrink-0"
          style={{ backgroundColor: isInvoice ? "#6366F1" : (tx.category?.color || "var(--primary)") }}
        >
          {isInvoice ? "💳" : getCategoryInitials(tx.category?.name || "D")}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{tx.description}</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <span className={cn(isOverdue ? "text-destructive font-medium" : isToday ? "text-warning font-medium" : "")}>
              {dueDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
            </span>
            {isOverdue && <span className="text-destructive">· Atrasado</span>}
            {isToday && <span className="text-warning">· Hoje</span>}
          </p>
        </div>
        <span className="text-sm font-semibold text-destructive whitespace-nowrap">
          {formatCurrency(Number(tx.amount))}
        </span>
      </div>
    );
  };

  /* ── Main render ──────────────────────────── */
  return (
    <motion.div
      className="p-4 pb-24 lg:p-6 lg:pb-6 space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between gap-4">
        <h1 className="text-lg sm:text-2xl font-bold tracking-tight">{greeting}</h1>
        <div>
          <Suspense fallback={<div className="h-10 w-24 bg-muted animate-pulse rounded-md" />}>
            <MonthSelector />
          </Suspense>
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
            <motion.div variants={tabVariants} initial="hidden" animate="show" className="space-y-6 pt-2">

              {/* Alertas contextuais — despesas e faturas vencendo hoje/amanhã */}
              {(() => {
                const today = new Date(); today.setHours(0, 0, 0, 0);
                const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
                const urgent = (upcomingExpenses || []).filter((e: any) => {
                  const d = new Date(e.dueDate); d.setHours(0, 0, 0, 0);
                  return (e.status === "PENDING" || e.status === "OVERDUE") && (d.getTime() === today.getTime() || d.getTime() === tomorrow.getTime());
                });
                if (urgent.length === 0) return null;

                const urgentExpenses = urgent.filter((e: any) => !e.cardId);
                const urgentInvoices = urgent.filter((e: any) => !!e.cardId);

                return (
                  <div className="space-y-2">
                    {urgentExpenses.length > 0 && (
                      <motion.div variants={itemVariants} className="flex items-center gap-3 p-3.5 bg-warning/10 border border-warning/30 rounded-xl text-sm">
                        <Warning weight="fill" className="w-4 h-4 text-warning shrink-0" />
                        <span className="flex-1">
                          <span className="font-semibold">{urgentExpenses.length} despesa{urgentExpenses.length > 1 ? "s" : ""}</span>
                          {" vence"}{urgentExpenses.length > 1 ? "m" : ""} em breve
                          {" · "}
                          <span className="font-semibold text-warning">{formatCurrency(urgentExpenses.reduce((s: number, e: any) => s + Number(e.amount), 0))}</span>
                        </span>
                        <Button variant="ghost" size="sm" className="text-xs h-7 px-2 text-warning hover:text-warning" onClick={() => router.push("/despesas")}>
                          Ver →
                        </Button>
                      </motion.div>
                    )}
                    {urgentInvoices.length > 0 && (
                      <motion.div variants={itemVariants} className="flex items-center gap-3 p-3.5 bg-destructive/10 border border-destructive/30 rounded-xl text-sm">
                        <Warning weight="fill" className="w-4 h-4 text-destructive shrink-0" />
                        <span className="flex-1">
                          <span className="font-semibold">{urgentInvoices.length} fatura{urgentInvoices.length > 1 ? "s" : ""} de cartão</span>
                          {" vence"}{urgentInvoices.length > 1 ? "m" : ""} em breve
                          {" · "}
                          <span className="font-semibold text-destructive">{formatCurrency(urgentInvoices.reduce((s: number, e: any) => s + Number(e.amount), 0))}</span>
                        </span>
                        <Button variant="ghost" size="sm" className="text-xs h-7 px-2 text-destructive hover:text-destructive" onClick={() => {
                          const firstInvoice = urgentInvoices[0] as any;
                          router.push(`/cartoes/${firstInvoice.cardId}`);
                        }}>
                          Pagar fatura →
                        </Button>
                      </motion.div>
                    )}
                  </div>
                );
              })()}

              {/* Balanço do Mês + KPI Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                {/* Resultado do Mês — Card Principal */}
                <Card className={cn(
                  "p-6 h-full flex flex-col justify-between border-l-4",
                  kpis.balance >= 0 ? "border-l-success" : "border-l-destructive"
                )}>
                  <CardHeader className="p-0">
                    <CardDescription>Resultado do mês</CardDescription>
                    <div>
                      <div className={`money text-4xl font-black tracking-tight ${kpis.balance >= 0 ? "text-success" : "text-destructive"}`}>
                        {kpis.balance >= 0 ? "+" : ""}{formatCurrency(kpis.balance)}
                      </div>
                      {(() => {
                        const savingsRate = kpis.monthIncome > 0 ? Math.round((kpis.balance / kpis.monthIncome) * 100) : 0;
                        return (
                          <Badge variant="outline" className={cn(
                            "text-xs mt-2",
                            kpis.balance >= 0 ? "text-success border-success/30" : "text-destructive border-destructive/30"
                          )}>
                            {savingsRate >= 0 ? "+" : ""}{savingsRate}% poupança
                          </Badge>
                        );
                      })()}
                    </div>
                  </CardHeader>

                  <CardContent className="p-0 flex flex-col gap-4">
                    {/* Receitas e Despesas com barras visuais */}
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1.5">
                          <div className="flex items-center gap-2">
                            <TrendUp weight="fill" className="h-4 w-4 text-success" />
                            <span className="text-muted-foreground">Receitas</span>
                          </div>
                          <span className="font-semibold text-success">+{formatCurrency(kpis.monthIncome)}</span>
                        </div>
                        <div className="h-3 rounded-full bg-success/15 overflow-hidden">
                          <div className="h-full rounded-full bg-success transition-all duration-700" style={{ width: "100%" }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1.5">
                          <div className="flex items-center gap-2">
                            <TrendDown weight="fill" className="h-4 w-4 text-destructive" />
                            <span className="text-muted-foreground">Despesas</span>
                          </div>
                          <span className="font-semibold text-destructive">-{formatCurrency(kpis.monthExpenses)}</span>
                        </div>
                        <div className="h-3 rounded-full bg-destructive/15 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-destructive transition-all duration-700"
                            style={{ width: `${kpis.monthIncome > 0 ? Math.min((kpis.monthExpenses / kpis.monthIncome) * 100, 100) : 0}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Destaques */}
                    {(topIncome || topCategory || topExpense) && (
                      <div className="pt-3 border-t flex flex-col gap-2.5">
                        {topIncome && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground flex items-center gap-1.5">
                              <TrendUp weight="fill" className="w-3 h-3 shrink-0 text-success" />
                              Maior receita
                            </span>
                            <span className="font-semibold truncate max-w-[100px] sm:max-w-[160px] text-right" title={topIncome.description}>
                              {topIncome.description} <span className="text-muted-foreground font-normal ml-0.5">({formatCurrency(topIncome.amount)})</span>
                            </span>
                          </div>
                        )}
                        {topCategory && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: topCategory.color || "var(--muted)" }} />
                              Maior gasto
                            </span>
                            <span className="font-semibold truncate max-w-[100px] sm:max-w-[160px] text-right" title={topCategory.name}>
                              {topCategory.name} <span className="text-muted-foreground font-normal ml-0.5">({formatCurrency(topCategory.value)})</span>
                            </span>
                          </div>
                        )}
                        {topExpense && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground flex items-center gap-1.5">
                              <Tag weight="fill" className="w-3 h-3 shrink-0" />
                              Despesa mais cara
                            </span>
                            <span className="font-semibold truncate max-w-[100px] sm:max-w-[160px] text-right" title={topExpense.description}>
                              {topExpense.description} <span className="text-muted-foreground font-normal ml-0.5">({formatCurrency(Number(topExpense.amount))})</span>
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* KPI Cards 2x2 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {summaryCards.map((card, idx) => {
                    const Icon = card.icon;
                    const cardStyles = [
                      "border-l-4 border-l-primary",
                      "border-l-4 border-l-success",
                      "border-l-4 border-l-chart-1",
                      "border-l-4 border-l-primary",
                    ];
                    const cardGradients: (React.CSSProperties | undefined)[] = [
                      undefined,
                      radialGradient("success"),
                      undefined,
                      undefined,
                    ];
                    return (
                      <Card key={card.title} className={cn("@container/card", cardStyles[idx])} style={cardGradients[idx]}>
                        <CardHeader>
                          <CardDescription className={card.labelColor}>{card.title}</CardDescription>
                          <CardTitle className={cn("text-2xl font-semibold tabular-nums", card.valueColor)}>
                            {card.value}
                          </CardTitle>
                          {card.vsMonth && (
                            <CardAction>
                              <Badge className="bg-card text-foreground/70 border-0 shadow-sm">
                                {card.vsMonth.up
                                  ? <TrendUp weight="fill" className="size-3" />
                                  : <TrendDown weight="fill" className="size-3" />}
                                {card.vsMonth.up ? "+" : "-"}{card.vsMonth.pct}%
                              </Badge>
                            </CardAction>
                          )}
                        </CardHeader>
                        <CardFooter className="flex-col items-start gap-1 text-xs">
                          <div className="line-clamp-1 flex gap-1.5 font-medium">
                            {card.trend}
                            {card.vsMonth
                              ? card.vsMonth.up
                                ? <TrendUp weight="fill" className="size-3.5" />
                                : <TrendDown weight="fill" className="size-3.5" />
                              : <Icon className="size-3.5" />}
                          </div>
                          <div className={card.labelColor || "text-muted-foreground"}>{card.subtitle}</div>
                        </CardFooter>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {/* Próximas Despesas + Tendência */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Upcoming Expenses */}
                <Card className="p-6 shadow-sm">
                  <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between">
                    <CardTitle className="text-muted-foreground font-semibold">Despesas a vencer</CardTitle>
                    <Button variant="ghost" size="sm" className="text-xs" onClick={() => router.push("/despesas")}>
                      Ver todas →
                    </Button>
                  </CardHeader>
                  <CardContent className="p-0">
                    {(() => {
                      const pending = upcomingExpenses
                        .filter((t: any) => t.status === "PENDING" || t.status === "OVERDUE")
                        .slice(0, 5);
                      if (pending.length === 0) {
                        return (
                          <div className="h-40 flex items-center justify-center">
                            <EmptyState
                              illustration="transactions"
                              title="Tudo em dia!"
                              description="Nenhuma despesa pendente. Tudo em dia!"
                            />
                          </div>
                        );
                      }
                      return pending.map((tx: any) => <ExpenseRow key={tx.id} tx={tx} />);
                    })()}
                  </CardContent>
                </Card>

                {/* Tendência dos últimos 12 meses */}
                {historicalData?.length >= 2 && (
                  <Card className="p-6 shadow-sm flex flex-col">
                    <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between">
                      <CardTitle className="text-muted-foreground font-semibold">Tendência dos últimos 12 meses</CardTitle>
                      <Button variant="ghost" size="sm" className="text-xs" onClick={() => router.push("/resumo-anual")}>
                        Ver análise →
                      </Button>
                    </CardHeader>
                    <CardContent className="p-0 flex-1">
                      <MiniTrendChart data={historicalData} />
                    </CardContent>
                    <div className="flex items-center justify-center gap-4 pt-2">
                      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span className="w-2.5 h-2.5 rounded-full bg-success inline-block" /> Receitas
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span className="w-2.5 h-2.5 rounded-full bg-destructive inline-block" /> Despesas
                      </span>
                    </div>
                  </Card>
                )}
              </div>

              {/* AI Insights + Budget Alerts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <InsightsCard />
                {budgetAlerts.length > 0 && (
                  <BudgetAlertBanner items={budgetAlerts} />
                )}
              </div>

            </motion.div>
      </motion.div>
    </motion.div>
  );
}
