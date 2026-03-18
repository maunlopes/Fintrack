import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { creditCardSchema } from "@/lib/validations/credit-card";

type Params = { params: Promise<{ id: string }> };

async function getOwnCard(userId: string, id: string) {
  return prisma.creditCard.findFirst({ where: { id, userId } });
}

export async function GET(_req: Request, props: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const params = await props.params;
  const { id } = params;

  const card = await prisma.creditCard.findFirst({
    where: { id, userId: session.user.id },
    include: {
      bankAccount: true,
      transactions: {
        include: { category: true },
        orderBy: { purchaseDate: "desc" },
        take: 50,
      },
    },
  });

  if (!card) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  return NextResponse.json(card);
}

export async function PUT(req: Request, props: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const params = await props.params;
  const { id } = params;
  const card = await getOwnCard(session.user.id, id);
  if (!card) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const body = await req.json();
  const parsed = creditCardSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { bankAccountId, ...data } = parsed.data;
  const updated = await prisma.creditCard.update({
    where: { id },
    data: { ...data, bankAccountId: bankAccountId || null },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, props: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const params = await props.params;
  const { id } = params;
  const card = await getOwnCard(session.user.id, id);
  if (!card) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  await prisma.creditCard.update({ where: { id }, data: { isActive: false } });
  return NextResponse.json({ success: true });
}
