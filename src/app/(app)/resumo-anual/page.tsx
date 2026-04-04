"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, useCallback, Suspense } from "react";
import { motion } from "framer-motion";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { PageTransition } from "@/components/shared/page-transition";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { cn, radialGradient } from "@/lib/utils";
import {
  ArrowUpRight, ArrowDownRight, FileText, TrendingUp, TrendingDown,
  Wallet, ChevronLeft, ChevronRight, Sparkles, Loader2, Eye,
} from "lucide-react";

const IncomeExpensesChart = dynamic(() => import("@/components/dashboard/income-expenses-chart").then((m) => m.IncomeExpensesChart), { ssr: false, loading: () => <Skeleton className="h-[280px] w-full rounded-lg" /> });
const BalanceForecastChart = dynamic(() => import("@/components/dashboard/balance-forecast-chart").then((m) => m.BalanceForecastChart), { ssr: false, loading: () => <Skeleton className="h-[260px] w-full rounded-lg" /> });

interface MonthSummary {
  monthNumber: number;
  monthName: string;
  year: number;
  income: number;
  expenses: number;
  balance: number;
  invested?: number;
  topExpenseCategory?: string;
  topExpenseAmount?: number;
  topIncomeCategory?: string;
  topIncomeAmount?: number;
  isHistorical: boolean;
  isForecast: boolean;
  fixedExpenses?: number;
  variableExpensesAvg?: number;
  oneTimeExpensesAvg?: number;
  cardInstallments?: number;
  variationPercent?: number;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

// ── Year Selector ──────────────────────────────────────────────────────

function YearSelector() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentYearParam = searchParams.get("year");
  const currentYear = currentYearParam ? parseInt(currentYearParam) : new Date().getFullYear();
  const [inputValue, setInputValue] = useState(currentYear.toString());
  const maxYear = new Date().getFullYear() + 5;

  function navigateTo(year: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("year", year.toString());
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" className="w-8 h-8" onClick={() => navigateTo(currentYear - 1)}>
        <ChevronLeft className="w-4 h-4" />
      </Button>
      <Input
        type="number"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onBlur={() => {
          const parsed = parseInt(inputValue);
          if (!isNaN(parsed) && parsed >= 2000 && parsed <= maxYear) navigateTo(parsed);
          else setInputValue(currentYear.toString());
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          if (e.key === "Escape") setInputValue(currentYear.toString());
        }}
        min={2000}
        max={maxYear}
        aria-label="Ano"
        className="w-16 text-center text-sm font-semibold h-8 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <Button variant="outline" size="icon" className="w-8 h-8" onClick={() => navigateTo(currentYear + 1)}>
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
}

// ── AI Analysis Modal ──────────────────────────────────────────────────

function AIAnalysisModal({
  open,
  onOpenChange,
  year,
  months,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  year: number;
  months: MonthSummary[];
}) {
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const runAnalysis = useCallback(async () => {
    setAnalysis("");
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/ia/analise-anual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year, months }),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "Erro ao gerar análise.");
        setLoading(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        setError("Erro de streaming.");
        setLoading(false);
        return;
      }

      const decoder = new TextDecoder();
      let text = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        setAnalysis(text);
      }
    } catch {
      setError("Falha ao conectar com a IA.");
    }
    setLoading(false);
  }, [year, months]);

  useEffect(() => {
    if (open && !analysis && !loading) runAnalysis();
  }, [open, analysis, loading, runAnalysis]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Análise Financeira com IA — {year}
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
        )}

        {(loading || analysis) && (
          <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-sm leading-relaxed">
            {analysis}
            {loading && (
              <span className="inline-block w-1.5 h-3.5 ml-0.5 bg-current rounded-sm animate-pulse" />
            )}
          </div>
        )}

        {!loading && !analysis && !error && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          {!loading && analysis && (
            <Button variant="outline" size="sm" onClick={runAnalysis}>
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              Gerar novamente
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Month Card ─────────────────────────────────────────────────────────

function MonthCard({
  month,
  showVariable,
  onToggleVariable,
  showOneTime,
  onToggleOneTime,
}: {
  month: MonthSummary;
  showVariable: boolean;
  onToggleVariable: (v: boolean) => void;
  showOneTime: boolean;
  onToggleOneTime: (v: boolean) => void;
}) {
  const router = useRouter();

  let displayedExpenses = month.expenses;
  if (month.isForecast) {
    if (!showVariable) displayedExpenses -= (month.variableExpensesAvg ?? 0);
    if (showOneTime) displayedExpenses += (month.oneTimeExpensesAvg ?? 0);
  }
  const displayedBalance = month.income - displayedExpenses;
  const hasExtraToggles = month.isForecast && ((month.variableExpensesAvg ?? 0) > 0 || (month.oneTimeExpensesAvg ?? 0) > 0);

  return (
    <Card
      className={cn(
        "p-6 h-full flex flex-col shadow-sm border-l-4",
        displayedBalance >= 0 ? "border-l-success" : "border-l-destructive",
        month.isForecast && "border-dashed border-t-2 border-r-2 border-b-2 border-t-primary/20 border-r-primary/20 border-b-primary/20"
      )}
    >
      {/* Header: month name + badge */}
      <CardHeader className="flex flex-row items-center justify-between p-0 pb-4">
        <CardTitle className="font-semibold flex items-center gap-2">
          {month.monthName}
          {month.isForecast && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal text-primary border-primary/30">
              <Eye className="w-2.5 h-2.5 mr-0.5" />
              Previsão
            </Badge>
          )}
        </CardTitle>
        {month.variationPercent != null && (
          <Badge variant="outline" className={cn(
            "text-[10px]",
            month.variationPercent > 0 ? "text-success border-success/30" : month.variationPercent < 0 ? "text-destructive border-destructive/30" : "text-muted-foreground"
          )}>
            {month.variationPercent > 0 ? <TrendingUp className="w-3 h-3 mr-0.5" /> : month.variationPercent < 0 ? <TrendingDown className="w-3 h-3 mr-0.5" /> : null}
            {month.variationPercent > 0 ? "+" : ""}{month.variationPercent.toFixed(0)}%
          </Badge>
        )}
      </CardHeader>

      <CardContent className="p-0 flex flex-col gap-4 flex-1">
        {/* Balance */}
        <div>
          <p className="text-xs text-muted-foreground mb-1">Saldo do mês</p>
          <div className={cn("money text-2xl font-bold tracking-tight", displayedBalance >= 0 ? "text-success" : "text-destructive")}>
            {displayedBalance >= 0 ? "+" : ""}{formatCurrency(displayedBalance)}
          </div>
        </div>

        {/* Income & Expenses */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <ArrowUpRight className="h-4 w-4 text-success" />
              <span className="text-muted-foreground">Receitas</span>
            </div>
            <span className="font-semibold text-success">+{formatCurrency(month.income)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <ArrowDownRight className="h-4 w-4 text-destructive" />
              <span className="text-muted-foreground">Despesas</span>
            </div>
            <span className="font-semibold text-destructive">-{formatCurrency(displayedExpenses)}</span>
          </div>
          {month.isHistorical && month.invested != null && month.invested > 0 && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">Aportes</span>
              </div>
              <span className="font-semibold text-primary">{formatCurrency(month.invested)}</span>
            </div>
          )}
        </div>

        {/* Forecast breakdown */}
        {month.isForecast && (month.fixedExpenses || month.cardInstallments || (showVariable && month.variableExpensesAvg) || (showOneTime && month.oneTimeExpensesAvg)) && (
          <div className="pt-3 border-t space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Composição das despesas</p>
            {(month.fixedExpenses ?? 0) > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Fixas recorrentes</span>
                <span className="font-semibold">{formatCurrency(month.fixedExpenses!)}</span>
              </div>
            )}
            {(month.cardInstallments ?? 0) > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Parcelas de cartão</span>
                <span className="font-semibold">{formatCurrency(month.cardInstallments!)}</span>
              </div>
            )}
            {showVariable && (month.variableExpensesAvg ?? 0) > 0 && (
              <div className="flex items-center justify-between text-xs text-warning">
                <span>Gastos variáveis (média)</span>
                <span className="font-semibold">{formatCurrency(month.variableExpensesAvg!)}</span>
              </div>
            )}
            {showOneTime && (month.oneTimeExpensesAvg ?? 0) > 0 && (
              <div className="flex items-center justify-between text-xs text-info">
                <span>Despesas avulsas (média)</span>
                <span className="font-semibold">{formatCurrency(month.oneTimeExpensesAvg!)}</span>
              </div>
            )}
          </div>
        )}

        {/* Top categories (historical) */}
        {month.isHistorical && (month.topIncomeCategory || month.topExpenseCategory) && (
          <div className="pt-3 border-t space-y-2">
            {month.topIncomeCategory && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Maior entrada</span>
                <span className="font-semibold truncate max-w-[140px] text-right">
                  <strong className="text-success">{month.topIncomeCategory}</strong>
                  <span className="text-muted-foreground font-normal ml-1">({formatCurrency(month.topIncomeAmount!)})</span>
                </span>
              </div>
            )}
            {month.topExpenseCategory && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Maior saída</span>
                <span className="font-semibold truncate max-w-[140px] text-right">
                  <strong className="text-destructive">{month.topExpenseCategory}</strong>
                  <span className="text-muted-foreground font-normal ml-1">({formatCurrency(month.topExpenseAmount!)})</span>
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>

      {/* Footer */}
      {(hasExtraToggles || month.isHistorical) && (
        <div className="pt-4 mt-auto space-y-3">
          {/* Forecast toggles */}
          {hasExtraToggles && (
            <div className="space-y-2 pt-3 border-t">
              <p className="text-xs font-medium text-muted-foreground">Simular cenário</p>
              {(month.variableExpensesAvg ?? 0) > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Gastos variáveis</span>
                  <Switch checked={showVariable} onCheckedChange={onToggleVariable} className="scale-[0.8]" />
                </div>
              )}
              {(month.oneTimeExpensesAvg ?? 0) > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Despesas avulsas</span>
                  <Switch checked={showOneTime} onCheckedChange={onToggleOneTime} className="scale-[0.8]" />
                </div>
              )}
            </div>
          )}

          {/* Extrato button (historical only) */}
          {month.isHistorical && (
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={() => {
                const params = new URLSearchParams();
                params.set("month", month.monthNumber.toString());
                params.set("year", month.year.toString());
                router.push(`/extrato?${params.toString()}`);
              }}
            >
              <FileText className="w-3 h-3 mr-1.5" />
              Ver extrato
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}

// ── Main Content ───────────────────────────────────────────────────────

function ResumoAnualContent() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<MonthSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [yearTotal, setYearTotal] = useState({ income: 0, expenses: 0, balance: 0, invested: 0 });
  const [variableToggles, setVariableToggles] = useState<Record<number, boolean>>({});
  const [oneTimeToggles, setOneTimeToggles] = useState<Record<number, boolean>>({});
  const [globalVariable, setGlobalVariable] = useState(true);
  const [globalOneTime, setGlobalOneTime] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);

  const yearParam = searchParams.get("year");
  const year = yearParam ? parseInt(yearParam) : new Date().getFullYear();
  const hasForecast = data.some((m) => m.isForecast);

  useEffect(() => {
    async function fetchResumo() {
      setLoading(true);
      try {
        const params = new URLSearchParams(searchParams.toString());
        if (!params.has("year")) params.set("year", new Date().getFullYear().toString());

        const res = await fetch(`/api/resumo-anual?${params.toString()}`);
        if (res.ok) {
          const json = await res.json();
          const months: MonthSummary[] = json.months || [];
          setData(months);
          calculateTotals(months);
          // Default: include variable expenses, exclude one-time
          const varToggles: Record<number, boolean> = {};
          const otToggles: Record<number, boolean> = {};
          months.filter((m) => m.isForecast).forEach((m) => {
            varToggles[m.monthNumber] = true;
            otToggles[m.monthNumber] = false;
          });
          setVariableToggles(varToggles);
          setOneTimeToggles(otToggles);
        } else {
          setData([]);
          calculateTotals([]);
        }
      } catch {
        setData([]);
        calculateTotals([]);
      }
      setLoading(false);
    }
    fetchResumo();
  }, [searchParams]);

  function calculateTotals(months: MonthSummary[], varToggles?: Record<number, boolean>, otToggles?: Record<number, boolean>) {
    const vt = varToggles ?? variableToggles;
    const ot = otToggles ?? oneTimeToggles;
    let income = 0;
    let expenses = 0;
    let invested = 0;
    for (const m of months) {
      income += m.income;
      let exp = m.expenses;
      if (m.isForecast) {
        if (!(vt[m.monthNumber] ?? true)) exp -= (m.variableExpensesAvg ?? 0);
        if (ot[m.monthNumber] ?? false) exp += (m.oneTimeExpensesAvg ?? 0);
      }
      expenses += exp;
      invested += m.invested ?? 0;
    }
    setYearTotal({ income, expenses, balance: income - expenses, invested });
  }

  function handleGlobalVariable(checked: boolean) {
    setGlobalVariable(checked);
    const newToggles: Record<number, boolean> = {};
    data.filter((m) => m.isForecast).forEach((m) => { newToggles[m.monthNumber] = checked; });
    setVariableToggles(newToggles);
    calculateTotals(data, newToggles, oneTimeToggles);
  }

  function handleGlobalOneTime(checked: boolean) {
    setGlobalOneTime(checked);
    const newToggles: Record<number, boolean> = {};
    data.filter((m) => m.isForecast).forEach((m) => { newToggles[m.monthNumber] = checked; });
    setOneTimeToggles(newToggles);
    calculateTotals(data, variableToggles, newToggles);
  }

  function handleToggleVariable(monthNumber: number, checked: boolean) {
    const newToggles = { ...variableToggles, [monthNumber]: checked };
    setVariableToggles(newToggles);
    setGlobalVariable(Object.values(newToggles).every(Boolean));
    calculateTotals(data, newToggles, oneTimeToggles);
  }

  function handleToggleOneTime(monthNumber: number, checked: boolean) {
    const newToggles = { ...oneTimeToggles, [monthNumber]: checked };
    setOneTimeToggles(newToggles);
    setGlobalOneTime(Object.values(newToggles).every(Boolean));
    calculateTotals(data, variableToggles, newToggles);
  }

  return (
    <PageTransition>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Resumo Anual</h1>
          <p className="text-sm text-muted-foreground">
            Histórico e previsão financeira mês a mês
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {hasForecast && (
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <Switch checked={globalVariable} onCheckedChange={handleGlobalVariable} className="scale-75" />
                Variáveis
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <Switch checked={globalOneTime} onCheckedChange={handleGlobalOneTime} className="scale-75" />
                Avulsas
              </label>
            </div>
          )}
          {data.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => setAiModalOpen(true)}>
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              Analisar com IA
            </Button>
          )}
          <YearSelector />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-44 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* ── Year Summary Cards ── */}
          {(() => {
            const historicalMonths = data.filter((d) => d.isHistorical);
            const hasDataMonths = historicalMonths.filter((d) => d.income > 0 || d.expenses > 0);
            const bestIncomeMonth = hasDataMonths.length > 0 ? hasDataMonths.reduce((p, c) => p.income > c.income ? p : c) : null;
            const worstExpenseMonth = hasDataMonths.length > 0 ? hasDataMonths.reduce((p, c) => p.expenses > c.expenses ? p : c) : null;
            const avgMonthly = hasDataMonths.length > 0
              ? hasDataMonths.reduce((s, m) => s + m.balance, 0) / hasDataMonths.length
              : 0;

            return (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
                {/* Left: 2x2 grid */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Row 1: Totais (mais importantes) */}
                  <Card className="border-l-4 border-l-success" style={radialGradient("success")}>
                    <CardHeader>
                      <CardDescription className="text-success-label">Entradas do Ano</CardDescription>
                      <CardTitle className="text-2xl font-semibold tabular-nums text-success-dark">
                        {formatCurrency(yearTotal.income)}
                      </CardTitle>
                    </CardHeader>
                    {hasForecast && (
                      <CardFooter className="text-[10px] text-muted-foreground">inclui previsões</CardFooter>
                    )}
                  </Card>

                  <Card className="border-l-4 border-l-destructive" style={radialGradient("destructive")}>
                    <CardHeader>
                      <CardDescription className="text-destructive">Saídas do Ano</CardDescription>
                      <CardTitle className="text-2xl font-semibold tabular-nums text-destructive">
                        {formatCurrency(yearTotal.expenses)}
                      </CardTitle>
                    </CardHeader>
                    {hasForecast && (
                      <CardFooter className="text-[10px] text-muted-foreground">inclui previsões</CardFooter>
                    )}
                  </Card>

                  {/* Row 2: Destaques */}
                  <Card className="border-l-4 border-l-success">
                    <CardHeader>
                      <CardDescription className="text-success-label">Maior Entrada</CardDescription>
                      <CardTitle className="text-2xl font-semibold tabular-nums text-success-dark">
                        {bestIncomeMonth ? bestIncomeMonth.monthName : "-"}
                      </CardTitle>
                    </CardHeader>
                    {bestIncomeMonth && (
                      <CardFooter className="text-xs text-muted-foreground">{formatCurrency(bestIncomeMonth.income)}</CardFooter>
                    )}
                  </Card>

                  <Card className="border-l-4 border-l-destructive">
                    <CardHeader>
                      <CardDescription className="text-destructive">Maior Saída</CardDescription>
                      <CardTitle className="text-2xl font-semibold tabular-nums text-destructive">
                        {worstExpenseMonth ? worstExpenseMonth.monthName : "-"}
                      </CardTitle>
                    </CardHeader>
                    {worstExpenseMonth && (
                      <CardFooter className="text-xs text-muted-foreground">{formatCurrency(worstExpenseMonth.expenses)}</CardFooter>
                    )}
                  </Card>
                </div>

                {/* Right: 2 cards stacked */}
                <div className="flex flex-col gap-4">
                  <Card className={cn(
                    "border-l-4 flex-1",
                    yearTotal.balance >= 0 ? "border-l-success" : "border-l-destructive"
                  )}>
                    <CardHeader>
                      <CardDescription>Balanço do Ano</CardDescription>
                      <CardTitle className={cn(
                        "text-3xl font-black tabular-nums",
                        yearTotal.balance >= 0 ? "text-success" : "text-destructive"
                      )}>
                        {formatCurrency(yearTotal.balance)}
                      </CardTitle>
                    </CardHeader>
                    {yearTotal.invested > 0 && (
                      <CardFooter className="text-xs text-muted-foreground">
                        Aportes: {formatCurrency(yearTotal.invested)}
                      </CardFooter>
                    )}
                  </Card>

                  <Card className="border-l-4 border-l-primary flex-1">
                    <CardHeader>
                      <CardDescription>Média Mensal</CardDescription>
                      <CardTitle className={cn(
                        "text-2xl font-semibold tabular-nums",
                        avgMonthly >= 0 ? "text-success" : "text-destructive"
                      )}>
                        {avgMonthly >= 0 ? "+" : ""}{formatCurrency(avgMonthly)}
                      </CardTitle>
                    </CardHeader>
                    <CardFooter className="text-xs text-muted-foreground">
                      Resultado médio por mês
                    </CardFooter>
                  </Card>
                </div>
              </div>
            );
          })()}

          {/* ── Charts ── */}
          {data.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
              <Card className="p-6 shadow-sm">
                <CardHeader className="p-0 pb-4">
                  <CardTitle className="text-muted-foreground font-semibold">Receita vs Despesas</CardTitle>
                  <CardDescription>{year}</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <IncomeExpensesChart
                    data={data.map((m) => ({
                      month: m.monthName.slice(0, 3),
                      income: m.income,
                      expenses: m.expenses,
                      investments: m.invested ?? 0,
                    }))}
                  />
                </CardContent>
              </Card>
              <Card className="p-6 shadow-sm">
                <CardHeader className="p-0 pb-4">
                  <CardTitle className="text-muted-foreground font-semibold">Evolução do Saldo</CardTitle>
                  <CardDescription>Histórico + Previsão</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <BalanceForecastChart
                    data={data.map((m) => ({
                      month: m.monthName.slice(0, 3),
                      saldo: m.balance,
                    }))}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {/* ── Month Cards Grid ── */}
          <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {data.map((month) => (
              <motion.div key={month.monthNumber} variants={itemVariants}>
                <MonthCard
                  month={month}
                  showVariable={variableToggles[month.monthNumber] ?? true}
                  onToggleVariable={(v) => handleToggleVariable(month.monthNumber, v)}
                  showOneTime={oneTimeToggles[month.monthNumber] ?? false}
                  onToggleOneTime={(v) => handleToggleOneTime(month.monthNumber, v)}
                />
              </motion.div>
            ))}
          </motion.div>
        </>
      )}

      {/* AI Analysis Modal */}
      <AIAnalysisModal
        open={aiModalOpen}
        onOpenChange={setAiModalOpen}
        year={year}
        months={data}
      />
    </PageTransition>
  );
}

// ── Page Export ─────────────────────────────────────────────────────────

export default function ResumoAnualPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Carregando Resumo...</div>}>
      <ResumoAnualContent />
    </Suspense>
  );
}
