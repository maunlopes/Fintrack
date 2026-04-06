import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { transferSchema } from "@/lib/validations/transfer";

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
    where.date = { gte: start, lte: end };
  }

  const transfers = await prisma.transfer.findMany({
    where,
    include: {
      fromAccount: { select: { id: true, nickname: true, name: true, color: true } },
      toAccount: { select: { id: true, nickname: true, name: true, color: true } },
    },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(transfers);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();
  const parsed = transferSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { fromAccountId, toAccountId, amount, date, description } = parsed.data;
  const userId = session.user.id;

  // Verify both accounts belong to user
  const [fromAccount, toAccount] = await Promise.all([
    prisma.bankAccount.findFirst({ where: { id: fromAccountId, userId } }),
    prisma.bankAccount.findFirst({ where: { id: toAccountId, userId } }),
  ]);

  if (!fromAccount) return NextResponse.json({ error: "Conta de origem não encontrada" }, { status: 404 });
  if (!toAccount) return NextResponse.json({ error: "Conta de destino não encontrada" }, { status: 404 });

  // Atomic: create transfer + update balances
  const [transfer] = await prisma.$transaction([
    prisma.transfer.create({
      data: { userId, fromAccountId, toAccountId, amount, date, description },
    }),
    prisma.bankAccount.update({
      where: { id: fromAccountId },
      data: { balance: { decrement: amount } },
    }),
    prisma.bankAccount.update({
      where: { id: toAccountId },
      data: { balance: { increment: amount } },
    }),
  ]);

  return NextResponse.json(transfer, { status: 201 });
}
