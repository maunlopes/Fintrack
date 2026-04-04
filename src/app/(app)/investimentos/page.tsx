"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { TrendingUp, TrendingDown, Plus, Building2, Landmark, LineChart, Coins, ShieldCheck, Wallet, Search } from "lucide-react";

import { PageTransition } from "@/components/shared/page-transition";
import { MoneyValue } from "@/components/shared/money-value";
import { EmptyState } from "@/components/shared/empty-state";
import { LinkButton } from "@/components/shared/link-button";
import { AnimatedCard, listVariants, listItemVariants } from "@/components/shared/animated-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/shared/currency-input";
import { formatCurrency } from "@/lib/format";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { z } from "zod";
import { cn, radialGradient } from "@/lib/utils";
import dynamic from "next/dynamic";

const InvestmentAllocationChart = dynamic(
  () => import("@/components/dashboard/investment-allocation-chart").then((m) => m.InvestmentAllocationChart),
  { ssr: false, loading: () => <div className="h-[260px] w-full bg-muted animate-pulse rounded-lg" /> }
);

const investmentSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  institution: z.string().min(1, "Instituição é obrigatória"),
  type: z.enum([
    "FIXED_INCOME",
    "VARIABLE_INCOME",
    "STOCKS",
    "FUNDS",
    "CRYPTO",
    "PENSION",
  ]),
  balance: z.coerce.number().min(0, "Saldo não pode ser negativo"),
  color: z.string().default("#2563EB"),
});

type InvestmentInput = z.infer<typeof investmentSchema>;

interface Investment {
  id: string;
  name: string;
  type: string;
  institution: string;
  balance: string;
  color: string;
  totalDeposited?: number;
}

const INVESTMENT_TYPES = {
  FIXED_INCOME:    { label: "Renda Fixa",      icon: Landmark  },
  VARIABLE_INCOME: { label: "Renda Variável",  icon: TrendingUp },
  STOCKS:          { label: "Ações",           icon: LineChart  },
  FUNDS:           { label: "Fundos",          icon: Building2  },
  CRYPTO:          { label: "Criptomoedas",    icon: Coins      },
  PENSION:         { label: "Previdência",     icon: ShieldCheck },
};

const TYPE_FILTERS = [
  { value: "ALL", label: "Todos" },
  ...Object.entries(INVESTMENT_TYPES).map(([key, def]) => ({ value: key, label: def.label })),
];

export default function InvestimentosPage() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  const form = useForm<InvestmentInput>({
    resolver: zodResolver(investmentSchema) as any,
    defaultValues: { name: "", institution: "", type: "FIXED_INCOME", balance: 0, color: "#2563EB" },
  });

  async function fetchInvestments() {
    try {
      const res = await fetch("/api/investimentos");
      if (res.ok) {
        const data = await res.json();
        setInvestments(data);
      } else {
        setInvestments([]);
      }
    } catch {
      setInvestments([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchInvestments(); }, []);

  async function onSubmit(data: InvestmentInput) {
    try {
      const res = await fetch("/api/investimentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      toast.success("Investimento criado com sucesso!");
      setDialogOpen(false);
      form.reset();
      fetchInvestments();
    } catch {
      toast.error("Erro ao criar investimento");
    }
  }

  // Computed totals
  const totalBalance   = investments.reduce((s, i) => s + Number(i.balance), 0);
  const totalDeposited = investments.reduce((s, i) => s + (i.totalDeposited ?? Number(i.balance)), 0);
  const totalProfit    = totalBalance - totalDeposited;
  const profitPct      = totalDeposited > 0 ? ((totalProfit / totalDeposited) * 100).toFixed(1) : "0.0";

  const filtered = investments.filter((i) => {
    const typeOk = typeFilter === "ALL" || i.type === typeFilter;
    const searchOk = !search || i.name.toLowerCase().includes(search.toLowerCase()) || i.institution.toLowerCase().includes(search.toLowerCase());
    return typeOk && searchOk;
  });

  return (
    <PageTransition>
      <div className="flex flex-col gap-6 pb-24">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Investimentos</h1>
            <p className="text-sm text-muted-foreground">Controle e acompanhe sua carteira</p>
          </div>
          <Button className="w-full sm:w-auto" onClick={() => setDialogOpen(true)}>
            <Plus className="size-4 mr-2" />
            Novo Investimento
          </Button>
        </div>

        {/* Chart + Summary cards */}
        {!loading && investments.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left: Allocation chart */}
            {investments.length > 1 && (() => {
              const byType = investments.reduce<Record<string, number>>((acc, inv) => {
                acc[inv.type] = (acc[inv.type] || 0) + Number(inv.balance);
                return acc;
              }, {});
              const chartData = Object.entries(byType)
                .filter(([, v]) => v > 0)
                .map(([type, value]) => ({
                  name: INVESTMENT_TYPES[type as keyof typeof INVESTMENT_TYPES]?.label ?? type,
                  value,
                  type,
                }));
              if (chartData.length < 2) return null;
              return (
                <Card className="p-6 shadow-sm">
                  <CardHeader className="p-0 pb-2">
                    <CardTitle className="text-muted-foreground font-semibold">Alocação da carteira</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <InvestmentAllocationChart data={chartData} />
                  </CardContent>
                </Card>
              );
            })()}

            {/* Right: 3 KPI cards stacked */}
            <div className="flex flex-col gap-4">
              <Card className="border-l-4 border-l-primary flex-1" style={radialGradient("primary")}>
                <CardHeader>
                  <CardDescription>Total investido</CardDescription>
                  <CardTitle className="text-2xl font-semibold tabular-nums font-numbers">
                    {formatCurrency(totalBalance)}
                  </CardTitle>
                </CardHeader>
              </Card>

              <Card className="border-l-4 border-l-primary flex-1">
                <CardHeader>
                  <CardDescription>Total aportado</CardDescription>
                  <CardTitle className="text-2xl font-semibold tabular-nums font-numbers">
                    {formatCurrency(totalDeposited)}
                  </CardTitle>
                </CardHeader>
              </Card>

              <Card className={`border-l-4 flex-1 ${totalProfit >= 0 ? 'border-l-success' : 'border-l-destructive'}`} style={radialGradient(totalProfit >= 0 ? "success" : "destructive")}>
                <CardHeader>
                  <CardDescription>Rentabilidade</CardDescription>
                  <div className="flex items-baseline gap-2">
                    <CardTitle className={`text-2xl font-semibold tabular-nums font-numbers ${totalProfit >= 0 ? "text-success" : "text-destructive"}`}>
                      {formatCurrency(totalProfit)}
                    </CardTitle>
                    <span className={`text-sm font-semibold ${totalProfit >= 0 ? "text-success" : "text-destructive"}`}>
                      {totalProfit >= 0 ? "+" : ""}{profitPct}%
                    </span>
                  </div>
                </CardHeader>
              </Card>
            </div>
          </div>
        )}

        {/* Filters */}
        {!loading && investments.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
            <Tabs value={typeFilter} onValueChange={setTypeFilter}>
              <TabsList className="flex-wrap h-auto gap-1 bg-muted p-1">
                {TYPE_FILTERS.map((f) => (
                  <TabsTrigger key={f.value} value={f.value} className="text-xs">
                    {f.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <div className="relative flex-1 min-w-[160px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar investimento..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}
          </div>
        ) : investments.length === 0 ? (
          <EmptyState
            title="Nenhum investimento"
            description="Cadastre seus investimentos para acompanhar sua carteira."
            illustration="investments"
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="Nenhum investimento nesta categoria"
            description="Tente selecionar outro tipo de investimento."
            illustration="investments"
          />
        ) : (
          <motion.div
            key={typeFilter}
            variants={listVariants}
            initial="hidden"
            animate="show"
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {filtered.map((inv) => {
              const TypeIcon = INVESTMENT_TYPES[inv.type as keyof typeof INVESTMENT_TYPES]?.icon || TrendingUp;
              const typeLabel = INVESTMENT_TYPES[inv.type as keyof typeof INVESTMENT_TYPES]?.label || inv.type;
              const balance = Number(inv.balance);
              const deposited = inv.totalDeposited ?? balance;
              const profit = balance - deposited;
              const pct = deposited > 0 ? ((profit / deposited) * 100).toFixed(1) : "0.0";
              const isPositive = profit >= 0;

              return (
                <motion.div key={inv.id} variants={listItemVariants}>
                  <AnimatedCard className="border bg-card rounded-xl overflow-hidden flex flex-col h-full hover:border-primary/50 transition-colors">
                    <div className="p-5 flex flex-col h-full gap-4">
                      {/* Top: icon + name */}
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                          <TypeIcon className="size-5" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold tracking-tight text-foreground line-clamp-1">{inv.name}</h3>
                          <p className="text-sm text-muted-foreground">{inv.institution}</p>
                        </div>
                      </div>

                      {/* Bottom: balance + profit */}
                      <div className="mt-auto border-t border-border pt-4 space-y-2">
                        <div className="flex items-end justify-between">
                          <div>
                            <p className="text-xs text-muted-foreground mb-0.5">{typeLabel}</p>
                            <MoneyValue value={balance} className="text-xl font-bold" />
                          </div>
                          <LinkButton href={`/investimentos/${inv.id}`} variant="outline" size="sm">
                            Detalhes
                          </LinkButton>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border/60 pt-2">
                          <span>Aportado: <span className="font-medium text-foreground">{formatCurrency(deposited)}</span></span>
                          <span className={cn("flex items-center gap-1 font-semibold", isPositive ? "text-success" : "text-destructive")}>
                            {isPositive
                              ? <TrendingUp className="size-3.5" />
                              : <TrendingDown className="size-3.5" />}
                            {isPositive ? "+" : ""}{formatCurrency(profit)} ({pct}%)
                          </span>
                        </div>
                      </div>
                    </div>
                  </AnimatedCard>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Criar Investimento</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome (ex: Tesouro Selic)</FormLabel>
                    <FormControl><Input placeholder="Qual o investimento?" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="institution" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instituição / Corretora</FormLabel>
                    <FormControl><Input placeholder="Ex: XP, NuInvest" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="type" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue>
                            {field.value
                              ? INVESTMENT_TYPES[field.value as keyof typeof INVESTMENT_TYPES]?.label
                              : "Selecione..."}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(INVESTMENT_TYPES).map(([key, def]) => (
                            <SelectItem key={key} value={key}>{def.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="balance" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Saldo Atual</FormLabel>
                    <FormControl><CurrencyInput value={field.value} onChange={field.onChange} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="pt-2 flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? "Salvando..." : "Salvar"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  );
}
