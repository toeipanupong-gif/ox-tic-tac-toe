import { cache } from "react";
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

  let currentRole = user.role;
  if (currentRole == null) {
    const row = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });
    if (!row) return null;
    currentRole = row.role;
  }

  // อัปเดตเฉพาะเมื่อ role เปลี่ยน — ลด write ทุก login
  if (currentRole === role) {
    return { id: user.id, role };
  }

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
    select: {
      id: true,
      name: true,
      email: true,
      emailLookup: true,
      maskedName: true,
      nameLookup: true,
    },
  });
  if (!row) return;

  const needsName = row.name && !isPiiEncrypted(row.name);
  const needsEmail = row.email && !isPiiEncrypted(row.email);
  const needsEmailLookup =
    row.email &&
    !row.emailLookup &&
    (isPiiEncrypted(row.email) ? decryptPii(row.email) : row.email);
  const needsMasked =
    row.name &&
    (!row.maskedName || !row.nameLookup) &&
    (isPiiEncrypted(row.name) ? decryptPii(row.name) : row.name);

  if (!needsName && !needsEmail && !needsEmailLookup && !needsMasked) return;

  const plainName =
    needsName || needsMasked
      ? needsName
        ? row.name
        : isPiiEncrypted(row.name)
          ? decryptPii(row.name)
          : row.name
      : undefined;
  const plainEmail = row.email
    ? isPiiEncrypted(row.email)
      ? decryptPii(row.email)
      : row.email
    : null;

  const patch = toStoredUserPii({
    ...(needsName || needsMasked ? { name: plainName } : {}),
    ...(needsEmail || needsEmailLookup ? { email: plainEmail } : {}),
  });

  // name เข้ารหัสแล้ว — เขียนแค่ maskedName/nameLookup ไม่หมุน ciphertext ใหม่
  if (!needsName && needsMasked) {
    delete patch.name;
  }

  await prisma.user.update({
    where: { id: userId },
    data: patch,
  });
}

async function ensureDefaultStats(userId) {
  const existing = await prisma.userStat.findMany({
    where: { userId },
    select: { difficulty: true },
  });
  const have = new Set(existing.map((s) => s.difficulty));

  // สร้างเฉพาะ difficulty ที่ขาด — เลิก upsert ทั้ง 3 ทุก login
  for (const difficulty of DIFFICULTIES) {
    if (have.has(difficulty)) continue;
    await prisma.userStat.upsert({
      where: { userId_difficulty: { userId, difficulty } },
      create: { userId, difficulty },
      update: {},
    });
  }
}

const {
  handlers,
  auth: uncachedAuth,
  signIn,
  signOut,
} = NextAuth({
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
    async jwt({ token, user }) {
      if (user) {
        const dbUser = await resolveDbUser(user);
        if (!dbUser?.id) {
          return { error: "UserNotFound" };
        }

        try {
          await syncAdminRole({
            id: dbUser.id,
            email: user.email ?? dbUser.email,
            role: dbUser.role,
          });
          await ensureDefaultStats(dbUser.id);
          await ensureUserPiiEncrypted(dbUser.id);
        } catch (error) {
          console.error("[auth] jwt user sync failed", error);
        }

        return { id: dbUser.id };
      }

      // refresh: ไม่ยิง DB — session callback โหลด/ตรวจ user + decrypt รอบเดียว
      if (token?.id) {
        return { id: token.id };
      }

      return token;
    },
    async session({ session, token }) {
      if (token?.error === "UserNotFound" || !token?.id) {
        return null;
      }

      // โหมดเบา: โหลดแค่ id/role — ไม่ decrypt name/email ทุก request (เกม hot path)
      const dbUser = await prisma.user.findUnique({
        where: { id: token.id },
        select: { id: true, role: true },
      });
      if (!dbUser) return null;

      session.user.id = dbUser.id;
      session.user.role = dbUser.role ?? "USER";
      delete session.user.name;
      delete session.user.email;

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

export { handlers, signIn, signOut };

/** request-scope dedupe — ห้าม cache ข้าม request / ห้ามใส่ role ใน JWT */
export const auth = cache(uncachedAuth);

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  // session callback โหลด user จาก DB แล้ว — ไม่ต้อง findUnique ซ้ำ
  return session.user;
}

export async function requireAdmin() {
  const user = await requireUser();
  // role มาจาก DB ใน session callback (ไม่ใช่ JWT)
  if (!user || user.role !== "ADMIN") return null;
  return { ...user, role: "ADMIN" };
}

/** โหลด/decrypt name+email เฉพาะหน้าที่ต้องโชว์ (dashboard/profile) */
export async function loadUserDisplayPii(userId) {
  if (!userId) return { name: null, email: null };
  const row = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  });
  if (!row) return { name: null, email: null };
  return {
    name: row.name
      ? isPiiEncrypted(row.name)
        ? decryptPii(row.name)
        : row.name
      : null,
    email: row.email
      ? isPiiEncrypted(row.email)
        ? decryptPii(row.email)
        : row.email
      : null,
  };
}

/** หา user จาก plaintext email ผ่าน emailLookup */
export async function findUserByPlainEmail(email) {
  const emailLookup = computeEmailLookup(email);
  if (!emailLookup) return null;
  return prisma.user.findUnique({ where: { emailLookup } });
}
