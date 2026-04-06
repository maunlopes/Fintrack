import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { expenseSchema } from "@/lib/validations/expense";
import { addMonths } from "date-fns";
import { getCardTransactionsAsExpenses } from "@/lib/invoice";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month");
  const year = searchParams.get("year");

  const where: Record<string, unknown> = { userId: session.user.id };
  if (month && year) {
    const start = new Date(parseInt(year), parseInt(month) - 1, 1);
    const end = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
    where.dueDate = { gte: start, lte: end };
  } else {
    where.parentExpenseId = null;
  }

  const expenses = await prisma.expense.findMany({
    where,
    include: { category: true, bankAccount: { select: { id: true, nickname: true } } },
    orderBy: { dueDate: "asc" },
  });

  let invoices: any[] = [];
  if (month && year) {
    invoices = await getCardTransactionsAsExpenses(session.user.id, parseInt(month), parseInt(year));
  } else {
    invoices = await getCardTransactionsAsExpenses(session.user.id);
  }

  // Map invoices to fit the "Expense" shape expected by the frontend
  const formattedInvoices = invoices.map(inv => ({
    ...inv,
    dueDate: inv.date, // frontend uses dueDate
  }));

  const allExpenses = [...expenses, ...formattedInvoices];
  
  allExpenses.sort((a, b) => {
    const dateA = new Date(a.dueDate).getTime();
    const dateB = new Date(b.dueDate).getTime();
    return dateA - dateB;
  });

  return NextResponse.json(allExpenses);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();
  const parsed = expenseSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { bankAccountId, totalInstallments, ...data } = parsed.data;

  const parent = await prisma.expense.create({
    data: {
      ...data,
      userId: session.user.id,
      bankAccountId: bankAccountId || null,
      totalInstallments: data.type === "INSTALLMENT" ? totalInstallments : null,
      currentInstallment: data.type === "INSTALLMENT" ? 1 : null,
    },
  });

  // Create future installments for INSTALLMENT type
  if (data.type === "INSTALLMENT" && totalInstallments && totalInstallments > 1) {
    const installmentData = [];
    for (let i = 2; i <= totalInstallments; i++) {
      installmentData.push({
        userId: session.user.id,
        description: `${data.description} (${i}/${totalInstallments})`,
        amount: data.amount,
        dueDate: addMonths(data.dueDate, i - 1),
        categoryId: data.categoryId,
        type: data.type,
        status: data.status,
        totalInstallments,
        currentInstallment: i,
        bankAccountId: bankAccountId || null,
        parentExpenseId: parent.id,
      });
    }
    await prisma.expense.createMany({ data: installmentData });
  }

  // Create future monthly records for FIXED_RECURRING / VARIABLE_RECURRING
  if ((data.type === "FIXED_RECURRING" || data.type === "VARIABLE_RECURRING") && data.recurrenceEnd) {
    const startDate = data.dueDate;
    const endDate = new Date(data.recurrenceEnd);
    const childData = [];
    let current = addMonths(startDate, 1);
    let index = 2;

    while (current <= endDate) {
      childData.push({
        userId: session.user.id,
        description: data.description,
        amount: data.amount,
        dueDate: current,
        categoryId: data.categoryId,
        type: data.type,
        isRecurring: true,
        recurrenceStart: data.recurrenceStart,
        recurrenceEnd: data.recurrenceEnd,
        status: "PENDING" as const,
        bankAccountId: bankAccountId || null,
        parentExpenseId: parent.id,
        notes: data.notes,
      });
      current = addMonths(startDate, index);
      index++;
    }

    if (childData.length > 0) {
      await prisma.expense.createMany({ data: childData });
    }
  }

  return NextResponse.json(parent, { status: 201 });
}
