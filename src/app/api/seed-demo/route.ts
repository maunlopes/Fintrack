import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { subMonths, addMonths, setDate, startOfMonth } from "date-fns";
import { CategoryType, ExpenseType, PaymentStatus, InvestmentType, InvestmentTransactionType, BankAccountType, CardBrand } from "@prisma/client";

export const runtime = "nodejs";

// ── helpers ──────────────────────────────────────────────────────────────────

/** Date: N months ago, on `day` */
function d(monthsAgo: number, day: number): Date {
  const base = subMonths(new Date(), monthsAgo);
  return setDate(startOfMonth(base), Math.min(day, 28));
}

/** Is the date in the past (≤ today)? */
function isPast(date: Date): boolean {
  return date <= new Date();
}

// ── route ─────────────────────────────────────────────────────────────────────

export async function POST() {
  if (process.env.NODE_ENV === "production")
    return new Response(JSON.stringify({ error: "Not available in production" }), { status: 403 });

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

  // ── 1. Categories (self-contained — don't rely on global defaults) ─────────
  const categoryDefs = [
    // Expense
    { name: "Alimentação",          type: CategoryType.EXPENSE, icon: "utensils",       color: "#FF5B04" },
    { name: "Transporte",           type: CategoryType.EXPENSE, icon: "car",             color: "#075056" },
    { name: "Moradia",              type: CategoryType.EXPENSE, icon: "home",            color: "#16232A" },
    { name: "Saúde",                type: CategoryType.EXPENSE, icon: "heart-pulse",     color: "#EF4444" },
    { name: "Educação",             type: CategoryType.EXPENSE, icon: "graduation-cap",  color: "#3B82F6" },
    { name: "Lazer",                type: CategoryType.EXPENSE, icon: "gamepad-2",       color: "#8B5CF6" },
    { name: "Compras",              type: CategoryType.EXPENSE, icon: "shopping-bag",    color: "#F59E0B" },
    { name: "Serviços/Assinaturas", type: CategoryType.EXPENSE, icon: "wifi",            color: "#0D8A93" },
    { name: "Impostos",             type: CategoryType.EXPENSE, icon: "receipt",         color: "#B91C1C" },
    { name: "Outros",               type: CategoryType.EXPENSE, icon: "circle",          color: "#8A9AA3" },
    // Income
    { name: "Salário",              type: CategoryType.INCOME,  icon: "briefcase",       color: "#10B981" },
    { name: "Freelance",            type: CategoryType.INCOME,  icon: "laptop",          color: "#34D399" },
    { name: "Rendimentos",          type: CategoryType.INCOME,  icon: "trending-up",     color: "#075056" },
    { name: "Outros (Receitas)",    type: CategoryType.INCOME,  icon: "circle",          color: "#8A9AA3" },
  ] as const;

  // Upsert: try to use global default first, fall back to creating user category
  const catMap: Record<string, string> = {};
  for (const def of categoryDefs) {
    const global = await prisma.category.findFirst({ where: { userId: null, name: def.name, type: def.type } });
    if (global) {
      catMap[def.name] = global.id;
    } else {
      const existing = await prisma.category.findFirst({ where: { userId, name: def.name, type: def.type } });
      if (existing) {
        catMap[def.name] = existing.id;
      } else {
        const created = await prisma.category.create({
          data: { userId, name: def.name, type: def.type, icon: def.icon, color: def.color },
        });
        catMap[def.name] = created.id;
      }
    }
  }
  const cat = (name: string) => catMap[name]!;

  // ── 2. Bank accounts ─────────────────────────────────────────────────────
  const nubank   = await prisma.bankAccount.create({ data: { userId, name: "Nubank",          nickname: "Nubank",            type: BankAccountType.CHECKING,   balance: 4_850.30,  color: "#820AD1" } });
  const bradesco = await prisma.bankAccount.create({ data: { userId, name: "Bradesco",        nickname: "Bradesco Poupança", type: BankAccountType.SAVINGS,    balance: 18_200.00, color: "#CC0000" } });
  const xp       = await prisma.bankAccount.create({ data: { userId, name: "XP Investimentos",nickname: "XP",               type: BankAccountType.INVESTMENT,  balance: 31_450.00, color: "#000000" } });

  // ── 3. Credit cards ───────────────────────────────────────────────────────
  const cardNubank = await prisma.creditCard.create({ data: { userId, name: "Nubank Roxinho", brand: CardBrand.MASTERCARD, lastFourDigits: "4872", creditLimit: 8_000, closingDay: 25, dueDay: 5,  color: "#820AD1", bankAccountId: nubank.id } });
  const cardItau   = await prisma.creditCard.create({ data: { userId, name: "Itaú Visa",      brand: CardBrand.VISA,       lastFourDigits: "1293", creditLimit: 5_000, closingDay: 10, dueDay: 25, color: "#003087", bankAccountId: bradesco.id } });

  // ── 4. Investments ────────────────────────────────────────────────────────
  const tesouro = await prisma.investment.create({ data: { userId, name: "Tesouro Selic 2029",   type: InvestmentType.FIXED_INCOME,    institution: "Tesouro Direto",  balance: 15_200.00, color: "#10B981" } });
  const bova11  = await prisma.investment.create({ data: { userId, name: "BOVA11 — ETF Ibovespa",type: InvestmentType.STOCKS,          institution: "XP Investimentos", balance: 9_800.00,  color: "#3B82F6" } });
  const cdb     = await prisma.investment.create({ data: { userId, name: "CDB Nubank 115% CDI",  type: InvestmentType.FIXED_INCOME,    institution: "Nubank",           balance: 6_450.00,  color: "#820AD1" } });

  // Investment transactions spanning 12 months
  const invTxDefs: { inv: typeof tesouro; type: InvestmentTransactionType; amount: number; mo: number; bankId: string | null }[] = [
    { inv: tesouro, type: InvestmentTransactionType.DEPOSIT,  amount: 3_000,  mo: 11, bankId: bradesco.id },
    { inv: tesouro, type: InvestmentTransactionType.DEPOSIT,  amount: 3_000,  mo: 8,  bankId: bradesco.id },
    { inv: tesouro, type: InvestmentTransactionType.DEPOSIT,  amount: 5_000,  mo: 5,  bankId: bradesco.id },
    { inv: tesouro, type: InvestmentTransactionType.YIELD,    amount: 95.40,  mo: 3,  bankId: null },
    { inv: tesouro, type: InvestmentTransactionType.YIELD,    amount: 102.80, mo: 1,  bankId: null },
    { inv: bova11,  type: InvestmentTransactionType.DEPOSIT,  amount: 4_000,  mo: 10, bankId: xp.id },
    { inv: bova11,  type: InvestmentTransactionType.DEPOSIT,  amount: 2_500,  mo: 6,  bankId: xp.id },
    { inv: bova11,  type: InvestmentTransactionType.DEPOSIT,  amount: 2_000,  mo: 2,  bankId: xp.id },
    { inv: bova11,  type: InvestmentTransactionType.DIVIDEND, amount: 120,    mo: 1,  bankId: null },
    { inv: cdb,     type: InvestmentTransactionType.DEPOSIT,  amount: 3_000,  mo: 9,  bankId: nubank.id },
    { inv: cdb,     type: InvestmentTransactionType.DEPOSIT,  amount: 3_000,  mo: 4,  bankId: nubank.id },
    { inv: cdb,     type: InvestmentTransactionType.YIELD,    amount: 47.60,  mo: 1,  bankId: null },
  ];
  for (const tx of invTxDefs) {
    await prisma.investmentTransaction.create({ data: { investmentId: tx.inv.id, type: tx.type, amount: tx.amount, date: d(tx.mo, 10), bankAccountId: tx.bankId } });
  }

  // ── 5. Category budgets ───────────────────────────────────────────────────
  for (const [name, limit] of [
    ["Alimentação", 900], ["Transporte", 450], ["Lazer", 350],
    ["Serviços/Assinaturas", 280], ["Saúde", 300], ["Compras", 500],
  ] as [string, number][]) {
    await prisma.categoryBudget.create({ data: { userId, categoryId: cat(name), monthlyLimit: limit } });
  }

  // ── 6. Transfers between accounts ────────────────────────────────────────
  const transferDefs = [
    { mo: 10, day: 5,  amount: 2_000, from: nubank.id,   to: bradesco.id, desc: "Reserva de emergência" },
    { mo: 7,  day: 5,  amount: 1_500, from: nubank.id,   to: bradesco.id, desc: "Reserva de emergência" },
    { mo: 4,  day: 5,  amount: 3_000, from: bradesco.id, to: xp.id,       desc: "Aporte XP" },
    { mo: 2,  day: 5,  amount: 500,   from: nubank.id,   to: bradesco.id, desc: "Poupança mensal" },
  ];
  for (const t of transferDefs) {
    await prisma.transfer.create({ data: { userId, fromAccountId: t.from, toAccountId: t.to, amount: t.amount, date: d(t.mo, t.day), description: t.desc } });
  }

  // ── 7. Incomes — 12 months ────────────────────────────────────────────────
  // Salary every month
  for (let mo = 11; mo >= 0; mo--) {
    const receiveDate = d(mo, 5);
    if (!isPast(receiveDate)) continue;
    await prisma.income.create({ data: { userId, description: "Salário", amount: 8_000, receiveDate, categoryId: cat("Salário"), bankAccountId: nubank.id, status: PaymentStatus.PAID, isRecurring: true, recurrenceFrequency: "MONTHLY", recurrenceStart: d(11, 5) } });
  }
  // 13th salary (Dezembro = month 11 ago if current is March 2026, that's April 2025 = 11 months ago)
  // Actually let's add a 13th salary in December
  const dec13th = d(3, 20); // December 2025 = 3 months ago from March 2026
  if (isPast(dec13th)) {
    await prisma.income.create({ data: { userId, description: "13º Salário", amount: 8_000, receiveDate: dec13th, categoryId: cat("Salário"), bankAccountId: nubank.id, status: PaymentStatus.PAID } });
  }
  // Freelance — sporadic
  const freelanceDefs = [
    { mo: 10, amount: 1_200, desc: "Consultoria — ERP" },
    { mo: 7,  amount: 2_800, desc: "Desenvolvimento Web" },
    { mo: 4,  amount: 1_800, desc: "Consultoria — Sistema de Gestão" },
    { mo: 1,  amount: 2_400, desc: "Landing Page + SEO" },
  ];
  for (const f of freelanceDefs) {
    const receiveDate = d(f.mo, 20);
    if (!isPast(receiveDate)) continue;
    await prisma.income.create({ data: { userId, description: f.desc, amount: f.amount, receiveDate, categoryId: cat("Freelance"), bankAccountId: nubank.id, status: PaymentStatus.PAID } });
  }
  // Yield income from investments
  await prisma.income.create({ data: { userId, description: "Rendimento Tesouro Selic", amount: 198.20, receiveDate: d(1, 15), categoryId: cat("Rendimentos"), bankAccountId: bradesco.id, status: PaymentStatus.PAID } });
  await prisma.income.create({ data: { userId, description: "Dividendos BOVA11",        amount: 120.00, receiveDate: d(1, 15), categoryId: cat("Rendimentos"), bankAccountId: xp.id,       status: PaymentStatus.PAID } });

  // ── 8. Fixed recurring expenses — 12 months ───────────────────────────────
  type FixedDef = { desc: string; amount: number; day: number; catName: string; bankId: string };
  const fixedDefs: FixedDef[] = [
    { desc: "Aluguel",             amount: 1_800,  day: 10, catName: "Moradia",              bankId: bradesco.id },
    { desc: "Condomínio",          amount: 380,    day: 10, catName: "Moradia",              bankId: bradesco.id },
    { desc: "Internet Vivo Fibra", amount: 119.90, day: 15, catName: "Serviços/Assinaturas", bankId: nubank.id   },
    { desc: "Academia Smart Fit",  amount: 89.90,  day: 8,  catName: "Saúde",               bankId: nubank.id   },
    { desc: "Plano de Saúde",      amount: 280,    day: 10, catName: "Saúde",               bankId: bradesco.id },
  ];
  for (const f of fixedDefs) {
    for (let mo = 11; mo >= 0; mo--) {
      const dueDate = d(mo, f.day);
      if (!isPast(dueDate)) continue;
      await prisma.expense.create({ data: { userId, description: f.desc, amount: f.amount, dueDate, categoryId: cat(f.catName), type: ExpenseType.FIXED_RECURRING, status: mo > 0 ? PaymentStatus.PAID : PaymentStatus.PENDING, isRecurring: true, bankAccountId: f.bankId } });
    }
  }

  // ── 9. Variable expenses — per month ─────────────────────────────────────
  type VarMonth = { mo: number; desc: string; amount: number; day: number; catName: string; bankId: string };
  const varDefs: VarMonth[] = [
    // ── M-11 ──
    { mo:11, desc:"Supermercado Extra",        amount:445.30, day:5,  catName:"Alimentação", bankId:nubank.id   },
    { mo:11, desc:"Posto Petrobras",           amount:190,    day:8,  catName:"Transporte",  bankId:nubank.id   },
    { mo:11, desc:"Restaurante Outback",       amount:138,    day:14, catName:"Alimentação", bankId:bradesco.id },
    { mo:11, desc:"Farmácia Drogasil",         amount:67.50,  day:20, catName:"Saúde",       bankId:nubank.id   },
    // ── M-10 ──
    { mo:10, desc:"Supermercado Pão de Açúcar",amount:512.80, day:4,  catName:"Alimentação", bankId:nubank.id   },
    { mo:10, desc:"Uber",                      amount:92.40,  day:9,  catName:"Transporte",  bankId:nubank.id   },
    { mo:10, desc:"Posto Shell",               amount:215,    day:15, catName:"Transporte",  bankId:nubank.id   },
    { mo:10, desc:"Cinema Cinemark",           amount:68,     day:21, catName:"Lazer",       bankId:nubank.id   },
    { mo:10, desc:"Livraria Saraiva",          amount:89.90,  day:25, catName:"Educação",    bankId:bradesco.id },
    // ── M-9 ──
    { mo:9,  desc:"Supermercado Carrefour",    amount:478.60, day:3,  catName:"Alimentação", bankId:nubank.id   },
    { mo:9,  desc:"Posto Ipiranga",            amount:230,    day:7,  catName:"Transporte",  bankId:nubank.id   },
    { mo:9,  desc:"iFood",                     amount:78.50,  day:12, catName:"Alimentação", bankId:nubank.id   },
    { mo:9,  desc:"Consulta médica",           amount:250,    day:18, catName:"Saúde",       bankId:bradesco.id },
    { mo:9,  desc:"Bar happy hour",            amount:98,     day:24, catName:"Lazer",       bankId:nubank.id   },
    // ── M-8 ──
    { mo:8,  desc:"Supermercado Extra",        amount:390.20, day:5,  catName:"Alimentação", bankId:nubank.id   },
    { mo:8,  desc:"99 App",                    amount:115,    day:9,  catName:"Transporte",  bankId:nubank.id   },
    { mo:8,  desc:"Posto Shell",               amount:198,    day:14, catName:"Transporte",  bankId:nubank.id   },
    { mo:8,  desc:"Restaurante Madero",        amount:125,    day:19, catName:"Alimentação", bankId:bradesco.id },
    { mo:8,  desc:"Farmácia Pacheco",          amount:54.80,  day:25, catName:"Saúde",       bankId:nubank.id   },
    // ── M-7 ──
    { mo:7,  desc:"Supermercado Pão de Açúcar",amount:523.40, day:4,  catName:"Alimentação", bankId:nubank.id   },
    { mo:7,  desc:"Posto Petrobras",           amount:205,    day:8,  catName:"Transporte",  bankId:nubank.id   },
    { mo:7,  desc:"Mecânico — revisão 20k",    amount:480,    day:13, catName:"Transporte",  bankId:bradesco.id },
    { mo:7,  desc:"Steam — jogos",             amount:74.90,  day:20, catName:"Lazer",       bankId:nubank.id   },
    { mo:7,  desc:"Amazon",                    amount:189.40, day:26, catName:"Compras",     bankId:nubank.id   },
    // ── M-6 ──
    { mo:6,  desc:"Supermercado Carrefour",    amount:401.60, day:5,  catName:"Alimentação", bankId:nubank.id   },
    { mo:6,  desc:"Uber",                      amount:88.30,  day:9,  catName:"Transporte",  bankId:nubank.id   },
    { mo:6,  desc:"Posto Shell",               amount:220,    day:14, catName:"Transporte",  bankId:nubank.id   },
    { mo:6,  desc:"Restaurante Coco Bambu",    amount:178,    day:19, catName:"Alimentação", bankId:bradesco.id },
    { mo:6,  desc:"Farmácia Drogasil",         amount:92.20,  day:24, catName:"Saúde",       bankId:nubank.id   },
    // ── M-5 ──
    { mo:5,  desc:"Supermercado Extra",        amount:467.80, day:3,  catName:"Alimentação", bankId:nubank.id   },
    { mo:5,  desc:"99 App",                    amount:104.50, day:8,  catName:"Transporte",  bankId:nubank.id   },
    { mo:5,  desc:"Posto Ipiranga",            amount:195,    day:13, catName:"Transporte",  bankId:nubank.id   },
    { mo:5,  desc:"Shopee",                    amount:234.70, day:19, catName:"Compras",     bankId:nubank.id   },
    { mo:5,  desc:"Teatro — ingresso",         amount:90,     day:24, catName:"Lazer",       bankId:bradesco.id },
    // ── M-4 ──
    { mo:4,  desc:"Supermercado Pão de Açúcar",amount:487.30, day:5,  catName:"Alimentação", bankId:nubank.id   },
    { mo:4,  desc:"Posto Shell",               amount:220,    day:7,  catName:"Transporte",  bankId:nubank.id   },
    { mo:4,  desc:"Restaurante Outback",       amount:145,    day:14, catName:"Alimentação", bankId:bradesco.id },
    { mo:4,  desc:"Farmácia Pacheco",          amount:87.50,  day:20, catName:"Saúde",       bankId:nubank.id   },
    { mo:4,  desc:"Cinema Cinemark",           amount:68,     day:25, catName:"Lazer",       bankId:nubank.id   },
    // ── M-3 ──
    { mo:3,  desc:"Supermercado Carrefour",    amount:510.60, day:4,  catName:"Alimentação", bankId:nubank.id   },
    { mo:3,  desc:"Posto Ipiranga",            amount:240,    day:9,  catName:"Transporte",  bankId:nubank.id   },
    { mo:3,  desc:"iFood",                     amount:89,     day:16, catName:"Alimentação", bankId:nubank.id   },
    { mo:3,  desc:"Drogasil",                  amount:120.30, day:22, catName:"Saúde",       bankId:nubank.id   },
    { mo:3,  desc:"Amazon Livros",             amount:54.90,  day:27, catName:"Educação",    bankId:bradesco.id },
    // ── M-2 ──
    { mo:2,  desc:"Supermercado Pão de Açúcar",amount:395.80, day:3,  catName:"Alimentação", bankId:nubank.id   },
    { mo:2,  desc:"Posto Shell",               amount:210,    day:6,  catName:"Transporte",  bankId:nubank.id   },
    { mo:2,  desc:"Mecânico — revisão",        amount:380,    day:13, catName:"Transporte",  bankId:bradesco.id },
    { mo:2,  desc:"Restaurante Madero",        amount:132,    day:23, catName:"Alimentação", bankId:nubank.id   },
    { mo:2,  desc:"Shopee",                    amount:215.60, day:25, catName:"Compras",     bankId:nubank.id   },
    // ── M-1 ──
    { mo:1,  desc:"Supermercado Carrefour",    amount:472.50, day:5,  catName:"Alimentação", bankId:nubank.id   },
    { mo:1,  desc:"99 App",                    amount:115,    day:8,  catName:"Transporte",  bankId:nubank.id   },
    { mo:1,  desc:"Posto Ipiranga",            amount:230,    day:12, catName:"Transporte",  bankId:nubank.id   },
    { mo:1,  desc:"Restaurante Fogo de Chão",  amount:178,    day:18, catName:"Alimentação", bankId:bradesco.id },
    { mo:1,  desc:"Shopee — roupas",           amount:215.60, day:22, catName:"Compras",     bankId:nubank.id   },
    // ── M-0 (current, partial) ──
    { mo:0,  desc:"Supermercado Pão de Açúcar",amount:318.90, day:3,  catName:"Alimentação", bankId:nubank.id   },
    { mo:0,  desc:"Posto Shell",               amount:195,    day:7,  catName:"Transporte",  bankId:nubank.id   },
    { mo:0,  desc:"iFood",                     amount:64.90,  day:12, catName:"Alimentação", bankId:nubank.id   },
    { mo:0,  desc:"Farmácia Drogasil",         amount:58.30,  day:15, catName:"Saúde",       bankId:nubank.id   },
  ];
  for (const v of varDefs) {
    const dueDate = d(v.mo, v.day);
    if (!isPast(dueDate)) continue;
    await prisma.expense.create({ data: { userId, description: v.desc, amount: v.amount, dueDate, categoryId: cat(v.catName), type: ExpenseType.ONE_TIME, status: v.mo > 0 ? PaymentStatus.PAID : PaymentStatus.PENDING, bankAccountId: v.bankId } });
  }

  // ── 10. Credit card transactions — 12 months ──────────────────────────────
  type CardTxDef = { cardId: string; desc: string; total: number; mo: number; day: number; catName: string; parcelas?: number };

  const cardTxDefs: CardTxDef[] = [
    // ── Recurring subscriptions on Nubank (every month) ──
    ...Array.from({ length: 12 }, (_, i) => 12 - i - 1).flatMap((mo) => [
      { cardId: cardNubank.id, desc: "Netflix",       total: 45.90, mo, day: 2,  catName: "Serviços/Assinaturas" },
      { cardId: cardNubank.id, desc: "Spotify",       total: 26.90, mo, day: 2,  catName: "Serviços/Assinaturas" },
      { cardId: cardNubank.id, desc: "Amazon Prime",  total: 19.90, mo, day: 3,  catName: "Serviços/Assinaturas" },
      { cardId: cardNubank.id, desc: "Apple One",     total: 42.90, mo, day: 3,  catName: "Serviços/Assinaturas" },
    ]),
    // ── Variable Nubank transactions ──
    { cardId: cardNubank.id, desc: "Shopee — roupas",          total: 189.90,   mo: 11, day: 8,  catName: "Compras" },
    { cardId: cardNubank.id, desc: "iFood",                    total: 78.00,    mo: 11, day: 14, catName: "Alimentação" },
    { cardId: cardNubank.id, desc: "Zara — blusa",             total: 249.90,   mo: 10, day: 10, catName: "Compras" },
    { cardId: cardNubank.id, desc: "Restaurante Fogo de Chão", total: 215.00,   mo: 10, day: 16, catName: "Alimentação" },
    { cardId: cardNubank.id, desc: "Notebook Dell",            total: 3_499.90, mo: 10, day: 5,  catName: "Educação", parcelas: 10 },
    { cardId: cardNubank.id, desc: "Uber",                     total: 67.80,    mo: 9,  day: 12, catName: "Transporte" },
    { cardId: cardNubank.id, desc: "Shopee — eletrônicos",     total: 340.00,   mo: 8,  day: 11, catName: "Compras" },
    { cardId: cardNubank.id, desc: "99 App",                   total: 88.50,    mo: 8,  day: 17, catName: "Transporte" },
    { cardId: cardNubank.id, desc: "Renner — calça jeans",     total: 179.90,   mo: 7,  day: 9,  catName: "Compras" },
    { cardId: cardNubank.id, desc: "iPhone 15 — 12x",         total: 5_999.00, mo: 6,  day: 15, catName: "Compras", parcelas: 12 },
    { cardId: cardNubank.id, desc: "iFood",                    total: 95.60,    mo: 6,  day: 21, catName: "Alimentação" },
    { cardId: cardNubank.id, desc: "Uber",                     total: 43.20,    mo: 6,  day: 26, catName: "Transporte" },
    { cardId: cardNubank.id, desc: "Shopee — casa",            total: 127.80,   mo: 5,  day: 10, catName: "Compras" },
    { cardId: cardNubank.id, desc: "iFood",                    total: 78.00,    mo: 4,  day: 14, catName: "Alimentação" },
    { cardId: cardNubank.id, desc: "Uber Eats",                total: 52.40,    mo: 4,  day: 19, catName: "Alimentação" },
    { cardId: cardNubank.id, desc: "Shopee — roupas",          total: 189.90,   mo: 3,  day: 8,  catName: "Compras" },
    { cardId: cardNubank.id, desc: "iFood",                    total: 89.00,    mo: 2,  day: 15, catName: "Alimentação" },
    { cardId: cardNubank.id, desc: "Renner",                   total: 179.90,   mo: 1,  day: 9,  catName: "Compras" },
    { cardId: cardNubank.id, desc: "iFood",                    total: 95.60,    mo: 1,  day: 15, catName: "Alimentação" },
    { cardId: cardNubank.id, desc: "Shopee — casa",            total: 127.80,   mo: 0,  day: 12, catName: "Compras" },
    // ── Itaú transactions ──
    { cardId: cardItau.id,   desc: "Posto BR",                 total: 195.00,   mo: 8,  day: 6,  catName: "Transporte" },
    { cardId: cardItau.id,   desc: "Decathlon — tênis",        total: 420.00,   mo: 8,  day: 14, catName: "Compras", parcelas: 6 },
    { cardId: cardItau.id,   desc: "Restaurante Outback",      total: 165.00,   mo: 8,  day: 19, catName: "Alimentação" },
    { cardId: cardItau.id,   desc: "Posto BR",                 total: 210.00,   mo: 6,  day: 5,  catName: "Transporte" },
    { cardId: cardItau.id,   desc: "C&A — roupas",             total: 198.90,   mo: 6,  day: 11, catName: "Compras" },
    { cardId: cardItau.id,   desc: "Rappi",                    total: 55.70,    mo: 6,  day: 17, catName: "Alimentação" },
    { cardId: cardItau.id,   desc: "Cinema Cinemark",          total: 74.00,    mo: 5,  day: 24, catName: "Lazer" },
    { cardId: cardItau.id,   desc: "Posto BR",                 total: 185.00,   mo: 4,  day: 5,  catName: "Transporte" },
    { cardId: cardItau.id,   desc: "Rappi",                    total: 48.90,    mo: 3,  day: 10, catName: "Alimentação" },
    { cardId: cardItau.id,   desc: "Posto BR",                 total: 195.00,   mo: 2,  day: 6,  catName: "Transporte" },
    { cardId: cardItau.id,   desc: "C&A",                      total: 189.90,   mo: 1,  day: 11, catName: "Compras" },
    { cardId: cardItau.id,   desc: "Rappi",                    total: 62.00,    mo: 0,  day: 10, catName: "Alimentação" },
  ];

  for (const tx of cardTxDefs) {
    const purchaseDate = d(tx.mo, tx.day);
    if (!isPast(purchaseDate)) continue;
    if (tx.parcelas) {
      const installmentAmount = Math.round((tx.total / tx.parcelas) * 100) / 100;
      const parent = await prisma.cardTransaction.create({ data: { creditCardId: tx.cardId, description: tx.desc, totalAmount: tx.total, installmentAmount, purchaseDate, categoryId: cat(tx.catName), isInstallment: true, totalInstallments: tx.parcelas, currentInstallment: 1 } });
      for (let i = 2; i <= tx.parcelas; i++) {
        await prisma.cardTransaction.create({ data: { creditCardId: tx.cardId, description: tx.desc, totalAmount: tx.total, installmentAmount, purchaseDate: addMonths(purchaseDate, i - 1), categoryId: cat(tx.catName), isInstallment: true, totalInstallments: tx.parcelas, currentInstallment: i, parentTransactionId: parent.id } });
      }
    } else {
      await prisma.cardTransaction.create({ data: { creditCardId: tx.cardId, description: tx.desc, totalAmount: tx.total, installmentAmount: null, purchaseDate, categoryId: cat(tx.catName), isInstallment: false } });
    }
  }

  // ── 11. Pay past invoices (Nubank: close=25, due=5 of next month) ─────────
  // Nubank invoices: transactions that close on 25th of month M go to due date 5th of month M+1
  // We pay invoices where due date < start of current month
  const today = new Date();
  const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  for (let mo = 11; mo >= 2; mo--) {
    // closing in month `mo` → due in month `mo-1` (months ago)
    const dueDate = d(mo - 1, 5);
    if (dueDate >= currentMonthStart) continue;
    const m = dueDate.getMonth() + 1;
    const y = dueDate.getFullYear();
    try {
      await prisma.invoicePayment.create({ data: { userId, creditCardId: cardNubank.id, month: m, year: y, amount: 350 + Math.round(Math.random() * 400), bankAccountId: nubank.id, paidAt: setDate(dueDate, 3) } });
    } catch { /* skip duplicate */ }
  }
  // Itaú: close=10, due=25 of same month
  for (let mo = 11; mo >= 2; mo--) {
    const dueDate = d(mo, 25);
    if (dueDate >= currentMonthStart) continue;
    const m = dueDate.getMonth() + 1;
    const y = dueDate.getFullYear();
    try {
      await prisma.invoicePayment.create({ data: { userId, creditCardId: cardItau.id, month: m, year: y, amount: 200 + Math.round(Math.random() * 300), bankAccountId: bradesco.id, paidAt: setDate(dueDate, 22) } });
    } catch { /* skip duplicate */ }
  }

  return new Response(JSON.stringify({
    ok: true,
    summary: "Dados de demonstração criados com sucesso! 12 meses de histórico gerados.",
  }), { status: 200 });
}
