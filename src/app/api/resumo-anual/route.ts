import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getInvoicesAsExpenses } from "@/lib/invoice";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const userId = session.user.id;
  const { searchParams } = new URL(req.url);
  const yearParam = searchParams.get("year");
  const year = yearParam ? parseInt(yearParam) : new Date().getFullYear();

  // Mapeamento dos meses para retornar os 12 meses do ano
  const monthsData = [];
  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  // Fetch all card invoices for the year once (avoids 12 separate DB round-trips)
  const allCardInvoices = await getInvoicesAsExpenses(userId);

  for (let m = 0; m < 12; m++) {
    const start = new Date(year, m, 1);
    const end = new Date(year, m + 1, 0, 23, 59, 59);

    const [incomeAgg, expenseAgg] = await Promise.all([
      prisma.income.aggregate({
        where: { userId, receiveDate: { gte: start, lte: end } },
        _sum: { amount: true },
      }),
      prisma.expense.aggregate({
        where: { userId, dueDate: { gte: start, lte: end } },
        _sum: { amount: true },
      }),
    ]);

    // Sum card invoices whose due date falls in this month (uses invoice due date, not purchaseDate)
    const cardExpenses = allCardInvoices
      .filter((inv) => {
        const d = new Date(inv.date);
        return d >= start && d <= end;
      })
      .reduce((sum, inv) => sum + inv.amount, 0);

    const income = parseFloat(incomeAgg._sum.amount?.toString() || "0");
    const expenses = parseFloat(expenseAgg._sum.amount?.toString() || "0") + cardExpenses;
    const balance = income - expenses;

    monthsData.push({
      monthNumber: m + 1,
      monthName: monthNames[m],
      year,
      income,
      expenses,
      balance,
    });
  }

  return NextResponse.json({ year, months: monthsData });
}
