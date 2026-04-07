import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 403 });

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    newUsersThisMonth,
    activeUsers,
    totalBankAccounts,
    totalExpensesThisMonth,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.user.count({ where: { lastLoginAt: { gte: thirtyDaysAgo } } }),
    prisma.bankAccount.count(),
    prisma.expense.count({
      where: { dueDate: { gte: startOfMonth, lt: new Date(now.getFullYear(), now.getMonth() + 1, 1) } },
    }),
  ]);

  // New users per month (last 6 months)
  const monthlyRegistrations = [];
  for (let i = 5; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const count = await prisma.user.count({ where: { createdAt: { gte: start, lt: end } } });
    monthlyRegistrations.push({
      month: start.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
      count,
    });
  }

  return NextResponse.json({
    totalUsers,
    newUsersThisMonth,
    activeUsers,
    totalBankAccounts,
    totalExpensesThisMonth,
    monthlyRegistrations,
  });
}
