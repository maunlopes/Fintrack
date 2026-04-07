import { NextResponse } from "next/server";
import { requireAdmin, logAdminAction } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Params) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      lastLoginAt: true,
      createdAt: true,
      _count: {
        select: {
          bankAccounts: true,
          expenses: true,
          incomes: true,
          creditCards: true,
          investments: true,
        },
      },
    },
  });

  if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

  return NextResponse.json(user);
}

export async function PUT(req: Request, { params }: Params) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  const { id } = await params;

  // Prevent self-demotion
  if (id === session.user.id) {
    return NextResponse.json({ error: "Você não pode alterar seu próprio role" }, { status: 400 });
  }

  const body = await req.json();
  const data: Record<string, unknown> = {};

  if (body.role === "ADMIN" || body.role === "USER") {
    data.role = body.role;
  }

  const user = await prisma.user.update({ where: { id }, data });

  await logAdminAction(
    session.user.id,
    body.role ? "CHANGE_USER_ROLE" : "UPDATE_USER",
    JSON.stringify({ targetUserId: id, role: body.role })
  );

  return NextResponse.json(user);
}
