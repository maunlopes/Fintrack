import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function formatCurrency(value: number | string | null | undefined): string {
  const num = typeof value === "string" ? parseFloat(value) : (value ?? 0);
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(num);
}

export function formatDate(date: Date | string | null | undefined, pattern = "dd/MM/yyyy"): string {
  if (!date) return "—";
  return format(new Date(date), pattern, { locale: ptBR });
}

export const BANK_NAMES = [
  "Nubank",
  "Itaú",
  "Bradesco",
  "Banco do Brasil",
  "Santander",
  "Caixa Econômica",
  "Inter",
  "C6 Bank",
  "BTG Pactual",
  "XP",
  "Sicoob",
  "Sicredi",
  "Outro",
];
