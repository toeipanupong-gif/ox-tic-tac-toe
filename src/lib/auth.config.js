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
      // ไม่รับรูปโปรไฟล์จาก Google (ไม่เก็บใน DB / URL หมดอายุได้)
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
      if (token?.error === "UserNotFound" || !token?.id) {
        return null;
      }
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role ?? "USER";
      }
      return session;
    },
  },
  trustHost: true,
};
