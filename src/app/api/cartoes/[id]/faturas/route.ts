import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getInvoiceDate } from "@/lib/invoice";
import { startOfDay } from "date-fns";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, props: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await props.params;

  const [card, payments] = await Promise.all([
    prisma.creditCard.findFirst({
      where: { id, userId: session.user.id },
      include: {
        transactions: {
          include: { category: true },
          orderBy: { purchaseDate: "asc" },
        },
      },
    }),
    prisma.invoicePayment.findMany({
      where: { creditCardId: id, userId: session.user.id },
      include: { bankAccount: { select: { id: true, nickname: true } } }
    })
  ]);

  if (!card) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  // Index payments for O(1) lookup
  const paymentIndex = new Map<string, typeof payments[0]>();
  for (const p of payments) {
    paymentIndex.set(`${p.month}|${p.year}`, p);
  }

  const now = startOfDay(new Date());

  type InvoiceEntry = {
    invoiceKey: string;
    month: number;
    year: number;
    dueDate: string;
    totalAmount: number;
    status: "PENDING" | "PAID" | "OVERDUE";
    payment: { paidAt: string; amount: number; bankAccount: { id: string; nickname: string } } | null;
    transactions: Array<{
      id: string;
      description: string;
      amount: number;
      purchaseDate: string;
      isInstallment: boolean;
      currentInstallment: number | null;
      totalInstallments: number | null;
      category: { id: string; name: string; color: string };
    }>;
  };

  const invoicesMap = new Map<string, InvoiceEntry>();

  for (const tx of card.transactions) {
    const dueDate = getInvoiceDate(tx.purchaseDate, card.closingDay, card.dueDay);
    const month = dueDate.getMonth() + 1;
    const year = dueDate.getFullYear();
    const invoiceKey = `${year}-${String(month).padStart(2, "0")}`;

    const amount =
      tx.isInstallment && tx.installmentAmount
        ? parseFloat(tx.installmentAmount.toString())
        : parseFloat(tx.totalAmount.toString());

    const txEntry = {
      id: tx.id,
      description: tx.description,
      amount,
      purchaseDate: tx.purchaseDate.toISOString(),
      isInstallment: tx.isInstallment,
      currentInstallment: tx.currentInstallment,
      totalInstallments: tx.totalInstallments,
      category: {
        id: tx.category.id,
        name: tx.category.name,
        color: tx.category.color,
      },
    };

    if (invoicesMap.has(invoiceKey)) {
      const inv = invoicesMap.get(invoiceKey)!;
      inv.totalAmount += amount;
      inv.transactions.push(txEntry);
    } else {
      const paymentRecord = paymentIndex.get(`${month}|${year}`);
      const isPaid = !!paymentRecord;
      const isOverdue = !isPaid && dueDate < now;

      invoicesMap.set(invoiceKey, {
        invoiceKey,
        month,
        year,
        dueDate: dueDate.toISOString(),
        totalAmount: amount,
        status: isPaid ? "PAID" : isOverdue ? "OVERDUE" : "PENDING",
        payment: paymentRecord
          ? {
              paidAt: paymentRecord.paidAt.toISOString(),
              amount: parseFloat(paymentRecord.amount.toString()),
              bankAccount: paymentRecord.bankAccount!
            }
          : null,
        transactions: [txEntry],
      });
    }
  }

  const invoices = Array.from(invoicesMap.values())
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .map((inv) => ({ ...inv, totalAmount: parseFloat(inv.totalAmount.toFixed(2)) }));

  return NextResponse.json({
    card: {
      id: card.id,
      name: card.name,
      creditLimit: parseFloat(card.creditLimit.toString()),
      closingDay: card.closingDay,
      dueDay: card.dueDay,
    },
    invoices,
  });
}
