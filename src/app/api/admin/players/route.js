import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeDifficulty } from "@/lib/game/difficulty";
import { parsePageParams, paginatedResult } from "@/lib/pagination";
import { ADMIN_IN_MEMORY_SCAN_LIMIT } from "@/lib/admin-limits";
import {
  computeEmailLookup,
  computeNameLookup,
  normalizeEmail,
  revealUserPii,
} from "@/lib/pii";

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

const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
};

function orderByFor(sortKey, dir) {
  const direction = dir === "asc" ? "asc" : "desc";
  switch (sortKey) {
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
      return [
        { wins: direction },
        { losses: direction === "desc" ? "asc" : "desc" },
      ];
    case "player":
      return { user: { maskedName: direction } };
    case "email":
      return { score: direction };
    case "score":
    default:
      return { score: direction };
  }
}

function matchesSearch(user, q) {
  if (!q) return true;
  const needle = q.toLowerCase();
  const name = (user.name || "").toLowerCase();
  const email = (user.email || "").toLowerCase();
  return name.includes(needle) || email.includes(needle);
}

function comparePlayers(a, b, sortKey, dir) {
  const mul = dir === "asc" ? 1 : -1;
  switch (sortKey) {
    case "player":
      return mul * (a.name || "").localeCompare(b.name || "", "th");
    case "email":
      return mul * (a.email || "").localeCompare(b.email || "", "th");
    case "role":
      return mul * (a.role || "").localeCompare(b.role || "");
    case "wins":
      return mul * (a.wins - b.wins);
    case "losses":
      return mul * (a.losses - b.losses);
    case "draws":
      return mul * (a.draws - b.draws);
    case "winStreak":
      return mul * (a.winStreak - b.winStreak);
    case "winRate": {
      const rate = (p) => {
        const t = p.wins + p.losses + p.draws;
        return t === 0 ? 0 : p.wins / t;
      };
      return mul * (rate(a) - rate(b));
    }
    case "score":
    default:
      return mul * (a.score - b.score);
  }
}

function mapPlayerRow(s) {
  const user = revealUserPii(s.user);
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    score: s.score,
    wins: s.wins,
    losses: s.losses,
    draws: s.draws,
    winStreak: s.winStreak,
  };
}

function jsonPage(players, total, page, pageSize) {
  const result = paginatedResult({ items: players, total, page, pageSize });
  return NextResponse.json({
    players: result.items,
    total: result.total,
    page: result.page,
    pageSize: result.pageSize,
    totalPages: result.totalPages,
  });
}

async function queryDbPage({ where, sortKey, dir, skip, pageSize, page }) {
  const orderBy = orderByFor(sortKey, dir);
  const [total, rows] = await Promise.all([
    prisma.userStat.count({ where }),
    prisma.userStat.findMany({
      where,
      include: { user: { select: USER_SELECT } },
      orderBy: Array.isArray(orderBy) ? orderBy : [orderBy],
      skip,
      take: pageSize,
    }),
  ]);
  return jsonPage(rows.map(mapPlayerRow), total, page, pageSize);
}

export async function GET(request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const difficulty = normalizeDifficulty(searchParams.get("difficulty"));
  const search = (searchParams.get("search") || "").trim();
  const role = (searchParams.get("role") || "ALL").toUpperCase();
  const sortKey = SORT_FIELDS.has(searchParams.get("sort"))
    ? searchParams.get("sort")
    : "score";
  const dir = searchParams.get("dir") === "asc" ? "asc" : "desc";
  const { page, pageSize, skip } = parsePageParams(searchParams);

  const userWhere = {};
  if (role === "USER" || role === "ADMIN") {
    userWhere.role = role;
  }

  const emailLookup = search.includes("@")
    ? computeEmailLookup(normalizeEmail(search))
    : null;
  if (emailLookup) {
    userWhere.emailLookup = emailLookup;
  }

  const baseWhere = { difficulty, user: userWhere };

  // exact name lookup ก่อน — ถ้าเจอใช้ DB path (ไม่ scan)
  const nameLookup =
    search && !emailLookup ? computeNameLookup(search) : null;
  if (nameLookup && sortKey !== "email") {
    const exactWhere = {
      difficulty,
      user: { ...userWhere, nameLookup },
    };
    const exactCount = await prisma.userStat.count({ where: exactWhere });
    if (exactCount > 0) {
      return queryDbPage({
        where: exactWhere,
        sortKey,
        dir,
        skip,
        pageSize,
        page,
      });
    }
  }

  // substring หรือ sort ตาม email — scan จำกัด + decrypt
  const needsInMemory =
    Boolean(search && !emailLookup) || sortKey === "email";

  if (needsInMemory) {
    const rows = await prisma.userStat.findMany({
      where: baseWhere,
      include: { user: { select: USER_SELECT } },
      orderBy: [orderByFor("score", "desc")].flat(),
      take: ADMIN_IN_MEMORY_SCAN_LIMIT,
    });

    let players = rows.map(mapPlayerRow);
    if (search && !emailLookup) {
      players = players.filter((p) => matchesSearch(p, search));
    }
    players.sort((a, b) => comparePlayers(a, b, sortKey, dir));

    const total = players.length;
    return jsonPage(players.slice(skip, skip + pageSize), total, page, pageSize);
  }

  return queryDbPage({
    where: baseWhere,
    sortKey,
    dir,
    skip,
    pageSize,
    page,
  });
}
