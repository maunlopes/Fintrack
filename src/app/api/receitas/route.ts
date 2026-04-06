import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { incomeSchema } from "@/lib/validations/income";
import { addMonths } from "date-fns";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month");
  const year = searchParams.get("year");

  const where: Record<string, unknown> = { userId: session.user.id };
  if (month && year) {
    const start = new Date(parseInt(year), parseInt(month) - 1, 1);
    const end = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
    where.receiveDate = { gte: start, lte: end };
  }

  const incomes = await prisma.income.findMany({
    where,
    include: {
      category: true,
      bankAccount: { select: { id: true, nickname: true } },
    },
    orderBy: { receiveDate: "asc" },
  });

  return NextResponse.json(incomes);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();
  const parsed = incomeSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const data = parsed.data;

  try {
    const income = await prisma.income.create({
      data: { ...data, userId: session.user.id },
    });

    // Generate monthly records for recurring incomes with end date
    if (data.isRecurring && data.recurrenceEnd) {
      const startDate = data.receiveDate;
      const endDate = new Date(data.recurrenceEnd);
      const childData = [];
      let current = addMonths(startDate, 1);

      while (current <= endDate) {
        childData.push({
          userId: session.user.id,
          description: data.description,
          amount: data.amount,
          receiveDate: current,
          categoryId: data.categoryId,
          bankAccountId: data.bankAccountId,
          isRecurring: true,
          recurrenceFrequency: data.recurrenceFrequency ?? null,
          recurrenceStart: data.recurrenceStart ?? null,
          recurrenceEnd: data.recurrenceEnd ?? null,
          status: "PENDING" as const,
          notes: data.notes ?? null,
          parentIncomeId: income.id,
        });
        current = addMonths(current, 1);
      }

      for (const child of childData) {
        await prisma.income.create({ data: child as any });
      }
    }

    return NextResponse.json(income, { status: 201 });
  } catch (error: any) {
    console.error("[RECEITAS_POST_ERROR]", error);
    return NextResponse.json({ error: error.message || "Erro interno" }, { status: 500 });
  }
}
