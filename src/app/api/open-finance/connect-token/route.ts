import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { pluggy } from "@/lib/pluggy";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const itemId: string | undefined = body.itemId;

  const webhookUrl = process.env.PLUGGY_WEBHOOK_URL;

  try {
    const { accessToken } = await pluggy.createConnectToken(itemId, {
      clientUserId: session.user.id,
      ...(webhookUrl ? { webhookUrl } : {}),
    });

    return NextResponse.json({ accessToken });
  } catch (err: unknown) {
    console.error("[connect-token] Pluggy error:", err);
    return NextResponse.json({ error: "Erro ao gerar token de conexão" }, { status: 500 });
  }
}
