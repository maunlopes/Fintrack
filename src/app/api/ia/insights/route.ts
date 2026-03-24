import { auth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { buildFinancialContext } from "@/lib/ai-context";
import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";

export const runtime = "nodejs";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: "Não autorizado" }), { status: 401 });
  }

  const userId = session.user.id;

  if (!rateLimit(`ia-insights:${userId}`, 5, 3_600_000)) {
    return new Response(
      JSON.stringify({ error: "Limite de geração atingido. Tente novamente em uma hora." }),
      { status: 429 }
    );
  }

  let financialContext: string;
  try {
    financialContext = await buildFinancialContext(userId);
  } catch {
    return new Response(JSON.stringify({ error: "Falha ao carregar dados financeiros." }), { status: 500 });
  }

  const systemPrompt = `Você é um assistente financeiro. Analise os dados do usuário e retorne insights objetivos.

Responda SOMENTE com JSON válido, sem texto adicional, sem markdown, sem blocos de código:
{"insights":[{"type":"warning|tip|success|info","title":"Título em até 6 palavras","text":"1-2 frases específicas com valores reais."}]}

Tipos:
- warning: alerta urgente (orçamento estourado, déficit, despesas atrasadas)
- tip: sugestão acionável (reduzir gasto específico, oportunidade de poupança)
- success: conquista positiva (superávit, taxa de poupança boa, meta cumprida)
- info: dado relevante neutro (tendência mensal, comparação com mês anterior)

Regras:
- Gere EXATAMENTE 3 ou 4 insights.
- Priorize warnings e tips quando há problemas.
- Máximo 1 "success" e 1 "info" no total.
- Cite valores, categorias e percentuais reais dos dados.
- Responda em português brasileiro.

${financialContext}`;

  try {
    const { text } = await generateText({
      model: anthropic("claude-3-5-haiku-20241022"),
      prompt: systemPrompt,
      maxTokens: 512,
      temperature: 0.4,
    });

    // Strip potential markdown code fences if model adds them
    const clean = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
    const parsed = JSON.parse(clean) as { insights: { type: string; title: string; text: string }[] };

    if (!Array.isArray(parsed.insights)) throw new Error("invalid shape");

    return new Response(
      JSON.stringify({ insights: parsed.insights, generatedAt: new Date().toISOString() }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch {
    return new Response(
      JSON.stringify({ insights: [], generatedAt: new Date().toISOString(), error: "parse_failed" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }
}
