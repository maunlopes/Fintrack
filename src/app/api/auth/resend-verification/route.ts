import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "E-mail obrigatório" }, { status: 400 });
    }

    // Rate limit: 2 per email per 5 minutes
    if (!rateLimit(`resend:${email}`, 2, 5 * 60_000)) {
      return NextResponse.json(
        { error: "Aguarde alguns minutos antes de solicitar novamente." },
        { status: 429 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json({ ok: true }); // Don't reveal
    }

    if (user.emailVerified) {
      return NextResponse.json({ error: "E-mail já verificado." }, { status: 400 });
    }

    // Delete old tokens
    await prisma.verificationToken.deleteMany({
      where: { identifier: email },
    });

    // Create new token (24h)
    const token = crypto.randomBytes(32).toString("hex");
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    sendVerificationEmail(email, token).catch((err) =>
      console.error("[RESEND_EMAIL_ERROR]", err)
    );

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
