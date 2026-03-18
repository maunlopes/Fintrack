import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getInvoicesAsExpenses } from "@/lib/invoice";
import { startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toNum(v: any): number {
  if (v === null || v === undefined) return 0;
  return parseFloat(v.toString());
}

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const userId = session.user.id;
  const { searchParams } = new URL(req.url);
  const forecastMonths = Math.min(Math.max(parseInt(searchParams.get("forecast") || "6") || 6, 1), 24);

  const monthParam = searchParams.get("month");
  const yearParam = searchParams.get("year");

  let now = new Date();
  if (monthParam && yearParam) {
    const m = parseInt(monthParam) - 1; // 0-indexed month
    const y = parseInt(yearParam);
    if (!isNaN(m) && !isNaN(y)) {
      now = new Date(y, m, 1);
    }
  }

  // === KPIs for current month ===
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  // === Build all month ranges upfront ===
  const historicalMonths = 12;
  const historicalRanges = Array.from({ length: historicalMonths }, (_, i) => {
    const date = subMonths(now, historicalMonths - 1 - i);
    return { start: startOfMonth(date), end: endOfMonth(date) };
  });

  const forecastRanges = Array.from({ length: forecastMonths }, (_, i) => {
    const date = addMonths(now, i + 1);
    return { start: startOfMonth(date), end: endOfMonth(date) };
  });

  // === Run ALL queries in parallel ===
  const [
    incomeAgg,
    expenseAgg,
    cardAgg,
    bankAccounts,
    investmentAgg,
    historicalResults,
    categoryBreakdown,
    creditCards,
    rawExpenses,
    allInvoices,
    recurringIncomes,
    fixedExpenses,
    variableExpenses,
    forecastOneTimeIncomes,
    forecastFutureCards,
  ] = await Promise.all([
    // KPIs
    prisma.income.aggregate({
      where: { userId, receiveDate: { gte: monthStart, lte: monthEnd } },
      _sum: { amount: true },
    }),
    prisma.expense.aggregate({
      where: { userId, dueDate: { gte: monthStart, lte: monthEnd } },
      _sum: { amount: true },
    }),
    prisma.cardTransaction.aggregate({
      where: {
        creditCard: { userId },
        purchaseDate: { gte: monthStart, lte: monthEnd },
      },
      _sum: { totalAmount: true },
    }),
    prisma.bankAccount.findMany({
      where: { userId, isActive: true },
      select: { balance: true },
    }),
    prisma.investment.aggregate({
      where: { userId, isActive: true },
      _sum: { balance: true },
    }).catch(() => ({ _sum: { balance: null } })),

    // Historical data — all months in parallel
    Promise.all(
      historicalRanges.map(({ start, end }) =>
        Promise.all([
          prisma.income.aggregate({
            where: { userId, receiveDate: { gte: start, lte: end } },
            _sum: { amount: true },
          }),
          prisma.expense.aggregate({
            where: { userId, dueDate: { gte: start, lte: end } },
            _sum: { amount: true },
          }),
          prisma.cardTransaction.aggregate({
            where: { creditCard: { userId }, purchaseDate: { gte: start, lte: end } },
            _sum: { totalAmount: true },
          }),
        ])
      )
    ),

    // Category breakdown
    prisma.expense.groupBy({
      by: ["categoryId"],
      where: { userId, dueDate: { gte: monthStart, lte: monthEnd } },
      _sum: { amount: true },
    }),

    // Credit cards
    prisma.creditCard.findMany({
      where: { userId, isActive: true },
      include: {
        transactions: {
          where: { purchaseDate: { gte: monthStart, lte: monthEnd } },
          select: { totalAmount: true, installmentAmount: true, isInstallment: true },
        },
      },
    }),

    // Upcoming expenses
    prisma.expense.findMany({
      where: { userId, status: { in: ["PENDING", "OVERDUE"] }, dueDate: { gte: now } },
      include: {
        category: true,
        bankAccount: { select: { id: true, nickname: true } },
      },
      orderBy: { dueDate: "asc" },
      take: 10,
    }),

    // Invoices
    getInvoicesAsExpenses(userId).catch(() => [] as Awaited<ReturnType<typeof getInvoicesAsExpenses>>),

    // Forecast base data
    prisma.income.findMany({
      where: { userId, isRecurring: true },
      select: { amount: true, recurrenceFrequency: true, recurrenceEnd: true },
    }),
    prisma.expense.findMany({
      where: { userId, isRecurring: true, type: "FIXED_RECURRING" },
      select: { amount: true, recurrenceEnd: true },
    }),
    prisma.expense.findMany({
      where: { userId, type: "VARIABLE_RECURRING" },
      orderBy: { dueDate: "desc" },
      take: 3,
      select: { amount: true },
    }),

    // Forecast one-time incomes — all months in parallel
    Promise.all(
      forecastRanges.map(({ start, end }) =>
        prisma.income.aggregate({
          where: { userId, isRecurring: false, receiveDate: { gte: start, lte: end } },
          _sum: { amount: true },
        })
      )
    ),

    // Forecast future card installments — all months in parallel
    Promise.all(
      forecastRanges.map(({ start, end }) =>
        prisma.cardTransaction.aggregate({
          where: {
            creditCard: { userId },
            purchaseDate: { gte: start, lte: end },
            parentTransactionId: { not: null },
          },
          _sum: { installmentAmount: true },
        })
      )
    ),
  ]);

  // === Assemble KPIs ===
  const monthIncome = toNum(incomeAgg._sum.amount);
  const monthExpenses = toNum(expenseAgg._sum.amount) + toNum(cardAgg._sum.totalAmount);
  const balance = monthIncome - monthExpenses;
  const totalBalance = bankAccounts.reduce((sum: number, a: { balance: any }) => sum + toNum(a.balance), 0);
  const totalInvested = toNum((investmentAgg as any)._sum?.balance);

  // === Assemble historical data ===
  const historicalData = historicalRanges.map(({ start }, i) => {
    const [inc, exp, card] = historicalResults[i];
    return {
      month: start.toISOString(),
      income: toNum(inc._sum.amount),
      expenses: toNum(exp._sum.amount) + toNum(card._sum.totalAmount),
    };
  });

  // === Assemble forecast data ===
  const variableAvg = variableExpenses.length > 0
    ? variableExpenses.reduce((s: number, e: { amount: any }) => s + toNum(e.amount), 0) / variableExpenses.length
    : 0;

  let runningBalance = totalBalance;
  const forecastData = forecastRanges.map(({ start }, i) => {
    let projectedIncome = recurringIncomes
      .filter((inc: { recurrenceEnd: Date | null }) => !inc.recurrenceEnd || new Date(inc.recurrenceEnd) >= start)
      .reduce((sum: number, inc: { amount: any; recurrenceFrequency: any }) => {
        const freq = inc.recurrenceFrequency;
        if (freq === "BIWEEKLY") return sum + toNum(inc.amount) * 2;
        if (freq === "WEEKLY") return sum + toNum(inc.amount) * 4;
        return sum + toNum(inc.amount);
      }, 0);

    projectedIncome += toNum(forecastOneTimeIncomes[i]._sum.amount);

    let projectedExpenses = fixedExpenses
      .filter((exp: { recurrenceEnd: Date | null }) => !exp.recurrenceEnd || new Date(exp.recurrenceEnd) >= start)
      .reduce((sum: number, exp: { amount: any }) => sum + toNum(exp.amount), 0);

    projectedExpenses += variableAvg;
    projectedExpenses += toNum(forecastFutureCards[i]._sum.installmentAmount);

    runningBalance = runningBalance + projectedIncome - projectedExpenses;

    return {
      month: start.toISOString(),
      income: projectedIncome,
      expenses: projectedExpenses,
      saldo: runningBalance,
      isForecast: true,
    };
  });

  // === Assemble category data ===
  const categoryIds = categoryBreakdown.map((c: { categoryId: string }) => c.categoryId);
  const categories = await prisma.category.findMany({ where: { id: { in: categoryIds } } });

  const categoryData = categoryBreakdown.map((c: { categoryId: string; _sum: { amount: any } }) => {
    const cat = categories.find((cat: { id: string; name: string; color: string | null }) => cat.id === c.categoryId);
    return {
      name: cat?.name || "Outros",
      value: toNum(c._sum.amount),
      color: cat?.color || "#8A9AA3",
    };
  });

  // === Credit card utilization ===
  const cardUtilization = creditCards.map((card: any) => {
    const used = card.transactions.reduce((sum: number, t: { isInstallment: boolean; installmentAmount: any; totalAmount: any }) => {
      return sum + (t.isInstallment ? toNum(t.installmentAmount) : toNum(t.totalAmount));
    }, 0);
    const limit = toNum(card.creditLimit);
    return {
      id: card.id,
      name: card.name,
      color: card.color,
      used,
      limit,
      available: Math.max(0, limit - used),
      percentage: limit > 0 ? Math.round((used / limit) * 100) : 0,
    };
  });

  // === Upcoming expenses ===
  const upcomingInvoices = allInvoices
    .filter((inv) => (inv.status === "PENDING" || inv.status === "OVERDUE") && new Date(inv.date) >= now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5)
    .map((inv: (typeof allInvoices)[0]) => ({
      id: inv.id,
      description: inv.description,
      amount: inv.amount.toString(),
      dueDate: inv.date,
      category: inv.category,
      status: inv.status,
      bankAccount: inv.bankAccount,
      cardId: inv.cardId,
      cardName: inv.cardName,
    }));

  type UpcomingItem = { dueDate: string; [key: string]: unknown };
  const upcomingExpenses: UpcomingItem[] = [
    ...rawExpenses.map((e: (typeof rawExpenses)[0]) => ({
      ...e,
      amount: e.amount.toString(),
      dueDate: e.dueDate.toISOString(),
    })),
    ...upcomingInvoices,
  ]
    .sort((a: UpcomingItem, b: UpcomingItem) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 10);

    return NextResponse.json({
      kpis: { monthIncome, monthExpenses, balance, totalBalance, totalInvested },
      historicalData,
      forecastData,
      categoryData,
      cardUtilization,
      upcomingExpenses,
    });
  } catch (error: any) {
    console.error("[DASHBOARD_GET_ERROR]", error);
    return NextResponse.json({ error: error.message || "Erro interno ao gerar dashboard" }, { status: 500 });
  }
}
