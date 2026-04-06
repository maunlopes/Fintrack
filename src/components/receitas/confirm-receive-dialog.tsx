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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CurrencyInput } from "@/components/shared/currency-input";
import { formatCurrency } from "@/lib/format";

interface BankAccount {
  id: string;
  nickname: string;
  balance?: string;
}

interface Income {
  id: string;
  description: string;
  amount: string;
  receiveDate: string;
  bankAccount: BankAccount;
}

interface ConfirmReceiveDialogProps {
  income: Income | null;
  bankAccounts: BankAccount[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (incomeId: string, data: { amount: number; bankAccountId: string; receiveDate: string }) => Promise<void>;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function ConfirmReceiveDialog({
  income,
  bankAccounts,
  open,
  onOpenChange,
  onConfirm,
}: ConfirmReceiveDialogProps) {
  const [amount, setAmount] = useState(0);
  const [bankAccountId, setBankAccountId] = useState("");
  const [receiveDate, setReceiveDate] = useState(todayISO());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && income) {
      setAmount(parseFloat(income.amount));
      setBankAccountId(income.bankAccount?.id || "");
      setReceiveDate(todayISO());
    }
  }, [open, income]);

  if (!income) return null;

  const selectedAccount = bankAccounts.find((a) => a.id === bankAccountId);
  const accountBalance =
    selectedAccount?.balance != null ? parseFloat(selectedAccount.balance) : null;
  const balanceAfter = accountBalance !== null ? accountBalance + amount : null;

  async function handleConfirm() {
    setLoading(true);
    try {
      await onConfirm(income!.id, { amount, bankAccountId, receiveDate });
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmar Recebimento</DialogTitle>
          <DialogDescription>
            Revise os detalhes antes de confirmar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Income info */}
          <div>
            <p className="text-sm text-muted-foreground">Receita</p>
            <p className="font-medium">{income.description}</p>
          </div>

          <Separator />

          {/* Editable amount */}
          <div className="space-y-1.5">
            <Label htmlFor="receive-amount">Valor recebido</Label>
            <CurrencyInput value={amount} onChange={setAmount} />
          </div>

          <Separator />

          {/* Editable bank account */}
          <div className="space-y-1.5">
            <Label>Conta de destino</Label>
            <Select value={bankAccountId} onValueChange={(v) => setBankAccountId(v ?? "")}>
              <SelectTrigger>
                <SelectValue>
                  {selectedAccount?.nickname || "Selecione..."}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {bankAccounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.nickname}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Balance after */}
          {balanceAfter !== null && (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                <Landmark className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground">
                  {selectedAccount?.nickname}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-muted-foreground">Saldo após</p>
                <p
                  className={`text-sm font-semibold ${balanceAfter >= 0 ? "text-success" : "text-destructive"}`}
                >
                  {formatCurrency(balanceAfter)}
                </p>
              </div>
            </div>
          )}

          <Separator />

          {/* Editable date */}
          <div className="space-y-1.5">
            <Label htmlFor="receive-date">Data de recebimento</Label>
            <Input
              id="receive-date"
              type="date"
              value={receiveDate}
              onChange={(e) => setReceiveDate(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading || !bankAccountId || !receiveDate}
          >
            <BadgeCheck className="w-4 h-4 mr-2" />
            {loading ? "Confirmando..." : "Confirmar Recebimento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
