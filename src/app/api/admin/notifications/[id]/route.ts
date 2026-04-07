import { NextResponse } from "next/server";
import { requireAdmin, logAdminAction } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Params) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  const { id } = await params;

  const body = await req.json();
  const notification = await prisma.systemNotification.update({
    where: { id },
    data: {
      ...(body.title !== undefined && { title: body.title }),
      ...(body.message !== undefined && { message: body.message }),
      ...(body.type !== undefined && ["INFO", "WARNING", "MAINTENANCE", "NEW_FEATURE"].includes(body.type) && { type: body.type }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
      ...(body.startsAt !== undefined && { startsAt: new Date(body.startsAt) }),
      ...(body.endsAt !== undefined && { endsAt: body.endsAt ? new Date(body.endsAt) : null }),
    },
  });

  await logAdminAction(session.user.id, "UPDATE_NOTIFICATION", JSON.stringify({ id }));

  return NextResponse.json(notification);
}

export async function DELETE(req: Request, { params }: Params) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  const { id } = await params;

  await prisma.systemNotification.delete({ where: { id } });
  await logAdminAction(session.user.id, "DELETE_NOTIFICATION", JSON.stringify({ id }));

  return NextResponse.json({ success: true });
}
