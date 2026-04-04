import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { creditCardSchema } from "@/lib/validations/credit-card";
import { startOfMonth, endOfMonth, subMonths } from "date-fns";
import { getInvoiceDate } from "@/lib/invoice";

function toNum(v: any): number {
  if (v === null || v === undefined) return 0;
  return parseFloat(v.toString());
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const prevMonthStart = startOfMonth(subMonths(now, 1));
  const prevMonthEnd = endOfMonth(subMonths(now, 1));

  const cards = await prisma.creditCard.findMany({
    where: { userId: session.user.id, isActive: true },
    include: {
      bankAccount: { select: { id: true, nickname: true } },
      transactions: {
        select: {
          id: true,
          description: true,
          totalAmount: true,
          installmentAmount: true,
          isInstallment: true,
          purchaseDate: true,
          category: { select: { name: true, color: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  // Calculate per-card spending for current and previous month
  const cardsWithStats = cards.map((card) => {
    let currentMonthTotal = 0;
    let prevMonthTotal = 0;
    let topTransaction: { description: string; amount: number; cardName: string; purchaseDate: string; categoryName: string; categoryColor: string } | null = null;

    for (const tx of card.transactions) {
      const dueDate = getInvoiceDate(tx.purchaseDate, card.closingDay, card.dueDay);
      const amount = tx.isInstallment && tx.installmentAmount ? toNum(tx.installmentAmount) : toNum(tx.totalAmount);

      if (dueDate >= monthStart && dueDate <= monthEnd) {
        currentMonthTotal += amount;
        if (!topTransaction || amount > topTransaction.amount) {
          topTransaction = {
            description: tx.description,
            amount,
            cardName: card.name,
            purchaseDate: tx.purchaseDate.toISOString(),
            categoryName: tx.category.name,
            categoryColor: tx.category.color,
          };
        }
      }
      if (dueDate >= prevMonthStart && dueDate <= prevMonthEnd) {
        prevMonthTotal += amount;
      }
    }

    const { transactions, ...cardData } = card;
    return {
      ...cardData,
      currentMonthTotal,
      prevMonthTotal,
      topTransaction,
    };
  });

  return NextResponse.json(cardsWithStats);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();
  const parsed = creditCardSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { bankAccountId, ...data } = parsed.data;
  const card = await prisma.creditCard.create({
    data: {
      ...data,
      userId: session.user.id,
      bankAccountId: bankAccountId || null,
    },
  });

  return NextResponse.json(card, { status: 201 });
}
