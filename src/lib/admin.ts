import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return null;
  }
  return session;
}

export async function logAdminAction(
  userId: string,
  action: string,
  details?: string
) {
  await prisma.adminLog.create({
    data: { userId, action, details },
  });
}
