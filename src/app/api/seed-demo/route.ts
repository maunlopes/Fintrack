import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { subMonths, addMonths, setDate, startOfMonth } from "date-fns";

export const runtime = "nodejs";

// ── helpers ──────────────────────────────────────────────────────────────────

function rnd(min: number, max: number) {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function monthDate(monthsAgo: number, day: number): Date {
  const base = subMonths(new Date(), monthsAgo);
  return setDate(startOfMonth(base), Math.min(day, 28));
}

// ── main ─────────────────────────────────────────────────────────────────────

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: "Não autorizado" }), { status: 401 });
  }
  const userId = session.user.id;

  // Guard — don't double-seed
  const existing = await prisma.bankAccount.count({ where: { userId } });
  if (existing > 0) {
    return new Response(
      JSON.stringify({ error: "Dados já existem. Use 'Limpar dados' antes de re-popular." }),
      { status: 409 }
    );
  }

  // ── 1. Fetch default categories ──────────────────────────────────────────
  const cats = await prisma.category.findMany({ where: { userId: null } });
  const cat = (name: string) => cats.find((c) => c.name === name)!.id;

  // ── 2. Bank accounts ─────────────────────────────────────────────────────
  const [nubank, bradesco, xp] = await prisma.$transaction([
    prisma.bankAccount.create({
      data: {
        userId,
        name: "Nubank",
        nickname: "Nubank",
        type: "CHECKING",
        balance: 4_850.30,
        color: "#820AD1",
      },
    }),
    prisma.bankAccount.create({
      data: {
        userId,
        name: "Bradesco",
        nickname: "Bradesco Poupança",
        type: "SAVINGS",
        balance: 18_200.00,
        color: "#CC0000",
      },
    }),
    prisma.bankAccount.create({
      data: {
        userId,
        name: "XP Investimentos",
        nickname: "XP",
        type: "INVESTMENT",
        balance: 31_450.00,
        color: "#000000",
      },
    }),
  ]);

  // ── 3. Credit cards ───────────────────────────────────────────────────────
  const [cartaoNubank, cartaoItau] = await prisma.$transaction([
    prisma.creditCard.create({
      data: {
        userId,
        name: "Nubank Roxinho",
        brand: "MASTERCARD",
        lastFourDigits: "4872",
        creditLimit: 8_000,
        closingDay: 25,
        dueDay: 5,
        color: "#820AD1",
        bankAccountId: nubank.id,
      },
    }),
    prisma.creditCard.create({
      data: {
        userId,
        name: "Itaú Visa",
        brand: "VISA",
        lastFourDigits: "1293",
        creditLimit: 5_000,
        closingDay: 10,
        dueDay: 25,
        color: "#003087",
        bankAccountId: bradesco.id,
      },
    }),
  ]);

  // ── 4. Investments ────────────────────────────────────────────────────────
  const [tesouro, etf, cdb] = await prisma.$transaction([
    prisma.investment.create({
      data: {
        userId,
        name: "Tesouro Selic 2029",
        type: "FIXED_INCOME",
        institution: "Tesouro Direto",
        balance: 15_200.00,
        color: "#10B981",
      },
    }),
    prisma.investment.create({
      data: {
        userId,
        name: "BOVA11 — ETF Ibovespa",
        type: "STOCKS",
        institution: "XP Investimentos",
        balance: 9_800.00,
        color: "#3B82F6",
      },
    }),
    prisma.investment.create({
      data: {
        userId,
        name: "CDB Nubank 115% CDI",
        type: "FIXED_INCOME",
        institution: "Nubank",
        balance: 6_450.00,
        color: "#820AD1",
      },
    }),
  ]);

  // Investment transactions (deposits over the last 6 months)
  const invTxs = [
    { investmentId: tesouro.id, type: "DEPOSIT" as const, amount: 5_000, monthsAgo: 5, bankAccountId: bradesco.id },
    { investmentId: tesouro.id, type: "DEPOSIT" as const, amount: 5_000, monthsAgo: 3, bankAccountId: bradesco.id },
    { investmentId: tesouro.id, type: "YIELD"   as const, amount: 85.40, monthsAgo: 1, bankAccountId: null },
    { investmentId: etf.id,     type: "DEPOSIT" as const, amount: 4_000, monthsAgo: 4, bankAccountId: xp.id },
    { investmentId: etf.id,     type: "DEPOSIT" as const, amount: 2_500, monthsAgo: 2, bankAccountId: xp.id },
    { investmentId: etf.id,     type: "DIVIDEND" as const, amount: 120,  monthsAgo: 1, bankAccountId: null },
    { investmentId: cdb.id,     type: "DEPOSIT" as const, amount: 3_000, monthsAgo: 4, bankAccountId: nubank.id },
    { investmentId: cdb.id,     type: "DEPOSIT" as const, amount: 3_000, monthsAgo: 2, bankAccountId: nubank.id },
    { investmentId: cdb.id,     type: "YIELD"   as const, amount: 47.60, monthsAgo: 1, bankAccountId: null },
  ];

  for (const tx of invTxs) {
    await prisma.investmentTransaction.create({
      data: {
        investmentId: tx.investmentId,
        type: tx.type,
        amount: tx.amount,
        date: monthDate(tx.monthsAgo, 10),
        bankAccountId: tx.bankAccountId,
      },
    });
  }

  // ── 5. Category budgets ───────────────────────────────────────────────────
  const budgets = [
    { name: "Alimentação",           limit: 900  },
    { name: "Transporte",            limit: 450  },
    { name: "Lazer",                 limit: 350  },
    { name: "Serviços/Assinaturas",  limit: 280  },
    { name: "Saúde",                 limit: 300  },
  ];
  for (const b of budgets) {
    await prisma.categoryBudget.create({
      data: { userId, categoryId: cat(b.name), monthlyLimit: b.limit },
    });
  }

  // ── 6. Recurring incomes (last 4 months + current) ───────────────────────
  for (let m = 4; m >= 0; m--) {
    await prisma.income.create({
      data: {
        userId,
        description: "Salário",
        amount: 8_000,
        receiveDate: monthDate(m, 5),
        categoryId: cat("Salário"),
        bankAccountId: nubank.id,
        status: m > 0 ? "PAID" : "PENDING",
        isRecurring: true,
        recurrenceFrequency: "MONTHLY",
        recurrenceStart: monthDate(4, 5),
      },
    });
  }

  // Freelance — sporadic
  const freelanceEntries = [
    { monthsAgo: 3, amount: 1_800, desc: "Consultoria — Sistema de Gestão" },
    { monthsAgo: 1, amount: 2_400, desc: "Desenvolvimento de Landing Page" },
  ];
  for (const f of freelanceEntries) {
    await prisma.income.create({
      data: {
        userId,
        description: f.desc,
        amount: f.amount,
        receiveDate: monthDate(f.monthsAgo, 20),
        categoryId: cat("Freelance"),
        bankAccountId: nubank.id,
        status: "PAID",
      },
    });
  }

  // ── 7. Fixed recurring expenses (last 4 months + current) ────────────────
  type FixedExpense = { desc: string; amount: number; day: number; catName: string; bankId: string };
  const fixed: FixedExpense[] = [
    { desc: "Aluguel",              amount: 1_800,  day: 10, catName: "Moradia",              bankId: bradesco.id },
    { desc: "Condomínio",           amount: 380,    day: 10, catName: "Moradia",              bankId: bradesco.id },
    { desc: "Internet Vivo Fibra",  amount: 119.90, day: 15, catName: "Serviços/Assinaturas", bankId: nubank.id },
    { desc: "Academia Smart Fit",   amount: 89.90,  day: 8,  catName: "Saúde",               bankId: nubank.id },
    { desc: "Plano de Saúde",       amount: 280,    day: 10, catName: "Saúde",               bankId: bradesco.id },
  ];
  for (const f of fixed) {
    for (let m = 4; m >= 0; m--) {
      await prisma.expense.create({
        data: {
          userId,
          description: f.desc,
          amount: f.amount,
          dueDate: monthDate(m, f.day),
          categoryId: cat(f.catName),
          type: "FIXED_RECURRING",
          status: m > 0 ? "PAID" : "PENDING",
          isRecurring: true,
          bankAccountId: f.bankId,
        },
      });
    }
  }

  // ── 8. Variable expenses (last 4 months) ─────────────────────────────────
  type VarExpense = { desc: string; amount: number; day: number; catName: string; bankId: string; monthsAgo: number };
  const variable: VarExpense[] = [
    // M-4
    { desc: "Supermercado Pão de Açúcar", amount: 487.30, day: 5,  catName: "Alimentação", bankId: nubank.id,   monthsAgo: 4 },
    { desc: "Supermercado Pão de Açúcar", amount: 210.80, day: 18, catName: "Alimentação", bankId: nubank.id,   monthsAgo: 4 },
    { desc: "Posto Shell",                amount: 220,    day: 7,  catName: "Transporte",  bankId: nubank.id,   monthsAgo: 4 },
    { desc: "Posto Shell",                amount: 195,    day: 22, catName: "Transporte",  bankId: nubank.id,   monthsAgo: 4 },
    { desc: "Farmácia Pacheco",           amount: 87.50,  day: 14, catName: "Saúde",       bankId: nubank.id,   monthsAgo: 4 },
    { desc: "Cinema Cinemark",            amount: 68,     day: 20, catName: "Lazer",       bankId: nubank.id,   monthsAgo: 4 },
    { desc: "Restaurante Outback",        amount: 145,    day: 25, catName: "Alimentação", bankId: bradesco.id, monthsAgo: 4 },
    // M-3
    { desc: "Supermercado Carrefour",     amount: 510.60, day: 4,  catName: "Alimentação", bankId: nubank.id,   monthsAgo: 3 },
    { desc: "Supermercado Carrefour",     amount: 198.40, day: 19, catName: "Alimentação", bankId: nubank.id,   monthsAgo: 3 },
    { desc: "Posto Ipiranga",             amount: 240,    day: 9,  catName: "Transporte",  bankId: nubank.id,   monthsAgo: 3 },
    { desc: "99 App",                     amount: 98.50,  day: 15, catName: "Transporte",  bankId: nubank.id,   monthsAgo: 3 },
    { desc: "Drogasil",                   amount: 120.30, day: 11, catName: "Saúde",       bankId: nubank.id,   monthsAgo: 3 },
    { desc: "iFood",                      amount: 89,     day: 16, catName: "Alimentação", bankId: nubank.id,   monthsAgo: 3 },
    { desc: "Amazon Livros",              amount: 54.90,  day: 21, catName: "Educação",    bankId: bradesco.id, monthsAgo: 3 },
    { desc: "Teatro Municipal — ingresso",amount: 80,     day: 28, catName: "Lazer",       bankId: bradesco.id, monthsAgo: 3 },
    // M-2
    { desc: "Supermercado Pão de Açúcar", amount: 395.80, day: 3,  catName: "Alimentação", bankId: nubank.id,   monthsAgo: 2 },
    { desc: "Supermercado Pão de Açúcar", amount: 230.20, day: 20, catName: "Alimentação", bankId: nubank.id,   monthsAgo: 2 },
    { desc: "Posto Shell",                amount: 210,    day: 6,  catName: "Transporte",  bankId: nubank.id,   monthsAgo: 2 },
    { desc: "Mecânico — revisão",         amount: 380,    day: 13, catName: "Transporte",  bankId: bradesco.id, monthsAgo: 2 },
    { desc: "Consulta médica",            amount: 250,    day: 17, catName: "Saúde",       bankId: bradesco.id, monthsAgo: 2 },
    { desc: "Restaurante Madero",         amount: 132,    day: 23, catName: "Alimentação", bankId: nubank.id,   monthsAgo: 2 },
    { desc: "Steam — jogo",               amount: 49.90,  day: 25, catName: "Lazer",       bankId: nubank.id,   monthsAgo: 2 },
    { desc: "Livraria Saraiva",           amount: 78.80,  day: 27, catName: "Educação",    bankId: bradesco.id, monthsAgo: 2 },
    // M-1
    { desc: "Supermercado Carrefour",     amount: 472.50, day: 5,  catName: "Alimentação", bankId: nubank.id,   monthsAgo: 1 },
    { desc: "Supermercado Carrefour",     amount: 188.70, day: 21, catName: "Alimentação", bankId: nubank.id,   monthsAgo: 1 },
    { desc: "Posto Ipiranga",             amount: 230,    day: 8,  catName: "Transporte",  bankId: nubank.id,   monthsAgo: 1 },
    { desc: "99 App",                     amount: 115,    day: 12, catName: "Transporte",  bankId: nubank.id,   monthsAgo: 1 },
    { desc: "Farmácia Pacheco",           amount: 95.40,  day: 14, catName: "Saúde",       bankId: nubank.id,   monthsAgo: 1 },
    { desc: "Restaurante Coco Bambu",     amount: 178,    day: 18, catName: "Alimentação", bankId: bradesco.id, monthsAgo: 1 },
    { desc: "Shopee",                     amount: 215.60, day: 22, catName: "Compras",     bankId: nubank.id,   monthsAgo: 1 },
    { desc: "Bar do Zé — happy hour",     amount: 72,     day: 26, catName: "Lazer",       bankId: nubank.id,   monthsAgo: 1 },
    // Current month (partial)
    { desc: "Supermercado Pão de Açúcar", amount: 318.90, day: 3,  catName: "Alimentação", bankId: nubank.id,   monthsAgo: 0 },
    { desc: "Posto Shell",                amount: 195,    day: 7,  catName: "Transporte",  bankId: nubank.id,   monthsAgo: 0 },
    { desc: "iFood",                      amount: 64.90,  day: 12, catName: "Alimentação", bankId: nubank.id,   monthsAgo: 0 },
    { desc: "Farmácia Drogasil",          amount: 58.30,  day: 15, catName: "Saúde",       bankId: nubank.id,   monthsAgo: 0 },
  ];

  for (const v of variable) {
    const dueDate = monthDate(v.monthsAgo, v.day);
    if (dueDate > new Date()) continue; // skip future dates
    await prisma.expense.create({
      data: {
        userId,
        description: v.desc,
        amount: v.amount,
        dueDate,
        categoryId: cat(v.catName),
        type: "ONE_TIME",
        status: v.monthsAgo > 0 ? "PAID" : "PENDING",
        bankAccountId: v.bankId,
      },
    });
  }

  // ── 9. Credit card transactions ───────────────────────────────────────────
  type CardTx = {
    cardId: string;
    desc: string;
    totalAmount: number;
    purchaseDate: Date;
    catName: string;
    installments?: number;
  };

  const cardTxs: CardTx[] = [
    // Nubank — last 2 months
    { cardId: cartaoNubank.id, desc: "Netflix",                 totalAmount: 45.90,    purchaseDate: monthDate(4, 2),  catName: "Serviços/Assinaturas" },
    { cardId: cartaoNubank.id, desc: "Spotify",                 totalAmount: 26.90,    purchaseDate: monthDate(4, 2),  catName: "Serviços/Assinaturas" },
    { cardId: cartaoNubank.id, desc: "Amazon Prime",            totalAmount: 19.90,    purchaseDate: monthDate(4, 2),  catName: "Serviços/Assinaturas" },
    { cardId: cartaoNubank.id, desc: "Apple One",               totalAmount: 42.90,    purchaseDate: monthDate(4, 3),  catName: "Serviços/Assinaturas" },
    { cardId: cartaoNubank.id, desc: "Shopee — roupas",         totalAmount: 189.90,   purchaseDate: monthDate(4, 8),  catName: "Compras" },
    { cardId: cartaoNubank.id, desc: "iFood",                   totalAmount: 78,       purchaseDate: monthDate(4, 14), catName: "Alimentação" },
    { cardId: cartaoNubank.id, desc: "Uber Eats",               totalAmount: 52.40,    purchaseDate: monthDate(4, 19), catName: "Alimentação" },
    { cardId: cartaoNubank.id, desc: "Netflix",                 totalAmount: 45.90,    purchaseDate: monthDate(3, 2),  catName: "Serviços/Assinaturas" },
    { cardId: cartaoNubank.id, desc: "Spotify",                 totalAmount: 26.90,    purchaseDate: monthDate(3, 2),  catName: "Serviços/Assinaturas" },
    { cardId: cartaoNubank.id, desc: "Amazon Prime",            totalAmount: 19.90,    purchaseDate: monthDate(3, 2),  catName: "Serviços/Assinaturas" },
    { cardId: cartaoNubank.id, desc: "Apple One",               totalAmount: 42.90,    purchaseDate: monthDate(3, 3),  catName: "Serviços/Assinaturas" },
    { cardId: cartaoNubank.id, desc: "Zara — blusa",            totalAmount: 249.90,   purchaseDate: monthDate(3, 10), catName: "Compras" },
    { cardId: cartaoNubank.id, desc: "Restaurante Fogo de Chão",totalAmount: 215,      purchaseDate: monthDate(3, 16), catName: "Alimentação" },
    { cardId: cartaoNubank.id, desc: "Uber",                    totalAmount: 67.80,    purchaseDate: monthDate(3, 22), catName: "Transporte" },
    { cardId: cartaoNubank.id, desc: "Notebook Dell — 10x",     totalAmount: 3_499.90, purchaseDate: monthDate(3, 5),  catName: "Educação", installments: 10 },
    { cardId: cartaoNubank.id, desc: "Netflix",                 totalAmount: 45.90,    purchaseDate: monthDate(2, 2),  catName: "Serviços/Assinaturas" },
    { cardId: cartaoNubank.id, desc: "Spotify",                 totalAmount: 26.90,    purchaseDate: monthDate(2, 2),  catName: "Serviços/Assinaturas" },
    { cardId: cartaoNubank.id, desc: "Amazon Prime",            totalAmount: 19.90,    purchaseDate: monthDate(2, 2),  catName: "Serviços/Assinaturas" },
    { cardId: cartaoNubank.id, desc: "Apple One",               totalAmount: 42.90,    purchaseDate: monthDate(2, 3),  catName: "Serviços/Assinaturas" },
    { cardId: cartaoNubank.id, desc: "Shopee — eletrônicos",    totalAmount: 340,      purchaseDate: monthDate(2, 11), catName: "Compras" },
    { cardId: cartaoNubank.id, desc: "99 App",                  totalAmount: 88.50,    purchaseDate: monthDate(2, 17), catName: "Transporte" },
    { cardId: cartaoNubank.id, desc: "Netflix",                 totalAmount: 45.90,    purchaseDate: monthDate(1, 2),  catName: "Serviços/Assinaturas" },
    { cardId: cartaoNubank.id, desc: "Spotify",                 totalAmount: 26.90,    purchaseDate: monthDate(1, 2),  catName: "Serviços/Assinaturas" },
    { cardId: cartaoNubank.id, desc: "Amazon Prime",            totalAmount: 19.90,    purchaseDate: monthDate(1, 2),  catName: "Serviços/Assinaturas" },
    { cardId: cartaoNubank.id, desc: "Apple One",               totalAmount: 42.90,    purchaseDate: monthDate(1, 3),  catName: "Serviços/Assinaturas" },
    { cardId: cartaoNubank.id, desc: "Renner — calça jeans",    totalAmount: 179.90,   purchaseDate: monthDate(1, 9),  catName: "Compras" },
    { cardId: cartaoNubank.id, desc: "iFood",                   totalAmount: 95.60,    purchaseDate: monthDate(1, 15), catName: "Alimentação" },
    { cardId: cartaoNubank.id, desc: "Uber",                    totalAmount: 43.20,    purchaseDate: monthDate(1, 21), catName: "Transporte" },
    // Current month Nubank
    { cardId: cartaoNubank.id, desc: "Netflix",                 totalAmount: 45.90,    purchaseDate: monthDate(0, 2),  catName: "Serviços/Assinaturas" },
    { cardId: cartaoNubank.id, desc: "Spotify",                 totalAmount: 26.90,    purchaseDate: monthDate(0, 2),  catName: "Serviços/Assinaturas" },
    { cardId: cartaoNubank.id, desc: "Apple One",               totalAmount: 42.90,    purchaseDate: monthDate(0, 3),  catName: "Serviços/Assinaturas" },
    { cardId: cartaoNubank.id, desc: "iFood",                   totalAmount: 62.30,    purchaseDate: monthDate(0, 8),  catName: "Alimentação" },
    { cardId: cartaoNubank.id, desc: "Shopee — casa",           totalAmount: 127.80,   purchaseDate: monthDate(0, 12), catName: "Compras" },
    // Itaú — últimos 2 meses
    { cardId: cartaoItau.id,   desc: "Posto BR",                totalAmount: 195,      purchaseDate: monthDate(2, 6),  catName: "Transporte" },
    { cardId: cartaoItau.id,   desc: "Decathlon — tênis 6x",   totalAmount: 420,      purchaseDate: monthDate(2, 14), catName: "Compras", installments: 6 },
    { cardId: cartaoItau.id,   desc: "Restaurante Outback",     totalAmount: 165,      purchaseDate: monthDate(2, 19), catName: "Alimentação" },
    { cardId: cartaoItau.id,   desc: "Posto BR",                totalAmount: 210,      purchaseDate: monthDate(1, 5),  catName: "Transporte" },
    { cardId: cartaoItau.id,   desc: "C&A — roupas",            totalAmount: 198.90,   purchaseDate: monthDate(1, 11), catName: "Compras" },
    { cardId: cartaoItau.id,   desc: "Rappi",                   totalAmount: 55.70,    purchaseDate: monthDate(1, 17), catName: "Alimentação" },
    { cardId: cartaoItau.id,   desc: "Cinema Cinemark",         totalAmount: 74,       purchaseDate: monthDate(1, 24), catName: "Lazer" },
    { cardId: cartaoItau.id,   desc: "Posto BR",                totalAmount: 185,      purchaseDate: monthDate(0, 4),  catName: "Transporte" },
    { cardId: cartaoItau.id,   desc: "Rappi",                   totalAmount: 48.90,    purchaseDate: monthDate(0, 10), catName: "Alimentação" },
  ];

  for (const tx of cardTxs) {
    if (tx.purchaseDate > new Date()) continue;
    if (tx.installments) {
      const installmentAmount = Math.round((tx.totalAmount / tx.installments) * 100) / 100;
      const parent = await prisma.cardTransaction.create({
        data: {
          creditCardId: tx.cardId,
          description: tx.desc,
          totalAmount: tx.totalAmount,
          installmentAmount,
          purchaseDate: tx.purchaseDate,
          categoryId: cat(tx.catName),
          isInstallment: true,
          totalInstallments: tx.installments,
          currentInstallment: 1,
        },
      });
      for (let i = 2; i <= tx.installments; i++) {
        await prisma.cardTransaction.create({
          data: {
            creditCardId: tx.cardId,
            description: tx.desc,
            totalAmount: tx.totalAmount,
            installmentAmount,
            purchaseDate: addMonths(tx.purchaseDate, i - 1),
            categoryId: cat(tx.catName),
            isInstallment: true,
            totalInstallments: tx.installments,
            currentInstallment: i,
            parentTransactionId: parent.id,
          },
        });
      }
    } else {
      await prisma.cardTransaction.create({
        data: {
          creditCardId: tx.cardId,
          description: tx.desc,
          totalAmount: tx.totalAmount,
          installmentAmount: null,
          purchaseDate: tx.purchaseDate,
          categoryId: cat(tx.catName),
          isInstallment: false,
        },
      });
    }
  }

  // ── 10. Pay past invoices (Nubank: close=25, due=5) ──────────────────────
  // Invoices for months M-3, M-2, M-1 are in the past — mark as paid
  const today = new Date();
  const nuPastInvoices = [
    { monthsAgo: 3 },
    { monthsAgo: 2 },
    { monthsAgo: 1 },
  ];
  for (const inv of nuPastInvoices) {
    const dueDate = monthDate(inv.monthsAgo - 1, 5); // due is month after closing
    if (dueDate >= new Date(today.getFullYear(), today.getMonth(), 1)) continue;
    const m = dueDate.getMonth() + 1;
    const y = dueDate.getFullYear();
    try {
      await prisma.invoicePayment.create({
        data: {
          userId,
          creditCardId: cartaoNubank.id,
          month: m,
          year: y,
          amount: rnd(400, 900),
          bankAccountId: nubank.id,
          paidAt: setDate(dueDate, 3),
        },
      });
    } catch {
      // skip duplicate
    }
  }

  return new Response(JSON.stringify({
    ok: true,
    created: {
      bankAccounts: 3,
      creditCards: 2,
      investments: 3,
      budgets: budgets.length,
      message: "Dados de demonstração criados com sucesso!",
    },
  }), { status: 200 });
}
