import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/auth/verify-email?token=xxx
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  const appUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  if (!token) {
    return NextResponse.redirect(`${appUrl}/auth?error=missing-token`);
  }

  const record = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!record) {
    return NextResponse.redirect(`${appUrl}/auth?error=invalid-token`);
  }

  if (record.expires < new Date()) {
    await prisma.verificationToken.delete({ where: { token } });
    return NextResponse.redirect(`${appUrl}/auth?error=expired-token`);
  }

  // Mark email as verified and delete the token
  await prisma.$transaction([
    prisma.user.update({
      where: { email: record.identifier },
      data: { emailVerified: new Date() },
    }),
    prisma.verificationToken.delete({ where: { token } }),
  ]);

  return NextResponse.redirect(`${appUrl}/auth?verified=1`);
}
