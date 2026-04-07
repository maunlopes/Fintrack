import { NextResponse } from "next/server";
import { requireAdmin, logAdminAction } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 403 });

  const steps = await prisma.onboardingStep.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json(steps);
}

export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 403 });

  const body = await req.json();
  const { title, description, imageUrl } = body;

  if (!title || !description) {
    return NextResponse.json({ error: "Título e descrição são obrigatórios" }, { status: 400 });
  }

  const maxOrder = await prisma.onboardingStep.aggregate({ _max: { order: true } });
  const nextOrder = (maxOrder._max.order ?? -1) + 1;

  const step = await prisma.onboardingStep.create({
    data: { order: nextOrder, title, description, imageUrl: imageUrl || null },
  });

  await logAdminAction(session.user.id, "CREATE_ONBOARDING_STEP", JSON.stringify({ stepId: step.id, title }));

  return NextResponse.json(step, { status: 201 });
}
