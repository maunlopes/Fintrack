import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET — check if setup is completed
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { setupCompleted: true },
  });

  return NextResponse.json({ setupCompleted: user?.setupCompleted ?? false });
}

// PUT — update profile data and mark setup as completed
export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();
  const data: Record<string, unknown> = {};

  if (body.name !== undefined) data.name = body.name;
  if (body.image !== undefined) data.image = body.image;
  if (body.monthlyIncome !== undefined) data.monthlyIncome = body.monthlyIncome;
  if (body.birthDate !== undefined) data.birthDate = body.birthDate ? new Date(body.birthDate) : null;
  if (body.occupation !== undefined) data.occupation = body.occupation || null;
  if (body.setupCompleted !== undefined) data.setupCompleted = body.setupCompleted;

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data,
    select: { id: true, name: true, image: true, monthlyIncome: true, birthDate: true, occupation: true, setupCompleted: true },
  });

  return NextResponse.json(user);
}
