import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { creditCardSchema } from "@/lib/validations/credit-card";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const cards = await prisma.creditCard.findMany({
    where: { userId: session.user.id, isActive: true },
    include: { bankAccount: { select: { id: true, nickname: true } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(cards);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();
  const parsed = creditCardSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { bankAccountId, ...data } = parsed.data;
  const card = await prisma.creditCard.create({
    data: {
      ...data,
      userId: session.user.id,
      bankAccountId: bankAccountId || null,
    },
  });

  return NextResponse.json(card, { status: 201 });
}
