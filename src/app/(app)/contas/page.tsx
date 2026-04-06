"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Landmark, Wallet, PiggyBank, TrendingUp, Pencil, Trash2, Search, X, ArrowLeftRight } from "lucide-react";
import { BankAccountType } from "@prisma/client";
import { PageTransition } from "@/components/shared/page-transition";
import { AnimatedCard, cardVariants, cardItemVariants } from "@/components/shared/animated-card";
import { EmptyState } from "@/components/shared/empty-state";
import { MoneyValue } from "@/components/shared/money-value";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/shared/currency-input";
import { ColorPicker } from "@/components/shared/color-picker";
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
                <ColorPicker value={field.value} onChange={field.onChange} />
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

  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [bankFilter, setBankFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");

  const totalBalance = accounts.reduce((sum, a) => sum + parseFloat(a.balance), 0);

  const filteredAccounts = accounts.filter((a) => {
    const typeOk = typeFilter === "ALL" || a.type === typeFilter;
    const bankOk = bankFilter === "ALL" || a.name === bankFilter;
    const searchOk = !search || a.nickname.toLowerCase().includes(search.toLowerCase()) || a.name.toLowerCase().includes(search.toLowerCase());
    return typeOk && bankOk && searchOk;
  });

  const uniqueBanks = Array.from(new Set(accounts.map((a) => a.name))).sort();

  // Transfer state
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferFrom, setTransferFrom] = useState("");
  const [transferTo, setTransferTo] = useState("");
  const [transferAmount, setTransferAmount] = useState(0);
  const [transferDate, setTransferDate] = useState(new Date().toISOString().split("T")[0]);
  const [transferDesc, setTransferDesc] = useState("");
  const [transferSaving, setTransferSaving] = useState(false);

  async function handleTransfer() {
    if (!transferFrom || !transferTo || transferAmount <= 0) return;
    if (transferFrom === transferTo) { toast.error("Contas devem ser diferentes"); return; }
    setTransferSaving(true);
    const res = await fetch("/api/transferencias", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fromAccountId: transferFrom,
        toAccountId: transferTo,
        amount: transferAmount,
        date: new Date(transferDate),
        description: transferDesc || undefined,
      }),
    });
    setTransferSaving(false);
    if (res.ok) {
      toast.success("Transferência realizada!");
      setTransferOpen(false);
      setTransferFrom(""); setTransferTo(""); setTransferAmount(0); setTransferDesc("");
      fetchAccounts();
    } else {
      const e = await res.json();
      toast.error(e.error || "Erro ao transferir");
    }
  }

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
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setTransferOpen(true)}>
            <ArrowLeftRight className="w-4 h-4 mr-2" /> Transferir
          </Button>
          <Button onClick={() => { setEditAccount(null); setDialogOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" /> Nova Conta
          </Button>
        </div>
      </div>

      {/* Filters */}
      {!loading && accounts.length > 0 && (
        <div className="mb-4 flex flex-col sm:flex-row gap-3 flex-wrap">
          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v ?? "ALL")}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue>{typeFilter === "ALL" ? "Todos os tipos" : typeLabels[typeFilter as BankAccountType]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos os tipos</SelectItem>
              <SelectItem value="CHECKING">Conta Corrente</SelectItem>
              <SelectItem value="SAVINGS">Poupança</SelectItem>
              <SelectItem value="INVESTMENT">Investimento</SelectItem>
            </SelectContent>
          </Select>

          {uniqueBanks.length > 1 && (
            <Select value={bankFilter} onValueChange={(v) => setBankFilter(v ?? "ALL")}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue>{bankFilter === "ALL" ? "Todos os bancos" : bankFilter}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos os bancos</SelectItem>
                {uniqueBanks.map((b) => (
                  <SelectItem key={b} value={b}>{b}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <div className="relative flex-1 sm:max-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar conta..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-8"
            />
            {search && (
              <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6" onClick={() => setSearch("")}>
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : filteredAccounts.length === 0 ? (
        <EmptyState
          illustration="accounts"
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
          {filteredAccounts.map((account, i) => {
            const Icon = typeIcons[account.type];
            const balance = parseFloat(account.balance);
            return (
              <motion.div key={account.id} variants={cardItemVariants}>
                <Card className="h-full" style={{ borderLeftWidth: 4, borderLeftColor: account.color }}>
                  <CardHeader className="flex flex-row items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center p-1.5 border border-border bg-card shadow-sm shrink-0">
                        {getBankIcon(account.name, "w-full h-full object-contain")}
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-sm font-semibold truncate">{account.nickname}</CardTitle>
                        <CardDescription className="truncate">{account.name}</CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0">
                      {typeLabels[account.type]}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <p className={`text-2xl font-bold tabular-nums font-numbers ${balance < 0 ? "text-destructive" : ""}`}>
                      {formatCurrency(balance)}
                    </p>
                  </CardContent>
                  <CardFooter className="flex items-center justify-between border-t pt-4">
                    <Link href={`/contas/${account.id}`}>
                      <Button variant="outline" size="sm">
                        Ver extrato
                      </Button>
                    </Link>
                    <div className="flex items-center gap-1">
                      <Tooltip>
                        <TooltipTrigger>
                          <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg hover:bg-muted" onClick={() => { setEditAccount(account); setDialogOpen(true); }}>
                            <Pencil className="w-5 h-5 sm:w-7 sm:h-7" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Editar</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger>
                          <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setDeleteId(account.id)}>
                            <Trash2 className="w-5 h-5 sm:w-7 sm:h-7" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Excluir</TooltipContent>
                      </Tooltip>
                    </div>
                  </CardFooter>
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

      {/* Transfer dialog */}
      <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transferência entre contas</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-sm font-medium mb-1 block">Conta de origem</label>
              <Select onValueChange={(v) => setTransferFrom(v ?? "")} value={transferFrom}>
                <SelectTrigger><SelectValue>{accounts.find((a) => a.id === transferFrom)?.nickname || "Selecione..."}</SelectValue></SelectTrigger>
                <SelectContent>
                  {accounts.filter((a) => a.id !== transferTo).map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.nickname} · {formatCurrency(parseFloat(a.balance))}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Conta de destino</label>
              <Select onValueChange={(v) => setTransferTo(v ?? "")} value={transferTo}>
                <SelectTrigger><SelectValue>{accounts.find((a) => a.id === transferTo)?.nickname || "Selecione..."}</SelectValue></SelectTrigger>
                <SelectContent>
                  {accounts.filter((a) => a.id !== transferFrom).map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.nickname}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Valor</label>
                <CurrencyInput value={transferAmount} onChange={setTransferAmount} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Data</label>
                <Input type="date" value={transferDate} onChange={(e) => setTransferDate(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Descrição (opcional)</label>
              <Input placeholder="Ex: Reserva de emergência" value={transferDesc} onChange={(e) => setTransferDesc(e.target.value)} />
            </div>
            <Button className="w-full" disabled={transferSaving || !transferFrom || !transferTo || transferAmount <= 0} onClick={handleTransfer}>
              {transferSaving ? "Transferindo..." : "Confirmar transferência"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}
