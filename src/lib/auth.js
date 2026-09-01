import NextAuth from "next-auth";
import { prisma } from "./prisma";
import { authConfig } from "./auth.config";
import { createPiiPrismaAdapter } from "./auth-adapter";
import { DIFFICULTIES } from "@/lib/game/difficulty";
import {
  computeEmailLookup,
  decryptPii,
  isPiiEncrypted,
  normalizeEmail,
  toStoredUserPii,
} from "@/lib/pii";

function plainEmailOf(value) {
  if (!value) return null;
  return isPiiEncrypted(value) ? decryptPii(value) : value;
}

/** หา user ใน DB จาก id หรือ email — ไม่ใช้ Google sub ที่ไม่มีในตาราง User */
async function resolveDbUser(user) {
  if (user?.id) {
    const byId = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, role: true, email: true },
    });
    if (byId) return byId;
  }

  const plainEmail = plainEmailOf(user?.email);
  if (!plainEmail) return null;

  const emailLookup = computeEmailLookup(plainEmail);
  if (!emailLookup) return null;

  return prisma.user.findUnique({
    where: { emailLookup },
    select: { id: true, role: true, email: true },
  });
}

async function syncAdminRole(user) {
  if (!user?.id) return null;

  const plainEmail = plainEmailOf(user.email);
  if (!plainEmail) return null;

  const adminEmail = process.env.ADMIN_EMAIL;
  const shouldBeAdmin = Boolean(
    adminEmail && normalizeEmail(plainEmail) === normalizeEmail(adminEmail)
  );
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

/** เข้ารหัส name/email เก่าที่ยังเป็น plaintext ใน DB */
async function ensureUserPiiEncrypted(userId) {
  if (!userId) return;
  const row = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, emailLookup: true },
  });
  if (!row) return;

  const needsName = row.name && !isPiiEncrypted(row.name);
  const needsEmail = row.email && !isPiiEncrypted(row.email);
  const needsLookup =
    row.email &&
    !row.emailLookup &&
    (isPiiEncrypted(row.email) ? decryptPii(row.email) : row.email);

  if (!needsName && !needsEmail && !needsLookup) return;

  const plainName = needsName ? row.name : undefined;
  const plainEmail = row.email
    ? isPiiEncrypted(row.email)
      ? decryptPii(row.email)
      : row.email
    : null;

  const patch = toStoredUserPii({
    ...(needsName ? { name: plainName } : {}),
    ...(needsEmail || needsLookup ? { email: plainEmail } : {}),
  });

  await prisma.user.update({
    where: { id: userId },
    data: patch,
  });
}

async function ensureDefaultStats(userId) {
  const exists = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });
  if (!exists) return;

  for (const difficulty of DIFFICULTIES) {
    await prisma.userStat.upsert({
      where: { userId_difficulty: { userId, difficulty } },
      create: { userId, difficulty },
      update: {},
    });
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: createPiiPrismaAdapter(prisma),
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user }) {
      try {
        const dbUser = await resolveDbUser(user);
        if (dbUser?.id) await ensureUserPiiEncrypted(dbUser.id);
      } catch (error) {
        console.error("[auth] ensureUserPiiEncrypted failed", error);
      }
      return true;
    },
    async jwt({ token, user, trigger }) {
      if (user) {
        const dbUser = await resolveDbUser(user);
        if (!dbUser?.id) {
          return { error: "UserNotFound" };
        }

        let role = dbUser.role ?? "USER";
        try {
          const synced = await syncAdminRole({
            id: dbUser.id,
            email: user.email ?? dbUser.email,
          });
          if (synced?.role) role = synced.role;
          await ensureDefaultStats(dbUser.id);
          await ensureUserPiiEncrypted(dbUser.id);
        } catch (error) {
          console.error("[auth] jwt user sync failed", error);
        }

        token.id = dbUser.id;
        token.role = role;
        delete token.error;
        if (user.name) token.name = user.name;
        if (user.email) token.email = user.email;
        return token;
      }

      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id },
          select: { id: true, role: true },
        });
        if (!dbUser) {
          return { error: "UserNotFound" };
        }
        if (trigger === "update") {
          token.role = dbUser.role;
        }
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
        if (token.name) {
          session.user.name = isPiiEncrypted(token.name)
            ? decryptPii(token.name)
            : token.name;
        }
        if (token.email) {
          session.user.email = isPiiEncrypted(token.email)
            ? decryptPii(token.email)
            : token.email;
        }
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      try {
        if (!user?.id) return;
        await syncAdminRole(user);
        await ensureDefaultStats(user.id);
        await ensureUserPiiEncrypted(user.id);
      } catch (error) {
        console.error("[auth] createUser syncAdminRole failed", error);
      }
    },
  },
});

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true },
  });
  if (!dbUser) return null;
  return session.user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (!user || user.role !== "ADMIN") return null;
  return user;
}

/** หา user จาก plaintext email ผ่าน emailLookup */
export async function findUserByPlainEmail(email) {
  const emailLookup = computeEmailLookup(email);
  if (!emailLookup) return null;
  return prisma.user.findUnique({ where: { emailLookup } });
}
