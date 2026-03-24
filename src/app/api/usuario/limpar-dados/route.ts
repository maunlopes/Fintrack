import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: "Não autorizado" }), { status: 401 });
  }

  const userId = session.user.id;

  await prisma.$transaction([
    // 1. Pluggy items → cascata PluggyAccount → PluggySyncedTransaction
    //    (remove FK refs to Expense/Income before we delete them)
    prisma.pluggyItem.deleteMany({ where: { userId } }),

    // 2. Transfers referenciam BankAccount sem cascade; apagar antes das contas
    prisma.transfer.deleteMany({
      where: { OR: [{ fromAccount: { userId } }, { toAccount: { userId } }] },
    }),

    // 3. Faturas de cartão (referencia BankAccount sem cascade)
    prisma.invoicePayment.deleteMany({ where: { userId } }),

    // 4. Cartões de crédito → cascata CardTransaction (e parcelas)
    prisma.creditCard.deleteMany({ where: { userId } }),

    // 5. Despesas (e parcelas via self-ref cascade)
    prisma.expense.deleteMany({ where: { userId } }),

    // 6. Receitas
    prisma.income.deleteMany({ where: { userId } }),

    // 7. Investimentos → cascata InvestmentTransaction
    prisma.investment.deleteMany({ where: { userId } }),

    // 8. Contas bancárias
    prisma.bankAccount.deleteMany({ where: { userId } }),

    // 9. Orçamentos por categoria
    prisma.categoryBudget.deleteMany({ where: { userId } }),

    // 10. Categorias do usuário (userId não-nulo = categorias do usuário)
    prisma.category.deleteMany({ where: { userId } }),
  ]);

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
}
