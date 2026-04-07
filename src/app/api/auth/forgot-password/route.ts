import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "E-mail obrigatório" }, { status: 400 });
    }

    // Rate limit: 3 per email per 15 minutes
    if (!rateLimit(`forgot:${email}`, 3, 15 * 60_000)) {
      return NextResponse.json({ ok: true }); // Don't reveal rate limit
    }

    const user = await prisma.user.findUnique({ where: { email } });

    // Always return success to not reveal if email exists
    if (!user || !user.passwordHash) {
      return NextResponse.json({ ok: true });
    }

    // Delete any existing reset tokens for this email
    await prisma.verificationToken.deleteMany({
      where: { identifier: `reset:${email}` },
    });

    // Create reset token (expires in 1 hour)
    const token = crypto.randomBytes(32).toString("hex");
    await prisma.verificationToken.create({
      data: {
        identifier: `reset:${email}`,
        token,
        expires: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    sendPasswordResetEmail(email, token).catch((err) =>
      console.error("[RESET_EMAIL_ERROR]", err)
    );

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true }); // Don't reveal errors
  }
}
