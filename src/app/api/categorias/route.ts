import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { CategoryType } from "@prisma/client";

const categorySchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  type: z.nativeEnum(CategoryType),
  icon: z.string().default("circle"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#075056"),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const categories = await prisma.category.findMany({
    where: { OR: [{ userId: session.user.id }, { isDefault: true }] },
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
  });

  return NextResponse.json(categories);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();
  const parsed = categorySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const category = await prisma.category.create({
    data: { ...parsed.data, userId: session.user.id },
  });

  return NextResponse.json(category, { status: 201 });
}
