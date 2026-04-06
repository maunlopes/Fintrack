import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { incomeSchema } from "@/lib/validations/income";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const { id } = await params;

  const income = await prisma.income.findFirst({ where: { id, userId: session.user.id } });
  if (!income) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const body = await req.json();

  if (body.status) {
    const wasAlreadyPaid = income.status === "PAID";
    const markingAsPaid = body.status === "PAID";
    const reverting = wasAlreadyPaid && !markingAsPaid;

    // Mark as PAID → update fields + increment bank account balance
    if (markingAsPaid && !wasAlreadyPaid) {
      const newAmount = body.amount != null ? body.amount : income.amount;
      const newBankAccountId = body.bankAccountId || income.bankAccountId;
      const updateData: Record<string, unknown> = { status: "PAID" };
      if (body.amount != null) updateData.amount = body.amount;
      if (body.bankAccountId) updateData.bankAccountId = body.bankAccountId;
      if (body.receiveDate) updateData.receiveDate = new Date(body.receiveDate + "T12:00:00");

      if (newBankAccountId) {
        const [updated] = await prisma.$transaction([
          prisma.income.update({ where: { id }, data: updateData }),
          prisma.bankAccount.update({
            where: { id: newBankAccountId },
            data: { balance: { increment: newAmount } },
          }),
        ]);
        return NextResponse.json(updated);
      }

      const updated = await prisma.income.update({ where: { id }, data: updateData });
      return NextResponse.json(updated);
    }

    // Revert from PAID → decrement bank account balance
    if (reverting && income.bankAccountId) {
      const [updated] = await prisma.$transaction([
        prisma.income.update({ where: { id }, data: { status: body.status } }),
        prisma.bankAccount.update({
          where: { id: income.bankAccountId },
          data: { balance: { decrement: income.amount } },
        }),
      ]);
      return NextResponse.json(updated);
    }

    const updated = await prisma.income.update({ where: { id }, data: { status: body.status } });
    return NextResponse.json(updated);
  }

  const parsed = incomeSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const updated = await prisma.income.update({ where: { id }, data: parsed.data });
  return NextResponse.json(updated);
}

export async function DELETE(req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const { id } = await params;

  const income = await prisma.income.findFirst({ where: { id, userId: session.user.id } });
  if (!income) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const deleteAll = searchParams.get("deleteAll") === "true";

  if (deleteAll) {
    const parentId = income.parentIncomeId || id;
    await prisma.income.deleteMany({ where: { parentIncomeId: parentId } });
    await prisma.income.delete({ where: { id: parentId } });
  } else {
    await prisma.income.delete({ where: { id } });
  }

  return NextResponse.json({ success: true });
}
