import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createInvestmentSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  institution: z.string().min(1, "Instituição é obrigatória"),
  type: z.enum([
    "FIXED_INCOME",
    "VARIABLE_INCOME",
    "STOCKS",
    "FUNDS",
    "CRYPTO",
    "PENSION",
  ]),
  balance: z.coerce.number().min(0, "Saldo inicial não pode ser negativo"),
  color: z.string().optional().default("#2563EB"),
});

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const investimentos = await prisma.investment.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        transactions: {
          where: { type: "DEPOSIT" },
          select: { amount: true },
        },
      },
    });

    // Compute totalDeposited from transactions and strip the raw array
    const result = investimentos.map((inv: typeof investimentos[number]) => {
      const totalDeposited = inv.transactions.reduce(
        (sum: number, tx: { amount: { toNumber?: () => number } | bigint | number | string }) =>
          sum + (typeof tx.amount === "object" && tx.amount !== null && "toNumber" in tx.amount
            ? (tx.amount as { toNumber: () => number }).toNumber()
            : Number(tx.amount)),
        0
      );
      // If balance was set manually at creation (no DEPOSIT tx yet), totalDeposited = balance
      const effectiveTotalDeposited = totalDeposited > 0 ? totalDeposited : Number(inv.balance);
      return {
        ...inv,
        transactions: undefined, // omit raw array
        totalDeposited: effectiveTotalDeposited,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[INVESTIMENTOS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const json = await req.json();
    const body = createInvestmentSchema.parse(json);

    const investment = await prisma.investment.create({
      data: {
        userId: session.user.id,
        name: body.name,
        institution: body.institution,
        type: body.type,
        balance: body.balance,
        color: body.color,
      },
    });

    return NextResponse.json(investment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.format() }, { status: 400 });
    }
    console.error("[INVESTIMENTOS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
