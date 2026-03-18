import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { pluggy } from "@/lib/pluggy";
import type { PluggyItemStatus } from "@prisma/client";

// POST /api/open-finance/items/connect — called after widget onSuccess with the itemId
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { itemId } = await req.json();
  if (!itemId)
    return NextResponse.json({ error: "itemId obrigatório" }, { status: 400 });

  // Fetch item details from Pluggy
  const pluggyItem = await pluggy.fetchItem(itemId);
  const pluggyAccounts = await pluggy.fetchAccounts(itemId);

  // Upsert the PluggyItem
  const item = await prisma.pluggyItem.upsert({
    where: { itemId },
    create: {
      userId: session.user.id,
      itemId,
      connector: pluggyItem.connector as object,
      status: pluggyItem.status as unknown as PluggyItemStatus,
      lastSyncAt: pluggyItem.lastUpdatedAt ? new Date(pluggyItem.lastUpdatedAt) : null,
    },
    update: {
      connector: pluggyItem.connector as object,
      status: pluggyItem.status as unknown as PluggyItemStatus,
      lastSyncAt: pluggyItem.lastUpdatedAt ? new Date(pluggyItem.lastUpdatedAt) : null,
    },
  });

  // Upsert each account and create a linked BankAccount
  for (const acc of pluggyAccounts.results ?? []) {
    const existingPluggyAccount = await prisma.pluggyAccount.findUnique({
      where: { accountId: acc.id },
    });

    if (!existingPluggyAccount) {
      // Create a BankAccount so the account shows up in the main app
      const bankAccount = await prisma.bankAccount.create({
        data: {
          userId: session.user.id,
          name: (pluggyItem.connector as { name?: string }).name ?? "Conta Importada",
          nickname: acc.name,
          type: acc.subtype === "CREDIT_CARD" ? "CHECKING" : "CHECKING",
          balance: acc.balance,
          color: "#075056",
          isPluggy: true,
        },
      });

      await prisma.pluggyAccount.create({
        data: {
          pluggyItemId: item.id,
          accountId: acc.id,
          bankAccountId: bankAccount.id,
          type: acc.type,
          subtype: acc.subtype,
          name: acc.name,
          number: acc.number ?? null,
          balance: acc.balance,
          lastSyncAt: new Date(),
        },
      });
    } else {
      await prisma.pluggyAccount.update({
        where: { id: existingPluggyAccount.id },
        data: {
          balance: acc.balance,
          lastSyncAt: new Date(),
        },
      });

      if (existingPluggyAccount.bankAccountId) {
        await prisma.bankAccount.update({
          where: { id: existingPluggyAccount.bankAccountId },
          data: { balance: acc.balance },
        });
      }
    }
  }

  return NextResponse.json({ ok: true, itemId });
}
