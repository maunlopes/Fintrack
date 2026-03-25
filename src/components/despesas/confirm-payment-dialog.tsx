"use client";

import { useState, useEffect } from "react";
import { BadgeCheck, Landmark } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

interface BankAccount {
  id: string;
  nickname: string;
  balance?: string;
}

interface Expense {
  id: string;
  description: string;
  amount: string;
  dueDate: string;
  bankAccount?: BankAccount | null;
}

interface ConfirmPaymentDialogProps {
  expense: Expense | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (expenseId: string, paidAt: string) => Promise<void>;
}

function formatBRL(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function ConfirmPaymentDialog({ expense, open, onOpenChange, onConfirm }: ConfirmPaymentDialogProps) {
  const [paidAt, setPaidAt] = useState(todayISO());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) setPaidAt(todayISO());
  }, [open]);

  if (!expense) return null;

  const amount = parseFloat(expense.amount);
  const accountBalance = expense.bankAccount?.balance != null ? parseFloat(expense.bankAccount.balance!) : null;
  const balanceAfter = accountBalance !== null ? accountBalance - amount : null;

  async function handleConfirm() {
    setLoading(true);
    try {
      await onConfirm(expense!.id, paidAt);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmar Pagamento</DialogTitle>
          <DialogDescription>Revise os detalhes antes de confirmar.</DialogDescription>
        </DialogHeader>

        {/* Expense info */}
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">Despesa</p>
              <p className="font-medium truncate">{expense.description}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm text-muted-foreground">Valor</p>
              <p className="font-semibold text-destructive">{formatBRL(amount)}</p>
            </div>
          </div>

          <Separator />

          {/* Bank account */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
              <Landmark className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">Débito em</p>
              {expense.bankAccount ? (
                <p className="font-medium truncate">{expense.bankAccount.nickname}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">Sem conta vinculada</p>
              )}
            </div>
            {balanceAfter !== null && (
              <div className="text-right shrink-0">
                <p className="text-xs text-muted-foreground">Saldo após</p>
                <p className={`text-sm font-semibold ${balanceAfter >= 0 ? "text-success" : "text-destructive"}`}>
                  {formatBRL(balanceAfter)}
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* Payment date */}
          <div className="space-y-1.5">
            <Label htmlFor="paid-at">Data de pagamento</Label>
            <Input
              id="paid-at"
              type="date"
              value={paidAt}
              onChange={(e) => setPaidAt(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={loading || !paidAt}>
            <BadgeCheck className="w-4 h-4 mr-2" />
            {loading ? "Confirmando..." : "Confirmar Pagamento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
