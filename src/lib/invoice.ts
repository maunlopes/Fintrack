import { prisma } from "./prisma";
import { format, addMonths, setDate, isAfter, startOfDay } from "date-fns";

/**
 * Calculates the invoice due date given a purchase date, closing day, and due day.
 * - If the purchase is on or after the closing day of the month, it goes to the next month's invoice.
 * - If the purchase is before the closing day, it goes to the current month's invoice.
 */
export function getInvoiceDate(purchaseDate: Date, closingDay: number, dueDay: number): Date {
  // Reset time to start of day for accurate comparison
  const purchase = startOfDay(new Date(purchaseDate));
  
  // The closing date for the current month
  let closingDate = setDate(purchase, closingDay);
  
  // If due day is smaller than closing day, it means the invoice is paid in the *following* month.
  // Example: closes on 25, due on 5. Purchase on 20th Oct -> closes 25th Oct -> due 5th Nov.
  // Purchase on 26th Oct -> closes 25th Nov -> due 5th Dec.
  const dueMonthOffset = dueDay < closingDay ? 1 : 0;
  
  let targetInvoiceMonth = purchase;

  if (isAfter(purchase, closingDate) || purchase.getTime() === closingDate.getTime()) {
    // Purchase is on or after closing day -> shifted to next closing cycle
    targetInvoiceMonth = addMonths(purchase, 1);
  }

  // The final due date
  return setDate(addMonths(targetInvoiceMonth, dueMonthOffset), dueDay);
}

/**
 * A standardized interface representing a consolidated Invoice (Fatura).
 * It will look similar to an Expense so it can be merged directly into the UI.
 */
export interface InvoiceExpense {
  id: string; // e.g., "fatura_cardId_YYYY_MM"
  originalId: string;
  type: "EXPENSE";
  description: string;
  amount: number;
  date: string; // The due date
  status: "PENDING" | "PAID" | "OVERDUE";
  category: { id: string; name: string; color: string; icon?: string };
  bankAccount: { id: string; nickname: string } | null;
  cardId: string;
  cardName: string;
}

/**
 * Fetches all card transactions for a user, groups them into monthly invoices
 * based on closing/due days, and returns an array of "Expense"-like objects.
 * Paid invoices (InvoicePayment records) are reflected with status "PAID".
 */
export async function getInvoicesAsExpenses(userId: string, month?: number, year?: number): Promise<InvoiceExpense[]> {
  const [cards, payments] = await Promise.all([
    prisma.creditCard.findMany({
      where: { userId },
      include: {
        bankAccount: true,
        transactions: { include: { category: true } }
      }
    }),
    prisma.invoicePayment.findMany({ where: { userId } })
  ]);

  // Index payments by "cardId|month|year" for O(1) lookup
  const paymentIndex = new Map<string, typeof payments[0]>();
  for (const p of payments) {
    paymentIndex.set(`${p.creditCardId}|${p.month}|${p.year}`, p);
  }

  const invoicesMap = new Map<string, InvoiceExpense>();

  for (const card of cards) {
    if (!card.transactions || card.transactions.length === 0) continue;

    for (const tx of card.transactions) {
      const dueDate = getInvoiceDate(tx.purchaseDate, card.closingDay, card.dueDay);
      const invoiceMonth = format(dueDate, "MM");
      const invoiceYear = format(dueDate, "yyyy");

      if (month && year) {
        if (Number(invoiceMonth) !== month || Number(invoiceYear) !== year) continue;
      }

      const invoiceKey = `fatura_${card.id}_${invoiceYear}_${invoiceMonth}`;

      const amountToAdd = tx.isInstallment && tx.installmentAmount
        ? parseFloat(tx.installmentAmount.toString())
        : parseFloat(tx.totalAmount.toString());

      if (invoicesMap.has(invoiceKey)) {
        invoicesMap.get(invoiceKey)!.amount += amountToAdd;
      } else {
        const now = startOfDay(new Date());
        const payment = paymentIndex.get(`${card.id}|${Number(invoiceMonth)}|${Number(invoiceYear)}`);
        const isPaid = !!payment;
        const isOverdue = !isPaid && dueDate < now;

        invoicesMap.set(invoiceKey, {
          id: invoiceKey,
          originalId: invoiceKey,
          type: "EXPENSE",
          description: `Fatura ${card.name} - ${invoiceMonth}/${invoiceYear}`,
          amount: amountToAdd,
          date: dueDate.toISOString(),
          status: isPaid ? "PAID" : isOverdue ? "OVERDUE" : "PENDING",
          category: {
            id: "cat_fatura",
            name: "Fatura de Cartão",
            color: card.color || "#8B5CF6",
            icon: "credit-card",
          },
          bankAccount: card.bankAccount
            ? { id: card.bankAccount.id, nickname: card.bankAccount.nickname }
            : null,
          cardId: card.id,
          cardName: card.name
        });
      }
    }
  }

  return Array.from(invoicesMap.values()).map(inv => ({
    ...inv,
    amount: parseFloat(inv.amount.toFixed(2))
  }));
}

/**
 * Returns individual card transactions as expense-like objects (one per purchase),
 * instead of grouping into monthly invoices.
 */
export async function getCardTransactionsAsExpenses(userId: string, month?: number, year?: number): Promise<InvoiceExpense[]> {
  const [cards, payments] = await Promise.all([
    prisma.creditCard.findMany({
      where: { userId },
      include: {
        bankAccount: true,
        transactions: { include: { category: true } },
      },
    }),
    prisma.invoicePayment.findMany({ where: { userId } }),
  ]);

  const paymentIndex = new Map<string, boolean>();
  for (const p of payments) {
    paymentIndex.set(`${p.creditCardId}|${p.month}|${p.year}`, true);
  }

  const expenses: InvoiceExpense[] = [];

  for (const card of cards) {
    if (!card.transactions?.length) continue;

    for (const tx of card.transactions) {
      const purchaseDate = startOfDay(new Date(tx.purchaseDate));
      const purchaseMonth = purchaseDate.getMonth() + 1;
      const purchaseYear = purchaseDate.getFullYear();

      // Filter by purchase date month (when the expense was made)
      if (month && year && (purchaseMonth !== month || purchaseYear !== year)) continue;

      const dueDate = getInvoiceDate(tx.purchaseDate, card.closingDay, card.dueDay);
      const invoiceMonth = dueDate.getMonth() + 1;
      const invoiceYear = dueDate.getFullYear();

      const amount = tx.isInstallment && tx.installmentAmount
        ? parseFloat(tx.installmentAmount.toString())
        : parseFloat(tx.totalAmount.toString());

      const now = startOfDay(new Date());
      const isPaid = paymentIndex.has(`${card.id}|${invoiceMonth}|${invoiceYear}`);
      const isOverdue = !isPaid && dueDate < now;

      const installmentLabel = tx.isInstallment && tx.currentInstallment && tx.totalInstallments
        ? ` (${tx.currentInstallment}/${tx.totalInstallments}x)`
        : "";

      expenses.push({
        id: tx.id,
        originalId: tx.id,
        type: "EXPENSE",
        description: `${tx.description}${installmentLabel}`,
        amount: parseFloat(amount.toFixed(2)),
        date: purchaseDate.toISOString(),
        status: isPaid ? "PAID" : isOverdue ? "OVERDUE" : "PENDING",
        category: {
          id: tx.category.id,
          name: tx.category.name,
          color: tx.category.color,
          icon: tx.category.icon,
        },
        bankAccount: card.bankAccount
          ? { id: card.bankAccount.id, nickname: card.bankAccount.nickname }
          : null,
        cardId: card.id,
        cardName: card.name,
      });
    }
  }

  return expenses;
}
