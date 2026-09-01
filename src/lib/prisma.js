import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

const baseClient =
  globalForPrisma.prismaBase ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prismaBase = baseClient;
}

/** WAL + busy_timeout ครั้งเดียวต่อ process — ใช้ baseClient เพื่อไม่วน $extends */
let sqlitePragmas = globalForPrisma.__sqlitePragmas;
if (!sqlitePragmas) {
  sqlitePragmas = (async () => {
    try {
      await baseClient.$queryRawUnsafe("PRAGMA journal_mode=WAL");
      await baseClient.$queryRawUnsafe("PRAGMA busy_timeout=5000");
    } catch (err) {
      console.error("[prisma] SQLite pragma init failed", err);
    }
  })();
  globalForPrisma.__sqlitePragmas = sqlitePragmas;
}

export const prisma = baseClient.$extends({
  query: {
    async $allOperations({ args, query }) {
      await sqlitePragmas;
      return query(args);
    },
  },
});
