import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { expenseSchema } from "@/lib/validations/expense";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const { id } = await params;

  const expense = await prisma.expense.findFirst({ where: { id, userId: session.user.id } });
  if (!expense) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const body = await req.json();

  // Partial status update
  if (body.status && Object.keys(body).filter(k => k !== "paidAt").length === 1) {
    const wasAlreadyPaid = expense.status === "PAID";
    const markingAsPaid = body.status === "PAID";
    const reverting = wasAlreadyPaid && !markingAsPaid;
    const paidAt = body.paidAt ? new Date(body.paidAt) : new Date();

    // Mark as PAID → debit bank account atomically
    if (markingAsPaid && !wasAlreadyPaid && expense.bankAccountId) {
      const [updated] = await prisma.$transaction([
        prisma.expense.update({ where: { id }, data: { status: "PAID", paidAt } }),
        prisma.bankAccount.update({
          where: { id: expense.bankAccountId },
          data: { balance: { decrement: expense.amount } },
        }),
      ]);
      return NextResponse.json(updated);
    }

    // Revert from PAID → restore bank account balance
    if (reverting && expense.bankAccountId) {
      const [updated] = await prisma.$transaction([
        prisma.expense.update({ where: { id }, data: { status: body.status, paidAt: null } }),
        prisma.bankAccount.update({
          where: { id: expense.bankAccountId },
          data: { balance: { increment: expense.amount } },
        }),
      ]);
      return NextResponse.json(updated);
    }

    // No bank account linked — just update status
    const updated = await prisma.expense.update({
      where: { id },
      data: { status: body.status, paidAt: markingAsPaid ? paidAt : null },
    });
    return NextResponse.json(updated);
  }

  const parsed = expenseSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { bankAccountId, ...data } = parsed.data;
  const updated = await prisma.expense.update({
    where: { id },
    data: { ...data, bankAccountId: bankAccountId || null },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const { id } = await params;

  const expense = await prisma.expense.findFirst({ where: { id, userId: session.user.id } });
  if (!expense) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  await prisma.expense.deleteMany({ where: { parentExpenseId: id } });
  await prisma.expense.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
