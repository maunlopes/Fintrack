import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { incomeSchema } from "@/lib/validations/income";

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

  const income = await prisma.income.create({
    data: { ...parsed.data, userId: session.user.id },
  });

  return NextResponse.json(income, { status: 201 });
}
