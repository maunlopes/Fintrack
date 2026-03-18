"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Check, X, ChevronDown, ChevronUp, InboxIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/format";
import { cardItemVariants } from "@/components/shared/animated-card";

interface Category {
  id: string;
  name: string;
  type: "EXPENSE" | "INCOME";
}

interface BankAccount {
  id: string;
  name: string;
  nickname: string;
}

interface PendingTx {
  id: string;
  externalId: string;
  type: string;
  amount: string;
  date: string;
  description: string;
  category: string | null;
  pluggyAccount: {
    name: string;
    subtype: string;
    bankAccount: BankAccount | null;
    pluggyItem: { connector: { name?: string } };
  };
}

interface Props {
  transactions: PendingTx[];
  categories: Category[];
  bankAccounts: BankAccount[];
  onRefresh: () => void;
}

export function PendingTransactionsList({ transactions, categories, bankAccounts, onRefresh }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const [formState, setFormState] = useState<Record<string, { categoryId: string; bankAccountId: string; description: string }>>({});

  function getForm(txId: string, tx: PendingTx) {
    return formState[txId] ?? {
      categoryId: "",
      bankAccountId: tx.pluggyAccount.bankAccount?.id ?? "",
      description: tx.description,
    };
  }

  function setForm(txId: string, values: Partial<{ categoryId: string; bankAccountId: string; description: string }>) {
    setFormState((prev) => ({
      ...prev,
      [txId]: { ...getForm(txId, transactions.find((t) => t.id === txId)!), ...values },
    }));
  }

  async function handleIgnore(txId: string) {
    setProcessing(txId);
    try {
      const res = await fetch(`/api/open-finance/pending/${txId}/ignore`, { method: "POST" });
      if (!res.ok) throw new Error();
      toast.success("Transação ignorada");
      onRefresh();
    } catch {
      toast.error("Erro ao ignorar transação");
    } finally {
      setProcessing(null);
    }
  }

  async function handleAccept(txId: string) {
    const form = formState[txId];
    if (!form?.categoryId || !form?.bankAccountId) {
      toast.error("Selecione a categoria e a conta");
      return;
    }

    setProcessing(txId);
    try {
      const res = await fetch(`/api/open-finance/pending/${txId}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      toast.success("Transação registrada com sucesso");
      onRefresh();
    } catch {
      toast.error("Erro ao registrar transação");
    } finally {
      setProcessing(null);
      setExpanded(null);
    }
  }

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
        <InboxIcon className="w-10 h-10 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">Nenhuma transação pendente de revisão.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {transactions.map((tx, i) => {
        const isDebit = tx.type === "DEBIT";
        const amount = Number(tx.amount);
        const isOpen = expanded === tx.id;
        const form = getForm(tx.id, tx);
        const filteredCategories = categories.filter((c) =>
          isDebit ? c.type === "EXPENSE" : c.type === "INCOME"
        );

        return (
          <motion.div
            key={tx.id}
            variants={cardItemVariants}
            initial="hidden"
            animate="show"
            custom={i}
            className="border rounded-xl overflow-hidden bg-card"
          >
            {/* Row */}
            <button
              className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/40 transition-colors"
              onClick={() => setExpanded(isOpen ? null : tx.id)}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Badge variant={isDebit ? "destructive" : "default"} className="shrink-0 text-xs">
                  {isDebit ? "Débito" : "Crédito"}
                </Badge>
                <span className="text-sm font-medium truncate">{tx.description}</span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {new Date(tx.date).toLocaleDateString("pt-BR")}
                </span>
              </div>

              <div className="flex items-center gap-3 ml-3 shrink-0">
                <span className={`text-sm font-semibold tabular-nums ${isDebit ? "text-destructive" : "text-green-600 dark:text-green-400"}`}>
                  {isDebit ? "-" : "+"}{formatCurrency(amount)}
                </span>
                {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </div>
            </button>

            {/* Expanded form */}
            {isOpen && (
              <div className="px-4 pb-4 pt-1 border-t space-y-3 bg-muted/20">
                <p className="text-xs text-muted-foreground">
                  {tx.pluggyAccount.pluggyItem.connector.name} · {tx.pluggyAccount.name}
                  {tx.category && <> · Categoria original: <strong>{tx.category}</strong></>}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Descrição</Label>
                    <Input
                      value={form.description}
                      onChange={(e) => setForm(tx.id, { description: e.target.value })}
                      className="h-8 text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Categoria *</Label>
                    <Select value={form.categoryId} onValueChange={(v) => setForm(tx.id, { categoryId: v })}>
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="Selecionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredCategories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Conta *</Label>
                    <Select value={form.bankAccountId} onValueChange={(v) => setForm(tx.id, { bankAccountId: v })}>
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="Selecionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        {bankAccounts.map((a) => (
                          <SelectItem key={a.id} value={a.id}>{a.nickname || a.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <Button
                    size="sm"
                    onClick={() => handleAccept(tx.id)}
                    disabled={processing === tx.id}
                    className="gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Registrar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleIgnore(tx.id)}
                    disabled={processing === tx.id}
                    className="gap-1.5 text-muted-foreground"
                  >
                    <X className="w-3.5 h-3.5" />
                    Ignorar
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
