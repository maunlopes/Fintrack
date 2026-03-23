"use client";

import { useState, useEffect, use } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, TrendingUp, HandCoins, ArrowDownCircle, ArrowUpCircle, Pencil, Trash2 } from "lucide-react";
import { PageTransition } from "@/components/shared/page-transition";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { MoneyValue } from "@/components/shared/money-value";
import { EmptyState } from "@/components/shared/empty-state";
import { AnimatedCard, listVariants, listItemVariants } from "@/components/shared/animated-card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/shared/currency-input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, formatDate } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { z } from "zod";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const transactionSchema = z.object({
  type: z.enum(["DEPOSIT", "WITHDRAWAL", "YIELD", "DIVIDEND"]),
  amount: z.coerce.number().min(0.01, "Valor deve ser maior que zero"),
  date: z.string(),
  bankAccountId: z.string().optional(),
  description: z.string().optional(),
  isRecurring: z.boolean().default(false),
});

type TransactionInput = {
  type: "DEPOSIT" | "WITHDRAWAL" | "YIELD" | "DIVIDEND";
  amount: number;
  date: string;
  bankAccountId?: string;
  description?: string;
  isRecurring: boolean;
};

interface InvestmentTransaction {
  id: string;
  type: "DEPOSIT" | "WITHDRAWAL" | "YIELD" | "DIVIDEND";
  amount: string;
  date: string;
  description: string | null;
  bankAccountId: string | null;
  isRecurring: boolean;
}

interface InvestmentDetail {
  id: string;
  name: string;
  type: string;
  institution: string;
  balance: string;
  color: string;
  transactions: InvestmentTransaction[];
}

const TYPE_LABELS: Record<string, string> = {
  DEPOSIT: "Aporte (Investir Mais)",
  WITHDRAWAL: "Resgate (Tirar Dinheiro)",
  YIELD: "Rendimento (Juros)",
  DIVIDEND: "Dividendo (Proventos)",
};

export default function InvestmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;

  const [investment, setInvestment] = useState<InvestmentDetail | null>(null);
  const [bankAccounts, setBankAccounts] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTx, setEditTx] = useState<InvestmentTransaction | null>(null);
  const [deleteTxId, setDeleteTxId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const form = useForm<TransactionInput>({
    resolver: zodResolver(transactionSchema) as any,
    defaultValues: {
      type: "DEPOSIT",
      amount: 0,
      date: new Date().toISOString().split("T")[0],
      isRecurring: false,
      bankAccountId: "",
      description: "",
    },
  });

  const transactionType = form.watch("type");

  async function fetchData() {
    try {
      const [invRes, accountsRes] = await Promise.all([
        fetch(`/api/investimentos/${id}`),
        fetch("/api/contas"),
      ]);
      if (invRes.ok) setInvestment(await invRes.json());
      else setInvestment(null);
      if (accountsRes.ok) setBankAccounts(await accountsRes.json());
    } catch (e) {
      console.error(e);
      setInvestment(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchData(); }, [id]);

  function openNew() {
    setEditTx(null);
    form.reset({
      type: "DEPOSIT",
      amount: 0,
      date: new Date().toISOString().split("T")[0],
      isRecurring: false,
      bankAccountId: "",
      description: "",
    });
    setDialogOpen(true);
  }

  function openEdit(tx: InvestmentTransaction) {
    setEditTx(tx);
    form.reset({
      type: tx.type,
      amount: Number(tx.amount),
      date: tx.date.split("T")[0],
      isRecurring: tx.isRecurring,
      bankAccountId: tx.bankAccountId ?? "",
      description: tx.description ?? "",
    });
    setDialogOpen(true);
  }

  async function onSubmit(data: TransactionInput) {
    const payload = {
      ...data,
      bankAccountId: data.bankAccountId === "" ? undefined : data.bankAccountId,
    };

    try {
      const url = editTx
        ? `/api/investimentos/${id}/transacoes/${editTx.id}`
        : `/api/investimentos/${id}/transacoes`;
      const method = editTx ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error();

      toast.success(editTx ? "Movimentação atualizada!" : "Movimentação registrada!");
      setDialogOpen(false);
      form.reset();
      fetchData();
    } catch {
      toast.error(editTx ? "Erro ao atualizar movimentação." : "Erro ao registrar movimentação.");
    }
  }

  async function handleDelete() {
    if (!deleteTxId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/investimentos/${id}/transacoes/${deleteTxId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Movimentação removida!");
      fetchData();
    } catch {
      toast.error("Erro ao remover movimentação.");
    } finally {
      setDeleting(false);
      setDeleteTxId(null);
    }
  }

  const getTypeVisuals = (type: string) => {
    switch (type) {
      case "DEPOSIT":    return { label: "Aporte",     color: "text-primary",     icon: ArrowDownCircle };
      case "WITHDRAWAL": return { label: "Resgate",    color: "text-destructive", icon: ArrowUpCircle };
      case "YIELD":      return { label: "Rendimento", color: "text-success",     icon: TrendingUp };
      case "DIVIDEND":   return { label: "Dividendo",  color: "text-success",     icon: HandCoins };
      default:           return { label: type,         color: "text-foreground",  icon: ArrowDownCircle };
    }
  };

  if (loading) return <div className="p-8"><Skeleton className="h-40 w-full" /></div>;
  if (!investment) return <div className="p-8 text-center">Investimento não encontrado</div>;

  return (
    <PageTransition>
      <div className="flex flex-col gap-6 pb-24">

        <div>
          <Breadcrumb items={[
            { label: "Investimentos", href: "/investimentos" },
            { label: investment.name },
          ]} />
          <h1 className="text-2xl font-bold tracking-tight line-clamp-1">{investment.name}</h1>
          <p className="text-sm text-muted-foreground">{investment.institution}</p>
        </div>

        <AnimatedCard className="border border-primary/20 bg-gradient-to-br from-primary/10 to-transparent rounded-xl overflow-hidden p-6 flex flex-col justify-between items-start sm:items-center sm:flex-row gap-6">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Saldo Atual</p>
            <MoneyValue value={Number(investment.balance)} className="text-4xl font-black text-foreground" />
          </div>
          <Button onClick={openNew}>
            <Plus className="size-4 mr-2" /> Movimentação
          </Button>
        </AnimatedCard>

        {/* New / Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle>{editTx ? "Editar Movimentação" : "Lançar Movimentação"}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="type" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Movimentação</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue>
                            {field.value ? TYPE_LABELS[field.value] : "Selecione..."}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DEPOSIT">Aporte (Investir Mais)</SelectItem>
                          <SelectItem value="WITHDRAWAL">Resgate (Tirar Dinheiro)</SelectItem>
                          <SelectItem value="YIELD">Rendimento (Juros)</SelectItem>
                          <SelectItem value="DIVIDEND">Dividendo (Proventos)</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormItem>
                )} />

                <FormField control={form.control} name="amount" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor</FormLabel>
                    <FormControl>
                      <CurrencyInput value={field.value} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="date" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                  </FormItem>
                )} />

                {(transactionType === "DEPOSIT" || transactionType === "WITHDRAWAL") && (
                  <FormField control={form.control} name="bankAccountId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Conta Bancária de {transactionType === "DEPOSIT" ? "Origem (de onde sai o dinheiro)" : "Destino (onde cai o resgate)"}
                      </FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a conta bancária">
                              {field.value
                                ? bankAccounts.find((b) => b.id === field.value)?.name
                                : "Selecione a conta bancária"}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {bankAccounts.map((b) => (
                              <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                    </FormItem>
                  )} />
                )}

                {transactionType === "DEPOSIT" && (
                  <FormField control={form.control} name="isRecurring" render={({ field }) => (
                    <FormItem className="flex items-center gap-3 bg-muted/50 p-3 rounded-lg border border-border">
                      <FormLabel className="mt-0">Aporte Recorrente?</FormLabel>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )} />
                )}

                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observação (Opcional)</FormLabel>
                    <FormControl><Textarea placeholder="ex: Décimo Terceiro" {...field} /></FormControl>
                  </FormItem>
                )} />

                <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? (editTx ? "Salvando..." : "Lançando...") : (editTx ? "Salvar alterações" : "Registrar")}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Delete confirmation */}
        <AlertDialog open={!!deleteTxId} onOpenChange={(o) => !o && setDeleteTxId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remover movimentação?</AlertDialogTitle>
              <AlertDialogDescription>
                O saldo do investimento será revertido. Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-white">
                {deleting ? "Removendo..." : "Remover"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Transaction list */}
        <div>
          <h2 className="text-xl font-bold tracking-tight mb-4">Histórico de Transações</h2>
          {investment.transactions.length === 0 ? (
            <EmptyState title="Nenhuma transação" description="Seu histórico de aportes e resgates aparecerá aqui." illustration="investments" />
          ) : (
            <motion.div variants={listVariants} initial="hidden" animate="show" className="space-y-3">
              {investment.transactions.map((t) => {
                const visual = getTypeVisuals(t.type);
                const isPositive = t.type === "DEPOSIT" || t.type === "YIELD" || t.type === "DIVIDEND";

                return (
                  <motion.div key={t.id} variants={listItemVariants}>
                    <AnimatedCard className="border bg-card rounded-xl p-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className={`p-2 rounded-full bg-muted shrink-0 ${visual.color}`}>
                          <visual.icon className="size-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold">{visual.label}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {formatDate(t.date)}{t.description ? ` · ${t.description}` : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <MoneyValue
                          value={Number(t.amount)}
                          className={`font-bold ${isPositive ? "text-success" : "text-destructive"}`}
                        />
                        <div className="flex items-center pl-2 border-l border-border/60">
                          <Tooltip>
                            <TooltipTrigger>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                onClick={() => openEdit(t)}
                              >
                                <Pencil className="size-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Editar movimentação</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                onClick={() => setDeleteTxId(t.id)}
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Remover movimentação</TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    </AnimatedCard>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>

      </div>
    </PageTransition>
  );
}
