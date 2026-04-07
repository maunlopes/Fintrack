import { NextResponse } from "next/server";
import { requireAdmin, logAdminAction } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 403 });

  const notifications = await prisma.systemNotification.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(notifications);
}

export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 403 });

  const body = await req.json();
  const { title, message, type, startsAt, endsAt } = body;

  if (!title || !message) {
    return NextResponse.json({ error: "Título e mensagem são obrigatórios" }, { status: 400 });
  }

  const notification = await prisma.systemNotification.create({
    data: {
      title,
      message,
      type: type || "INFO",
      startsAt: startsAt ? new Date(startsAt) : new Date(),
      endsAt: endsAt ? new Date(endsAt) : null,
    },
  });

  await logAdminAction(session.user.id, "CREATE_NOTIFICATION", JSON.stringify({ title }));

  return NextResponse.json(notification, { status: 201 });
}
