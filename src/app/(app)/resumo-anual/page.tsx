"use client";

import { useEffect, useState, Suspense } from "react";
import { motion } from "framer-motion";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { PageTransition } from "@/components/shared/page-transition";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MoneyValue } from "@/components/shared/money-value";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import { ArrowUpRight, ArrowDownRight, FileText, TrendingUp, TrendingDown, Wallet, CalendarRange, ChevronLeft, ChevronRight } from "lucide-react";

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
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

function YearSelector() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentYearParam = searchParams.get("year");
  const currentYear = currentYearParam ? parseInt(currentYearParam) : new Date().getFullYear();

  const handlePreviousYear = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("year", (currentYear - 1).toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleNextYear = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("year", (currentYear + 1).toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" className="w-8 h-8" onClick={handlePreviousYear}>
        <ChevronLeft className="w-4 h-4" />
      </Button>
      <div className="flex items-center gap-2 justify-center min-w-[80px]">
        <span className="text-sm font-semibold whitespace-nowrap">{currentYear}</span>
      </div>
      <Button variant="outline" size="icon" className="w-8 h-8" onClick={handleNextYear}>
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
}

function ResumoAnualContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<MonthSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [yearTotal, setYearTotal] = useState({ income: 0, expenses: 0, balance: 0, invested: 0 });

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

  function calculateTotals(months: MonthSummary[]) {
    const income = months.reduce((s, m) => s + m.income, 0);
    const expenses = months.reduce((s, m) => s + m.expenses, 0);
    const invested = months.reduce((s, m) => s + (m.invested ?? 0), 0);
    setYearTotal({ income, expenses, balance: income - expenses, invested });
  }

  return (
    <PageTransition>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Resumo Anual</h1>
          <p className="text-sm text-muted-foreground">
            Acompanhamento mês a mês das suas finanças
          </p>
        </div>
        <div className="flex-1 flex justify-end">
          <YearSelector />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
            <div key={i} className="h-44 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Totais do Ano e Meses de Destaque */}
          {(() => {
            const hasDataMonths = data.filter(d => d.income > 0 || d.expenses > 0);
            const bestIncomeMonth = hasDataMonths.length > 0 ? hasDataMonths.reduce((p, c) => p.income > c.income ? p : c) : null;
            const worstExpenseMonth = hasDataMonths.length > 0 ? hasDataMonths.reduce((p, c) => p.expenses > c.expenses ? p : c) : null;

             return (
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                {/* Entradas */}
                <Card className="p-6 col-span-1 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between p-0 pb-3">
                    <CardTitle className="text-muted-foreground font-semibold">Entradas do Ano</CardTitle>
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-success/10">
                      <TrendingUp className="h-4 w-4 text-success" />
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <MoneyValue value={yearTotal.income} className="text-2xl font-bold" />
                  </CardContent>
                </Card>

                <Card className="p-6 col-span-1 border-success/30 bg-success/5 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between p-0 pb-3">
                    <CardTitle className="text-success font-semibold">Maior Entrada</CardTitle>
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-success/20">
                      <TrendingUp className="h-4 w-4 text-success" />
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    {bestIncomeMonth ? (
                      <div className="flex flex-col gap-1">
                        <span className="text-2xl font-bold text-success">{bestIncomeMonth.monthName}</span>
                        <span className="text-sm font-medium text-success/80">{formatCurrency(bestIncomeMonth.income)}</span>
                      </div>
                    ) : (
                      <span className="text-2xl font-bold text-muted-foreground">-</span>
                    )}
                  </CardContent>
                </Card>

                {/* Saídas */}
                <Card className="p-6 col-span-1 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between p-0 pb-3">
                    <CardTitle className="text-muted-foreground font-semibold">Saídas do Ano</CardTitle>
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
                      <TrendingDown className="h-4 w-4 text-destructive" />
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <MoneyValue value={yearTotal.expenses} className="text-2xl font-bold" />
                  </CardContent>
                </Card>

                <Card className="p-6 col-span-1 border-destructive/30 bg-destructive/5 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between p-0 pb-3">
                    <CardTitle className="text-destructive font-semibold">Maior Saída</CardTitle>
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-destructive/20">
                      <TrendingDown className="h-4 w-4 text-destructive" />
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    {worstExpenseMonth ? (
                      <div className="flex flex-col gap-1">
                        <span className="text-2xl font-bold text-destructive">{worstExpenseMonth.monthName}</span>
                        <span className="text-sm font-medium text-destructive/80">{formatCurrency(worstExpenseMonth.expenses)}</span>
                      </div>
                    ) : (
                      <span className="text-2xl font-bold text-muted-foreground">-</span>
                    )}
                  </CardContent>
                </Card>

                {/* Saldo e Investimentos */}
                <Card className="p-6 col-span-2 lg:col-span-1 border-primary shadow-sm bg-primary/5 flex flex-col justify-between">
                  <div>
                    <CardHeader className="flex flex-row items-center justify-between p-0 pb-3">
                      <CardTitle className="font-extrabold text-primary">Balanço do Ano</CardTitle>
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/20">
                        <Wallet className="h-4 w-4 text-primary" />
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className={`money font-bold text-3xl drop-shadow-sm ${yearTotal.balance >= 0 ? "text-primary" : "text-destructive"}`}>
                        {formatCurrency(yearTotal.balance)}
                      </div>
                    </CardContent>
                  </div>
                  <div className="flex justify-between items-center text-xs font-semibold text-primary mt-4 pt-3 border-t border-primary/20">
                    <span>Aportes Salvos</span>
                    <span>{formatCurrency(yearTotal.invested)}</span>
                  </div>
                </Card>
              </div>
            );
          })()}

          <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {data.map((month) => (
              <motion.div key={month.monthNumber} variants={itemVariants}>
                <Card className="h-full hover:shadow-sm transition-shadow">
                  <CardHeader className="p-4 pb-2 border-b bg-muted/30">
                    <CardTitle className="text-base flex justify-between items-center">
                      {month.monthName}
                      <span className={`text-sm ${month.balance >= 0 ? "text-success" : "text-destructive"}`}>
                        {formatCurrency(month.balance)}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between items-center relative z-10">
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <ArrowUpRight className="w-3 h-3 text-success" />
                        Receitas
                      </div>
                      <span className="text-sm font-semibold">{formatCurrency(month.income)}</span>
                    </div>
                    <div className="flex justify-between items-center relative z-10">
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <ArrowDownRight className="w-3 h-3 text-destructive" />
                        Despesas
                      </div>
                      <span className="text-sm font-semibold">{formatCurrency(month.expenses)}</span>
                    </div>
                    {month.invested != null && month.invested > 0 && (
                      <div className="flex justify-between items-center pt-2 relative z-10 border-t border-border/50">
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <ArrowUpRight className="w-3 h-3 text-primary" />
                          Aportes Investimentos
                        </div>
                        <span className="text-sm font-semibold text-primary">{formatCurrency(month.invested)}</span>
                      </div>
                    )}
                    {month.topIncomeCategory && (
                      <div className="pt-2 mt-2 border-t border-border/50 relative z-10 text-[11px] text-muted-foreground flex justify-between">
                        <span>Maior entrada: <strong className="text-success">{month.topIncomeCategory}</strong></span>
                        <span className="font-semibold">{formatCurrency(month.topIncomeAmount!)}</span>
                      </div>
                    )}
                    {month.topExpenseCategory && (
                      <div className="pt-1 relative z-10 text-[11px] text-muted-foreground flex justify-between">
                        <span>Maior saída: <strong className="text-destructive">{month.topExpenseCategory}</strong></span>
                        <span className="font-semibold">{formatCurrency(month.topExpenseAmount!)}</span>
                      </div>
                    )}
                  </CardContent>
                  <div className="p-4 pt-0 mt-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs font-medium bg-transparent hover:bg-muted/50 transition-colors"
                      onClick={() => {
                        const params = new URLSearchParams();
                        params.set("month", month.monthNumber.toString());
                        params.set("year", month.year.toString());
                        router.push(`/extrato?${params.toString()}`);
                      }}
                    >
                      <FileText className="w-3 h-3 mr-2" />
                      Extrato do Mês
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </>
      )}
    </PageTransition>
  );
}

export default function ResumoAnualPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Carregando Resumo...</div>}>
      <ResumoAnualContent />
    </Suspense>
  );
}
