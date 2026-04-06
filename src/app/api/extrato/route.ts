import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth } from "date-fns";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const userId = session.user.id;
  const { searchParams } = new URL(req.url);
  const monthParam = searchParams.get("month");
  const yearParam = searchParams.get("year");

  let start: Date;
  let end: Date;

  if (monthParam && yearParam) {
    const m = parseInt(monthParam) - 1;
    const y = parseInt(yearParam);
    start = new Date(y, m, 1);
    end = new Date(y, m + 1, 0, 23, 59, 59);
  } else {
    const now = new Date();
    start = startOfMonth(now);
    end = endOfMonth(now);
  }

  // Fetch Incomes
  const incomes = await prisma.income.findMany({
    where: { userId, receiveDate: { gte: start, lte: end } },
    include: { category: true, bankAccount: { select: { id: true, nickname: true } } },
  });

  // Fetch Expenses
  const expenses = await prisma.expense.findMany({
    where: { userId, dueDate: { gte: start, lte: end } },
    include: { category: true, bankAccount: { select: { id: true, nickname: true } } },
  });

  // Fetch Investment Transactions linked to Bank Accounts
  const investmentTxs = await prisma.investmentTransaction.findMany({
    where: {
      investment: { userId },
      bankAccountId: { not: null },
      date: { gte: start, lte: end }
    },
    include: {
      investment: { select: { name: true, type: true } },
      bankAccount: { select: { id: true, nickname: true } }
    }
  });

  // Merge them into a generic "Transaction" type
  const transactions = [
    ...incomes.map((i: any) => ({
      id: `inc_${i.id}`,
      originalId: i.id,
      type: "INCOME" as const,
      description: i.description,
      amount: parseFloat(i.amount.toString()),
      date: i.receiveDate.toISOString(),
      status: i.status,
      category: i.category,
      bankAccount: i.bankAccount,
    })),
    ...expenses.map((e: any) => ({
      id: `exp_${e.id}`,
      originalId: e.id,
      type: "EXPENSE" as const,
      description: e.description,
      amount: parseFloat(e.amount.toString()),
      date: e.dueDate.toISOString(),
      status: e.status,
      category: e.category,
      bankAccount: e.bankAccount,
    })),
    ...investmentTxs.map((inv: any) => {
      // Deposit is money OUT of the bank account
      // Withdrawal / Dividend (if mapped to bank) is money IN
      const isOut = inv.type === "DEPOSIT"; 
      return {
        id: `inv_${inv.id}`,
        originalId: inv.id,
        type: isOut ? ("EXPENSE" as const) : ("INCOME" as const),
        description: inv.description || (isOut ? `Aporte: ${inv.investment.name}` : `Resgate/Rend.: ${inv.investment.name}`),
        amount: parseFloat(inv.amount.toString()),
        date: inv.date.toISOString(),
        status: "PAID" as const, // Investimentos são liquidados de imediato no modelo atual
        category: { name: "Investimento", color: "#2563EB" },
        bankAccount: inv.bankAccount,
      };
    }),
  ];

  // Sort by date (oldest to newest)
  transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Calculate Summary metrics
  const summary = {
    incomePaid: transactions.filter(t => t.type === "INCOME" && t.status === "PAID").reduce((s, t) => s + t.amount, 0),
    incomePending: transactions.filter(t => t.type === "INCOME" && t.status !== "PAID").reduce((s, t) => s + t.amount, 0),
    expensePaid: transactions.filter(t => t.type === "EXPENSE" && t.status === "PAID").reduce((s, t) => s + t.amount, 0),
    expensePending: transactions.filter(t => t.type === "EXPENSE" && t.status !== "PAID").reduce((s, t) => s + t.amount, 0),
  };

  const projectedBalance = (summary.incomePaid + summary.incomePending) - (summary.expensePaid + summary.expensePending);

  return NextResponse.json({
    summary: {
      ...summary,
      projectedBalance
    },
    transactions
  });
}
