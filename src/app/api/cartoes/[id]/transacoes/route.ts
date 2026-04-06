import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cardTransactionSchema } from "@/lib/validations/credit-card";
import { addMonths } from "date-fns";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const { id } = await params;

  const card = await prisma.creditCard.findFirst({ where: { id, userId: session.user.id } });
  if (!card) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const transactions = await prisma.cardTransaction.findMany({
    where: { creditCardId: id, parentTransactionId: null },
    include: { category: true },
    orderBy: { purchaseDate: "desc" },
  });

  return NextResponse.json(transactions);
}

export async function POST(req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const { id } = await params;

  const card = await prisma.creditCard.findFirst({ where: { id, userId: session.user.id } });
  if (!card) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const body = await req.json();
  const parsed = cardTransactionSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { isInstallment, totalInstallments, ...data } = parsed.data;
  const installmentAmount = isInstallment && totalInstallments
    ? parseFloat((data.totalAmount / totalInstallments).toFixed(2))
    : null;

  const parent = await prisma.cardTransaction.create({
    data: {
      ...data,
      creditCardId: id,
      isInstallment,
      totalInstallments: isInstallment ? totalInstallments : null,
      currentInstallment: isInstallment ? 1 : null,
      installmentAmount,
    },
  });

  // Create future installments
  if (isInstallment && totalInstallments && totalInstallments > 1) {
    const installmentData = [];
    for (let i = 2; i <= totalInstallments; i++) {
      installmentData.push({
        creditCardId: id,
        description: `${data.description} (${i}/${totalInstallments})`,
        totalAmount: data.totalAmount,
        installmentAmount,
        purchaseDate: addMonths(data.purchaseDate, i - 1),
        categoryId: data.categoryId,
        isInstallment: true,
        totalInstallments,
        currentInstallment: i,
        parentTransactionId: parent.id,
      });
    }
    await prisma.cardTransaction.createMany({ data: installmentData });
  }

  return NextResponse.json(parent, { status: 201 });
}

export async function PUT(req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const { id } = await params;

  const body = await req.json();
  const { txId, ...data } = body;
  if (!txId) return NextResponse.json({ error: "txId obrigatório" }, { status: 400 });

  const tx = await prisma.cardTransaction.findFirst({
    where: { id: txId, creditCardId: id, creditCard: { userId: session.user.id } },
  });
  if (!tx) return NextResponse.json({ error: "Transação não encontrada" }, { status: 404 });

  const updated = await prisma.cardTransaction.update({
    where: { id: txId },
    data: {
      description: data.description,
      totalAmount: data.totalAmount,
      purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : undefined,
      categoryId: data.categoryId,
      notes: data.notes,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const { id } = await params;

  const { searchParams } = new URL(req.url);
  const txId = searchParams.get("txId");
  if (!txId) return NextResponse.json({ error: "txId obrigatório" }, { status: 400 });

  const tx = await prisma.cardTransaction.findFirst({
    where: { id: txId, creditCardId: id, creditCard: { userId: session.user.id } },
  });
  if (!tx) return NextResponse.json({ error: "Transação não encontrada" }, { status: 404 });

  // Delete children (installments) + parent
  await prisma.cardTransaction.deleteMany({ where: { parentTransactionId: tx.parentTransactionId || txId } });
  await prisma.cardTransaction.delete({ where: { id: tx.parentTransactionId || txId } });

  return NextResponse.json({ success: true });
}
