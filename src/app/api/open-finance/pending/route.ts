import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/open-finance/pending — list PENDING_REVIEW transactions for the current user
export async function GET() {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const pending = await prisma.pluggySyncedTransaction.findMany({
    where: {
      status: "PENDING_REVIEW",
      pluggyAccount: {
        pluggyItem: { userId: session.user.id },
      },
    },
    include: {
      pluggyAccount: {
        include: {
          pluggyItem: { select: { connector: true } },
          bankAccount: { select: { id: true, name: true, nickname: true } },
        },
      },
    },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(pending);
}
