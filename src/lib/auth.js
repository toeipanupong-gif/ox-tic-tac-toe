import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import { authConfig } from "./auth.config";

async function syncAdminRole(user) {
  if (!user?.id || !user?.email) return null;
  const adminEmail = process.env.ADMIN_EMAIL;
  const shouldBeAdmin = Boolean(adminEmail && user.email === adminEmail);
  const role = shouldBeAdmin ? "ADMIN" : "USER";

  return prisma.user.update({
    where: { id: user.id },
    data: { role },
    select: {
      id: true,
      role: true,
      score: true,
      wins: true,
      losses: true,
      draws: true,
      winStreak: true,
    },
  });
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user }) {
      await syncAdminRole(user);
      return true;
    },
    async jwt({ token, user, trigger }) {
      if (user?.id) {
        const dbUser = await syncAdminRole(user);
        token.id = dbUser?.id ?? user.id;
        token.role = dbUser?.role ?? "USER";
        token.score = dbUser?.score ?? 0;
        token.wins = dbUser?.wins ?? 0;
        token.losses = dbUser?.losses ?? 0;
        token.draws = dbUser?.draws ?? 0;
        token.winStreak = dbUser?.winStreak ?? 0;
      }

      if (trigger === "update" && token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id },
          select: {
            role: true,
            score: true,
            wins: true,
            losses: true,
            draws: true,
            winStreak: true,
          },
        });
        if (dbUser) {
          token.role = dbUser.role;
          token.score = dbUser.score;
          token.wins = dbUser.wins;
          token.losses = dbUser.losses;
          token.draws = dbUser.draws;
          token.winStreak = dbUser.winStreak;
        }
      }

      return token;
    },
  },
  events: {
    async createUser({ user }) {
      await syncAdminRole(user);
    },
  },
});

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session.user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (!user || user.role !== "ADMIN") return null;
  return user;
}
