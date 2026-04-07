import { NextResponse } from "next/server";
import { requireAdmin, logAdminAction } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Params) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  const { id } = await params;

  const body = await req.json();
  const screenshot = await prisma.helpScreenshot.update({
    where: { id },
    data: {
      ...(body.label !== undefined && { label: body.label }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.imageUrl !== undefined && { imageUrl: body.imageUrl || null }),
    },
  });

  await logAdminAction(session.user.id, "UPDATE_HELP_SCREENSHOT", JSON.stringify({ id }));

  return NextResponse.json(screenshot);
}

export async function DELETE(req: Request, { params }: Params) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  const { id } = await params;

  await prisma.helpScreenshot.delete({ where: { id } });
  await logAdminAction(session.user.id, "DELETE_HELP_SCREENSHOT", JSON.stringify({ id }));

  return NextResponse.json({ success: true });
}
