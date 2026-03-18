import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const budgetSchema = z.object({
  monthlyLimit: z.number().positive("O limite deve ser maior que zero"),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const userId = session.user.id;
  const { categoryId } = await params;

  const body = await req.json();
  const parsed = budgetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  // Verify category exists and is EXPENSE type
  const category = await prisma.category.findFirst({
    where: {
      id: categoryId,
      type: "EXPENSE",
      OR: [{ userId }, { isDefault: true }],
    },
  });
  if (!category) {
    return NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 });
  }

  const budget = await prisma.categoryBudget.upsert({
    where: { userId_categoryId: { userId, categoryId } },
    create: { userId, categoryId, monthlyLimit: parsed.data.monthlyLimit },
    update: { monthlyLimit: parsed.data.monthlyLimit },
  });

  return NextResponse.json(budget);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const userId = session.user.id;
  const { categoryId } = await params;

  const deleted = await prisma.categoryBudget.deleteMany({
    where: { userId, categoryId },
  });

  if (deleted.count === 0) {
    return NextResponse.json({ error: "Orçamento não encontrado" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
