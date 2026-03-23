"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Landmark, Wallet, PiggyBank, TrendingUp, Pencil, Trash2 } from "lucide-react";
import { BankAccountType } from "@prisma/client";
import { PageTransition } from "@/components/shared/page-transition";
import { AnimatedCard, cardVariants, cardItemVariants } from "@/components/shared/animated-card";
import { EmptyState } from "@/components/shared/empty-state";
import { MoneyValue } from "@/components/shared/money-value";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/shared/currency-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { bankAccountSchema, BankAccountInput } from "@/lib/validations/bank-account";
import { formatCurrency, BANK_NAMES } from "@/lib/format";
import { getBankIcon, BankName } from "@/components/ui/brand-icons";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const typeLabels: Record<BankAccountType, string> = {
  CHECKING: "Conta Corrente",
  SAVINGS: "Poupança",
  INVESTMENT: "Investimento",
};

const typeIcons: Record<BankAccountType, React.ElementType> = {
  CHECKING: Wallet,
  SAVINGS: PiggyBank,
  INVESTMENT: TrendingUp,
};

interface BankAccount {
  id: string;
  name: string;
  nickname: string;
  type: BankAccountType;
  balance: string;
  color: string;
}

function AccountForm({
  onSuccess,
  defaultValues,
}: {
  onSuccess: () => void;
  defaultValues?: Partial<BankAccountInput & { id: string }>;
}) {
  const form = useForm<BankAccountInput, any, BankAccountInput>({
    resolver: zodResolver(bankAccountSchema) as any,
    defaultValues: {
      name: defaultValues?.name ?? "",
      nickname: defaultValues?.nickname ?? "",
      type: defaultValues?.type ?? "CHECKING",
      balance: defaultValues?.balance ?? 0,
      color: defaultValues?.color ?? "#075056",
    },
  });

  async function onSubmit(data: BankAccountInput) {
    const url = defaultValues?.id ? `/api/contas/${defaultValues.id}` : "/api/contas";
    const method = defaultValues?.id ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      toast.error("Erro ao salvar conta");
      return;
    }

    toast.success(defaultValues?.id ? "Conta atualizada!" : "Conta criada!");
    onSuccess();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Banco</FormLabel>
              <FormControl>
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue>
                      {field.value ? (
                        <div className="flex items-center gap-2">
                          {getBankIcon(field.value, "w-4 h-4")}
                          <span>{field.value}</span>
                        </div>
                      ) : "Selecione o banco"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {BANK_NAMES.map((b) => (
                      <SelectItem key={b} value={b}>
                        <div className="flex items-center gap-2">
                          {getBankIcon(b, "w-4 h-4")}
                          <span>{b}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="nickname"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Apelido</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Conta Salário" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo</FormLabel>
              <FormControl>
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger><SelectValue>{field.value ? typeLabels[field.value as BankAccountType] : "Selecione..."}</SelectValue></SelectTrigger>
                  <SelectContent>
                    {Object.entries(typeLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="balance"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Saldo atual</FormLabel>
              <FormControl>
                <CurrencyInput value={field.value} onChange={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cor</FormLabel>
              <FormControl>
                <div className="flex gap-2 items-center">
                  <Input type="color" className="w-12 h-9 p-1 cursor-pointer" {...field} />
                  <Input placeholder="#075056" {...field} />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <motion.div whileTap={{ scale: 0.97 }}>
          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Salvando..." : "Salvar"}
          </Button>
        </motion.div>
      </form>
    </Form>
  );
}

export default function ContasPage() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editAccount, setEditAccount] = useState<BankAccount | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  async function fetchAccounts() {
    try {
      const res = await fetch("/api/contas");
      if (res.ok) {
        const data = await res.json();
        setAccounts(data);
      } else {
        setAccounts([]);
      }
    } catch {
      setAccounts([]);
    }
    setLoading(false);
  }

  useEffect(() => { fetchAccounts(); }, []);

  const totalBalance = accounts.reduce((sum, a) => sum + parseFloat(a.balance), 0);

  async function handleDelete() {
    if (!deleteId) return;
    const res = await fetch(`/api/contas/${deleteId}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Conta removida");
      fetchAccounts();
    } else {
      toast.error("Erro ao remover conta");
    }
    setDeleteId(null);
  }

  return (
    <PageTransition>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contas Bancárias</h1>
          <p className="text-muted-foreground text-sm">
            Saldo total: <MoneyValue value={totalBalance} animate={false} className="text-sm" />
          </p>
        </div>
        <motion.div whileTap={{ scale: 0.97 }}>
          <Button onClick={() => { setEditAccount(null); setDialogOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" /> Nova Conta
          </Button>
        </motion.div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <EmptyState
          icon={Landmark}
          title="Nenhuma conta cadastrada"
          description="Adicione uma conta bancária para começar a controlar seu saldo."
          actionLabel="Adicionar Conta"
          onAction={() => setDialogOpen(true)}
        />
      ) : (
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {accounts.map((account, i) => {
            const Icon = typeIcons[account.type];
            const balance = parseFloat(account.balance);
            return (
              <motion.div key={account.id} variants={cardItemVariants}>
                <Card className="overflow-hidden">
                  <div className="h-2" style={{ backgroundColor: account.color }} />
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center p-1.5 border border-border bg-card shadow-sm"
                        >
                          {getBankIcon(account.name, "w-full h-full object-contain")}
                        </div>
                        <div>
                          <CardTitle className="text-sm font-semibold">{account.nickname}</CardTitle>
                          <p className="text-xs text-muted-foreground">{account.name}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {typeLabels[account.type]}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <MoneyValue
                      value={balance}
                      colored
                      className={`text-2xl ${balance < 0 ? "text-destructive" : ""}`}
                    />
                    <div className="flex gap-2 mt-4">
                      <Link href={`/contas/${account.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          Ver Extrato
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { setEditAccount(account); setDialogOpen(true); }}
                      >
                        <Pencil className="w-3 h-3 mr-1" /> Editar
                      </Button>
                      <Tooltip>
                        <TooltipTrigger>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleteId(account.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Remover conta</TooltipContent>
                      </Tooltip>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <DialogHeader>
              <DialogTitle>{editAccount ? "Editar Conta" : "Nova Conta Bancária"}</DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              <AccountForm
                defaultValues={editAccount ? { ...editAccount, balance: parseFloat(editAccount.balance) } : undefined}
                onSuccess={() => { setDialogOpen(false); fetchAccounts(); }}
              />
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover conta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A conta será desativada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageTransition>
  );
}
