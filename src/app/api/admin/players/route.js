import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeDifficulty } from "@/lib/game/difficulty";
import { parsePageParams, paginatedResult } from "@/lib/pagination";

const SORT_FIELDS = new Set([
  "player",
  "email",
  "role",
  "score",
  "wins",
  "losses",
  "draws",
  "winStreak",
  "winRate",
]);

function buildUserWhere(search, role) {
  const where = {};
  if (role === "USER" || role === "ADMIN") {
    where.role = role;
  }
  const q = (search || "").trim();
  if (q) {
    where.OR = [
      { name: { contains: q } },
      { email: { contains: q } },
    ];
  }
  return where;
}

function orderByFor(sortKey, dir) {
  const direction = dir === "asc" ? "asc" : "desc";
  switch (sortKey) {
    case "player":
      return { user: { name: direction } };
    case "email":
      return { user: { email: direction } };
    case "role":
      return { user: { role: direction } };
    case "wins":
      return { wins: direction };
    case "losses":
      return { losses: direction };
    case "draws":
      return { draws: direction };
    case "winStreak":
      return { winStreak: direction };
    case "winRate":
      // SQLite/Prisma: ใช้ wins/losses เป็น proxy ของ win rate
      return [
        { wins: direction },
        { losses: direction === "desc" ? "asc" : "desc" },
      ];
    case "score":
    default:
      return { score: direction };
  }
}

export async function GET(request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const difficulty = normalizeDifficulty(searchParams.get("difficulty"));
  const search = searchParams.get("search") || "";
  const role = (searchParams.get("role") || "ALL").toUpperCase();
  const sortKey = SORT_FIELDS.has(searchParams.get("sort"))
    ? searchParams.get("sort")
    : "score";
  const dir = searchParams.get("dir") === "asc" ? "asc" : "desc";
  const { page, pageSize, skip } = parsePageParams(searchParams);

  const userWhere = buildUserWhere(search, role);
  const where = {
    difficulty,
    user: userWhere,
  };

  const orderBy = orderByFor(sortKey, dir);

  const [total, rows] = await Promise.all([
    prisma.userStat.count({ where }),
    prisma.userStat.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
      orderBy: Array.isArray(orderBy) ? orderBy : [orderBy],
      skip,
      take: pageSize,
    }),
  ]);

  const players = rows.map((s) => ({
    id: s.user.id,
    name: s.user.name,
    email: s.user.email,
    role: s.user.role,
    score: s.score,
    wins: s.wins,
    losses: s.losses,
    draws: s.draws,
    winStreak: s.winStreak,
  }));

  const result = paginatedResult({ items: players, total, page, pageSize });

  return NextResponse.json({
    players: result.items,
    total: result.total,
    page: result.page,
    pageSize: result.pageSize,
    totalPages: result.totalPages,
  });
}
