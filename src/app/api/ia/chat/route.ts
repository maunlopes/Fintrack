import { auth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { buildFinancialContext } from "@/lib/ai-context";
import { streamText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";

export const runtime = "nodejs";

const bodySchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string().max(4000),
    })
  ).min(1).max(50),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: "Não autorizado" }), { status: 401 });
  }

  const userId = session.user.id;

  if (!rateLimit(`ia:${userId}`, 20, 60_000)) {
    return new Response(JSON.stringify({ error: "Muitas requisições. Aguarde um momento." }), { status: 429 });
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

  const { messages } = parsed.data;

  let financialContext: string;
  try {
    financialContext = await buildFinancialContext(userId);
  } catch (err) {
    console.error("[FinBot] Failed to build context:", err);
    financialContext = "(Não foi possível carregar os dados financeiros no momento.)";
  }

  const systemPrompt = `Você é o FinBot, assistente financeiro pessoal integrado ao FinTrack.

REGRAS:
- Responda SEMPRE em português brasileiro.
- Use os dados do snapshot abaixo como base factual. Não invente números.
- Para perguntas de compra (ex: "posso comprar X?"): analise saldo disponível, resultado mensal médio, despesas pendentes e dê uma recomendação clara.
- Para "quantos meses para juntar R$ X?": calcule meses = X / resultado_médio_mensal. Se resultado negativo, alerte o usuário.
- Para saúde financeira: comente taxa de poupança, alertas de orçamento e tendência dos últimos meses.
- Formate valores monetários como R$ X.XXX,XX.
- Use Markdown para estruturar respostas longas (negrito, listas).
- Seja direto, amigável e prático. Máximo 300 palavras por resposta, salvo análises detalhadas pedidas.
- Não dê conselhos de investimento específicos (não recomende ativos, corretoras, etc.).

${financialContext}`;

  const result = streamText({
    model: anthropic("claude-3-5-haiku-20241022"),
    system: systemPrompt,
    messages,
    maxOutputTokens: 1024,
    temperature: 0.3,
  });

  return result.toTextStreamResponse();
}
