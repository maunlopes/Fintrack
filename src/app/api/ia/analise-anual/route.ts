import { auth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { streamText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";

export const runtime = "nodejs";

const bodySchema = z.object({
  year: z.number(),
  months: z.array(
    z.object({
      monthNumber: z.number(),
      monthName: z.string(),
      year: z.number(),
      income: z.number(),
      expenses: z.number(),
      balance: z.number(),
      isHistorical: z.boolean(),
      isForecast: z.boolean(),
      invested: z.number().optional(),
      fixedExpenses: z.number().optional(),
      variableExpensesAvg: z.number().optional(),
      oneTimeExpensesAvg: z.number().optional(),
      cardInstallments: z.number().optional(),
      topExpenseCategory: z.string().optional(),
      topExpenseAmount: z.number().optional(),
      topIncomeCategory: z.string().optional(),
      topIncomeAmount: z.number().optional(),
      variationPercent: z.number().optional(),
    })
  ),
});

function formatBRL(v: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

function buildAnnualContext(year: number, months: z.infer<typeof bodySchema>["months"]): string {
  const historical = months.filter((m) => m.isHistorical);
  const forecast = months.filter((m) => m.isForecast);

  let ctx = `=== RESUMO ANUAL ${year} ===\n\n`;

  if (historical.length > 0) {
    ctx += "MESES REALIZADOS (dados reais):\n";
    for (const m of historical) {
      ctx += `  ${m.monthName}: receitas ${formatBRL(m.income)}, despesas ${formatBRL(m.expenses)}, saldo ${formatBRL(m.balance)}`;
      if (m.variationPercent != null) ctx += ` (${m.variationPercent > 0 ? "+" : ""}${m.variationPercent.toFixed(1)}% vs mês anterior)`;
      if (m.topExpenseCategory) ctx += ` | Maior gasto: ${m.topExpenseCategory} (${formatBRL(m.topExpenseAmount!)})`;
      if (m.invested && m.invested > 0) ctx += ` | Investido: ${formatBRL(m.invested)}`;
      ctx += "\n";
    }

    const totalIncome = historical.reduce((s, m) => s + m.income, 0);
    const totalExpenses = historical.reduce((s, m) => s + m.expenses, 0);
    ctx += `  TOTAL REALIZADO: receitas ${formatBRL(totalIncome)}, despesas ${formatBRL(totalExpenses)}, saldo ${formatBRL(totalIncome - totalExpenses)}\n`;
  }

  if (forecast.length > 0) {
    ctx += "\nMESES PROJETADOS (previsão baseada em recorrentes + parcelas):\n";
    for (const m of forecast) {
      ctx += `  ${m.monthName}: receitas prev. ${formatBRL(m.income)}, despesas prev. ${formatBRL(m.expenses)}, saldo prev. ${formatBRL(m.balance)}`;
      if (m.fixedExpenses) ctx += ` | Fixas: ${formatBRL(m.fixedExpenses)}`;
      if (m.cardInstallments) ctx += ` | Parcelas cartão: ${formatBRL(m.cardInstallments)}`;
      if (m.variableExpensesAvg) ctx += ` | Média variáveis: ${formatBRL(m.variableExpensesAvg)}`;
      if (m.oneTimeExpensesAvg) ctx += ` | Média avulsas: ${formatBRL(m.oneTimeExpensesAvg)}`;
      ctx += "\n";
    }
  }

  const allBalances = months.map((m) => m.balance);
  const negativeMonths = months.filter((m) => m.balance < 0);
  if (negativeMonths.length > 0) {
    ctx += `\nALERTA: ${negativeMonths.length} mês(es) com saldo negativo: ${negativeMonths.map((m) => m.monthName).join(", ")}\n`;
  }

  return ctx;
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: "Não autorizado" }), { status: 401 });
  }

  const userId = session.user.id;

  if (!rateLimit(`ia-analise-anual:${userId}`, 10, 3_600_000)) {
    return new Response(
      JSON.stringify({ error: "Limite de análises atingido. Tente novamente em uma hora." }),
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Body inválido" }), { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "Dados inválidos" }), { status: 400 });
  }

  const { year, months } = parsed.data;
  const annualContext = buildAnnualContext(year, months);

  const systemPrompt = `Você é um consultor financeiro pessoal integrado ao FinTrack.

TAREFA: Analise o resumo anual abaixo (dados reais + projeções) e forneça um diagnóstico completo.

ESTRUTURA DA RESPOSTA (use Markdown):

## Saúde Financeira
Avaliação geral do ano com nota de 1 a 10 e justificativa.

## Meses de Risco
Identifique meses com saldo negativo ou tendência preocupante. Se há meses projetados com déficit, alerte em qual mês isso ocorrerá.

## Padrões e Tendências
Analise a evolução dos gastos e receitas ao longo dos meses. Identifique se os gastos estão crescendo, estáveis ou diminuindo.

## Sugestões Práticas
3 a 5 ações concretas e específicas para melhorar a saúde financeira, baseadas nos dados reais.

REGRAS:
- Use SOMENTE os dados fornecidos. Não invente números.
- Formate valores como R$ X.XXX,XX.
- Diferencie claramente dados reais de projeções.
- Seja direto, prático e empático.
- Responda em português brasileiro.
- Máximo 500 palavras.`;

  const result = streamText({
    model: anthropic("claude-haiku-4-5-20251001"),
    system: systemPrompt,
    messages: [{ role: "user", content: annualContext }],
    maxOutputTokens: 1500,
    temperature: 0.3,
  });

  return result.toTextStreamResponse();
}
