import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/auth",
    error: "/auth",
  },
  session: { strategy: "jwt" as const, maxAge: 7 * 24 * 60 * 60 },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isPublic = nextUrl.pathname.startsWith("/auth");

      if (isLoggedIn && isPublic) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }
      if (!isLoggedIn && !isPublic) {
        return false;
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (token.id) session.user.id = token.id as string;
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
