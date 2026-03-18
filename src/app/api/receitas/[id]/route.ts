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
    const updated = await prisma.income.update({ where: { id }, data: { status: body.status } });
    return NextResponse.json(updated);
  }

  const parsed = incomeSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const updated = await prisma.income.update({ where: { id }, data: parsed.data });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const { id } = await params;

  const income = await prisma.income.findFirst({ where: { id, userId: session.user.id } });
  if (!income) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  await prisma.income.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
