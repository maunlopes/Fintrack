import { prisma } from "./prisma";
import { startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toNum(v: any): number {
  if (v === null || v === undefined) return 0;
  return parseFloat(v.toString());
}

export interface ForecastMonth {
  month: string;
  monthNumber: number;
  monthName: string;
  year: number;
  income: number;
  expenses: number;
  balance: number;
  fixedExpenses: number;
  variableExpensesAvg: number;
  oneTimeExpensesAvg: number;
  cardInstallments: number;
  saldo: number;
  isForecast: true;
}

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

/**
 * Builds a financial forecast for the given number of months starting from baseDate.
 * Reuses data from recurring incomes, fixed/variable expenses, and card installments.
 */
export async function buildForecast(
  userId: string,
  baseDate: Date,
  months: number,
): Promise<ForecastMonth[]> {
  const ranges = Array.from({ length: months }, (_, i) => {
    const date = addMonths(baseDate, i);
    return { start: startOfMonth(date), end: endOfMonth(date) };
  });

  // Average one-time expenses from last 3 months
  const threeMonthsAgo = subMonths(baseDate, 3);

  const [
    recurringIncomes,
    fixedExpenses,
    variableExpenses,
    oneTimeExpensesLast3,
    forecastOneTimeIncomes,
    forecastFutureCards,
  ] = await Promise.all([
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
    // One-time expenses from last 3 completed months (for average)
    prisma.expense.findMany({
      where: {
        userId,
        type: "ONE_TIME",
        parentExpenseId: null,
        dueDate: { gte: startOfMonth(threeMonthsAgo), lt: startOfMonth(baseDate) },
      },
      select: { amount: true, dueDate: true },
    }),
    Promise.all(
      ranges.map(({ start, end }) =>
        prisma.income.aggregate({
          where: { userId, isRecurring: false, receiveDate: { gte: start, lte: end } },
          _sum: { amount: true },
        })
      )
    ),
    Promise.all(
      ranges.map(({ start, end }) =>
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

  const variableAvg =
    variableExpenses.length > 0
      ? variableExpenses.reduce((s, e) => s + toNum(e.amount), 0) / variableExpenses.length
      : 0;

  // Group one-time expenses by month, then average
  const oneTimeByMonth = new Map<string, number>();
  for (const exp of oneTimeExpensesLast3) {
    const key = `${new Date(exp.dueDate).getFullYear()}-${new Date(exp.dueDate).getMonth()}`;
    oneTimeByMonth.set(key, (oneTimeByMonth.get(key) ?? 0) + toNum(exp.amount));
  }
  const oneTimeMonthCount = oneTimeByMonth.size;
  const oneTimeAvg = oneTimeMonthCount > 0
    ? Array.from(oneTimeByMonth.values()).reduce((s, v) => s + v, 0) / oneTimeMonthCount
    : 0;

  return ranges.map(({ start }, i) => {
    const projectedIncome = recurringIncomes
      .filter((inc) => !inc.recurrenceEnd || new Date(inc.recurrenceEnd) >= start)
      .reduce((sum, inc) => {
        const freq = inc.recurrenceFrequency;
        if (freq === "BIWEEKLY") return sum + toNum(inc.amount) * 2;
        if (freq === "WEEKLY") return sum + toNum(inc.amount) * 4;
        return sum + toNum(inc.amount);
      }, 0)
      + toNum(forecastOneTimeIncomes[i]._sum.amount);

    const fixed = fixedExpenses
      .filter((exp) => !exp.recurrenceEnd || new Date(exp.recurrenceEnd) >= start)
      .reduce((sum, exp) => sum + toNum(exp.amount), 0);

    const cards = toNum(forecastFutureCards[i]._sum.installmentAmount);
    const projectedExpenses = fixed + variableAvg + cards;
    const balance = projectedIncome - projectedExpenses;

    return {
      month: start.toISOString(),
      monthNumber: start.getMonth() + 1,
      monthName: MONTH_NAMES[start.getMonth()],
      year: start.getFullYear(),
      income: projectedIncome,
      expenses: projectedExpenses,
      balance,
      fixedExpenses: fixed,
      variableExpensesAvg: variableAvg,
      oneTimeExpensesAvg: oneTimeAvg,
      cardInstallments: cards,
      saldo: balance,
      isForecast: true as const,
    };
  });
}
