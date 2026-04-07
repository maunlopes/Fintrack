import { NextResponse } from "next/server";
import { requireAdmin, logAdminAction } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 403 });

  const body: { id: string; order: number }[] = await req.json();

  if (!Array.isArray(body)) {
    return NextResponse.json({ error: "Formato inválido" }, { status: 400 });
  }

  // Use a transaction with temporary negative orders to avoid unique constraint conflicts
  await prisma.$transaction(
    body.map((item, idx) =>
      prisma.onboardingStep.update({
        where: { id: item.id },
        data: { order: -(idx + 1) },
      })
    )
  );
  await prisma.$transaction(
    body.map((item) =>
      prisma.onboardingStep.update({
        where: { id: item.id },
        data: { order: item.order },
      })
    )
  );

  await logAdminAction(session.user.id, "REORDER_ONBOARDING_STEPS");

  return NextResponse.json({ success: true });
}
