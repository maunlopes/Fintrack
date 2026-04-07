import { NextResponse } from "next/server";
import { requireAdmin, logAdminAction } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 403 });

  const screenshots = await prisma.helpScreenshot.findMany({
    orderBy: [{ sectionId: "asc" }, { order: "asc" }],
  });
  return NextResponse.json(screenshots);
}

export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 403 });

  const body = await req.json();
  const { sectionId, label, description, imageUrl, order } = body;

  if (!sectionId || !label || !description) {
    return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 });
  }

  const screenshot = await prisma.helpScreenshot.create({
    data: { sectionId, label, description, imageUrl: imageUrl || null, order: order ?? 0 },
  });

  await logAdminAction(session.user.id, "CREATE_HELP_SCREENSHOT", JSON.stringify({ sectionId, label }));

  return NextResponse.json(screenshot, { status: 201 });
}
