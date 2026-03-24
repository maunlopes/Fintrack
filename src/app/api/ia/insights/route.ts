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

  if (!rateLimit(`ia-insights:${userId}`, 20, 3_600_000)) {
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

  const system = `Você é um assistente financeiro pessoal. Analise os dados financeiros fornecidos e gere insights objetivos.

IMPORTANTE: Responda SOMENTE com JSON válido. Sem texto antes ou depois. Sem markdown. Sem blocos de código.

Formato exato da resposta:
{"insights":[{"type":"warning|tip|success|info","title":"Título em até 6 palavras","text":"1-2 frases específicas com valores reais."}]}

Tipos de insight:
- warning: alerta urgente (orçamento estourado, déficit, despesas atrasadas)
- tip: sugestão acionável (reduzir gasto específico, oportunidade de poupança)
- success: conquista positiva (superávit, taxa de poupança boa, meta cumprida)
- info: dado relevante neutro (tendência mensal, comparação com mês anterior)

Regras obrigatórias:
- Gere EXATAMENTE 3 ou 4 insights
- Priorize warnings e tips quando há problemas
- Máximo 1 "success" e 1 "info" no total
- Cite valores, categorias e percentuais reais
- Responda em português brasileiro`;

  try {
    const { text } = await generateText({
      model: anthropic("claude-3-5-haiku-20241022"),
      system,
      messages: [{ role: "user", content: financialContext }],
      maxOutputTokens: 768,
      temperature: 0.3,
    });

    // Extract JSON — handles cases where model wraps with markdown or adds preamble
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("no json found");
    const parsed = JSON.parse(jsonMatch[0]) as { insights: { type: string; title: string; text: string }[] };

    if (!Array.isArray(parsed.insights) || parsed.insights.length === 0) throw new Error("invalid shape");

    return new Response(
      JSON.stringify({ insights: parsed.insights, generatedAt: new Date().toISOString() }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[insights] error:", err);
    return new Response(
      JSON.stringify({ insights: [], generatedAt: new Date().toISOString(), error: String(err) }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }
}
