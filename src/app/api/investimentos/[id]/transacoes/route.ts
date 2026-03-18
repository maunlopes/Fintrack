import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const transactionSchema = z.object({
  type: z.enum(["DEPOSIT", "WITHDRAWAL", "YIELD", "DIVIDEND"]),
  amount: z.coerce.number().min(0.01, "Valor deve ser maior que zero"),
  date: z.string().transform((str) => new Date(str)),
  bankAccountId: z.string().optional(),
  description: z.string().optional(),
  isRecurring: z.boolean().default(false),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const userId = session.user.id;

    const { id } = await params;
    const json = await req.json();
    const body = transactionSchema.parse(json);

    // Ensure the investment belongs to the user
    const investment = await prisma.investment.findUnique({
      where: {
        id: id,
        userId: userId,
      },
      include: {
        transactions: true,
      },
    });

    if (!investment) {
      return new NextResponse("Investment Not Found", { status: 404 });
    }

    // Begin a Prisma Transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the Investment Transaction
      const transaction = await tx.investmentTransaction.create({
        data: {
          investmentId: id,
          type: body.type,
          amount: body.amount,
          date: body.date,
          bankAccountId: userId ? (body.bankAccountId || null) : null,
          description: body.description,
          isRecurring: body.isRecurring,
        },
      });

        const oldBalance = investment.balance;
        const depositSum = investment.transactions.filter((txItem: any) => txItem.type === "DEPOSIT").reduce((acc: number, txItem: any) => acc + Number(txItem.amount), 0);
      // 2. Update the Investment Balance
      let newBalance = Number(investment.balance);
      if (body.type === "DEPOSIT" || body.type === "YIELD" || body.type === "DIVIDEND") {
        newBalance += body.amount;
      } else if (body.type === "WITHDRAWAL") {
        newBalance -= body.amount;
      }

      await tx.investment.update({
        where: { id: id },
        data: { balance: newBalance },
      });

      // 3. If a Bank Account is involved, update its balance too
      if (body.bankAccountId) {
        const bankAccount = await tx.bankAccount.findUnique({
          where: { id: body.bankAccountId, userId: userId },
        });

        if (bankAccount) {
          let newBankBalance = Number(bankAccount.balance);
          // If it's a Deposit, money leaves the bank account
          if (body.type === "DEPOSIT") {
            newBankBalance -= body.amount;
          } 
          // If it's a Withdrawal or Dividend going to the bank, money enters the bank
          else if (body.type === "WITHDRAWAL" || body.type === "DIVIDEND" || body.type === "YIELD") {
            newBankBalance += body.amount;
          }

          await tx.bankAccount.update({
            where: { id: body.bankAccountId },
            data: { balance: newBankBalance },
          });
        }
      }

      return transaction;
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.format() }, { status: 400 });
    }
    console.error("[INVESTMENT_TRANSACTION_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
