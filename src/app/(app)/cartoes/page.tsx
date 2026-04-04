"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import Link from "next/link";
import { Plus, CreditCard, Pencil, Trash2, Eye, Search, X } from "lucide-react";
import { CardBrand } from "@prisma/client";
import { PageTransition } from "@/components/shared/page-transition";
import { AnimatedCard, cardVariants, cardItemVariants } from "@/components/shared/animated-card";
import { EmptyState } from "@/components/shared/empty-state";
import { MoneyValue } from "@/components/shared/money-value";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/shared/link-button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/shared/currency-input";
import { ColorPicker } from "@/components/shared/color-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { creditCardSchema, CreditCardInput } from "@/lib/validations/credit-card";
import { formatCurrency } from "@/lib/format";
import { radialGradient } from "@/lib/utils";
import { getCardBrandIcon } from "@/components/ui/brand-icons";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const brandLabels: Record<CardBrand, string> = {
  VISA: "Visa",
  MASTERCARD: "Mastercard",
  ELO: "Elo",
  AMEX: "American Express",
  HIPERCARD: "Hipercard",
  OTHER: "Outro",
};

const brandColors: Record<CardBrand, string> = {
  VISA: "#1A1F71",
  MASTERCARD: "#EB001B",
  ELO: "#FFD700",
  AMEX: "#007CC3",
  HIPERCARD: "#CC0000",
  OTHER: "#075056",
};

function getLimitColor(percentage: number): string {
  if (percentage < 50) return "bg-success";
  if (percentage < 80) return "bg-warning";
  if (percentage < 95) return "bg-primary";
  return "bg-destructive";
}

function getContrastColor(hex: string): "#ffffff" | "#1a1a1a" {
  try {
    const colorPath = hex.replace("#", "");
    const r = parseInt(colorPath.slice(0, 2), 16) / 255;
    const g = parseInt(colorPath.slice(2, 4), 16) / 255;
    const b = parseInt(colorPath.slice(4, 6), 16) / 255;
    const toLinear = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    const L = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
    return L > 0.179 ? "#1a1a1a" : "#ffffff";
  } catch {
    return "#ffffff";
  }
}

interface CreditCardItem {
  id: string;
  name: string;
  brand: CardBrand;
  lastFourDigits: string | null;
  creditLimit: string;
  closingDay: number;
  dueDay: number;
  color: string;
  bankAccount?: { nickname: string } | null;
  currentMonthTotal?: number;
  prevMonthTotal?: number;
  topTransaction?: { description: string; amount: number; cardName: string; purchaseDate: string; categoryName: string; categoryColor: string } | null;
}

interface BankAccount { id: string; nickname: string; }

function CardForm({
  onSuccess,
  defaultValues,
  bankAccounts,
}: {
  onSuccess: () => void;
  defaultValues?: Partial<CreditCardInput & { id: string }>;
  bankAccounts: BankAccount[];
}) {
  const form = useForm<CreditCardInput, any, CreditCardInput>({
    resolver: zodResolver(creditCardSchema) as any,
    defaultValues: {
      name: defaultValues?.name ?? "",
      brand: defaultValues?.brand ?? "VISA",
      lastFourDigits: defaultValues?.lastFourDigits ?? "",
      creditLimit: defaultValues?.creditLimit ?? 0,
      closingDay: defaultValues?.closingDay ?? 1,
      dueDay: defaultValues?.dueDay ?? 10,
      color: defaultValues?.color ?? "#FF5B04",
      bankAccountId: defaultValues?.bankAccountId ?? "",
    },
  });

  async function onSubmit(data: CreditCardInput) {
    const url = defaultValues?.id ? `/api/cartoes/${defaultValues.id}` : "/api/cartoes";
    const method = defaultValues?.id ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) { toast.error("Erro ao salvar cartão"); return; }
    toast.success(defaultValues?.id ? "Cartão atualizado!" : "Cartão adicionado!");
    onSuccess();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem>
            <FormLabel>Nome/Apelido</FormLabel>
            <FormControl><Input placeholder="Nubank Gold" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="brand" render={({ field }) => (
            <FormItem>
              <FormLabel>Bandeira</FormLabel>
              <FormControl>
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger><SelectValue>{field.value ? brandLabels[field.value as CardBrand] : "Selecione..."}</SelectValue></SelectTrigger>
                  <SelectContent>
                    {Object.entries(brandLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        <div className="flex items-center gap-2">
                          {getCardBrandIcon(k, "w-8 h-5")}
                          <span>{v}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="lastFourDigits" render={({ field }) => (
            <FormItem>
              <FormLabel>Últimos 4 dígitos</FormLabel>
              <FormControl><Input placeholder="1234" maxLength={4} {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>
        <FormField control={form.control} name="creditLimit" render={({ field }) => (
          <FormItem>
            <FormLabel>Limite</FormLabel>
            <FormControl>
              <CurrencyInput value={field.value} onChange={field.onChange} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="closingDay" render={({ field }) => (
            <FormItem>
              <FormLabel>Dia fechamento</FormLabel>
              <FormControl><Input type="number" min={1} max={31} {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="dueDay" render={({ field }) => (
            <FormItem>
              <FormLabel>Dia vencimento</FormLabel>
              <FormControl><Input type="number" min={1} max={31} {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>
        {bankAccounts.length > 0 && (
          <FormField control={form.control} name="bankAccountId" render={({ field }) => (
            <FormItem>
              <FormLabel>Conta vinculada (opcional)</FormLabel>
              <FormControl>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <SelectTrigger><SelectValue>{bankAccounts.find((a) => a.id === field.value)?.nickname || "Selecione..."}</SelectValue></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhuma</SelectItem>
                    {bankAccounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.nickname}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
        )}
        <FormField control={form.control} name="color" render={({ field }) => (
          <FormItem>
            <FormLabel>Cor</FormLabel>
            <FormControl>
              <ColorPicker value={field.value} onChange={field.onChange} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <motion.div whileTap={{ scale: 0.97 }}>
          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Salvando..." : "Salvar"}
          </Button>
        </motion.div>
      </form>
    </Form>
  );
}

export default function CartoesPage() {
  const [cards, setCards] = useState<CreditCardItem[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editCard, setEditCard] = useState<CreditCardItem | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  async function fetchData() {
    try {
      const [cardsRes, accountsRes] = await Promise.all([
        fetch("/api/cartoes"),
        fetch("/api/contas"),
      ]);
      const cardsData = cardsRes.ok ? await cardsRes.json() : [];
      const accData = accountsRes.ok ? await accountsRes.json() : [];
      setCards(cardsData);
      setBankAccounts(accData);
    } catch {
      setCards([]);
      setBankAccounts([]);
    }
    setLoading(false);
  }

  const [brandFilter, setBrandFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");

  useEffect(() => { fetchData(); }, []);

  const filteredCards = cards.filter((c) => {
    const brandOk = brandFilter === "ALL" || c.brand === brandFilter;
    const searchOk = !search || c.name.toLowerCase().includes(search.toLowerCase());
    return brandOk && searchOk;
  });

  const uniqueBrands = Array.from(new Set(cards.map((c) => c.brand))).sort();

  async function handleDelete() {
    if (!deleteId) return;
    const res = await fetch(`/api/cartoes/${deleteId}`, { method: "DELETE" });
    if (res.ok) { toast.success("Cartão removido"); fetchData(); }
    else toast.error("Erro ao remover cartão");
    setDeleteId(null);
  }

  return (
    <PageTransition>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Cartões de Crédito</h1>
        <motion.div whileTap={{ scale: 0.97 }}>
          <Button onClick={() => { setEditCard(null); setDialogOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" /> Novo Cartão
          </Button>
        </motion.div>
      </div>

      {/* Summary Cards */}
      {!loading && cards.length > 0 && (() => {
        const totalFatura = cards.reduce((s, c) => s + (c.currentMonthTotal || 0), 0);
        const topCard = cards.length > 0
          ? cards.reduce((prev, curr) => (curr.currentMonthTotal || 0) > (prev.currentMonthTotal || 0) ? curr : prev)
          : null;
        const topCardPrev = topCard?.prevMonthTotal || 0;
        const topCardCurr = topCard?.currentMonthTotal || 0;
        const topCardVariation = topCardPrev > 0 ? ((topCardCurr - topCardPrev) / topCardPrev) * 100 : null;
        const topPurchase = cards.reduce<{ description: string; amount: number; cardName: string; purchaseDate: string; categoryName: string; categoryColor: string } | null>((best, c) => {
          if (c.topTransaction && (!best || c.topTransaction.amount > best.amount)) return c.topTransaction;
          return best;
        }, null);

        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {/* Total fatura + cartão com maior gasto */}
            <Card className="border-l-4 border-l-destructive" style={radialGradient("destructive")}>
              <CardHeader>
                <CardDescription>Total das faturas</CardDescription>
                <CardTitle className="text-2xl font-semibold tabular-nums font-numbers text-destructive">
                  {formatCurrency(totalFatura)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Cartão com maior gasto</span>
                  <span className="font-semibold">{topCard?.name || "-"}</span>
                </div>
                {topCardVariation !== null && (
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>vs mês anterior</span>
                    <span className={topCardVariation <= 0 ? "text-success font-semibold" : "text-destructive font-semibold"}>
                      {topCardVariation > 0 ? "+" : ""}{topCardVariation.toFixed(0)}%
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Maior compra */}
            <Card className="border-l-4 border-l-primary">
              <CardHeader>
                <CardDescription>Maior compra no cartão</CardDescription>
                <div className="flex items-baseline gap-2">
                  <CardTitle className="text-2xl font-semibold tabular-nums font-numbers">
                    {topPurchase ? formatCurrency(topPurchase.amount) : "-"}
                  </CardTitle>
                  {topPurchase && <span className="text-sm text-muted-foreground truncate">{topPurchase.description}</span>}
                </div>
              </CardHeader>
              {topPurchase && (
                <CardFooter className="text-xs text-muted-foreground">
                  {topPurchase.cardName} · {new Date(topPurchase.purchaseDate).toLocaleDateString("pt-BR")} · {topPurchase.categoryName}
                </CardFooter>
              )}
            </Card>
          </div>
        );
      })()}

      {/* Filters */}
      {!loading && cards.length > 0 && (
        <div className="mb-4 flex flex-col sm:flex-row gap-3 flex-wrap">
          <Select value={brandFilter} onValueChange={(v) => setBrandFilter(v ?? "ALL")}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue>{brandFilter === "ALL" ? "Todas as bandeiras" : brandLabels[brandFilter as CardBrand]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todas as bandeiras</SelectItem>
              {uniqueBrands.map((b) => (
                <SelectItem key={b} value={b}>{brandLabels[b]}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative flex-1 sm:max-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar cartão..."
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
        <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(min(100%,260px),360px))]">
          {[1, 2, 3].map((i) => <div key={i} className="h-48 rounded-xl bg-muted animate-pulse" />)}
        </div>
      ) : filteredCards.length === 0 ? (
        <EmptyState
          illustration="cards"
          title="Nenhum cartão cadastrado"
          description="Adicione seus cartões de crédito para controlar seus gastos."
          actionLabel="Adicionar Cartão"
          onAction={() => setDialogOpen(true)}
        />
      ) : (
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="show"
          className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(min(100%,260px),360px))]"
        >
          {filteredCards.map((card) => {
            const limit = parseFloat(card.creditLimit);
            const brandIcon = getCardBrandIcon(card.brand, "w-10 h-6");
            // Create a hex-to-rgb helper inline for gradient opacity
            const cardColor = card.color || "#075056";
            const textColor = getContrastColor(cardColor);
            const isLight = textColor === "#1a1a1a";
            const decorColor = isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.3)";

            return (
              <motion.div key={card.id} variants={cardItemVariants}>
                <Card className="overflow-hidden h-full py-3 gap-2">
                  {/* Physical card visual */}
                  <div
                    className="relative rounded-md overflow-hidden aspect-[16/10] flex flex-col justify-between p-4 mx-3 select-none"
                    style={{
                      background: `linear-gradient(135deg, ${cardColor}EE 0%, ${cardColor}99 60%, ${cardColor}44 100%)`,
                      backgroundBlendMode: "overlay",
                      color: textColor,
                    }}
                  >
                    <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full opacity-20" style={{ backgroundColor: decorColor }} />
                    <div className="absolute top-4 -right-4 w-24 h-24 rounded-full opacity-10" style={{ backgroundColor: decorColor }} />

                    <div className="flex items-center justify-between z-10">
                      <svg width="32" height="24" viewBox="0 0 32 24" fill="none" className="opacity-90">
                        <rect width="32" height="24" rx="4" fill="#D4AF37" fillOpacity="0.8" />
                        <rect x="12" y="0" width="8" height="24" fill="#B8960A" fillOpacity="0.4" />
                        <rect x="0" y="8" width="32" height="8" fill="#B8960A" fillOpacity="0.4" />
                      </svg>
                      <div className="opacity-90">{brandIcon}</div>
                    </div>

                    <div className="z-10 tracking-widest text-sm font-mono opacity-90">
                      •••• •••• •••• {card.lastFourDigits || "••••"}
                    </div>

                    <div className="z-10 flex gap-5">
                      <div>
                        <p className="text-xs opacity-60 uppercase tracking-wider mb-0.5">Fechamento</p>
                        <p className="text-sm font-semibold">Dia {card.closingDay}</p>
                      </div>
                      <div>
                        <p className="text-xs opacity-60 uppercase tracking-wider mb-0.5">Vencimento</p>
                        <p className="text-sm font-semibold">Dia {card.dueDay}</p>
                      </div>
                    </div>

                    <div className="z-10 flex items-end justify-between">
                      <div>
                        <p className="text-xs opacity-70 uppercase tracking-wider mb-0.5">Titular</p>
                        <p className="font-semibold text-sm truncate max-w-[140px]">{card.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs opacity-70 uppercase tracking-wider mb-0.5">Limite</p>
                        <p className="font-semibold text-sm money">{formatCurrency(limit)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions inside card */}
                  <CardFooter className="flex items-center justify-between pt-0 px-3">
                    <LinkButton href={`/cartoes/${card.id}`} variant="outline" size="sm">
                      <Eye className="w-3 h-3 mr-1" /> Fatura
                    </LinkButton>
                    <div className="flex items-center gap-1">
                      <Tooltip>
                        <TooltipTrigger>
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-muted" onClick={() => { setEditCard(card); setDialogOpen(true); }}>
                            <Pencil className="w-7 h-7" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Editar</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger>
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setDeleteId(card.id)}>
                            <Trash2 className="w-7 h-7" />
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
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <DialogHeader>
              <DialogTitle>{editCard ? "Editar Cartão" : "Novo Cartão de Crédito"}</DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              <CardForm
                defaultValues={editCard ? { ...editCard, creditLimit: parseFloat(editCard.creditLimit) } as any : undefined}
                bankAccounts={bankAccounts}
                onSuccess={() => { setDialogOpen(false); fetchData(); }}
              />
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover cartão?</AlertDialogTitle>
            <AlertDialogDescription>Todas as transações associadas também serão afetadas.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white">Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageTransition>
  );
}
