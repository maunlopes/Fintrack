"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { RefreshCw, Trash2, CheckCircle2, AlertCircle, Clock, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { PluggyConnectButton } from "./pluggy-connect-button";
import { formatCurrency } from "@/lib/format";
import { cardItemVariants } from "@/components/shared/animated-card";

interface PluggyAccount {
  id: string;
  accountId: string;
  name: string;
  subtype: string;
  balance: string;
  lastSyncAt: string | null;
  bankAccount: { id: string; name: string; nickname: string } | null;
}

interface PluggyItem {
  id: string;
  itemId: string;
  connector: { name?: string; primaryColor?: string; imageUrl?: string };
  status: string;
  lastSyncAt: string | null;
  accounts: PluggyAccount[];
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ElementType }> = {
  UPDATED: { label: "Atualizado", variant: "default", icon: CheckCircle2 },
  UPDATING: { label: "Atualizando", variant: "secondary", icon: RefreshCw },
  WAITING_USER_INPUT: { label: "Ação necessária", variant: "outline", icon: Clock },
  LOGIN_ERROR: { label: "Erro de login", variant: "destructive", icon: AlertCircle },
  OUTDATED: { label: "Desatualizado", variant: "outline", icon: WifiOff },
  ERROR: { label: "Erro", variant: "destructive", icon: AlertCircle },
};

const subtypeLabels: Record<string, string> = {
  CHECKING_ACCOUNT: "Conta Corrente",
  SAVINGS_ACCOUNT: "Poupança",
  CREDIT_CARD: "Cartão de Crédito",
};

interface Props {
  items: PluggyItem[];
  onRefresh: () => void;
}

export function ConnectedItemsList({ items, onRefresh }: Props) {
  const [syncing, setSyncing] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<PluggyItem | null>(null);

  async function handleSync(item: PluggyItem) {
    setSyncing(item.itemId);
    try {
      const res = await fetch(`/api/open-finance/items/${item.itemId}/sync`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error();
      toast.success(`Sync concluído — ${data.totalCreated} novas transações`);
      onRefresh();
    } catch {
      toast.error("Erro ao sincronizar");
    } finally {
      setSyncing(null);
    }
  }

  async function handleDelete(item: PluggyItem) {
    setDeleting(item.itemId);
    try {
      const res = await fetch(`/api/open-finance/items/${item.itemId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Banco desconectado");
      onRefresh();
    } catch {
      toast.error("Erro ao desconectar");
    } finally {
      setDeleting(null);
      setConfirmDelete(null);
    }
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
        <WifiOff className="w-10 h-10 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">Nenhum banco conectado ainda.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item, i) => {
        const status = statusConfig[item.status] ?? statusConfig.ERROR;
        const StatusIcon = status.icon;
        const connectorName = item.connector?.name ?? "Instituição";
        const needsReauth = item.status === "LOGIN_ERROR" || item.status === "WAITING_USER_INPUT";

        return (
          <motion.div
            key={item.id}
            variants={cardItemVariants}
            initial="hidden"
            animate="show"
            custom={i}
            className="border rounded-xl p-4 bg-card space-y-3"
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                {item.connector?.imageUrl ? (
                  <img src={item.connector.imageUrl} alt={connectorName} className="w-8 h-8 rounded-full object-contain" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <Wifi className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <p className="font-medium text-sm">{connectorName}</p>
                  {item.lastSyncAt && (
                    <p className="text-xs text-muted-foreground">
                      Último sync: {new Date(item.lastSyncAt).toLocaleString("pt-BR")}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant={status.variant} className="gap-1 text-xs">
                  <StatusIcon className="w-3 h-3" />
                  {status.label}
                </Badge>
              </div>
            </div>

            {/* Accounts */}
            {item.accounts.length > 0 && (
              <div className="space-y-1.5 pl-1">
                {item.accounts.map((acc) => (
                  <div key={acc.id} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {subtypeLabels[acc.subtype] ?? acc.subtype} — {acc.name}
                    </span>
                    <span className="font-medium tabular-nums">
                      {formatCurrency(Number(acc.balance))}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1">
              {needsReauth ? (
                <PluggyConnectButton
                  itemId={item.itemId}
                  label="Reconectar"
                  variant="outline"
                  size="sm"
                  onSuccess={onRefresh}
                />
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSync(item)}
                  disabled={syncing === item.itemId}
                  className="gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncing === item.itemId ? "animate-spin" : ""}`} />
                  Sincronizar
                </Button>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmDelete(item)}
                disabled={deleting === item.itemId}
                className="gap-1.5 text-destructive hover:text-destructive"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Desconectar
              </Button>
            </div>
          </motion.div>
        );
      })}

      <AlertDialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desconectar banco?</AlertDialogTitle>
            <AlertDialogDescription>
              As contas e transações importadas de{" "}
              <strong>{confirmDelete?.connector?.name}</strong> serão removidas do PQGASTEI?.
              Isso não afeta sua conta no banco.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => confirmDelete && handleDelete(confirmDelete)}
            >
              Desconectar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
