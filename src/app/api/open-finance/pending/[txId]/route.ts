import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const acceptSchema = z.object({
  categoryId: z.string().min(1),
  bankAccountId: z.string().min(1),
  description: z.string().optional(),
});

// POST /api/open-finance/pending/[txId]/accept
export async function POST(
  req: Request,
  { params }: { params: Promise<{ txId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { txId } = await params;
  const url = new URL(req.url);
  const action = url.pathname.split("/").pop(); // "accept" or "ignore"

  const tx = await prisma.pluggySyncedTransaction.findUnique({
    where: { id: txId },
    include: { pluggyAccount: { include: { pluggyItem: true } } },
  });

  if (!tx || tx.pluggyAccount.pluggyItem.userId !== session.user.id)
    return NextResponse.json({ error: "Transação não encontrada" }, { status: 404 });

  if (tx.status !== "PENDING_REVIEW")
    return NextResponse.json({ error: "Transação já processada" }, { status: 400 });

  if (action === "ignore") {
    await prisma.pluggySyncedTransaction.update({
      where: { id: txId },
      data: { status: "IGNORED" },
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "accept") {
    const body = await req.json();
    const parsed = acceptSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const { categoryId, bankAccountId, description } = parsed.data;
    const amount = Number(tx.amount);
    const isDebit = tx.type === "DEBIT";

    if (isDebit) {
      const expense = await prisma.expense.create({
        data: {
          userId: session.user.id,
          description: description ?? tx.description,
          amount,
          dueDate: tx.date,
          categoryId,
          bankAccountId,
          type: "ONE_TIME",
          status: "PAID",
        },
      });

      await prisma.pluggySyncedTransaction.update({
        where: { id: txId },
        data: { status: "ACCEPTED", mappedExpenseId: expense.id },
      });
    } else {
      const income = await prisma.income.create({
        data: {
          userId: session.user.id,
          description: description ?? tx.description,
          amount,
          receiveDate: tx.date,
          categoryId,
          bankAccountId,
          status: "PAID",
        },
      });

      await prisma.pluggySyncedTransaction.update({
        where: { id: txId },
        data: { status: "ACCEPTED", mappedIncomeId: income.id },
      });
    }

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
}
