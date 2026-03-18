import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { bankAccountSchema } from "@/lib/validations/bank-account";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const accounts = await prisma.bankAccount.findMany({
    where: { userId: session.user.id, isActive: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(accounts);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();
  const parsed = bankAccountSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const account = await prisma.bankAccount.create({
    data: { ...parsed.data, userId: session.user.id },
  });

  return NextResponse.json(account, { status: 201 });
}
