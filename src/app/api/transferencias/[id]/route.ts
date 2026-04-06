import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const { id } = await params;

  const transfer = await prisma.transfer.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!transfer) return NextResponse.json({ error: "Transferência não encontrada" }, { status: 404 });

  // Atomic: reverse balances + delete
  await prisma.$transaction([
    prisma.bankAccount.update({
      where: { id: transfer.fromAccountId },
      data: { balance: { increment: transfer.amount } },
    }),
    prisma.bankAccount.update({
      where: { id: transfer.toAccountId },
      data: { balance: { decrement: transfer.amount } },
    }),
    prisma.transfer.delete({ where: { id } }),
  ]);

  return NextResponse.json({ success: true });
}
