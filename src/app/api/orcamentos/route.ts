import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const userId = session.user.id;
  const { searchParams } = new URL(req.url);

  const now = new Date();
  const month = parseInt(searchParams.get("month") || String(now.getMonth() + 1));
  const year = parseInt(searchParams.get("year") || String(now.getFullYear()));

  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

  // Fetch all EXPENSE categories (user + default)
  const categories = await prisma.category.findMany({
    where: {
      type: "EXPENSE",
      OR: [{ userId }, { isDefault: true }],
    },
    include: {
      budgets: { where: { userId } },
    },
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
  });

  // Parallel aggregation of spending per category
  const spendingResults = await Promise.all(
    categories.map(async (cat) => {
      const [expenseAgg, cardAgg] = await Promise.all([
        prisma.expense.aggregate({
          where: {
            userId,
            categoryId: cat.id,
            dueDate: { gte: startOfMonth, lte: endOfMonth },
          },
          _sum: { amount: true },
        }),
        prisma.cardTransaction.aggregate({
          where: {
            category: { OR: [{ userId }, { isDefault: true }] },
            categoryId: cat.id,
            purchaseDate: { gte: startOfMonth, lte: endOfMonth },
          },
          _sum: { installmentAmount: true, totalAmount: true },
        }),
      ]);

      const expenseTotal = Number(expenseAgg._sum.amount ?? 0);
      // Use installmentAmount (parcelado) when available, else totalAmount
      const cardTotal =
        Number(cardAgg._sum.installmentAmount ?? 0) ||
        Number(cardAgg._sum.totalAmount ?? 0);

      return { categoryId: cat.id, spent: expenseTotal + cardTotal };
    })
  );

  const spendingMap = Object.fromEntries(
    spendingResults.map((r) => [r.categoryId, r.spent])
  );

  const result = categories.map((cat) => {
    const budget = cat.budgets[0] ?? null;
    const spent = spendingMap[cat.id] ?? 0;
    const limit = budget ? Number(budget.monthlyLimit) : null;
    const percentage = limit && limit > 0 ? (spent / limit) * 100 : null;
    const status =
      percentage === null
        ? "none"
        : percentage >= 100
        ? "danger"
        : percentage >= 80
        ? "warning"
        : "ok";

    return {
      id: cat.id,
      name: cat.name,
      icon: cat.icon,
      color: cat.color,
      isDefault: cat.isDefault,
      monthlyLimit: limit,
      spent,
      percentage,
      status,
    };
  });

  return NextResponse.json(result);
}
