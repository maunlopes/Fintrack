import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { CategoryType } from "@prisma/client";

type Params = { params: Promise<{ id: string }> };

const categorySchema = z.object({
  name: z.string().min(1),
  type: z.nativeEnum(CategoryType),
  icon: z.string().default("circle"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#075056"),
});

async function resolveCategory(id: string, userId: string) {
  const cat = await prisma.category.findUnique({ where: { id } });
  // Allow own categories and global defaults (userId: null)
  if (!cat || (cat.userId !== null && cat.userId !== userId)) return null;
  return cat;
}

export async function PUT(req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const { id } = await params;

  const cat = await resolveCategory(id, session.user.id);
  if (!cat) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const body = await req.json();
  const parsed = categorySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const updated = await prisma.category.update({ where: { id }, data: parsed.data });
  return NextResponse.json(updated);
}

export async function DELETE(req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const userId = session.user.id;
  const { id } = await params;

  const cat = await resolveCategory(id, userId);
  if (!cat) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const force = new URL(req.url).searchParams.get("force") === "true";

  // Count all linked records
  const [expCount, incCount, cardTxCount] = await Promise.all([
    prisma.expense.count({ where: { categoryId: id } }),
    prisma.income.count({ where: { categoryId: id } }),
    prisma.cardTransaction.count({ where: { categoryId: id } }),
  ]);
  const total = expCount + incCount + cardTxCount;

  // If items are linked and force not requested, return info for frontend warning
  if (total > 0 && !force) {
    return NextResponse.json(
      { error: "category_in_use", total, expenses: expCount, incomes: incCount, cardTransactions: cardTxCount },
      { status: 409 }
    );
  }

  if (total > 0 && force) {
    await prisma.$transaction(async (p) => {
      // Reassign expenses and card transactions to "Sem Categoria (EXPENSE)"
      if (expCount > 0 || cardTxCount > 0) {
        let fallback = await p.category.findFirst({
          where: { userId, name: "Sem Categoria", type: "EXPENSE" },
        });
        if (!fallback) {
          fallback = await p.category.create({
            data: { userId, name: "Sem Categoria", type: "EXPENSE", icon: "circle", color: "#94a3b8" },
          });
        }
        if (expCount > 0) {
          await p.expense.updateMany({ where: { categoryId: id }, data: { categoryId: fallback.id } });
        }
        if (cardTxCount > 0) {
          await p.cardTransaction.updateMany({ where: { categoryId: id }, data: { categoryId: fallback.id } });
        }
      }

      // Reassign incomes to "Sem Categoria (INCOME)"
      if (incCount > 0) {
        let fallback = await p.category.findFirst({
          where: { userId, name: "Sem Categoria", type: "INCOME" },
        });
        if (!fallback) {
          fallback = await p.category.create({
            data: { userId, name: "Sem Categoria", type: "INCOME", icon: "circle", color: "#94a3b8" },
          });
        }
        await p.income.updateMany({ where: { categoryId: id }, data: { categoryId: fallback.id } });
      }

      await p.category.delete({ where: { id } });
    });
  } else {
    await prisma.category.delete({ where: { id } });
  }

  return NextResponse.json({ success: true });
}
