import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { passwordSchema } from "@/lib/validations/user";
import bcrypt from "bcryptjs";

// PATCH /api/usuario/senha — change password
export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { passwordHash: true },
  });

  if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

  if (!user.passwordHash)
    return NextResponse.json({ error: "Usuários OAuth não podem alterar a senha" }, { status: 400 });

  const body = await req.json();
  const parsed = passwordSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { currentPassword, newPassword } = parsed.data;

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid)
    return NextResponse.json({ error: "Senha atual incorreta" }, { status: 400 });

  const hash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: session.user.id },
    data: { passwordHash: hash },
  });

  return NextResponse.json({ ok: true });
}
