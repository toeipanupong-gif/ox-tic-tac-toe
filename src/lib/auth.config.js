import Google from "next-auth/providers/google";

/**
 * Edge-compatible Auth.js config (no Prisma).
 * Used by middleware.
 */
export const authConfig = {
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isLoggedIn = !!auth?.user;

      const protectedPaths = ["/dashboard", "/game", "/profile", "/admin"];
      const isProtected = protectedPaths.some(
        (path) => pathname === path || pathname.startsWith(`${path}/`)
      );

      if (isProtected && !isLoggedIn) return false;

      if (pathname.startsWith("/admin")) {
        return auth?.user?.role === "ADMIN";
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
      }
      if (user?.role) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role ?? "USER";
        session.user.score = token.score ?? 0;
        session.user.wins = token.wins ?? 0;
        session.user.losses = token.losses ?? 0;
        session.user.draws = token.draws ?? 0;
        session.user.winStreak = token.winStreak ?? 0;
      }
      return session;
    },
  },
  trustHost: true,
};
