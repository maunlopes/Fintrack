import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const steps = await prisma.onboardingStep.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
    select: { id: true, order: true, title: true, description: true, imageUrl: true },
  });
  return NextResponse.json(steps);
}
