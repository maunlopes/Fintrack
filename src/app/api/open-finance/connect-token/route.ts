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
    const message = err instanceof Error ? err.message : String(err);
    console.error("[connect-token] Pluggy error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
