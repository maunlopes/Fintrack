import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/open-finance/seed-test — inserts fake transactions for testing (dev only)
export async function POST() {
  if (process.env.NODE_ENV === "production")
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });

  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  // Find first PluggyAccount for this user
  const account = await prisma.pluggyAccount.findFirst({
    where: { pluggyItem: { userId: session.user.id } },
  });

  if (!account)
    return NextResponse.json({ error: "Nenhuma conta Pluggy encontrada. Conecte um banco primeiro." }, { status: 404 });

  const testTransactions = [
    { type: "DEBIT", amount: 150.00, description: "Supermercado Extra", category: "Alimentação", daysAgo: 1 },
    { type: "DEBIT", amount: 45.90, description: "iFood", category: "Alimentação", daysAgo: 2 },
    { type: "CREDIT", amount: 3500.00, description: "Salário", category: "Renda", daysAgo: 3 },
    { type: "DEBIT", amount: 89.90, description: "Netflix", category: "Lazer", daysAgo: 5 },
    { type: "DEBIT", amount: 200.00, description: "Farmácia Pacheco", category: "Saúde", daysAgo: 7 },
    { type: "DEBIT", amount: 55.00, description: "Uber", category: "Transporte", daysAgo: 8 },
    { type: "CREDIT", amount: 500.00, description: "Transferência recebida", category: "Renda", daysAgo: 10 },
    { type: "DEBIT", amount: 320.00, description: "Conta de luz", category: "Casa", daysAgo: 12 },
  ];

  let created = 0;
  for (const tx of testTransactions) {
    const externalId = `test-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const date = new Date(Date.now() - tx.daysAgo * 24 * 60 * 60 * 1000);

    await prisma.pluggySyncedTransaction.create({
      data: {
        pluggyAccountId: account.id,
        externalId,
        type: tx.type,
        amount: tx.amount,
        date,
        description: tx.description,
        category: tx.category,
        rawPayload: tx as object,
      },
    });
    created++;
  }

  return NextResponse.json({ ok: true, created });
}
