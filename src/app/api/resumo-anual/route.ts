import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getInvoicesAsExpenses } from "@/lib/invoice";
import { buildForecast, toNum } from "@/lib/forecast";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const userId = session.user.id;
  const { searchParams } = new URL(req.url);
  const yearParam = searchParams.get("year");
  const year = yearParam ? parseInt(yearParam) : new Date().getFullYear();

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
  ];

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed

  // Determine which months are historical vs forecast
  let historicalCount: number;
  if (year < currentYear) {
    historicalCount = 12;
  } else if (year === currentYear) {
    historicalCount = currentMonth + 1; // current month is included as historical
  } else {
    historicalCount = 0;
  }

  // === Historical months (parallel queries) ===
  const allCardInvoices = historicalCount > 0
    ? await getInvoicesAsExpenses(userId)
    : [];

  const historicalPromises = Array.from({ length: historicalCount }, (_, m) => {
    const start = new Date(year, m, 1);
    const end = new Date(year, m + 1, 0, 23, 59, 59);

    return Promise.all([
      prisma.income.aggregate({
        where: { userId, receiveDate: { gte: start, lte: end } },
        _sum: { amount: true },
      }),
      prisma.expense.aggregate({
        where: { userId, dueDate: { gte: start, lte: end } },
        _sum: { amount: true },
      }),
      // Top expense category
      prisma.expense.groupBy({
        by: ["categoryId"],
        where: { userId, dueDate: { gte: start, lte: end } },
        _sum: { amount: true },
        orderBy: { _sum: { amount: "desc" } },
        take: 1,
      }),
      // Top income category
      prisma.income.groupBy({
        by: ["categoryId"],
        where: { userId, receiveDate: { gte: start, lte: end } },
        _sum: { amount: true },
        orderBy: { _sum: { amount: "desc" } },
        take: 1,
      }),
      // Investment deposits
      prisma.investmentTransaction.aggregate({
        where: { investment: { userId }, type: "DEPOSIT", date: { gte: start, lte: end } },
        _sum: { amount: true },
      }).catch(() => ({ _sum: { amount: null } })),
    ]);
  });

  const historicalResults = await Promise.all(historicalPromises);

  // Fetch category names for top categories
  const categoryIds = new Set<string>();
  historicalResults.forEach(([, , topExp, topInc]) => {
    if (topExp[0]?.categoryId) categoryIds.add(topExp[0].categoryId);
    if (topInc[0]?.categoryId) categoryIds.add(topInc[0].categoryId);
  });

  const categories = categoryIds.size > 0
    ? await prisma.category.findMany({
        where: { id: { in: Array.from(categoryIds) } },
        select: { id: true, name: true },
      })
    : [];
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  // Build historical month data
  const monthsData: Array<{
    monthNumber: number;
    monthName: string;
    year: number;
    income: number;
    expenses: number;
    balance: number;
    invested?: number;
    topExpenseCategory?: string;
    topExpenseAmount?: number;
    topIncomeCategory?: string;
    topIncomeAmount?: number;
    isHistorical: boolean;
    isForecast: boolean;
    fixedExpenses?: number;
    variableExpensesAvg?: number;
    cardInstallments?: number;
    variationPercent?: number;
  }> = [];

  for (let m = 0; m < historicalCount; m++) {
    const [incomeAgg, expenseAgg, topExp, topInc, investAgg] = historicalResults[m];

    const start = new Date(year, m, 1);
    const end = new Date(year, m + 1, 0, 23, 59, 59);

    const cardExpenses = allCardInvoices
      .filter((inv) => {
        const d = new Date(inv.date);
        return d >= start && d <= end;
      })
      .reduce((sum, inv) => sum + inv.amount, 0);

    const income = toNum(incomeAgg._sum.amount);
    const expenses = toNum(expenseAgg._sum.amount) + cardExpenses;
    const balance = income - expenses;

    monthsData.push({
      monthNumber: m + 1,
      monthName: monthNames[m],
      year,
      income,
      expenses,
      balance,
      invested: toNum(investAgg._sum.amount),
      topExpenseCategory: topExp[0] ? categoryMap.get(topExp[0].categoryId) : undefined,
      topExpenseAmount: topExp[0] ? toNum(topExp[0]._sum.amount) : undefined,
      topIncomeCategory: topInc[0] ? categoryMap.get(topInc[0].categoryId) : undefined,
      topIncomeAmount: topInc[0] ? toNum(topInc[0]._sum.amount) : undefined,
      isHistorical: true,
      isForecast: false,
    });
  }

  // === Forecast months ===
  const forecastCount = 12 - historicalCount;
  if (forecastCount > 0) {
    const forecastStartDate = new Date(year, historicalCount, 1);
    const forecastMonths = await buildForecast(userId, forecastStartDate, forecastCount);

    for (const fm of forecastMonths) {
      monthsData.push({
        monthNumber: fm.monthNumber,
        monthName: fm.monthName,
        year: fm.year,
        income: fm.income,
        expenses: fm.expenses,
        balance: fm.balance,
        isHistorical: false,
        isForecast: true,
        fixedExpenses: fm.fixedExpenses,
        variableExpensesAvg: fm.variableExpensesAvg,
        oneTimeExpensesAvg: fm.oneTimeExpensesAvg,
        cardInstallments: fm.cardInstallments,
      });
    }
  }

  // === Calculate month-over-month variation ===
  for (let i = 1; i < monthsData.length; i++) {
    const prev = monthsData[i - 1].balance;
    const curr = monthsData[i].balance;
    if (prev !== 0) {
      monthsData[i].variationPercent = ((curr - prev) / Math.abs(prev)) * 100;
    }
  }

  return NextResponse.json({ year, months: monthsData });
}
