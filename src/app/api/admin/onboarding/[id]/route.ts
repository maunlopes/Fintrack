import { NextResponse } from "next/server";
import { requireAdmin, logAdminAction } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Params) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  const { id } = await params;

  const body = await req.json();
  const step = await prisma.onboardingStep.update({
    where: { id },
    data: {
      ...(body.title !== undefined && { title: body.title }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.imageUrl !== undefined && { imageUrl: body.imageUrl || null }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
    },
  });

  await logAdminAction(session.user.id, "UPDATE_ONBOARDING_STEP", JSON.stringify({ stepId: id }));

  return NextResponse.json(step);
}

export async function DELETE(req: Request, { params }: Params) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  const { id } = await params;

  await prisma.onboardingStep.delete({ where: { id } });
  await logAdminAction(session.user.id, "DELETE_ONBOARDING_STEP", JSON.stringify({ stepId: id }));

  return NextResponse.json({ success: true });
}
