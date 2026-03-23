import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";
import { ptBR } from "date-fns/locale";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toNum(v: any): number {
  if (v === null || v === undefined) return 0;
  return parseFloat(v.toString());
}

function brl(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

export async function buildFinancialContext(userId: string): Promise<string> {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const prev1Start = startOfMonth(subMonths(now, 1));
  const prev1End = endOfMonth(subMonths(now, 1));
  const prev2Start = startOfMonth(subMonths(now, 2));
  const prev2End = endOfMonth(subMonths(now, 2));
  const prev3Start = startOfMonth(subMonths(now, 3));
  const prev3End = endOfMonth(subMonths(now, 3));

  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const [
    incomeAgg,
    expenseAgg,
    cardAgg,
    bankAccounts,
    investmentAgg,
    investments,
    hist1,
    hist2,
    hist3,
    categoryBreakdown,
    categoryIds,
    budgetsWithLimit,
    upcomingExpenses,
  ] = await Promise.all([
    prisma.income.aggregate({
      where: { userId, receiveDate: { gte: monthStart, lte: monthEnd } },
      _sum: { amount: true },
    }),
    prisma.expense.aggregate({
      where: { userId, dueDate: { gte: monthStart, lte: monthEnd } },
      _sum: { amount: true },
    }),
    prisma.cardTransaction.aggregate({
      where: { creditCard: { userId }, purchaseDate: { gte: monthStart, lte: monthEnd } },
      _sum: { totalAmount: true },
    }),
    prisma.bankAccount.findMany({
      where: { userId, isActive: true },
      select: { nickname: true, balance: true, type: true },
    }),
    prisma.investment.aggregate({
      where: { userId, isActive: true },
      _sum: { balance: true },
    }).catch(() => ({ _sum: { balance: null } })),
    prisma.investment.findMany({
      where: { userId, isActive: true },
      select: { name: true, type: true, institution: true, balance: true },
      orderBy: { balance: "desc" },
      take: 8,
    }),
    // Last 3 months historical
    Promise.all([
      prisma.income.aggregate({ where: { userId, receiveDate: { gte: prev1Start, lte: prev1End } }, _sum: { amount: true } }),
      prisma.expense.aggregate({ where: { userId, dueDate: { gte: prev1Start, lte: prev1End } }, _sum: { amount: true } }),
    ]),
    Promise.all([
      prisma.income.aggregate({ where: { userId, receiveDate: { gte: prev2Start, lte: prev2End } }, _sum: { amount: true } }),
      prisma.expense.aggregate({ where: { userId, dueDate: { gte: prev2Start, lte: prev2End } }, _sum: { amount: true } }),
    ]),
    Promise.all([
      prisma.income.aggregate({ where: { userId, receiveDate: { gte: prev3Start, lte: prev3End } }, _sum: { amount: true } }),
      prisma.expense.aggregate({ where: { userId, dueDate: { gte: prev3Start, lte: prev3End } }, _sum: { amount: true } }),
    ]),
    prisma.expense.groupBy({
      by: ["categoryId"],
      where: { userId, dueDate: { gte: monthStart, lte: monthEnd } },
      _sum: { amount: true },
      orderBy: { _sum: { amount: "desc" } },
      take: 5,
    }),
    prisma.expense.groupBy({
      by: ["categoryId"],
      where: { userId, dueDate: { gte: monthStart, lte: monthEnd } },
    }).then((rows) => rows.map((r) => r.categoryId)),
    prisma.categoryBudget.findMany({
      where: { userId },
      include: { category: { select: { name: true } } },
    }),
    prisma.expense.findMany({
      where: {
        userId,
        status: { in: ["PENDING", "OVERDUE"] },
        dueDate: { gte: now, lte: nextMonth },
      },
      include: { category: { select: { name: true } } },
      orderBy: { dueDate: "asc" },
      take: 5,
    }),
  ]);

  // KPIs
  const monthIncome = toNum(incomeAgg._sum.amount);
  const monthExpenses = toNum(expenseAgg._sum.amount) + toNum(cardAgg._sum.totalAmount);
  const balance = monthIncome - monthExpenses;
  const bankTotal = bankAccounts.reduce((s, a) => s + toNum(a.balance), 0);
  const totalInvested = toNum((investmentAgg as { _sum: { balance: unknown } })._sum?.balance);

  // Category names for top spending
  const allCatIds = Array.from(new Set([...categoryIds, ...categoryBreakdown.map((c) => c.categoryId)]));
  const categories = await prisma.category.findMany({ where: { id: { in: allCatIds } } });
  const catName = (id: string) => categories.find((c) => c.id === id)?.name ?? "Outros";

  // Budget alerts
  const budgetAlerts = budgetsWithLimit
    .map((b) => {
      const spent = categoryBreakdown.find((c) => c.categoryId === b.categoryId);
      const spentAmt = spent ? toNum(spent._sum.amount) : 0;
      const limit = toNum(b.monthlyLimit);
      const pct = limit > 0 ? Math.round((spentAmt / limit) * 100) : 0;
      return { name: b.category.name, spent: spentAmt, limit, pct };
    })
    .filter((b) => b.pct >= 80)
    .sort((a, b) => b.pct - a.pct);

  // Historical months
  const hist = [
    { label: format(prev3Start, "MMM", { locale: ptBR }), inc: toNum(hist3[0]._sum.amount), exp: toNum(hist3[1]._sum.amount) },
    { label: format(prev2Start, "MMM", { locale: ptBR }), inc: toNum(hist2[0]._sum.amount), exp: toNum(hist2[1]._sum.amount) },
    { label: format(prev1Start, "MMM", { locale: ptBR }), inc: toNum(hist1[0]._sum.amount), exp: toNum(hist1[1]._sum.amount) },
  ];

  // Build text
  const lines: string[] = [];
  const currentMonthLabel = format(now, "MMMM 'de' yyyy", { locale: ptBR });

  lines.push(`=== SNAPSHOT FINANCEIRO — ${currentMonthLabel.toUpperCase()} ===`);
  lines.push("");
  lines.push(`MÊS ATUAL (${currentMonthLabel}):`);
  lines.push(`  Receitas: ${brl(monthIncome)}`);
  lines.push(`  Despesas: ${brl(monthExpenses)}`);
  lines.push(`  Resultado: ${brl(balance)} (${balance >= 0 ? "superávit" : "déficit"})`);
  lines.push(`  Saldo em contas bancárias: ${brl(bankTotal)}`);
  lines.push(`  Total investido: ${brl(totalInvested)}`);
  lines.push(`  Patrimônio estimado: ${brl(bankTotal + totalInvested)}`);
  lines.push("");

  if (bankAccounts.length > 0) {
    lines.push("CONTAS BANCÁRIAS:");
    bankAccounts.forEach((a) => lines.push(`  ${a.nickname}: ${brl(toNum(a.balance))}`));
    lines.push("");
  }

  lines.push("HISTÓRICO RECENTE:");
  hist.forEach((m) => {
    const res = m.inc - m.exp;
    lines.push(`  ${m.label}: receita ${brl(m.inc)}, despesas ${brl(m.exp)}, resultado ${brl(res)}`);
  });
  lines.push("");

  if (categoryBreakdown.length > 0) {
    lines.push("TOP CATEGORIAS DE DESPESA (mês atual):");
    categoryBreakdown.forEach((c, i) => {
      lines.push(`  ${i + 1}. ${catName(c.categoryId)}: ${brl(toNum(c._sum.amount))}`);
    });
    lines.push("");
  }

  if (budgetAlerts.length > 0) {
    lines.push("ALERTAS DE ORÇAMENTO:");
    budgetAlerts.forEach((b) => {
      const status = b.pct >= 100 ? "ESTOURADO" : "EM ALERTA";
      lines.push(`  ${b.name}: ${b.pct}% utilizado (${brl(b.spent)} de ${brl(b.limit)}) — ${status}`);
    });
    lines.push("");
  }

  if (upcomingExpenses.length > 0) {
    lines.push("PRÓXIMAS DESPESAS PENDENTES:");
    upcomingExpenses.forEach((e) => {
      const dueLabel = format(new Date(e.dueDate), "dd/MM", { locale: ptBR });
      lines.push(`  ${dueLabel} — ${e.description} (${e.category.name}): ${brl(toNum(e.amount))}`);
    });
    lines.push("");
  }

  if (investments.length > 0) {
    lines.push("INVESTIMENTOS:");
    investments.forEach((inv) => {
      const typeLabel: Record<string, string> = {
        FIXED_INCOME: "Renda Fixa",
        VARIABLE_INCOME: "Renda Variável",
        STOCKS: "Ações",
        FUNDS: "Fundos",
        CRYPTO: "Cripto",
        PENSION: "Previdência",
      };
      lines.push(`  ${inv.name} (${typeLabel[inv.type] ?? inv.type}) — ${inv.institution}: ${brl(toNum(inv.balance))}`);
    });
    lines.push("");
  }

  // Savings rate
  if (monthIncome > 0) {
    const savingsRate = ((monthIncome - monthExpenses) / monthIncome) * 100;
    lines.push(`Taxa de poupança atual: ${savingsRate.toFixed(1)}%`);
    lines.push("");
  }

  return lines.join("\n");
}
