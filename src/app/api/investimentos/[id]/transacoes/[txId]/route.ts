import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  type: z.enum(["DEPOSIT", "WITHDRAWAL", "YIELD", "DIVIDEND"]),
  amount: z.coerce.number().min(0.01),
  date: z.string().transform((str) => new Date(str)),
  bankAccountId: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  isRecurring: z.boolean().default(false),
});

type Ctx = { params: Promise<{ id: string; txId: string }> };

export async function PUT(req: Request, { params }: Ctx) {
  try {
    const session = await auth();
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });
    const userId = session.user.id;

    const { id, txId } = await params;
    const json = await req.json();
    const body = updateSchema.parse(json);

    const tx = await prisma.investmentTransaction.findUnique({
      where: { id: txId },
      include: { investment: true },
    });

    if (!tx || tx.investment.userId !== userId || tx.investmentId !== id) {
      return new NextResponse("Not Found", { status: 404 });
    }

    await prisma.$transaction(async (p) => {
      // 1. Reverse old effect on investment balance
      let invBalance = Number(tx.investment.balance);
      if (tx.type === "DEPOSIT" || tx.type === "YIELD" || tx.type === "DIVIDEND") {
        invBalance -= Number(tx.amount);
      } else if (tx.type === "WITHDRAWAL") {
        invBalance += Number(tx.amount);
      }

      // 2. Reverse old effect on bank account
      if (tx.bankAccountId) {
        const ba = await p.bankAccount.findUnique({ where: { id: tx.bankAccountId } });
        if (ba) {
          let baBalance = Number(ba.balance);
          if (tx.type === "DEPOSIT") baBalance += Number(tx.amount);
          else baBalance -= Number(tx.amount);
          await p.bankAccount.update({ where: { id: tx.bankAccountId }, data: { balance: baBalance } });
        }
      }

      // 3. Apply new effect on investment balance
      if (body.type === "DEPOSIT" || body.type === "YIELD" || body.type === "DIVIDEND") {
        invBalance += body.amount;
      } else if (body.type === "WITHDRAWAL") {
        invBalance -= body.amount;
      }
      await p.investment.update({ where: { id }, data: { balance: invBalance } });

      // 4. Apply new effect on bank account
      const newBankId = body.bankAccountId || null;
      if (newBankId) {
        const ba = await p.bankAccount.findUnique({ where: { id: newBankId, userId } });
        if (ba) {
          let baBalance = Number(ba.balance);
          if (body.type === "DEPOSIT") baBalance -= body.amount;
          else baBalance += body.amount;
          await p.bankAccount.update({ where: { id: newBankId }, data: { balance: baBalance } });
        }
      }

      // 5. Update transaction
      await p.investmentTransaction.update({
        where: { id: txId },
        data: {
          type: body.type,
          amount: body.amount,
          date: body.date,
          bankAccountId: newBankId,
          description: body.description ?? null,
          isRecurring: body.isRecurring,
        },
      });
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.format() }, { status: 400 });
    console.error("[INVESTMENT_TX_PUT]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: Ctx) {
  try {
    const session = await auth();
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });
    const userId = session.user.id;

    const { id, txId } = await params;

    const tx = await prisma.investmentTransaction.findUnique({
      where: { id: txId },
      include: { investment: true },
    });

    if (!tx || tx.investment.userId !== userId || tx.investmentId !== id) {
      return new NextResponse("Not Found", { status: 404 });
    }

    await prisma.$transaction(async (p) => {
      // 1. Reverse effect on investment balance
      let invBalance = Number(tx.investment.balance);
      if (tx.type === "DEPOSIT" || tx.type === "YIELD" || tx.type === "DIVIDEND") {
        invBalance -= Number(tx.amount);
      } else if (tx.type === "WITHDRAWAL") {
        invBalance += Number(tx.amount);
      }
      await p.investment.update({ where: { id }, data: { balance: invBalance } });

      // 2. Reverse effect on bank account
      if (tx.bankAccountId) {
        const ba = await p.bankAccount.findUnique({ where: { id: tx.bankAccountId } });
        if (ba) {
          let baBalance = Number(ba.balance);
          if (tx.type === "DEPOSIT") baBalance += Number(tx.amount);
          else baBalance -= Number(tx.amount);
          await p.bankAccount.update({ where: { id: tx.bankAccountId }, data: { balance: baBalance } });
        }
      }

      // 3. Delete transaction
      await p.investmentTransaction.delete({ where: { id: txId } });
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[INVESTMENT_TX_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
