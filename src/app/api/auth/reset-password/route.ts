import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
    }

    // Find the token
    const record = await prisma.verificationToken.findFirst({
      where: { token },
    });

    if (!record) {
      return NextResponse.json({ error: "Link inválido ou já utilizado." }, { status: 400 });
    }

    // Check expiration
    if (record.expires < new Date()) {
      await prisma.verificationToken.delete({
        where: { identifier_token: { identifier: record.identifier, token } },
      });
      return NextResponse.json({ error: "Link expirado. Solicite um novo." }, { status: 400 });
    }

    // Extract email from identifier (format: "reset:email@example.com")
    const email = record.identifier.replace("reset:", "");

    // Validate password
    const passwordRule = z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/).regex(/[^A-Za-z0-9]/);
    if (!passwordRule.safeParse(password).success) {
      return NextResponse.json({ error: "Senha não atende os critérios de segurança." }, { status: 400 });
    }

    // Update password
    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.update({
      where: { email },
      data: { passwordHash },
    });

    // Delete the used token
    await prisma.verificationToken.delete({
      where: { identifier_token: { identifier: record.identifier, token } },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[RESET_PASSWORD_ERROR]", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
