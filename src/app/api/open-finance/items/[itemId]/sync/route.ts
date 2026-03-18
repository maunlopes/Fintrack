import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { pluggy } from "@/lib/pluggy";

// POST /api/open-finance/items/[itemId]/sync — sync transactions for all accounts of an item
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { itemId } = await params;

  const item = await prisma.pluggyItem.findFirst({
    where: { itemId, userId: session.user.id },
    include: { accounts: true },
  });

  if (!item)
    return NextResponse.json({ error: "Item não encontrado" }, { status: 404 });

  let totalCreated = 0;

  for (const account of item.accounts) {
    // Fetch latest balance
    const pluggyAccount = await pluggy.fetchAccount(account.accountId);

    // Determine date range: last sync or last 90 days
    const from = account.lastSyncAt
      ? new Date(account.lastSyncAt.getTime() - 24 * 60 * 60 * 1000) // 1 day overlap
      : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    // Fetch transactions
    const txResponse = await pluggy.fetchTransactions(account.accountId, {
      from: from.toISOString().split("T")[0],
      pageSize: 500,
    });

    const transactions = txResponse.results ?? [];

    for (const tx of transactions) {
      // Upsert — skip if already exists
      const existing = await prisma.pluggySyncedTransaction.findUnique({
        where: {
          pluggyAccountId_externalId: {
            pluggyAccountId: account.id,
            externalId: tx.id,
          },
        },
      });

      if (!existing) {
        await prisma.pluggySyncedTransaction.create({
          data: {
            pluggyAccountId: account.id,
            externalId: tx.id,
            type: tx.type,
            amount: tx.amount,
            date: new Date(tx.date),
            description: tx.description,
            category: tx.category ?? null,
            rawPayload: tx as object,
          },
        });
        totalCreated++;
      }
    }

    // Update account balance and lastSyncAt
    await prisma.pluggyAccount.update({
      where: { id: account.id },
      data: {
        balance: pluggyAccount.balance,
        lastSyncAt: new Date(),
      },
    });

    // If account is mapped to a BankAccount, update its balance too
    if (account.bankAccountId) {
      await prisma.bankAccount.update({
        where: { id: account.bankAccountId },
        data: { balance: pluggyAccount.balance },
      });
    }
  }

  // Update item status and lastSyncAt
  await prisma.pluggyItem.update({
    where: { id: item.id },
    data: { status: "UPDATED", lastSyncAt: new Date() },
  });

  return NextResponse.json({ ok: true, totalCreated });
}
