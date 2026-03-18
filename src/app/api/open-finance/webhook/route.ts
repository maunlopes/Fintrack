import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pluggy } from "@/lib/pluggy";

// POST /api/open-finance/webhook — called by Pluggy when transactions are created/updated
export async function POST(req: Request) {
  const payload = await req.json();

  const { event, itemId, accountId, transactionsCreatedAtFrom } = payload;

  if (event === "transactions/created" || event === "transactions/updated") {
    const account = await prisma.pluggyAccount.findUnique({
      where: { accountId },
    });

    if (!account) return NextResponse.json({ ok: true });

    const from = transactionsCreatedAtFrom
      ? new Date(transactionsCreatedAtFrom).toISOString().split("T")[0]
      : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const txResponse = await pluggy.fetchTransactions(accountId, {
      from,
      pageSize: 500,
    });

    for (const tx of txResponse.results ?? []) {
      await prisma.pluggySyncedTransaction.upsert({
        where: {
          pluggyAccountId_externalId: {
            pluggyAccountId: account.id,
            externalId: tx.id,
          },
        },
        create: {
          pluggyAccountId: account.id,
          externalId: tx.id,
          type: tx.type,
          amount: tx.amount,
          date: new Date(tx.date),
          description: tx.description,
          category: tx.category ?? null,
          rawPayload: tx as object,
        },
        update: {
          amount: tx.amount,
          description: tx.description,
          category: tx.category ?? null,
          rawPayload: tx as object,
        },
      });
    }

    await prisma.pluggyAccount.update({
      where: { id: account.id },
      data: { lastSyncAt: new Date() },
    });
  }

  if (event === "item/updated") {
    const item = await prisma.pluggyItem.findUnique({ where: { itemId } });
    if (item) {
      await prisma.pluggyItem.update({
        where: { id: item.id },
        data: { status: "UPDATED", lastSyncAt: new Date() },
      });
    }
  }

  if (event === "item/error") {
    const item = await prisma.pluggyItem.findUnique({ where: { itemId } });
    if (item) {
      await prisma.pluggyItem.update({
        where: { id: item.id },
        data: { status: "ERROR" },
      });
    }
  }

  return NextResponse.json({ ok: true });
}
