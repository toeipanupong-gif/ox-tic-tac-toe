import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import { authConfig } from "./auth.config";
import { DIFFICULTIES } from "@/lib/game/difficulty";

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
    },
  });
}

async function ensureDefaultStats(userId) {
  await Promise.all(
    DIFFICULTIES.map((difficulty) =>
      prisma.userStat.upsert({
        where: { userId_difficulty: { userId, difficulty } },
        create: { userId, difficulty },
        update: {},
      })
    )
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  callbacks: {
    ...authConfig.callbacks,
    async signIn() {
      return true;
    },
    async jwt({ token, user, trigger }) {
      if (user?.id) {
        let dbUser = null;
        try {
          dbUser = await syncAdminRole(user);
          await ensureDefaultStats(user.id);
        } catch {
          dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { id: true, role: true },
          });
        }
        token.id = dbUser?.id ?? user.id;
        token.role = dbUser?.role ?? "USER";
      }

      if (trigger === "update" && token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id },
          select: { role: true },
        });
        if (dbUser) {
          token.role = dbUser.role;
        }
      }

      return token;
    },
  },
  events: {
    async createUser({ user }) {
      try {
        await syncAdminRole(user);
        if (user?.id) await ensureDefaultStats(user.id);
      } catch (error) {
        console.error("[auth] createUser syncAdminRole failed", error);
      }
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
