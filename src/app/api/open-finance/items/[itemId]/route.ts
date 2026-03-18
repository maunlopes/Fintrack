import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { pluggy } from "@/lib/pluggy";

// DELETE /api/open-finance/items/[itemId] — disconnect an institution
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { itemId } = await params;

  const item = await prisma.pluggyItem.findFirst({
    where: { itemId, userId: session.user.id },
  });

  if (!item)
    return NextResponse.json({ error: "Item não encontrado" }, { status: 404 });

  // Delete from Pluggy
  await pluggy.deleteItem(itemId);

  // Delete from our DB (cascades to accounts and synced transactions)
  await prisma.pluggyItem.delete({ where: { id: item.id } });

  return NextResponse.json({ ok: true });
}
