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
      const path = nextUrl.pathname;
      const isPublic =
        path.startsWith("/auth") ||
        path.startsWith("/api/auth") ||
        path.startsWith("/logos") ||
        path.startsWith("/docs") ||
        path.startsWith("/api/notifications/active") ||
        path.startsWith("/api/onboarding/steps") ||
        path.startsWith("/api/ajuda/screenshots") ||
        path.startsWith("/_next") ||
        path === "/favicon.ico";

      if (isLoggedIn && path.startsWith("/auth")) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }
      if (!isLoggedIn && !isPublic) {
        return false;
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.id) session.user.id = token.id as string;
      if (token.role) session.user.role = token.role as string;
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
