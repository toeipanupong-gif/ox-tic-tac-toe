import Google from "next-auth/providers/google";

/**
 * Edge-compatible Auth.js config (no Prisma).
 * Used by middleware — JWT เก็บแค่ id; ไม่เช็ค role ที่ edge
 */
export const authConfig = {
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          emailVerified: profile.email_verified ? new Date() : null,
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isLoggedIn = Boolean(auth?.user?.id);

      const protectedPaths = ["/dashboard", "/game", "/profile", "/admin"];
      const isProtected = protectedPaths.some(
        (path) => pathname === path || pathname.startsWith(`${path}/`)
      );

      if (isProtected && !isLoggedIn) return false;

      // role ตรวจที่ server (requireAdmin) — edge ไม่มี DB
      return true;
    },
    async jwt({ token, user }) {
      if (user?.id) {
        return { id: user.id };
      }
      if (token?.id) {
        return { id: token.id };
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.error === "UserNotFound" || !token?.id) {
        return null;
      }
      if (session.user) {
        session.user.id = token.id;
      }
      return session;
    },
  },
  trustHost: true,
};
