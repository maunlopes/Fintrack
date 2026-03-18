import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/open-finance/items — list all connected items for the current user
export async function GET() {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const items = await prisma.pluggyItem.findMany({
    where: { userId: session.user.id },
    include: {
      accounts: {
        include: { bankAccount: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(items);
}
