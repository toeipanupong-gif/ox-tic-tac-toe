import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeDifficulty } from "@/lib/game/difficulty";
import { parsePageParams, paginatedResult } from "@/lib/pagination";
import { revealUserPii } from "@/lib/pii";

const SORT_FIELDS = new Set([
  "player",
  "result",
  "scoreChange",
  "bonusScore",
  "winStreak",
  "when",
]);

const RESULT_VALUES = new Set(["WIN", "LOSS", "DRAW"]);

function dayStart(isoDate) {
  if (!isoDate) return null;
  const d = new Date(`${isoDate}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function dayEnd(isoDate) {
  if (!isoDate) return null;
  const d = new Date(`${isoDate}T23:59:59.999`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function orderByFor(sortKey, dir) {
  const direction = dir === "asc" ? "asc" : "desc";
  switch (sortKey) {
    case "player":
      // name เป็น PII — เรียงใน memory
      return { createdAt: direction };
    case "result":
      return { result: direction };
    case "scoreChange":
      return { scoreChange: direction };
    case "bonusScore":
      return { bonusScore: direction };
    case "winStreak":
      return { winStreak: direction };
    case "when":
    default:
      return { createdAt: direction };
  }
}

function matchesPlayerSearch(user, q) {
  if (!q) return true;
  const needle = q.toLowerCase();
  const name = (user?.name || "").toLowerCase();
  const email = (user?.email || "").toLowerCase();
  return name.includes(needle) || email.includes(needle);
}

export async function GET(request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const difficulty = normalizeDifficulty(searchParams.get("difficulty"));
  const search = (searchParams.get("search") || "").trim();
  const resultFilter = (searchParams.get("result") || "ALL").toUpperCase();
  const from = dayStart(searchParams.get("from") || "");
  const to = dayEnd(searchParams.get("to") || "");
  const sortKey = SORT_FIELDS.has(searchParams.get("sort"))
    ? searchParams.get("sort")
    : "when";
  const dir = searchParams.get("dir") === "asc" ? "asc" : "desc";
  const { page, pageSize, skip } = parsePageParams(searchParams);

  const where = { difficulty };

  if (RESULT_VALUES.has(resultFilter)) {
    where.result = resultFilter;
  }

  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = from;
    if (to) where.createdAt.lte = to;
  }

  const needsInMemory = Boolean(search) || sortKey === "player";

  if (needsInMemory) {
    const games = await prisma.game.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
      },
      orderBy: orderByFor("when", "desc"),
    });

    let items = games.map((g) => ({
      id: g.id,
      result: g.result,
      scoreChange: g.scoreChange,
      bonusScore: g.bonusScore,
      winStreak: g.winStreak,
      createdAt: g.createdAt.toISOString(),
      user: revealUserPii(g.user),
    }));

    if (search) {
      items = items.filter((g) => matchesPlayerSearch(g.user, search));
    }

    if (sortKey === "player") {
      const mul = dir === "asc" ? 1 : -1;
      items.sort(
        (a, b) =>
          mul *
          (a.user?.name || "").localeCompare(b.user?.name || "", "th")
      );
    } else {
      const mul = dir === "asc" ? 1 : -1;
      const key =
        sortKey === "when"
          ? "createdAt"
          : sortKey === "scoreChange"
            ? "scoreChange"
            : sortKey === "bonusScore"
              ? "bonusScore"
              : sortKey === "winStreak"
                ? "winStreak"
                : sortKey === "result"
                  ? "result"
                  : "createdAt";
      items.sort((a, b) => {
        if (key === "createdAt" || key === "result") {
          return mul * String(a[key]).localeCompare(String(b[key]));
        }
        return mul * (a[key] - b[key]);
      });
    }

    const total = items.length;
    const pageItems = items.slice(skip, skip + pageSize);
    const result = paginatedResult({ items: pageItems, total, page, pageSize });

    return NextResponse.json({
      games: result.items,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      totalPages: result.totalPages,
    });
  }

  const orderBy = orderByFor(sortKey, dir);

  const [total, games] = await Promise.all([
    prisma.game.count({ where }),
    prisma.game.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
      },
      orderBy,
      skip,
      take: pageSize,
    }),
  ]);

  const items = games.map((g) => ({
    id: g.id,
    result: g.result,
    scoreChange: g.scoreChange,
    bonusScore: g.bonusScore,
    winStreak: g.winStreak,
    createdAt: g.createdAt.toISOString(),
    user: revealUserPii(g.user),
  }));

  const result = paginatedResult({ items, total, page, pageSize });

  return NextResponse.json({
    games: result.items,
    total: result.total,
    page: result.page,
    pageSize: result.pageSize,
    totalPages: result.totalPages,
  });
}
