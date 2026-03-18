import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { profileSchema } from "@/lib/validations/user";

// GET /api/usuario — returns current user info + hasPassword flag
export async function GET() {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, image: true, passwordHash: true },
  });

  if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

  return NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    hasPassword: !!user.passwordHash,
  });
}

// PATCH /api/usuario — update profile
export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { name, email, image } = parsed.data;

  // Check if it's an OAuth user (no password) — block email change
  const current = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, passwordHash: true },
  });

  if (!current) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

  if (!current.passwordHash && email !== current.email)
    return NextResponse.json({ error: "Usuários OAuth não podem alterar o e-mail" }, { status: 400 });

  // Check if email is already taken by another user
  if (email !== current.email) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing)
      return NextResponse.json({ error: "E-mail já está em uso" }, { status: 409 });
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name,
      email,
      image: image || null,
    },
    select: { id: true, name: true, email: true, image: true },
  });

  return NextResponse.json(updated);
}
