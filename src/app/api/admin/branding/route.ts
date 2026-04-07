import { NextResponse } from "next/server";
import { requireAdmin, logAdminAction } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

const BRANDING_KEYS = [
  "brand_logo_light",
  "brand_logo_dark",
  "brand_primary_color",
  "brand_tagline",
  "login_bg_image",
];

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 403 });

  const settings = await prisma.systemSetting.findMany({
    where: { key: { in: BRANDING_KEYS } },
  });
  const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));
  return NextResponse.json(map);
}

export async function PUT(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 403 });

  const body: Record<string, string> = await req.json();

  for (const [key, value] of Object.entries(body)) {
    if (!BRANDING_KEYS.includes(key)) continue;
    await prisma.systemSetting.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });
  }

  await logAdminAction(session.user.id, "UPDATE_BRANDING", JSON.stringify(Object.keys(body)));

  return NextResponse.json({ success: true });
}
