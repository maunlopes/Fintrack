import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { loginSchema } from "./validations/auth";
import { authConfig } from "@/auth.config";
import { rateLimit } from "./rate-limit";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        // Fetch role from DB on sign-in
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id as string },
          select: { role: true },
        });
        token.role = dbUser?.role ?? "USER";
        // Update lastLoginAt and log activity (fire and forget)
        prisma.user.update({
          where: { id: user.id as string },
          data: { lastLoginAt: new Date() },
        }).catch(() => {});
        prisma.adminLog.create({
          data: { userId: user.id as string, action: "LOGIN" },
        }).catch(() => {});
      }
      return token;
    },
    async session({ session, token }) {
      if (token.id) session.user.id = token.id as string;
      if (token.role) session.user.role = token.role as string;
      // Fetch fresh name/image from DB so header reflects updates
      const fresh = await prisma.user.findUnique({
        where: { id: token.id as string },
        select: { name: true, image: true },
      });
      if (fresh) {
        session.user.name = fresh.name;
        session.user.image = fresh.image;
      }
      return session;
    },
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: false,
    }),
    Credentials({
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        // Rate limit: max 10 login attempts per email per minute
        if (!rateLimit(`login:${email}`, 10, 60_000)) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.passwordHash) return null;

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) return null;

        // Block login if email not verified
        if (!user.emailVerified) return null;

        return { id: user.id, name: user.name, email: user.email, image: user.image };
      },
    }),
  ],
});
