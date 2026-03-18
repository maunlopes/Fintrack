import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getInvoiceDate } from "@/lib/invoice";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, props: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await props.params;
  const body = await req.json();
  const { month, year, bankAccountId } = body as { month: number; year: number; bankAccountId: string };

  if (!month || !year || !bankAccountId) {
    return NextResponse.json({ error: "month, year e bankAccountId são obrigatórios" }, { status: 400 });
  }

  // Verify card belongs to user
  const card = await prisma.creditCard.findFirst({
    where: { id, userId: session.user.id },
    include: { transactions: true }
  });
  if (!card) return NextResponse.json({ error: "Cartão não encontrado" }, { status: 404 });

  // Verify bank account belongs to user
  const account = await prisma.bankAccount.findFirst({
    where: { id: bankAccountId, userId: session.user.id }
  });
  if (!account) return NextResponse.json({ error: "Conta não encontrada" }, { status: 404 });

  // Check not already paid
  const existing = await prisma.invoicePayment.findUnique({
    where: { creditCardId_month_year: { creditCardId: id, month, year } }
  });
  if (existing) return NextResponse.json({ error: "Fatura já paga" }, { status: 409 });

  // Calculate invoice total from transactions due in this month/year
  const total = card.transactions.reduce((sum, tx) => {
    const dueDate = getInvoiceDate(tx.purchaseDate, card.closingDay, card.dueDay);
    if (dueDate.getMonth() + 1 === month && dueDate.getFullYear() === year) {
      const amount = tx.isInstallment && tx.installmentAmount
        ? parseFloat(tx.installmentAmount.toString())
        : parseFloat(tx.totalAmount.toString());
      return sum + amount;
    }
    return sum;
  }, 0);

  if (total === 0) {
    return NextResponse.json({ error: "Nenhuma transação encontrada para esta fatura" }, { status: 400 });
  }

  const amount = parseFloat(total.toFixed(2));

  // Check sufficient balance
  const currentBalance = parseFloat(account.balance.toString());
  if (currentBalance < amount) {
    return NextResponse.json(
      { error: `Saldo insuficiente. Disponível: R$ ${currentBalance.toFixed(2)}` },
      { status: 400 }
    );
  }

  // Create payment and debit account atomically
  const [payment] = await prisma.$transaction([
    prisma.invoicePayment.create({
      data: {
        userId: session.user.id,
        creditCardId: id,
        month,
        year,
        amount,
        bankAccountId
      }
    }),
    prisma.bankAccount.update({
      where: { id: bankAccountId },
      data: { balance: { decrement: amount } }
    })
  ]);

  return NextResponse.json(payment, { status: 201 });
}

export async function DELETE(req: Request, props: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await props.params;
  const { searchParams } = new URL(req.url);
  const month = parseInt(searchParams.get("month") || "0");
  const year = parseInt(searchParams.get("year") || "0");

  if (!month || !year) {
    return NextResponse.json({ error: "month e year são obrigatórios" }, { status: 400 });
  }

  const payment = await prisma.invoicePayment.findUnique({
    where: { creditCardId_month_year: { creditCardId: id, month, year } }
  });

  if (!payment || payment.userId !== session.user.id) {
    return NextResponse.json({ error: "Pagamento não encontrado" }, { status: 404 });
  }

  // Reverse the payment: restore bank account balance
  await prisma.$transaction([
    prisma.invoicePayment.delete({
      where: { creditCardId_month_year: { creditCardId: id, month, year } }
    }),
    prisma.bankAccount.update({
      where: { id: payment.bankAccountId },
      data: { balance: { increment: payment.amount } }
    })
  ]);

  return NextResponse.json({ success: true });
}
