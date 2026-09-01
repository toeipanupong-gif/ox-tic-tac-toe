import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeDifficulty, difficultyLabel } from "@/lib/game/difficulty";
import { excelDownloadResponse } from "@/lib/excel";
import { ADMIN_EXPORT_ROW_LIMIT } from "@/lib/admin-limits";
import {
  computeEmailLookup,
  computeNameLookup,
  maskEmail,
  maskName,
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

function winRateLabel(wins, losses, draws) {
  const total = wins + losses + draws;
  if (total === 0) return "0.0%";
  return `${((wins / total) * 100).toFixed(1)}%`;
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

async function loadAllPlayers({ difficulty, search, role, sortKey, dir }) {
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

  const nameLookup =
    search && !emailLookup ? computeNameLookup(search) : null;

  // exact name ก่อน
  if (nameLookup && sortKey !== "email") {
    const exactWhere = {
      difficulty,
      user: { ...userWhere, nameLookup },
    };
    const exactCount = await prisma.userStat.count({ where: exactWhere });
    if (exactCount > 0) {
      const orderBy = orderByFor(sortKey, dir);
      const rows = await prisma.userStat.findMany({
        where: exactWhere,
        include: { user: { select: USER_SELECT } },
        orderBy: Array.isArray(orderBy) ? orderBy : [orderBy],
        take: ADMIN_EXPORT_ROW_LIMIT,
      });
      return rows.map(mapPlayerRow);
    }
  }

  const where = { difficulty, user: userWhere };
  const needsInMemory =
    Boolean(search && !emailLookup) || sortKey === "email";

  const orderBy = needsInMemory
    ? orderByFor("score", "desc")
    : orderByFor(sortKey, dir);

  const rows = await prisma.userStat.findMany({
    where,
    include: { user: { select: USER_SELECT } },
    orderBy: Array.isArray(orderBy) ? orderBy : [orderBy],
    take: ADMIN_EXPORT_ROW_LIMIT,
  });

  let players = rows.map(mapPlayerRow);

  if (search && !emailLookup) {
    players = players.filter((p) => matchesSearch(p, search));
  }

  if (needsInMemory) {
    players.sort((a, b) => comparePlayers(a, b, sortKey, dir));
  }

  return players;
}

export async function GET(request) {
  const admin = await requireAdmin();
  if (!admin) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const difficulty = normalizeDifficulty(searchParams.get("difficulty"));
  const search = (searchParams.get("search") || "").trim();
  const role = (searchParams.get("role") || "ALL").toUpperCase();
  const sortKey = SORT_FIELDS.has(searchParams.get("sort"))
    ? searchParams.get("sort")
    : "score";
  const dir = searchParams.get("dir") === "asc" ? "asc" : "desc";

  const players = await loadAllPlayers({
    difficulty,
    search,
    role,
    sortKey,
    dir,
  });

  const headers = [
    "Player",
    "Email",
    "Role",
    "Score",
    "W",
    "L",
    "D",
    "Streak",
    "Win Rate",
  ];

  const rows = players.map((p) => [
    maskName(p.name || ""),
    maskEmail(p.email || ""),
    p.role,
    p.score,
    p.wins,
    p.losses,
    p.draws,
    p.winStreak,
    winRateLabel(p.wins, p.losses, p.draws),
  ]);

  const stamp = new Date().toISOString().slice(0, 10);
  const level = difficultyLabel(difficulty).toLowerCase();
  return excelDownloadResponse(
    `players-${level}-${stamp}.xlsx`,
    "Players",
    headers,
    rows
  );
}
