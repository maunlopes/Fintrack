"use client";

import { useState, useEffect, Suspense, use } from "react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, TrendingUp, TrendingDown, Tag, Wallet } from "lucide-react";

import { PageTransition } from "@/components/shared/page-transition";
import { MonthSelector } from "@/components/shared/month-selector";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { MoneyValue } from "@/components/shared/money-value";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { listVariants, listItemVariants } from "@/components/shared/animated-card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LinkButton } from "@/components/shared/link-button";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn, radialGradient } from "@/lib/utils";
import { getBankIcon } from "@/components/ui/brand-icons";
import { Skeleton } from "@/components/ui/skeleton";

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

interface BankAccount {
  id: string;
  name: string;
  nickname: string;
  type: string;
  balance: string;
  color: string;
}

function ContaExtratoContent({ id }: { id: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [account, setAccount] = useState<BankAccount | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "PAID" | "PENDING">("ALL");

  async function fetchData() {
    setLoading(true);
    try {
      // Fetch Account Data
      const accRes = await fetch(`/api/contas/${id}`);
      if (!accRes.ok) throw new Error("Conta não encontrada");
      const accData = await accRes.json();
      setAccount(accData);

      // Fetch Statement Data
      const params = new URLSearchParams(searchParams.toString());
      if (!params.has("month")) params.set("month", (new Date().getMonth() + 1).toString());
      if (!params.has("year")) params.set("year", new Date().getFullYear().toString());

      const res = await fetch(`/api/contas/${id}/extrato?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
        setSummary(data.summary || null);
      }
    } catch (e) {
      console.error(e);
      // Let it handle gracefully, maybe show a toast or empty state
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, [searchParams, id]);

  const filteredTransactions = transactions.filter((t) => {
    if (filter === "ALL") return true;
    if (filter === "PAID") return t.status === "PAID";
    return t.status !== "PAID";
  });

  const monthParam = searchParams.get("month");
  const yearParam = searchParams.get("year");
  const isPastMonth = monthParam && yearParam && (
    Number(yearParam) < new Date().getFullYear() || 
    (Number(yearParam) === new Date().getFullYear() && Number(monthParam) < new Date().getMonth() + 1)
  );

  if (loading && !account) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  if (!loading && !account) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h2 className="text-2xl font-bold mb-2">Conta não encontrada</h2>
        <p className="text-muted-foreground mb-6">Esta conta não existe ou foi removida.</p>
        <LinkButton href="/contas" variant="default">
          Voltar para Contas
        </LinkButton>
      </div>
    );
  }

  return (
    <PageTransition>
      {/* HEADER BREADCRUMB */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <LinkButton href="/contas" variant="ghost" size="icon" className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </LinkButton>
          <div className="flex items-center gap-3">
            {account && (
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center p-2 border border-border bg-card shadow-sm shrink-0"
              >
                {getBankIcon(account.name, "w-full h-full object-contain")}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{account?.nickname}</h1>
              <p className="text-sm text-muted-foreground">Extrato da Conta • {account?.name}</p>
            </div>
          </div>
        </div>
        <div className="flex-1 w-full sm:w-auto flex justify-end">
          <MonthSelector />
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <Card className="border-l-4 border-l-success" style={radialGradient("success")}>
          <CardHeader>
            <CardDescription className="text-success-label">Entradas do Mês</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums font-numbers text-success-dark">
              {formatCurrency((summary?.incomePaid || 0) + (summary?.incomePending || 0))}
            </CardTitle>
          </CardHeader>
          <CardFooter className="text-xs text-muted-foreground">
            {formatCurrency(summary?.incomePaid || 0)} Recebido
          </CardFooter>
        </Card>

        <Card className="border-l-4 border-l-destructive" style={radialGradient("destructive")}>
          <CardHeader>
            <CardDescription className="text-destructive">Saídas do Mês</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums font-numbers text-destructive">
              {formatCurrency((summary?.expensePaid || 0) + (summary?.expensePending || 0))}
            </CardTitle>
          </CardHeader>
          <CardFooter className="text-xs text-muted-foreground">
            {formatCurrency(summary?.expensePaid || 0)} Pago
          </CardFooter>
        </Card>

        <Card className={cn(
          "sm:col-span-2 lg:col-span-1 border-l-4",
          (summary?.projectedBalance || 0) >= 0 ? "border-l-success" : "border-l-destructive"
        )}>
          <CardHeader>
            <CardDescription>{isPastMonth ? "Saldo Final no Mês" : "Saldo Projetado no Mês"}</CardDescription>
            <CardTitle className={cn(
              "text-3xl font-black tabular-nums font-numbers",
              (summary?.projectedBalance || 0) >= 0 ? "text-success" : "text-destructive"
            )}>
              {formatCurrency(summary?.projectedBalance || 0)}
            </CardTitle>
          </CardHeader>
          <CardFooter className="text-xs text-muted-foreground">
            Saldo Atual: {formatCurrency(parseFloat(account?.balance || "0"))}
          </CardFooter>
        </Card>
      </div>

      {/* FILTERS */}
      <div className="mb-6">
        <Tabs value={filter} onValueChange={(val) => setFilter(val as any)}>
          <TabsList>
            <TabsTrigger value="ALL">Tudo</TabsTrigger>
            <TabsTrigger value="PAID">Liquidado</TabsTrigger>
            <TabsTrigger value="PENDING">Previsto</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* TRANSACTIONS LIST */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : filteredTransactions.length === 0 ? (
        <EmptyState
          illustration="transactions"
          title="Nenhuma movimentação"
          description={filter === "ALL" ? "Não há registros para esta conta no mês selecionado." : "Nenhuma movimentação com este status."}
        />
      ) : (
        <motion.div variants={listVariants} initial="hidden" animate="show" className="space-y-2">
          {filteredTransactions.map((tx) => {
            const isIncome = tx.type === "INCOME";
            return (
              <motion.div key={tx.id} variants={listItemVariants}>
                <Card className="hover:shadow-sm transition-shadow">
                  <CardContent className="py-3 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div
                        className="w-1 h-10 rounded-full flex-shrink-0"
                        style={{ backgroundColor: tx.status === "PAID" ? (isIncome ? 'var(--success)' : 'var(--foreground)') : tx.status === "OVERDUE" ? 'var(--destructive)' : 'var(--warning)' }}
                      />
                      <div
                        className="w-9 h-9 flex items-center justify-center rounded-full text-white text-xs font-bold flex-shrink-0"
                        style={{ backgroundColor: tx.category?.color || (isIncome ? "var(--success)" : "var(--muted-foreground)") }}
                      >
                        {tx.category?.name?.[0] || "?"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{tx.description}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-2">
                          {formatDate(tx.date)}
                          <span className="flex items-center gap-1">
                            <span
                              className="w-1.5 h-1.5 rounded-full inline-block"
                              style={{ backgroundColor: tx.category?.color || "var(--muted-foreground)" }}
                            />
                            {tx.category?.name}
                          </span>
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-1 mt-3 sm:mt-0 border-t sm:border-0 pt-3 sm:pt-0 shrink-0">
                      <StatusBadge status={tx.status} type={isIncome ? "income" : "expense"} />
                      <span className={`text-lg tracking-tight font-bold tabular-nums ${isIncome ? 'text-success' : 'text-foreground'}`}>
                        {isIncome ? "+" : "-"}{formatCurrency(tx.amount)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </PageTransition>
  );
}

export default function ContaStatementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Carregando...</div>}>
      <ContaExtratoContent id={id} />
    </Suspense>
  );
}
