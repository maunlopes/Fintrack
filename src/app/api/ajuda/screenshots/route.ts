import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const screenshots = await prisma.helpScreenshot.findMany({
    orderBy: [{ sectionId: "asc" }, { order: "asc" }],
    select: { id: true, sectionId: true, label: true, description: true, imageUrl: true, order: true },
  });

  // Group by sectionId
  const grouped: Record<string, typeof screenshots> = {};
  for (const s of screenshots) {
    if (!grouped[s.sectionId]) grouped[s.sectionId] = [];
    grouped[s.sectionId].push(s);
  }

  return NextResponse.json(grouped);
}
