import { PrismaAdapter } from "@auth/prisma-adapter";
import {
  computeEmailLookup,
  revealUserPii,
  toStoredUserPii,
} from "@/lib/pii";

const OAUTH_TOKEN_FIELDS = [
  "refresh_token",
  "access_token",
  "expires_at",
  "token_type",
  "scope",
  "id_token",
  "session_state",
];

function stripOAuthTokens(account) {
  const safe = { ...account };
  for (const field of OAUTH_TOKEN_FIELDS) {
    delete safe[field];
  }
  return safe;
}

/**
 * Prisma adapter ที่เก็บ name/email เป็น PII และ lookup ด้วย emailLookup
 * ไม่เก็บ OAuth token — ใช้ JWT session อย่างเดียว
 */
export function createPiiPrismaAdapter(prisma) {
  const base = PrismaAdapter(prisma);

  return {
    ...base,

    async linkAccount(account) {
      return base.linkAccount(stripOAuthTokens(account));
    },

    async createUser(user) {
      const data = toStoredUserPii({
        name: user.name ?? null,
        email: user.email ?? null,
        emailVerified: user.emailVerified ?? null,
      });
      const created = await prisma.user.create({ data });
      return revealUserPii(created);
    },

    async getUser(id) {
      const user = await prisma.user.findUnique({ where: { id } });
      return user ? revealUserPii(user) : null;
    },

    async getUserByEmail(email) {
      if (!email) return null;
      const emailLookup = computeEmailLookup(email);
      if (!emailLookup) return null;
      const user = await prisma.user.findUnique({ where: { emailLookup } });
      return user ? revealUserPii(user) : null;
    },

    async getUserByAccount({ provider, providerAccountId }) {
      const account = await prisma.account.findUnique({
        where: {
          provider_providerAccountId: { provider, providerAccountId },
        },
        include: { user: true },
      });
      return account?.user ? revealUserPii(account.user) : null;
    },

    async updateUser({ id, ...data }) {
      const patch = { ...data };
      if ("name" in patch || "email" in patch) {
        Object.assign(patch, toStoredUserPii(patch));
      }
      const updated = await prisma.user.update({
        where: { id },
        data: patch,
      });
      return revealUserPii(updated);
    },
  };
}
