import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { bankAccountSchema } from "@/lib/validations/bank-account";

type Params = { params: Promise<{ id: string }> };

async function getOwnAccount(userId: string, id: string) {
  return prisma.bankAccount.findFirst({ where: { id, userId } });
}

export async function GET(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const { id } = await params;
  const account = await getOwnAccount(session.user.id, id);
  if (!account) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  return NextResponse.json(account);
}

export async function PUT(req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const { id } = await params;
  const account = await getOwnAccount(session.user.id, id);
  if (!account) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const body = await req.json();
  const parsed = bankAccountSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const updated = await prisma.bankAccount.update({ where: { id }, data: parsed.data });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const { id } = await params;
  const account = await getOwnAccount(session.user.id, id);
  if (!account) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  await prisma.bankAccount.update({ where: { id }, data: { isActive: false } });
  return NextResponse.json({ success: true });
}
