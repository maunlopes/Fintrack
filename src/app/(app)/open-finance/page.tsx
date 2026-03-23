"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Link2, RefreshCw, Clock } from "lucide-react";
import { PageTransition } from "@/components/shared/page-transition";
import { PluggyConnectButton } from "@/components/open-finance/pluggy-connect-button";
import { ConnectedItemsList } from "@/components/open-finance/connected-items-list";
import { PendingTransactionsList } from "@/components/open-finance/pending-transactions-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface PluggyItem {
  id: string;
  itemId: string;
  connector: { name?: string; primaryColor?: string; imageUrl?: string };
  status: string;
  lastSyncAt: string | null;
  accounts: {
    id: string;
    accountId: string;
    name: string;
    subtype: string;
    balance: string;
    lastSyncAt: string | null;
    bankAccount: { id: string; name: string; nickname: string } | null;
  }[];
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
    bankAccount: { id: string; name: string; nickname: string } | null;
    pluggyItem: { connector: { name?: string } };
  };
}

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

export default function OpenFinancePage() {
  const [items, setItems] = useState<PluggyItem[]>([]);
  const [pending, setPending] = useState<PendingTx[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [itemsRes, pendingRes, categoriesRes, accountsRes] = await Promise.all([
        fetch("/api/open-finance/items"),
        fetch("/api/open-finance/pending"),
        fetch("/api/categorias"),
        fetch("/api/contas"),
      ]);

      const [itemsData, pendingData, categoriesData, accountsData] = await Promise.all([
        itemsRes.json(),
        pendingRes.json(),
        categoriesRes.json(),
        accountsRes.json(),
      ]);

      setItems(itemsData);
      setPending(pendingData);
      setCategories(categoriesData);
      setBankAccounts(accountsData);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <PageTransition>
      <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Link2 className="w-6 h-6 text-primary" />
              Open Finance
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Conecte suas contas bancárias e importe transações automaticamente.
            </p>
          </div>

          <PluggyConnectButton onSuccess={loadData} />
        </motion.div>

        {/* Tabs */}
        <Tabs defaultValue="contas">
          <TabsList>
            <TabsTrigger value="contas" className="gap-1.5">
              Contas conectadas
              {items.length > 0 && (
                <Badge variant="secondary" className="text-xs h-4 px-1.5">{items.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="pendentes" className="gap-1.5">
              Pendentes
              {pending.length > 0 && (
                <Badge variant="destructive" className="text-xs h-4 px-1.5">{pending.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="contas" className="mt-4">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <ConnectedItemsList items={items} onRefresh={loadData} />
            )}
          </TabsContent>

          <TabsContent value="pendentes" className="mt-4">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <PendingTransactionsList
                transactions={pending}
                categories={categories}
                bankAccounts={bankAccounts}
                onRefresh={loadData}
              />
            )}

            {pending.length > 0 && !loading && (
              <p className="text-xs text-muted-foreground text-center mt-4 flex items-center justify-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Transações ignoradas não entram no seu extrato.
              </p>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </PageTransition>
  );
}
